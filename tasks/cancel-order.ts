import type { TransactionResponse } from "ethers";
import { JsonRpcProvider, Wallet } from "ethers";
import { PAIRS } from "../src/config"; // Ensure this path and export are correct, added PairConfig type
import { TradeApi } from "../src/contract";
import { ultraLiquid } from "../src/contract/network"; // Ensure this path and export are correct
import { getPairContract, withRetry } from "../src/utils"; // Ensure this path and export are correct

interface OrderItem {
  pair: string;
  orderId: number;
  type: number; // API type, e.g., 1 for BUY order (buying base asset CON)
  price: string;
  qty: string;
  filledQty: string;
  status: number; // API status, e.g., 0 for open
  time: number;
  originalU: string;
  filledU: string;
  originalB: string;
  txHash: string;
  fee: string;
}

interface UserOrdersApiResponseData {
  items: OrderItem[];
  pageNo: number;
  pageSize: number;
  totalPage: number;
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
}

interface UserOrdersApiResponse {
  code: number;
  msg: string;
  data?: UserOrdersApiResponseData; // Make data optional to handle API errors gracefully
  fail: boolean;
}

async function fetchOpenOrders(walletAddress: string, pairSymbol: string): Promise<OrderItem[]> {
  const apiUrl = `https://app.safeliquid.ai/backend/bool-stake-reward/blockchain/user-orders?address=${walletAddress}&pageNo=1&pageSize=500`;
  console.log(`[${pairSymbol} ${new Date().toISOString()}] Fetching orders for ${walletAddress} from ${apiUrl}`);
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[${pairSymbol} ${new Date().toISOString()}] Failed to fetch orders from API: ${response.statusText}`);
      return [];
    }
    const data = (await response.json()) as UserOrdersApiResponse;
    if (data.code !== 200 || !data.data || !data.data.items) {
      console.error(`[${pairSymbol} ${new Date().toISOString()}] API returned error or unexpected data for orders: ${data.msg || "No data items"}`);
      return [];
    }
    // Filter for orders that are still open (status 0) and match the pairSymbol
    const openOrders = data.data.items.filter(
      order => order.status === 0 && order.pair.toUpperCase() === pairSymbol.toUpperCase(),
    );
    console.log(`[${pairSymbol} ${new Date().toISOString()}] Found ${openOrders.length} open orders matching the pair. Total orders: ${data.data.totalCount}`);
    return openOrders;
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${pairSymbol} ${new Date().toISOString()}] Error fetching or parsing orders:`, errorMessage);
    return [];
  }
}

async function cancelOrdersForWallet(
  pairConfig: { symbol: string; maker: string; taker: string; trade?: string; pairId?: string }, // Using PairConfig type from your config
  role: "maker" | "taker",
): Promise<void> {
  const currentNetwork = ultraLiquid;
  const walletKey = role === "maker" ? pairConfig.maker : pairConfig.taker;

  if (!walletKey) {
    console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] No ${role} wallet key configured for this pair.`);
    return;
  }

  const [tokenASymbol, tokenBSymbol] = pairConfig.symbol.split("/");
  const tokenA = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === tokenASymbol.toUpperCase());
  const tokenB = Object.values(currentNetwork.tokens).find(t => t.symbol.toUpperCase() === tokenBSymbol.toUpperCase());

  if (!tokenA || !tokenB) {
    console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Token configuration not found for ${pairConfig.symbol}.`);
    return;
  }

  let { trade: contractAddress, pairId } = pairConfig;

  if (!contractAddress || !pairId) {
    console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Contract address or pairId missing, attempting to fetch...`);
    try {
      const pairInfo = await getPairContract(pairConfig.symbol);
      contractAddress = pairInfo.address;
      pairId = pairInfo.pairId;
      console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Set contract ${contractAddress} pairId ${pairId}`);
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Failed to get pair contract info:`, errorMessage);
      return;
    }
  }

  if (!contractAddress) {
    console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Contract address could not be determined.`);
    return;
  }

  const trade = new TradeApi({
    rpc: currentNetwork.rpc,
    contract: contractAddress,
    pairId,
    tokenA,
    tokenB,
  });

  const provider = new JsonRpcProvider(currentNetwork.rpc);
  try {
    // Set RPC timeout to 10 seconds to prevent hanging requests
    (provider._getConnection() as any).timeout = 10000;
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[${pairConfig.symbol} ${new Date().toISOString()}] Could not set provider timeout: ${errorMessage}`);
  }

  const wallet = new Wallet(walletKey, provider);
  const walletAddress = await wallet.getAddress();
  console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Using ${role} wallet: ${walletAddress}`);

  const openOrders = await fetchOpenOrders(walletAddress, pairConfig.symbol);

  if (openOrders.length === 0) {
    console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] No open orders found for ${walletAddress} on pair ${pairConfig.symbol} to cancel.`);
    return;
  }

  console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Found ${openOrders.length} open order(s) to cancel for ${walletAddress} on ${pairConfig.symbol}.`);
  const nonce = await provider.getTransactionCount(walletAddress);
  console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Nonce: ${nonce}`);
  for (const [index, order] of openOrders.entries()) {
    try {
      // This corresponds to an order placed via `placeOrderBuyB` in the contract.
      // TradeApi's cancelOrder function expects "buy" for cancelOrderBuyB, "sell" for cancelOrderSellB.
      const orderTypeString: "buy" | "sell" = order.type === 1 ? "buy" : "sell";

      console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] ${index + 1}/${openOrders.length} Cancelling ${role} ${orderTypeString} order ${order.orderId}...`);

      await withRetry(async () => {
        await trade.cancelOrder(wallet, {
          orderId: BigInt(order.orderId),
          type: orderTypeString,
        }, {
          nonce: nonce + index,
        });
      }, 3, 1000, (error, attempt) => {
        console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Failed to cancel order ${order.orderId} (attempt ${attempt}/3):`, error.message);
      });

      // const receipt = await txResponse.wait(); // Wait for transaction confirmation
      //   if (receipt && receipt.status === 1) {
      //     console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Order ${order.orderId} cancelled successfully. Tx: ${receipt.hash}`);
      //   }
      //   else {
      //     console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Order ${order.orderId} cancellation failed or reverted. Tx: ${receipt?.hash}`);
      //   }

      // Add a small delay to avoid overwhelming the node or API rate limits
      // await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${pairConfig.symbol} ${new Date().toISOString()}] Failed to cancel order ${order.orderId}:`, errorMessage);
      break;
    }
  }
  console.log(`[${pairConfig.symbol} ${new Date().toISOString()}] Finished cancellation attempts for ${role} wallet ${walletAddress}.`);
}

// Example of how to run this task:
// This function can be called from your main application logic or a script runner.
export async function runCancellationTask(): Promise<void> {
  console.log("Starting order cancellation task...");

  // Determine which pairs and roles to target. This is an example.
  // You might want to make this configurable, e.g., via command-line arguments or a config file.
  const targetRole: "maker" | "taker" = "maker"; // or "taker"

  if (PAIRS.length === 0) {
    console.log("No pairs configured in PAIRS array. Exiting cancellation task.");
    return;
  }

  for (const pair of PAIRS) {
    console.log(`\nProcessing cancellations for pair: ${pair.symbol}, role: ${targetRole}`);
    // Get trading contract address if not already set
    const pairInfo = await getPairContract(pair.symbol);
    await cancelOrdersForWallet({ symbol: pair.symbol, maker: pair.maker!, taker: pair.taker!, trade: pairInfo.address, pairId: pairInfo.pairId }, targetRole);

    // Optional: Add a longer delay between processing different pairs
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Example for a specific pair and role:
  // const specificPairSymbol = "CON/USDT"; // example
  // const specificPair = PAIRS.find(p => p.symbol.toUpperCase() === specificPairSymbol.toUpperCase());
  // if (specificPair) {
  //   await cancelOrdersForWallet(specificPair, "maker");
  // } else {
  //   console.log(`Pair ${specificPairSymbol} not found in PAIRS configuration.`);
  // }

  console.log("\nOrder cancellation task finished.");
}

// If this script is intended to be run directly (e.g., `node tasks/cancel-order.js` after compilation):
if (require.main === module) {
  runCancellationTask().catch((error) => {
    console.error("Unhandled error in cancellation task:", error);
  });
}
