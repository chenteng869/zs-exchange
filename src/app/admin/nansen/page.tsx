'use client';

import {
  Tag,
  Badge,
  Button,
  Space,
  Row,
  Col,
  Typography,
} from 'antd';
import {
  RadarChartOutlined,
  UserOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FundOutlined,
  EyeOutlined,
  WarningOutlined,
  AlertOutlined,
  ApiOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

interface WalletIntel {
  id: string;
  address: string;
  label: string;
  balanceChange: number;
  recentActivity: string;
  riskLevel: string;
  netWorth: number;
  activeDays: number;
}

const mockWallets: WalletIntel[] = [
  { id: 'WL-001', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f8a8F2', label: '巨鲸 #1 — BTC囤币大户', balanceChange: 12500000, recentActivity: '从 Binance 提取 500 BTC 至冷钱包', riskLevel: 'low', netWorth: 285000000, activeDays: 28 },
  { id: 'WL-002', address: '0x8B5cF91dE88cB4A5e2a5C8f3D1B7e6A0F9c91dE', label: '机构 A — Jump Crypto 关联', balanceChange: 8200000, recentActivity: '大量买入 ETH 看涨期权', riskLevel: 'low', netWorth: 580000000, activeDays: 30 },
  { id: 'WL-003', address: '0x3F2aB7c1dE45f89A2bC6d78E01f34gH56iJk78lM', label: '对冲基金 — 三箭资本关联地址', balanceChange: 15800000, recentActivity: '跨链桥转入 Arbitrum $15M USDC', riskLevel: 'medium', netWorth: 425000000, activeDays: 25 },
  { id: 'WL-004', address: '0x9c8E42fA0b1C2d3E4f5A6b7C8d9E0f1G2h3I4j5K', label: '巨鲸 #4 — SOL 重仓玩家', balanceChange: 5800000, recentActivity: '出售 200K SOL 换取 USDT', riskLevel: 'medium', netWorth: 158000000, activeDays: 18 },
  { id: 'WL-005', address: '0x6a1DE5b80C1d2E3f4A5b6C7d8E9f0G1h2I3j4K5l6', label: '聪明钱 #5 — DeFi 收益猎手', balanceChange: 4200000, recentActivity: '在 Aave 存入 $8M 提供流动性', riskLevel: 'low', netWorth: 92000000, activeDays: 30 },
  { id: 'WL-006', address: '0xF1a2C9d30E1f2A3b4C5d6E7f8G9h0I1j2K3l4M5n6', label: 'NFT 巨鲸 — BAYC 持有者', balanceChange: -2800000, recentActivity: '批量购入 50 个 Bored Apes NFT', riskLevel: 'high', netWorth: 125000000, activeDays: 22 },
  { id: 'WL-007', address: '0xB3b4D8e50F1g2H3i4J5k6L7m8N9o0P1q2R3s4T5u6', label: 'CEX 钱包 — OKX 热钱包', balanceChange: 35000000, recentActivity: '用户大额提币高峰期，净流出 $35M', riskLevel: 'low', netWorth: 1200000000, activeDays: 30 },
  { id: 'WL-008', address: '0xC5c6E0f70A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6', label: '套利机器人 — MEV Bot', balanceChange: 1850000, recentActivity: '执行三明治攻击获利 $1.85M', riskLevel: 'high', netWorth: 45000000, activeDays: 30 },
  { id: 'WL-009', address: '0xD7d8F1a90B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7', label: 'VC 机构 — a16z 投资组合', balanceChange: 22000000, recentActivity: '向 Layer2 项目注资 $22M', riskLevel: 'low', netWorth: 850000000, activeDays: 20 },
  { id: 'WL-010', address: '0xE9eAB2cb10C2d3E4f5G6h7I8j9K0l1M2n3O4p5Q6r7', label: '稳定币巨鲸 — Tether 大户', balanceChange: -15000000, recentActivity: '赎回 1500万 USDT 至银行账户', riskLevel: 'low', netWorth: 320000000, activeDays: 15 },
  { id: 'WL-011', address: '0xFbFcC3dd20D1e2F3g4H5i6J7k8L9m0N1o2P3q4R5s6', label: '新晋鲸鱼 — 近期暴富地址', balanceChange: 8900000, recentActivity: 'MEME 币 100x 收益后逐步止盈', riskLevel: 'high', netWorth: 68000000, activeDays: 12 },
  { id: 'WL-012', address: '0x1d2eD4e50F1g2H3i4J5k6L7m8N9o0P1q2R3s4T5u6', label: 'DAO 国库 — Uniswap 治理金库', balanceChange: 5200000, recentActivity: '接收协议手续费收入 $5.2M', riskLevel: 'low', netWorth: 480000000, activeDays: 30 },
];

const riskConfig: Record<string, { color: any; label: string }> = {
  low: { color: 'success', label: '低风险' },
  medium: { color: 'warning', label: '中风险' },
  high: { color: 'error', label: '高风险' },
};

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function NansenPage() {
  const actions: any[] = [
    {
      key: 'track',
      label: '追踪',
      icon: <EyeOutlined />,
    },
    {
      key: 'alert',
      label: '设预警',
      icon: <AlertOutlined />,
    },
  ];

  const columns = [
    {
      title: '钱包地址',
      dataIndex: 'address',
      key: 'walletAddr',
      render: (t: string) => (
        <span className="font-mono text-xs text-blue-600 cursor-pointer hover:underline">
          {truncateAddress(t)}
        </span>
      ),
    },
    {
      title: '标签',
      dataIndex: 'label',
      key: 'walletLabel',
      width: 240,
      render: (t: string) => (
        <Text ellipsis style={{ maxWidth: 220 }} className="font-medium">{t}</Text>
      ),
    },
    {
      title: '余额变化',
      dataIndex: 'balanceChange',
      key: 'balanceDelta',
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}${(v / 1e6).toFixed(2)}M
        </span>
      ),
    },
    {
      title: '最近活动',
      dataIndex: 'recentActivity',
      key: 'recentAct',
      width: 260,
      ellipsis: true,
      render: (t: string) => (
        <Text type="secondary" className="text-sm" ellipsis style={{ maxWidth: 240 }}>{t}</Text>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (s: string) => {
        const cfg = riskConfig[s];
        return cfg ? <Badge status={cfg.color} text={cfg.label} /> : <Badge status="default" text={s} />;
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <RadarChartOutlined /> Nansen链上情报分析平台
            </h1>
            <p className="text-gray-500 mt-1">智能钱包标签 · 巨鲸追踪 · 资金流向 · 链上行为画像</p>
          </div>
          <Space>
            <Button icon={<WarningOutlined />}>风险扫描</Button>
            <Button type="primary" icon={<ApiOutlined />}>添加监控</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="监控钱包数"
              value={3856}
              suffix="个"
              icon={<UserOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+128 本周"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日Alerts"
              value={142}
              suffix="条"
              icon={<ThunderboltOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+23%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="巨鲸活跃"
              value={28}
              suffix="只"
              icon={<RiseOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+5 较昨日"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="资金净流入"
              value="+125.5"
              suffix="M USDT"
              icon={<FundOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+$32M"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="覆盖率"
              value="94.2"
              suffix="%"
              icon={<SearchOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+1.5%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockWallets}
          rowKey="id"
          title="智能钱包监控列表"
          searchPlaceholder="搜索地址或标签..."
          addButtonText="添加监控地址"
          actions={actions}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个监控地址` }}
        />
      </div>
    </AdminLayout>
  );
}
