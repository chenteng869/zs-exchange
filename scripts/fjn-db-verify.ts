/**
 * FJN 真实环境验证 - 任务 1：PostgreSQL 连接 + Schema 状态确认
 *
 * 验证：
 *  - .env 中 DATABASE_URL 配置
 *  - Prisma migrate status（83 张 fjn_* 表存在）
 *  - prisma.$queryRaw 测试真实连接
 *  - 部分核心表 COUNT 数据
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CheckResult {
  name: string;
  status: '✅' | '❌' | '⚠️';
  detail: string;
}

const results: CheckResult[] = [];

function record(name: string, status: CheckResult['status'], detail: string) {
  results.push({ name, status, detail });
  console.log(`  ${status} ${name}: ${detail}`);
}

async function main() {
  console.log('=== FJN 真实环境验证 - 任务 1 ===\n');

  // [1] 检查 DATABASE_URL
  console.log('[1] 环境变量检查');
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    record('DATABASE_URL', '❌', '未设置');
  } else {
    const masked = dbUrl.replace(/:[^:@/]+@/, ':****@');
    record('DATABASE_URL', '✅', `已配置 (${masked})`);
  }

  // [2] 测试数据库连接
  console.log('\n[2] 数据库连接测试');
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version() as version`;
    const version = result[0]?.version ?? 'unknown';
    const pgMatch = version.match(/PostgreSQL (\d+\.\d+)/);
    record('PostgreSQL 连接', '✅', `版本: ${pgMatch?.[1] ?? version.slice(0, 50)}`);
  } catch (e: any) {
    record('PostgreSQL 连接', '❌', e.message);
    await prisma.$disconnect();
    return;
  }

  // [3] 检查 83 张 fjn_* 表
  console.log('\n[3] FJN 表结构检查');
  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'fjn_%'
      ORDER BY table_name
    `;
    record('FJN 表总数', tables.length === 83 ? '✅' : '⚠️', `${tables.length} 张（预期 83）`);

    // 按业务域分组
    const byDomain: Record<string, string[]> = {
      '业务核心 (Order/Payment)': [],
      '阶段C (Revenue/Referral/Team/Node)': [],
      '阶段G (Finance/Tax/Risk)': [],
      '其他': [],
    };
    for (const t of tables) {
      const name = t.table_name;
      if (name.includes('order') || name.includes('payment') || name.includes('product')) {
        byDomain['业务核心 (Order/Payment)'].push(name);
      } else if (name.includes('revenue') || name.includes('referral') || name.includes('team') || name.includes('node')) {
        byDomain['阶段C (Revenue/Referral/Team/Node)'].push(name);
      } else if (name.includes('finance') || name.includes('tax') || name.includes('risk') || name.includes('blacklist') || name.includes('device')) {
        byDomain['阶段G (Finance/Tax/Risk)'].push(name);
      } else {
        byDomain['其他'].push(name);
      }
    }

    for (const [domain, list] of Object.entries(byDomain)) {
      console.log(`    ${domain}: ${list.length} 张`);
    }
  } catch (e: any) {
    record('FJN 表结构', '❌', e.message);
  }

  // [4] 检查关键表 COUNT
  console.log('\n[4] 关键表数据量');
  const keyTables = [
    'fjn_orders', 'fjn_payments', 'fjn_products',
    'fjn_revenue_allocations', 'fjn_referral_rewards', 'fjn_team_rewards', 'fjn_node_rewards',
    'fjn_finance_accounts', 'fjn_finance_ledgers', 'fjn_settlements',
    'fjn_tax_rules', 'fjn_tax_records', 'fjn_tax_reports',
    'fjn_risk_rules', 'fjn_risk_events', 'fjn_risk_cases', 'fjn_blacklists',
  ];

  for (const tableName of keyTables) {
    try {
      const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM "${tableName}"`,
      );
      const count = Number(result[0]?.count ?? 0);
      record(tableName, '✅', `${count} 条记录`);
    } catch (e: any) {
      record(tableName, '❌', e.message.split('\n')[0]);
    }
  }

  // [5] Prisma 模型完整性
  console.log('\n[5] Prisma Client 模型检查');
  const fjnModels = Object.keys(prisma).filter(
    (k) => k.startsWith('fjn') || k === 'outboxEvent' || k === 'user' || k === 'account',
  );
  record('Prisma 模型数', '✅', `${fjnModels.length} 个相关模型`);

  // [6] 总结
  console.log('\n=== 验证总结 ===');
  const passed = results.filter((r) => r.status === '✅').length;
  const failed = results.filter((r) => r.status === '❌').length;
  const warned = results.filter((r) => r.status === '⚠️').length;
  console.log(`  ✅ 通过: ${passed}`);
  console.log(`  ⚠️ 警告: ${warned}`);
  console.log(`  ❌ 失败: ${failed}`);
  console.log(`  总计:   ${results.length}`);

  if (failed === 0) {
    console.log('\n✅ 任务 1 完成：PostgreSQL 连接正常 + Schema 已就绪');
  } else {
    console.log('\n❌ 任务 1 存在失败项，请检查上述输出');
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
