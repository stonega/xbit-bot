# xbit-bot

Install bun

```bash
curl -fsSL https://bun.sh/install | bash
```

To install dependencies:

```bash
bun install
```
Configure the bot by copy .env.example to .env and fill in the required values.

To run:

```bash
bun run index.ts
```


Maker 功能：创建流动性，通过在订单簿两侧放置订单来维持市场深度
- 当价格低于目标时，创建买单推高价格
- 当价格高于目标时，创建卖单压低价格
- 确保订单簿上始终有买单和卖单

Taker 功能：消耗流动性，通过吃掉现有订单来将价格推向目标价格
- 当价格低于目标时，创建较大买单推高价格
- 当价格高于目标时，创建较大卖单压低价格
- 订单大小基于可用流动性和配置的容量上限


This project was created using `bun init` in bun v1.1.10. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
