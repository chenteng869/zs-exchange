/**
 * Alchemy Mined Transactions Webhook 路由（P2-3）
 *
 * 功能：用户提现后，Alchemy 在交易被打包到区块时推送此事件
 * - 更新提现记录 status=mined
 * - 推送通知给用户
 * - 12 块确认后由 polling 自动转 confirmed
 *
 * 配套 Mined Webhook（Alchemy Dashboard）：
 *  - 类型: Mined Transactions
 *  - 监控地址: 平台提现热钱包地址
 *  - URL: /api/webhooks/alchemy/mined
 *  - Signing Key: ALCHEMY_WEBHOOK_MINED_KEY
 */

import { createAlchemyWebhookRoute } from '@/lib/wallet/webhook-router';
import type { MinedTransactionsPayload } from '@/lib/wallet/webhook-types';
import prisma from '@/lib/prisma';
import { alertService } from '@/lib/monitoring/alert-service';
import { safeConsoleWarn } from '@/lib/security/safe-logger';

export const POST = createAlchemyWebhookRoute('MINED_TRANSACTIONS', {
  onMined: async (payload: MinedTransactionsPayload) => {
    const { event, id: webhookEventId } = payload;
    const network = event.network;
    const activities = event.activity || [];

    safeConsoleWarn(`[alchemy-mined] received webhook event=${webhookEventId} network=${network} activities=${activities.length}`);

    for (const act of activities) {
      const txHash = act.hash;
      const blockNum = act.blockNum;

      try {
        // 1. 查找对应的提现记录
        const withdrawal = await prisma.walletWithdrawal.findFirst({
          where: { txHash },
        });

        if (withdrawal) {
          // 2. 更新状态为 mined
          await prisma.walletWithdrawal.update({
            where: { id: withdrawal.id },
            data: {
              status: 'mined',
              blockNumber: parseInt(blockNum, 16).toString(),
              minedAt: new Date(),
            },
          });

          safeConsoleWarn(`[alchemy-mined] withdrawal ${withdrawal.id} status=mined txHash=${txHash}`);

          // 3. 推送给用户（可选：推送服务、邮件、APP 推送）
          // TODO: await pushNotificationService.sendToUser(withdrawal.userId, {
          //   type: 'WITHDRAWAL_MINED',
          //   data: { txHash, blockNumber, currency: withdrawal.currency }
          // });
        } else {
          // 没找到对应提现记录（可能是外部 tx），仅记录
          safeConsoleWarn(`[alchemy-mined] no withdrawal found for txHash=${txHash}, blockNum=${blockNum}`);
        }
      } catch (err) {
        safeConsoleWarn(`[alchemy-mined] failed to process txHash=${txHash}: ${(err as Error).message}`);
        // 不抛出，继续处理其他 activity
        try {
          await alertService.sendAlert({
            type: 'webhook_process_error',
            level: 'medium',
            resourceId: txHash,
            message: `[alchemy-mined] handler error: ${(err as Error).message}`,
            metadata: { webhookEventId, network, blockNum },
          });
        } catch {
          // 告警失败不阻塞主业务
        }
      }
    }
  },
});
