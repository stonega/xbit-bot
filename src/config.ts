export const PAIRS = [
  {
    symbol: "STK/USDC1",
    price: "SOL",
    taker: Bun.env.TON_TAKER_PRIVATE_KEY,
    maker: Bun.env.TON_MAKER_PRIVATE_KEY,
    increase: false,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 300;
