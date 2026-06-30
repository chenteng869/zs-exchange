#!/usr/bin/env node
/**
 * 数据库初始化脚本
 * 
 * 使用方法：
 *   node scripts/db-init.js
 * 
 * 功能：
 *   1. 检查 PostgreSQL 连接
 *   2. 创建数据库（如果不存在）
 *   3. 创建所有 Schema
 *   4. 创建 UUID 扩展
 *   5. 运行 Prisma 迁移
 *   6. 初始化基础数据
 */

const { execSync } = require('child_process');
const pg = require('pg');

async function main() {
  console.log('');
  console.log('========================================');
  console.log('   ZS Exchange 数据库初始化脚本');
  console.log('========================================');
  console.log('');

  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'postgres',
  };

  // 1. 检查 PostgreSQL 连接
  console.log('[1/6] 检查 PostgreSQL 连接...');
  try {
    const client = new pg.Client(config);
    await client.connect();
    await client.end();
    console.log('      ✅ PostgreSQL 连接成功');
  } catch (e) {
    console.error('      ❌ PostgreSQL 连接失败:', e.message);
    console.error('      请确保 PostgreSQL 已启动，端口:', config.port);
    process.exit(1);
  }

  // 2. 创建数据库
  console.log('[2/6] 创建数据库 zs_exchange...');
  try {
    const client = new pg.Client(config);
    await client.connect();
    await client.query(`SELECT 1 FROM pg_database WHERE datname = 'zs_exchange'`);
    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname = 'zs_exchange'`);
    if (result.rows.length === 0) {
      await client.query(`CREATE DATABASE zs_exchange;`);
      console.log('      ✅ 数据库创建成功');
    } else {
      console.log('      ✅ 数据库已存在');
    }
    await client.end();
  } catch (e) {
    console.log('      ❌ 数据库创建失败:', e.message);
    process.exit(1);
  }

  // 3. 创建 Schema
  console.log('[3/6] 创建数据库 Schema...');
  const schemas = ['core', 'trade', 'wallet', 'kyc', 'market', 'defi', 'blockchain', 'ai', 'audit', 'nft', 'settlement'];
  try {
    const client = new pg.Client({ ...config, database: 'zs_exchange' });
    await client.connect();
    for (const schema of schemas) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
    }
    await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await client.end();
    console.log('      ✅ Schema 创建成功:', schemas.length, '个');
  } catch (e) {
    console.error('      ❌ Schema 创建失败:', e.message);
    process.exit(1);
  }

  // 4. 运行 Prisma 迁移
  console.log('[4/6] 运行 Prisma 迁移...');
  try {
    const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/zs_exchange?schema=public`;
    execSync('npx prisma migrate dev --name init', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('      ✅ Prisma 迁移成功');
  } catch (e) {
    console.log('      ⚠️ Prisma 迁移可能已执行:', e.message);
  }

  // 5. 生成 Prisma Client
  console.log('[5/6] 生成 Prisma Client...');
  try {
    const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/zs_exchange?schema=public`;
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log('      ✅ Prisma Client 生成成功');
  } catch (e) {
    console.error('      ❌ Prisma Client 生成失败:', e.message);
    process.exit(1);
  }

  // 6. 初始化基础数据
  console.log('[6/6] 初始化基础数据...');
  try {
    await initBaseData(config);
    console.log('      ✅ 基础数据初始化成功');
  } catch (e) {
    console.error('      ❌ 基础数据初始化失败:', e.message);
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('   数据库初始化完成！🎉');
  console.log('========================================');
  console.log('');
  console.log('   数据库: zs_exchange');
  console.log('   Schema: 11 个');
  console.log('   表: 70+ 张');
  console.log('');
}

async function initBaseData(config) {
  const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/zs_exchange?schema=public`;
  process.env.DATABASE_URL = databaseUrl;
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // 初始化系统配置
    const existingConfig = await prisma.coreSystemConfig.findUnique({
      where: { key: 'system.version' },
    });
    if (!existingConfig) {
      await prisma.coreSystemConfig.create({
        data: {
          key: 'system.version',
          value: { version: '1.0.0' },
          category: 'system',
          description: '系统版本号',
        },
      });
    }

    // 初始化默认角色
    const existingRole = await prisma.coreRole.findUnique({
      where: { name: 'admin' },
    });
    if (!existingRole) {
      await prisma.coreRole.create({
        data: {
          name: 'admin',
          description: '系统管理员',
          permissions: {
            users: ['read', 'create', 'update', 'delete'],
            orders: ['read', 'create', 'update', 'delete'],
            wallet: ['read', 'create', 'update', 'delete'],
            trade: ['read', 'create', 'update', 'delete'],
            admin: ['read', 'create', 'update', 'delete'],
          },
        },
      });
    }

    // 初始化交易对
    const existingPair = await prisma.tradePair.findUnique({
      where: { symbol: 'BTC/USDT' },
    });
    if (!existingPair) {
      await prisma.tradePair.create({
        data: {
          baseCurrency: 'BTC',
          quoteCurrency: 'USDT',
          symbol: 'BTC/USDT',
          status: 'active',
          basePrecision: 8,
          quotePrecision: 2,
          minOrderAmount: 0.0001,
          minOrderValue: 10,
          makerFeeRate: 0.001,
          takerFeeRate: 0.001,
          priceTickSize: 0.01,
          amountTickSize: 0.00000001,
        },
      });
    }

    // 初始化币种
    const existingCurrency = await prisma.walletCurrency.findUnique({
      where: { symbol: 'BTC' },
    });
    if (!existingCurrency) {
      await prisma.walletCurrency.create({
        data: {
          symbol: 'BTC',
          name: 'Bitcoin',
          decimals: 8,
          blockchain: 'Bitcoin',
          isFiat: false,
          isActive: true,
          depositEnabled: true,
          withdrawalEnabled: true,
          minDepositAmount: 0.0001,
          minWithdrawalAmount: 0.0001,
          withdrawalFee: 0.0005,
          confirmationCount: 1,
          explorerUrl: 'https://blockchain.info',
        },
      });
    }

    console.log('   - 系统配置已初始化');
    console.log('   - 默认角色已初始化');
    console.log('   - 交易对已初始化');
    console.log('   - 币种已初始化');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);