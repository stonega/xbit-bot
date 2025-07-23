import type { Signer, TransactionResponse } from "ethers";
import type { UserStats } from "../types";
import { Contract } from "ethers";
import { BaseEvmApi } from "./api";
import { TradeABI } from "./tradeAbi";

const CONTRACT = "0x000000000000000000000000000000000000044D";

export class AccountApi extends BaseEvmApi {
  constructor({
    rpc,
  }: {
    rpc: string;
  }) {
    super(rpc);
  }

  get contract(): Contract {
    return new Contract(CONTRACT, TradeABI, this.provider);
  }

  async initializeSubaccount(signer: Signer, name: Uint8Array) {
    const res = await this.contract
      .getFunction("initializeSubaccount")
      .populateTransaction(name);
    const limit = await signer.estimateGas(res);
    return signer.sendTransaction({ ...res, gasLimit: limit * 2n });
  }

  async userStats(user: string): Promise<UserStats> {
    return this.contract.getFunction("userStats").staticCall(user);
  }
}
