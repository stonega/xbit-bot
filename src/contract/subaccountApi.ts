import type { Signer } from "ethers";
import { Contract, toUtf8Bytes } from "ethers";
import { BaseEvmApi } from "./api";
import { SubaccountABI } from "./subaccount";

export const SUBACCOUNT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000451";

export interface DelegateInfo {
    subaccount: string;
    name: string; // bytes
}

export interface OneClickTrading {
    account: string;
    mode: number;
    create_time: number;
}

export interface SpotPosition {
    token_amount: bigint;
    open_bids: bigint;
    open_asks: bigint;
    cumulative_deposits: bigint;
    market_index: number;
    balance_type: number;
    open_orders: number;
    padding: string; // bytes
}

export interface BorrowPosition {
    lending_market_id: number;
    asset: string; // bytes
    amount: bigint;
    interest: bigint;
}

export interface SubaccountUser {
    authority: string;
    delegate: string;
    name: string; // bytes
    spot_positions: SpotPosition[];
    borrow_positions: BorrowPosition[];
    next_order_id: number;
    status: number;
    is_margin_trading_enabled: boolean;
}

export interface SimpleSubaccount {
    subaccount: string;
    name: string; // bytes
}

export interface UserStats {
    subaccounts: SimpleSubaccount[];
    if_staked_quote_asset_amount: bigint;
    number_of_sub_accounts: number;
    number_of_sub_accounts_created: number;
}

export class SubaccountApi extends BaseEvmApi {
    constructor({ rpc }: { rpc: string }) {
        super(rpc);
    }

    get contract(): Contract {
        return new Contract(SUBACCOUNT_CONTRACT_ADDRESS, SubaccountABI, this.provider);
    }

    async initializeSubaccount(
        signer: Signer,
        { name }: { name: string },
    ) {
        const nameBytes = toUtf8Bytes(name);
        const res = await this.contract
            .getFunction("initializeSubaccount")
            .populateTransaction(nameBytes);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async createOneClickTradingAccount(
        signer: Signer,
        { newAccount }: { newAccount: string },
    ) {
        const res = await this.contract
            .getFunction("createOneClickTradingAccount")
            .populateTransaction(newAccount);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async deleteSubaccount(
        signer: Signer,
        { subaccount }: { subaccount: string },
    ) {
        const res = await this.contract
            .getFunction("deleteSubaccount")
            .populateTransaction(subaccount);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async enableOneClickTradingAccount(
        signer: Signer,
        { account }: { account: string },
    ) {
        const res = await this.contract
            .getFunction("enableOnClickTradingAccount")
            .populateTransaction(account);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async disableOneClickTradingAccount(
        signer: Signer,
        { account }: { account: string },
    ) {
        const res = await this.contract
            .getFunction("disableOnClickTradingAccount")
            .populateTransaction(account);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async setDelegateAccount(
        signer: Signer,
        {
            subaccount,
            delegate,
        }: {
            subaccount: string;
            delegate: string;
        },
    ) {
        const res = await this.contract
            .getFunction("setDelegateAccount")
            .populateTransaction(subaccount, delegate);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async setSpotMargin(
        signer: Signer,
        {
            subaccount,
            enableSpotMargin,
        }: {
            subaccount: string;
            enableSpotMargin: boolean;
        },
    ) {
        const res = await this.contract
            .getFunction("setSpotMargin")
            .populateTransaction(subaccount, enableSpotMargin);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    // View functions
    async delegateAccounts(user: string): Promise<DelegateInfo[]> {
        return this.contract.delegateAccounts!(user);
    }

    async oneClickTradingAccountsFor(owner: string): Promise<OneClickTrading[]> {
        return this.contract.oneClickTradingAccountsFor!(owner);
    }

    async subaccountInfo(account: string): Promise<SubaccountUser> {
        return this.contract.subaccountInfo!(account);
    }

    async userStats(user: string): Promise<UserStats> {
        return this.contract.userStats!(user);
    }
}
