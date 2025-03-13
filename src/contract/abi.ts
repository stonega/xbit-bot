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
    name: "cancelOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
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
    name: "cancelOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
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
    ],
    name: "placeOrderBuyB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
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
    ],
    name: "placeOrderSellB",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
