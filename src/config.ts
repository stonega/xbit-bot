export const PAIRS = [
  {
    symbol: "CON/USDT",
    price: "SOL",
    taker: Bun.env.CON_TAKER_PRIVATE_KEY,
    maker: Bun.env.CON_MAKER_PRIVATE_KEY,
    increase: false,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 1000;
