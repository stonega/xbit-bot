import { formatUnits, JsonRpcProvider, parseEther, Wallet } from "ethers";
import schedule from "node-schedule";
import { TradeApi } from "./contract";
import { betaTestnet } from "./contract/network";

function getPriceInscrease(): number {
  const random = Math.random();
  if (random < 0.8) {
    return Math.random();
  }
  else {
    return Math.floor(Math.random() * 2);
  }
}

async function getPrice(): Promise<{ buyPrice: string; sellPrice: string }> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=BOOL%2FUSDC").then(a => a.json());
  const buyPrice = result.data.orderBuyBList[0].price;
  const sellPrice = result.data.orderSellBList[0].price;
  return {
    buyPrice,
    sellPrice,
  };
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

  const { buyPrice, sellPrice } = await getPrice();

  console.debug(`[${new Date().toISOString()}], buyPrice: ${buyPrice}, sellPrice: ${sellPrice}`);

  /// Calculate price
  const nextSellPrice = Math.abs(Number(buyPrice) + getPriceInscrease());

  const price = nextSellPrice.toString();

  const amount = 2 * Math.random();

  // Sell bool
  const receive = trade.calcUsdt(price, amount.toString());
  const sellRes = await trade.createSellOrder(signer, {
    amount: BigInt(parseEther(amount.toString())),
    receive,
  });
  sellRes.wait().then(() => {
    console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  // Buy bool
  /// Calculate price
  const nextBuyPrice = Math.abs(Number(sellPrice) - getPriceInscrease());

  const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
  const res = await trade.createBuyOrder(signer, {
    amount: BigInt(parseEther(amount.toString())),
    pay,
  });

  res.wait().then(() => {
    console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} BOL, ${formatUnits(pay, currentNetwork.tokens.usdt.decimals)} USDT`);
  });
}

schedule.scheduleJob("*/5 * * * *", () => {
  console.log("Running task at:", new Date().toLocaleString());
  main().catch(console.error);
});
