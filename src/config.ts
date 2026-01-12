export const PAIRS = [
  {
    symbol: "ETH/USDT",
    price: "ETH",
    makerPrivateKey: Bun.env.MAKER_PRIVATE_KEY,
    takerPrivateKey: Bun.env.TAKER_PRIVATE_KEY,
    marketId: 1,
    pairId: "0x950c1bb15508369148679bf2921417929f1465c068c4b22a980c3c23535846c0",
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
    pairId: '0x7219b7b8ceab0580a3124c284f9bda81dfef3309f28e50c08df32711967a489d',
  },
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
    address: "0x21Bbda69f5464d53e77206fDffAE560549414392",
    decimals: 9,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 1000;
