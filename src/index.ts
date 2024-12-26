import { formatUnits, JsonRpcProvider, parseEther, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { TradeApi } from "./contract";
import { ultraLiquidTestnet } from "./contract/network";
import { getPrice, getTargetPrice } from "./utils";

function getPriceTakerInscrease(): number {
  return Math.max(Math.random() * 0.02, 0.01);
}

function getPriceMakerInscrease(): number {
  return Math.max(Math.random() * 0.04, 0.02);
}

async function main(): Promise<void> {
  const currentNetwork = ultraLiquidTestnet;
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
  const target = await getTargetPrice();
  if (Number.isNaN(target)) {
    return;
  }

  console.debug(`[${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${buyPrice} BuyAmount: ${buyAmount} SellPrice: ${sellPrice} SellAmount: ${sellAmount}`);

  if (role === "maker") {
    if (Math.abs(Number(buyPrice) - target) < 0.001) {
      console.debug(`[${new Date().toISOString()}] No action required`);
      return;
    }
    // Sell bool
    // Calculate price
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());
    const amount = 0.4 * Math.random() + 0.8;
    if (Number(buyPrice) < Number(target)) {
    // Buy bool
    // Calculate price
      const nextBuyPrice = Math.abs(Number(buyPrice) - getPriceMakerInscrease());
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
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());
      const sellRes = await trade.createSellOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      sellRes.wait().then(() => {
        console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!sellPrice) {
        const sellRes = await trade.createSellOrder(signer, {
          amount: BigInt(parseEther((amount * 2).toString())),
          receive,
        });
        sellRes.wait().then(() => {
          console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  if (role === "taker") {
    let priceIncrease = getPriceTakerInscrease();
    if (Math.abs(Number(buyPrice) - target) < 0.001) {
      console.debug(`[${new Date().toISOString()}] Target price reached`);
      // If target price reached, add small random price increase
      priceIncrease = 0.001 + Math.random() * 0.001;
    }
    if (Number(buyPrice) < Number(target)) {
      // Buy bool to increase price
      let amount = 4 + Math.random() * 4;
      if (priceIncrease > 0 && !Number.isNaN(Number(sellAmount))) {
        if (Number(sellAmount) < 8) {
          amount = Math.max(Number(sellAmount), amount);
        }
        else {
          amount = 8;
        }
      }
      let nextBuyPrice = Math.abs(Number(sellPrice ?? buyPrice) + priceIncrease);
      if (target < nextBuyPrice && priceIncrease > 0.002) {
        nextBuyPrice = target;
      }
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
      const res = await trade.createBuyOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        pay,
      });
      await res.wait();
      console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} BOL, ${formatUnits(pay, currentNetwork.tokens.usdt.decimals)} USDT`);
    }
    else {
      // Sell bool
      let amount = 4 + Math.random() * 4;
      if (priceIncrease > 0 && !Number.isNaN(Number(buyAmount))) {
        if (Number(buyAmount) < 8) {
          amount = Math.max(Number(buyAmount), amount);
        }
        else {
          amount = 8;
        }
      }
      let nextSellPrice = Math.abs(Number(buyPrice) - priceIncrease);
      if (target > nextSellPrice && priceIncrease > 0.002) {
        nextSellPrice = target;
      }
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());
      const sellRes = await trade.createSellOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      await sellRes.wait();
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} BOL, ${formatUnits(receive, currentNetwork.tokens.usdt.decimals)} USDT`);
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
const duration = role === "MAKER" ? 7 : 10;
const job = new SimpleIntervalJob({ seconds: duration, runImmediately: true }, task);

scheduler.addSimpleIntervalJob(job);
