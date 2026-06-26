/**
 * 推送业务编排层（PushService）— L-01 / L-02 / L-03 业务聚合
 *
 * 职责：
 *  - 设备 token 注册表：userId → DeviceToken[]
 *  - 按 platform 自动选 provider（android→FCM、ios→FCM/APNs、harmony→HMS、web→FCM）
 *  - 多设备并发推送
 *  - 批量推送（按 PUSH_BATCH_SIZE 分批）
 *  - 广播（用 topic，所有 FCM 客户端会订阅）
 *  - 失效 token 清理
 *  - 事件总线 onPushSent(handler)
 *  - 统计：totalSent / successRate / byProvider
 *
 * 演示降级：
 *  - 任一 client 未配置 → 该 provider 视为 mock 模式
 *  - provider 切换：FCM 不可用时 iOS 自动降级到 APNs（如果配置了）
 *
 * 用法：
 *   const svc = new PushService({ fcm, apns, hms });
 *   svc.registerDevice('user-1', { token: 'xxx', platform: 'android' });
 *   const results = await svc.sendToUser('user-1', { title, body });
 */

import { logger as defaultLogger } from '../../logger';
import { FcmClient } from './fcm-client';
import { ApnsClient } from './apns-client';
import { HmsClient } from './hms-client';
import {
  PUSH_BATCH_SIZE,
  defaultProviderFor,
  type DeviceToken,
  type DevicePlatform,
  type PushPayload,
  type PushProvider,
  type PushResult,
} from './types';

// =============================================================================
// 公共类型
// =============================================================================

export interface PushStats {
  totalSent: number;
  successCount: number;
  failureCount: number;
  byProvider: Record<PushProvider, { sent: number; success: number }>;
}

export type PushEventHandler = (event: {
  type: 'sent' | 'registered' | 'unregistered' | 'invalidated' | 'broadcast';
  results?: PushResult[];
  userId?: string;
  token?: string;
}) => void;

export interface PushServiceOptions {
  fcm?: FcmClient;
  apns?: ApnsClient;
  hms?: HmsClient;
  /** 事件总线回调 */
  onEvent?: PushEventHandler;
  /** logger */
  logger?: typeof defaultLogger;
  /** 时钟 */
  now?: () => number;
}

// =============================================================================
// PushService
// =============================================================================

export class PushService {
  private readonly fcm?: FcmClient;
  private readonly apns?: ApnsClient;
  private readonly hms?: HmsClient;
  private readonly onEvent?: PushEventHandler;
  private readonly logger: typeof defaultLogger;
  private readonly now: () => number;

  /** userId → DeviceToken[]（内存表） */
  private readonly deviceMap = new Map<string, DeviceToken[]>();

  /** token → userId 反向索引（用于 invalidateToken 清理） */
  private readonly tokenIndex = new Map<string, string>();

  /** 事件订阅者 */
  private readonly subscribers = new Set<PushEventHandler>();

  /** 统计 */
  private readonly stats: PushStats = {
    totalSent: 0,
    successCount: 0,
    failureCount: 0,
    byProvider: {
      FCM: { sent: 0, success: 0 },
      APNS: { sent: 0, success: 0 },
      HMS: { sent: 0, success: 0 },
    },
  };

  constructor(opts: PushServiceOptions = {}) {
    this.fcm = opts.fcm;
    this.apns = opts.apns;
    this.hms = opts.hms;
    this.onEvent = opts.onEvent;
    this.logger = opts.logger ?? defaultLogger;
    this.now = opts.now ?? (() => Date.now());
  }

  // -------------------------------------------------------------------------
  // 设备注册
  // -------------------------------------------------------------------------

  /** 注册设备（同 token 重复注册视为刷新） */
  registerDevice(userId: string, device: DeviceToken): void {
    if (!userId) throw new Error('PushService.registerDevice: userId is required');
    if (!device?.token) throw new Error('PushService.registerDevice: device.token is required');

    const list = this.deviceMap.get(userId) ?? [];
    const idx = list.findIndex((d) => d.token === device.token);
    if (idx >= 0) {
      list[idx] = device;
    } else {
      list.push(device);
    }
    this.deviceMap.set(userId, list);
    this.tokenIndex.set(device.token, userId);

    this.emit({ type: 'registered', userId, token: device.token });
  }

  /** 注销设备（按 token） */
  unregisterDevice(userId: string, token: string): void {
    const list = this.deviceMap.get(userId);
    if (!list) return;
    const next = list.filter((d) => d.token !== token);
    if (next.length === 0) {
      this.deviceMap.delete(userId);
    } else {
      this.deviceMap.set(userId, next);
    }
    this.tokenIndex.delete(token);

    this.emit({ type: 'unregistered', userId, token });
  }

  /** 取得用户所有设备 */
  getUserDevices(userId: string): DeviceToken[] {
    return [...(this.deviceMap.get(userId) ?? [])];
  }

  /** 清理失效 token（厂商返回 invalid_token 时调用） */
  invalidateToken(token: string): void {
    const userId = this.tokenIndex.get(token);
    if (!userId) return;
    this.unregisterDevice(userId, token);
    this.logger.info(`[PushService] invalidated token userId=${userId} token=${token.slice(0, 8)}...`);
  }

  // -------------------------------------------------------------------------
  // 推送 API
  // -------------------------------------------------------------------------

  /**
   * 向单个用户推送（多设备并发）
   *  - preferredProvider: 强制走某个 provider（否则按 device.platform 自动选）
   *  - 自动调用 invalidateToken（status === 'invalid_token'）
   */
  async sendToUser(
    userId: string,
    payload: PushPayload,
    preferredProvider?: PushProvider,
  ): Promise<PushResult[]> {
    const devices = this.getUserDevices(userId);
    if (devices.length === 0) {
      this.logger.warn(`[PushService] sendToUser: no devices for userId=${userId}`);
      return [];
    }

    const tasks = devices.map((d) => this.sendToDevice(d, payload, preferredProvider));
    const results = await Promise.all(tasks);

    // 清理失效 token
    for (const r of results) {
      if (r.status === 'invalid_token') {
        this.invalidateToken(r.token);
      }
    }

    this.recordStats(results);
    this.emit({ type: 'sent', userId, results });
    return results;
  }

  /** 批量向多用户推送（每个用户内部并发） */
  async sendToUsers(userIds: string[], payload: PushPayload): Promise<PushResult[]> {
    const allResults: PushResult[] = [];
    // 按 PUSH_BATCH_SIZE 分批
    for (let i = 0; i < userIds.length; i += PUSH_BATCH_SIZE) {
      const batch = userIds.slice(i, i + PUSH_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((uid) => this.sendToUser(uid, payload)),
      );
      for (const r of batchResults) allResults.push(...r);
    }
    return allResults;
  }

  /**
   * 广播：所有平台都推
   *  - FCM / APNs：直接通过 client 推送（mock 模式也算成功）
   *  - 实际生产可以维护 FCM topic 订阅；这里简化为：先按 platform 走客户端
   */
  async sendBroadcast(payload: PushPayload): Promise<PushResult[]> {
    const results: PushResult[] = [];

    // FCM 主题广播（业务侧维护订阅关系）
    if (this.fcm) {
      try {
        const r = await this.fcm.sendToTopic('broadcast', payload);
        results.push(r);
      } catch (err) {
        results.push(this.buildErrorResult('FCM', 'broadcast', err));
      }
    }

    // HMS 主题广播
    if (this.hms) {
      try {
        const r = await this.hms.sendToTopic('broadcast', payload);
        results.push(r);
      } catch (err) {
        results.push(this.buildErrorResult('HMS', 'broadcast', err));
      }
    }

    this.recordStats(results);
    this.emit({ type: 'broadcast', results });
    return results;
  }

  // -------------------------------------------------------------------------
  // 事件订阅
  // -------------------------------------------------------------------------

  /** 订阅推送事件，返回 unsubscribe 函数 */
  onPushSent(handler: PushEventHandler): () => void {
    this.subscribers.add(handler);
    return () => this.subscribers.delete(handler);
  }

  private emit(event: Parameters<PushEventHandler>[0]): void {
    if (this.onEvent) {
      try { this.onEvent(event); } catch (err) {
        this.logger.warn(`[PushService] onEvent handler error: ${(err as Error).message}`);
      }
    }
    for (const h of this.subscribers) {
      try { h(event); } catch (err) {
        this.logger.warn(`[PushService] subscriber error: ${(err as Error).message}`);
      }
    }
  }

  // -------------------------------------------------------------------------
  // 统计
  // -------------------------------------------------------------------------

  getStats(): PushStats {
    return {
      totalSent: this.stats.totalSent,
      successCount: this.stats.successCount,
      failureCount: this.stats.failureCount,
      byProvider: {
        FCM: { ...this.stats.byProvider.FCM },
        APNS: { ...this.stats.byProvider.APNS },
        HMS: { ...this.stats.byProvider.HMS },
      },
    };
  }

  /** 重置统计 */
  resetStats(): void {
    this.stats.totalSent = 0;
    this.stats.successCount = 0;
    this.stats.failureCount = 0;
    this.stats.byProvider.FCM = { sent: 0, success: 0 };
    this.stats.byProvider.APNS = { sent: 0, success: 0 };
    this.stats.byProvider.HMS = { sent: 0, success: 0 };
  }

  private recordStats(results: PushResult[]): void {
    for (const r of results) {
      this.stats.totalSent++;
      this.stats.byProvider[r.provider].sent++;
      if (r.status === 'success') {
        this.stats.successCount++;
        this.stats.byProvider[r.provider].success++;
      } else {
        this.stats.failureCount++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 内部：单设备发送（带降级）
  // -------------------------------------------------------------------------

  private async sendToDevice(
    device: DeviceToken,
    payload: PushPayload,
    preferredProvider?: PushProvider,
  ): Promise<PushResult> {
    const providers = this.resolveProviders(device.platform, preferredProvider);

    let lastResult: PushResult | null = null;
    for (const provider of providers) {
      try {
        const r = await this.dispatch(provider, device, payload);
        // 成功或限流：返回
        if (r.status === 'success' || r.status === 'invalid_token' || r.status === 'rate_limited') {
          return r;
        }
        lastResult = r;
      } catch (err) {
        lastResult = this.buildErrorResult(provider, device.token, err);
      }
    }

    return lastResult ?? this.buildErrorResult('FCM', device.token, new Error('No provider available'));
  }

  /**
   * 解析 provider 列表（含降级链）
   *  - iOS:    FCM → APNs
   *  - android: FCM
   *  - harmony: HMS
   *  - web:    FCM
   */
  private resolveProviders(platform: DevicePlatform, preferred?: PushProvider): PushProvider[] {
    if (preferred) return [preferred];
    if (platform === 'ios') {
      // iOS 降级链：FCM → APNs
      const chain: PushProvider[] = [];
      if (this.fcm) chain.push('FCM');
      if (this.apns) chain.push('APNS');
      return chain.length > 0 ? chain : ['FCM'];
    }
    if (platform === 'harmony') {
      return this.hms ? ['HMS'] : ['FCM'];
    }
    return [defaultProviderFor(platform)];
  }

  private async dispatch(
    provider: PushProvider,
    device: DeviceToken,
    payload: PushPayload,
  ): Promise<PushResult> {
    switch (provider) {
      case 'FCM':
        if (!this.fcm) return this.mockResult(provider, device.token, 'success');
        return this.fcm.sendToToken(device.token, payload);
      case 'APNS':
        if (!this.apns) return this.mockResult(provider, device.token, 'success');
        return this.apns.sendToToken(device.token, payload);
      case 'HMS':
        if (!this.hms) return this.mockResult(provider, device.token, 'success');
        return this.hms.sendToToken(device.token, payload);
      default:
        return this.mockResult('FCM', device.token, 'failed');
    }
  }

  private mockResult(provider: PushProvider, token: string, status: 'success' | 'failed'): PushResult {
    return {
      messageId: `MOCK-${provider}-${token.slice(0, 6)}`,
      provider,
      token,
      status,
      sentAt: this.now(),
    };
  }

  private buildErrorResult(provider: PushProvider, token: string, err: unknown): PushResult {
    return {
      messageId: '',
      provider,
      token,
      status: 'failed',
      errorCode: '-1',
      errorMessage: (err as Error).message ?? 'unknown',
      sentAt: this.now(),
    };
  }
}

// =============================================================================
// 工厂
// =============================================================================

export function createPushService(opts: PushServiceOptions = {}): PushService {
  return new PushService(opts);
}

export default PushService;
