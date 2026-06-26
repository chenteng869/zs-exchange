/**
 * WalletConnect 会话管理
 * 管理 WalletConnect v2 会话的创建、维护、销毁和持久化
 * 支持多会话管理、会话恢复和过期检测
 */

import type { WCSession, WCMetadata, WCNamespace } from './wc-utils';
import { isSessionExpired, generateRandomId, toCaip2ChainId } from './wc-utils';
import type { DAppSession, DAppInfo, DAppPermission, Address, ChainConfig, AccountInfo } from '../sdk.types';

/**
 * 会话存储键前缀
 */
const SESSION_STORAGE_KEY = 'wc_sessions';

/**
 * 配对存储键前缀
 */
const PAIRING_STORAGE_KEY = 'wc_pairings';

/**
 * 配对信息
 */
export interface WCPairingInfo {
  topic: string;
  relay: string;
  expiry: number;
  active: boolean;
  peerMetadata?: WCMetadata;
}

/**
 * 会话事件类型
 */
export type SessionEventType =
  | 'session_created'
  | 'session_updated'
  | 'session_deleted'
  | 'session_expired'
  | 'pairing_created'
  | 'pairing_deleted';

/**
 * 会话事件回调
 */
export type SessionEventCallback = (
  event: SessionEventType,
  data: WCSession | WCPairingInfo,
) => void;

/**
 * 会话管理器类
 * 负责管理所有 WalletConnect 会话和配对
 */
export class WCSessionManager {
  /**
   * 会话映射表
   */
  private sessions: Map<string, WCSession> = new Map();

  /**
   * 配对映射表
   */
  private pairings: Map<string, WCPairingInfo> = new Map();

  /**
   * 事件监听器
   */
  private eventListeners: Set<SessionEventCallback> = new Set();

  /**
   * 存储键前缀
   */
  private storagePrefix: string;

  /**
   * 最大会话数
   */
  private maxSessions: number;

  /**
   * 构造函数
   * @param storagePrefix 存储键前缀
   * @param maxSessions 最大会话数
   */
  constructor(storagePrefix: string = 'wallet_sdk', maxSessions: number = 50) {
    this.storagePrefix = storagePrefix;
    this.maxSessions = maxSessions;
    this.loadFromStorage();
    this.startExpiryCheck();
  }

  /**
   * 从本地存储加载会话和配对
   */
  private loadFromStorage(): void {
    try {
      const sessionsData = localStorage.getItem(`${this.storagePrefix}_${SESSION_STORAGE_KEY}`);
      if (sessionsData) {
        const sessions = JSON.parse(sessionsData) as WCSession[];
        for (const session of sessions) {
          if (!isSessionExpired(session.expiry)) {
            this.sessions.set(session.topic, session);
          }
        }
      }

      const pairingsData = localStorage.getItem(`${this.storagePrefix}_${PAIRING_STORAGE_KEY}`);
      if (pairingsData) {
        const pairings = JSON.parse(pairingsData) as WCPairingInfo[];
        for (const pairing of pairings) {
          if (!isSessionExpired(pairing.expiry)) {
            this.pairings.set(pairing.topic, pairing);
          }
        }
      }
    } catch (error) {
      console.error('加载 WalletConnect 会话失败:', error);
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const sessionsArray = Array.from(this.sessions.values());
      localStorage.setItem(
        `${this.storagePrefix}_${SESSION_STORAGE_KEY}`,
        JSON.stringify(sessionsArray),
      );

      const pairingsArray = Array.from(this.pairings.values());
      localStorage.setItem(
        `${this.storagePrefix}_${PAIRING_STORAGE_KEY}`,
        JSON.stringify(pairingsArray),
      );
    } catch (error) {
      console.error('保存 WalletConnect 会话失败:', error);
    }
  }

  /**
   * 启动过期检查定时器
   */
  private startExpiryCheck(): void {
    setInterval(() => {
      this.checkExpiredSessions();
    }, 60000);
  }

  /**
   * 检查过期的会话和配对
   */
  private checkExpiredSessions(): void {
    const expiredSessionTopics: string[] = [];

    for (const [topic, session] of this.sessions) {
      if (isSessionExpired(session.expiry)) {
        expiredSessionTopics.push(topic);
        this.emit('session_expired', session);
      }
    }

    for (const topic of expiredSessionTopics) {
      this.sessions.delete(topic);
    }

    const expiredPairingTopics: string[] = [];

    for (const [topic, pairing] of this.pairings) {
      if (isSessionExpired(pairing.expiry)) {
        expiredPairingTopics.push(topic);
      }
    }

    for (const topic of expiredPairingTopics) {
      this.pairings.delete(topic);
    }

    if (expiredSessionTopics.length > 0 || expiredPairingTopics.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * 触发事件
   * @param event 事件类型
   * @param data 事件数据
   */
  private emit(event: SessionEventType, data: WCSession | WCPairingInfo): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error('会话事件监听器错误:', error);
      }
    }
  }

  /**
   * 添加事件监听器
   * @param callback 回调函数
   */
  public addEventListener(callback: SessionEventCallback): void {
    this.eventListeners.add(callback);
  }

  /**
   * 移除事件监听器
   * @param callback 回调函数
   */
  public removeEventListener(callback: SessionEventCallback): void {
    this.eventListeners.delete(callback);
  }

  /**
   * 创建新会话
   * @param session 会话数据
   * @returns 创建的会话
   */
  public createSession(session: WCSession): WCSession {
    if (this.sessions.size >= this.maxSessions) {
      this.removeOldestSession();
    }

    this.sessions.set(session.topic, session);
    this.saveToStorage();
    this.emit('session_created', session);
    return session;
  }

  /**
   * 获取会话
   * @param topic 会话主题
   * @returns 会话
   */
  public getSession(topic: string): WCSession | undefined {
    const session = this.sessions.get(topic);
    if (session && isSessionExpired(session.expiry)) {
      this.deleteSession(topic);
      return undefined;
    }
    return session;
  }

  /**
   * 获取所有会话
   * @returns 会话列表
   */
  public getAllSessions(): WCSession[] {
    this.checkExpiredSessions();
    return Array.from(this.sessions.values());
  }

  /**
   * 更新会话
   * @param topic 会话主题
   * @param updates 更新内容
   * @returns 更新后的会话
   */
  public updateSession(topic: string, updates: Partial<WCSession>): WCSession | undefined {
    const session = this.sessions.get(topic);
    if (!session) return undefined;

    const updatedSession: WCSession = {
      ...session,
      ...updates,
    };

    this.sessions.set(topic, updatedSession);
    this.saveToStorage();
    this.emit('session_updated', updatedSession);
    return updatedSession;
  }

  /**
   * 删除会话
   * @param topic 会话主题
   * @returns 是否删除成功
   */
  public deleteSession(topic: string): boolean {
    const session = this.sessions.get(topic);
    if (!session) return false;

    this.sessions.delete(topic);
    this.saveToStorage();
    this.emit('session_deleted', session);
    return true;
  }

  /**
   * 删除最旧的会话
   */
  private removeOldestSession(): void {
    let oldestTopic: string | null = null;
    let oldestExpiry = Infinity;

    for (const [topic, session] of this.sessions) {
      if (session.expiry < oldestExpiry) {
        oldestTopic = topic;
        oldestExpiry = session.expiry;
      }
    }

    if (oldestTopic) {
      this.deleteSession(oldestTopic);
    }
  }

  /**
   * 清除所有会话
   */
  public clearAllSessions(): void {
    const sessions = Array.from(this.sessions.values());
    this.sessions.clear();
    this.saveToStorage();
    for (const session of sessions) {
      this.emit('session_deleted', session);
    }
  }

  /**
   * 添加配对
   * @param pairing 配对信息
   */
  public addPairing(pairing: WCPairingInfo): void {
    this.pairings.set(pairing.topic, pairing);
    this.saveToStorage();
    this.emit('pairing_created', pairing);
  }

  /**
   * 获取配对
   * @param topic 配对主题
   * @returns 配对信息
   */
  public getPairing(topic: string): WCPairingInfo | undefined {
    return this.pairings.get(topic);
  }

  /**
   * 获取所有配对
   * @returns 配对列表
   */
  public getAllPairings(): WCPairingInfo[] {
    return Array.from(this.pairings.values());
  }

  /**
   * 删除配对
   * @param topic 配对主题
   * @returns 是否删除成功
   */
  public deletePairing(topic: string): boolean {
    const pairing = this.pairings.get(topic);
    if (!pairing) return false;

    this.pairings.delete(topic);
    this.saveToStorage();
    this.emit('pairing_deleted', pairing);
    return true;
  }

  /**
   * 清除所有配对
   */
  public clearAllPairings(): void {
    this.pairings.clear();
    this.saveToStorage();
  }

  /**
   * 检查会话是否存在
   * @param topic 会话主题
   * @returns 是否存在
   */
  public hasSession(topic: string): boolean {
    const session = this.sessions.get(topic);
    if (!session) return false;
    if (isSessionExpired(session.expiry)) {
      this.deleteSession(topic);
      return false;
    }
    return true;
  }

  /**
   * 获取会话数量
   * @returns 会话数量
   */
  public getSessionCount(): number {
    this.checkExpiredSessions();
    return this.sessions.size;
  }

  /**
   * 根据对等方元数据查找会话
   * @param url 对等方 URL
   * @returns 会话列表
   */
  public findSessionsByPeerUrl(url: string): WCSession[] {
    const result: WCSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.peer.metadata.url.includes(url)) {
        result.push(session);
      }
    }
    return result;
  }

  /**
   * 根据链 ID 获取会话
   * @param chainId 链 ID
   * @returns 会话列表
   */
  public getSessionsByChainId(chainId: number): WCSession[] {
    const result: WCSession[] = [];
    const caip2ChainId = toCaip2ChainId(chainId);

    for (const session of this.sessions.values()) {
      for (const namespace of Object.values(session.namespaces)) {
        if (namespace.chains?.includes(caip2ChainId)) {
          result.push(session);
          break;
        }
      }
    }

    return result;
  }

  /**
   * 转换为 DApp 会话格式
   * @param session WalletConnect 会话
   * @returns DApp 会话
   */
  public toDAppSession(session: WCSession): DAppSession {
    const chainIds: number[] = [];
    const addresses: Address[] = [];
    const now = Date.now();

    for (const namespace of Object.values(session.namespaces)) {
      if (namespace.chains) {
        for (const chain of namespace.chains) {
          const parts = chain.split(':');
          if (parts.length === 2) {
            const chainId = parseInt(parts[1], 10);
            if (!chainIds.includes(chainId)) {
              chainIds.push(chainId);
            }
          }
        }
      }
      if (namespace.accounts) {
        for (const account of namespace.accounts) {
          const parts = account.split(':');
          if (parts.length === 3 && !addresses.includes(parts[2] as Address)) {
            addresses.push(parts[2] as Address);
          }
        }
      }
    }

    const dapp: DAppInfo = {
      name: session.peer.metadata.name,
      description: session.peer.metadata.description,
      url: session.peer.metadata.url,
      icon: session.peer.metadata.icons[0] || '',
      icons: session.peer.metadata.icons,
      source: 'walletconnect',
    };

    const permissions = Array.from(
      new Set(Object.values(session.namespaces).flatMap((namespace) => namespace.methods)),
    ) as DAppPermission[];

    return {
      id: session.topic,
      dapp,
      accounts: addresses,
      activeAccount: (addresses[0] || '') as Address,
      chainId: chainIds[0] || 1,
      permissions,
      connectedAt: now,
      lastActiveAt: now,
      status: session.expiry * 1000 <= now ? 'disconnected' : session.acknowledged ? 'active' : 'inactive',
      connectionType: 'walletconnect',
      wcTopic: session.topic,
      metadata: {
        peer: session.peer,
        self: session.self,
        namespaces: session.namespaces,
      },
    };
  }

  /**
   * 更新会话命名空间
   * @param topic 会话主题
   * @param namespaces 新的命名空间
   * @returns 更新后的会话
   */
  public updateNamespaces(
    topic: string,
    namespaces: Record<string, WCNamespace>,
  ): WCSession | undefined {
    return this.updateSession(topic, { namespaces });
  }

  /**
   * 延长会话过期时间
   * @param topic 会话主题
   * @param seconds 延长秒数
   * @returns 更新后的会话
   */
  public extendSession(topic: string, seconds: number): WCSession | undefined {
    const session = this.sessions.get(topic);
    if (!session) return undefined;

    const newExpiry = Math.floor(Date.now() / 1000) + seconds;
    return this.updateSession(topic, { expiry: newExpiry });
  }

  /**
   * 销毁会话管理器
   */
  public destroy(): void {
    this.eventListeners.clear();
    this.sessions.clear();
    this.pairings.clear();
  }

  /**
   * 导出所有会话数据
   * @returns 会话数据
   */
  public exportData(): {
    sessions: WCSession[];
    pairings: WCPairingInfo[];
  } {
    return {
      sessions: Array.from(this.sessions.values()),
      pairings: Array.from(this.pairings.values()),
    };
  }

  /**
   * 导入会话数据
   * @param data 会话数据
   */
  public importData(data: {
    sessions: WCSession[];
    pairings: WCPairingInfo[];
  }): void {
    for (const session of data.sessions) {
      if (!isSessionExpired(session.expiry)) {
        this.sessions.set(session.topic, session);
      }
    }

    for (const pairing of data.pairings) {
      if (!isSessionExpired(pairing.expiry)) {
        this.pairings.set(pairing.topic, pairing);
      }
    }

    this.saveToStorage();
  }
}
