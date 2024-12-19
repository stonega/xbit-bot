import { expect, test } from "bun:test";
import { getTargetPrice } from "../src/utils";

test("get tartget price", async () => {
  const price = await getTargetPrice();
  console.log({ price });
}, { timeout: 60000 });
