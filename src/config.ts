export const pairs = [
  {
    symbol: "TBOL/USDC",
    price: "SOL",
    trade: "0xc4a132639d775502e37621274959d8be877c65d0",
    taker: Bun.env.TBOL_TAKER_PRIVATE_KEY,
    maker: Bun.env.TBOL_MAKER_PRIVATE_KEY,
  },
  {
    symbol: "STK/USDC",
    price: "BNB",
    trade: "0x4856e15c4c2372f4a43295eeada4020a395a4340",
    taker: Bun.env.STK_TAKER_PRIVATE_KEY,
    maker: Bun.env.STK_MAKER_PRIVATE_KEY,
  },
  {
    symbol: "STK/BTU",
    price: "TON",
    trade: "0x6a72e6efe3e54dcd7fb8af4ae7c7ba00189ed064",
    taker: Bun.env.BTU_TAKER_PRIVATE_KEY,
    maker: Bun.env.BTU_MAKER_PRIVATE_KEY,
  },
];
