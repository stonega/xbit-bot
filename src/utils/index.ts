import CryptoJS from "crypto-js";

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
export async function getPrice(pair: string): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string }> {
  const result = await fetch(`https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=${pair}`).then(a => a.json());
  if (!result.data.orderBuyBList) {
    console.log({ error: result.msg });
  }
  const buyPrice = result.data.orderBuyBList[0]?.price;
  const buyAmount = result.data.orderBuyBList[0]?.qty;
  const sellPrice = result.data.orderSellBList[result.data.orderSellBList.length - 1]?.price;
  const sellAmount = result.data.orderSellBList[result.data.orderSellBList.length - 1]?.qty;
  return {
    buyPrice,
    buyAmount,
    sellPrice,
    sellAmount,
  };
}

/**
 * Get pair contract address from xbit api
 */
export async function getPairContract(pair: string): Promise<string> {
  const result = await fetch(`https://test-api.safematrix.io/bool-stake-reward/blockchain/pairs`).then(a => a.json());
  return result.data.find(
    (a: any) => a.name === pair,
  ).address;
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

/**
 * Fetch price from okx api
 */
let lastPrice = 0;
export async function getTargetPrice(pair: string): Promise<number> {
  const timestamp = new Date().toISOString();
  const baseUrl = "https://www.okx.com";
  const queryString = `instId=${pair}-USDT&limit=1`;
  const requestPath = "/api/v5/market/history-index-candles";
  const headers = getHeaders(timestamp, "GET", requestPath, queryString);
  const data = await fetch(`${baseUrl}${requestPath}?${queryString}`, { headers }).then(res => res.json());
  let price = Number(data.data[0][1]);

  // To avoid the price being too high
  if (price > 100)
    price = price / 50;

  // Add 0.2 to price per day based on 2025/02/14
  const startDate = new Date("2025-02-14");
  const currentDate = new Date();
  const diffInDays = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 3600 * 5.8));
  price += diffInDays * 0.05;

  // Force update price if price unchanged
  if (Math.abs(price - lastPrice) > 0.005) {
    lastPrice = price;
  }
  else {
    lastPrice = price;
    price += (price > lastPrice ? 0.005 : -0.005);
  }
  return price;
}
