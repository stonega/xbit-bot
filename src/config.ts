export const PAIRS = [
  {
    symbol: "ETH/USDC",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 3,
    takerAccount: Bun.env.TAKER_ACCOUNT,
    makerAccount: Bun.env.MAKER_ACCOUNT,
    decimals: 18,
  },
  {
    symbol: "SOL/USDC",
    price: "SOL",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY_SOL,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY_SOL,
    marketId: 4,
    takerAccount: Bun.env.TAKER_ACCOUNT_SOL,
    makerAccount: Bun.env.MAKER_ACCOUNT_SOL,
    decimals: 9,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 1000;
