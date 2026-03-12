import { test } from "bun:test";
import { getPrice, getTargetPrice } from "../src/utils";

test("get tartget price", async () => {
  const price = await getTargetPrice("SOL");
  console.log({ price });
}, { timeout: 60000 });

test("get order book", async () => {
  const price = await getPrice(4);
  console.log({ price });
}, { timeout: 60000 });
