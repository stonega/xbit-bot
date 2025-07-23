export const PAIRS = [
  {
    symbol: "ETH/USDT",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 1,
    pairId: "0xadfb870c1aa7e97bd82e5823253a0ff2fb8a4342345e2365da4fe0829c65bba2",
    takerAccount: Bun.env.TAKER_ACCOUNT,
    makerAccount: Bun.env.MAKER_ACCOUNT,
    decimals: 18,
  },
  {
    symbol: "SOL/USDT",
    price: "SOL",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY_SOL,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY_SOL,
    marketId: 3,
    takerAccount: Bun.env.TAKER_ACCOUNT_SOL,
    makerAccount: Bun.env.MAKER_ACCOUNT_SOL,
    decimals: 9,
    pairId: "0x4e1af3b5045cc8c4feeb72e106dcb9dd2d2f0921111009fbb90d175057158932",
  },
];

export const TOKENS = [
  {
    symbol: "ETH",
    address: "0x86bdE473a14BC71E5c145BB9eE723eF7c3cCCe6F",
    decimals: 18,
  },
  {
    symbol: "USDT",
    address: "0x51514b74B36985d469bD57DA0DAB4C41d4Ff7257",
    decimals: 6,
  },
  {
    symbol: "SOL",
    address: "0x8a77F53BCdC4780BE8C64F341913d552B13D32fA",
    decimals: 9,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 10000;
