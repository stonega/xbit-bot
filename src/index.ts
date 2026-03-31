import { formatUnits, JsonRpcProvider, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { getPairs, TAKER_CAPACITY } from "./config";
import { deepxDevnet, deepxTestnet } from "./contract/network";
import { PerpApi } from "./contract/perpApi";
import { getPrice, getTargetPrice, withRetry } from "./utils";

/**
 * Generates a random price increase for taker orders
 * Returns a value between 0.01 and 0.02
 * @returns {number} Price increase percentage
 */
function getPriceTakerInscrease(): number {
  return Number(Math.max(Math.random() * 0.015, 0.01).toFixed(4));
}

/**
 * Generates a random price increase for maker orders
 * Returns a value between 0.02 and 0.04
 * @returns {number} Price increase percentage
 */
function getPriceMakerInscrease(): number {
  return Number(Math.max(Math.random() * 0.02, 0.01).toFixed(4));
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
 * @param {any} env - Environment variables
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
    minSizeDecimals: number;
  },
  role: "maker" | "taker",
  env: any,
): Promise<void> {
  // Get network configuration
  const currentNetwork = env.NETWORK === "deepx_testnet" ? deepxTestnet : deepxDevnet;

  // Find token information from pair symbol
  const collateralToken = currentNetwork.tokens.usdc;

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
  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair.marketId, env);

  // Validate prices before using them
  const validBuyPrice = validatePrice(buyPrice);
  const validSellPrice = validatePrice(sellPrice);
  const validBuyAmount = validatePrice(buyAmount);
  const validSellAmount = validatePrice(sellAmount);

  // Get target price for this trading pair
  const target = await getTargetPrice(pair.price, env);

  // Log current market conditions for debugging
  console.debug(`[${pair.symbol}${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${validBuyPrice} BuyAmount: ${validBuyAmount} SellPrice: ${validSellPrice} SellAmount: ${validSellAmount}`);

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
  try {
    const positions = await perpApi.userPerpPositions(account);
    if (positions.length > 0) {
      const position = positions[0];
      if (position && position.base_asset_amount > 0n) {
        const positionSize = Number(formatUnits(position.base_asset_amount, pair.decimals));
        console.log(`[${pair.symbol}${new Date().toISOString()}] Current position size: ${positionSize}, isLong: ${position.is_long}`);

        const MAX_POSITION_SIZE = TAKER_CAPACITY * 6;
        if (positionSize > MAX_POSITION_SIZE / 2) {
          await withRetry(() =>
            perpApi.closePosition(wallet, {
              subaccount: account,
              price: 0n,
              slippage: 30n,
            }),
          );
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`[${pair.symbol}${new Date().toISOString()}] Closed position.`);
        }
      }
    }
  }
  catch (error) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] Error: ${error}`);
  }
  const activeOrders = await perpApi.userActiveOrders(account);
  if (activeOrders.length > 20) {
    console.log(`[${pair.symbol}${new Date().toISOString()}] Found ${activeOrders.length} active orders to cancel.`);
    await withRetry(() =>
      perpApi.cancelOrder(wallet, {
        subaccount: account,
        orderId: activeOrders[0].order_id,
      }),
    );
    console.log(`[${pair.symbol}${new Date().toISOString()}] Canceled 1 order.`);
    // Wait a bit after canceling before placing new orders
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  // === MAKER STRATEGY ===
  if (role === "maker") {
    const amount = 0.4 * Math.random() + 0.8;
    console.log("target", target);
    if (!buyPrice || validBuyPrice === 0) {
      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: true,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(target.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: 0n,
          stopLoss: 0n,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${target} ${amount}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }

    if (Math.abs(validBuyPrice - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] No action required`);
      return;
    }

    if (validBuyPrice < target) {
      const nextBuyPrice = Math.min(Math.abs(validBuyPrice - getPriceMakerInscrease()), validSellPrice > 0 ? validSellPrice : target + 0.1) - 0.0001;
      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: true,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(target.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: 0n,
          stopLoss: 0n,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount}`);
    }
    else {
      const nextSellPrice = Math.max(Math.abs(validBuyPrice + getPriceMakerInscrease()), validBuyPrice) + 0.0001;
      if (Number.isNaN(nextSellPrice) || nextSellPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextSellPrice: ${nextSellPrice}`);
        return;
      }

      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: false,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(target.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: 0n,
          stopLoss: 0n,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice} ${amount}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!sellPrice || validSellPrice === 0) {
      const price = validBuyPrice + getPriceMakerInscrease() * 2;
      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: false,
          size: parseUnits("1.2", pair.decimals),
          price: parseUnits(price.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: 0n,
          stopLoss: 0n,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} 10`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // === TAKER STRATEGY ===
  if (role === "taker") {
    const priceIncrease = getPriceTakerInscrease();
    if ((!buyPrice || validBuyPrice === 0) && (sellPrice && validSellPrice > 0)) {
      let amount = 0.1 + Math.random() * 0.4;
      if (priceIncrease > 0 && validSellAmount > 0) {
        if (validSellAmount < TAKER_CAPACITY) {
          amount = Math.max(validSellAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      let nextBuyPrice = Math.abs(validSellPrice + priceIncrease);
      if (target < nextBuyPrice) {
        nextBuyPrice = target + 0.0001;
      }

      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      const takeProfitPrice = parseUnits((nextBuyPrice * 1.02).toFixed(2), 6);
      const stopLossPrice = parseUnits((nextBuyPrice * 0.98).toFixed(2), 6);

      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: true,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(nextBuyPrice.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: takeProfitPrice,
          stopLoss: stopLossPrice,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount}`);
      return;
    }

    if (validBuyPrice > 0 && Math.abs(validBuyPrice - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] Target price reached, no action required`);
      return;
    }

    if (validBuyPrice < target || validBuyPrice === 0) {
      let amount = 0.4 + Math.random() * 0.4;
      if (priceIncrease > 0 && validSellAmount > 0) {
        if (validSellAmount < TAKER_CAPACITY) {
          amount = Math.max(validSellAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      const basePrice = validSellPrice > 0 ? validSellPrice : (validBuyPrice > 0 ? validBuyPrice : target);
      let nextBuyPrice = Math.abs(basePrice + priceIncrease);

      if (target < nextBuyPrice) {
        nextBuyPrice = target + 0.0001;
      }

      if (Number.isNaN(nextBuyPrice) || nextBuyPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextBuyPrice: ${nextBuyPrice}`);
        return;
      }

      const takeProfitPrice = parseUnits((nextBuyPrice * 1.02).toFixed(2), 6);
      const stopLossPrice = parseUnits((nextBuyPrice * 0.98).toFixed(2), 6);

      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: true,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(nextBuyPrice.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: takeProfitPrice,
          stopLoss: stopLossPrice,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount}`);
    }
    else {
      let amount = 0.4 + Math.random() * 0.4;
      if (priceIncrease > 0 && validBuyAmount > 0) {
        if (validBuyAmount < TAKER_CAPACITY) {
          amount = Math.max(validBuyAmount, amount);
        }
        else {
          amount = TAKER_CAPACITY;
        }
      }

      let nextSellPrice = Math.abs(validBuyPrice - priceIncrease);
      if (target > nextSellPrice) {
        nextSellPrice = target - 0.0001;
      }

      if (Number.isNaN(nextSellPrice) || nextSellPrice <= 0) {
        console.log(`[${pair.symbol}${new Date().toISOString()}] Invalid nextSellPrice: ${nextSellPrice}`);
        return;
      }

      const takeProfitPrice = parseUnits((nextSellPrice * 0.98).toFixed(2), 6);

      await withRetry(() =>
        perpApi.placePerpOrder(wallet, {
          subaccount: account,
          isLong: false,
          size: parseUnits(amount.toFixed(pair.minSizeDecimals), pair.decimals),
          price: parseUnits(nextSellPrice.toFixed(2), 6),
          orderType: 0,
          leverage: 10,
          takeProfit: takeProfitPrice,
          stopLoss: 0n,
        }),
      );
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${nextSellPrice} ${amount}`);
    }
  }
}

// Support for Cloudflare Workers (Scheduled Events)
export default {
  async scheduled(event: any, env: any, ctx: any) {
    const pairs = getPairs(env);
    const tasks = [
      ...pairs.map(pair => main(pair, "maker", env)),
      ...pairs.filter(pair => pair.makerPrivateKey).map(pair => main(pair, "taker", env)),
    ];
    ctx.waitUntil(Promise.allSettled(tasks));
  },
  // Also support manual trigger via fetch if needed
  async fetch(request: Request, env: any, ctx: any) {
    const pairs = getPairs(env);
    const tasks = [
      ...pairs.map(pair => main(pair, "maker", env)),
      ...pairs.filter(pair => pair.makerPrivateKey).map(pair => main(pair, "taker", env)),
    ];
    await Promise.allSettled(tasks);
    return new Response("Tasks executed");
  },
};

// Support for local Bun execution
if (typeof Bun !== "undefined") {
  const scheduler = new ToadScheduler();
  const pairs = getPairs(Bun.env);

  const makerTask = new Task(
    "maker tasks",
    () => {
      pairs.forEach((pair) => {
        main(pair, "maker", Bun.env).catch((err: Error) => {
          console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
        });
      });
    },
    (err: Error) => {
      console.log(err);
    },
  );

  const takerTask = new Task(
    "taker tasks",
    () => {
      pairs.filter(pair => pair.makerPrivateKey).forEach((pair) => {
        main(pair, "taker", Bun.env).catch((err: Error) => {
          console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
        });
      });
    },
    (err: Error) => {
      console.log(err);
    },
  );

  const makerJob = new SimpleIntervalJob({ seconds: 1, runImmediately: true }, makerTask);
  const takerJob = new SimpleIntervalJob({ seconds: 1, runImmediately: true }, takerTask);

  scheduler.addSimpleIntervalJob(makerJob);
  scheduler.addSimpleIntervalJob(takerJob);
}
