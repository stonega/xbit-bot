import { Database } from "bun:sqlite";
import CryptoJS from "crypto-js";
import { differenceInMilliseconds } from "date-fns";
import { minutesInDay } from "date-fns/constants";
import { generateStockData } from "./price";
/**
 * Generic retry function wrapper
 * @param fn - Function to retry
 * @param retries - Number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @param onError - Optional callback for error handling
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  onError?: (error: Error, attempt: number) => void,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    }
    catch (error) {
      lastError = error as Error;

      if (onError) {
        onError(lastError, attempt);
      }
      else {
        console.error(`Attempt ${attempt} failed:`, lastError.message);
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${retries} attempts. Last error: ${lastError!.message}`);
}

/**
 * Get orderbook data from xbit api
 */
export async function getPrice(pair: string): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string; latestPrice: string }> {
  const result = await fetch(`https://app.safeliquid.ai/backend/bool-stake-reward/blockchain/order-books?pair=${pair}`).then(a => a.json());
  if (!result.data.orderBuyBList) {
    console.log({ error: result.msg });
  }
  const buyPrice = result.data.orderBuyBList[0]?.price;
  const buyAmount = result.data.orderBuyBList[0]?.qty;
  const sellPrice = result.data.orderSellBList[result.data.orderSellBList.length - 1]?.price;
  const sellAmount = result.data.orderSellBList[result.data.orderSellBList.length - 1]?.qty;
  const latestPrice = result.data.latestPrice;
  return {
    buyPrice,
    buyAmount,
    sellPrice,
    sellAmount,
    latestPrice,
  };
}

/**
 * Get pair contract address from xbit api
 */
export async function getPairContract(pair: string): Promise<{ address: string; pairId: string | undefined }> {
  const result = await fetch(`https://app.safeliquid.ai/backend/bool-stake-reward/blockchain/pairs`).then(a => a.json());
  const pairInfo = result.data.find((a: any) => a.name === pair)!;
  return {
    address: pairInfo.address,
    pairId: pairInfo.pairId,
  };
}

export function getHeaders(timestamp: string, method: string, requestPath: string, queryString = ""): {
  [key: string]: string;
} {
  const apiKey = Bun.env.OKX_API_KEY;
  const secretKey = Bun.env.OKX_SECRET_KEY;
  const apiPassphrase = Bun.env.OKX_API_PASSPHRASE;
  // const projectId = Bun.env.OKX_PROJECT_ID;

  if (!apiKey || !secretKey || !apiPassphrase) {
    throw new Error("Missing required environment variables");
  }

  const stringToSign = timestamp + method + requestPath + queryString;
  return {
    "Content-Type": "application/json",
    "OK-ACCESS-KEY": apiKey,
    "OK-ACCESS-SIGN": CryptoJS.enc.Base64.stringify(
      CryptoJS.HmacSHA256(stringToSign, secretKey),
    ),
    "OK-ACCESS-TIMESTAMP": timestamp,
    "OK-ACCESS-PASSPHRASE": apiPassphrase,
    // "OK-ACCESS-PROJECT": projectId,
  };
}

// Initialize SQLite database
const db = new Database("prices.sqlite");
// Simplified table: only store the timestamp and the price fetched from the API
db.run(`
  CREATE TABLE IF NOT EXISTS prices (
    timestamp INTEGER PRIMARY KEY,
    apiPrice REAL NOT NULL,
    price REAL
  );
`);

/**
 * Fetch price from okx api, store it in SQLite, and return it.
 */
export async function getTargetPrice(pair: string, latestPrice: number): Promise<number> {
  const currentMinute = Math.floor(new Date().valueOf() / 1000 / 60);
  const range = {
    low: 0.001,
    high: 0.002,
  };
  // Insert current API price into database
  try {
    const currentPriceData = db.query<{ apiPrice: number; price: number }, [number]>(
      "SELECT apiPrice FROM prices WHERE timestamp = ?",
    ).get(currentMinute);
    let currentApiPrice = currentPriceData?.apiPrice;
    if (!currentApiPrice) {
      const timestamp = new Date().toISOString();
      const after = new Date().valueOf() - differenceInMilliseconds(new Date(2024, 8, 24), new Date(2025, 4, 8));
      const baseUrl = "https://www.okx.com";
      const queryString = `instId=${pair}-USDT&limit=1&after=${after}`;
      const requestPath = "/api/v5/market/history-index-candles";
      const headers = getHeaders(timestamp, "GET", requestPath, queryString);
      const data = await fetch(`${baseUrl}${requestPath}?${queryString}`, { headers }).then(res => res.json());
      currentApiPrice = Number(data.data[0][1]);

      db.run(
        "INSERT OR IGNORE INTO prices (timestamp, apiPrice) VALUES (?, ?)",
        [currentMinute, currentApiPrice],
      );
    }
    // Log the price being saved and returned
    console.log(`Saved price ${currentApiPrice} for timestamp ${currentMinute}`);
    // Read previous price from database
    const previousPriceData = db.query<{ apiPrice: number; price: number }, [number]>(
      "SELECT apiPrice, price FROM prices WHERE timestamp = ?",
    ).get(currentMinute - 1);
    const previousApiPrice = previousPriceData?.apiPrice;
    const priceChangePercentage = previousApiPrice ? ((currentApiPrice - previousApiPrice) / previousApiPrice) : 0;
    if (previousApiPrice) {
      const previousPrice = Number(previousPriceData?.price) || latestPrice;
      let targetPrice = previousPrice + (priceChangePercentage * previousPrice * 10);
      if (targetPrice < range.low && targetPrice > range.high) {
        targetPrice = previousPrice - (priceChangePercentage * previousPrice * 10);
      }
      console.log(`Price change percentage: ${(priceChangePercentage * 10).toFixed(4)}%`, previousPrice, targetPrice); // Update the price in the database
      db.run("UPDATE prices SET price = ? WHERE timestamp = ?", [targetPrice, currentMinute]);
      return targetPrice;
    }
    else {
      console.log("No previous price found to calculate change.");
      return latestPrice;
    }
  }
  catch (e) {
    console.error("Database insert error:", e);
    return latestPrice;
  }
}

export function getMinutePrice(): number {
  const startDate = "2025-04-07T00:00:00.000Z";
  // Generate 30 days of stock data
  const data = generateStockData({
    days: 30,
    priceRange: [0.001, 0.002],
    seed: Number(Bun.env.PRICE_SEED!),
    trend: 0.001,
    volatility: 0.05,
    startDate,
  });

  // Access different timeframes
  const minuteData = data["1m"];
  const currentDate = new Date();
  currentDate.setSeconds(0, 0);
  const currentMinuteTimeString = currentDate.toISOString();
  console.log(currentMinuteTimeString);
  const currentMinute = minuteData.findIndex(a => a.timestamp.toISOString() === currentMinuteTimeString);
  return minuteData[currentMinute].high;
}
