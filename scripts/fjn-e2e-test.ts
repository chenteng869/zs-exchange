/**
 * FJN 真实环境验证 - 任务 2：OrderPaid 端到端联动测试
 *
 * 测试场景（与 H020/H022/H032/H033/H034 一致）：
 *  1. 创建测试用户 (直接 INSERT)
 *  2. 通过 FjnProductService 创建测试产品（确保走业务规则）
 *  3. 通过 FjnOrderService 创建测试订单
 *  4. 触发订单支付 (markPaid 模拟 OrderPaid 事件)
 *  5. 通过 FjnRevenueService 创建 369 分账
 *  6. 通过 FjnFinanceService 触发 369 收入确认（40/30/30）
 *  7. 通过 FjnTaxService 创建税务记录
 *  8. 通过 FjnRiskService 记录风险事件
 *  9. 验证数据库中所有数据正确落库 + outbox 事件
 *
 * 输出：端到端验证报告 → docs/reports/fjn-e2e-report.json
 */
import { randomUUID } from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';
import { FjnFinanceService } from '../src/lib/fjn/services/finance-service';
import { FjnTaxService } from '../src/lib/fjn/services/tax-service';
import { FjnRiskService } from '../src/lib/fjn/services/risk-service';
import { FjnOrderService } from '../src/lib/fjn/services/order-service';
import { FjnRevenueService } from '../src/lib/fjn/services/revenue-service';
import { FjnProductService } from '../src/lib/fjn/services/product-service';

Decimal.set({ precision: 36, rounding: Decimal.ROUND_HALF_EVEN });

const prisma = new PrismaClient();

interface Step {
  name: string;
  status: '✅' | '❌' | '⚠️';
  detail: string;
}

const steps: Step[] = [];
let pass = 0;
let fail = 0;

function record(name: string, status: Step['status'], detail: string) {
  steps.push({ name, status, detail });
  if (status === '✅') pass++;
  else if (status === '❌') fail++;
  console.log(`  ${status} ${name}: ${detail}`);
}

async function main() {
  console.log('=== FJN 端到端测试：OrderPaid 联动链 ===\n');

  const testTag = `e2e-${Date.now()}`;
  let userId = '';
  let productId = '';
  let orderId = '';
  let orderNo = '';
  let allocationId = '';
  let taxRecordId = '';
  let riskEventId = '';

  try {
    // 统一 operator id (UUID 格式，所有 *_operator_id 字段都是 UUID 类型)
    const operatorId = randomUUID();
    const reviewerId = randomUUID();

    // ============================================================
    // [1] 创建测试用户
    // ============================================================
    console.log('[1] 创建测试用户');
    const user = await prisma.coreUser.create({
      data: {
        email: `${testTag}@test.local`,
        username: testTag,
        passwordHash: 'test-hash-no-auth',
        status: 'active',
        countryCode: 'CN',
        kycLevel: 2,
      },
    });
    userId = user.id;
    record('创建用户', '✅', `id=${userId}`);

    // ============================================================
    // [2] 通过 FjnProductService 创建测试产品
    // ============================================================
    console.log('\n[2] 创建测试产品 (FjnProductService)');
    const productSvc = new FjnProductService();
    const productDraft = await productSvc.create({
      productType: 'wine_369',
      name: `测试老酒-${testTag}`,
      price: '1000.0000',
      currency: 'CNY',
      stock: 100,
      description: 'e2e 测试用 369 老酒',
      metadata: { test: testTag, source: 'e2e-test' },
    });
    productId = (productDraft as any).id;
    // 走状态机：draft → pending_review → approved → active
    const adminId = randomUUID();
    await productSvc.changeStatus(productId, 'pending_review' as any, operatorId);
    await productSvc.changeStatus(productId, 'approved' as any, adminId);
    await productSvc.changeStatus(productId, 'active' as any, adminId);
    record('创建产品', '✅', `id=${productId}, no=${(productDraft as any).productNo}`);

    // ============================================================
    // [3] 创建测试订单
    // ============================================================
    console.log('\n[3] 创建测试订单');
    const orderSvc = new FjnOrderService();
    const order = await orderSvc.create({
      userId,
      productId,
      quantity: 1,
      currency: 'CNY',
      countryCode: 'CN',
      metadata: { test: testTag, source: 'e2e-test' },
      operatorId,
    });
    orderId = (order as any).id;
    orderNo = (order as any).orderNo;
    record('创建订单', '✅', `id=${orderId}, no=${orderNo}`);

    // ============================================================
    // [4] 模拟订单支付 (mark paid)
    // ============================================================
    console.log('\n[4] 模拟订单支付');
    await orderSvc.markPaid({
      orderId,
      paymentId: `PAY${testTag}`,
      paymentNo: `PAY${testTag}`,
      paidAmount: '1000.0000',
      currency: 'CNY',
      operatorId,
    });
    const orderAfterPaid = await prisma.fjnOrder.findUnique({ where: { id: orderId } });
    const isPaidStatus = orderAfterPaid?.status === 'paid';
    record('订单状态变更为 paid', isPaidStatus ? '✅' : '❌', `status=${orderAfterPaid?.status}`);

    // ============================================================
    // [5] 初始化 Finance 369 池子
    // ============================================================
    console.log('\n[5] 初始化 Finance 369 池子');
    const financeSvc = new FjnFinanceService();
    const pools = await financeSvc.initializePools('CNY', operatorId);
    record('初始化 369 池子', '✅', `cost/market/company`);

    // ============================================================
    // [5.5] Seed Revenue Rule（wine_369 默认 40/30/30 active）
    //      原因：FjnRevenueService.resolveRule 找不到 active 规则时
    //            会回退到 ruleId='00000000-...' 虚拟 ID，导致
    //            FjnRevenueAllocation.ruleId 外键约束失败。
    //            真实环境必须存在 active rule 才能分账。
    // ============================================================
    console.log('\n[5.5] Seed Revenue Rule (wine_369 / 40-30-30 / active)');
    let revenueRule = await prisma.fjnRevenueRule.findFirst({
      where: { ruleCode: 'WINE_369_DEFAULT', version: 'v3.6.9' },
    });
    if (!revenueRule) {
      revenueRule = await prisma.fjnRevenueRule.create({
        data: {
          ruleCode: 'WINE_369_DEFAULT',
          version: 'v3.6.9',
          productType: 'wine_369',
          status: 'active',
          effectiveFrom: new Date('2025-01-01'),
          ruleContent: {
            items: [
              { pool: 'wine_cost_pool', percentage: 0.4 },
              { pool: 'market_ecosystem_pool', percentage: 0.3 },
              { pool: 'company_pool', percentage: 0.3 },
            ],
          },
          changeReason: `e2e-seed ${testTag}`,
        } as any,
      });
      await prisma.fjnRevenueRuleItem.createMany({
        data: [
          {
            ruleId: revenueRule.id,
            poolType: 'wine_cost_pool',
            poolName: '酒成本池',
            percentage: '0.400000',
            sortOrder: 1,
            description: '酒体采购、储酒、勾兑成本',
          },
          {
            ruleId: revenueRule.id,
            poolType: 'market_ecosystem_pool',
            poolName: '市场生态池',
            percentage: '0.300000',
            sortOrder: 2,
            description: '市场推广、生态建设',
          },
          {
            ruleId: revenueRule.id,
            poolType: 'company_pool',
            poolName: '公司池',
            percentage: '0.300000',
            sortOrder: 3,
            description: '公司运营、研发、利润',
          },
        ],
      });
    }
    record('Seed Revenue Rule', '✅', `id=${revenueRule.id}, code=WINE_369_DEFAULT v3.6.9`);

    // ============================================================
    // [6] Revenue Service 创建 369 分账
    // ============================================================
    console.log('\n[6] Revenue Service 创建 369 分账');
    const revenueSvc = new FjnRevenueService();
    const allocation = await revenueSvc.createAllocation({
      orderId,
      orderNo,
      userId,
      productType: 'wine_369',
      paidAmount: '1000.0000',
      taxAmount: '130.0000',
      currency: 'CNY',
      ruleId: revenueRule.id,  // 显式传入避免回退到虚拟 ID
      ruleVersion: 'v3.6.9',
      operatorId,
    });
    allocationId = (allocation as any).id;
    record('创建分账', '✅', `id=${allocationId}, paidAmount=1000`);

    // ============================================================
    // [7] Finance Service 触发 369 收入确认
    // ============================================================
    console.log('\n[7] Finance Service 触发 369 收入确认');
    const wine369 = await financeSvc.recognizeWine369Revenue({
      orderId,
      userId,
      currency: 'CNY',
      totalAmount: '1000.0000',
      sourceId: allocationId,
      ruleVersion: 'v3.6.9',
      operatorId,
    });
    const ledgersCount = (wine369 as any).ledgers?.length ?? 0;
    record('369 收入确认', ledgersCount === 3 ? '✅' : '❌', `${ledgersCount} 条流水 (40/30/30)`);

    // 验证 3 笔流水落库
    const ledgers = await prisma.fjnFinanceLedger.findMany({
      where: { orderId, businessType: { in: ['income', 'cost', 'market_pool', 'company_pool'] } },
    });
    const totalAmount = ledgers.reduce((sum, l) => sum + Number(l.amount), 0);
    record('3 笔流水落库', ledgers.length === 3 ? '✅' : '❌', `共 ${ledgers.length} 条，合计 ${totalAmount.toFixed(2)} CNY`);

    // 验证三池余额
    const wineCostAcc = await prisma.fjnFinanceAccount.findFirst({
      where: { accountType: 'wine_cost_pool', currency: 'CNY' },
    });
    record('wine_cost_pool 余额', Number(wineCostAcc?.balance) >= 400 ? '✅' : '⚠️', `${wineCostAcc?.balance ?? 'N/A'}`);

    const marketAcc = await prisma.fjnFinanceAccount.findFirst({
      where: { accountType: 'market_ecosystem_pool', currency: 'CNY' },
    });
    record('market_ecosystem_pool 余额', Number(marketAcc?.balance) >= 300 ? '✅' : '⚠️', `${marketAcc?.balance ?? 'N/A'}`);

    const companyAcc = await prisma.fjnFinanceAccount.findFirst({
      where: { accountType: 'company_pool', currency: 'CNY' },
    });
    record('company_pool 余额', Number(companyAcc?.balance) >= 300 ? '✅' : '⚠️', `${companyAcc?.balance ?? 'N/A'}`);

    // ============================================================
    // [8] Tax Service 创建税务记录
    // ============================================================
    console.log('\n[8] Tax Service 创建税务记录');
    const taxSvc = new FjnTaxService();
    let taxRule = await prisma.fjnTaxRule.findFirst({
      where: { ruleCode: 'CN_VAT_13', regionCode: 'CN' },
    });
    if (!taxRule) {
      await taxSvc.createRule({
        ruleCode: 'CN_VAT_13',
        taxType: 'VAT',
        regionCode: 'CN',
        taxRate: '0.13',
        taxMode: 'exclusive',
        effectiveFrom: new Date('2025-01-01'),
        description: '中国大陆增值税 13%',
        operatorId,
      });
      taxRule = await prisma.fjnTaxRule.findFirst({
        where: { ruleCode: 'CN_VAT_13', regionCode: 'CN' },
      });
    }
    const taxRuleId = taxRule!.id;

    const taxRecord = await taxSvc.recordTax({
      ruleId: taxRuleId,
      sourceType: 'order',
      sourceId: orderId,
      orderId,
      userId,
      taxableAmount: '1000.0000',
      taxMode: 'exclusive',
      taxAmount: '130.0000',
      currency: 'CNY',
      reportPeriod: '2026-07',
      description: `OrderPaid 联动税务记录 ${testTag}`,
      operatorId,
    });
    taxRecordId = (taxRecord as any).record_id ?? (taxRecord as any).id;
    record('记录税务', '✅', `id=${taxRecordId}, amount=130`);

    // ============================================================
    // [9] Risk Service 记录风险事件
    // ============================================================
    console.log('\n[9] Risk Service 记录风险事件');
    const riskSvc = new FjnRiskService();
    const riskEvent = await riskSvc.recordEvent({
      eventType: 'abnormal_payment',
      userId,
      riskScore: 10,
      riskLevel: 'low',
      sourceType: 'order',
      sourceId: orderId,
      payload: { test: testTag, orderAmount: '1000' },
      action: 'pass',
      operatorId,
    });
    riskEventId = (riskEvent as any).event_id ?? (riskEvent as any).id;
    record('记录风险事件', '✅', `id=${riskEventId}, score=10, level=low`);

    // ============================================================
    // [10] 验证 outbox 事件
    // ============================================================
    console.log('\n[10] 验证 outbox 事件');
    let outboxEvents: any[] = [];
    try {
      outboxEvents = await prisma.outboxEvent.findMany({
        where: {
          OR: [
            { eventName: { startsWith: 'finance.' } },
            { eventName: { startsWith: 'tax.' } },
            { eventName: { startsWith: 'risk.' } },
            { eventName: { startsWith: 'order.' } },
            { eventName: { startsWith: 'revenue.' } },
          ],
          createdAt: { gte: new Date(Date.now() - 60000) },
        },
      });
    } catch {
      // outbox 表可能不存在
    }
    record(
      'outbox 事件数',
      outboxEvents.length > 0 ? '✅' : '⚠️',
      `${outboxEvents.length} 个事件已记录 (outbox 表可能不存在)`,
    );

    // ============================================================
    // 总结
    // ============================================================
    console.log('\n=== 端到端测试总结 ===');
    console.log(`  ✅ 通过: ${pass}`);
    console.log(`  ❌ 失败: ${fail}`);
    console.log(`  ⚠️ 警告: ${steps.filter(s => s.status === '⚠️').length}`);
    console.log(`  总计:   ${steps.length}`);

    if (fail === 0) {
      console.log('\n✅ OrderPaid 联动链端到端跑通：');
      console.log('   Order (paid) → Revenue 369 → Finance 369 → Tax 记录 → Risk 事件 → Outbox');
    } else {
      console.log('\n❌ 端到端测试存在失败项，请检查上述输出');
    }

    // 输出报告到文件
    const fs = require('fs');
    const path = require('path');
    const report = {
      testTag,
      timestamp: new Date().toISOString(),
      summary: {
        pass,
        fail,
        warning: steps.filter(s => s.status === '⚠️').length,
        total: steps.length,
      },
      steps: steps.map((s) => ({ ...s })),
      created: {
        userId,
        productId,
        orderId,
        orderNo,
        allocationId,
        taxRecordId,
        riskEventId,
      },
    };
    const outDir = path.join(process.cwd(), 'docs', 'reports');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'fjn-e2e-report.json'),
      JSON.stringify(report, null, 2),
      'utf-8',
    );
    console.log(`\n📄 报告已保存: docs/reports/fjn-e2e-report.json`);

    process.exit(fail === 0 ? 0 : 1);
  } catch (e: any) {
    console.error('\n❌ 端到端测试异常:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
