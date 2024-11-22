import { formatUnits, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { AsyncTask, SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { TradeApi } from "./contract";
import { betaTestnet } from "./contract/network";

function getPriceInscrease(base: number): number {
  const random = Math.random();
  if (random < 0.9) {
    return Math.random() * base;
  }
  else {
    return Math.floor(Math.random() * 2);
  }
}

async function getPrice(): Promise<{ buyPrice: string; sellPrice: string }> {
  const result = await fetch("https://test-api.safematrix.io/bool-stake-reward/blockchain/order-books?pair=BOOL%2FUSDC").then(a => a.json());
  const buyPrice = result.data.orderBuyBList[0]?.price;
  const sellPrice = result.data.orderSellBList[0]?.price;
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
  const role = Bun.env.ROLE || "maker";
  const wallet = new Wallet(Bun.env.PRIVATE_KEY!);
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  const signer = wallet.connect(provider);

  const { buyPrice, sellPrice } = await getPrice();

  if (!buyPrice && !sellPrice) {
    console.log("No orders");
    return;
  }

  console.debug(`[${new Date().toISOString()}] BuyPrice: ${buyPrice} SellPrice: ${sellPrice}`);

  // Sell bool
  /// Calculate price
  const nextSellPrice
    = role === "maker"
      ? Math.abs(Number(buyPrice || sellPrice) + getPriceInscrease(0.1))
      : Math.abs(Number(buyPrice || sellPrice)) - getPriceInscrease(0.2);

  const price = nextSellPrice.toString();
  let amount = Math.random();
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
  const nextBuyPrice
    = role === "maker"
      ? Math.abs(Number(sellPrice || buyPrice) - getPriceInscrease(0.1))
      : Math.abs(Number(sellPrice || buyPrice) + getPriceInscrease(0.5));
  amount = role === "maker" ? Math.random() : (1 + Math.random());

  const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
  const res = await trade.createBuyOrder(signer, {
    amount: BigInt(parseEther(amount.toString())),
    pay,
  });

  res.wait().then(() => {
    console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} BOL, ${formatUnits(pay, currentNetwork.tokens.usdt.decimals)} USDT`);
  });
}

const scheduler = new ToadScheduler();

const task = new Task(
  "simple task",
  () => {
    main();
  },
  (err: Error) => {
    console.log(err);
  },
);

const duration = Bun.env.ROLW === "maker" ? 60 * 2 : 60 * 3;
const job = new SimpleIntervalJob({ seconds: duration, runImmediately: true }, task);

scheduler.addSimpleIntervalJob(job);
