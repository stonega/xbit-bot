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
  contracts: {
    trade: "0x1a66db14b533992c7e7e3df3e3959b90803621c4",
  },
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
  rpc: "https://ultra-test-node-rpc.bool.network",
  chainId: 483,
  symbol: "tBOL",
  name: "Ultra Liquid Testnet",
  value: "ultra_liquid_testnet",
  explorer: "https://beta-testnet.boolscan.com",
  icon: "https://bool.network/bool-network-orange.png",
  contracts: {
    trade: "0xeca041b6ab360a1aab06c433838f295a73fb4d35",
  },
  tokens: {
    bool: {
      name: "BOL",
      symbol: "tBOL",
      decimals: 18,
      icon: "https://bool.network/bool-orange.png",
      address: "",
    },
    usdt: {
      name: "USDC",
      address: "0xaba94d6c512f9a37a3b12ae5d3ed171c5d0b475a",
      icon: "/images/usdc.png",
      symbol: "USDC",
      decimals: 6,
    },
  },
};
