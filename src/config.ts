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

export const priceMap: { [key: string]: string } = {
  "TBOL/USDC": "SOL",
  "STK/USDC": "BNB",
  "STK/BTU": "TON",
};

export const tradeMap: { [key: string]: string } = {
  "TBOL/USDC": "0xeca041b6ab360a1aab06c433838f295a73fb4d35",
  "STK/USDC": "0x721547fae7ad15b72aebfd74fefc4759345258df",
  "STK/BTU": "0x3a786c7345a06ad99e2d0e81a6d3a476721b3ba1",
};
