export interface Token {
  address?: string;
  icon: string;
  symbol: string;
  decimals: number;
  name: string;
}

export interface UserStats {
  subaccounts: {
    name: string;
    subaccount: string;
  }[];
}
