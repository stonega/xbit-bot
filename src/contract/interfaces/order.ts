import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import type { Token } from '~/types/common';

export enum OrderType {
  sell,
  buy,
}

export class Order {
  constructor(info: any[], type: OrderType, payToken: Token, buyToken: Token) {
    const obj = {
      maker: info[0]?.toString() ?? '',
      payAmount: info[1] ?? 0,
      buyAmount: info[2] ?? 0,
      isActive: info[3] ?? false,
      payToken,
      buyToken,
      type: type,
    };
    Object.assign(this, obj);
  }

  readonly type!: OrderType;
  readonly maker!: string;
  readonly payAmount!: bigint;
  readonly buyAmount!: bigint;
  readonly isActive!: string;
  readonly payToken!: Token;
  readonly buyToken!: Token;

  get pair() {
    return [this.buyToken.name, this.payToken.name].join('/');
  }

  get filledQty() {
    return '0';
  }

  get qty() {
    return ethers.formatUnits(this.buyAmount, this.buyToken.decimals);
  }

  get totalValue() {
    return ethers.formatUnits(this.payAmount, this.payToken.decimals);
  }

  // U / B = price
  get price() {
    const totalValueBN = BigNumber(this.totalValue);
    const qtyBN = BigNumber(this.qty);
    if (totalValueBN.isZero() || qtyBN.isZero()) return '0';

    if (this.type === OrderType.sell) {
      return qtyBN.dividedBy(totalValueBN).toString();
    }
    return totalValueBN.dividedBy(qtyBN).toString();
  }
}
