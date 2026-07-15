/**
 * Alchemy Solana Webhook 路由（P5-2）
 *
 * 功能：处理 Solana 链上事件
 *  - SOL 充值
 *  - SPL Token 充值（USDC 等）
 *  - 提现确认
 *
 * 配套 Solana Webhook（Alchemy Dashboard）：
 *  - 类型: Address Activity
 *  - 监控网络: Solana Mainnet
 *  - 监控地址: 平台 Solana 充值地址
 *  - URL: /api/webhooks/alchemy/solana
 *  - Signing Key: ALCHEMY_WEBHOOK_SOLANA_KEY
 */

import { createAlchemyWebhookRoute } from '@/lib/wallet/webhook-router';
import type { SolanaPayload } from '@/lib/wallet/webhook-types';
import prisma from '@/lib/prisma';
import { safeConsoleWarn } from '@/lib/security/safe-logger';
import { depositCreditService } from '@/lib/wallet/deposit-credit-service';

export const POST = createAlchemyWebhookRoute('SOLANA', {
  onSolana: async (payload: SolanaPayload) => {
    const { event, id: webhookEventId } = payload;
    const activities = event.activity || [];

    safeConsoleWarn(`[alchemy-solana] received webhook event=${webhookEventId} activities=${activities.length}`);

    for (const act of activities) {
      const { fromAddress, toAddress, signature, slot, value, asset, category } = act;

      try {
        // 1. 查找平台 Solana 地址
        const address = await prisma.walletAddress.findUnique({
          where: { address: toAddress },
          include: { currency: true },
        });

        if (!address || address.status !== 'active') {
          safeConsoleWarn(`[alchemy-solana] ignored unassigned deposit address: ${toAddress}`);
          continue;
        }

        // 2. 解析金额
        // SOL: value 是 lamports (1e9)
        // SPL: value 是 token 最小单位（需 decimals）
        const decimals = category === 'token'
          ? (asset === 'USDC' || asset === 'USDT' ? 6 : 9)
          : 9;
        const amount = value ? (value / 10 ** decimals).toFixed(decimals) : '0';

        // 3. 入账
        try {
          await depositCreditService.ingestDeposit({
            userId: address.userId,
            currency: address.currency.symbol,
            chain: 'SOLANA',
            address: address.address,
            txHash: signature,
            amount,
            confirmations: 1,
            blockNumber: slot,
            logIndex: 0,
          });
          safeConsoleWarn(`[alchemy-solana] credited ${amount} ${address.currency.symbol} to user=${address.userId}`);
        } catch (err) {
          safeConsoleWarn(`[alchemy-solana] ingest failed: ${(err as Error).message}`);
        }
      } catch (err) {
        safeConsoleWarn(`[alchemy-solana] failed to process ${signature}: ${(err as Error).message}`);
      }
    }
  },
});
