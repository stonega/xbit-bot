import { expect, test } from "bun:test";
import { getTargetPrice } from "../src/utils";

test("get tartget price", () => {
  const hours = 481280;
  const epoch = 40;
  for (let i = 0; i < 10; i++) {
    const result = [];
    for (let j = 0; j < 40; j++) {
      const price = getTargetPrice(hours + j + i * epoch);
      result.push([i, (hours + j + i * epoch) % 40, price]);
    }
    console.log(result.join(" | "));
  }
});
