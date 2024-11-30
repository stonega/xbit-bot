export async function getTargetPrice(): Promise<number> {
  const offset = 1170;
  const hour = Math.floor(new Date().getTime() / 1000 / 60 / 60) * 3600 - 3600 * offset;
  const priceResult = await fetch(`https://mempool.space/api/v1/historical-price`).then(a => a.json());
  const prices = priceResult.prices;
  const startHour = 1732582800 - 3600 * offset;
  const startBtcPrice = prices.find((a: any) => a.time === startHour)?.USD;
  const endBtcPrice = prices.find((a: any) => a.time === hour)?.USD;
  const startPrice = 5;
  // const noise = Math.random() * 0.2 + 1;
  const targetPrice = startPrice * (1 + (endBtcPrice - startBtcPrice) / startBtcPrice * 2);
  return Number(targetPrice.toFixed(2));
}

// Get sell and buy price from order-books
export async function getPrice(): Promise<{ buyPrice: string; sellPrice: string }> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=BOOL%2FUSDC").then(a => a.json());
  const buyPrice = result.data.orderBuyBList[0]?.price;
  const sellPrice = result.data.orderSellBList[0]?.price;
  return {
    buyPrice,
    sellPrice,
  };
}
