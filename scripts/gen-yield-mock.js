// gen-yield-mock.js
// 注入 P3.49 mock data 到 PortalYield.tsx
const fs = require('fs');
const path = require('path');

const ROOT = 'd:/3、系统项目开发/trae_projects/Stock Exchange dapp20260608-01';
const target = path.join(ROOT, 'src/components/portal-preview/PortalYield.tsx');
let src = fs.readFileSync(target, 'utf8');

const MOCK = `
// ============================================================
// Mock 数据 - 流动性挖矿与收益聚合
// ============================================================

const FARMS: FarmActivity[] = [
  { id: 'FARM-001', name: 'ZSDX 单币灵活挖矿', type: 'single', status: 'active', tokenA: 'ZSDX', apr: 28.4, aprBoosted: 42.6, tvl: 48_000_000, tvlCap: 80_000_000, stakers: 6840, myStake: 12_500, myEarned: 184.6, startAt: '2026-05-01', endAt: '2026-12-31', harvestable: true, risk: 'low', description: 'ZSDX 平台代币单币灵活挖矿，零无常损失，收益每日发放。', tags: ['热门', '灵活', '低风险'] },
  { id: 'FARM-002', name: 'USDT 稳定币理财', type: 'single', status: 'active', tokenA: 'USDT', apr: 8.6, aprBoosted: 12.4, tvl: 86_000_000, tvlCap: 100_000_000, stakers: 12_480, myStake: 0, myEarned: 0, startAt: '2026-04-15', endAt: '2027-04-15', harvestable: true, risk: 'low', description: 'USDT 稳定币理财，APR 8-12%，按日计息，到期赎回。', tags: ['稳健', '保流动性', '日结'] },
  { id: 'FARM-003', name: 'ETH 2.0 质押', type: 'single', status: 'active', tokenA: 'ETH', apr: 14.2, aprBoosted: 18.8, tvl: 32_000_000, tvlCap: 50_000_000, stakers: 2860, myStake: 4_200, myEarned: 86.4, startAt: '2026-03-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'ETH 2.0 网络原生质押，APR 14-19%，T+7 解锁。', tags: ['主流', '中风险'] },
  { id: 'FARM-004', name: 'BTC 链上质押', type: 'single', status: 'active', tokenA: 'BTC', apr: 6.4, aprBoosted: 9.2, tvl: 24_000_000, tvlCap: 40_000_000, stakers: 1840, myStake: 0.6, myEarned: 0.012, startAt: '2026-05-10', endAt: '2027-01-10', harvestable: true, risk: 'medium', description: 'BTC 链上质押 / Babylon 协议桥接，APR 6-10%，收益每 7 日发放。', tags: ['BTC', '中风险'] },
  { id: 'FARM-005', name: 'ZSDX 90 天锁仓挖矿', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 48.6, aprBoosted: 64.8, tvl: 18_000_000, tvlCap: 25_000_000, stakers: 1280, myStake: 0, myEarned: 0, startAt: '2026-06-01', endAt: '2026-08-31', harvestable: false, risk: 'medium', description: 'ZSDX 90 天锁仓挖矿，APR 48-65%，到期一次性发放，提前解锁扣除 30% 本金。', tags: ['锁仓', '高收益'] },
  { id: 'FARM-006', name: 'SOL 流动性质押', type: 'single', status: 'active', tokenA: 'SOL', apr: 18.4, aprBoosted: 24.6, tvl: 14_000_000, tvlCap: 30_000_000, stakers: 3640, myStake: 120, myEarned: 2.84, startAt: '2026-04-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'SOL 流动性质押（jitoSOL / mSOL 等），APR 18-25%，T+1 解锁。', tags: ['SOL', '流动性质押'] },
  { id: 'FARM-007', name: 'ARB 跨链质押', type: 'single', status: 'active', tokenA: 'ARB', apr: 22.6, aprBoosted: 32.4, tvl: 8_600_000, tvlCap: 15_000_000, stakers: 1240, myStake: 0, myEarned: 0, startAt: '2026-05-20', endAt: '2026-11-20', harvestable: true, risk: 'medium', description: 'ARB Layer2 跨链质押，APR 22-32%，T+3 解锁。', tags: ['L2', '跨链'] },
  { id: 'FARM-008', name: 'BNB 链质押', type: 'single', status: 'active', tokenA: 'BNB', apr: 12.4, aprBoosted: 16.8, tvl: 6_400_000, tvlCap: 12_000_000, stakers: 1840, myStake: 0, myEarned: 0, startAt: '2026-04-10', endAt: '2026-10-10', harvestable: true, risk: 'medium', description: 'BNB 链原生质押，APR 12-17%，弹性周期。', tags: ['BNB', '弹性'] },
  { id: 'FARM-009', name: 'USDC 90 天期', type: 'lock', status: 'upcoming', tokenA: 'USDC', apr: 14.8, aprBoosted: 18.4, tvl: 0, tvlCap: 50_000_000, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-07-25', endAt: '2026-10-23', harvestable: false, risk: 'low', description: 'USDC 90 天期锁仓，APR 14-19%，保流动性稳定币理财。', tags: ['稳定币', '即将开始'] },
  { id: 'FARM-010', name: 'MATIC 流动性质押', type: 'single', status: 'active', tokenA: 'MATIC', apr: 16.2, aprBoosted: 22.4, tvl: 4_200_000, tvlCap: 10_000_000, stakers: 860, myStake: 0, myEarned: 0, startAt: '2026-05-15', endAt: '2026-12-15', harvestable: true, risk: 'medium', description: 'MATIC 网络流动性质押，APR 16-22%。', tags: ['L2', '流动性质押'] },
  { id: 'FARM-011', name: 'ZSDX 180 天超长锁仓', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 86.4, aprBoosted: 124.6, tvl: 8_400_000, tvlCap: 12_000_000, stakers: 480, myStake: 0, myEarned: 0, startAt: '2026-04-01', endAt: '2026-09-30', harvestable: false, risk: 'high', description: 'ZSDX 180 天超长锁仓，APR 86-125%，高收益伴随高风险，30% 提前解锁罚没。', tags: ['超长锁仓', '高收益', '高风险'] },
  { id: 'FARM-012', name: 'OP Layer2 质押', type: 'single', status: 'active', tokenA: 'OP', apr: 20.4, aprBoosted: 28.6, tvl: 3_200_000, tvlCap: 8_000_000, stakers: 640, myStake: 0, myEarned: 0, startAt: '2026-06-01', endAt: '2026-12-31', harvestable: true, risk: 'medium', description: 'Optimism Layer2 质押，APR 20-29%。', tags: ['L2', 'OP'] },
  { id: 'FARM-013', name: 'AVAX 雪崩质押', type: 'single', status: 'paused', tokenA: 'AVAX', apr: 14.6, aprBoosted: 18.2, tvl: 2_400_000, tvlCap: 6_000_000, stakers: 320, myStake: 0, myEarned: 0, startAt: '2026-03-15', endAt: '2026-09-15', harvestable: true, risk: 'medium', description: 'AVAX 雪崩协议质押（当前暂停，升级中），APR 14-19%。', tags: ['暂停', '升级中'] },
  { id: 'FARM-014', name: 'ZSDX 30 天短期', type: 'lock', status: 'active', tokenA: 'ZSDX', apr: 32.4, aprBoosted: 42.8, tvl: 6_800_000, tvlCap: 10_000_000, stakers: 1860, myStake: 0, myEarned: 0, startAt: '2026-06-15', endAt: '2026-07-15', harvestable: false, risk: 'low', description: 'ZSDX 30 天短期锁仓，APR 32-43%。', tags: ['短期', '锁仓'] },
  { id: 'FARM-015', name: 'LINK 链下质押', type: 'single', status: 'active', tokenA: 'LINK', apr: 12.6, aprBoosted: 16.4, tvl: 1_800_000, tvlCap: 4_000_000, stakers: 240, myStake: 0, myEarned: 0, startAt: '2026-05-20', endAt: '2026-11-20', harvestable: true, risk: 'medium', description: 'LINK 预言机节点质押，APR 12-17%。', tags: ['预言机'] },
  { id: 'FARM-016', name: 'DOT 平行链插槽', type: 'single', status: 'ended', tokenA: 'DOT', apr: 18.4, aprBoosted: 24.2, tvl: 0, tvlCap: 0, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-01-15', endAt: '2026-04-15', harvestable: true, risk: 'medium', description: 'DOT 平行链插槽质押（已结束），APR 18-25%。', tags: ['已结束', 'DOT'] },
  { id: 'FARM-017', name: 'AAVE 借贷挖矿', type: 'single', status: 'active', tokenA: 'AAVE', apr: 16.8, aprBoosted: 22.4, tvl: 2_200_000, tvlCap: 5_000_000, stakers: 460, myStake: 0, myEarned: 0, startAt: '2026-05-25', endAt: '2026-11-25', harvestable: true, risk: 'medium', description: 'AAVE 借贷协议存款挖矿，APR 16-23%。', tags: ['DeFi', '借贷'] },
  { id: 'FARM-018', name: 'UNI 治理挖矿', type: 'single', status: 'upcoming', tokenA: 'UNI', apr: 24.4, aprBoosted: 32.6, tvl: 0, tvlCap: 4_000_000, stakers: 0, myStake: 0, myEarned: 0, startAt: '2026-07-25', endAt: '2026-10-23', harvestable: false, risk: 'medium', description: 'UNI 治理代币挖矿（即将开始），APR 24-33%。', tags: ['即将开始', '治理'] },
];

const POOLS: LiquidityPool[] = [
  { id: 'POOL-001', pair: 'ZSDX/USDT', tokenA: 'ZSDX', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 28_000_000, volume24h: 86_000_000, fees24h: 28_400, apr: 42.6, reserveA: 8_400_000, reserveB: 19_600_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-01-15', priceImpact: 0.06, tags: ['平台对', '主流'] },
  { id: 'POOL-002', pair: 'ETH/USDT', tokenA: 'ETH', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 64_000_000, volume24h: 248_000_000, fees24h: 184_000, apr: 28.4, reserveA: 18_400, reserveB: 45_600_000, myLP: 8_400, myShare: 0.013, feeTier: 0.05, createdAt: '2025-12-01', priceImpact: 0.04, tags: ['主流对', '深度好'] },
  { id: 'POOL-003', pair: 'BTC/USDT', tokenA: 'BTC', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 86_000_000, volume24h: 320_000_000, fees24h: 248_000, apr: 24.6, reserveA: 1_280, reserveB: 84_800_000, myLP: 12_400, myShare: 0.014, feeTier: 0.05, createdAt: '2025-11-10', priceImpact: 0.03, tags: ['主流对', '深度好'] },
  { id: 'POOL-004', pair: 'SOL/USDT', tokenA: 'SOL', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 18_000_000, volume24h: 86_000_000, fees24h: 64_000, apr: 64.8, reserveA: 86_400, reserveB: 14_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-02-20', priceImpact: 0.12, tags: ['高波动'] },
  { id: 'POOL-005', pair: 'BNB/USDT', tokenA: 'BNB', tokenB: 'USDT', status: 'active', risk: 'medium', tvl: 14_000_000, volume24h: 48_000_000, fees24h: 32_000, apr: 32.4, reserveA: 24_600, reserveB: 14_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-03-01', priceImpact: 0.08, tags: ['BNB 链'] },
  { id: 'POOL-006', pair: 'USDC/USDT', tokenA: 'USDC', tokenB: 'USDT', status: 'active', risk: 'low', tvl: 42_000_000, volume24h: 124_000_000, fees24h: 8_400, apr: 8.6, reserveA: 21_000_000, reserveB: 21_000_000, myLP: 0, myShare: 0, feeTier: 0.01, createdAt: '2025-10-15', priceImpact: 0.01, tags: ['稳定对', '极低风险'] },
  { id: 'POOL-007', pair: 'DAI/USDC', tokenA: 'DAI', tokenB: 'USDC', status: 'active', risk: 'low', tvl: 18_000_000, volume24h: 64_000_000, fees24h: 4_800, apr: 6.4, reserveA: 9_000_000, reserveB: 9_000_000, myLP: 0, myShare: 0, feeTier: 0.01, createdAt: '2025-09-20', priceImpact: 0.01, tags: ['稳定对', '极低风险'] },
  { id: 'POOL-008', pair: 'ARB/USDT', tokenA: 'ARB', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 8_400_000, volume24h: 32_000_000, fees24h: 24_000, apr: 56.4, reserveA: 4_200_000, reserveB: 4_200_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-04-15', priceImpact: 0.14, tags: ['L2', '高波动'] },
  { id: 'POOL-009', pair: 'OP/USDT', tokenA: 'OP', tokenB: 'USDT', status: 'active', risk: 'high', tvl: 4_800_000, volume24h: 18_000_000, fees24h: 14_000, apr: 48.6, reserveA: 2_400_000, reserveB: 2_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-05-01', priceImpact: 0.16, tags: ['L2', '高波动'] },
  { id: 'POOL-010', pair: 'ZSDX/ETH', tokenA: 'ZSDX', tokenB: 'ETH', status: 'active', risk: 'medium', tvl: 12_400_000, volume24h: 24_000_000, fees24h: 18_000, apr: 38.4, reserveA: 3_600_000, reserveB: 2_400, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-04-01', priceImpact: 0.08, tags: ['平台对'] },
  { id: 'POOL-011', pair: 'MATIC/USDT', tokenA: 'MATIC', tokenB: 'USDT', status: 'warming', risk: 'high', tvl: 2_400_000, volume24h: 8_400_000, fees24h: 6_400, apr: 42.6, reserveA: 1_800_000, reserveB: 2_400_000, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-07-10', priceImpact: 0.18, tags: ['预热中'] },
  { id: 'POOL-012', pair: 'LINK/ETH', tokenA: 'LINK', tokenB: 'ETH', status: 'active', risk: 'medium', tvl: 4_200_000, volume24h: 8_400_000, fees24h: 6_400, apr: 32.4, reserveA: 84_000, reserveB: 640, myLP: 0, myShare: 0, feeTier: 0.3, createdAt: '2026-03-15', priceImpact: 0.10, tags: ['DeFi'] },
];

const DUALS: DualFarm[] = [
  { id: 'DUAL-001', name: 'ZSDX/USDT 双币理财', tokenA: 'ZSDX', tokenB: 'USDT', status: 'active', aprA: 48.4, aprB: 12.6, totalApr: 61.0, tvl: 18_000_000, stakers: 1860, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-06-15', endAt: '2026-07-15', description: 'ZSDX/USDT 双币理财，30 天期，年化 48+12 = 61%，到期按 USDT 结算。', risk: 'medium' },
  { id: 'DUAL-002', name: 'ETH/BTC 双币', tokenA: 'ETH', tokenB: 'BTC', status: 'active', aprA: 24.6, aprB: 18.4, totalApr: 43.0, tvl: 24_000_000, stakers: 1240, duration: 14, myStake: 4_200, myEarnedA: 0.04, myEarnedB: 0.002, startAt: '2026-07-05', endAt: '2026-07-19', description: 'ETH/BTC 14 天双币理财，年化 24+18 = 43%，按较低收益币种结算。', risk: 'medium' },
  { id: 'DUAL-003', name: 'SOL/USDC 双币', tokenA: 'SOL', tokenB: 'USDC', status: 'active', aprA: 64.8, aprB: 8.4, totalApr: 73.2, tvl: 8_400_000, stakers: 480, duration: 21, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-07-01', endAt: '2026-07-22', description: 'SOL/USDC 21 天双币理财，年化 64+8 = 73%，高收益伴随高波动。', risk: 'high' },
  { id: 'DUAL-004', name: 'BNB/DAI 双币', tokenA: 'BNB', tokenB: 'DAI', status: 'active', aprA: 32.4, aprB: 6.4, totalApr: 38.8, tvl: 4_200_000, stakers: 240, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-06-20', endAt: '2026-07-20', description: 'BNB/DAI 30 天双币理财，年化 32+6 = 38%。', risk: 'medium' },
  { id: 'DUAL-005', name: 'ARB/OP 双币', tokenA: 'ARB', tokenB: 'OP', status: 'upcoming', aprA: 56.4, aprB: 48.6, totalApr: 105.0, tvl: 0, stakers: 0, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-07-25', endAt: '2026-08-24', description: 'ARB/OP 30 天双币理财（即将开始），年化 56+48 = 105%。', risk: 'high' },
  { id: 'DUAL-006', name: 'ZSDX/ETH 双币', tokenA: 'ZSDX', tokenB: 'ETH', status: 'ended', aprA: 38.4, aprB: 24.6, totalApr: 63.0, tvl: 0, stakers: 0, duration: 30, myStake: 0, myEarnedA: 0, myEarnedB: 0, startAt: '2026-05-15', endAt: '2026-06-14', description: 'ZSDX/ETH 30 天双币理财（已结束），年化 38+24 = 63%。', risk: 'medium' },
];

const LP_FARMS: LpFarm[] = [
  { id: 'LPF-001', pair: 'ZSDX/USDT', pool: 'POOL-001', status: 'rewarded', baseApr: 18.4, rewardApr: 24.2, totalApr: 42.6, tvl: 28_000_000, myLPValue: 8_400, myEarned: 124.6, impermanentLoss: -2.4, volume24h: 86_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ZSDX/USDT LP 挖矿，年化 42.6%，无常损失 -2.4%。', imbalanced: false },
  { id: 'LPF-002', pair: 'ETH/USDT', pool: 'POOL-002', status: 'rewarded', baseApr: 12.4, rewardApr: 16.0, totalApr: 28.4, tvl: 64_000_000, myLPValue: 12_400, myEarned: 86.4, impermanentLoss: -1.2, volume24h: 248_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ETH/USDT LP 挖矿，年化 28.4%，深度好，无常损失低。', imbalanced: false },
  { id: 'LPF-003', pair: 'BTC/USDT', pool: 'POOL-003', status: 'rewarded', baseApr: 10.2, rewardApr: 14.4, totalApr: 24.6, tvl: 86_000_000, myLPValue: 12_400, myEarned: 64.8, impermanentLoss: -0.8, volume24h: 320_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'BTC/USDT LP 挖矿，年化 24.6%。', imbalanced: false },
  { id: 'LPF-004', pair: 'SOL/USDT', pool: 'POOL-004', status: 'rewarded', baseApr: 28.6, rewardApr: 36.2, totalApr: 64.8, tvl: 18_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 86_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'SOL/USDT LP 挖矿，年化 64.8%（高波动）。', imbalanced: false },
  { id: 'LPF-005', pair: 'BNB/USDT', pool: 'POOL-005', status: 'rewarded', baseApr: 14.2, rewardApr: 18.2, totalApr: 32.4, tvl: 14_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 48_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'BNB/USDT LP 挖矿，年化 32.4%。', imbalanced: false },
  { id: 'LPF-006', pair: 'USDC/USDT', pool: 'POOL-006', status: 'rewarded', baseApr: 4.2, rewardApr: 4.4, totalApr: 8.6, tvl: 42_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 124_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'USDC/USDT 稳定对 LP，年化 8.6%，无常损失几乎为零。', imbalanced: false },
  { id: 'LPF-007', pair: 'DAI/USDC', pool: 'POOL-007', status: 'rewarded', baseApr: 3.2, rewardApr: 3.2, totalApr: 6.4, tvl: 18_000_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 64_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'DAI/USDC 稳定对 LP，年化 6.4%。', imbalanced: false },
  { id: 'LPF-008', pair: 'ARB/USDT', pool: 'POOL-008', status: 'rewarded', baseApr: 24.2, rewardApr: 32.2, totalApr: 56.4, tvl: 8_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 32_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ARB/USDT LP 挖矿，年化 56.4%（L2 风险）。', imbalanced: false },
  { id: 'LPF-009', pair: 'OP/USDT', pool: 'POOL-009', status: 'rewarded', baseApr: 20.4, rewardApr: 28.2, totalApr: 48.6, tvl: 4_800_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 18_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'OP/USDT LP 挖矿，年化 48.6%。', imbalanced: false },
  { id: 'LPF-010', pair: 'ZSDX/ETH', pool: 'POOL-010', status: 'rewarded', baseApr: 18.4, rewardApr: 20.0, totalApr: 38.4, tvl: 12_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 24_000_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'ZSDX/ETH LP 挖矿，年化 38.4%。', imbalanced: false },
  { id: 'LPF-011', pair: 'MATIC/USDT', pool: 'POOL-011', status: 'rewarded', baseApr: 18.2, rewardApr: 24.4, totalApr: 42.6, tvl: 2_400_000, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 8_400_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'MATIC/USDT LP 挖矿（预热中），年化 42.6%。', imbalanced: false },
  { id: 'LPF-012', pair: 'LINK/ETH', pool: 'POOL-012', status: 'imbalanced', baseApr: 14.2, rewardApr: 18.2, totalApr: 32.4, tvl: 4_200_000, myLPValue: 0, myEarned: 0, impermanentLoss: -8.4, volume24h: 8_400_000, rewardToken: 'ZSDX', updatedAt: '2026-07-21 10:24', description: 'LINK/ETH LP 挖矿（比例失衡），年化 32.4%。', imbalanced: true },
  { id: 'LPF-013', pair: 'AVAX/USDT', pool: '-', status: 'deprecated', baseApr: 0, rewardApr: 0, totalApr: 0, tvl: 0, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 0, rewardToken: '-', updatedAt: '2026-06-15', description: 'AVAX/USDT LP（已弃用），不再接受新存款。', imbalanced: false },
  { id: 'LPF-014', pair: 'DOT/USDT', pool: '-', status: 'deprecated', baseApr: 0, rewardApr: 0, totalApr: 0, tvl: 0, myLPValue: 0, myEarned: 0, impermanentLoss: 0, volume24h: 0, rewardToken: '-', updatedAt: '2026-05-10', description: 'DOT/USDT LP（已弃用），用户可继续提取。', imbalanced: false },
];

const STAKES: StakeRecord[] = [
  { id: 'STK-001', token: 'ZSDX', type: 'flexible', status: 'active', amount: 12_500, apr: 28.4, earned: 184.6, pending: 1.24, startAt: '2026-05-15', endAt: '-', unlockAt: '即时', canUnstake: true, earlyFee: 0, apy: 28.4, validator: 'zsdex-validator-1' },
  { id: 'STK-002', token: 'ETH', type: 'locked_90', status: 'active', amount: 4_200, apr: 14.2, earned: 86.4, pending: 0.48, startAt: '2026-04-20', endAt: '2026-07-19', unlockAt: '2026-07-19 12:00', canUnstake: false, earlyFee: 0.15, apy: 14.2, validator: 'eth2-validator-pool' },
  { id: 'STK-003', token: 'SOL', type: 'flexible', status: 'active', amount: 120, apr: 18.4, earned: 2.84, pending: 0.014, startAt: '2026-06-01', endAt: '-', unlockAt: '即时', canUnstake: true, earlyFee: 0, apy: 18.4, validator: 'jito-sol-validator' },
  { id: 'STK-004', token: 'ZSDX', type: 'locked_30', status: 'active', amount: 8_400, apr: 32.4, earned: 124.6, pending: 0.84, startAt: '2026-06-20', endAt: '2026-07-20', unlockAt: '2026-07-20 12:00', canUnstake: false, earlyFee: 0.10, apy: 32.4, validator: 'zsdex-validator-2' },
  { id: 'STK-005', token: 'BTC', type: 'locked_180', status: 'active', amount: 0.6, apr: 6.4, earned: 0.012, pending: 0.0001, startAt: '2026-05-10', endAt: '2026-11-06', unlockAt: '2026-11-06 12:00', canUnstake: false, earlyFee: 0.20, apy: 6.4, validator: 'babylon-btc-validator' },
  { id: 'STK-006', token: 'ZSDX', type: 'locked_365', status: 'active', amount: 24_000, apr: 124.6, earned: 1248.4, pending: 6.84, startAt: '2026-04-01', endAt: '2027-04-01', unlockAt: '2027-04-01 12:00', canUnstake: false, earlyFee: 0.30, apy: 124.6, validator: 'zsdex-validator-3' },
  { id: 'STK-007', token: 'USDT', type: 'flexible', status: 'unstaking', amount: 4_800, apr: 8.6, earned: 0, pending: 0, startAt: '2026-05-15', endAt: '2026-07-21', unlockAt: '2026-07-23 12:00', canUnstake: false, earlyFee: 0, apy: 8.6, validator: 'usdt-stable-pool' },
  { id: 'STK-008', token: 'AVAX', type: 'locked_30', status: 'expired', amount: 24, apr: 14.6, earned: 0.86, pending: 0, startAt: '2026-05-15', endAt: '2026-06-14', unlockAt: '2026-06-15 12:00', canUnstake: true, earlyFee: 0.10, apy: 14.6, validator: 'avax-validator' },
];

const VAULTS: YieldVault[] = [
  { id: 'VLT-001', name: '稳定币聚合器 USDC', strategy: 'stable', status: 'active', tvl: 86_000_000, apy: 12.4, apy7d: 12.6, apy30d: 11.8, sharpe: 4.2, drawdown: 0.4, myDeposit: 8_400, myEarned: 184.6, risk: 'low', protocols: ['Aave', 'Compound', 'Curve'], rebalanceFreq: '每日', description: '聚合 Aave + Compound + Curve 等稳定币协议，自动再平衡，年化 11-13%。', inception: '2025-08-01' },
  { id: 'VLT-002', name: '蓝筹币均衡组合', strategy: 'balanced', status: 'active', tvl: 64_000_000, apy: 28.4, apy7d: 32.6, apy30d: 26.2, sharpe: 2.4, drawdown: 8.6, myDeposit: 4_200, myEarned: 124.8, risk: 'medium', protocols: ['Uniswap V3', 'Balancer', 'Pendle'], rebalanceFreq: '每周', description: 'BTC + ETH 蓝筹币均衡组合，结合 Uniswap V3 / Balancer / Pendle 等协议，年化 24-32%。', inception: '2025-09-15' },
  { id: 'VLT-003', name: 'Delta 中性做市', strategy: 'delta_neutral', status: 'active', tvl: 28_000_000, apy: 18.6, apy7d: 19.2, apy30d: 17.8, sharpe: 3.6, drawdown: 2.4, myDeposit: 0, myEarned: 0, risk: 'medium', protocols: ['Perpetual', 'Hedge', 'Gmx'], rebalanceFreq: '每 4 小时', description: '永续合约对冲 + 做市策略，Delta 中性，年化 17-20%。', inception: '2025-12-10' },
  { id: 'VLT-004', name: '收益曲线套利', strategy: 'yield_curve', status: 'active', tvl: 18_000_000, apy: 24.6, apy7d: 25.4, apy30d: 22.8, sharpe: 2.8, drawdown: 4.6, myDeposit: 0, myEarned: 0, risk: 'medium', protocols: ['Pendle', 'Element', 'Convex'], rebalanceFreq: '每 3 天', description: '跨协议收益曲线套利（Pendle + Element + Convex），年化 22-26%。', inception: '2026-01-20' },
  { id: 'VLT-005', name: '激进收益组合', strategy: 'aggressive', status: 'paused', tvl: 8_400_000, apy: 64.8, apy7d: 0, apy30d: 58.4, sharpe: 1.2, drawdown: 24.6, myDeposit: 0, myEarned: 0, risk: 'high', protocols: ['Leveraged', 'LST', 'Loop'], rebalanceFreq: '每日', description: '杠杆 + LST + Loop 循环策略（暂停新进），年化 50-80%，高波动。', inception: '2025-10-15' },
];

const BOOSTS: BoostItem[] = [
  { id: 'BST-001', name: 'ZSDX 持币加速卡', type: 'apr', rarity: 'epic', value: 1.5, used: false, expiresAt: '2026-08-15', source: '活动奖励', description: 'ZSDX 单币挖矿加速 50%，持币 ≥ 5,000 ZSDX 可叠加。', applicableTo: ['FARM-001', 'FARM-005', 'FARM-011', 'FARM-014'], acquiredAt: '2026-07-01', stackable: true },
  { id: 'BST-002', name: '新用户加速券', type: 'apr', rarity: 'rare', value: 1.2, used: false, expiresAt: '2026-08-31', source: '新人礼包', description: '任意单币挖矿加速 20%，有效期 60 天。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-003', 'FARM-004'], acquiredAt: '2026-07-15', stackable: true },
  { id: 'BST-003', name: 'LP 多倍奖励卡', type: 'multiplier', rarity: 'legendary', value: 2.0, used: false, expiresAt: '2026-08-01', source: '交易竞赛', description: '指定 LP 池奖励 2 倍，30 天有效。', applicableTo: ['LPF-001', 'LPF-002', 'LPF-003'], acquiredAt: '2026-07-10', stackable: false },
  { id: 'BST-004', name: '空投加成券', type: 'drop', rarity: 'rare', value: 1.3, used: false, expiresAt: '2026-09-30', source: '空投活动', description: '空投奖励加成 30%，叠加空投池使用。', applicableTo: ['POOL-001', 'POOL-002', 'POOL-003'], acquiredAt: '2026-07-20', stackable: true },
  { id: 'BST-005', name: '手续费 5 折券', type: 'fee_discount', rarity: 'common', value: 0.5, used: true, expiresAt: '2026-07-25', source: '周签到', description: '所有存取手续费 5 折，已使用。', applicableTo: ['FARM-001', 'FARM-002'], acquiredAt: '2026-07-10', stackable: false },
  { id: 'BST-006', name: '容量扩容卡', type: 'capacity', rarity: 'epic', value: 2.0, used: false, expiresAt: '2026-08-15', source: 'VIP 权益', description: '个人 TVL 上限扩容 2 倍，钻石 VIP 专享。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-005'], acquiredAt: '2026-07-01', stackable: false },
  { id: 'BST-007', name: '加速卡 1.1 倍', type: 'apr', rarity: 'common', value: 1.1, used: false, expiresAt: '2026-08-20', source: '每日任务', description: '通用挖矿加速 10%。', applicableTo: ['FARM-001', 'FARM-002', 'FARM-003'], acquiredAt: '2026-07-20', stackable: true },
  { id: 'BST-008', name: '稀有加速卡 1.4 倍', type: 'apr', rarity: 'rare', value: 1.4, used: false, expiresAt: '2026-08-10', source: '推荐奖励', description: '推荐获得，挖矿加速 40%。', applicableTo: ['FARM-001', 'FARM-003', 'FARM-005'], acquiredAt: '2026-07-15', stackable: true },
];

const REFS: RefReward[] = [
  { id: 'REF-001', referee: '0xA1B2...C3D4', tier: 'gold', volume: 248_000, commission: 1240, rate: 0.005, status: 'paid', createdAt: '2026-06-15', paidAt: '2026-07-15', source: '现货交易', note: '6 月现货交易返佣' },
  { id: 'REF-002', referee: '0xE5F6...A7B8', tier: 'silver', volume: 86_000, commission: 258, rate: 0.003, status: 'paid', createdAt: '2026-06-18', paidAt: '2026-07-15', source: '合约交易', note: '6 月合约交易返佣' },
  { id: 'REF-003', referee: '0xC9D0...E1F2', tier: 'platinum', volume: 1_240_000, commission: 12400, rate: 0.010, status: 'paid', createdAt: '2026-06-20', paidAt: '2026-07-15', source: '大客户综合', note: '大客户综合返佣' },
  { id: 'REF-004', referee: '0xA3B4...C5D6', tier: 'bronze', volume: 12_400, commission: 12.4, rate: 0.001, status: 'pending', createdAt: '2026-07-18', source: '现货交易', note: '7 月待结算' },
  { id: 'REF-005', referee: '0xE7F8...A9B0', tier: 'gold', volume: 184_000, commission: 920, rate: 0.005, status: 'pending', createdAt: '2026-07-19', source: '挖矿奖励', note: '7 月挖矿返佣待发放' },
  { id: 'REF-006', referee: '0xC1D2...E3F4', tier: 'silver', volume: 48_000, commission: 144, rate: 0.003, status: 'paid', createdAt: '2026-05-20', paidAt: '2026-06-15', source: '现货交易', note: '5 月现货返佣' },
  { id: 'REF-007', referee: '0xA5B6...C7D8', tier: 'diamond', volume: 4_800_000, commission: 72000, rate: 0.015, status: 'pending', createdAt: '2026-07-20', source: '机构大客户', note: '机构综合返佣（待审）' },
  { id: 'REF-008', referee: '0xE9F0...A1B2', tier: 'bronze', volume: 8_400, commission: 0, rate: 0.001, status: 'clawed_back', createdAt: '2026-04-10', source: '异常交易', note: '异常交易，返佣已追回' },
];

const LOCKS: LockStake[] = [
  { id: 'LCK-001', pool: 'ZSDX 365 天期', period: '365d', status: 'active', amount: 24_000, apr: 124.6, bonus: 1848.4, earned: 1248.4, startAt: '2026-04-01', endAt: '2027-04-01', unlockAt: '2027-04-01 12:00', canClaim: false, earlyExitFee: 0.30, vesting: '到期一次性释放' },
  { id: 'LCK-002', pool: 'ZSDX 90 天期', period: '90d', status: 'active', amount: 18_000, apr: 48.6, bonus: 720, earned: 486.4, startAt: '2026-05-15', endAt: '2026-08-13', unlockAt: '2026-08-13 12:00', canClaim: false, earlyExitFee: 0.20, vesting: '到期一次性释放' },
  { id: 'LCK-003', pool: 'ZSDX 180 天期', period: '180d', status: 'active', amount: 8_400, apr: 86.4, bonus: 1248.6, earned: 624.8, startAt: '2026-04-15', endAt: '2026-10-12', unlockAt: '2026-10-12 12:00', canClaim: false, earlyExitFee: 0.25, vesting: '到期一次性释放' },
  { id: 'LCK-004', pool: 'USDT 90 天期', period: '90d', status: 'unlocking', amount: 12_000, apr: 14.8, bonus: 360, earned: 184.6, startAt: '2026-04-20', endAt: '2026-07-19', unlockAt: '2026-07-21 12:00', canClaim: true, earlyExitFee: 0.15, vesting: '已到期，待领取' },
  { id: 'LCK-005', pool: 'ZSDX 30 天期', period: '30d', status: 'active', amount: 4_800, apr: 32.4, bonus: 124, earned: 84.6, startAt: '2026-06-20', endAt: '2026-07-20', unlockAt: '2026-07-20 12:00', canClaim: false, earlyExitFee: 0.10, vesting: '到期一次性释放' },
  { id: 'LCK-006', pool: 'ZSDX 7 天快锁', period: '7d', status: 'active', amount: 2_400, apr: 18.4, bonus: 12.4, earned: 8.4, startAt: '2026-07-14', endAt: '2026-07-21', unlockAt: '2026-07-21 12:00', canClaim: false, earlyExitFee: 0.05, vesting: '到期一次性释放' },
  { id: 'LCK-007', pool: 'ZSDX 90 天期', period: '90d', status: 'claimed', amount: 6_000, apr: 48.6, bonus: 480, earned: 486.4, startAt: '2026-03-15', endAt: '2026-06-13', unlockAt: '2026-06-13 12:00', canClaim: true, earlyExitFee: 0.20, vesting: '已领取' },
  { id: 'LCK-008', pool: 'ZSDX 180 天期', period: '180d', status: 'forfeited', amount: 4_000, apr: 0, bonus: 0, earned: 0, startAt: '2026-01-10', endAt: '2026-07-08', unlockAt: '2026-05-10 12:00', canClaim: false, earlyExitFee: 0.30, vesting: '提前解锁，本金扣除 30%' },
];

const HISTORIES: YieldHistory[] = [
  { id: 'HST-001', type: 'reward', source: 'FARM-001 ZSDX 单币', amount: 1.24, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xa1b2c3d4...', apr: 28.4, note: '每日挖矿奖励发放' },
  { id: 'HST-002', type: 'claim', source: 'FARM-001 ZSDX 单币', amount: 124.6, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 14:24', txHash: '0xb2c3d4e5...', apr: 28.4, note: '手动领取累积奖励' },
  { id: 'HST-003', type: 'reward', source: 'LPF-002 ETH/USDT', amount: 0.014, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xc3d4e5f6...', apr: 28.4, note: 'LP 挖矿每日奖励' },
  { id: 'HST-004', type: 'deposit', source: 'FARM-001 ZSDX 单币', amount: 4_800, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 09:14', txHash: '0xd4e5f6a7...', apr: 28.4, note: '新增存款 4,800 ZSDX' },
  { id: 'HST-005', type: 'lock', source: 'LCK-001 ZSDX 365 天期', amount: 24_000, token: 'ZSDX', status: 'completed', createdAt: '2026-04-01 12:00', txHash: '0xe5f6a7b8...', apr: 124.6, note: '365 天锁仓，APR 124.6%' },
  { id: 'HST-006', type: 'withdraw', source: 'FARM-005 ZSDX 90 天锁仓', amount: 18_000, token: 'ZSDX', status: 'completed', createdAt: '2026-05-15 12:00', txHash: '0xf6a7b8c9...', apr: 48.6, note: '90 天锁仓存款' },
  { id: 'HST-007', type: 'boost', source: 'BST-003 LP 多倍奖励', amount: 86.4, token: 'ZSDX', status: 'completed', createdAt: '2026-07-20 14:24', txHash: '0xa7b8c9d0...', apr: 0, note: 'LP 多倍奖励加成' },
  { id: 'HST-008', type: 'ref_bonus', source: '推荐奖励 REF-003', amount: 12_400, token: 'USDT', status: 'completed', createdAt: '2026-07-15 12:00', txHash: '0xb8c9d0e1...', apr: 0, note: '大客户综合返佣发放' },
  { id: 'HST-009', type: 'reward', source: 'DUAL-002 ETH/BTC', amount: 0.04, token: 'ETH', status: 'completed', createdAt: '2026-07-19 12:00', txHash: '0xc9d0e1f2...', apr: 24.6, note: '双币理财到期发放' },
  { id: 'HST-010', type: 'reward', source: 'VLT-001 稳定币聚合器', amount: 12.4, token: 'USDC', status: 'completed', createdAt: '2026-07-21 08:00', txHash: '0xd0e1f2a3...', apr: 12.4, note: '聚合器每日收益' },
  { id: 'HST-011', type: 'claim', source: 'LCK-007 ZSDX 90 天期', amount: 6_486.4, token: 'ZSDX', status: 'completed', createdAt: '2026-06-13 12:00', txHash: '0xe1f2a3b4...', apr: 48.6, note: '90 天锁仓到期领取' },
  { id: 'HST-012', type: 'unlock', source: 'STK-007 USDT 灵活', amount: 4_800, token: 'USDT', status: 'pending', createdAt: '2026-07-21 14:00', txHash: '0xf2a3b4c5...', apr: 8.6, note: '解锁中，T+2 到账' },
  { id: 'HST-013', type: 'reward', source: 'LPF-006 USDC/USDT', amount: 0.84, token: 'ZSDX', status: 'completed', createdAt: '2026-07-21 10:00', txHash: '0xa3b4c5d6...', apr: 8.6, note: '稳定对 LP 奖励' },
  { id: 'HST-014', type: 'reward', source: 'DUAL-001 ZSDX/USDT', amount: 84.6, token: 'ZSDX', status: 'failed', createdAt: '2026-07-20 14:24', txHash: '0xb4c5d6e7...', apr: 48.4, note: '交易滑点过高，已回滚' },
  { id: 'HST-015', type: 'boost', source: 'BST-001 ZSDX 持币加速', amount: 18.4, token: 'ZSDX', status: 'completed', createdAt: '2026-07-15 12:00', txHash: '0xc5d6e7f8...', apr: 0, note: 'ZSDX 持币加速加成' },
];
`;

if (!src.includes(MOCK.trim().split('\n')[1])) {
  src = src.replace('const MOCK_PLACEHOLDER = \'__MOCK_DATA_PLACEHOLDER__\';', MOCK.trim() + '\n');
  fs.writeFileSync(target, src, 'utf8');
  console.log('OK: MOCK 数据注入完成');
  console.log('Lines after: ' + src.split('\n').length);
  console.log('Size: ' + (fs.statSync(target).size / 1024).toFixed(1) + ' KB');
} else {
  console.log('SKIP: MOCK 数据已存在');
  console.log('Size: ' + (fs.statSync(target).size / 1024).toFixed(1) + ' KB');
}
