import type { Signer, TransactionResponse } from "ethers";
import BN from "bignumber.js";
import { Contract } from "ethers";
import { withRetry } from "../utils";
import { TradeABI, TradeNativeABI } from "./abi";
import { BaseEvmApi } from "./api";

export class TradeApi extends BaseEvmApi {
  constructor({
    rpc,
    tokenA,
    tokenB,
    contract,
  }: {
    rpc: string;
    tokenA: { address: string; decimals: number; symbol: string };
    tokenB: { address: string; decimals: number; symbol: string };
    contract: string;
  }) {
    super(rpc);
    this.contractAddress = contract;
    this.tokenA = tokenA;
    this.tokenB = tokenB;
  }

  readonly tokenA;
  readonly tokenB;
  readonly contractAddress: string;

  get pair(): string {
    return (`${this.tokenA.symbol}/${this.tokenB.symbol}`).toUpperCase();
  }

  get contract(): Contract {
    if (this.tokenA.address) {
      return new Contract(this.contractAddress, TradeABI, this.provider);
    }
    return new Contract(this.contractAddress, TradeNativeABI, this.provider);
  }

  async createBuyOrder(
    signer: Signer,
    { amount, pay }: { amount: bigint; pay: bigint },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        const res = await this.contract
          .getFunction("placeOrderBuyB")
          .populateTransaction(pay, amount);
        await signer.estimateGas(res);
        return signer.sendTransaction(res);
      },
      3, // 3 retries
      1000, // 2 second delay between retries
      (error, attempt) => console.error(`[${this.pair}${new Date().toISOString()}] Failed to create buy order (attempt ${attempt}/3):`, error.message),
    );
  }

  async createSellOrder(
    signer: Signer,
    { amount, receive }: { amount: bigint; receive: bigint },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        let res;
        const isNative = !this.tokenA.address;
        if (isNative) {
          res = await this.contract
            .getFunction("placeOrderSellB")
            .populateTransaction(receive, { value: amount });
        }
        else {
          res = await this.contract
            .getFunction("placeOrderSellB")
            .populateTransaction(receive, amount);
        }
        await signer.estimateGas(res);
        return signer.sendTransaction(res);
      },
      3, // 3 retries
      1000, // 2 second delay between retries
      (error, attempt) => console.error(`[${this.pair}${new Date().toISOString()}] Failed to create sell order (attempt ${attempt}/3):`, error.message),
    );
  }

  async cancelOrder(
    signer: Signer,
    { orderId, type }: { orderId: bigint; type: "buy" | "sell" },
  ): Promise<TransactionResponse> {
    const res = await this.contract
      .getFunction(type === "buy" ? "cancelOrderBuyB" : "cancelOrderSellB")
      .populateTransaction(orderId);
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

  async approveToken(signer: Signer): Promise<void> {
    if (this.tokenA.address) {
      const isApprove = await super.isApprove({
        contract: this.tokenA.address!,
        approvedAddress: this.contractAddress,
        address: await signer.getAddress(),
        amount: 100n,
      });
      if (!isApprove) {
        await super.approve(signer, {
          contract: this.tokenA.address!,
          approvedAddress: this.contractAddress,
        });
      }
    }
    const isApprove = await super.isApprove({
      contract: this.tokenB.address!,
      approvedAddress: this.contractAddress,
      address: await signer.getAddress(),
      amount: 100n,
    });
    if (!isApprove) {
      await super.approve(signer, {
        contract: this.tokenB.address!,
        approvedAddress: this.contractAddress,
      });
    }
  }
}
