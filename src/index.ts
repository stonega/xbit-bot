import { formatUnits, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { TradeApi } from "./contract";
import { betaTestnet } from "./contract/network";
import { getPrice, getTargetPrice } from "./utils";

function getPriceTakerInscrease(): number {
  const random = Math.random();
  if (random <= 0.85) {
    return Math.max(Math.random() * 0.01, 0.005);
  }
  return -Math.max(Math.random() * 0.02, 0.005);
}

function getPriceMakerInscrease(): number {
  return Math.max(Math.random() * 0.04, 0.02);
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

  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice();

  if (!buyPrice && !sellPrice) {
    console.log("No orders");
    return;
  }

  console.debug(`[${new Date().toISOString()}] BuyPrice: ${buyPrice} SellPrice: ${sellPrice}`);

  if (role === "maker") {
    // Sell bool
    // Calculate price
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());

    const price = nextSellPrice.toString();
    const amount = 0.6 * Math.random() + 0.8;
    const receive = trade.calcUsdt(price, amount.toString());
    const sellRes = await trade.createSellOrder(signer, {
      amount: BigInt(parseEther(amount.toString())),
      receive,
    });
    sellRes.wait().then(() => {
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Buy bool
    // Calculate price
    const nextBuyPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());
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
    let target = await getTargetPrice();
    if (Number.isNaN(target)) {
      return;
    }
    while (Math.abs(Number(buyPrice) - Number(target)) < 0.1) {
      target = await getTargetPrice(true);
    }
    console.debug(`[${new Date().toISOString()}] Target price: ${target}`);
    if (Number(buyPrice) < Number(target)) {
      let amount = 1 + Math.random();
      const priceIncrease = getPriceTakerInscrease();
      if (priceIncrease > 0 && !Number.isNaN(Number(sellAmount))) {
        if (Number(sellAmount) < 10) {
          amount = Math.max(Number(sellAmount), amount);
        }
      }
      // Buy bool to increase price
      // Calculate price
      const nextBuyPrice = Math.abs(Number(sellPrice ?? buyPrice) + priceIncrease);
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
      let amount = 1 + Math.random();
      const priceIncrease = getPriceTakerInscrease();
      if (priceIncrease > 0 && !Number.isNaN(Number(buyAmount))) {
        if (Number(buyAmount) < 10) {
          amount = Math.max(Number(buyAmount), amount);
        }
      }
      const nextSellPrice = Math.abs(Number(buyPrice) - priceIncrease);
      const price = nextSellPrice.toString();
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
const duration = role === "MAKER" ? 25 : 45;
const job = new SimpleIntervalJob({ seconds: duration, runImmediately: true }, task);

scheduler.addSimpleIntervalJob(job);
