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
export async function getPrice(marketId: number): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string }> {
  const baseAppUrl = Bun.env.NETWORK === "deepx_testnet" ? "https://testnet-api.deepx.fi" : "https://devnet-api.deepx.fi";
  const result = await fetch(`${baseAppUrl}/v1/blockchain/perp/order-books?market_id=${marketId}`).then(a => a.json());
  if (!result.data.orderBuyList) {
    console.log({ error: result.msg });
  }
  const buyList = result.data.orderBuyList.sort((a: any, b: any) => b.price - a.price);
  const sellList = result.data.orderSellList.sort((a: any, b: any) => a.price - b.price);
  const buyPrice = buyList[0]?.price;
  const buyAmount = buyList[0]?.qty;
  const sellPrice = sellList[0]?.price;
  const sellAmount = sellList[0]?.qty;
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
export async function getPairContract(pair: string): Promise<{ address: string; pairId: string | undefined }> {
  const baseAppUrl = Bun.env.NETWORK === "deepx_testnet" ? "https://testnet-api.deepx.fi" : "https://devnet-api.deepx.fi";
  const result = await fetch(`${baseAppUrl}/perp/blockchain/perp/pairs`).then(a => a.json());
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

/**
 * Fetch price from okx api
 */
export async function getTargetPrice(pair: string): Promise<number> {
  const timestamp = new Date().toISOString();
  const baseUrl = "https://www.okx.com";
  const queryString = `instId=${pair}-USDT&limit=1`;
  const requestPath = "/api/v5/market/history-index-candles";
  const headers = getHeaders(timestamp, "GET", requestPath, queryString);
  const data = await fetch(`${baseUrl}${requestPath}?${queryString}`, { headers }).then(res => res.json());
  const price = Number(data.data[0][1]);
  return Number(price.toFixed(4));
}
