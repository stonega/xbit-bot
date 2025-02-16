export const PAIRS = [
  {
    symbol: "TDEF/USDC",
    price: "SOL",
    taker: Bun.env.TBOL_TAKER_PRIVATE_KEY,
    maker: Bun.env.TBOL_MAKER_PRIVATE_KEY,
  },
  {
    symbol: "STK/USDC",
    price: "BNB",
    taker: Bun.env.STK_TAKER_PRIVATE_KEY,
    maker: Bun.env.STK_MAKER_PRIVATE_KEY,
  },
  {
    symbol: "STK/BTU",
    price: "TON",
    taker: Bun.env.BTU_TAKER_PRIVATE_KEY,
    maker: Bun.env.BTU_MAKER_PRIVATE_KEY,
  },
];

// Max order amount for taker
export const TAKER_CAPACITY = 300;
