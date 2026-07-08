/**
 * 播种永续合约基础配置（PerpContract）
 *
 * 现状：PerpContract 表为空，导致 /api/v1/perp/market?action=contracts 及
 * App 端合约行情页面无数据可读。本脚本插入一批常见交易对的合约配置，
 * 使用行业常见的保证金率/费率默认值（可后续在后台管理调整）。
 *
 * 用法：npx tsx scripts/seed-perp-contracts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContract {
  symbol: string;
  baseAsset: string;
  maxLeverage: number;
  pricePrecision: number;
  qtyPrecision: number;
}

const CONTRACTS: SeedContract[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', maxLeverage: 125, pricePrecision: 2, qtyPrecision: 3 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', maxLeverage: 100, pricePrecision: 2, qtyPrecision: 3 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', maxLeverage: 75, pricePrecision: 2, qtyPrecision: 2 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', maxLeverage: 50, pricePrecision: 3, qtyPrecision: 1 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', maxLeverage: 50, pricePrecision: 4, qtyPrecision: 0 },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', maxLeverage: 50, pricePrecision: 5, qtyPrecision: 0 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', maxLeverage: 50, pricePrecision: 4, qtyPrecision: 0 },
  { symbol: 'AVAXUSDT', baseAsset: 'AVAX', maxLeverage: 50, pricePrecision: 3, qtyPrecision: 1 },
];

async function main() {
  let created = 0;
  let skipped = 0;
  for (const c of CONTRACTS) {
    const existing = await prisma.perpContract.findUnique({ where: { symbol: c.symbol } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.perpContract.create({
      data: {
        symbol: c.symbol,
        baseAsset: c.baseAsset,
        quoteAsset: 'USDT',
        marginAsset: 'USDT',
        contractType: 'perpetual',
        maxLeverage: c.maxLeverage,
        minOrderQty: '0.001',
        maxOrderQty: '10000',
        maxPositionQty: '50000',
        initialMarginRate: '0.01',
        maintenanceMarginRate: '0.005',
        makerFeeRate: '0.0002',
        takerFeeRate: '0.0005',
        fundingIntervalMinutes: 480,
        fundingCap: '0.0075',
        fundingFloor: '-0.0075',
        pricePrecision: c.pricePrecision,
        qtyPrecision: c.qtyPrecision,
        status: 'active',
      },
    });
    created++;
    console.log(`created ${c.symbol}`);
  }
  console.log(`done. created=${created} skipped(existing)=${skipped}`);
}

main()
  .catch((e) => {
    console.error('seed failed', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
