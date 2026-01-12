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

export const ultraLiquidTestnet = {
  rpc: "https://testnetx-rpc.deepdex.finance",
  chainId: 4833,
  symbol: "tBOL",
  name: "Ultra Liquid Testnet",
  value: "ultra_liquid_testnet",
  explorer: "https://explorer-testnet.deepdex.finance",
  icon: "https://bool.network/bool-network-orange.png",
  tokens: {
    bool: {
      name: "TDEF",
      symbol: "TDEF",
      decimals: 18,
      icon: "https://bool.network/bool-orange.png",
      address: "",
    },
    usdt: {
      name: "USDC",
      address: "0xBBdefA290B10D6762E44e5581A3533BF831A8C5C",
      icon: "/images/usdc.png",
      symbol: "USDC",
      decimals: 6,
      price: "USDC",
    },
  },
};
