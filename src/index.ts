import { formatUnits, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { AsyncTask, SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { TradeApi } from "./contract";
import { betaTestnet } from "./contract/network";

function getPriceInscrease(base: number): number {
  const random = Math.random();
  if (random < 0.8) {
    return Math.max(Math.random() * base, 0.05);
  }
  else {
    return Math.random() + base;
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

function getTargetPrice(): number {
  // Get current hour in UTC
  const hour = new Date().getUTCHours();

  // Convert time to radians (24 hours = 2π)
  const radians = (hour / 40) * 2 * Math.PI;

  // Generate sine wave between -1 and 1
  const sine = Math.sin(radians);

  // Add some random noise (±0.5)
  const noise = (Math.random() - 0.5);

  // Transform sine wave to range [2, 15] with noise
  const amplitude = (15 - 2) / 2; // Half the range
  const offset = (15 + 2) / 2; // Midpoint of range
  let price = offset + (sine * amplitude);

  // Add scaled noise (bigger noise when price is in middle range)
  const noiseFactor = Math.sin(Math.PI * (price - 2) / 13); // peaks in middle of range
  price += noise * noiseFactor;

  // Ensure price stays within bounds
  price = Math.min(Math.max(price, 2), 15);

  return Number(price.toFixed(2));
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

  if (role === "maker") {
    // Sell bool
    // Calculate price
    const nextSellPrice = Math.abs(Number(buyPrice || sellPrice) + getPriceInscrease(0.2));

    const price = nextSellPrice.toString();
    const amount = 0.8 * Math.random();
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
    // Calculate price
    const nextBuyPrice = Math.abs(Number(sellPrice || buyPrice) - getPriceInscrease(0.1));
    const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
    const res = await trade.createBuyOrder(signer, {
      amount: BigInt(parseEther(amount.toString())),
      pay,
    });

    res.wait().then(() => {
      console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} BOL, ${formatUnits(pay, currentNetwork.tokens.usdt.decimals)} USDT`);
    });
  }

  if (role === "taker") {
    const target = getTargetPrice();
    console.debug(`[${new Date().toISOString()}] Target price: ${target}`);
    if (Number(buyPrice || sellPrice) < Number(target)) {
      // Buy bool to increase price
      // Calculate price
      const nextBuyPrice = Math.abs(Number(sellPrice || buyPrice) + getPriceInscrease(1));
      const amount = 1 + Math.random();
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
      const res = await trade.createBuyOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        pay,
      });

      res.wait().then(() => {
        console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} BOL, ${formatUnits(pay, currentNetwork.tokens.usdt.decimals)} USDT`);
      });
    }
    else {
      // Sell bool
      const nextSellPrice = Math.abs(Number(buyPrice || sellPrice) - getPriceInscrease(1));
      const price = nextSellPrice.toString();
      const amount = 1 + Math.random();
      const receive = trade.calcUsdt(price, amount.toString());
      const sellRes = await trade.createSellOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      sellRes.wait().then(() => {
        console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
      });

      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
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

const role = Bun.env.ROLE || "maker";
const duration = role === "MAKER" ? 2 * 60 : 3 * 60;
const job = new SimpleIntervalJob({ seconds: duration, runImmediately: true }, task);

scheduler.addSimpleIntervalJob(job);
