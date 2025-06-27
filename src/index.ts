import { formatUnits, JsonRpcProvider, parseEther, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { PAIRS, TAKER_CAPACITY } from "./config";
import { ultraLiquidTestnet } from "./contract/network";
import { PerpApi } from "./contract/perpApi";
import { getPrice, getTargetPrice } from "./utils";

/**
 * Generates a random price increase for taker orders
 * Returns a value between 0.01 and 0.02
 * @returns {number} Price increase percentage
 */
function getPriceTakerInscrease(): number {
  return Number(Math.max(Math.random() * 0.02, 0.01).toFixed(4));
}

/**
 * Generates a random price increase for maker orders
 * Returns a value between 0.02 and 0.04
 * @returns {number} Price increase percentage
 */
function getPriceMakerInscrease(): number {
  return Number(Math.max(Math.random() * 0.04, 0.02).toFixed(4));
}

/**
 * Main function to execute trading strategy for a specific trading pair
 * @param {object} pair - Trading pair information
 * @param {"maker" | "taker"} role - Trading role (maker creates liquidity, taker takes liquidity)
 * @returns {Promise<void>}
 */
async function main(
  pair: {
    price: string;
    symbol: string;
    makerPrivateKey?: string;
    takerPrivateKey?: string;
    takerAccount?: string;
    makerAccount?: string;
    marketId?: number;
    increase?: boolean;
  },
  role: "maker" | "taker",
): Promise<void> {
  // Get network configuration
  const currentNetwork = ultraLiquidTestnet;

  // Find token information from pair symbol
  const collateralToken = currentNetwork.tokens.usdt;

  if (!pair.marketId) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No marketId found`);
    return;
  }

  // Initialize trading API with contract and token information
  const perpApi = new PerpApi({
    rpc: currentNetwork.rpc,
    marketId: pair.marketId,
    token: collateralToken,
  });

  // Setup provider with timeout
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  // Set RPC timeout to 10 seconds to prevent hanging requests
  provider._getConnection().timeout = 10000;

  // Get current market prices and order book information
  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair.marketId);

  // Get target price for this trading pair
  const target = await getTargetPrice(pair.price);
  if (Number.isNaN(target)) {
    return; // Exit if target price is invalid
  }

  // Log current market conditions for debugging
  console.debug(`[${pair.symbol}${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${buyPrice} BuyAmount: ${buyAmount} SellPrice: ${sellPrice} SellAmount: ${sellAmount}`);

  const account = role === "maker" ? pair.makerAccount : pair.takerAccount;
  const privateKey = role === "maker" ? pair.makerPrivateKey : pair.takerPrivateKey;

  if (!account) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No ${role} account found`);
    return;
  }
  if (!privateKey) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No private key found for ${role}`);
    return;
  }

  const wallet = new Wallet(privateKey, provider);
  console.log(`[${pair.symbol}${new Date().toISOString()}] ${role} address: ${wallet.address}, sub-account: ${account}`);

  const position = await perpApi.userPerpPositions(account);
  // === MAKER STRATEGY ===
  // Makers create liquidity by placing orders on both sides of the order book
  if (role === "maker") {
    // Cancel all active orders before placing new ones
    const activeOrders = await perpApi.userActiveOrders(account);
    if (activeOrders.length > 0) {
      const ordersToCancel = activeOrders.filter((order) => {
        const orderPrice = Number(formatUnits(order.price, 6));
        const priceDifference = Math.abs(orderPrice - target);
        const percentageDifference = priceDifference / target;
        return percentageDifference > 0.05; // 5%
      });

      if (ordersToCancel.length > 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Found ${ordersToCancel.length} active orders to cancel.`);
        const cancelPromises = ordersToCancel.map(order =>
          perpApi.cancelOrder(wallet, {
            subaccount: account,
            orderId: order.order_id,
          }),
        );
        await Promise.all(cancelPromises);
        console.log(`[${pair.symbol}${new Date().toISOString()}] Canceled ${ordersToCancel.length} orders.`);
        // Wait a bit after canceling before placing new orders
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    // Generate random order amount between 0.8 and 1.2
    const amount = 0.4 * Math.random() + 0.8;

    // If no buy orders exist in the order book, create one at target price
    if (!buyPrice) {
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: true,
        size: parseUnits(amount.toString(), 18),
        price: parseUnits(target.toString(), 6),
        orderType: 0, // Limit order
        leverage: 10,
        takeProfit: 0n,
        stopLoss: 0n,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${target} ${amount}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
      return;
    }

    // If current price is very close to target, no action needed
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] No action required`);
      return;
    }

    // Calculate next sell price with increase
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());

    // If buy price is below target, create buy order
    if (Number(buyPrice) < Number(target)) {
      // Calculate a new buy price slightly below current buy price
      const nextBuyPrice = Math.abs(Number(buyPrice) - getPriceMakerInscrease());

      // Create buy order
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: true,
        size: parseUnits(amount.toString(), 18),
        price: parseUnits(nextBuyPrice.toString(), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: 0n,
        stopLoss: 0n,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount}`);
    }
    else {
      // If buy price is above target, create sell order
      // Create sell order
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: false,
        size: parseUnits(amount.toString(), 18),
        price: parseUnits(nextSellPrice.toString(), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: 0n,
        stopLoss: 0n,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice} ${amount}`);

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
    }

    // If no sell orders exist in the order book, create one
    if (!sellPrice) {
      // Create sell order at a price higher than current buy price
      const price = Number(buyPrice) + getPriceMakerInscrease() * 2;
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: false,
        size: parseUnits("10", 18),
        price: parseUnits(price.toString(), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: 0n,
        stopLoss: 0n,
      });

      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} 10`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second to avoid rate limits
    }
  }

  // === TAKER STRATEGY ===
  // Takers consume liquidity by taking existing orders to move price toward target
  if (role === "taker") {
    if (position && position.base_asset_amount > 0n) {
      const positionSize = Number(formatUnits(position.base_asset_amount, 18));
      console.log(`[${pair.symbol}${new Date().toISOString()}] Current position size: ${positionSize}, isLong: ${position.is_long}`);

      const MAX_POSITION_SIZE = TAKER_CAPACITY;

      if (positionSize > MAX_POSITION_SIZE) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Position (${positionSize}) exceeds max size (${MAX_POSITION_SIZE}). Reducing position.`);

        // We want to reduce the position, so we place an order in the opposite direction.
        const reduceAmount = positionSize / 2;

        if (position.is_long) {
          // To reduce a long position, we sell.
          const nextSellPrice = Math.abs(Number(buyPrice) - getPriceTakerInscrease());
          await perpApi.placePerpOrder(wallet, {
            subaccount: account,
            isLong: false,
            size: parseUnits(reduceAmount.toFixed(4), 18),
            price: parseUnits(nextSellPrice.toFixed(4), 6),
            orderType: 0,
            leverage: 10,
            takeProfit: 0n,
            stopLoss: 0n,
          });
          console.log(`[${pair.symbol}${new Date().toISOString()}] Reducing long position. Sell order created, price ${nextSellPrice} ${reduceAmount}`);
        }
        else {
          // To reduce a short position, we buy.
          const nextBuyPrice = Math.abs(Number(sellPrice ?? buyPrice) + getPriceTakerInscrease());
          await perpApi.placePerpOrder(wallet, {
            subaccount: account,
            isLong: true,
            size: parseUnits(reduceAmount.toFixed(4), 18),
            price: parseUnits(nextBuyPrice.toFixed(4), 6),
            orderType: 0,
            leverage: 10,
            takeProfit: 0n,
            stopLoss: 0n,
          });
          console.log(`[${pair.symbol}${new Date().toISOString()}] Reducing short position. Buy order created, price ${nextBuyPrice} ${reduceAmount}`);
        }

        return; // End taker's turn.
      }
    }
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

      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: false,
        size: parseUnits(buyAmount.toString(), 18),
        price: parseUnits(price.toString(), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: 0n,
        stopLoss: 0n,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${buyAmount}`);
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

      const takeProfitPrice = parseUnits((nextBuyPrice * 1.02).toFixed(4), 6);
      const stopLossPrice = parseUnits((nextBuyPrice * 0.98).toFixed(4), 6);

      // Create buy order
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: true,
        size: parseUnits(amount.toString(), 18),
        price: parseUnits(nextBuyPrice.toString(), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: takeProfitPrice,
        stopLoss: stopLossPrice,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount}`);
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

      const takeProfitPrice = parseUnits((nextSellPrice * 0.98).toFixed(4), 6);
      const stopLossPrice = parseUnits((nextSellPrice * 1.02).toFixed(4), 6);

      // Create sell order
      await perpApi.placePerpOrder(wallet, {
        subaccount: account,
        isLong: false,
        size: parseUnits(amount.toString(), 18),
        price: parseUnits(nextSellPrice.toFixed(4), 6),
        orderType: 0,
        leverage: 10,
        takeProfit: takeProfitPrice,
        stopLoss: stopLossPrice,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice} ${amount}`);
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
