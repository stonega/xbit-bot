import { expect, test } from "bun:test";
import { getTargetPrice } from "../src/utils";

test("get tartget price", async () => {
  let price = await getTargetPrice();
  console.log({ price });
  const buyPrice = 4.2;
  while (Math.abs(Number(buyPrice) - Number(price)) < 1) {
    price = await getTargetPrice(true);
  }
  console.log(price);
}, { timeout: 60000 });
