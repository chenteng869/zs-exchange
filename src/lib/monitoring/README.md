# Monitoring · 监控告警子系统

> 实现任务 M-06（链上数据延迟告警）+ M-07（异常价格告警）的统一告警平台。

## 1. 架构图

```
                           ┌──────────────────────────┐
                           │     Application / API    │
                           │   (wallet / market 等)   │
                           └─────────┬────────────────┘
                                     │ 业务事件
                                     ▼
      ┌──────────────────────────────────────────────────────────┐
      │                  MetricsCollector                        │
      │  滑动窗口：RPC 延迟 / 价格 / 区块 / WebSocket 状态        │
      │  聚合：P50 / P99 / 平均 / 成功率 / 偏离度                │
      └──────────────────────────┬───────────────────────────────┘
                                 │ getChainAverageLatency() / ...
                                 ▼
      ┌──────────────────────────────────────────────────────────┐
      │                       AlertEngine                        │
      │   规则注册 → 周期 evaluate() → 状态机 firing/resolved   │
      │   cooldown 抑制 / 上下文注入 / 事件派发                  │
      └──────────────────────────┬───────────────────────────────┘
                                 │ onAlert
                                 ▼
      ┌──────────────────────────────────────────────────────────┐
      │                     AlertNotifier                        │
      │   ┌──────────────┐ ┌────────────┐ ┌──────────────────┐  │
      │   │ConsoleNotifier│ │LogNotifier │ │ WebhookNotifier  │  │
      │   │ (彩色 stdout) │ │(项目 logger)│ │(wecom/ding/slack)│  │
      │   └──────────────┘ └────────────┘ └──────────────────┘  │
      └──────────────────────────────────────────────────────────┘
                                 ▲
                                 │  start() / stop()
      ┌──────────────────────────┴───────────────────────────────┐
      │                    MonitoringService                      │
      │   默认 10s 评估一次 / 默认开启 Console + Log 通知器       │
      │   启动时自动注册 12 个内置规则                            │
      └──────────────────────────────────────────────────────────┘
```

## 2. 内置规则列表

### 链上数据延迟告警 (M-06)

| 规则 ID         | 描述                                  | 等级 | 默认阈值                |
| --------------- | ------------------------------------- | ---- | ----------------------- |
| `RPC_LATENCY_ETH` | ETH RPC 平均延迟超过阈值            | P1   | 3_000 ms                |
| `RPC_LATENCY_BSC` | BSC RPC 平均延迟超过阈值            | P1   | 2_000 ms                |
| `RPC_DOWN_ETH`  | ETH RPC 主源连续失败次数达到阈值       | P0   | 3 次                    |
| `RPC_DOWN_BSC`  | BSC RPC 主源连续失败次数达到阈值       | P0   | 3 次                    |
| `BLOCK_STALE_ETH` | ETH 区块 N 秒未更新                 | P1   | 300_000 ms (5 分钟)     |
| `BLOCK_STALE_BSC` | BSC 区块 N 秒未更新                 | P1   | 120_000 ms (2 分钟)     |

### 异常价格偏离告警 (M-07)

| 规则 ID           | 描述                                  | 等级 | 默认阈值                |
| ----------------- | ------------------------------------- | ---- | ----------------------- |
| `PRICE_DEVIATION_BTC` | BTC 多源价格偏离超过阈值         | P1   | 3%                      |
| `PRICE_DEVIATION_ETH` | ETH 多源价格偏离超过阈值         | P1   | 3%                      |
| `PRICE_SPIKE_BTC`  | BTC 1 分钟内价格变化超过阈值         | P0   | 5%                      |
| `PRICE_SPIKE_ETH`  | ETH 1 分钟内价格变化超过阈值         | P0   | 5%                      |
| `STALE_TICKER`    | 任一关注交易对 30s 未更新              | P2   | 30_000 ms               |
| `WS_DISCONNECTED_<NAME>` | WebSocket N 秒断开             | P1   | 10_000 ms               |

> 所有阈值可在构造 `MonitoringService` 时通过 `thresholds` 覆盖。

## 3. 快速开始

```ts
import { createMonitoringService } from '@/lib/monitoring';

const monitoring = createMonitoringService({
  webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=YOUR_KEY',
  webhookFormat: 'dingtalk',
  evaluateIntervalMs: 10_000,  // 默认 10s
});

// 1) 业务侧喂入数据
monitoring.recordRpc('ETH', 'https://cloudflare-eth.com', 150, true);
monitoring.recordPrice('BTC/USDT', 65_000, 'binance');
monitoring.recordBlock('ETH', 19_000_000);
monitoring.recordWs('binance', 'connected');

// 2) 服务启动后自动每 10s 评估一次
// 3) 告警 firing → resolved 自动通过 notifier 派发

// 应用退出
monitoring.stop();
```

## 4. 添加自定义规则

```ts
import { createMonitoringService } from '@/lib/monitoring';

const monitoring = createMonitoringService({
  registerBuiltinRules: false,  // 仅注册自定义规则
  notifier: {
    name: 'slack',
    notify: async (alert) => {
      // 推送到 Slack / PagerDuty / 自定义通道
    },
  },
});

monitoring.addRule({
  id: 'CUSTOM_RISK_ENGINE_DOWN',
  description: '风控引擎不可用',
  severity: 'P0',
  cooldownMs: 30_000,
  evaluator: async () => {
    const res = await fetch('http://risk-engine/health').catch(() => null);
    return !res || !res.ok;
  },
  contextProvider: () => ({
    service: 'risk-engine',
    lastCheck: new Date().toISOString(),
  }),
});

monitoring.start();
```

## 5. 集成现有 RPC / Binance 客户端

```ts
// src/lib/wallet/rpc-client.ts 内部
import { monitoring } from './monitoring-bootstrap';

async call(method: string, params: any[], options: any) {
  const start = Date.now();
  try {
    const result = await this.send(...);
    monitoring.metrics.recordRpcSuccess('ETH', endpoint, Date.now() - start);
    return result;
  } catch (err) {
    monitoring.metrics.recordRpcFailure('ETH', endpoint, err.message);
    throw err;
  }
}

// src/lib/market/binance-client.ts 内部
ws.onmessage = (ev) => {
  const ticker = parse(ev.data);
  monitoring.metrics.recordPrice(ticker.symbol, parseFloat(ticker.lastPrice), 'binance');
  monitoring.metrics.recordWsStatus('binance', 'connected');
};

ws.onclose = () => {
  monitoring.metrics.recordWsStatus('binance', 'disconnected');
};
```

## 6. 接入 Grafana / PagerDuty

### Grafana

`AlertNotifier` 接口允许任意实现，最简方案是**把告警事件以 JSON 行格式写入文件**，由 [Prometheus textfile collector](https://github.com/prometheus/node_exporter#textfile-collector) 或 Vector / Fluent Bit 抓取：

```ts
import { writeFileSync, appendFileSync } from 'fs';

const fileNotifier = {
  name: 'prom-file',
  notify(alert) {
    const line = JSON.stringify({
      timestamp: alert.firedAt,
      rule: alert.rule,
      severity: alert.severity,
      status: alert.status,
      ...alert.context,
    });
    appendFileSync('/var/lib/node_exporter/textfile/alert.prom', line + '\n');
  },
};
```

或者直接通过 `WebhookNotifier` 推送 Prometheus Alertmanager 的 webhook：

```ts
new WebhookNotifier({
  url: 'https://alertmanager.example.com/api/v1/alerts',
  format: 'generic',
  transform: (alert) => ({
    labels: { rule: alert.rule, severity: alert.severity },
    annotations: { summary: alert.message, context: JSON.stringify(alert.context) },
    startsAt: new Date(alert.firedAt).toISOString(),
    endsAt: alert.resolvedAt ? new Date(alert.resolvedAt).toISOString() : undefined,
  }),
});
```

### PagerDuty

PagerDuty 接受 `Events API v2`，只需在 `transform` 里构造：

```ts
new WebhookNotifier({
  url: 'https://events.pagerduty.com/v2/enqueue',
  format: 'generic',
  transform: (alert) => ({
    routing_key: process.env.PAGERDUTY_ROUTING_KEY,
    event_action: alert.status === 'firing' ? 'trigger' : 'resolve',
    payload: {
      summary: `[${alert.severity}] ${alert.rule}: ${alert.message}`,
      source: 'smy-exchange',
      severity: alert.severity === 'P0' ? 'critical' : alert.severity === 'P1' ? 'error' : 'warning',
      custom_details: alert.context,
    },
    dedup_key: alert.rule,
  }),
});
```

## 7. 目录结构

```
src/lib/monitoring/
├── alert-engine.ts          AlertEngine + Alert / AlertRule 类型
├── metrics-collector.ts     MetricsCollector + SlidingWindow + 统计工具
├── notifiers.ts             Console / Log / Webhook / Multi notifier
├── rules.ts                 12 个内置规则 + 阈值配置
├── monitoring-service.ts    MonitoringService 编排
├── index.ts                 统一导出
└── README.md                本文件
```

## 8. 测试

```bash
npx tsx tests/monitoring.test.ts
```

覆盖：

- AlertEngine 触发 / cooldown / resolved 自动切换 / 异步 evaluator
- MetricsCollector 滑动窗口 / P50 / P99 / 跨节点聚合 / 偏离度 / spike
- 6 个内置规则触发逻辑（RPC_LATENCY_ETH / RPC_DOWN_ETH / BLOCK_STALE_BSC / PRICE_DEVIATION_BTC / PRICE_SPIKE_ETH / WS_DISCONNECTED）
- Console / Log / Webhook / Multi notifier
- MonitoringService start / stop / addRule / addNotifier / 端到端 firing→resolved
