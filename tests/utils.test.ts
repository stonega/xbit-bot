import { expect, test } from "bun:test";
import { getMinutePrice } from "../src/utils";
import { generateStockData } from "../src/utils/price";

test("get tartget price", async () => {
  const startDate = "2025-04-07T00:00:00.000Z";
  const price = generateStockData({
    days: 7,
    startDate,
    volatility: 0.05,
    seed: 42,
    trend: 0.001,
  });
  const anotherPrice = generateStockData({
    days: 7,
    startDate,
    seed: 42,
    volatility: 0.05,
    trend: 0.001,
  });
  console.log({ price: price["1m"] });
  expect(price["1m"]).toEqual(anotherPrice["1m"]);
  const targetPrice = getMinutePrice();
  console.log({ targetPrice });
  expect(targetPrice).toBeNumber();
});

// test("get order book", async () => {
//   const price = await getPrice("STK/USDC");
//   console.log({ price });
// }, { timeout: 60000 });
