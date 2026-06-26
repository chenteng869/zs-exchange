/**
 * Nansen 链上情报模块统一出口
 *
 * 模块组成：
 *  - types                类型定义 + 关键常量 + 工具函数
 *  - nansen-client        Nansen REST 客户端（含限流 / 重试 / mock 降级）
 *  - signal-engine        信号处理引擎（订阅 / 过滤 / 聚合 / 信心分 / 事件总线）
 *  - alert-manager        告警管理（规则 CRUD / 评估 / 多通道发送 / 历史）
 *  - wallet-profiler      钱包画像（profile / PnL / winRate / 排行榜 / 关注）
 *
 * 用法：
 *   import { NansenClient, SignalEngine, AlertManager, WalletProfiler } from '@/lib/nansen';
 *
 *   const client = new NansenClient({ apiKey: process.env.NANSEN_API_KEY });
 *   const engine = new SignalEngine({ client });
 *   const alerts = new AlertManager({ email, push });
 *   const profiler = new WalletProfiler({ client });
 *
 *   // 1) 拉取 Smart Money 信号
 *   const signals = await client.getSmartMoneySignals({ chain: 'ethereum' });
 *
 *   // 2) 实时订阅
 *   const off = engine.subscribeSignals({ types: ['buy'] }, async (sig) => {
 *     const fired = alerts.evaluateSignal(sig);
 *     for (const a of fired) await alerts.sendAlert(a);
 *   });
 *
 *   // 3) 钱包画像
 *   const profile = await profiler.profile('0x...', 'ethereum');
 *   const pnl = await profiler.getPnL('0x...', 'ethereum', 30);
 *
 *   // 4) 排行榜
 *   const top = await profiler.getTopWallets('30d', 'pnl', 10);
 */

export * from './types';

export {
  NansenClient,
  NansenError,
  createNansenClient,
} from './nansen-client';

export {
  SignalEngine,
  type SignalEngineOptions,
  type SignalSubscription,
  type SignalHandler,
  type SignalStats,
  type WebSocketLike,
} from './signal-engine';

export {
  AlertManager,
  type AlertRule,
  type AlertRuleInput,
  type AlertRuleType,
  type AlertManagerOptions,
  type AlertEmailChannel,
  type AlertPushChannel,
  type AlertSmsChannel,
  type AlertWebhookChannel,
} from './alert-manager';

export {
  WalletProfiler,
  InMemoryFollowStore,
  type WalletProfilerOptions,
  type LeaderboardMetric,
  type LeaderboardPeriod,
  type FollowStore,
  type FollowedWallet,
} from './wallet-profiler';
