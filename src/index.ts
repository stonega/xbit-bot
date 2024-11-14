import { JsonRpcProvider, parseEther, Wallet } from "ethers";
import schedule from "node-schedule";
import { TradeApi } from "./contract";
import { betaTestnet } from "./contract/network";

function getPriceInscrease(): number {
  const random = Math.random();
  if (random < 0.1) {
    return Math.floor(Math.random()) - 2;
  }
  if (random < 0.8) {
    return Math.floor(Math.random()) + 1;
  }
  else {
    return Math.floor(Math.random() * 5) + 1;
  }
}

async function getPrice(): Promise<string> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=BOOL%2FUSDT").then(a => a.json());
  return result.data.latestPrice;
}

async function main(): Promise<void> {
  const currentNetwork = betaTestnet;
  const trade = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: currentNetwork.contracts.trade!,
    usdt: currentNetwork.tokens.usdt!,
  });
  if (!Bun.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required");
  }
  const wallet = new Wallet(Bun.env.PRIVATE_KEY!);
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  const signer = wallet.connect(provider);

  const currentPrice = await getPrice();

  console.debug(`[${new Date().toISOString()}] Current price: ${currentPrice}`);

  const price = (Number(currentPrice) + getPriceInscrease()).toString();

  const amount = 10 * Math.random();

  // Sell bool
  const receive = trade.calcUsdt(price, amount.toString());
  const sellRes = await trade.createSellOrder(signer, {
    amount: BigInt(parseEther(amount.toString())),
    receive,
  });
  sellRes.wait().then(() => {
    console.log(`[${new Date().toISOString()}] Sell order created, ${price} ${amount} BOL, ${receive} USDT`);
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  // Buy bool
  const pay = trade.calcUsdt(price, (amount + 1).toString());
  const res = await trade.createBuyOrder(signer, {
    amount: BigInt(parseEther(amount.toString())),
    pay,
  });

  res.wait().then(() => {
    console.log(`[${new Date().toISOString()}] Buy order created, ${price} ${amount} BOL, ${pay} USDT`);
  });
}

schedule.scheduleJob("*/10 * * * *", () => {
  console.log("Running task at:", new Date().toLocaleString());
  main().catch(console.error);
});
