/**
 * WalletConnect 工具函数
 * 提供 WalletConnect v2 协议相关的工具方法
 * 包含 URI 解析、会话验证、消息编解码等功能
 */

import type { ChainConfig, AccountInfo, Address } from '../sdk.types';

/**
 * WalletConnect 协议版本
 */
export const WC_PROTOCOL_VERSION = '2';

/**
 * WalletConnect 默认端口
 */
export const WC_DEFAULT_RELAY_URL = 'wss://relay.walletconnect.com';

/**
 * WalletConnect 提案类型
 */
export interface WCPairingProposal {
  id: number;
  params: {
    pairingTopic: string;
    expiry: number;
    requiredNamespaces: Record<string, WCNamespace>;
    optionalNamespaces?: Record<string, WCNamespace>;
    sessionProperties?: Record<string, string>;
    proposer: {
      publicKey: string;
      metadata: WCMetadata;
    };
  };
}

/**
 * WalletConnect 命名空间
 */
export interface WCNamespace {
  chains: string[];
  methods: string[];
  events: string[];
  accounts?: string[];
}

/**
 * WalletConnect 元数据
 */
export interface WCMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

/**
 * WalletConnect 会话
 */
export interface WCSession {
  topic: string;
  pairingTopic: string;
  relay: {
    protocol: string;
    data?: any;
  };
  expiry: number;
  acknowledged: boolean;
  controller: string;
  namespaces: Record<string, WCNamespace>;
  peer: {
    publicKey: string;
    metadata: WCMetadata;
  };
  self: {
    publicKey: string;
    metadata: WCMetadata;
  };
}

/**
 * WalletConnect 请求事件
 */
export interface WCRequestEvent {
  id: number;
  topic: string;
  params: {
    request: {
      method: string;
      params: any[];
    };
    chainId: string;
  };
}

/**
 * 解析 WalletConnect URI
 * @param uri WalletConnect URI
 * @returns 解析后的参数
 */
export function parseWalletConnectUri(uri: string): {
  protocol: string;
  topic: string;
  version: number;
  relayUrl: string;
  symKey: string;
  expiry?: number;
} {
  if (!uri || typeof uri !== 'string') {
    throw new Error('无效的 WalletConnect URI');
  }

  const regex = /^wc:([0-9a-f]+)@(\d+)\?/;
  const match = uri.match(regex);

  if (!match) {
    throw new Error('无效的 WalletConnect URI 格式');
  }

  const topic = match[1];
  const version = parseInt(match[2], 10);

  if (version !== 2) {
    throw new Error(`不支持的 WalletConnect 版本: v${version}，仅支持 v2`);
  }

  const params = new URLSearchParams(uri.split('?')[1]);

  const relayUrl = params.get('relay-protocol')
    ? `${params.get('relay-protocol') === 'irn' ? WC_DEFAULT_RELAY_URL : params.get('relay-protocol')}`
    : WC_DEFAULT_RELAY_URL;

  const symKey = params.get('symKey');
  if (!symKey) {
    throw new Error('WalletConnect URI 缺少 symKey 参数');
  }

  const expiryParam = params.get('expiryTimestamp');
  const expiry = expiryParam ? parseInt(expiryParam, 10) : undefined;

  return {
    protocol: 'wc',
    topic,
    version,
    relayUrl,
    symKey,
    expiry,
  };
}

/**
 * 生成 WalletConnect URI
 * @param topic 会话主题
 * @param symKey 对称密钥
 * @param relayUrl 中继 URL
 * @param expiry 过期时间戳
 * @returns WalletConnect URI
 */
export function generateWalletConnectUri(
  topic: string,
  symKey: string,
  relayUrl: string = WC_DEFAULT_RELAY_URL,
  expiry?: number,
): string {
  const params = new URLSearchParams();
  params.set('symKey', symKey);
  params.set('relay-protocol', 'irn');

  if (expiry) {
    params.set('expiryTimestamp', expiry.toString());
  }

  return `wc:${topic}@${WC_PROTOCOL_VERSION}?${params.toString()}`;
}

/**
 * 构建 CAIP-2 链标识
 * @param chainId 链 ID
 * @param namespace 命名空间
 * @returns CAIP-2 链标识
 */
export function toCaip2ChainId(chainId: number, namespace: string = 'eip155'): string {
  return `${namespace}:${chainId}`;
}

/**
 * 解析 CAIP-2 链标识
 * @param caip2ChainId CAIP-2 链标识
 * @returns 链 ID 和命名空间
 */
export function fromCaip2ChainId(caip2ChainId: string): {
  namespace: string;
  chainId: number;
} {
  const parts = caip2ChainId.split(':');
  if (parts.length !== 2) {
    throw new Error(`无效的 CAIP-2 链标识: ${caip2ChainId}`);
  }
  return {
    namespace: parts[0],
    chainId: parseInt(parts[1], 10),
  };
}

/**
 * 构建 CAIP-10 账户标识
 * @param address 地址
 * @param chainId 链 ID
 * @param namespace 命名空间
 * @returns CAIP-10 账户标识
 */
export function toCaip10Account(
  address: string,
  chainId: number,
  namespace: string = 'eip155',
): string {
  return `${namespace}:${chainId}:${address}`;
}

/**
 * 解析 CAIP-10 账户标识
 * @param caip10Account CAIP-10 账户标识
 * @returns 地址、链 ID 和命名空间
 */
export function fromCaip10Account(caip10Account: string): {
  namespace: string;
  chainId: number;
  address: string;
} {
  const parts = caip10Account.split(':');
  if (parts.length !== 3) {
    throw new Error(`无效的 CAIP-10 账户标识: ${caip10Account}`);
  }
  return {
    namespace: parts[0],
    chainId: parseInt(parts[1], 10),
    address: parts[2],
  };
}

/**
 * 验证 EVM 方法是否为 EIP-1193 标准方法
 * @param method 方法名
 * @returns 是否为标准方法
 */
export function isStandardEvmMethod(method: string): boolean {
  const standardMethods = [
    'eth_accounts',
    'eth_chainId',
    'eth_requestAccounts',
    'eth_sendTransaction',
    'eth_sign',
    'eth_signTransaction',
    'eth_signTypedData',
    'eth_signTypedData_v1',
    'eth_signTypedData_v3',
    'eth_signTypedData_v4',
    'personal_sign',
    'wallet_switchEthereumChain',
    'wallet_addEthereumChain',
    'wallet_watchAsset',
    'wallet_getPermissions',
    'wallet_requestPermissions',
    'eth_blockNumber',
    'eth_call',
    'eth_estimateGas',
    'eth_gasPrice',
    'eth_getBalance',
    'eth_getBlockByHash',
    'eth_getBlockByNumber',
    'eth_getCode',
    'eth_getTransactionByHash',
    'eth_getTransactionReceipt',
    'eth_getLogs',
    'net_version',
    'web3_clientVersion',
    'web3_sha3',
  ];
  return standardMethods.includes(method);
}

/**
 * 验证 EVM 事件是否为标准事件
 * @param event 事件名
 * @returns 是否为标准事件
 */
export function isStandardEvmEvent(event: string): boolean {
  const standardEvents = [
    'chainChanged',
    'accountsChanged',
    'message',
    'connect',
    'disconnect',
  ];
  return standardEvents.includes(event);
}

/**
 * 从命名空间中提取链 ID 列表
 * @param namespaces 命名空间
 * @returns 链 ID 列表
 */
export function extractChainIdsFromNamespaces(
  namespaces: Record<string, WCNamespace>,
): number[] {
  const chainIds: number[] = [];

  for (const namespace of Object.values(namespaces)) {
    if (namespace.chains) {
      for (const chain of namespace.chains) {
        try {
          const { chainId } = fromCaip2ChainId(chain);
          if (!chainIds.includes(chainId)) {
            chainIds.push(chainId);
          }
        } catch {
          // 忽略无效的链 ID
        }
      }
    }
  }

  return chainIds;
}

/**
 * 构建会话命名空间
 * @param accounts 账户列表
 * @param chains 链列表
 * @param methods 方法列表
 * @param events 事件列表
 * @returns 命名空间
 */
export function buildSessionNamespaces(
  accounts: AccountInfo[],
  chains: ChainConfig[],
  methods: string[],
  events: string[],
): Record<string, WCNamespace> {
  const evmAccounts: string[] = [];
  const evmChains: string[] = [];

  for (const chain of chains) {
    if (chain.chainType === 'evm') {
      evmChains.push(toCaip2ChainId(chain.chainId));
      for (const account of accounts) {
        evmAccounts.push(toCaip10Account(account.address, chain.chainId));
      }
    }
  }

  if (evmChains.length === 0) {
    return {};
  }

  return {
    eip155: {
      chains: evmChains,
      accounts: evmAccounts,
      methods,
      events,
    },
  };
}

/**
 * 生成随机 ID
 * @returns 随机 ID
 */
export function generateRandomId(): number {
  return Math.floor(Math.random() * Date.now());
}

/**
 * 生成随机十六进制字符串
 * @param length 长度（字节数）
 * @returns 十六进制字符串
 */
export function generateRandomHex(length: number = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 检查会话是否过期
 * @param expiry 过期时间戳
 * @returns 是否过期
 */
export function isSessionExpired(expiry: number): boolean {
  return Date.now() / 1000 >= expiry;
}

/**
 * 格式化会话剩余时间
 * @param expiry 过期时间戳
 * @returns 格式化的剩余时间
 */
export function formatSessionRemainingTime(expiry: number): string {
  const now = Date.now() / 1000;
  const remaining = expiry - now;

  if (remaining <= 0) {
    return '已过期';
  }

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);

  if (days > 0) {
    return `${days} 天 ${hours} 小时`;
  } else if (hours > 0) {
    return `${hours} 小时 ${minutes} 分钟`;
  } else {
    return `${minutes} 分钟`;
  }
}

/**
 * 截断地址显示
 * @param address 地址
 * @param start 开头显示字符数
 * @param end 结尾显示字符数
 * @returns 截断后的地址
 */
export function truncateAddress(address: string, start: number = 6, end: number = 4): string {
  if (!address || address.length <= start + end) {
    return address || '';
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * 验证地址格式是否有效
 * @param address 地址
 * @returns 是否有效
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 延迟执行
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 防抖函数
 * @param fn 函数
 * @param delay 延迟毫秒数
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * 节流函数
 * @param fn 函数
 * @param limit 节流时间
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
