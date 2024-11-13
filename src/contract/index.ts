import type { Signer } from "ethers";
import type { Token } from "../types";
import BN from "bignumber.js";
import { Contract } from "ethers";
import { TradeABI } from "./abi";
import { BaseEvmApi } from "./api";
import { Order, OrderType } from "./interfaces/order";

export class TradeApi extends BaseEvmApi {
  constructor({
    rpc,
    usdt,
    contract,
  }: {
    rpc: string;
    usdt: { address: string; decimals: number };
    contract: string;
  }) {
    super(rpc);
    this.contractAddress = contract;
    this.usdt = usdt;
  }

  readonly usdt;
  readonly contractAddress: string;

  get contract() {
    return new Contract(this.contractAddress, TradeABI, this.provider);
  }

  async createBuyOrder(
    signer: Signer,
    { amount, pay }: { amount: bigint; pay: bigint },
  ) {
    const res = await this.contract
      .getFunction("placeOrderBuyB")
      .populateTransaction(pay, amount);
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  async createSellOrder(
    signer: Signer,
    { amount, receive }: { amount: bigint; receive: bigint },
  ) {
    const res = await this.contract
      .getFunction("placeOrderSellB")
      .populateTransaction(receive, { value: amount });
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  async cancelOrder(
    signer: Signer,
    { orderId, type }: { orderId: bigint; type: "buy" | "sell" },
  ) {
    const res = await this.contract
      .getFunction(type === "buy" ? "cancelOrderBuyB" : "cancelOrderSellB")
      .populateTransaction(orderId);
    await signer.estimateGas(res);
    return signer.sendTransaction(res);
  }

  isUsdtApproved(address: string, amount: bigint) {
    return super.isApprove({
      contract: this.usdt.address,
      approvedAddress: this.contractAddress,
      amount,
      address,
    });
  }

  approveUsdt(signer: Signer) {
    return super.approve(signer, {
      contract: this.usdt.address,
      approvedAddress: this.contractAddress,
    });
  }

  calcUsdt(price: string, bool: string) {
    const receive = BN(bool)
      .times(BN(price))
      .times(10 ** this.usdt.decimals)
      .toFixed(0);
    return BigInt(receive);
  }

  async enumerateOrderBuyB(param: {
    address: string;
    begin: number;
    end: number;
    token0: Token; // bool token
    token1: Token; // usdt usdc...
  }): Promise<{
      totalCount: number;
      totalPage: number;
      items: Order[];
    }> {
    const { address, begin, end, token0, token1 } = param;

    const res = await this.contract.enumerateOrderBuyB!(address, begin, end);
    const totalCount = Number(res[0] ?? 0);
    const list: Order[] = (res[1] ?? []).map((item: any) => {
      return new Order(item, OrderType.buy, token1, token0);
    });

    return {
      totalCount,
      totalPage: Math.floor(totalCount / (end - begin)),
      items: list,
    };
  }

  async enumerateOrderSellB(param: {
    address: string;
    begin: number;
    end: number;
    token0: Token; // bool token
    token1: Token; // usdt usdc...
  }): Promise<{
      totalCount: number;
      totalPage: number;
      items: Order[];
    }> {
    const { address, begin, end, token0, token1 } = param;

    const res = await this.contract.enumerateOrderSellB!(address, begin, end);
    const totalCount = Number(res[0] ?? 0);
    const list: Order[] = (res[1] ?? []).map((item: any) => {
      return new Order(item, OrderType.sell, token0, token1);
    });

    return {
      totalCount,
      totalPage: Math.floor(totalCount / (end - begin)),
      items: list,
    };
  }

  async orderList(param: {
    address: string;
    begin: number;
    end: number;
    token0: Token; // bool token
    token1: Token; // usdt usdc...
  }): Promise<{
      totalCount: number;
      totalPage: number;
      items: Order[];
    }> {
    const buyOrders = await this.enumerateOrderBuyB(param);
    const sellOrders = await this.enumerateOrderSellB(param);

    return {
      totalCount: buyOrders.totalCount + sellOrders.totalCount,
      totalPage: Math.max(buyOrders.totalPage, sellOrders.totalPage),
      items: buyOrders.items
        .concat(sellOrders.items)
        .filter(item => item.isActive),
    };
  }
}
