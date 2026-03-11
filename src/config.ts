export const PAIRS = [
  {
    symbol: "ETH/USDC",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 3,
    pairId: "0x950c1bb15508369148679bf2921417929f1465c068c4b22a980c3c23535846c0",
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
    pairId: '0x7219b7b8ceab0580a3124c284f9bda81dfef3309f28e50c08df32711967a489d',
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
