import type { Signer, TransactionResponse } from "ethers";
import BN from "bignumber.js";
import { withRetry } from "../utils";
import { SpotApi, type SpotToken } from "./spotApi";

const SPENDER_ADDRESS = "0x6d6F646C617070726F76652f0000000000000000";

export class TradeApi extends SpotApi {
  constructor({
    rpc,
    pair,
    baseToken,
    quoteToken,
    subaccount,
  }: {
    rpc: string;
    pair: string;
    baseToken: SpotToken;
    quoteToken: SpotToken;
    subaccount: string;
  }) {
    super({ rpc, pair, baseToken, quoteToken });
    this.subaccount = subaccount;
  }

  readonly subaccount: string;

  get pairSymbol(): string {
    return `${this.baseToken.symbol}/${this.quoteToken.symbol}`.toUpperCase();
  }

  async createBuyOrder(
    signer: Signer,
    { amount, pay }: { amount: bigint; pay: bigint },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        return this.placeLimitOrderBuy(signer, {
          subaccount: this.subaccount,
          quoteAmount: pay,
          baseAmount: amount,
        });
      },
      3,
      1000,
      (error, attempt) =>
        console.error(
          `[${this.pairSymbol}${new Date().toISOString()}] Failed to create buy order (attempt ${attempt}/3):`,
          error.message,
        ),
    );
  }

  async createSellOrder(
    signer: Signer,
    { amount, receive }: { amount: bigint; receive: bigint },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        return this.placeLimitOrderSell(signer, {
          subaccount: this.subaccount,
          quoteAmount: receive,
          baseAmount: amount,
        });
      },
      3,
      1000,
      (error, attempt) =>
        console.error(
          `[${this.pairSymbol}${new Date().toISOString()}] Failed to create sell order (attempt ${attempt}/3):`,
          error.message,
        ),
    );
  }

  async cancelOrder(
    signer: Signer,
    { orderId, type }: { orderId: bigint; type: "buy" | "sell" },
  ): Promise<TransactionResponse> {
    if (type === "buy") {
      return this.cancelOrderBuy(signer, {
        subaccount: this.subaccount,
        orderId,
      });
    }
    return this.cancelOrderSell(signer, {
      subaccount: this.subaccount,
      orderId,
    });
  }

  async getActiveOrders() {
    return this.userActiveSpotOrders(this.subaccount);
  }

  calcUsdt(price: string, baseAmount: string): bigint {
    const p = BN(price).toFixed(2, BN.ROUND_UP);
    const amount = BN(baseAmount).toFixed(2, BN.ROUND_UP);
    const receive = BN(amount)
      .times(BN(p))
      .times(10 ** this.quoteToken.decimals)
      .toFixed(0);
    return BigInt(receive);
  }

  async approveToken(signer: Signer): Promise<void> {
    const address = await signer.getAddress();
    if (this.baseToken.address) {
      const isApproved = await super.isApprove({
        contract: this.baseToken.address,
        approvedAddress: SPENDER_ADDRESS,
        address,
        amount: 100000000000n,
      });
      if (!isApproved) {
        await super.approve(signer, {
          contract: this.baseToken.address,
          approvedAddress: SPENDER_ADDRESS,
        });
      }
    }
    if (this.quoteToken.address) {
      const isApproved = await super.isApprove({
        contract: this.quoteToken.address,
        approvedAddress: SPENDER_ADDRESS,
        address,
        amount: 1000000000000n,
      });
      if (!isApproved) {
        await super.approve(signer, {
          contract: this.quoteToken.address,
          approvedAddress: SPENDER_ADDRESS,
        });
      }
    }
  }
}

// Re-export SpotApi for direct usage
export { SpotApi, type SpotToken, type SpotOrder, type SpotMarketSpec } from "./spotApi";
