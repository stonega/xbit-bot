import type { Signer, TransactionResponse } from "ethers";
import BN from "bignumber.js";
import { Contract } from "ethers";
import { withRetry } from "../utils";
import { OrderABI, TradeABI, TradeNativeABI } from "./abi";
import { BaseEvmApi } from "./api";

const CONTRACT = "0x000000000000000000000000000000000000044d";
const SPENDER_ADDRESS = "0x6d6F646C617070726F76652f0000000000000000";

export class TradeApi extends BaseEvmApi {
  constructor({
    rpc,
    tokenA,
    tokenB,
    contract,
    pairId,
    subaccount,
  }: {
    rpc: string;
    pairId?: string;
    tokenA: { address: string; decimals: number; symbol: string };
    tokenB: { address: string; decimals: number; symbol: string };
    contract: string;
    subaccount?: string;
  }) {
    super(rpc);
    this.contractAddress = contract;
    this.tokenA = tokenA;
    this.tokenB = tokenB;
    this.pairId = pairId;
    this.subaccount = subaccount;
  }

  readonly tokenA;
  readonly tokenB;
  readonly contractAddress: string;
  readonly pairId: string | undefined;
  readonly subaccount: string | undefined;

  get pair(): string {
    return (`${this.tokenA.symbol}/${this.tokenB.symbol}`).toUpperCase();
  }

  get contract(): Contract {
    if (this.contractAddress === CONTRACT) {
      return new Contract(this.contractAddress, OrderABI, this.provider);
    }
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
        let res;
        if (this.contractAddress === CONTRACT) {
          if (this.subaccount) {
            res = await this.contract
              .getFunction("subaccountPlaceOrderBuyB")
              .populateTransaction(this.subaccount, this.pairId, pay, amount);
          }
          else {
            res = await this.contract
              .getFunction("placeOrderBuyB")
              .populateTransaction(this.pairId, pay, amount);
          }
        }
        else {
          res = await this.contract
            .getFunction("placeOrderBuyB")
            .populateTransaction(pay, amount);
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
    { amount, receive }: { amount: bigint; receive: bigint },
  ): Promise<TransactionResponse> {
    return withRetry(
      async () => {
        let res;
        const isNative = !this.tokenA.address;
        if (this.contractAddress === CONTRACT) {
          if (this.subaccount) {
            res = await this.contract
              .getFunction("subaccountPlaceOrderSellB")
              .populateTransaction(this.subaccount, this.pairId, receive, amount);
          }
          else {
            res = await this.contract
              .getFunction("placeOrderSellB")
              .populateTransaction(this.pairId, receive, amount);
          }
        }
        else if (isNative) {
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
        return signer.sendTransaction({ ...res, gasLimit: 500000 });
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
    let res;
    if (this.contractAddress === CONTRACT) {
      if (this.subaccount) {
        res = await this.contract
          .getFunction(type === "buy" ? "subaccountCancelOrderBuyB" : "subaccountCancelOrderSellB")
          .populateTransaction(this.subaccount, this.pairId, orderId);
      }
      else {
        res = await this.contract
          .getFunction(type === "buy" ? "cancelOrderBuyB" : "cancelOrderSellB")
          .populateTransaction(this.pairId, orderId);
      }
    }
    else {
      res = await this.contract
        .getFunction(type === "buy" ? "cancelOrderBuyB" : "cancelOrderSellB")
        .populateTransaction(orderId);
    }
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  async userActiveSpotOrders(user: string): Promise<any[]> {
    return this.contract
      .getFunction("userActiveSpotOrders")
      .staticCall(user, this.pairId);
  }

  calcUsdt(price: string, bool: string): bigint {
    const p = BN(price).toFixed(2);
    const receive = BN(bool)
      .times(BN(p))
      .div(100)
      .times(10 ** this.tokenB.decimals)
      .toFixed(0);
    return BigInt(receive);
  }

  async approveToken(signer: Signer): Promise<void> {
    const address = await signer.getAddress();
    const contract = this.contractAddress === CONTRACT ? SPENDER_ADDRESS : this.contractAddress;
    if (this.tokenA.address) {
      const isApprove = await super.isApprove({
        contract: this.tokenA.address,
        approvedAddress: contract,
        address,
        amount: 100000000000n,
      });
      if (!isApprove) {
        await super.approve(signer, {
          contract: this.tokenA.address,
          approvedAddress: contract,
        });
      }
    }
    if (this.tokenB.address) {
      const isApprove = await super.isApprove({
        contract: this.tokenB.address,
        approvedAddress: contract,
        address,
        amount: 1000000000000n,
      });
      if (!isApprove) {
        await super.approve(signer, {
          contract: this.tokenB.address,
          approvedAddress: contract,
        });
      }
    }
  }
}
