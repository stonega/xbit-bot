const NETWORK_ALIASES = {
  devnet: "deepx_devnet",
  deepx_devnet: "deepx_devnet",
  testnet: "deepx_testnet",
  deepx_testnet: "deepx_testnet",
  beta_testnet: "deepx_testnet",
};

const NETWORK_CONFIGS = {
  deepx_devnet: {
    runtimeNetwork: "deepx_devnet",
    label: "DeepX Devnet",
    deepxRpc: "https://devnet-rpc.deepx.fi",
    deepxUsdcAddress: "0x273Bc0743CeD7c5508015461E60C256f880926Cb",
    deepxChainId: 4835,
    sepoliaRpc: "https://sepolia.drpc.org",
    sepoliaConsumer: "0x69d16Cb50a268Cae33D45248C90f2499a4C0b243",
    sepoliaChainId: 11155111,
    sepoliaUsdcAddress: "0x31Bb9Ac76A1fA393Ef360c45770E32959DED8fa2",
  },
  deepx_testnet: {
    runtimeNetwork: "deepx_testnet",
    label: "DeepX Testnet",
    deepxRpc: "https://rpc-testnet.deepx.fi",
    deepxUsdcAddress: "0x273Bc0743CeD7c5508015461E60C256f880926Cb",
    deepxChainId: 4836,
    sepoliaRpc: "https://sepolia.drpc.org",
    sepoliaConsumer: "0xdD97551d940E3a054C599ce72119FFbb332dE80D",
    sepoliaChainId: 11155111,
    sepoliaUsdcAddress: "0x31Bb9Ac76A1fA393Ef360c45770E32959DED8fa2",
  },
};

export function normalizeWalletInitNetwork(network) {
  if (!network) {
    return "deepx_devnet";
  }

  return NETWORK_ALIASES[network] || "deepx_devnet";
}

export function getWalletInitNetworkConfig(network) {
  return NETWORK_CONFIGS[normalizeWalletInitNetwork(network)];
}

export function parseArgs(argv) {
  const showHelp = argv.includes("--help") || argv.includes("-h");
  const skipFaucet = argv.includes("--skip-faucet") || argv.includes("-s");
  const valueFlags = new Set(["--private-key", "-k", "--network", "-n", "--count", "-c", "--amount", "-a"]);

  const flagValue = (flags) => {
    const flagIndex = argv.findIndex(arg => flags.includes(arg));
    if (flagIndex < 0) {
      return "";
    }

    const value = argv[flagIndex + 1] ?? "";
    return value.startsWith("-") ? "" : value;
  };

  const privateKey = flagValue(["--private-key", "-k"]);
  const networkArg = flagValue(["--network", "-n"]);
  const countArg = flagValue(["--count", "-c"]);
  const amountArg = flagValue(["--amount", "-a"]);
  const positionalArgs = argv.filter((arg, index) => {
    if (arg.startsWith("-")) {
      return false;
    }

    const previousArg = argv[index - 1];
    return !valueFlags.has(previousArg);
  });

  return {
    showHelp,
    skipFaucet,
    privateKey: privateKey || positionalArgs[0] || "",
    network: normalizeWalletInitNetwork(networkArg || process.env.NUXT_PUBLIC_NETWORK),
    count: Math.max(1, Number.parseInt(countArg, 10) || 1),
    amount: String(Number.parseInt(amountArg, 10) || 100000),
  };
}
