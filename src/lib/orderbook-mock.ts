/**
 * 订单簿模拟数据生成器
 * 用于现货/合约/杠杆交易页面的订单簿深度图和成交记录
 */

/** 买单/卖单数据结构 */
export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
}

/** 成交记录数据结构 */
export interface TradeRecord {
  time: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
}

/** 深度图数据点 */
export interface DepthDataPoint {
  price: number;
  bidDepth: number;
  askDepth: number;
}

/** 订单簿完整数据 */
export interface OrderBookData {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  spread: number;
}

/**
 * 生成模拟订单簿数据
 * @param basePrice 基准价格 (如 BTC = 67234)
 * @param depth 深度档位数量, 默认20
 * @returns 包含买单、卖单和价差的订单簿数据
 */
export function generateOrderBook(basePrice: number, depth: number = 20): OrderBookData {
  // 生成卖单 (价格从高到低排列, 卖盘在基准价上方)
  const asks: OrderBookItem[] = Array.from({ length: depth }, (_, i) => {
    const priceOffset = (i + 1) * (basePrice * 0.0003) + Math.random() * basePrice * 0.0001;
    const price = parseFloat((basePrice + priceOffset).toFixed(2));
    // 越靠近中间价, 挂单量越大
    const amountMultiplier = 1 - i / depth * 0.6;
    const amount = parseFloat((Math.random() * 2.5 * amountMultiplier + 0.05).toFixed(4));
    return { price, amount, total: parseFloat((price * amount).toFixed(2)) };
  }).sort((a, b) => a.price - b.price);

  // 生成买单 (价格从高到低排列, 买盘在基准价下方)
  const bids: OrderBookItem[] = Array.from({ length: depth }, (_, i) => {
    const priceOffset = (i + 1) * (basePrice * 0.0003) + Math.random() * basePrice * 0.0001;
    const price = parseFloat((basePrice - priceOffset).toFixed(2));
    const amountMultiplier = 1 - i / depth * 0.6;
    const amount = parseFloat((Math.random() * 2.5 * amountMultiplier + 0.05).toFixed(4));
    return { price, amount, total: parseFloat((price * amount).toFixed(2)) };
  }).sort((a, b) => b.price - a.price);

  // 计算买卖价差
  const bestAsk = asks[0]?.price ?? basePrice;
  const bestBid = bids[0]?.price ?? basePrice;
  const spread = bestAsk - bestBid;

  return { bids, asks, spread };
}

/**
 * 生成模拟成交记录
 * @param count 生成条数, 默认20
 * @param basePrice 基准价格
 * @returns 成交记录数组
 */
export function generateTrades(count: number = 20, basePrice: number = 67234): TradeRecord[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    // 时间倒序, 最近的最前面
    const tradeTime = new Date(now.getTime() - i * (Math.random() * 3000 + 500));
    const hours = String(tradeTime.getHours()).padStart(2, '0');
    const minutes = String(tradeTime.getMinutes()).padStart(2, '0');
    const seconds = String(tradeTime.getSeconds()).padStart(2, '0');
    // 价格在基准价附近波动 ±0.5%
    const priceVariation = (Math.random() - 0.5) * basePrice * 0.01;
    const price = parseFloat((basePrice + priceVariation).toFixed(2));
    // 数量随机
    const amount = parseFloat((Math.random() * 1.8 + 0.001).toFixed(4));
    // 随机方向
    const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';

    return {
      time: `${hours}:${minutes}:${seconds}`,
      price,
      amount,
      side,
    };
  });
}

/**
 * 生成深度图数据
 * 将订单簿的买单/卖单转换为深度图所需的累积深度数据
 * @param bids 买单数组
 * @param asks 卖单数组
 * @returns 深度图数据点数组, X轴=价格, Y轴=累计深度
 */
export function generateDepthData(
  bids: OrderBookItem[],
  asks: OrderBookItem[]
): DepthDataPoint[] {
  // 合并所有价格点并去重排序
  const allPrices = new Set<number>();
  bids.forEach(b => allPrices.add(b.price));
  asks.forEach(a => allPrices.add(a.price));
  const sortedPrices = Array.from(allPrices).sort((a, b) => a - b);

  // 计算每个价格点的累积深度
  // 买单深度: 价格 <= 当前价格的所有买单数量之和
  // 卖单深度: 价格 >= 当前价格的所有卖单数量之和
  return sortedPrices.map(price => {
    const bidDepth = bids
      .filter(b => b.price <= price)
      .reduce((sum, b) => sum + b.amount, 0);
    const askDepth = asks
      .filter(a => a.price >= price)
      .reduce((sum, a) => sum + a.amount, 0);
    return { price, bidDepth, askDepth };
  });
}
