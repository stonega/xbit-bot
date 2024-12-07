const offsetMap: Map<string, number> = new Map();
export async function getTargetPrice(): Promise<number> {
  const currentHour = Math.floor(new Date().getTime() / 1000 / 60 / 60 / 4).toString();
  let offset = offsetMap.get(currentHour);
  const reset = Math.random() < 0.1;
  if (!offset || reset) {
    offsetMap.set(currentHour, Math.floor(Math.random() * 1000) + 250);
    offset = offsetMap.get(currentHour);
  }
  const priceResult = await fetch(`https://mempool.space/api/v1/historical-price`).then(a => a.json());
  const prices = priceResult.prices;
  const startHour = 1732582800 - 3600 * offset!;
  const startBtcPrice = prices.find((a: any) => a.time === startHour)?.USD;
  const startPrice = 3;
  // const noise = Math.random() * 0.2 + 1;
  const targetPrice = startPrice * (1 + (startBtcPrice - 50000) / 50000);
  return Number(targetPrice.toFixed(4));
}

// Get sell and buy price from order-books
export async function getPrice(): Promise<{ buyPrice: string; sellPrice: string }> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=TBOL%2FUSDC").then(a => a.json());
  const buyPrice = result.data.orderBuyBList[0]?.price;
  const sellPrice = result.data.orderSellBList[0]?.price;
  return {
    buyPrice,
    sellPrice,
  };
}
