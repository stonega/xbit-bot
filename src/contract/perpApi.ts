import type { BrowserProvider, Signer } from "ethers";
import BN from "bignumber.js";
import { Contract } from "ethers";
import { BaseEvmApi } from "./api";
import { PerpABI } from "./perp";

export const PERP_CONTRACT_ADDRESS = "0x000000000000000000000000000000000000044E";

export interface PerpPosition {
  market_id: number;
  is_long: boolean;
  base_asset_amount: bigint;
  entry_price: bigint;
  leverage: number;
  last_funding_rate: bigint;
  isolated_margin: bigint;
  version: bigint;
  unrealized_pnl: bigint;
  realized_pnl: bigint;
  funding_payment: bigint;
  owner: string;
  take_profit: bigint;
  stop_loss: bigint;
}

export interface PerpOrder {
  order_id: number;
  owner: string;
  market_id: number;
  is_long: boolean;
  size: bigint;
  price: bigint;
  order_type: number;
  create_time: bigint;
  leverage: number;
  isolated: boolean;
  margin: bigint;
  slippage: bigint;
  status: number;
  size_filled: bigint;
  size_remain: bigint;
  margin_remain: bigint;
  margin_used: bigint;
  take_profit: bigint;
  stop_loss: bigint;
}

export interface ActiveOrder {
  owner: string;
  market_id: number;
  order_side: number;
  order_type: number;
  order_id: number;
  price: bigint;
  created_at: bigint;
}

export interface Token {
  address: string;
  decimals: number;
  symbol: string;
}

export interface PerpMarket {
  id: number;
  name: string; // bytes
  token_a: string; // bytes
  token_a_address: string;
  token_a_decimal: number;
  token_b_market_id: number;
  network: string; // bytes
  height: bigint;
  cumulative_funding_rate: bigint;
  last_cacl_funding_rate_time: bigint;
  oracle_price: bigint;
  max_deviation_bps: bigint;
  liquid_spread_bps: bigint;
  fallback_if_dlob_price_invalid: boolean;
  maintenance_margin_ratio: bigint;
}

const CONTRACT_ADDRESS = "0x000000000000000000000000000000000000044E";

export class PerpApi extends BaseEvmApi {
  constructor({
    rpc,
    marketId,
    token,
  }: {
    rpc: string;
    marketId: number;
    token: {
      address: string;
      decimals: number;
      symbol: string;
    };
  }) {
    super(rpc);
    this.marketId = marketId;
    this.token = token;
  }

  readonly marketId: number;
  readonly token: Token;

  get contract(): Contract {
    return new Contract(CONTRACT_ADDRESS, PerpABI, this.provider);
  }

  async placePerpOrder(
    signer: Signer,
    {
      subaccount,
      isLong,
      size,
      price,
      orderType,
      leverage,
      takeProfit,
      stopLoss,
    }: {
      subaccount: string;
      isLong: boolean;
      size: bigint;
      price: bigint;
      orderType: number;
      leverage: number;
      takeProfit: bigint;
      stopLoss: bigint;
    },
  ) {
    const res = await this.contract
      .getFunction("placePerpOrder")
      .populateTransaction(
        subaccount,
        this.marketId,
        isLong,
        size,
        price,
        orderType,
        leverage,
        takeProfit,
        stopLoss,
      );
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  async cancelOrder(
    signer: Signer,
    {
      subaccount,
      orderId,
    }: {
      subaccount: string;
      orderId: number;
    },
  ) {
    const res = await this.contract
      .getFunction("cancelOrder")
      .populateTransaction(subaccount, this.marketId, orderId);
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  async closePosition(
    signer: Signer,
    {
      subaccount,
      price,
      slippage,
    }: {
      subaccount: string;
      price: bigint;
      slippage: bigint;
    },
  ) {
    const res = await this.contract
      .getFunction("closePosition")
      .populateTransaction(subaccount, this.marketId, price, slippage);
    // const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: 1000000n });
  }

  async setProfitAndLossPoint(
    provider: BrowserProvider,
    {
      subaccount,
      takeProfit,
      stopLoss,
    }: {
      subaccount: string;
      takeProfit: bigint;
      stopLoss: bigint;
    },
  ) {
    const res = await this.contract
      .getFunction("setProfitAndLossPoint")
      .populateTransaction(subaccount, this.marketId, takeProfit, stopLoss);
    const signer = await provider.getSigner();
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  async deposit(
    signer: Signer,
    {
      subaccount,
      amount,
    }: {
      subaccount: string;
      amount: bigint;
    },
  ) {
    const res = await this.contract
      .getFunction("deposit")
      .populateTransaction(subaccount, this.marketId, amount);
    console.log(res, {
      subaccount,
      marketId: this.marketId,
      amount,
    });
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  calcValue(price: string, amount: string, leverage: number) {
    const priceFixed = BN(price).toFixed(2, BN.ROUND_CEIL);
    const amountFixed = BN(amount).toFixed(2, BN.ROUND_CEIL);
    const receive = BN(amountFixed)
      .times(BN(priceFixed))
      .times(leverage)
      .times(10 ** this.token.decimals)
      .toFixed(0, BN.ROUND_DOWN);
    return BigInt(receive);
  }

  async withdraw(
    signer: Signer,
    {
      subaccount,
      amount,
    }: {
      subaccount: string;
      amount: bigint;
    },
  ) {
    const res = await this.contract
      .getFunction("withdraw")
      .populateTransaction(subaccount, this.marketId, amount);
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  async userActiveOrders(user: string): Promise<ActiveOrder[]> {
    return this.contract.userActiveOrders!(user);
  }

  async userPerpPositions(user: string): Promise<PerpPosition> {
    return this.contract.userPerpPositions!(user, this.marketId);
  }

  async orderInfo(user: string, orderId: number): Promise<PerpOrder> {
    return this.contract.orderInfo!(user, orderId);
  }

  async perpMarkets(): Promise<PerpMarket> {
    return this.contract.perpMarkets!(this.marketId);
  }

  async activePosForMarket(): Promise<PerpPosition[]> {
    return this.contract.activePosForMarket!(this.marketId);
  }
}
