import { formatUnits, JsonRpcProvider, parseEther, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { PAIRS, TAKER_CAPACITY } from "./config";
import { TradeApi } from "./contract";
import { ultraLiquid } from "./contract/network";
import { getPairContract, getPrice, getTargetPrice } from "./utils";

/**
 * Generates a random price increase for taker orders
 * Returns a value between 0.01 and 0.02
 * @returns {number} Price increase percentage
 */
function getPriceTakerInscrease(): number {
  return Math.max(Math.random() * 0.0001, 0.00005);
}

/**
 * Generates a random price increase for maker orders
 * Returns a value between 0.02 and 0.04
 * @returns {number} Price increase percentage
 */
function getPriceMakerInscrease(): number {
  return Math.max(Math.random() * 0.0001, 0.0005);
}

/**
 * Main function to execute trading strategy for a specific trading pair
 * @param {object} pair - Trading pair information
 * @param {"maker" | "taker"} role - Trading role (maker creates liquidity, taker takes liquidity)
 * @returns {Promise<void>}
 */
async function main(pair: { price: string; symbol: string; trade?: string; taker?: string; maker?: string; pairId?: string; increase?: boolean }, role: "maker" | "taker"): Promise<void> {
  // Get network configuration
  const currentNetwork = ultraLiquid;

  // Find token information from pair symbol
  const tokenA = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.symbol.split("/")[0])!;
  const tokenB = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.symbol.split("/")[1])!;

  // Get trading contract address if not already set
  if (!pair.trade) {
    const pairInfo = await getPairContract(pair.symbol);
    pair.trade = pairInfo.address;
    pair.pairId = pairInfo.pairId;
    console.log(`[${pair.symbol}${new Date().toISOString()}] Set contract ${pair.trade} pairId ${pair.pairId}`);
  }

  // Initialize trading API with contract and token information
  const trade = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: pair.trade,
    pairId: pair.pairId,
    tokenA,
    tokenB,
  });

  // Setup provider with timeout
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  // Set RPC timeout to 10 seconds to prevent hanging requests
  provider._getConnection().timeout = 10000;

  // Get current market prices and order book information
  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair.symbol);

  // Get target price for this trading pair
  const target = await getTargetPrice(pair.price, pair.increase);
  if (Number.isNaN(target)) {
    return; // Exit if target price is invalid
  }

  // Log current market conditions for debugging
  console.debug(`[${pair.symbol}${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${buyPrice} BuyAmount: ${buyAmount} SellPrice: ${sellPrice} SellAmount: ${sellAmount}`);

  // === MAKER STRATEGY ===
  // Makers create liquidity by placing orders on both sides of the order book
  if (role === "maker") {
    // Check if maker wallet is configured
    if (!pair.maker) {
      console.log(`[${pair.symbol}${new Date().toISOString()}] No maker wallet found`);
    }

    // Initialize maker wallet
    const makerWallet = new Wallet(pair.maker!);
    console.log(`[${pair.symbol}${new Date().toISOString()}] Maker address: ${makerWallet.address}`);
    const maker = makerWallet.connect(provider);

    // Generate random order amount between 0.8 and 1.2
    const amount = 0.4 * Math.random() + 0.8;

    // Approve token spending for trading
    await trade.approveToken(maker);

    // If no buy orders exist in the order book, create one at target price
    if (!buyPrice) {
      const pay = trade.calcUsdt(target.toString(), amount.toString());
      await trade.createBuyOrder(maker, {
        amount: BigInt(parseUnits("10", tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${target} 10 ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.symbol}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
      return;
    }

    // If current price is very close to target, no action needed
    if (Math.abs(Number(buyPrice) - target) < 0.00005) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] No action required`);
      return;
    }

    // Calculate next sell price with increase
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());

    // If buy price is below target, create buy order
    if (Number(buyPrice) < Number(target)) {
      // Calculate a new buy price slightly below current buy price
      const nextBuyPrice = Math.abs(Number(buyPrice) - getPriceMakerInscrease());
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());

      // Create buy order
      await trade.createBuyOrder(maker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.symbol}`);
    }
    else {
      // If buy price is above target, create sell order
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());

      // Create sell order
      await trade.createSellOrder(maker, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
    }

    // If no sell orders exist in the order book, create one
    if (!sellPrice) {
      // Create sell order at a price higher than current buy price
      const price = Number(buyPrice) + getPriceMakerInscrease() * 2;
      const receive = trade.calcUsdt(price.toString(), amount.toString());

      await trade.createSellOrder(maker, {
        amount: BigInt(parseUnits("10", tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} 10 ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
    }
  }

  // === TAKER STRATEGY ===
  // Takers consume liquidity by taking existing orders to move price toward target
  if (role === "taker") {
    // Check if taker wallet is configured
    if (!pair.taker) {
      console.log(`[${pair.symbol}${new Date().toISOString()}] No taker wallet`);
    }

    // Initialize taker wallet
    const takerWallet = new Wallet(pair.taker!);
    const taker = takerWallet.connect(provider);
    console.log(`[${pair.symbol}${new Date().toISOString()}] Taker address: ${takerWallet.address}`);

    // Approve token spending for trading
    await trade.approveToken(taker);

    // Calculate price adjustment
    const priceIncrease = getPriceTakerInscrease();

    // Exit if no buy orders exist
    if (!buyPrice) {
      return;
    }

    // If current price is very close to target, create a small sell order to maintain price
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] Target price reached`);
      const buyAmount = 0.5;
      const price = buyPrice.toString();
      const receive = trade.calcUsdt(price, buyAmount.toString());

      await trade.createSellOrder(taker, {
        amount: BigInt(parseUnits(buyAmount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${buyAmount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
      return;
    }

    // If buy price is below target, create buy order to push price up
    if (Number(buyPrice) < Number(target)) {
      // Calculate order amount (between 4-8 or based on available sell amount)
      let amount = 4 + Math.random() * 4;

      // Adjust amount based on available sell orders, but cap at TAKER_CAPACITY
      if (priceIncrease > 0 && !Number.isNaN(Number(sellAmount))) {
        if (Number(sellAmount) < TAKER_CAPACITY) {
          amount = Math.max(Number(sellAmount), amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      // Calculate next buy price (higher than current sell price)
      let nextBuyPrice = Math.abs(Number(sellPrice ?? buyPrice) + priceIncrease);

      // Don't exceed target price
      if (target < nextBuyPrice) {
        nextBuyPrice = target;
      }

      // Calculate payment amount
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());

      // Create buy order
      await trade.createBuyOrder(taker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.decimals}`);
    }
    else {
      // If buy price is above target, create sell order to push price down
      // Calculate order amount (between 4-8 or based on available buy amount)
      let amount = 4 + Math.random() * 4;

      // Adjust amount based on available buy orders, but cap at TAKER_CAPACITY
      if (priceIncrease > 0 && !Number.isNaN(Number(buyAmount))) {
        if (Number(buyAmount) < TAKER_CAPACITY) {
          amount = Math.max(Number(buyAmount), amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      // Calculate next sell price (lower than current buy price)
      let nextSellPrice = Math.abs(Number(buyPrice) - priceIncrease);

      // Don't go below target price
      if (target > nextSellPrice) {
        nextSellPrice = target;
      }

      // Calculate expected receive amount
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());

      // Create sell order
      await trade.createSellOrder(taker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
    }
  }
}

// Initialize scheduler for periodic tasks
const scheduler = new ToadScheduler();

/**
 * Task for maker operations - creates liquidity by placing orders
 * Runs for all configured trading pairs
 */
const makerTask = new Task(
  "maker tasks",
  () => {
    PAIRS.forEach((pair) => {
      main(pair, "maker").catch((err: Error) => {
        console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
      });
    });
  },
  (err: Error) => {
    console.log(err);
  },
);

/**
 * Task for taker operations - consumes liquidity by taking existing orders
 * Runs for all configured trading pairs
 */
const takerTask = new Task(
  "taker tasks",
  () => {
    PAIRS.forEach((pair) => {
      main(pair, "taker").catch((err: Error) => {
        console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
      });
    });
  },
  (err: Error) => {
    console.log(err);
  },
);

// Schedule maker task to run every 10 seconds
const makerJob = new SimpleIntervalJob({ seconds: 10, runImmediately: true }, makerTask);
// Schedule taker task to run every 15 seconds
const takerJob = new SimpleIntervalJob({ seconds: 15, runImmediately: true }, takerTask);

// Add jobs to scheduler
scheduler.addSimpleIntervalJob(makerJob);
scheduler.addSimpleIntervalJob(takerJob);
