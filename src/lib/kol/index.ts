/**
 * KOL 模块统一导出
 *
 * 模块组成：
 *  - types                 类型定义 & 常量
 *  - kol-service           KOL 管理（注册 / 审批 / 暂停 / 评级 / 排行榜）
 *  - referral-service      邀请关系（绑定 / 多级分销 / 业绩）
 *  - commission-engine     返佣引擎（规则 / 计算 / 记录 / 结算）
 *  - copy-trading          跟单服务（配置 / 触发 / 风险控制）
 *  - kol-engine            业务层（集成 OrderEngine / 事件订阅 / 报表）
 *
 * 典型用法：
 *
 *   import { KolEngine } from '@/lib/kol';
 *
 *   const engine = new KolEngine({ matchingEngine });
 *   engine.bindMatchingEngine(matchingEngine);
 *
 *   // 1) KOL 申请 / 审批
 *   const kol = engine.applyKol('user_1', { displayName: 'Alice', kycVerified: true });
 *   engine.approveKol(kol.id, 'macro');
 *
 *   // 2) 用户绑定推广码
 *   const ref = engine.bindUserToKol('user_X', kol.referralCode);
 *
 *   // 3) 触发返佣（监听 OrderEngine 后会自动触发）
 *   engine.triggerCommissions({ userId: 'user_X', type: 'spot', baseAmount: '1000', sourceTxId: 'tx_1' });
 *
 *   // 4) 创建跟单
 *   const cfg = engine.createCopyConfig({
 *     followerUserId: 'user_F',
 *     kolUserId: kol.userId,
 *     mode: 'proportional',
 *     proportionalRatio: 0.5,
 *   });
 *
 *   // 5) 结算
 *   const settlement = engine.getCommissionEngine().settleKol(kol.id, { start, end });
 *
 *   // 6) 报表
 *   const report = engine.getKolReport(kol.id, { start, end });
 *   const top = engine.getTopKol({ start, end }, 10);
 */

export * from './types';
export * from './kol-service';
export * from './referral-service';
export * from './commission-engine';
export * from './copy-trading';
export { KolEngine, type KolEngineDeps, type KolCompatibleTrade, type TriggerCommissionInput } from './kol-engine';
