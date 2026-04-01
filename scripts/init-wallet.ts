import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Contract, ethers, MaxUint256, zeroPadValue } from "ethers";
import { getWalletInitNetworkConfig, parseArgs } from "./init-wallet-config.mjs";

const PROJECT_ROOT = process.cwd();
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.preview",
  ".env.preview.local",
  ".env.production",
  ".env.production.local",
];

for (const envFile of ENV_FILES) {
  const envPath = path.join(PROJECT_ROOT, envFile);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const LENDING_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000450";
const SUBACCOUNT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000451";

const QUOTA_AMOUNT = 100000;
const USDC_DECIMALS = 6;
const USDC_TOKEN_ID = 3;
const POLL_INTERVAL_MS = 10_000;
const BRIDGE_TIMEOUT_MS = 5 * 60 * 1000;

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
];

const BRIDGE_ABI = [
  "function bridgeOut(uint32 dstChainId, uint256 tokenId, uint256 amount, bytes32 dstRecipient, address refundAddress, bytes32 salt, bytes customData, bytes signature) payable returns (bytes32)",
];

const SUBACCOUNT_ABI = [
  "function initializeSubaccount(bytes name)",
  "function setSpotMargin(address subaccount, bool enable_spot_margin)",
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "userStats",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "subaccount",
                type: "address",
              },
              {
                internalType: "bytes",
                name: "name",
                type: "bytes",
              },
            ],
            internalType: "struct Subaccount.SimpleSubaccount[]",
            name: "subaccounts",
            type: "tuple[]",
          },
          {
            internalType: "uint64",
            name: "if_staked_quote_asset_amount",
            type: "uint64",
          },
          {
            internalType: "uint16",
            name: "number_of_sub_accounts",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "number_of_sub_accounts_created",
            type: "uint16",
          },
        ],
        internalType: "struct Subaccount.UserStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const LENDING_ABI = [
  "function deposit(address subaccount, bytes asset, uint128 amount)",
  "function buyQuota(address account, uint32 quota)",
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bridgeUsdcFromFaucet({ address, amount, networkConfig }) {
  const bridgeApiUrl = process.env.NUXT_PUBLIC_BRIDGE_API_URL;
  const faucetPrivateKey = process.env.FAUCET_PRIVATE_KEY;

  if (!bridgeApiUrl) {
    throw new Error("NUXT_PUBLIC_BRIDGE_API_URL is not configured");
  }

  if (!faucetPrivateKey) {
    throw new Error("FAUCET_PRIVATE_KEY is not configured");
  }

  const requestedAmount = ethers.parseUnits(amount, USDC_DECIMALS);
  const sepoliaProvider = new ethers.JsonRpcProvider(networkConfig.sepoliaRpc);
  const faucetWallet = new ethers.Wallet(faucetPrivateKey, sepoliaProvider);
  const tokenContract = new Contract(networkConfig.sepoliaUsdcAddress, ERC20_ABI, faucetWallet);

  const faucetBalance = await tokenContract.balanceOf(faucetWallet.address);
  if (faucetBalance < requestedAmount) {
    throw new Error("Insufficient USDC balance in faucet");
  }

  const allowance = await tokenContract.allowance(faucetWallet.address, networkConfig.sepoliaConsumer);
  if (allowance < requestedAmount) {
    const approveTx = await tokenContract.approve(networkConfig.sepoliaConsumer, MaxUint256);
    await approveTx.wait(1);
  }

  const salt = ethers.hexlify(ethers.randomBytes(32));
  const signatureResponse = await fetch(`${bridgeApiUrl}/sign-bridge/sign-bridge-out`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      domain: {
        name: "Channel",
        version: "1",
        chain_id: networkConfig.sepoliaChainId,
        verifying_contract: networkConfig.sepoliaConsumer,
      },
      params: {
        dst_chain_id: networkConfig.deepxChainId,
        token_id: String(USDC_TOKEN_ID),
        amount: requestedAmount.toString(),
        sender: faucetWallet.address,
        dst_recipient: zeroPadValue(address, 32).toString(),
        refund_address: faucetWallet.address,
        salt,
        custom_data_hex: "0x",
      },
    }),
  });

  if (!signatureResponse.ok) {
    throw new Error(`Bridge signature request failed with status ${signatureResponse.status}`);
  }

  const { signature } = await signatureResponse.json();
  if (!signature) {
    throw new Error("Bridge signature response did not include a signature");
  }

  const bridgeContract = new Contract(networkConfig.sepoliaConsumer, BRIDGE_ABI, faucetWallet);
  const bridgeTx = await bridgeContract.bridgeOut(
    networkConfig.deepxChainId,
    USDC_TOKEN_ID,
    requestedAmount,
    zeroPadValue(address, 32),
    faucetWallet.address,
    salt,
    "0x",
    signature,
  );
  await bridgeTx.wait(1);

  return bridgeTx.hash;
}

async function getSubaccounts(contract, address) {
  try {
    const userStats = await contract.userStats(address);
    return userStats.subaccounts ?? [];
  }
  catch (error) {
    const message = error?.shortMessage ?? error?.message ?? String(error);
    if (message.includes("UserStats does not exist for address")) {
      return [];
    }

    throw error;
  }
}

async function waitForUsdcBalance(address, usdcContract, initialBalance, requiredIncrease) {
  const deadline = Date.now() + BRIDGE_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const currentBalance = await usdcContract.balanceOf(address);
    if (currentBalance >= initialBalance + requiredIncrease) {
      return currentBalance;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for USDC to arrive on DeepX");
}

const MAX_RETRIES = 5;

async function initWallet({ walletPrivateKey, skipFaucet, networkConfig, walletIndex, amount }) {
  const prefix = walletIndex != null ? `[Wallet #${walletIndex + 1}] ` : "";
  const log = msg => console.log(`${prefix}${msg}`);

  const provider = new ethers.JsonRpcProvider(networkConfig.deepxRpc);
  const signer = new ethers.Wallet(walletPrivateKey, provider);
  const address = await signer.getAddress();

  const usdcContract = new Contract(networkConfig.deepxUsdcAddress, ERC20_ABI, signer);
  const subaccountContract = new Contract(SUBACCOUNT_CONTRACT_ADDRESS, SUBACCOUNT_ABI, signer);
  const lendingContract = new Contract(LENDING_CONTRACT_ADDRESS, LENDING_ABI, signer);

  log(`Network: ${networkConfig.label} (${networkConfig.runtimeNetwork})`);
  log(`Wallet: ${address}`);
  log(`Private Key: ${walletPrivateKey}`);

  if (skipFaucet) {
    log("Skipping faucet bridge (--skip-faucet)");
  }
  else {
    log(`Bridging ${amount} USDC from faucet to wallet...`);

    const initialUsdcBalance = await usdcContract.balanceOf(address);
    const bridgeTxHash = await bridgeUsdcFromFaucet({ address, amount, networkConfig });
    log(`Bridge submitted: ${bridgeTxHash}`);
    log("Waiting for bridged USDC on DeepX...");

    const walletBalanceAfterBridge = await waitForUsdcBalance(
      address,
      usdcContract,
      initialUsdcBalance,
      ethers.parseUnits(amount, USDC_DECIMALS),
    );
    log(`Wallet USDC balance: ${ethers.formatUnits(walletBalanceAfterBridge, USDC_DECIMALS)} USDC`);
  }

  let subaccounts = await getSubaccounts(subaccountContract, address);
  if (subaccounts.length === 0) {
    log("No subaccount found. Creating one...");
    const createTx = await subaccountContract.initializeSubaccount(ethers.toUtf8Bytes("CLI Account"));
    await createTx.wait(1);
    subaccounts = await getSubaccounts(subaccountContract, address);
  }

  const targetSubaccount = subaccounts[0]?.subaccount;
  log(`Subaccount address: ${targetSubaccount}`);
  if (!targetSubaccount) {
    throw new Error("Subaccount creation did not produce a subaccount");
  }

  log(`Buying ${QUOTA_AMOUNT} quota for ${address}...`);
  const quotaTx = await lendingContract.buyQuota(address, QUOTA_AMOUNT);
  await quotaTx.wait(1);

  const walletUsdcBalance = await usdcContract.balanceOf(address);
  if (walletUsdcBalance <= 0n) {
    throw new Error("No USDC available to deposit");
  }

  log(`Depositing ${ethers.formatUnits(walletUsdcBalance, USDC_DECIMALS)} USDC to subaccount ${targetSubaccount}...`);
  const depositTx = await lendingContract.deposit(
    targetSubaccount,
    ethers.toUtf8Bytes("usdc"),
    walletUsdcBalance,
  );
  await depositTx.wait(1);

  log(`Enabling spot margin mode for subaccount ${targetSubaccount}...`);
  const spotMarginTx = await subaccountContract.setSpotMargin(targetSubaccount, true);
  await spotMarginTx.wait(1);

  log(`Subaccount address: ${targetSubaccount}`);

  return { address, privateKey: walletPrivateKey, subaccount: targetSubaccount };
}

async function initWalletWithRetry({ walletPrivateKey, skipFaucet, networkConfig, walletIndex, amount }) {
  const prefix = walletIndex != null ? `[Wallet #${walletIndex + 1}] ` : "";

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await initWallet({ walletPrivateKey, skipFaucet, networkConfig, walletIndex, amount });
    }
    catch (error) {
      const message = error?.shortMessage ?? error?.message ?? String(error);
      if (attempt < MAX_RETRIES) {
        console.error(`${prefix}Attempt ${attempt}/${MAX_RETRIES} failed: ${message}. Retrying...`);
        await sleep(2000 * attempt);
      }
      else {
        console.error(`${prefix}All ${MAX_RETRIES} attempts failed. Last error: ${message}`);
        throw error;
      }
    }
  }
}

async function main() {
  const { showHelp, privateKey, skipFaucet, network, count, amount } = parseArgs(process.argv.slice(2));
  if (showHelp) {
    console.log("Usage: yarn init-wallet [--private-key <hex-private-key>] [--network devnet|testnet] [--skip-faucet] [--count <number>] [--amount <number>]");
    return;
  }

  const networkConfig = getWalletInitNetworkConfig(network);

  if (privateKey) {
    const normalizedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
    await initWalletWithRetry({ walletPrivateKey: normalizedPrivateKey, skipFaucet, networkConfig, amount });
    return;
  }

  const walletCount = count;
  console.log(`Generating ${walletCount} wallet(s)...\n`);

  const wallets = Array.from({ length: walletCount }, () => {
    const randomWallet = ethers.Wallet.createRandom();
    return randomWallet.privateKey;
  });

  const results = await Promise.allSettled(
    wallets.map((pk, index) =>
      initWalletWithRetry({ walletPrivateKey: pk, skipFaucet, networkConfig, walletIndex: index, amount }),
    ),
  );

  console.log("\n========== Summary ==========");
  let hasFailure = false;
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled") {
      const { address, privateKey: pk, subaccount } = result.value;
      console.log(`[Wallet #${i + 1}] ✅ Address: ${address} | Subaccount: ${subaccount} | Private Key: ${pk}`);
    }
    else {
      hasFailure = true;
      const message = result.reason?.shortMessage ?? result.reason?.message ?? String(result.reason);
      console.error(`[Wallet #${i + 1}] ❌ Failed: ${message}`);
    }
  }

  if (hasFailure) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
