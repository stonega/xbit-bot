import { formatUnits, JsonRpcProvider, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { PAIRS, TAKER_CAPACITY, TOKENS } from "./config";
import { TradeApi } from "./contract";
import { ultraLiquidTestnet } from "./contract/network";
import { getPrice, getTargetPrice, withRetry } from "./utils";

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
 * Helper function to validate and convert price values
 */
function validatePrice(price: string | undefined, fallback: number = 0): number {
  if (!price || price === undefined || price === null) {
    return fallback;
  }
  const numPrice = Number(price);
  return Number.isNaN(numPrice) ? fallback : numPrice;
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
    decimals: number;
    pairId: string;
  },
  role: "maker" | "taker",
): Promise<void> {
  // Get network configuration
  const currentNetwork = ultraLiquidTestnet;

  // Find token information from config TOKENS
  const collateralToken = TOKENS.find(token => token.symbol === "USDT");
  const tradeToken = TOKENS.find(token => token.symbol === pair.price);

  if (!tradeToken) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No trade token found`);
    return;
  }
  if (!collateralToken) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No collateral token found`);
    return;
  }
  if (!pair.marketId) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] No marketId found`);
    return;
  }

  // Get the subaccount for the current role
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

  // Initialize trading API with contract, token, and subaccount information
  const tradeApi = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: "0x000000000000000000000000000000000000044d",
    tokenA: tradeToken,
    tokenB: collateralToken,
    pairId: pair.pairId,
    subaccount: account, // Add subaccount to use subaccount functions
  });

  // Setup provider with timeout
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  // Set RPC timeout to 10 seconds to prevent hanging requests
  provider._getConnection().timeout = 10000;

  // Get current market prices and order book information
  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair.symbol);

  // Validate prices before using them
  const validBuyPrice = validatePrice(buyPrice);
  const validSellPrice = validatePrice(sellPrice);
  const validBuyAmount = validatePrice(buyAmount);
  const validSellAmount = validatePrice(sellAmount);

  // Get target price for this trading pair
  const target = await getTargetPrice(pair.price);

  // Log current market conditions for debugging
  console.debug(`[${pair.symbol}${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${validBuyPrice} BuyAmount: ${validBuyAmount} SellPrice: ${validSellPrice} SellAmount: ${validSellAmount}`);

  const wallet = new Wallet(privateKey, provider);
  console.log(`[${pair.symbol}${new Date().toISOString()}] ${role} address: ${wallet.address}, sub-account: ${account}`);
  const activeOrders = await tradeApi.userActiveSpotOrders(account);
  if (activeOrders.length > 20) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] Found ${activeOrders.length} active orders to cancel.`);

    // Find the order with price furthest from target price
    let orderToCancel = activeOrders[0];
    let maxPriceDifference = 0;

    for (const order of activeOrders) {
      // Convert order price from wei to number for comparison
      const orderPriceNumber = Number(formatUnits(order.price, 6));
      const priceDifference = Math.abs(orderPriceNumber - target);

      if (priceDifference > maxPriceDifference) {
        maxPriceDifference = priceDifference;
        orderToCancel = order;
      }
    }

    const orderPriceNumber = Number(formatUnits(orderToCancel.price, 6));
    console.log(`[${pair.symbol}${new Date().toISOString()}] Canceling order with price ${orderPriceNumber.toFixed(2)} (target: ${target.toFixed(2)}, difference: ${maxPriceDifference.toFixed(4)})`);

    await withRetry(() =>
      tradeApi.cancelOrder(wallet, {
        orderId: orderToCancel.id,
        type: orderToCancel.is_buy ? "buy" : "sell",
      }),
    );
    console.log(`[${pair.symbol}${new Date().toISOString()}] Canceled 1 order.`);
    // Wait a bit after canceling before placing new orders
    await new Promise(resolve => setTimeout(resolve, 1000));
    return;
  }
  // === MAKER STRATEGY ===
  // Makers create liquidity by placing orders on both sides of the order book
  if (role === "maker") {
    // Cancel all active orders before placing new ones
    // Generate random order amount between 0.8 and 1.2
    const amount = 0.4 * Math.random() + 0.8;

    // If no buy orders exist in the order book, create one at target price
    if (!buyPrice || validBuyPrice === 0) {
      const pay = tradeApi.calcUsdt(target.toFixed(2), amount.toFixed(pair.decimals));
      await withRetry(() =>
        tradeApi.createBuyOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          pay,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${target.toFixed(2)} ${amount}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    // If current price is very close to target, no action needed
    if (Math.abs(validBuyPrice - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] No action required`);
      return;
    }

    // If buy price is below target, create buy order
    if (validBuyPrice < target) {
      // Calculate a new buy price slightly below current buy price
      let nextBuyPrice = Math.min(Math.abs(validBuyPrice - getPriceMakerInscrease()), validSellPrice > 0 ? validSellPrice : target + 0.1) - 0.0001;

      // If buy price exceeds 10% of target price, use target price directly
      if (nextBuyPrice > target * 1.05 || nextBuyPrice < target * 0.95) {
        nextBuyPrice = target;
      }

      // Validate nextBuyPrice before using it
      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      // Create buy order
      await withRetry(() =>
        tradeApi.createBuyOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          pay: tradeApi.calcUsdt(nextBuyPrice.toFixed(2), amount.toFixed(pair.decimals)),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice.toFixed(2)} ${amount}`);
    }
    else {
      // If buy price is above target, create sell order
      let nextSellPrice = Math.max(Math.abs(validBuyPrice + getPriceMakerInscrease()), validBuyPrice) + 0.0001;

      // If sell price exceeds 10% of target price, use target price directly
      if (nextSellPrice > target * 1.05 || nextSellPrice < target * 0.95) {
        nextSellPrice = target;
      }

      // Validate nextSellPrice before using it
      if (Number.isNaN(nextSellPrice) || nextSellPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextSellPrice: ${nextSellPrice}`);
        return;
      }

      await withRetry(() =>
        tradeApi.createSellOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          receive: tradeApi.calcUsdt(nextSellPrice.toFixed(2), amount.toFixed(pair.decimals)),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice.toFixed(2)} ${amount}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If no sell orders exist in the order book, create one
    if (!sellPrice || validSellPrice === 0) {
      // Create sell order at a price higher than current buy price
      let price = validBuyPrice + getPriceMakerInscrease() * 2;

      // If sell price exceeds 10% of target price, use target price directly
      if (price > target * 1.05 || price < target * 0.95) {
        price = target;
      }

      await withRetry(() =>
        tradeApi.createSellOrder(wallet, {
          amount: parseUnits("10", pair.decimals),
          receive: tradeApi.calcUsdt(price.toFixed(2), "10"),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price.toFixed(2)} 10`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // === TAKER STRATEGY ===
  // Takers consume liquidity by taking existing orders to move price toward target
  if (role === "taker") {
    // Calculate price adjustment
    const priceIncrease = getPriceTakerInscrease();

    // Exit if no buy orders exist
    if ((!buyPrice || validBuyPrice === 0) && (sellPrice && validSellPrice > 0)) {
      let amount = 8 + Math.random() * 4;

      // Adjust amount based on available sell orders, but cap at TAKER_CAPACITY
      if (priceIncrease > 0 && validSellAmount > 0) {
        if (validSellAmount < TAKER_CAPACITY) {
          amount = Math.max(validSellAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      // Calculate next buy price (higher than current sell price)
      let nextBuyPrice = Math.abs(validSellPrice + priceIncrease);

      // If buy price exceeds 10% of target price, use target price directly
      if (nextBuyPrice > target * 1.05 || nextBuyPrice < target * 0.95) {
        nextBuyPrice = target;
      }

      // Don't exceed target price
      if (target < nextBuyPrice) {
        nextBuyPrice = target + 0.0001;
      }

      // Validate nextBuyPrice before using it
      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      // Create buy order
      await withRetry(() =>
        tradeApi.createBuyOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          pay: parseUnits(nextBuyPrice.toFixed(2), 6),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice.toFixed(2)} ${amount}`);
      return;
    }

    // If current price is very close to target, create a small sell order to maintain price
    if (validBuyPrice > 0 && Math.abs(validBuyPrice - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] Target price reached`);
      const buyAmount = 1.5;
      // If buy price exceeds 10% of target price, use target price directly
      let price = validBuyPrice;
      if (validBuyPrice > target * 1.05 || validBuyPrice < target * 0.95) {
        price = target;
      }

      await withRetry(() =>
        tradeApi.createSellOrder(wallet, {
          amount: parseUnits(buyAmount.toFixed(pair.decimals), pair.decimals),
          receive: tradeApi.calcUsdt(price.toFixed(2), buyAmount.toFixed(pair.decimals)),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price.toFixed(2)} ${buyAmount}`);
      return;
    }

    // If buy price is below target, create buy order to push price up
    if (validBuyPrice < target || validBuyPrice === 0) {
      // Calculate order amount (between 4-8 or based on available sell amount)
      let amount = 8 + Math.random() * 4;

      // Adjust amount based on available sell orders, but cap at TAKER_CAPACITY
      if (priceIncrease > 0 && validSellAmount > 0) {
        if (validSellAmount < TAKER_CAPACITY) {
          amount = Math.max(validSellAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      // Calculate next buy price (higher than current sell price)
      const basePrice = validSellPrice > 0 ? validSellPrice : (validBuyPrice > 0 ? validBuyPrice : target);
      let nextBuyPrice = Math.abs(basePrice + priceIncrease);

      // If buy price exceeds 10% of target price, use target price directly
      if (nextBuyPrice > target * 1.05 || nextBuyPrice < target * 0.95) {
        nextBuyPrice = target;
      }

      // Don't exceed target price
      if (target < nextBuyPrice) {
        nextBuyPrice = target + 0.0001;
      }

      // Validate nextBuyPrice before using it
      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      // Create buy order
      await withRetry(() =>
        tradeApi.createBuyOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          pay: parseUnits(nextBuyPrice.toFixed(2), 6),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice.toFixed(2)} ${amount}`);
    }
    else {
      // If buy price is above target, create sell order to push price down
      // Calculate order amount (between 4-8 or based on available buy amount)
      let amount = 4 + Math.random() * 4;

      // Adjust amount based on available buy orders, but cap at TAKER_CAPACITY
      if (priceIncrease > 0 && validBuyAmount > 0) {
        if (validBuyAmount < TAKER_CAPACITY) {
          amount = Math.max(validBuyAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      // Calculate next sell price (lower than current buy price)
      let nextSellPrice = Math.abs(validBuyPrice - priceIncrease);

      // If sell price exceeds 10% of target price, use target price directly
      if (nextSellPrice > target * 1.05 || nextSellPrice < target * 0.95) {
        nextSellPrice = target;
      }

      // Don't go below target price
      if (target > nextSellPrice) {
        nextSellPrice = target - 0.0001;
      }

      // Validate nextSellPrice before using it
      if (Number.isNaN(nextSellPrice) || nextSellPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextSellPrice: ${nextSellPrice}`);
        return;
      }

      // Create sell order
      await withRetry(() =>
        tradeApi.createSellOrder(wallet, {
          amount: parseUnits(amount.toFixed(pair.decimals), pair.decimals),
          receive: parseUnits(nextSellPrice.toFixed(2), 6),
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice.toFixed(2)} ${amount}`);
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
    PAIRS.filter(pair => pair.makerPrivateKey).forEach((pair) => {
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
const makerJob = new SimpleIntervalJob({ seconds: 20, runImmediately: true }, makerTask);
// Schedule taker task to run every 15 seconds
const takerJob = new SimpleIntervalJob({ seconds: 20, runImmediately: true }, takerTask);

// Add jobs to scheduler
scheduler.addSimpleIntervalJob(makerJob);
scheduler.addSimpleIntervalJob(takerJob);
