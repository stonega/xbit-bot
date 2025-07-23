import { expect, test } from "bun:test";
import { getPrice, getTargetPrice } from ".";

test("get tartget price", async () => {
  const price = await getTargetPrice("SOL");
  console.log({ price });
}, { timeout: 60000 });

test("get order book", async () => {
  const price = await getPrice(1);
  console.log({ price });
}, { timeout: 60000 });
