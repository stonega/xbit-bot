export const TradeABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenU",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
    ],
    name: "placeOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "cancelOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "cancelOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "enumerateOrderBuyB",
    outputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amountU",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountB",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct OrderBookNativeCoinExchange.OrderBuyB[]",
        name: "orderList",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "enumerateOrderSellB",
    outputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amountB",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountU",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct OrderBookNativeCoinExchange.OrderSellB[]",
        name: "orderList",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idBuy",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "idSells",
        type: "uint256[]",
      },
    ],
    name: "matchMultiToBuy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idSell",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "idBuys",
        type: "uint256[]",
      },
    ],
    name: "matchMultiToSell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "ordersBuyB",
    outputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "ordersSellB",
    outputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
    ],
    name: "placeOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenU",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userOrderBuyB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userOrderSellB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
export const TradeNativeABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenU",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
    ],
    name: "placeOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "cancelOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "orderId",
        type: "uint256",
      },
    ],
    name: "cancelOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "enumerateOrderBuyB",
    outputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amountU",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountB",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct OrderBookNativeCoinExchange.OrderBuyB[]",
        name: "orderList",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "begin",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    name: "enumerateOrderSellB",
    outputs: [
      {
        internalType: "uint256",
        name: "total",
        type: "uint256",
      },
      {
        components: [
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "amountB",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amountU",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "isActive",
            type: "bool",
          },
        ],
        internalType: "struct OrderBookNativeCoinExchange.OrderSellB[]",
        name: "orderList",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idBuy",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "idSells",
        type: "uint256[]",
      },
    ],
    name: "matchMultiToBuy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "idSell",
        type: "uint256",
      },
      {
        internalType: "uint256[]",
        name: "idBuys",
        type: "uint256[]",
      },
    ],
    name: "matchMultiToSell",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "ordersBuyB",
    outputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "ordersSellB",
    outputs: [
      {
        internalType: "address",
        name: "maker",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "isActive",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amountU",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amountB",
        type: "uint256",
      },
    ],
    name: "placeOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "tokenU",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userOrderBuyB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "userOrderSellB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
export const OrderABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "new_account",
        type: "address",
      },
    ],
    name: "createOneClickTradingAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "delegateAccounts",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "subaccount",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "name",
            type: "bytes",
          },
        ],
        internalType: "struct CoinExchange.DelegateInfo[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "disableOnClickTradingAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "enableOnClickTradingAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "name",
        type: "bytes",
      },
    ],
    name: "initializeSubaccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "oneClickTradingAccountsFor",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "uint8",
            name: "mode",
            type: "uint8",
          },
          {
            internalType: "uint32",
            name: "create_time",
            type: "uint32",
          },
        ],
        internalType: "struct CoinExchange.OneClickTrading[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "address",
        name: "delegate",
        type: "address",
      },
    ],
    name: "setDelegateAccount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "order_id",
        type: "uint256",
      },
    ],
    name: "subaccountCancelOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "order_id",
        type: "uint256",
      },
    ],
    name: "subaccountCancelOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "subaccountInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "authority",
            type: "address",
          },
          {
            internalType: "address",
            name: "delegate",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "name",
            type: "bytes",
          },
          {
            internalType: "uint128",
            name: "collateral",
            type: "uint128",
          },
          {
            components: [
              {
                internalType: "uint128",
                name: "token_amount",
                type: "uint128",
              },
              {
                internalType: "int64",
                name: "open_bids",
                type: "int64",
              },
              {
                internalType: "int64",
                name: "open_asks",
                type: "int64",
              },
              {
                internalType: "int64",
                name: "cumulative_deposits",
                type: "int64",
              },
              {
                internalType: "uint16",
                name: "market_index",
                type: "uint16",
              },
              {
                internalType: "uint8",
                name: "balance_type",
                type: "uint8",
              },
              {
                internalType: "uint8",
                name: "open_orders",
                type: "uint8",
              },
              {
                internalType: "bytes",
                name: "padding",
                type: "bytes",
              },
            ],
            internalType: "struct CoinExchange.SpotPosition[]",
            name: "spot_positions",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint16",
                name: "market_id",
                type: "uint16",
              },
              {
                internalType: "bool",
                name: "is_long",
                type: "bool",
              },
              {
                internalType: "uint128",
                name: "base_asset_amount",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "entry_price",
                type: "uint128",
              },
              {
                internalType: "uint8",
                name: "leverage",
                type: "uint8",
              },
              {
                internalType: "int128",
                name: "last_funding_rate",
                type: "int128",
              },
              {
                internalType: "uint128",
                name: "isolated_margin",
                type: "uint128",
              },
              {
                internalType: "uint64",
                name: "version",
                type: "uint64",
              },
              {
                internalType: "int128",
                name: "unrealized_pnl",
                type: "int128",
              },
              {
                internalType: "int128",
                name: "realized_pnl",
                type: "int128",
              },
              {
                internalType: "int128",
                name: "funding_payment",
                type: "int128",
              },
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                internalType: "uint128",
                name: "take_profit",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "stop_loss",
                type: "uint128",
              },
            ],
            internalType: "struct CoinExchange.PerpPosition[]",
            name: "perp_positions",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint8",
                name: "lending_market_id",
                type: "uint8",
              },
              {
                internalType: "bytes",
                name: "asset",
                type: "bytes",
              },
              {
                internalType: "uint128",
                name: "amount",
                type: "uint128",
              },
              {
                internalType: "uint128",
                name: "interest",
                type: "uint128",
              },
            ],
            internalType: "struct CoinExchange.BorrowPosition[]",
            name: "borrow_positions",
            type: "tuple[]",
          },
          {
            internalType: "int64",
            name: "last_add_perp_lp_shares_ts",
            type: "int64",
          },
          {
            internalType: "uint64",
            name: "total_deposits",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "total_withdraws",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "total_social_loss",
            type: "uint64",
          },
          {
            internalType: "int64",
            name: "settled_perp_pnl",
            type: "int64",
          },
          {
            internalType: "int64",
            name: "cumulative_spot_fees",
            type: "int64",
          },
          {
            internalType: "int64",
            name: "cumulative_perp_funding",
            type: "int64",
          },
          {
            internalType: "uint64",
            name: "liquidation_margin_freed",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "last_active_slot",
            type: "uint64",
          },
          {
            internalType: "uint32",
            name: "next_order_id",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "max_margin_ratio",
            type: "uint32",
          },
          {
            internalType: "uint16",
            name: "next_liquidation_id",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "sub_account_id",
            type: "uint16",
          },
          {
            internalType: "uint8",
            name: "status",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "is_margin_trading_enabled",
            type: "bool",
          },
          {
            internalType: "uint8",
            name: "open_orders",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "has_open_order",
            type: "bool",
          },
          {
            internalType: "uint8",
            name: "open_auctions",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "has_open_auction",
            type: "bool",
          },
          {
            internalType: "uint8",
            name: "margin_mode",
            type: "uint8",
          },
          {
            internalType: "bytes",
            name: "padding1",
            type: "bytes",
          },
          {
            internalType: "uint32",
            name: "last_fuel_bonus_update_ts",
            type: "uint32",
          },
          {
            internalType: "bytes",
            name: "padding",
            type: "bytes",
          },
        ],
        internalType: "struct CoinExchange.User",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "slippage",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "auto_cancel",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceMarketOrderBuyBWithPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "auto_cancel",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceMarketOrderBuyBWithoutPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "slippage",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "auto_cancel",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceMarketOrderSellBWithPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "auto_cancel",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceMarketOrderSellBWithoutPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "post_only",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceOrderBuyB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "subaccount",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "amount_u",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "amount_b",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "post_only",
        type: "uint8",
      },
      {
        internalType: "bool",
        name: "reduce_only",
        type: "bool",
      },
    ],
    name: "subaccountPlaceOrderSellB",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "pair",
        type: "bytes32",
      },
    ],
    name: "userActiveSpotOrders",
    outputs: [
      {
        components: [
          {
            internalType: "bytes32",
            name: "pair",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "id",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "maker",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "price",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount_u",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "amount_b",
            type: "uint256",
          },
          {
            internalType: "uint32",
            name: "create_time",
            type: "uint32",
          },
          {
            internalType: "bool",
            name: "is_active",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "is_buy",
            type: "bool",
          },
          {
            internalType: "uint8",
            name: "order_type",
            type: "uint8",
          },
          {
            internalType: "uint8",
            name: "slippage",
            type: "uint8",
          },
        ],
        internalType: "struct CoinExchange.Order[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address",
      },
    ],
    name: "userStats",
    outputs: [
      {
        components: [
          {
            components: [
              {
                internalType: "address",
                name: "subaccount",
                type: "address",
              },
              {
                internalType: "bytes",
                name: "name",
                type: "bytes",
              },
            ],
            internalType: "struct CoinExchange.SimpleSubaccount[]",
            name: "subaccounts",
            type: "tuple[]",
          },
          {
            components: [
              {
                internalType: "uint64",
                name: "total_fee_paid",
                type: "uint64",
              },
              {
                internalType: "uint64",
                name: "total_fee_rebate",
                type: "uint64",
              },
              {
                internalType: "uint64",
                name: "total_token_discount",
                type: "uint64",
              },
              {
                internalType: "uint64",
                name: "total_referee_discount",
                type: "uint64",
              },
              {
                internalType: "uint64",
                name: "total_referrer_reward",
                type: "uint64",
              },
              {
                internalType: "uint64",
                name: "current_epoch_referrer_reward",
                type: "uint64",
              },
            ],
            internalType: "struct CoinExchange.UserFees",
            name: "fees",
            type: "tuple",
          },
          {
            internalType: "int64",
            name: "next_epoch_ts",
            type: "int64",
          },
          {
            internalType: "uint64",
            name: "maker_volume_30d",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "taker_volume_30d",
            type: "uint64",
          },
          {
            internalType: "uint64",
            name: "filler_volume_30d",
            type: "uint64",
          },
          {
            internalType: "int64",
            name: "last_maker_volume_30d_ts",
            type: "int64",
          },
          {
            internalType: "int64",
            name: "last_taker_volume_30d_ts",
            type: "int64",
          },
          {
            internalType: "int64",
            name: "last_filler_volume_30d_ts",
            type: "int64",
          },
          {
            internalType: "uint64",
            name: "if_staked_quote_asset_amount",
            type: "uint64",
          },
          {
            internalType: "uint16",
            name: "number_of_sub_accounts",
            type: "uint16",
          },
          {
            internalType: "uint16",
            name: "number_of_sub_accounts_created",
            type: "uint16",
          },
          {
            internalType: "uint8",
            name: "referrer_status",
            type: "uint8",
          },
          {
            internalType: "bool",
            name: "disable_update_perp_bid_ask_twap",
            type: "bool",
          },
          {
            internalType: "bytes",
            name: "padding1",
            type: "bytes",
          },
          {
            internalType: "uint8",
            name: "fuel_overflow_status",
            type: "uint8",
          },
          {
            internalType: "uint32",
            name: "fuel_insurance",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "fuel_deposits",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "fuel_borrows",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "fuel_positions",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "fuel_taker",
            type: "uint32",
          },
          {
            internalType: "uint32",
            name: "fuel_maker",
            type: "uint32",
          },
          {
            internalType: "uint64",
            name: "if_staked_gov_token_amount",
            type: "uint64",
          },
          {
            internalType: "uint32",
            name: "last_fuel_if_bonus_update_ts",
            type: "uint32",
          },
          {
            internalType: "bytes",
            name: "padding",
            type: "bytes",
          },
        ],
        internalType: "struct CoinExchange.UserStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
