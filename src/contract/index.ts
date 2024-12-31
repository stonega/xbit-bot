import type { Signer, TransactionResponse } from "ethers";
import BN from "bignumber.js";
import { Contract } from "ethers";
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
    tokenA: { address: string; decimals: number };
    tokenB: { address: string; decimals: number };
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
    const res = await this.contract
      .getFunction("placeOrderBuyB")
      .populateTransaction(pay, amount);
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  async createSellOrder(
    signer: Signer,
    { amount, receive }: { amount: bigint; receive: bigint },
  ): Promise<TransactionResponse> {
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
}
