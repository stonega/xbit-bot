export const PAIRS = [
  {
    symbol: "ETH/USDT",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 1,
    takerAccount: Bun.env.TAKER_ACCOUNT,
    makerAccount: Bun.env.MAKER_ACCOUNT,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 300;
