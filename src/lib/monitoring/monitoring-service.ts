/**
 * 监控服务（MonitoringService）
 *
 * 职责：
 *  - 编排 AlertEngine + MetricsCollector + Notifiers
 *  - 启动时注册所有内置规则
 *  - 默认每 10s 调用一次 evaluate()
 *  - 默认开启 ConsoleNotifier + LogNotifier
 *
 * 用法：
 *   const svc = new MonitoringService({ metrics });
 *   svc.start();
 *   // ... 应用通过 metrics.recordRpcLatency() / recordPrice() 喂入数据
 *   svc.stop();
 */

import { AlertEngine, type Alert, type AlertRule } from './alert-engine';
import { MetricsCollector } from './metrics-collector';
import {
  ConsoleNotifier,
  LogNotifier,
  MultiNotifier,
  WebhookNotifier,
  type AlertNotifier,
  type LoggerLike,
} from './notifiers';
import { createBuiltinRules, DEFAULT_THRESHOLDS, type BuiltinThresholds } from './rules';

// =============================================================================
// 公共类型
// =============================================================================

export interface MonitoringServiceOptions {
  /** MetricsCollector 实例（可选，未提供则创建新的） */
  metrics?: MetricsCollector;
  /** AlertEngine 实例（可选，未提供则创建新的） */
  engine?: AlertEngine;
  /** 主 notifier（未提供则使用默认 MultiNotifier） */
  notifier?: AlertNotifier;
  /** 评估间隔（ms），默认 10_000 */
  evaluateIntervalMs?: number;
  /** 是否启动时自动注册内置规则，默认 true */
  registerBuiltinRules?: boolean;
  /** 自定义阈值 */
  thresholds?: Partial<BuiltinThresholds>;
  /** 关注的交易对 */
  watchedSymbols?: string[];
  /** 关注的 WebSocket 名称 */
  watchedWsNames?: string[];
  /** logger（供 LogNotifier 使用） */
  logger?: LoggerLike;
  /** Webhook URL（可选，如果设置则添加 WebhookNotifier） */
  webhookUrl?: string;
  /** Webhook 格式（默认 generic） */
  webhookFormat?: 'generic' | 'wecom' | 'dingtalk' | 'slack' | 'lark';
  /** 启动后自动调用 start()，默认 true */
  autoStart?: boolean;
}

const DEFAULT_EVALUATE_INTERVAL_MS = 10_000;

// =============================================================================
// MonitoringService
// =============================================================================

export class MonitoringService {
  public readonly metrics: MetricsCollector;
  public readonly engine: AlertEngine;
  public readonly notifier: AlertNotifier;
  /** 当 notifier 被 addNotifier 包装时，这里会更新；通过 getter 保持外部可读 */
  // 注意：notifier 设计上不频繁替换，外部在调用 addNotifier 后应使用 getNotifier()
  private _dynamicNotifier: MultiNotifier | null = null;

  private readonly evaluateIntervalMs: number;
  private readonly thresholds: BuiltinThresholds;
  private readonly watchedSymbols: string[];
  private readonly watchedWsNames: string[];
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private customRules: AlertRule[] = [];

  constructor(opts: MonitoringServiceOptions = {}) {
    this.metrics = opts.metrics ?? new MetricsCollector();
    this.engine = opts.engine ?? new AlertEngine();
    this.evaluateIntervalMs = opts.evaluateIntervalMs ?? DEFAULT_EVALUATE_INTERVAL_MS;
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
    this.watchedSymbols = opts.watchedSymbols ?? ['BTC/USDT', 'ETH/USDT'];
    this.watchedWsNames = opts.watchedWsNames ?? ['binance'];

    // 默认 notifier
    if (opts.notifier) {
      this.notifier = opts.notifier;
    } else {
      const multi = new MultiNotifier([
        new ConsoleNotifier(),
        new LogNotifier({ logger: opts.logger }),
      ]);
      if (opts.webhookUrl) {
        multi.add(new WebhookNotifier({ url: opts.webhookUrl, format: opts.webhookFormat || 'generic' }));
      }
      this.notifier = multi;
    }

    // 引擎订阅 → notifier
    this.engine.onAlert((alert) => {
      try {
        const target = this._dynamicNotifier ?? this.notifier;
        const result = target.notify(alert);
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          (result as Promise<unknown>).catch(() => { /* 错误已由 notifier 内部处理 */ });
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[MonitoringService] notifier error:', err);
      }
    });

    // 注册内置规则
    if (opts.registerBuiltinRules !== false) {
      const rules = createBuiltinRules(
        this.metrics,
        this.thresholds,
        this.watchedSymbols,
        this.watchedWsNames,
      );
      for (const r of rules) this.engine.addRule(r);
    }

    if (opts.autoStart !== false) {
      this.start();
    }
  }

  // -------------------------------------------------------------------------
  // 生命周期
  // -------------------------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.tick().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[MonitoringService] tick error:', err);
      });
    }, this.evaluateIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** 主动触发一次评估（用于测试或手工触发） */
  async tick(): Promise<Alert[]> {
    return this.engine.evaluate();
  }

  // -------------------------------------------------------------------------
  // 规则与 notifier 扩展
  // -------------------------------------------------------------------------

  addRule(rule: AlertRule): void {
    this.customRules.push(rule);
    this.engine.addRule(rule);
  }

  addNotifier(notifier: AlertNotifier): void {
    if (this.notifier instanceof MultiNotifier) {
      this.notifier.add(notifier);
    } else {
      // 包装成 MultiNotifier 并切换引用
      const multi = new MultiNotifier([this.notifier, notifier]);
      this._dynamicNotifier = multi;
    }
  }

  /** 获取当前生效的 notifier（考虑 addNotifier 包装） */
  getNotifier(): AlertNotifier {
    return this._dynamicNotifier ?? this.notifier;
  }

  // -------------------------------------------------------------------------
  // 便捷工具：直接记录数据
  // -------------------------------------------------------------------------

  recordRpc(chain: string, node: string, latencyMs: number, success: boolean, error?: string): void {
    if (success) {
      this.metrics.recordRpcSuccess(chain, node, latencyMs);
    } else {
      this.metrics.recordRpcFailure(chain, node, error || 'unknown');
    }
  }

  recordPrice(symbol: string, price: number, source: string): void {
    this.metrics.recordPrice(symbol, price, source);
  }

  recordBlock(chain: string, blockNumber: number): void {
    this.metrics.recordBlock(chain, blockNumber);
  }

  recordWs(name: string, status: 'connected' | 'disconnected' | 'connecting'): void {
    this.metrics.recordWsStatus(name, status);
  }

  // -------------------------------------------------------------------------
  // 状态查询
  // -------------------------------------------------------------------------

  getActiveAlerts() { return this.engine.getActiveAlerts(); }
  getResolvedAlerts() { return this.engine.getResolvedAlerts(); }
  listRules() { return this.engine.listRules(); }
}

// =============================================================================
// 工厂
// =============================================================================

export function createMonitoringService(opts?: MonitoringServiceOptions): MonitoringService {
  return new MonitoringService(opts);
}

export default MonitoringService;
