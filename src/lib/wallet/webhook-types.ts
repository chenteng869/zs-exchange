/**
 * Alchemy Webhook 类型枚举与签名密钥解析
 *
 * 2026-07-11 升级：支持 5 类 Alchemy Webhook
 *  - ADDRESS_ACTIVITY · 充值地址活动（已用）
 *  - MINED_TRANSACTIONS · 提现交易上链
 *  - DROPPED_TRANSACTIONS · 提现卡单
 *  - NFT_ACTIVITY · 数字藏品活动
 *  - SOLANA · Solana 链事件
 */

import type { WebhookSignatureError } from './webhook-verifier';

// =============================================================================
// Webhook 类型
// =============================================================================

export type AlchemyWebhookType =
  | 'ADDRESS_ACTIVITY'
  | 'MINED_TRANSACTIONS'
  | 'DROPPED_TRANSACTIONS'
  | 'NFT_ACTIVITY'
  | 'SOLANA';

export const WEBHOOK_TYPES: AlchemyWebhookType[] = [
  'ADDRESS_ACTIVITY',
  'MINED_TRANSACTIONS',
  'DROPPED_TRANSACTIONS',
  'NFT_ACTIVITY',
  'SOLANA',
];

// =============================================================================
// 签名密钥解析（按类型取对应 key）
// =============================================================================

/**
 * 环境变量映射
 *  - 优先 ALCHEMY_WEBHOOK_<TYPE>_KEY
 *  - 次选 ALCHEMY_WEBHOOK_SIGNING_KEY（兼容旧版单一 key）
 */
const ENV_KEY_MAP: Record<AlchemyWebhookType, string[]> = {
  ADDRESS_ACTIVITY:      ['ALCHEMY_WEBHOOK_ADDRESS_ACTIVITY_KEY', 'ALCHEMY_WEBHOOK_SIGNING_KEY'],
  MINED_TRANSACTIONS:    ['ALCHEMY_WEBHOOK_MINED_KEY',           'ALCHEMY_WEBHOOK_SIGNING_KEY'],
  DROPPED_TRANSACTIONS:  ['ALCHEMY_WEBHOOK_DROPPED_KEY',         'ALCHEMY_WEBHOOK_SIGNING_KEY'],
  NFT_ACTIVITY:          ['ALCHEMY_WEBHOOK_NFT_KEY',             'ALCHEMY_WEBHOOK_SIGNING_KEY'],
  SOLANA:                ['ALCHEMY_WEBHOOK_SOLANA_KEY',          'ALCHEMY_WEBHOOK_SIGNING_KEY'],
};

/** 取指定类型 webhook 的签名密钥 */
export function getSigningKeyForType(type: AlchemyWebhookType): string | undefined {
  const envNames = ENV_KEY_MAP[type] || [];
  for (const name of envNames) {
    const v = process.env[name];
    if (v && v.length >= 20) return v;
  }
  return undefined;
}

/** 检查所有 webhook 类型是否已配置（用于 readiness 报告） */
export function getWebhookTypeReadiness(): Record<AlchemyWebhookType, { configured: boolean; keyLength?: number; keyEnv?: string }> {
  const out = {} as Record<AlchemyWebhookType, { configured: boolean; keyLength?: number; keyEnv?: string }>;
  for (const type of WEBHOOK_TYPES) {
    const envNames = ENV_KEY_MAP[type];
    let key: string | undefined;
    let usedEnv: string | undefined;
    for (const name of envNames) {
      const v = process.env[name];
      if (v && v.length >= 20) {
        key = v;
        usedEnv = name;
        break;
      }
    }
    out[type] = {
      configured: !!key,
      keyLength: key?.length,
      keyEnv: usedEnv,
    };
  }
  return out;
}

// =============================================================================
// Webhook Payload 类型
// =============================================================================

/** Address Activity payload */
export interface AddressActivityPayload {
  type: 'address_activity';
  event: {
    network: 'ETH_MAINNET' | 'BSC_MAINNET' | 'MATIC_MAINNET' | 'ARB_MAINNET' | 'OPT_MAINNET' | 'SOLANA_MAINNET';
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      blockNum: string;
      hash: string;
      value: number;
      asset: string;
      category: 'token' | 'external' | 'internal';
      rawContract?: { address: string; decimal: string };
    }>;
  };
  id: string;
  createdAt: string;
}

/** Mined Transactions payload */
export interface MinedTransactionsPayload {
  type: 'mined_transactions';
  event: {
    network: 'ETH_MAINNET' | 'BSC_MAINNET' | 'MATIC_MAINNET' | 'ARB_MAINNET' | 'OPT_MAINNET';
    activity: Array<{
      hash: string;
      fromAddress: string;
      toAddress: string;
      value: number;
      asset: string;
      category: 'token' | 'external';
      blockNum: string;
      rawContract?: { address: string; decimal: string };
    }>;
  };
  id: string;
  createdAt: string;
}

/** Dropped Transactions payload */
export interface DroppedTransactionsPayload {
  type: 'dropped_transactions';
  event: {
    network: 'ETH_MAINNET' | 'BSC_MAINNET' | 'MATIC_MAINNET' | 'ARB_MAINNET' | 'OPT_MAINNET';
    activity: Array<{
      hash: string;
      fromAddress: string;
      toAddress: string;
      value: number;
      asset: string;
      reason: 'REPLACED' | 'DROPPED' | 'STALE';
    }>;
  };
  id: string;
  createdAt: string;
}

/** NFT Activity payload */
export interface NftActivityPayload {
  type: 'nft_activity';
  event: {
    network: 'ETH_MAINNET' | 'MATIC_MAINNET';
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      contractAddress: string;
      tokenId: string;
      ercTokenType: 'ERC721' | 'ERC1155';
      transactionHash: string;
      blockNum: string;
    }>;
  };
  id: string;
  createdAt: string;
}

/** Solana payload（Alchemy 通用 Solana webhook）*/
export interface SolanaPayload {
  type: 'solana_webhook' | 'address_activity';
  event: {
    network: 'SOLANA_MAINNET';
    activity: Array<{
      fromAddress: string;
      toAddress: string;
      signature: string;
      slot: number;
      blockTime?: number;
      value?: number;
      asset?: string;
      category?: 'token' | 'external';
    }>;
  };
  id: string;
  createdAt: string;
}

export type AnyAlchemyPayload =
  | AddressActivityPayload
  | MinedTransactionsPayload
  | DroppedTransactionsPayload
  | NftActivityPayload
  | SolanaPayload;

// =============================================================================
// 错误处理辅助
// =============================================================================

/**
 * 把验证错误转为可读错误码
 */
export function describeSignatureError(err: WebhookSignatureError): string {
  return `[${err.code}] ${err.message}`;
}
