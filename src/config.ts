export const config = {
  // Maker is used to place orders around the current price
  maker: {
    // Task interval is seconds
    interval: 30,
    amountBase: 0.6,
    amountRandom: 0.6,
    price: {
      // Random noise factor (0-1)
      noiseFactor: 0.5,
      // Upper price fluctuation range
      upperRange: 0.2,
      // Lower price fluctuation range
      lowerRange: 0.2,
    },
  },
  // Price volatility settings
};
