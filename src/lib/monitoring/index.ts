/**
 * 监控子系统（Monitoring）
 *
 * 导出：
 *  - 类型：Alert, AlertRule, AlertSeverity, AlertStatus, AlertHandler
 *  - AlertEngine：告警规则与生命周期管理
 *  - MetricsCollector：滑动窗口指标采集
 *  - Notifiers：ConsoleNotifier / LogNotifier / WebhookNotifier / MultiNotifier
 *  - Rules：createBuiltinRules / DEFAULT_THRESHOLDS
 *  - MonitoringService：编排器
 *
 * 用法：
 *   import { MonitoringService, createMonitoringService } from '@/lib/monitoring';
 *
 *   const m = createMonitoringService({ webhookUrl: 'https://...' });
 *   m.recordRpc('ETH', 'https://cloudflare-eth.com', 150, true);
 *   m.recordPrice('BTC/USDT', 65000, 'binance');
 *   m.recordBlock('ETH', 19000000);
 *   m.recordWs('binance', 'connected');
 *   // 引擎每 10s 评估一次，告警自动派发到 notifier
 */

export * from './alert-engine';
export * from './metrics-collector';
export * from './notifiers';
export * from './rules';
export * from './monitoring-service';
