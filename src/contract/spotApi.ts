import type { Signer } from "ethers";
import { Contract } from "ethers";
import { BaseEvmApi } from "./api";
import { SpotABI } from "./spot";

export const SPOT_CONTRACT_ADDRESS = "0x000000000000000000000000000000000000044D";

export interface SpotMarketSpec {
    min_order_size: bigint;
    tick_size: bigint;
    step_size: bigint;
}

export interface SpotOrder {
    pair: string; // bytes32
    id: bigint;
    maker: string;
    price: bigint;
    quote_amount: bigint;
    base_amount: bigint;
    create_time: number;
    status: number;
    is_buy: boolean;
    order_type: number;
    slippage: number;
}

export interface SpotToken {
    address: string;
    decimals: number;
    symbol: string;
}

export class SpotApi extends BaseEvmApi {
    constructor({
        rpc,
        pair,
        baseToken,
        quoteToken,
    }: {
        rpc: string;
        pair: string; // bytes32 pair identifier
        baseToken: SpotToken;
        quoteToken: SpotToken;
    }) {
        super(rpc);
        this.pair = pair;
        this.baseToken = baseToken;
        this.quoteToken = quoteToken;
    }

    readonly pair: string;
    readonly baseToken: SpotToken;
    readonly quoteToken: SpotToken;

    get contract(): Contract {
        return new Contract(SPOT_CONTRACT_ADDRESS, SpotABI, this.provider);
    }

    async getSpotMarketSpec(): Promise<SpotMarketSpec> {
        return this.contract.getSpotMarketSpec!(this.pair);
    }

    async placeLimitOrderBuy(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            postOnly = 0,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            postOnly?: number;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceOrderBuyB")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                postOnly,
                reduceOnly,
            );
        const nonce = new Date().valueOf()
        return signer.sendTransaction({ ...res, nonce, gasLimit: 1000000n });
    }

    async placeLimitOrderSell(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            postOnly = 0,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            postOnly?: number;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceOrderSellB")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                postOnly,
                reduceOnly,
            );
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async placeMarketOrderBuyWithPrice(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            slippage = 0,
            autoCancel = false,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            slippage?: number;
            autoCancel?: boolean;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceMarketOrderBuyBWithPrice")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                slippage,
                autoCancel,
                reduceOnly,
            );
        const nonce = new Date().valueOf()
        return signer.sendTransaction({ ...res, nonce, gasLimit: 1000000n });
    }

    async placeMarketOrderBuyWithoutPrice(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            autoCancel = false,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            autoCancel?: boolean;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceMarketOrderBuyBWithoutPrice")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                autoCancel,
                reduceOnly,
            );
        const nonce = new Date().valueOf()
        return signer.sendTransaction({ ...res, nonce, gasLimit: 1000000n });
    }

    async placeMarketOrderSellWithPrice(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            slippage = 0,
            autoCancel = false,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            slippage?: number;
            autoCancel?: boolean;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceMarketOrderSellBWithPrice")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                slippage,
                autoCancel,
                reduceOnly,
            );
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async placeMarketOrderSellWithoutPrice(
        signer: Signer,
        {
            subaccount,
            quoteAmount,
            baseAmount,
            autoCancel = false,
            reduceOnly = false,
        }: {
            subaccount: string;
            quoteAmount: bigint;
            baseAmount: bigint;
            autoCancel?: boolean;
            reduceOnly?: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountPlaceMarketOrderSellBWithoutPrice")
            .populateTransaction(
                subaccount,
                this.pair,
                quoteAmount,
                baseAmount,
                autoCancel,
                reduceOnly,
            );
        const nonce = new Date().valueOf()
        return signer.sendTransaction({ ...res, nonce, gasLimit: 1000000n });
    }

    async cancelOrderBuy(
        signer: Signer,
        {
            subaccount,
            orderId,
        }: {
            subaccount: string;
            orderId: bigint;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountCancelOrderBuyB")
            .populateTransaction(subaccount, this.pair, orderId);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async cancelOrderSell(
        signer: Signer,
        {
            subaccount,
            orderId,
        }: {
            subaccount: string;
            orderId: bigint;
        },
    ) {
        const res = await this.contract
            .getFunction("subaccountCancelOrderSellB")
            .populateTransaction(subaccount, this.pair, orderId);
        const nonce = new Date().valueOf()
        return signer.sendTransaction({ ...res, nonce, gasLimit: 1000000n });
    }

    async userActiveSpotOrders(user: string): Promise<SpotOrder[]> {
        return this.contract.userActiveSpotOrders!(user, this.pair);
    }
}
