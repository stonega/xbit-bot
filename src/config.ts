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
  {
    symbol: "SOL/USDT",
    price: "SOL",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY_SOL,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY_SOL,
    marketId: 3,
    takerAccount: Bun.env.TAKER_ACCOUNT_SOL,
    makerAccount: Bun.env.MAKER_ACCOUNT_SOL,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 300;
