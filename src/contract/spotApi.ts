import type { Signer, TransactionResponse } from "ethers";
import BN from "bignumber.js";
import { Contract } from "ethers";
import { withRetry } from "../utils";
import { BaseEvmApi } from "./api";
import { TradeABI } from "./tradeAbi";

const CONTRACT_ADDRESS = "0x000000000000000000000000000000000000044d";

export class SpotApi extends BaseEvmApi {
  constructor({
    rpc,
    tokenA,
    tokenB,
    pairId,
  }: {
    rpc: string;
    pairId?: string;
    tokenA: { address: string; decimals: number; symbol: string };
    tokenB: { address: string; decimals: number; symbol: string };
  }) {
    super(rpc);
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    this.pairId = pairId;
  }

  readonly tokenA;
  readonly tokenB;
  readonly pairId: string | undefined;

  get pair(): string {
    return (`${this.tokenA.symbol}/${this.tokenB.symbol}`).toUpperCase();
  }

  get contract(): Contract {
    return new Contract(CONTRACT_ADDRESS, TradeABI, this.provider);
  }

  async createBuyOrder(
    signer: Signer,
    { amount, pay, subAccountId }: { amount: bigint; pay: bigint; subAccountId?: string },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        let res;
        if (subAccountId) {
          res = await this.contract
            .getFunction("subaccountPlaceOrderBuyB")
            .populateTransaction(subAccountId, this.pairId, pay, amount);
        }
        else {
          res = await this.contract
            .getFunction("placeOrderBuyB")
            .populateTransaction(this.pairId, pay, amount);
        }
        await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: 500000 });
      },
      3, // 3 retries
      1000, // 2 second delay between retries
      (error, attempt) => console.error(`[${this.pair}${new Date().toISOString()}] Failed to create buy order (attempt ${attempt}/3):`, error.message),
    );
  }

  async createSellOrder(
    signer: Signer,
    { amount, receive, subAccountId }: { amount: bigint; receive: bigint; subAccountId?: string },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        let res;
        if (subAccountId) {
          res = await this.contract
            .getFunction("subaccountPlaceOrderSellB")
            .populateTransaction(subAccountId, this.pairId, receive, amount);
        }
        else {
          res = await this.contract
            .getFunction("placeOrderSellB")
            .populateTransaction(this.pairId, receive, amount);
        }
        await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: 500000 });
      },
      3, // 3 retries
      1000, // 2 second delay between retries
      (error, attempt) => console.error(`[${this.pair}${new Date().toISOString()}] Failed to create sell order (attempt ${attempt}/3):`, error.message),
    );
  }

  async cancelOrder(
    signer: Signer,
    { orderId, type, subAccountId }: { orderId: bigint; type: "buy" | "sell"; subAccountId?: string },
  ): Promise<TransactionResponse> {
    let res;
    if (subAccountId) {
      res = await this.contract
        .getFunction(type === "buy" ? "subaccountCancelOrderBuyB" : "subaccountCancelOrderSellB")
        .populateTransaction(subAccountId, this.pairId, orderId);
    }
    else {
      res = await this.contract
        .getFunction(type === "buy" ? "cancelOrderBuyB" : "cancelOrderSellB")
        .populateTransaction(this.pairId, orderId);
    }
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  calcUsdt(price: string, bool: string): bigint {
    const receive = BN(bool)
      .times(BN(price))
      .times(10 ** this.tokenB.decimals)
      .toFixed(0);
    return BigInt(receive);
  }
}
