/**
 * Alchemy Address Activity Webhook 路由
 *
 * 2026-07-11 从 /api/webhooks/alchemy/route.ts 迁移到子路径
 * 功能保持不变：入金监控
 * - 签名校验
 * - JSON 解析
 * - 转发到 DepositMonitor
 * - 业务入账
 */

import { createAlchemyWebhookRoute, webhookErrorResponse } from '@/lib/wallet/webhook-router';
import type { AddressActivityPayload } from '@/lib/wallet/webhook-types';
import { DepositMonitor, type DepositEvent } from '@/lib/wallet/deposit-monitor';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { depositCreditService, DepositCreditError } from '@/lib/wallet/deposit-credit-service';
import { getEvmRpcEndpointsForChain } from '@/lib/alchemy/rpc-config';
import type { RpcClientOptions } from '@/lib/wallet/rpc-client';
import type { TronRpcClientOptions } from '@/lib/wallet/tron-rpc-client';

// =============================================================================
// 全局单例（DepositMonitor）
// =============================================================================

declare global {
  // eslint-disable-next-line no-var
  var __smyDepositMonitor: DepositMonitor | undefined;
  // eslint-disable-next-line no-var
  var __smyDepositMonitorHydratedAt: number | undefined;
  // eslint-disable-next-line no-var
  var __smyDepositMonitorHydrationError: string | undefined;
}

function splitEnvList(value?: string): string[] {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildEvmRpcOptions(): RpcClientOptions | undefined {
  const endpoints = getEvmRpcEndpointsForChain(process.env.WALLET_DEPOSIT_READINESS_CHAIN || 'ethereum')
    .concat(splitEnvList(process.env.NEXT_PUBLIC_RPC_URL));
  if (endpoints.length === 0) return undefined;
  return {
    endpoints,
    chainName: process.env.WALLET_EVM_RPC_CHAIN_NAME || 'configured-evm',
    timeoutMs: Number(process.env.WALLET_RPC_TIMEOUT_MS || 10_000),
  };
}

function buildTronRpcOptions(): TronRpcClientOptions | undefined {
  const endpoints = splitEnvList(process.env.WALLET_TRON_RPC_ENDPOINTS);
  if (endpoints.length === 0) return undefined;
  return {
    endpoints,
    apiKey: process.env.TRONGRID_API_KEY,
    timeoutMs: Number(process.env.WALLET_RPC_TIMEOUT_MS || 10_000),
  };
}

function getMonitor(): DepositMonitor {
  if (!globalThis.__smyDepositMonitor) {
    globalThis.__smyDepositMonitor = new DepositMonitor({
      evmRpc: buildEvmRpcOptions(),
      tronRpc: buildTronRpcOptions(),
      onError: (err, chain) => {
        console.warn(`[deposit-monitor] ${chain} poll error:`, err.message);
      },
      onCredited: (event: DepositEvent) => {
        console.info(
          `[deposit-monitor] CREDITED ${event.amountFormatted} ${event.tokenSymbol} `
          + `(${event.chain}) to ${event.to} from ${event.from} (tx=${event.txHash})`,
        );
        void ingestAlchemyDepositEvent(event).catch((error) => {
          console.error('[deposit-monitor] failed to credit deposit event:', error);
        });
      },
    });
    globalThis.__smyDepositMonitor.start();
  }
  return globalThis.__smyDepositMonitor;
}

function toMonitorChain(chain?: string | null): 'ETH' | 'BSC' | 'TRON' | null {
  const normalized = String(chain || '').trim().toUpperCase();
  if (normalized === 'ETH' || normalized === 'ETHEREUM' || normalized === 'ERC20') return 'ETH';
  if (normalized === 'BSC' || normalized === 'BNB' || normalized === 'BEP20') return 'BSC';
  if (normalized === 'TRON' || normalized === 'TRC20' || normalized === 'TRX') return 'TRON';
  return null;
}

async function hydrateWatchedAddresses(monitor: DepositMonitor, force = false): Promise<void> {
  const now = Date.now();
  if (!force && globalThis.__smyDepositMonitorHydratedAt && now - globalThis.__smyDepositMonitorHydratedAt < 30_000) {
    return;
  }
  try {
    const addresses = await prisma.walletAddress.findMany({
      where: { status: 'active' },
      include: { currency: true },
      take: 10_000,
    });
    for (const record of addresses) {
      const chain = toMonitorChain(record.tag || record.currency.blockchain);
      if (!chain) continue;
      monitor.watchAddress(record.address, chain, record.currency.symbol);
    }
    globalThis.__smyDepositMonitorHydratedAt = now;
    globalThis.__smyDepositMonitorHydrationError = undefined;
  } catch (error) {
    globalThis.__smyDepositMonitorHydrationError = error instanceof Error ? error.message : String(error);
    console.warn('[deposit-monitor] failed to hydrate watched addresses:', globalThis.__smyDepositMonitorHydrationError);
  }
}

async function ingestAlchemyDepositEvent(event: DepositEvent) {
  const address = await prisma.walletAddress.findUnique({
    where: { address: event.to },
    include: { currency: true },
  });
  if (!address || address.status !== 'active') {
    console.warn(`[deposit-monitor] ignored unassigned deposit address: ${event.to}`);
    return null;
  }
  try {
    return await depositCreditService.ingestDeposit({
      userId: address.userId,
      currency: address.currency.symbol,
      chain: address.tag || event.chain,
      address: address.address,
      txHash: event.txHash,
      amount: event.amountFormatted,
      confirmations: event.confirmations,
      blockNumber: event.blockNumber,
      logIndex: event.logIndex,
    });
  } catch (error) {
    if (error instanceof DepositCreditError) {
      console.warn(`[deposit-monitor] deposit ingest rejected [${error.code}]: ${error.message}`);
      return null;
    }
    throw error;
  }
}

// =============================================================================
// 路由导出
// =============================================================================

export const POST = createAlchemyWebhookRoute('ADDRESS_ACTIVITY', {
  onAddressActivity: async (payload: AddressActivityPayload) => {
    const monitor = getMonitor();
    await hydrateWatchedAddresses(monitor);
    const events = monitor.handleWebhook(payload as any);
    await Promise.all(events.map((event) => ingestAlchemyDepositEvent(event)));
  },
});

export async function GET(): Promise<NextResponse> {
  const monitor = getMonitor();
  await hydrateWatchedAddresses(monitor);
  // 2026-07-11 修复：必须返回 NextResponse 而不是原生 Response
  return NextResponse.json({
    ok: true,
    type: 'ADDRESS_ACTIVITY',
    running: monitor.isRunning(),
    watched: monitor.watchedCount(),
    pending: monitor.getPendingDeposits().length,
    confirmed: monitor.getConfirmedDeposits().length,
    hydrationError: globalThis.__smyDepositMonitorHydrationError ?? null,
  });
}
