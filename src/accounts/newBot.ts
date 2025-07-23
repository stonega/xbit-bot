import fs from "node:fs/promises";
import { JsonRpcProvider, parseEther, toUtf8Bytes, Wallet } from "ethers";
import { PAIRS } from "../config";
import { AccountApi } from "../contract/accountApi";
import { ultraLiquidTestnet } from "../contract/network";
import { PerpApi } from "../contract/perpApi";

export async function createNewBot() {
  // 1. Create a wallet
  const wallet = Wallet.createRandom();
  console.log("Created wallet:");
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Private Key: ${wallet.privateKey}`);

  // 2. Transfer gas to the wallet from the main wallet
  const provider = new JsonRpcProvider(ultraLiquidTestnet.rpc);
  const mainWalletPrivateKey = Bun.env.MAIN_WALLET_PRIVATE_KEY;

  if (!mainWalletPrivateKey) {
    throw new Error("MAIN_WALLET_PRIVATE_KEY is not set in environment variables.");
  }

  const mainWallet = new Wallet(mainWalletPrivateKey, provider);
  console.log(`\nFunding new wallet from main wallet: ${mainWallet.address}`);

  const tx = await mainWallet.sendTransaction({
    to: wallet.address,
    value: parseEther("0.1"), // Send 0.1 ETH
  });

  console.log(`Transaction sent: ${tx.hash}`);
  await tx.wait();
  console.log("Transaction confirmed.");

  // 3. User wallet to create a subaccount
  const pair = PAIRS[0];
  const tradeApi = new AccountApi({
    rpc: ultraLiquidTestnet.rpc,
  });

  const subaccountName = `bot-${Date.now()}`;
  const subaccountNameBytes = toUtf8Bytes(subaccountName);

  console.log(`\nCreating subaccount with name: ${subaccountName}`);

  const newWallet = new Wallet(wallet.privateKey, provider);
  const initTx = await tradeApi.initializeSubaccount(
    newWallet,
    subaccountNameBytes,
  );
  await initTx.wait();

  const stats = await tradeApi.userStats(wallet.address);
  const subaccount = stats.subaccounts.find(
    (s: { name: string }) => s.name === subaccountName,
  );

  if (!subaccount) {
    throw new Error("Could not find new subaccount.");
  }

  console.log(`Subaccount Address: ${subaccount.subaccount}`);

  // 4, Deposit ETH to the subaccount
  const perpApi = new PerpApi({
    rpc: ultraLiquidTestnet.rpc,
    marketId: pair.marketId!,
    token: ultraLiquidTestnet.tokens.usdt,
  });

  console.log("\nDepositing 0.01 ETH to subaccount...");
  const depositTx = await perpApi.deposit(newWallet, {
    subaccount: subaccount.subaccount,
    amount: parseEther("0.01"),
  });
  await depositTx.wait();
  console.log("Deposit confirmed.");

  // 5. Save the above info to a json file
  const botInfo = {
    address: wallet.address,
    privateKey: wallet.privateKey,
    subaccount: subaccount.subaccount,
  };

  const fileName = `bot-${wallet.address}.json`;
  await fs.writeFile(fileName, JSON.stringify(botInfo, null, 2));
  console.log(`\nBot information saved to ${fileName}`);
}
