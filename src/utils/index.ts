import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import { PerpABI } from "../contract/perp";

/**
 * Generic retry function wrapper
 * @param fn - Function to retry
 * @param retries - Number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @param onError - Optional callback for error handling
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  onError?: (error: Error, attempt: number) => void,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    }
    catch (error) {
      lastError = error as Error;

      if (onError) {
        onError(lastError, attempt);
      }
      else {
        console.error(`Attempt ${attempt} failed:`, lastError.message);
      }

      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Failed after ${retries} attempts. Last error: ${lastError!.message}`);
}

/**
 * Get orderbook data from xbit api
 */
export async function getPrice(marketId: number, env: any): Promise<{ buyPrice: string; sellPrice: string; buyAmount: string; sellAmount: string }> {
  const baseAppUrl = env.NETWORK === "deepx_testnet" ? "https://testnet-api.deepx.fi" : "https://devnet-api.deepx.fi";
  const result = await fetch(`${baseAppUrl}/v1/blockchain/perp/order-books?market_id=${marketId}`).then(a => a.json());
  if (!result.data.orderBuyList) {
    console.log({ error: result.msg });
  }
  const buyList = result.data.orderBuyList.sort((a: any, b: any) => b.price - a.price);
  const sellList = result.data.orderSellList.sort((a: any, b: any) => a.price - b.price);
  const buyPrice = buyList[0]?.price;
  const buyAmount = buyList[0]?.qty;
  const sellPrice = sellList[0]?.price;
  const sellAmount = sellList[0]?.qty;
  return {
    buyPrice,
    buyAmount,
    sellPrice,
    sellAmount,
  };
}

/**
 * Get pair contract address from xbit api
 */
export async function getPairContract(pair: string, env: any): Promise<{ address: string; pairId: string | undefined }> {
  const baseAppUrl = env.NETWORK === "deepx_testnet" ? "https://testnet-api.deepx.fi" : "https://devnet-api.deepx.fi";
  const result = await fetch(`${baseAppUrl}/perp/blockchain/perp/pairs`).then(a => a.json());
  const pairInfo = result.data.find((a: any) => a.name === pair)!;
  return {
    address: pairInfo.address,
    pairId: pairInfo.pairId,
  };
}

/**
 * Fetch oracle price from perp contract
 */
export async function getTargetPrice(rpc: string, marketId: number): Promise<number> {
  const provider = new JsonRpcProvider(rpc);
  provider._getConnection().timeout = 10000;
  const contract = new Contract("0x000000000000000000000000000000000000044E", PerpABI, provider);
  const marketData = await contract.perpMarkets!(marketId);
  const price = Number(formatUnits(marketData.oracle_price, 6));
  return Number(price.toFixed(4));
}
