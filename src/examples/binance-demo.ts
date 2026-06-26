/**
 * Binance 行情集成使用示例
 *
 * 演示：
 *  - 启动时探测网络，自动选择 live / fallback
 *  - 订阅实时 ticker 与 trade 推送
 *  - 拉取 K 线历史数据
 *  - 优雅停止
 */

import { createDefaultBinanceMarketFeed, probeBinanceConnectivity, BinanceMarketFeed } from './market';

async function main() {
  // 1. 网络探测
  const probe = await probeBinanceConnectivity();
  console.log(probe.message);
  console.log(`  REST: ${probe.rest}${probe.restLatencyMs ? ' (' + probe.restLatencyMs + 'ms)' : ''}`);
  console.log(`  WS:   ${probe.ws}`);

  // 2. 创建行情 feed
  const feed: BinanceMarketFeed = await createDefaultBinanceMarketFeed(
    ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT'],
    {
      fallbackToSimulated: true,    // 网络失败时自动降级
      tickIntervalMs: 1000,         // ticker 节流间隔
    },
  );

  console.log(`\n当前模式: ${feed.getMode()}`); // 'live' or 'fallback'

  // 3. 订阅 ticker 推送
  feed.subscribe('ticker:BTC/USDT', (ticker) => {
    console.log(`[BTC/USDT] last=${ticker.lastPrice} bid=${ticker.bidPrice} ask=${ticker.askPrice} 24h=${ticker.change24h}%`);
  });

  // 4. 订阅 trade 推送
  feed.subscribe('trade:ETH/USDT', (trade) => {
    console.log(`[ETH/USDT trade] ${trade.side} ${trade.quantity} @ ${trade.price}`);
  });

  // 5. 拉取 K 线（仅在 live 模式有效）
  try {
    const klines = await feed.getKlines('BTC/USDT', '1h', { limit: 5 });
    console.log(`\nK线 (5根):`);
    for (const k of klines) {
      console.log(`  ${new Date(k.openTime).toISOString()} O=${k.open} H=${k.high} L=${k.low} C=${k.close} V=${k.volume}`);
    }
  } catch (err) {
    console.log('\nK线拉取失败（可能处于 fallback 模式）:', (err as Error).message);
  }

  // 6. 模式变化监听
  feed.on('mode', (mode) => {
    console.log(`\n>>> 模式变更: ${mode}`);
  });

  // 7. 启动
  feed.start();
  console.log('\nfeed started, 将在 10 秒后自动停止...\n');

  // 8. 10 秒后停止
  setTimeout(() => {
    feed.stop();
    console.log('\nfeed stopped');
    process.exit(0);
  }, 10_000);
}

main().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});
