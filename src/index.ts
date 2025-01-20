import { formatUnits, JsonRpcProvider, parseEther, parseUnits, Wallet } from "ethers";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";
import { pairs } from "./config";
import { TradeApi } from "./contract";
import { ultraLiquidTestnet } from "./contract/network";
import { getPrice, getTargetPrice } from "./utils";

function getPriceTakerInscrease(): number {
  return Math.max(Math.random() * 0.02, 0.01);
}

function getPriceMakerInscrease(): number {
  return Math.max(Math.random() * 0.04, 0.02);
}

async function main(pair: { price: string; symbol: string; trade: string; taker?: string; maker?: string }, role: "maker" | "taker"): Promise<void> {
  const currentNetwork = ultraLiquidTestnet;
  const tokenA = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.symbol.split("/")[0])!;
  const tokenB = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === pair.symbol.split("/")[1])!;
  const trade = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: pair.trade,
    tokenA,
    tokenB,
  });
  const provider = new JsonRpcProvider(currentNetwork.rpc);
  // Set rpc timeout to 60s
  provider._getConnection().timeout = 10000;
  const { buyPrice, sellPrice, buyAmount, sellAmount } = await getPrice(pair.symbol);

  if (!buyPrice && !sellPrice) {
    console.log(`[${pair.symbol}${new Date().toISOString()}]No orders`);
    return;
  }
  const target = await getTargetPrice(pair.price);
  if (Number.isNaN(target)) {
    return;
  }

  console.debug(`[${pair.symbol}${new Date().toISOString()}] TargePrice: ${target} BuyPrice: ${buyPrice} BuyAmount: ${buyAmount} SellPrice: ${sellPrice} SellAmount: ${sellAmount}`);

  if (role === "maker") {
    if (!pair.maker) {
      console.log(`[${pair.symbol}${new Date().toISOString()}] No maker wallet found`);
    }
    const makerWallet = new Wallet(pair.maker!);
    const maker = makerWallet.connect(provider);
    const amount = 0.4 * Math.random() + 0.8;
    await trade.approveToken(maker);

    // If no buy order, create buy order with target price
    if (!buyPrice) {
      // If no buy order, create buy order
      const pay = trade.calcUsdt(target.toString(), amount.toString());
      await trade.createBuyOrder(maker, {
        amount: BigInt(parseUnits("10", tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${target} 10 ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.symbol}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return;
    }
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] No action required`);
      return;
    }
    const nextSellPrice = Math.abs(Number(buyPrice) + getPriceMakerInscrease());
    if (Number(buyPrice) < Number(target)) {
    // Buy bool
    // Calculate price
      const nextBuyPrice = Math.abs(Number(buyPrice) - getPriceMakerInscrease());
      const pay = trade.calcUsdt(nextBuyPrice.toString(), amount.toString());
      await trade.createBuyOrder(maker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.symbol}`);
    }
    else {
      const price = nextSellPrice.toString();
      const receive = trade.calcUsdt(price, amount.toString());
      await trade.createSellOrder(maker, {
        amount: BigInt(parseEther(amount.toString())),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!sellPrice) {
      // If no sell order, create sell order
      const price = Number(buyPrice) + getPriceMakerInscrease() * 2;
      const receive = trade.calcUsdt(price.toString(), amount.toString());
      await trade.createSellOrder(maker, {
        amount: BigInt(parseUnits("10", tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} 10 ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (role === "taker") {
    if (!pair.taker) {
      console.log(`[${pair.symbol}${new Date().toISOString()}] No taker wallet`);
    }
    const takerWallet = new Wallet(pair.taker!);
    const taker = takerWallet.connect(provider);
    await trade.approveToken(taker);
    const priceIncrease = getPriceTakerInscrease();
    if (!buyPrice) {
      return;
    }
    if (Math.abs(Number(buyPrice) - target) < 0.0001) {
      console.debug(`[${pair.symbol}${new Date().toISOString()}] Target price reached`);
      const buyAmount = 0.5;
      const price = buyPrice.toString();
      const receive = trade.calcUsdt(price, buyAmount.toString());
      await trade.createSellOrder(taker, {
        amount: BigInt(parseUnits(buyAmount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${buyAmount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
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
      await trade.createBuyOrder(taker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        pay,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Buy order created, price ${nextBuyPrice} ${amount} ${tokenA.symbol}, ${formatUnits(pay, tokenB.decimals)} ${tokenB.decimals}`);
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
      await trade.createSellOrder(taker, {
        amount: BigInt(parseUnits(amount.toString(), tokenA.decimals)),
        receive,
      });
      console.log(`[${pair.symbol}${new Date().toISOString()}] Sell order created, price ${price} ${amount} ${tokenA.symbol}, ${formatUnits(receive, tokenB.decimals)} ${tokenB.symbol}`);
    }
  }
}

const scheduler = new ToadScheduler();

const makerTask = new Task(
  "maker tasks",
  () => {
    pairs.forEach((pair) => {
      main(pair, "maker").catch((err: Error) => {
        console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
      });
    });
  },
  (err: Error) => {
    console.log(err);
  },
);
const takerTask = new Task(
  "taker tasks",
  () => {
    pairs.forEach((pair) => {
      main(pair, "taker").catch((err: Error) => {
        console.log(`[${pair.symbol}${new Date().toISOString()}] ${err}`);
      });
    });
  },
  (err: Error) => {
    console.log(err);
  },
);

const makerJob = new SimpleIntervalJob({ seconds: 10, runImmediately: true }, makerTask);
const takerJob = new SimpleIntervalJob({ seconds: 20, runImmediately: true }, takerTask);

scheduler.addSimpleIntervalJob(makerJob);
scheduler.addSimpleIntervalJob(takerJob);
