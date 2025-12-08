export const PAIRS = [
  {
    symbol: "ETH/USDT",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 1,
    pairId: "0x7cf219b32b35000e20677b2c149c92b785bd8417c3c0834376a8a1df31734d6a",
    takerAccount: Bun.env.TAKER_ACCOUNT,
    makerAccount: Bun.env.MAKER_ACCOUNT,
    decimals: 18,
  },
  // {
  //   symbol: "SOL/USDT",
  //   price: "SOL",
  //   makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY_SOL,
  //   takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY_SOL,
  //   marketId: 3,
  //   takerAccount: Bun.env.TAKER_ACCOUNT_SOL,
  //   makerAccount: Bun.env.MAKER_ACCOUNT_SOL,
  //   decimals: 9,
  //   pairId: "0x4e1af3b5045cc8c4feeb72e106dcb9dd2d2f0921111009fbb90d175057158932",
  // },
];

export const TOKENS = [
  {
    symbol: "ETH",
    address: "0x983D7366Ac7860809cA93b96ba3cA1640Cefc115",
    decimals: 18,
  },
  {
    symbol: "USDT",
    address: "0xB94e8cE66d708251C893d32B077eC634D5D44D16",
    decimals: 6,
  },
  {
    symbol: "SOL",
    address: "0x8a77F53BCdC4780BE8C64F341913d552B13D32fA",
    decimals: 9,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 1000;
