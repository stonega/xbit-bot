import BigNumber from 'bignumber.js';
import type { BrowserProvider, Signer, TransactionReceipt } from 'ethers';
import { Contract, JsonRpcProvider, MaxUint256 } from 'ethers';
import { erc20ABI } from './erc20';

export const ORIGIN_TOKEN = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

export class BaseEvmApi {
  constructor(rpc: string) {
    this.rpc = rpc;
  }

  readonly rpc;

  get provider() {
    return new JsonRpcProvider(this.rpc);
  }

  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  private getContractProvider<K extends 'ERC20'>(
    _contractName: K,
    contractAddress: string,
  ) {
    return new Contract(contractAddress, erc20ABI, this.provider);
  }

  isNative(contract?: string) {
    return !contract || contract.toLowerCase() === ORIGIN_TOKEN.toLowerCase();
  }

  /**
   *
   * Checks tx hash
   * @param hash Tx hash
   * @returns
   */
  async checkTransaction(hash: string) {
    return await this.provider.waitForTransaction(hash);
  }

  /**
   * Get token balance
   * @param address wallet address
   * @param contractAddress contract address
   * @returns balance
   */
  async getBalance({
    address,
    contractAddress,
  }: {
    address: string;
    contractAddress?: string;
  }): Promise<bigint> {
    if (this.isNative(contractAddress) || !contractAddress) {
      const balance = await this.provider.getBalance(address);
      return balance;
    }
    const erc20Contract = this.getContractProvider('ERC20', contractAddress!);
    const balance = await erc20Contract.balanceOf!(address);
    return balance;
  }

  /**
   *
   * Checks if the token is approved for the current contract
   *
   * @param param
   *    contract: Contract Address
   *    approveAddress Approved address
   *    address Account address
   *    amount Transaction amount
   * @returns boolean
   */
  async isApprove(param: {
    contract: string;
    approvedAddress: string;
    address?: string;
    amount: string | bigint;
  }): Promise<boolean> {
    try {
      const _address = param.address;
      const erc20Contract = this.getContractProvider('ERC20', param.contract);
      const approved = await erc20Contract.allowance?.(
        _address,
        param.approvedAddress,
      );
      return new BigNumber(approved).gte(new BigNumber(param.amount.toString()));
    }
    catch (error) {
      console.log(error);
      return false;
    }
  }

  /**
   *
   * Approve token
   * @param provider
   * @param param
   *    contract: Contract Address
   *    approveAddress Approved address
   *    address Account address
   *    amount Transaction amount
   * @returns boolean
   */
  async approve(
    signer: Signer,
    param: {
      contract: string;
      approvedAddress: string;
    },
  ): Promise<TransactionReceipt | null> {
    const erc20Contract = this.getContractProvider('ERC20', param.contract);
    const data = await erc20Contract
      .getFunction('approve')
      .populateTransaction(param.approvedAddress, MaxUint256);
    const res = await signer.sendTransaction(data);
    return res.wait();
  }
}
