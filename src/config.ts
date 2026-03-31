export function getPairs(env: any) {
  return [
    {
      symbol: "ETH-USDC",
      price: "ETH",
      makerPrivateKey: env.MAKER_PRIVATE_KEY,
      takerPrivateKey: env.TAKER_PRIVATE_KEY,
      marketId: 3,
      takerAccount: env.TAKER_ACCOUNT,
      makerAccount: env.MAKER_ACCOUNT,
      decimals: 18,
      minSizeDecimals: 3,
    },
    {
      symbol: "SOL-USDC",
      price: "SOL",
      makerPrivateKey: env.MAKER_PRIVATE_KEY_SOL,
      takerPrivateKey: env.TAKER_PRIVATE_KEY_SOL,
      marketId: 4,
      takerAccount: env.TAKER_ACCOUNT_SOL,
      makerAccount: env.MAKER_ACCOUNT_SOL,
      decimals: 9,
      minSizeDecimals: 2,
    },
  ];
}

// Max order amount for taker
export const TAKER_CAPACITY = 100;
