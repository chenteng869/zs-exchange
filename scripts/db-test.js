const { PrismaClient } = require('@prisma/client');
process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/zs_exchange?schema=public';
const prisma = new PrismaClient();

async function test() {
  try {
    const config = await prisma.coreSystemConfig.findUnique({ where: { key: 'system.version' } });
    console.log('✅ 系统配置:', JSON.stringify(config));

    const role = await prisma.coreRole.findUnique({ where: { name: 'admin' } });
    console.log('✅ 默认角色:', role.name, '-', role.description);

    const pair = await prisma.tradePair.findUnique({ where: { symbol: 'BTC/USDT' } });
    console.log('✅ 交易对:', pair.symbol, '-', pair.status);

    const currency = await prisma.walletCurrency.findUnique({ where: { symbol: 'BTC' } });
    console.log('✅ 币种:', currency.symbol, '-', currency.name);

    console.log('\n🎉 数据库连接和基础数据验证成功！');
  } catch (e) {
    console.error('❌ 验证失败:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();