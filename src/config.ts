export const PAIRS = [
  {
    symbol: "ETH/USDC",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 3,
    pairId: "0xc3f5b2f3656333509760d98f8f7d3022b6ee28eb9c37e805f6c2db245103ba1b",
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
    pairId: '0x8a4ddc173cfc745cb7617fa4be54172d2e3bdc2aa5aaa61b92123c0ad998604f',
  },
];

export const TOKENS = [
  {
    symbol: "ETH",
    address: "0xD6c9c7078fc1Fe5065bc85f4743FAB219Bb053fd",
    decimals: 18,
  },
  {
    symbol: "USDC",
    address: "0x273Bc0743CeD7c5508015461E60C256f880926Cb",
    decimals: 6,
  },
  {
    symbol: "SOL",
    address: "0xBBdefA290B10D6762E44e5581A3533BF831A8C5C",
    decimals: 9,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 1000;
