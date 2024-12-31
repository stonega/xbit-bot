import CryptoJS from "crypto-js";

/**
 * Get orderbook data from xbit api
 */
export async function getPrice(pair: string): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string }> {
  const result = await fetch(`https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=${pair}`).then(a => a.json());
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
