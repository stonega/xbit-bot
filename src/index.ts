import { formatUnits, JsonRpcProvider, parseEther, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { priceMap, tradeMap } from "./config";
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
  const pair = Bun.env.PAIR!;
  const tokenA = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.split("/")[0])!;
  const tokenB = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.split("/")[1])!;
  const trade = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: tradeMap[pair],
    tokenA,
    tokenB,
  });
  if (!Bun.env.PRIVATE_KEY) {
    throw new Error("PRIVATE_KEY is required");
  }
  const role = Bun.env.ROLE || "maker";
  const wallet = new Wallet(Bun.env.PRIVATE_KEY!);
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  // Set rpc timeout to 60s
  provider._getConnection().timeout = 10000;
  const signer = wallet.connect(provider);

  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair);

  if (!buyPrice && !sellPrice) {
    console.log("No orders");
    return;
  }
  const target = await getTargetPrice(priceMap[pair]);
  if (Number.isNaN(target)) {
    return;
  }

  console.debug(`[${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${buyPrice} BuyAmount: ${buyAmount} SellPrice: ${sellPrice} SellAmount: ${sellAmount}`);

  if (role === "maker") {
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${new Date().toISOString()}] No action required`);
      return;
    }
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());
    const amount = 0.4 * Math.random() + 0.8;
    if (Number(buyPrice) < Number(target)) {
    // Buy bool
    // Calculate price
      const nextBuyPrice = Math.abs(Number(buyPrice) - getPriceMakerInscrease());
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
      await trade.createBuyOrder(signer, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.symbol}`);
    }
    else {
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());
      await trade.createSellOrder(signer, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!sellPrice) {
      // If no sell order, create sell order
      const price = Number(buyPrice) + getPriceMakerInscrease() * 2;
      const receive = trade.calcUsdt(price.toString(), amount.toString());
      await trade.createSellOrder(signer, {
        amount: BigInt(parseUnits("10", tokenA.decimals)),
        receive,
      });
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} 10 ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (role === "taker") {
    const priceIncrease = getPriceTakerInscrease();
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${new Date().toISOString()}] Target price reached`);
      const buyAmount = 0.5;
      const price = buyPrice.toString();
      const receive = trade.calcUsdt(price, buyAmount.toString());
      await trade.createSellOrder(signer, {
        amount: BigInt(parseUnits(buyAmount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${buyAmount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
      return;
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
      if (target < nextBuyPrice) {
        nextBuyPrice = target;
      }
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
      await trade.createBuyOrder(signer, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.decimals}`);
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
      if (target > nextSellPrice) {
        nextSellPrice = target;
      }
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());
      await trade.createSellOrder(signer, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
    }
  }
}

const scheduler = new ToadScheduler();

const task = new Task(
  "simple task",
  () => {
    main().catch((err: Error) => {
      console.log(err);
    });
  },
  (err: Error) => {
    console.log(err);
  },
);

const role = Bun.env.ROLE || "maker";
const duration = role === "MAKER" ? 7 : 10;
const job = new SimpleIntervalJob({ seconds: duration, runImmediately: true }, task);

scheduler.addSimpleIntervalJob(job);
