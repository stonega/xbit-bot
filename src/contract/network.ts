export const betaTestnet = {
  baseUrl: "https://beta-api.boolscan.com/bool-network-beta",
  rpc: "https://betatest-rpc-node-http.bool.network",
  wss: "wss://betatest-rpc-node-ws.bool.network",
  chainId: 481,
  symbol: "tBOL",
  name: "Beta Testnet",
  value: "beta_testnet",
  feeRate: 3000,
  explorer: "https://beta-testnet.boolscan.com",
  tokens: {
    bool: {
      name: "BOOL",
      symbol: "tBOL",
      decimals: 18,
      icon: "/images/bool_circle_fill_pink.png",
      address: "",
    },
    usdt: {
      name: "USDT",
      address: "0xf9007019014c8CdFA78f21e97995F6a4D3493729",
      icon: "/images/usdt.png",
      symbol: "USDT",
      decimals: 6,
    },
  },
};

export const ultraLiquid = {
  rpc: "https://node-rpc.safeliquid.ai",
  chainId: 11101,
  symbol: "GAS",
  name: "SafeLiquid Alpha Mainnet",
  value: "safeliquid_alpha_mainnet",
  explorer: "https://scan.safeliquid.ai/",
  icon: "https://bool.network/bool-network-orange.png",
  tokens: {
    con: {
      name: "CON",
      symbol: "CON",
      decimals: 18,
      icon: "",
      address: "0xEe894F7816e633828eF3ADea553F79C4d066b75f",
    },
    usdt: {
      name: "USDT",
      address: "0x0aE4644f26B16cB51b56fa7c3150d48d61e4c573",
      icon: "/images/usdc.png",
      symbol: "USDT",
      decimals: 6,
      price: "USDC",
    },
  },
};
