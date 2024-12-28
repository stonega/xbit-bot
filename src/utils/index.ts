import CryptoJS from "crypto-js";

// const offsetMap: Map<string, number> = new Map();
// export async function getTargetPrice(force?: boolean): Promise<number> {
//   // 4 hour as as update intervel
//   const currentHour = Math.floor(new Date().getTime() / 1000 / 60 / 60 / 4).toString();
//   // Get saved offet from memery
//   let offset = offsetMap.get(currentHour);
//   const reset = Math.random() < 0.01;
//   if (!offset || reset || force) {
//     offsetMap.set(currentHour, Math.floor(Math.random() * 1000) + 250);
//     offset = offsetMap.get(currentHour);
//   }
//   const priceResult = await fetch(`https://mempool.space/api/v1/historical-price`).then(a => a.json());
//   const prices = priceResult.prices;
//   // From a static time
//   const startHour = 1732582800 - 3600 * offset!;
//   const startBtcPrice = prices.find((a: any) => a.time === startHour)?.USD;
//   const startPrice = 2;
//   const basePrice = 40000 - Math.min(10000, (Number(currentHour) - 120400) * 100);
//   const targetPrice = startPrice * (1 + (startBtcPrice - basePrice) / basePrice);
//   return Number(targetPrice.toFixed(4));
// }
//
// Get sell and buy price f rom order-books
export async function getPrice(): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string }> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=TBOL%2FUSDC").then(a => a.json());
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

let lastPrice = 0;
export async function getTargetPrice(): Promise<number> {
  const timestamp = new Date().toISOString();
  const baseUrl = "https://www.okx.com";
  const queryString = "instId=SOL-USDC&limit=1";
  const requestPath = "/api/v5/market/history-index-candles";
  const headers = getHeaders(timestamp, "GET", requestPath, queryString);
  const data = await fetch(`${baseUrl}${requestPath}?${queryString}`, { headers }).then(res => res.json());
  let price = Number(data.data[0][1]) / 50;
  if (Math.abs(price - lastPrice) > 0.001) {
    lastPrice = price;
  }
  else {
    lastPrice = price;
    price += 0.001;
  }
  return price;
}
