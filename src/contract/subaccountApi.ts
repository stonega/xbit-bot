import type { Signer } from "ethers";
import { Contract } from "ethers";
import { BaseEvmApi } from "./api";
import { SubaccountABI } from "./subaccount";

export const SUBACCOUNT_CONTRACT_ADDRESS = "0x000000000000000000000000000000000000044E"; // Placeholder, same as PERP for now or needs update

export interface DelegateInfo {
    subaccount: string;
    name: string; // bytes
}

export interface OneClickTrading {
    account: string;
    mode: number; // uint8
    create_time: bigint; // uint32
}

export interface SpotPosition {
    symbol: string; // bytes
    token_amount: bigint; // uint128
}

export interface BorrowPosition {
    lending_market_id: number; // uint8
    asset: string; // bytes
    amount: bigint; // uint128
    interest: bigint; // uint128
}

export interface SubaccountUser {
    authority: string;
    delegate: string;
    name: string; // bytes
    spot_positions: SpotPosition[];
    borrow_positions: BorrowPosition[];
    next_order_id: bigint; // uint32
    status: number; // uint8
    is_margin_trading_enabled: boolean;
}

export interface SimpleSubaccount {
    subaccount: string;
    name: string; // bytes
}

export interface UserStats {
    subaccounts: SimpleSubaccount[];
    if_staked_quote_asset_amount: bigint; // uint64
    number_of_sub_accounts: number; // uint16
    number_of_sub_accounts_created: number; // uint16
}

export class SubaccountApi extends BaseEvmApi {
    constructor(rpc: string) {
        super(rpc);
    }

    get contract(): Contract {
        return new Contract(SUBACCOUNT_CONTRACT_ADDRESS, SubaccountABI, this.provider);
    }

    async createOneClickTradingAccount(
        signer: Signer,
        newAccount: string,
    ) {
        const res = await this.contract
            .getFunction("createOneClickTradingAccount")
            .populateTransaction(newAccount);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async deleteSubaccount(
        signer: Signer,
        subaccount: string,
    ) {
        const res = await this.contract
            .getFunction("deleteSubaccount")
            .populateTransaction(subaccount);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async disableOnClickTradingAccount(
        signer: Signer,
        account: string,
    ) {
        const res = await this.contract
            .getFunction("disableOnClickTradingAccount")
            .populateTransaction(account);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async enableOnClickTradingAccount(
        signer: Signer,
        account: string,
    ) {
        const res = await this.contract
            .getFunction("enableOnClickTradingAccount")
            .populateTransaction(account);
        const limit = await signer.estimateGas(res);
        return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
    }

    async initializeSubaccount(
        signer: Signer,
        name: string, // bytes
    ) {
        const res = await this.contract
            .getFunction("initializeSubaccount")
            .populateTransaction(name);
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

    async renameSubaccount(
        signer: Signer,
        {
            subaccount,
            newName,
        }: {
            subaccount: string;
            newName: string; // bytes
        },
    ) {
        const res = await this.contract
            .getFunction("renameSubaccount")
            .populateTransaction(subaccount, newName);
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
