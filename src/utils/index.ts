// Generate target price based on sine
export function getTargetPrice(hours?: number): number {
  // Get current hour in UTC
  const hour = hours ?? Math.floor(new Date().getTime() / 1000 / 60 / 60);
  const epoch = Math.floor(hour / 40) - 12030;

  // Convert time to radians (40 hours = 2π)
  const radians = (hour % 40) * 2 * Math.PI / 40;

  // Generate sine wave between -1 and 1
  const sine = Math.sin(radians);

  // Add some random noise (±0.5)
  const noise = (Math.random() - 0.5);

  // Transform sine wave to range [2, 15] with noise
  const amplitude = (15 - 2) / 2; // Half the range
  const offset = (15 + 2) / 2; // Midpoint of range

  // Increase by epoch
  let price = offset + (sine * amplitude) + epoch * Math.random();

  // Add scaled noise (bigger noise when price is in middle range)
  const noiseFactor = Math.sin(Math.PI * (price - 2) / 13); // peaks in middle of range
  price += noise * noiseFactor;

  // Ensure price stays within bounds
  price = Math.min(Math.max(price, 2), 30);

  return Number(price.toFixed(2));
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
