export const betaTestnet = {
  baseUrl: 'https://beta-api.boolscan.com/bool-network-beta',
  rpc: 'https://betatest-rpc-node-http.bool.network',
  wss: 'wss://betatest-rpc-node-ws.bool.network',
  chainId: 481,
  symbol: 'tBOL',
  name: 'Beta Testnet',
  value: 'beta_testnet',
  feeRate: 3000,
  explorer: 'https://beta-testnet.boolscan.com',
  contracts: {
    trade: '0x1E3f592CfcEbE18824e19Cb6Ca7Ba8f91939Bca4',
  },
  tokens: {
    bool: {
      name: 'BOOL',
      symbol: 'tBOL',
      decimals: 18,
      icon: '/images/bool_circle_fill_pink.png',
      address: '',
    },
    usdt: {
      name: 'USDT',
      address: '0x3fFa3237b30b15eF3368132a2AC9D262d8502bB3',
      icon: '/images/usdt.png',
      symbol: 'USDT',
      decimals: 18,
    },
  },
};
