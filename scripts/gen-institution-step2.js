// gen-institution-step2.js - P3.47 Mock Data 注入
// 替换 INSTITUTIONS: Institution[] = []; ... 等 10 个空数组

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src', 'components', 'portal-preview', 'PortalInstitution.tsx');
const original = fs.readFileSync(filePath, 'utf8');

// 构造 10 个 mock data 数组（字符串字面量，不转义模板）
const MOCK_DATA = String.raw`
// ============================================================
// Mock Data
// ============================================================

const INSTITUTIONS: Institution[] = [
  {
    id: 'INST-001', name: 'Apex Sigma Capital', legalName: 'Apex Sigma Capital Pte. Ltd.',
    type: 'market_maker', tier: 'platinum', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 2_400_000_000, monthlyVolume: 18_500_000_000, accounts: 12,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2024-03-12',
    contractEnd: '2027-03-11', contact: '陈志远', email: 'contact@apex-sigma.example',
    riskScore: 18, complianceFlags: 0, rating: 4.9,
    logo: 'AS', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '做市商', '信用额度', 'API 接入', '报告白盒'],
    tags: ['tier1', '亚太中心', '500+ 交易对', 'maker-only'],
  },
  {
    id: 'INST-002', name: 'Helios Quant Partners', legalName: 'Helios Quant Partners LP',
    type: 'hedge_fund', tier: 'platinum', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 1_850_000_000, monthlyVolume: 9_200_000_000, accounts: 8,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-11-04',
    contractEnd: '2026-11-03', contact: 'Michael Chen', email: 'desk@helios-quant.example',
    riskScore: 24, complianceFlags: 1, rating: 4.7,
    logo: 'HQ', iconBg: 'rgba(68,219,244,0.18)', iconColor: '#44DBF4',
    services: ['PB 交易', '衍生品对冲', '信用额度', '白盒报告'],
    tags: ['multi-strat', '中性策略', '高换手'],
  },
  {
    id: 'INST-003', name: 'Argonaut Family Office', legalName: 'Argonaut Family Office SA',
    type: 'family_office', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 680_000_000, monthlyVolume: 1_400_000_000, accounts: 4,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-06-18',
    contractEnd: '2027-06-17', contact: 'Jean-Luc Martin', email: 'office@argonaut.example',
    riskScore: 12, complianceFlags: 0, rating: 4.8,
    logo: 'AF', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['托管', '资产配置', '报告白盒', 'API 接入'],
    tags: ['长周期', '低频', '多代际'],
  },
  {
    id: 'INST-004', name: 'Polaris Sovereign Capital', legalName: 'Polaris Sovereign Capital Ltd.',
    type: 'sovereign', tier: 'platinum', region: '中东', jurisdiction: '合规研究方向示例',
    aum: 5_200_000_000, monthlyVolume: 8_700_000_000, accounts: 6,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-08-22',
    contractEnd: '2028-08-21', contact: '王建国', email: 'desk@polaris-sov.example',
    riskScore: 9, complianceFlags: 0, rating: 5.0,
    logo: 'PS', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '做市商', '大宗撮合', '报告白盒', 'API 接入', '风险对冲'],
    tags: ['超长周期', '低风险', '长期持有'],
  },
  {
    id: 'INST-005', name: 'Vega Trading Group', legalName: 'Vega Trading Group LLC',
    type: 'prop_trading', tier: 'gold', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 320_000_000, monthlyVolume: 6_500_000_000, accounts: 3,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-01-15',
    contractEnd: '2026-01-14', contact: 'Sarah Kim', email: 'desk@vega-trading.example',
    riskScore: 32, complianceFlags: 2, rating: 4.4,
    logo: 'VT', iconBg: 'rgba(246,70,93,0.18)', iconColor: '#F6465D',
    services: ['PB 交易', '做市商', '高杠杆'],
    tags: ['高频', '高杠杆', '做市'],
  },
  {
    id: 'INST-006', name: 'Citadel Prime Brokerage', legalName: 'Citadel Prime Brokerage DMCC',
    type: 'broker', tier: 'platinum', region: '中东', jurisdiction: '合规研究方向示例',
    aum: 8_400_000_000, monthlyVolume: 42_000_000_000, accounts: 32,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2023-04-01',
    contractEnd: '2028-03-31', contact: 'Ahmed Al-Rashid', email: 'pb@citadel-pb.example',
    riskScore: 14, complianceFlags: 0, rating: 4.9,
    logo: 'CP', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['PB 交易', '信用额度', '大宗撮合', '做市商', '白盒报告', 'API 接入'],
    tags: ['主经纪商', '多产品', '全球客户'],
  },
  {
    id: 'INST-007', name: '永丰银行资管', legalName: '永丰银行资产管理（香港）有限公司',
    type: 'bank', tier: 'platinum', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 1_120_000_000, monthlyVolume: 3_800_000_000, accounts: 18,
    status: 'active', kybLevel: 5, kybStatus: 'approved', joinedAt: '2024-02-28',
    contractEnd: '2027-02-27', contact: '林志明', email: 'am@yongfeng-am.example',
    riskScore: 8, complianceFlags: 0, rating: 4.8,
    logo: 'YF', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['托管', 'PB 交易', '报告白盒', '合规咨询'],
    tags: ['传统银行', '长期合作', '高合规'],
  },
  {
    id: 'INST-008', name: 'Quantum Leap Capital', legalName: 'Quantum Leap Capital Partners',
    type: 'hedge_fund', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 540_000_000, monthlyVolume: 2_900_000_000, accounts: 5,
    status: 'review', kybLevel: 3, kybStatus: 'review', joinedAt: '2025-09-10',
    contractEnd: '2026-09-09', contact: 'Hans Mueller', email: 'desk@quantum-leap.example',
    riskScore: 45, complianceFlags: 3, rating: 4.2,
    logo: 'QL', iconBg: 'rgba(255,169,64,0.18)', iconColor: '#FFA940',
    services: ['PB 交易', '信用额度'],
    tags: ['中性策略', '中频', '多产品'],
  },
  {
    id: 'INST-009', name: '新航资管', legalName: '新航资产管理有限公司',
    type: 'corporate', tier: 'silver', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 180_000_000, monthlyVolume: 320_000_000, accounts: 2,
    status: 'onboarding', kybLevel: 2, kybStatus: 'pending', joinedAt: '2026-05-20',
    contractEnd: '2027-05-19', contact: '张明', email: 'finance@xinhang.example',
    riskScore: 22, complianceFlags: 1, rating: 4.3,
    logo: 'XH', iconBg: 'rgba(176,176,176,0.18)', iconColor: '#B0B0B0',
    services: ['PB 交易', '托管'],
    tags: ['企业财资', '对公', '低频'],
  },
  {
    id: 'INST-010', name: 'Orion Global Macro', legalName: 'Orion Global Macro Fund',
    type: 'hedge_fund', tier: 'gold', region: '北美', jurisdiction: '合规研究方向示例',
    aum: 920_000_000, monthlyVolume: 5_200_000_000, accounts: 7,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-07-08',
    contractEnd: '2027-07-07', contact: 'David Park', email: 'macro@orion-gm.example',
    riskScore: 28, complianceFlags: 1, rating: 4.6,
    logo: 'OG', iconBg: 'rgba(68,219,244,0.18)', iconColor: '#44DBF4',
    services: ['PB 交易', '衍生品对冲', '大宗撮合'],
    tags: ['宏观策略', '多资产', '中高频'],
  },
  {
    id: 'INST-011', name: '梅德韦资本', legalName: 'Medved Capital Partners',
    type: 'market_maker', tier: 'gold', region: '欧洲', jurisdiction: '合规研究方向示例',
    aum: 480_000_000, monthlyVolume: 11_200_000_000, accounts: 4,
    status: 'active', kybLevel: 4, kybStatus: 'approved', joinedAt: '2024-04-22',
    contractEnd: '2026-04-21', contact: 'Igor Petrov', email: 'desk@medved.example',
    riskScore: 26, complianceFlags: 1, rating: 4.5,
    logo: 'MC', iconBg: 'rgba(20,184,129,0.18)', iconColor: '#14B881',
    services: ['做市商', 'PB 交易', 'API 接入'],
    tags: ['做市专家', '欧洲中心', 'maker-only'],
  },
  {
    id: 'INST-012', name: '银河数币资管', legalName: '银河数字货币资产管理有限公司',
    type: 'family_office', tier: 'silver', region: '亚太', jurisdiction: '合规研究方向示例',
    aum: 95_000_000, monthlyVolume: 220_000_000, accounts: 2,
    status: 'paused', kybLevel: 3, kybStatus: 'approved', joinedAt: '2025-02-14',
    contractEnd: '2026-02-13', contact: '高雪', email: 'office@galaxy-dc.example',
    riskScore: 38, complianceFlags: 2, rating: 4.1,
    logo: 'YX', iconBg: 'rgba(176,176,176,0.18)', iconColor: '#B0B0B0',
    services: ['托管', '资产配置'],
    tags: ['长周期', '家族办公室', '保守'],
  },
];

const KYB_APPLICATIONS: KybApplication[] = [
  { id: 'KYB-2026-0731', institution: 'Meridian Alpha Fund', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-18 14:32:11', reviewStage: 'ubo', progress: 65, reviewer: '张婷婷', status: 'review', documents: 24, missingDocs: 2, flags: 0, estimatedDays: 4, sla: 7, riskLevel: 'medium', notes: 'UBO 穿透 2 层股权，建议补充第二层受益人身份证明', uboCount: 5, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0730', institution: 'Aurora Global Trading', jurisdiction: '合规研究方向示例', type: '做市商', submittedAt: '2026-07-17 09:18:42', reviewStage: 'aml', progress: 80, reviewer: '王浩', status: 'review', documents: 31, missingDocs: 0, flags: 1, estimatedDays: 2, sla: 5, riskLevel: 'low', notes: 'AML 命中 1 项低风险，已附说明函', uboCount: 3, amlHits: 1, sanctionsHits: 0 },
  { id: 'KYB-2026-0729', institution: '北极星资管', jurisdiction: '合规研究方向示例', type: '家族办公室', submittedAt: '2026-07-15 16:45:00', reviewStage: 'sanctions', progress: 90, reviewer: '李娜', status: 'review', documents: 28, missingDocs: 0, flags: 0, estimatedDays: 1, sla: 5, riskLevel: 'low', notes: '制裁核查通过，等待终审', uboCount: 4, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0728', institution: 'Stellar Macro Partners', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-14 11:22:33', reviewStage: 'final', progress: 95, reviewer: '陈思雨', status: 'review', documents: 35, missingDocs: 0, flags: 0, estimatedDays: 1, sla: 7, riskLevel: 'low', notes: '终审中，预计明日出结论', uboCount: 6, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0727', institution: '鸿鹄量化', jurisdiction: '合规研究方向示例', type: '自营交易', submittedAt: '2026-07-12 13:08:21', reviewStage: 'documents', progress: 25, reviewer: '王浩', status: 'pending', documents: 12, missingDocs: 8, flags: 2, estimatedDays: 7, sla: 10, riskLevel: 'medium', notes: '8 项资料待补，建议尽快提交以免影响 SLA', uboCount: 2, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0726', institution: 'Oasis Capital Asia', jurisdiction: '合规研究方向示例', type: '家族办公室', submittedAt: '2026-07-08 10:15:50', reviewStage: 'final', progress: 100, reviewer: '李娜', status: 'approved', documents: 26, missingDocs: 0, flags: 0, estimatedDays: 0, sla: 7, riskLevel: 'low', notes: '已通过，已开通 PB 交易权限', uboCount: 3, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0725', institution: 'Krypton Digital Fund', jurisdiction: '合规研究方向示例', type: '对冲基金', submittedAt: '2026-07-05 15:42:18', reviewStage: 'ubo', progress: 55, reviewer: '张婷婷', status: 'resubmit', documents: 18, missingDocs: 5, flags: 1, estimatedDays: 6, sla: 7, riskLevel: 'high', notes: 'UBO 资料不完整，需补 5 项关键材料', uboCount: 4, amlHits: 0, sanctionsHits: 0 },
  { id: 'KYB-2026-0724', institution: 'BlueRiver Securities', jurisdiction: '合规研究方向示例', type: '券商', submittedAt: '2026-07-01 09:30:00', reviewStage: 'final', progress: 100, reviewer: '陈思雨', status: 'rejected', documents: 22, missingDocs: 0, flags: 3, estimatedDays: 0, sla: 7, riskLevel: 'high', notes: 'AML 命中 3 项高风险，建议 6 个月后重新申请', uboCount: 7, amlHits: 3, sanctionsHits: 0 },
];

const PB_TRADES: PbTrade[] = [
  { id: 'PB-2026-0719-9981', institution: 'Apex Sigma Capital', symbol: 'BTC/USDT', side: 'buy', qty: 25.5, price: 65_420, value: 1_668_210, fee: 834.11, rebate: 333.64, executedAt: '2026-07-19 14:32:18', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9980', institution: 'Helios Quant Partners', symbol: 'ETH/USDT', side: 'sell', qty: 420, price: 3_482, value: 1_462_440, fee: 731.22, rebate: 292.49, executedAt: '2026-07-19 14:28:55', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9979', institution: 'Polaris Sovereign Capital', symbol: 'BTC/USDT', side: 'buy', qty: 78, price: 65_380, value: 5_099_640, fee: 2_549.82, rebate: 1_019.93, executedAt: '2026-07-19 14:25:42', venue: 'OTC Block', settlementT: 2, status: 'settled', counterparty: 'Galaxy Digital', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9978', institution: 'Citadel Prime Brokerage', symbol: 'SOL/USDT', side: 'buy', qty: 12_500, price: 142, value: 1_775_000, fee: 887.50, rebate: 355.00, executedAt: '2026-07-19 14:18:20', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9977', institution: 'Vega Trading Group', symbol: 'ETH-PERP', side: 'sell', qty: 850, price: 3_485, value: 2_962_250, fee: 1_481.13, rebate: 592.45, executedAt: '2026-07-19 14:12:08', venue: 'Perp', settlementT: 0, status: 'filled', counterparty: '撮合池', creditUsed: 850_000, leverage: 3.5, liquidity: 'taker' },
  { id: 'PB-2026-0719-9976', institution: 'Orion Global Macro', symbol: 'BTC-PERP', side: 'buy', qty: 120, price: 65_410, value: 7_849_200, fee: 3_924.60, rebate: 1_569.84, executedAt: '2026-07-19 14:05:33', venue: 'Perp', settlementT: 0, status: 'filled', counterparty: '撮合池', creditUsed: 2_000_000, leverage: 4, liquidity: 'taker' },
  { id: 'PB-2026-0719-9975', institution: '永丰银行资管', symbol: 'BTC/USDT', side: 'sell', qty: 18, price: 65_350, value: 1_176_300, fee: 588.15, rebate: 235.26, executedAt: '2026-07-19 13:58:11', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9974', institution: 'Medved Capital Partners', symbol: 'ETH/USDT', side: 'buy', qty: 280, price: 3_478, value: 973_840, fee: 486.92, rebate: 194.77, executedAt: '2026-07-19 13:45:00', venue: 'Spot', settlementT: 1, status: 'partial', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
  { id: 'PB-2026-0719-9973', institution: 'Argonaut Family Office', symbol: 'BTC/USDT', side: 'buy', qty: 4.5, price: 65_320, value: 293_940, fee: 146.97, rebate: 58.79, executedAt: '2026-07-19 13:32:14', venue: 'Spot', settlementT: 1, status: 'pending', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'taker' },
  { id: 'PB-2026-0719-9972', institution: 'Apex Sigma Capital', symbol: 'SOL/USDT', side: 'buy', qty: 8_500, price: 141, value: 1_198_500, fee: 599.25, rebate: 239.70, executedAt: '2026-07-19 13:18:42', venue: 'Spot', settlementT: 1, status: 'settled', counterparty: '撮合池', creditUsed: 0, leverage: 1, liquidity: 'maker' },
];

const CREDIT_LINES: CreditLine[] = [
  { id: 'CL-INST-001', institution: 'Apex Sigma Capital', total: 500_000_000, used: 145_000_000, available: 355_000_000, rate: 0.085, collateralRatio: 2.5, liquidationLine: 180_000_000, marginCall: 200_000_000, status: 'normal', expiresAt: '2027-03-11', lastReview: '2026-06-15', nextReview: '2026-12-15', lvr: 0.290, utilizationPct: 0.290, collateralUsd: 362_500_000 },
  { id: 'CL-INST-002', institution: 'Helios Quant Partners', total: 350_000_000, used: 245_000_000, available: 105_000_000, rate: 0.092, collateralRatio: 2.2, liquidationLine: 300_000_000, marginCall: 320_000_000, status: 'warning', expiresAt: '2026-11-03', lastReview: '2026-05-20', nextReview: '2026-08-20', lvr: 0.700, utilizationPct: 0.700, collateralUsd: 539_000_000 },
  { id: 'CL-INST-003', institution: 'Polaris Sovereign Capital', total: 1_200_000_000, used: 320_000_000, available: 880_000_000, rate: 0.065, collateralRatio: 3.0, liquidationLine: 360_000_000, marginCall: 400_000_000, status: 'normal', expiresAt: '2028-08-21', lastReview: '2026-07-01', nextReview: '2027-01-01', lvr: 0.267, utilizationPct: 0.267, collateralUsd: 960_000_000 },
  { id: 'CL-INST-004', institution: 'Citadel Prime Brokerage', total: 2_000_000_000, used: 680_000_000, available: 1_320_000_000, rate: 0.072, collateralRatio: 2.8, liquidationLine: 720_000_000, marginCall: 800_000_000, status: 'normal', expiresAt: '2028-03-31', lastReview: '2026-06-30', nextReview: '2026-12-30', lvr: 0.340, utilizationPct: 0.340, collateralUsd: 1_904_000_000 },
  { id: 'CL-INST-005', institution: 'Vega Trading Group', total: 80_000_000, used: 64_000_000, available: 16_000_000, rate: 0.115, collateralRatio: 1.8, liquidationLine: 70_000_000, marginCall: 75_000_000, status: 'margin', expiresAt: '2026-01-14', lastReview: '2026-07-10', nextReview: '2026-07-25', lvr: 0.800, utilizationPct: 0.800, collateralUsd: 115_200_000 },
  { id: 'CL-INST-006', institution: 'Orion Global Macro', total: 200_000_000, used: 124_000_000, available: 76_000_000, rate: 0.095, collateralRatio: 2.0, liquidationLine: 140_000_000, marginCall: 160_000_000, status: 'warning', expiresAt: '2027-07-07', lastReview: '2026-06-08', nextReview: '2026-09-08', lvr: 0.620, utilizationPct: 0.620, collateralUsd: 248_000_000 },
  { id: 'CL-INST-007', institution: 'Quantum Leap Capital', total: 120_000_000, used: 36_000_000, available: 84_000_000, rate: 0.105, collateralRatio: 2.3, liquidationLine: 45_000_000, marginCall: 55_000_000, status: 'normal', expiresAt: '2026-09-09', lastReview: '2026-05-30', nextReview: '2026-08-30', lvr: 0.300, utilizationPct: 0.300, collateralUsd: 82_800_000 },
  { id: 'CL-INST-008', institution: 'Medved Capital Partners', total: 100_000_000, used: 28_000_000, available: 72_000_000, rate: 0.098, collateralRatio: 2.4, liquidationLine: 36_000_000, marginCall: 42_000_000, status: 'normal', expiresAt: '2026-04-21', lastReview: '2026-06-25', nextReview: '2026-09-25', lvr: 0.280, utilizationPct: 0.280, collateralUsd: 67_200_000 },
];

const BLOCK_TRADES: BlockTrade[] = [
  { id: 'BLK-2026-0719-088', buyer: 'Polaris Sovereign Capital', seller: 'OTC 池 · 银河数币资管', symbol: 'BTC', side: 'buy', qty: 78, price: 65_180, value: 5_084_040, discount: -0.0008, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 13:42:18', agreedAt: '2026-07-19 13:48:55', settledAt: '2026-07-19 15:48:55', blockId: 'BLK-2026-0719-088', fee: 5_084, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-087', buyer: 'Orion Global Macro', seller: 'OTC 池 · Vega Trading', symbol: 'ETH', side: 'buy', qty: 1_200, price: 3_475, value: 4_170_000, discount: -0.0012, status: 'settling', venue: 'OTC Block', rfqAt: '2026-07-19 14:18:00', agreedAt: '2026-07-19 14:22:33', settledAt: '', blockId: 'BLK-2026-0719-087', fee: 4_170, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-086', buyer: 'Citadel Prime Brokerage', seller: 'OTC 池', symbol: 'BTC', side: 'buy', qty: 150, price: 65_120, value: 9_768_000, discount: -0.0015, status: 'agreed', venue: 'OTC Block', rfqAt: '2026-07-19 14:05:18', agreedAt: '2026-07-19 14:11:42', settledAt: '', blockId: 'BLK-2026-0719-086', fee: 9_768, settlement: 'T+1 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-085', buyer: '永丰银行资管', seller: 'OTC 池 · Argonaut FO', symbol: 'ETH', side: 'buy', qty: 350, price: 3_470, value: 1_214_500, discount: -0.001, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 11:32:00', agreedAt: '2026-07-19 11:38:22', settledAt: '2026-07-19 13:38:22', blockId: 'BLK-2026-0719-085', fee: 1_214, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-084', buyer: 'Helios Quant Partners', seller: 'OTC 池', symbol: 'BTC', side: 'sell', qty: 45, price: 65_280, value: 2_937_600, discount: -0.0006, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 10:18:00', agreedAt: '2026-07-19 10:24:11', settledAt: '2026-07-19 12:24:11', blockId: 'BLK-2026-0719-084', fee: 2_938, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-083', buyer: 'Apex Sigma Capital', seller: 'OTC 池 · Galaxy DC', symbol: 'SOL', side: 'buy', qty: 18_000, price: 140, value: 2_520_000, discount: -0.0018, status: 'negotiating', venue: 'OTC Block', rfqAt: '2026-07-19 14:35:00', agreedAt: '', settledAt: '', blockId: 'BLK-2026-0719-083', fee: 0, settlement: 'T+1 链上结算', desk: '机构 OTC 台' },
  { id: 'BLK-2026-0719-082', buyer: 'Polaris Sovereign Capital', seller: 'OTC 池', symbol: 'ETH', side: 'buy', qty: 2_500, price: 3_468, value: 8_670_000, discount: -0.0014, status: 'completed', venue: 'OTC Block', rfqAt: '2026-07-19 09:55:00', agreedAt: '2026-07-19 10:02:18', settledAt: '2026-07-19 12:02:18', blockId: 'BLK-2026-0719-082', fee: 8_670, settlement: 'T+2 链上结算', desk: '机构 OTC 台' },
];

const LIQUIDITY_SHARES: LiquidityShare[] = [
  { id: 'LQ-2026-Q2-001', institution: 'Apex Sigma Capital', pool: 'BTC/USDT 主池', totalShare: 0.184, volumeShare: 0.215, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 1_280_000, spreadCaptured: 425_000, makerRatio: 0.84, takerRatio: 0.16, uptime: 0.998, latency: 8.2, qualityScore: 96, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 14 },
  { id: 'LQ-2026-Q2-002', institution: 'Medved Capital Partners', pool: 'ETH/USDT 主池', totalShare: 0.142, volumeShare: 0.168, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 880_000, spreadCaptured: 312_000, makerRatio: 0.81, takerRatio: 0.19, uptime: 0.996, latency: 11.4, qualityScore: 92, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 18 },
  { id: 'LQ-2026-Q2-003', institution: 'Citadel Prime Brokerage', pool: '全市场多池', totalShare: 0.215, volumeShare: 0.248, rebateTier: 'tier1', rebateRate: 0.0003, rebateAmount: 1_650_000, spreadCaptured: 528_000, makerRatio: 0.78, takerRatio: 0.22, uptime: 0.999, latency: 6.8, qualityScore: 98, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 42 },
  { id: 'LQ-2026-Q2-004', institution: 'Vega Trading Group', pool: 'SOL-PERP 池', totalShare: 0.082, volumeShare: 0.094, rebateTier: 'tier2', rebateRate: 0.00018, rebateAmount: 320_000, spreadCaptured: 145_000, makerRatio: 0.68, takerRatio: 0.32, uptime: 0.984, latency: 18.6, qualityScore: 84, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 8 },
  { id: 'LQ-2026-Q2-005', institution: 'Apex Sigma Capital', pool: 'ALT/USDT 中池', totalShare: 0.118, volumeShare: 0.142, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 620_000, spreadCaptured: 218_000, makerRatio: 0.86, takerRatio: 0.14, uptime: 0.997, latency: 9.4, qualityScore: 95, period: '2026 Q2', paidAt: '2026-07-05', status: 'paid', pairs: 22 },
  { id: 'LQ-2026-Q3-001', institution: 'Apex Sigma Capital', pool: 'BTC/USDT 主池', totalShare: 0.198, volumeShare: 0.228, rebateTier: 'tier1', rebateRate: 0.00025, rebateAmount: 1_450_000, spreadCaptured: 482_000, makerRatio: 0.85, takerRatio: 0.15, uptime: 0.999, latency: 7.8, qualityScore: 97, period: '2026 Q3（进行中）', paidAt: '', status: 'active', pairs: 14 },
  { id: 'LQ-2026-Q3-002', institution: 'Citadel Prime Brokerage', pool: '全市场多池', totalShare: 0.225, volumeShare: 0.262, rebateTier: 'tier1', rebateRate: 0.0003, rebateAmount: 1_820_000, spreadCaptured: 612_000, makerRatio: 0.79, takerRatio: 0.21, uptime: 0.999, latency: 6.2, qualityScore: 98, period: '2026 Q3（进行中）', paidAt: '', status: 'active', pairs: 44 },
  { id: 'LQ-2026-Q3-003', institution: '新航资管', pool: 'BTC-PERP 池', totalShare: 0.018, volumeShare: 0.022, rebateTier: 'tier3', rebateRate: 0.0001, rebateAmount: 0, spreadCaptured: 0, makerRatio: 0.32, takerRatio: 0.68, uptime: 0.852, latency: 32.4, qualityScore: 62, period: '2026 Q3（进行中）', paidAt: '', status: 'pending', pairs: 2 },
];

const INST_REPORTS: InstReport[] = [
  { id: 'RPT-2026-0719-AX', title: 'Apex Sigma Capital · 6 月运营报告', type: 'monthly', institution: 'Apex Sigma Capital', period: '2026-06', generatedAt: '2026-07-05 08:00:00', pages: 42, recipients: 8, sections: ['AUM 概览', '交易分布', 'PnL 归因', '风控指标', '流动性报告', 'API 调用统计', '税务摘要', '合规清单'], dataPoints: 12_840, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 4_280_000 },
  { id: 'RPT-2026-0719-CP', title: 'Citadel Prime Brokerage · Q2 季度报告', type: 'quarterly', institution: 'Citadel Prime Brokerage', period: '2026 Q2', generatedAt: '2026-07-08 14:32:00', pages: 128, recipients: 18, sections: ['季度运营总览', '机构服务 KPI', 'PB 交易分布', '信用额度使用', '大宗撮合汇总', '流动性分成', '风险敞口', '衍生品对冲', 'API 接入统计', '合规审计', 'KYB 状态', '下季度展望'], dataPoints: 48_200, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 12_400_000 },
  { id: 'RPT-2026-0719-HL', title: 'Helios Quant Partners · 周报', type: 'weekly', institution: 'Helios Quant Partners', period: '2026-W29', generatedAt: '2026-07-19 06:00:00', pages: 18, recipients: 4, sections: ['本周交易', 'PnL 归因', '策略表现', '风险指标', '下周展望'], dataPoints: 2_240, status: 'ready', whiteLabel: true, compliance: false, format: 'pdf', size: 1_280_000 },
  { id: 'RPT-2026-0719-PS', title: 'Polaris Sovereign Capital · 半年报', type: 'quarterly', institution: 'Polaris Sovereign Capital', period: '2026 H1', generatedAt: '2026-07-10 10:15:00', pages: 86, recipients: 6, sections: ['半年运营总览', 'AUM 增长', '资产配置', '风险归因', '大宗成交', '做市表现', '合规审计', '下期展望'], dataPoints: 32_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 8_900_000 },
  { id: 'RPT-2026-0719-YF', title: '永丰银行资管 · 日运营报告', type: 'daily', institution: '永丰银行资管', period: '2026-07-19', generatedAt: '2026-07-19 18:00:00', pages: 8, recipients: 12, sections: ['今日交易', 'PnL', '持仓变动', '风控指标'], dataPoints: 1_280, status: 'ready', whiteLabel: true, compliance: true, format: 'html', size: 320_000 },
  { id: 'RPT-2026-0719-OR', title: 'Orion Global Macro · 月报', type: 'monthly', institution: 'Orion Global Macro', period: '2026-06', generatedAt: '2026-07-05 09:00:00', pages: 38, recipients: 5, sections: ['月度运营', '宏观策略', 'PnL 归因', '对冲有效性', '风险敞口'], dataPoints: 8_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 3_120_000 },
  { id: 'RPT-2026-0719-AG', title: 'Argonaut FO · 年度审计报告', type: 'audit', institution: 'Argonaut Family Office', period: '2025', generatedAt: '2026-04-30 18:00:00', pages: 184, recipients: 3, sections: ['年度审计', 'AUM 增长', '税务摘要', '合规审计', 'KYB/KYC 状态', '风险事件', '内部审计'], dataPoints: 86_400, status: 'sent', whiteLabel: true, compliance: true, format: 'pdf', size: 22_400_000 },
];

const HEDGE_INTERFACES: HedgeInterface[] = [
  { id: 'HDG-001', institution: 'Apex Sigma Capital', product: 'BTC-PERP', type: 'perp', notional: 24_500_000, delta: 0.94, vega: 0, theta: -28.4, gamma: 0, hedgeRatio: 0.96, effectiveness: 0.94, pnl: 1_280_000, basis: 0.0012, status: 'active', startedAt: '2026-04-15', expiresAt: '2026-09-15', counterparty: '撮合池 · 内部对冲', venue: 'Deribit + 内部' },
  { id: 'HDG-002', institution: 'Helios Quant Partners', product: 'ETH-30D-3500-C', type: 'option', notional: 8_200_000, delta: 0.62, vega: 124.5, theta: -42.8, gamma: 0.018, hedgeRatio: 0.88, effectiveness: 0.86, pnl: 480_000, basis: 0.0008, status: 'active', startedAt: '2026-05-20', expiresAt: '2026-08-20', counterparty: 'Deribit', venue: 'Deribit' },
  { id: 'HDG-003', institution: 'Polaris Sovereign Capital', product: 'BTC 跨期价差', type: 'future', notional: 56_000_000, delta: 0.02, vega: 0, theta: 0, gamma: 0, hedgeRatio: 0.99, effectiveness: 0.92, pnl: 2_180_000, basis: 0.0005, status: 'active', startedAt: '2026-03-01', expiresAt: '2026-12-31', counterparty: '内部对冲', venue: 'CME + 内部' },
  { id: 'HDG-004', institution: 'Citadel Prime Brokerage', product: '多币种 IR Swap', type: 'swap', notional: 120_000_000, delta: 0, vega: 0, theta: 0, gamma: 0, hedgeRatio: 1.0, effectiveness: 0.98, pnl: 3_240_000, basis: 0.0002, status: 'active', startedAt: '2026-01-15', expiresAt: '2027-01-15', counterparty: '高盛 / 摩根', venue: 'OTC' },
  { id: 'HDG-005', institution: 'Vega Trading Group', product: 'SOL-PERP', type: 'perp', notional: 4_800_000, delta: 0.88, vega: 0, theta: -8.2, gamma: 0, hedgeRatio: 0.92, effectiveness: 0.88, pnl: -120_000, basis: 0.0018, status: 'rolling', startedAt: '2026-06-10', expiresAt: '2026-08-10', counterparty: '撮合池', venue: '内部' },
  { id: 'HDG-006', institution: 'Orion Global Macro', product: '黄金 vs BTC 价差', type: 'forward', notional: 18_000_000, delta: -0.32, vega: 0, theta: 0, gamma: 0, hedgeRatio: 0.78, effectiveness: 0.74, pnl: 680_000, basis: 0.0024, status: 'active', startedAt: '2026-05-01', expiresAt: '2026-11-01', counterparty: '内部对冲', venue: 'OTC' },
  { id: 'HDG-007', institution: '永丰银行资管', product: 'USD/HKD 货币掉期', type: 'swap', notional: 32_000_000, delta: 0, vega: 0, theta: 0, gamma: 0, hedgeRatio: 1.0, effectiveness: 0.96, pnl: 480_000, basis: 0.0001, status: 'active', startedAt: '2026-04-01', expiresAt: '2027-04-01', counterparty: '汇丰 / 渣打', venue: 'OTC' },
];

const MM_PARTNERSHIPS: MmPartnership[] = [
  { id: 'MMP-001', institution: 'Apex Sigma Capital', pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOT/USDT', 'TRX/USDT', 'LTC/USDT', 'BCH/USDT'], depthUsd: 18_500_000, spreadTarget: 0.0005, rebate: 0.00025, uptime: 0.998, volume24h: 285_000_000, inventory: 8_400_000, riskLimit: 25_000_000, status: 'active', contractStart: '2024-03-12', contractEnd: '2027-03-11', revenueShare: 0.55, qualityScore: 96, tier: 'tier1', leverage: 3 },
  { id: 'MMP-002', institution: 'Medved Capital Partners', pairs: ['ETH/USDT', 'BTC/USDT', 'ARB/USDT', 'OP/USDT', 'MATIC/USDT', 'ATOM/USDT', 'NEAR/USDT', 'APT/USDT', 'SUI/USDT', 'INJ/USDT', 'TIA/USDT', 'SEI/USDT', 'WLD/USDT', 'STRK/USDT', 'PYTH/USDT', 'JTO/USDT', 'JUP/USDT', 'ONDO/USDT'], depthUsd: 12_400_000, spreadTarget: 0.0008, rebate: 0.00022, uptime: 0.996, volume24h: 148_000_000, inventory: 5_200_000, riskLimit: 15_000_000, status: 'active', contractStart: '2024-04-22', contractEnd: '2026-04-21', revenueShare: 0.50, qualityScore: 92, tier: 'tier1', leverage: 2.5 },
  { id: 'MMP-003', institution: 'Citadel Prime Brokerage', pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT', 'MATIC/USDT', 'LINK/USDT', 'DOT/USDT', 'TRX/USDT', 'TON/USDT', 'SHIB/USDT', 'PEPE/USDT', 'WIF/USDT', 'BONK/USDT', 'FLOKI/USDT', 'ORDI/USDT', 'SATS/USDT', 'RATS/USDT', 'MEME/USDT', 'BOME/USDT', 'ENA/USDT', 'ETHFI/USDT', 'PENDLE/USDT', 'EIGEN/USDT', 'TAO/USDT', 'IO/USDT', 'ZRO/USDT', 'LISTA/USDT', 'BANK/USDT', 'REZ/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT', 'IOUSDT/USDT'], depthUsd: 42_000_000, spreadTarget: 0.0004, rebate: 0.0003, uptime: 0.999, volume24h: 685_000_000, inventory: 22_400_000, riskLimit: 60_000_000, status: 'active', contractStart: '2023-04-01', contractEnd: '2028-03-31', revenueShare: 0.60, qualityScore: 98, tier: 'tier1', leverage: 5 },
  { id: 'MMP-004', institution: 'Vega Trading Group', pairs: ['SOL-PERP', 'SOL/USDT', 'JTO/USDT', 'JUP/USDT', 'PYTH/USDT', 'W/USDT', 'TIA/USDT', 'SEI/USDT'], depthUsd: 4_200_000, spreadTarget: 0.0012, rebate: 0.00018, uptime: 0.984, volume24h: 38_000_000, inventory: 1_800_000, riskLimit: 6_000_000, status: 'active', contractStart: '2024-01-15', contractEnd: '2026-01-14', revenueShare: 0.45, qualityScore: 84, tier: 'tier2', leverage: 4 },
  { id: 'MMP-005', institution: 'Orion Global Macro', pairs: ['BTC-PERP', 'ETH-PERP', 'BTC/USDT', 'ETH/USDT'], depthUsd: 8_400_000, spreadTarget: 0.0006, rebate: 0.0002, uptime: 0.991, volume24h: 84_000_000, inventory: 3_200_000, riskLimit: 12_000_000, status: 'beta', contractStart: '2025-09-10', contractEnd: '2026-09-09', revenueShare: 0.48, qualityScore: 88, tier: 'tier2', leverage: 3.5 },
  { id: 'MMP-006', institution: '新航资管', pairs: ['BTC-PERP', 'ETH-PERP'], depthUsd: 1_200_000, spreadTarget: 0.0015, rebate: 0.0001, uptime: 0.852, volume24h: 8_400_000, inventory: 480_000, riskLimit: 2_000_000, status: 'onboarding', contractStart: '2026-05-20', contractEnd: '2027-05-19', revenueShare: 0.40, qualityScore: 62, tier: 'tier3', leverage: 2 },
];

const API_CREDENTIALS: ApiCredential[] = [
  { id: 'AK-2024-APX-01', institution: 'Apex Sigma Capital', name: 'Apex PB Trading', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '撤单历史'], rateLimit: 600, used: 286, ipWhitelist: ['52.84.18.0/24', '13.244.22.0/24', '18.136.18.0/24'], status: 'active', createdAt: '2024-03-12', lastUsed: '2026-07-19 14:32:18', expiresAt: '2026-09-12', apiKey: 'zs_apx_4j8s9d2k5l1m3n6p8q0r', signature: 'hmac', region: 'ap-east-1', calls24h: 1_286_400 },
  { id: 'AK-2024-CIT-01', institution: 'Citadel Prime Brokerage', name: 'Citadel PB + MarketData', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '行情订阅', 'K线', '深度'], rateLimit: 1000, used: 728, ipWhitelist: ['13.244.0.0/16', '52.84.0.0/16'], status: 'active', createdAt: '2023-04-01', lastUsed: '2026-07-19 14:33:00', expiresAt: '2026-10-01', apiKey: 'zs_cit_2k4m6n8p0q2r4s6t8u0v', signature: 'ed25519', region: 'ap-east-1 + eu-west-1', calls24h: 4_280_000 },
  { id: 'AK-2024-HEL-01', institution: 'Helios Quant Partners', name: 'Helios Quant Risk', type: 'risk_query', permissions: ['风险查询', '持仓', '成交', '对账单'], rateLimit: 300, used: 142, ipWhitelist: ['34.218.0.0/16'], status: 'active', createdAt: '2023-11-04', lastUsed: '2026-07-19 14:18:22', expiresAt: '2026-11-04', apiKey: 'zs_hel_8w0y2a4b6c8d0e2f4g6h', signature: 'hmac', region: 'us-west-2', calls24h: 685_200 },
  { id: 'AK-2024-POL-01', institution: 'Polaris Sovereign Capital', name: 'Polaris Settlement', type: 'settlement', permissions: ['结算查询', '结算指令', '对账单', '回单'], rateLimit: 200, used: 84, ipWhitelist: ['52.18.0.0/16', '13.32.0.0/16'], status: 'active', createdAt: '2023-08-22', lastUsed: '2026-07-19 13:48:55', expiresAt: '2026-08-22', apiKey: 'zs_pol_2i4k6m8o0q2s4u6w8y0a', signature: 'rsa', region: 'ap-east-1 + me-south-1', calls24h: 124_800 },
  { id: 'AK-2024-MED-01', institution: 'Medved Capital Partners', name: 'Medved MM API', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '行情订阅'], rateLimit: 500, used: 218, ipWhitelist: ['52.28.0.0/16', '18.196.0.0/16'], status: 'active', createdAt: '2024-04-22', lastUsed: '2026-07-19 14:08:42', expiresAt: '2026-10-22', apiKey: 'zs_med_2c4e6g8i0k2m4o6q8s0u', signature: 'hmac', region: 'eu-central-1', calls24h: 942_000 },
  { id: 'AK-2025-VEG-01', institution: 'Vega Trading Group', name: 'Vega High-Freq', type: 'pb_trading', permissions: ['订单', '撤单', '查询'], rateLimit: 800, used: 612, ipWhitelist: ['34.218.0.0/16'], status: 'active', createdAt: '2024-01-15', lastUsed: '2026-07-19 14:32:08', expiresAt: '2026-07-25', apiKey: 'zs_veg_2w4y6a8c0e2g4i6k8m0o', signature: 'hmac', region: 'us-west-2', calls24h: 1_840_000 },
  { id: 'AK-2025-YON-01', institution: '永丰银行资管', name: '永丰 PB Trading', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '持仓', '成交', '白盒报告'], rateLimit: 400, used: 156, ipWhitelist: ['13.244.0.0/16', '52.84.0.0/16', '13.115.0.0/16'], status: 'rotating', createdAt: '2024-02-28', lastUsed: '2026-07-19 13:58:11', expiresAt: '2026-08-15', apiKey: 'zs_yon_2q4s6u8w0y2a4c6e8g0i', signature: 'rsa', region: 'ap-east-1', calls24h: 524_000 },
  { id: 'AK-2024-ORI-01', institution: 'Orion Global Macro', name: 'Orion Macro', type: 'pb_trading', permissions: ['订单', '撤单', '查询', '对账单'], rateLimit: 300, used: 124, ipWhitelist: ['34.218.0.0/16', '52.84.0.0/16'], status: 'active', createdAt: '2024-07-08', lastUsed: '2026-07-19 14:05:33', expiresAt: '2026-10-08', apiKey: 'zs_ori_2k4m6o8q0s2u4w6y8a0c', signature: 'hmac', region: 'us-west-2', calls24h: 286_400 },
];

`;

// 用占位符替换 mock data 段
const PLACEHOLDER = String.raw`const INSTITUTIONS: Institution[] = [];
const KYB_APPLICATIONS: KybApplication[] = [];
const PB_TRADES: PbTrade[] = [];
const CREDIT_LINES: CreditLine[] = [];
const BLOCK_TRADES: BlockTrade[] = [];
const LIQUIDITY_SHARES: LiquidityShare[] = [];
const INST_REPORTS: InstReport[] = [];
const HEDGE_INTERFACES: HedgeInterface[] = [];
const MM_PARTNERSHIPS: MmPartnership[] = [];
const API_CREDENTIALS: ApiCredential[] = [];`;

if (!original.includes(PLACEHOLDER)) {
  console.error('PLACEHOLDER not found');
  process.exit(1);
}

const newContent = original.replace(PLACEHOLDER, MOCK_DATA.trim());
fs.writeFileSync(filePath, newContent, 'utf8');

const bytes = Buffer.byteLength(newContent, 'utf8');
const lines = newContent.split('\n').length;
console.log('OK step2 written');
console.log('  Bytes:', bytes);
console.log('  Lines:', lines);
