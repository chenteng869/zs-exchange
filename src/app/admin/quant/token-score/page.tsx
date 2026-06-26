'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Divider,
  Select,
  Card,
  Table,
  Tooltip,
  Progress,
  Input,
} from 'antd';
import {
  StarOutlined,
  EyeOutlined,
  FileTextOutlined,
  BellOutlined,
  SearchOutlined,
  ThunderboltFilled,
  SafetyCertificateOutlined,
  RiseOutlined,
  FallOutlined,
  MinusCircleOutlined,
  WarningOutlined,
  TrophyOutlined,
  FireOutlined,
  DashboardOutlined,
  LineChartOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

/* ---------- 类型定义 ---------- */
interface TokenScore {
  id: number;
  symbol: string;
  name: string;
  logoUrl: string;
  overallScore: number;
  techScore: number;
  fundamentalScore: number;
  onchainScore: number;
  communityScore: number;
  aiopcScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  marketCap: number;
  volume24h: number;
  priceUsd: number;
  change24h: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  rating: string;
  lastUpdated: string;
  tags: string[];
}

/* ---------- Mock 数据 ---------- */
const mockData: TokenScore[] = [
  { id: 1, symbol: 'BTC', name: 'Bitcoin', logoUrl: '', overallScore: 95, techScore: 96, fundamentalScore: 98, onchainScore: 94, communityScore: 92, aiopcScore: 97, riskLevel: 'low', marketCap: 1320000000000, volume24h: 28500000000, priceUsd: 67234.50, change24h: 2.34, trend: 'bullish', rating: 'AAA', lastUpdated: '2026-06-23T08:30:00', tags: ['数字黄金', 'POW', '储备资产'] },
  { id: 2, symbol: 'ETH', name: 'Ethereum', logoUrl: '', overallScore: 91, techScore: 94, fundamentalScore: 90, onchainScore: 92, communityScore: 93, aiopcScore: 92, riskLevel: 'low', marketCap: 412000000000, volume24h: 15200000000, priceUsd: 3456.78, change24h: 1.56, trend: 'bullish', rating: 'AA', lastUpdated: '2026-06-23T08:25:00', tags: ['智能合约', 'POS', 'DeFi生态'] },
  { id: 3, symbol: 'SOL', name: 'Solana', logoUrl: '', overallScore: 84, techScore: 88, fundamentalScore: 78, onchainScore: 82, communityScore: 86, aiopcScore: 85, riskLevel: 'medium', marketCap: 78500000000, volume24h: 3200000000, priceUsd: 178.90, change24h: -1.23, trend: 'bearish', rating: 'A', lastUpdated: '2026-06-23T08:20:00', tags: ['高性能链', 'EVM兼容'] },
  { id: 4, symbol: 'BNB', name: 'BNB Chain', logoUrl: '', overallScore: 82, techScore: 80, fundamentalScore: 85, onchainScore: 79, communityScore: 84, aiopcScore: 83, riskLevel: 'medium', marketCap: 68200000000, volume24h: 1800000000, priceUsd: 587.32, change24h: 0.89, trend: 'neutral', rating: 'A', lastUpdated: '2026-06-23T08:15:00', tags: ['交易所公链', 'CEX联动'] },
  { id: 5, symbol: 'ADA', name: 'Cardano', logoUrl: '', overallScore: 76, techScore: 78, fundamentalScore: 74, onchainScore: 72, communityScore: 80, aiopcScore: 76, riskLevel: 'medium', marketCap: 35800000000, volume24h: 680000000, priceUsd: 0.892, change24h: -0.45, trend: 'neutral', rating: 'BBB', lastUpdated: '2026-06-23T08:10:00', tags: ['学术派', 'POS', '分层架构'] },
  { id: 6, symbol: 'DOT', name: 'Polkadot', logoUrl: '', overallScore: 74, techScore: 80, fundamentalScore: 70, onchainScore: 68, communityScore: 76, aiopcScore: 73, riskLevel: 'medium', marketCap: 24500000000, volume24h: 420000000, priceUsd: 7.23, change24h: 1.12, trend: 'bullish', rating: 'BBB', lastUpdated: '2026-06-23T08:05:00', tags: ['跨链', '平行链', 'Web3基金会'] },
  { id: 7, symbol: 'MATIC', name: 'Polygon', logoUrl: '', overallScore: 78, techScore: 82, fundamentalScore: 75, onchainScore: 77, communityScore: 78, aiopcScore: 79, riskLevel: 'medium', marketCap: 18900000000, volume24h: 350000000, priceUsd: 0.685, change24h: 2.01, trend: 'bullish', rating: 'A-', lastUpdated: '2026-06-23T08:00:00', tags: ['Layer2', 'ZK技术'] },
  { id: 8, symbol: 'LINK', name: 'Chainlink', logoUrl: '', overallScore: 80, techScore: 85, fundamentalScore: 78, onchainScore: 74, communityScore: 80, aiopcScore: 81, riskLevel: 'medium', marketCap: 15600000000, volume24h: 280000000, priceUsd: 14.67, change24h: -0.78, trend: 'neutral', rating: 'A', lastUpdated: '2026-06-23T07:55:00', tags: ['预言机', '跨链数据'] },
  { id: 9, symbol: 'AVAX', name: 'Avalanche', logoUrl: '', overallScore: 72, techScore: 76, fundamentalScore: 68, onchainScore: 70, communityScore: 74, aiopcScore: 71, riskLevel: 'medium', marketCap: 12800000000, volume24h: 210000000, priceUsd: 38.45, change24h: -2.34, trend: 'bearish', rating: 'BBB', lastUpdated: '2026-06-23T07:50:00', tags: ['高速共识', '子网'] },
  { id: 10, symbol: 'UNI', name: 'Uniswap', logoUrl: '', overallScore: 70, techScore: 74, fundamentalScore: 66, onchainScore: 68, communityScore: 72, aiopcScore: 69, riskLevel: 'medium', marketCap: 9800000000, volume24h: 450000000, priceUsd: 8.92, change24h: 3.21, trend: 'bullish', rating: 'BB+', lastUpdated: '2026-06-23T07:45:00', tags: ['DEX龙头', 'V4升级'] },
  { id: 11, symbol: 'ATOM', name: 'Cosmos', logoUrl: '', overallScore: 68, techScore: 72, fundamentalScore: 64, onchainScore: 65, communityScore: 70, aiopcScore: 67, riskLevel: 'high', marketCap: 7200000000, volume24h: 180000000, priceUsd: 9.87, change24h: -1.56, trend: 'bearish', rating: 'BB', lastUpdated: '2026-06-23T07:40:00', tags: ['IBC协议', '应用链枢纽'] },
  { id: 12, symbol: 'FIL', name: 'Filecoin', logoUrl: '', overallScore: 62, techScore: 66, fundamentalScore: 58, onchainScore: 60, communityScore: 64, aiopcScore: 61, riskLevel: 'high', marketCap: 4800000000, volume24h: 120000000, priceUsd: 5.43, change24h: -3.45, trend: 'bearish', rating: 'B+', lastUpdated: '2026-06-23T07:35:00', tags: ['去中心化存储', 'FVM虚拟机'] },
];

/* ---------- 辅助函数 ---------- */
const formatMarketCap = (val: number) => {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
};

const getRatingColor = (rating: string) => {
  const map: Record<string, string> = {
    AAA: '#16A34A', AA: '#22C55E', A: '#84CC16', 'A-': '#EAB308',
    BBB: '#F59E0B', 'BB+': '#F97316', BB: '#EF4444', B: '#DC2626',
    CCC: '#991B1B', CC: '#7F1D1D', C: '#450A0A',
  };
  return map[rating] || '#9CA3AF';
};

const getRiskColor = (level: string) => {
  const map: Record<string, string> = {
    low: 'green', medium: 'orange', high: 'red', extreme: '#DC2626',
  };
  return map[level] || 'default';
};

const getRiskLabel = (level: string) => {
  const map: Record<string, string> = {
    low: '低风险', medium: '中风险', high: '高风险', extreme: '极高风险',
  };
  return map[level] || level;
};

const getTrendIcon = (trend: string) => {
  if (trend === 'bullish') return <RiseOutlined style={{ color: '#16A34A' }} />;
  if (trend === 'bearish') return <FallOutlined style={{ color: '#DC2626' }} />;
  return <MinusCircleOutlined style={{ color: '#9CA3AF' }} />;
};

const ScoreRing = ({ score, size = 48 }: { score: number; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? '#16A34A' : score >= 70 ? '#F59E0B' : score >= 50 ? '#F97316' : '#EF4444';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" fontSize={size > 48 ? 13 : 10} fontWeight={700} fill={color}>{score}</text>
    </svg>
  );
};

/* ---------- 页面组件 ---------- */
export default function TokenScorePage() {
  const [filterRating, setFilterRating] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string>('');
  const [filterTrend, setFilterTrend] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [detailRecord, setDetailRecord] = useState<TokenScore | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: scores = mockData, isLoading } = useQuery({
    queryKey: ['token-scores'],
    queryFn: () => Promise.resolve(mockData),
    staleTime: 60_000,
  });

  const filteredData = scores.filter((item) => {
    if (filterRating && item.rating !== filterRating) return false;
    if (filterRisk && item.riskLevel !== filterRisk) return false;
    if (filterTrend && item.trend !== filterTrend) return false;
    if (searchText && !item.symbol.toLowerCase().includes(searchText.toLowerCase()) &&
      !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const aaaCount = scores.filter(s => s.rating.startsWith('AAA')).length + scores.filter(s => s.rating.startsWith('AA')).length;
  const avgAiopc = (scores.reduce((sum, s) => sum + s.aiopcScore, 0) / scores.length).toFixed(1);
  const highRiskCount = scores.filter(s => s.riskLevel === 'high' || s.riskLevel === 'extreme').length;

  /* ---- 表格列定义 ---- */
  const columns = [
    {
      title: '代币',
      key: 'token',
      width: 160,
      render: (_: any, record: TokenScore) => (
        <Space>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0B90B15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#F0B90B', fontSize: 12 }}>
            {record.symbol.slice(0, 2)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ color: '#9CA3AF', fontSize: 12 }}>{record.symbol}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      width: 70,
      render: (rating: string) => (
        <Tag color={getRatingColor(rating)} style={{ fontWeight: 700, color: '#fff' }}>{rating}</Tag>
      ),
    },
    {
      title: '总分',
      dataIndex: 'overallScore',
      key: 'overallScore',
      width: 80,
      sorter: (a: TokenScore, b: TokenScore) => a.overallScore - b.overallScore,
      render: (score: number) => <ScoreRing score={score} />,
    },
    {
      title: '技术面',
      dataIndex: 'techScore',
      key: 'techScore',
      width: 70,
      render: (s: number) => <Progress percent={s} size="small" showInfo={false} strokeColor={s >= 80 ? '#1677FF' : '#F59E0B'} />,
    },
    {
      title: '基本面',
      dataIndex: 'fundamentalScore',
      key: 'fundamentalScore',
      width: 70,
      render: (s: number) => <Progress percent={s} size="small" showInfo={false} strokeColor={s >= 80 ? '#16A34A' : '#F59E0B'} />,
    },
    {
      title: '链上数据',
      dataIndex: 'onchainScore',
      key: 'onchainScore',
      width: 80,
      render: (s: number) => <Progress percent={s} size="small" showInfo={false} strokeColor={s >= 80 ? '#7C3AED' : '#F59E0B'} />,
    },
    {
      title: '社区',
      dataIndex: 'communityScore',
      key: 'communityScore',
      width: 70,
      render: (s: number) => <Progress percent={s} size="small" showInfo={false} strokeColor={s >= 80 ? '#F59E0B' : '#9CA3AF'} />,
    },
    {
      title: 'AIOPC',
      dataIndex: 'aiopcScore',
      key: 'aiopcScore',
      width: 80,
      sorter: (a: TokenScore, b: TokenScore) => a.aiopcScore - b.aiopcScore,
      render: (s: number) => (
        <Tooltip title="AIOPC Super-Engine 综合评分">
          <span style={{ fontWeight: 700, color: '#F0B90B' }}>{s}</span>
        </Tooltip>
      ),
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 80,
      render: (level: string) => (
        <Tag color={getRiskColor(level)}>{getRiskLabel(level)}</Tag>
      ),
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 110,
      sorter: (a: TokenScore, b: TokenScore) => a.marketCap - b.marketCap,
      render: (v: number) => formatMarketCap(v),
    },
    {
      title: '24h涨跌',
      dataIndex: 'change24h',
      key: 'change24h',
      width: 90,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 70,
      render: (t: string) => getTrendIcon(t),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 160,
      render: (tags: string[]) => (
        <Space size={[4, 4]} wrap>
          {tags.map(t => <Tag key={t} color="blue">{t}</Tag>)}
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 140,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
    },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看', icon: <EyeOutlined />, onClick: (r: TokenScore) => { setDetailRecord(r); setModalOpen(true); } },
    { key: 'report', label: '详细报告', icon: <FileTextOutlined />, onClick: (r: TokenScore) => message.info(`正在生成 ${r.symbol} 的AIOPC详细报告...`) },
    { key: 'warning', label: '预警设置', icon: <BellOutlined />, onClick: (r: TokenScore) => message.success(`已为 ${r.symbol} 配置预警规则`) },
  ];

  return (
    <AdminLayout
      title="代币综合评分系统"
      subtitle="AI驱动的数字资产多维评级 · 技术面/基本面/链上数据/社区活跃度 · Powered by AIOPC Super-Engine"
    >
      {/* DataCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DataCard title="评分币种总数" value={scores.length} icon={<StarOutlined />} color="#1677FF" suffix="个" />
        <DataCard title="AA级以上数量" value={aaaCount} icon={<TrophyOutlined />} color="#16A34A" suffix="个" />
        <DataCard title="平均AIOPC分" value={avgAiopc} icon={<ThunderboltFilled />} color="#F0B90B" suffix="分" />
        <DataCard title="高风险预警数" value={highRiskCount} icon={<WarningOutlined />} color="#EF4444" suffix="个" />
        <DataCard title="今日新增" value={3} icon={<FireOutlined />} color="#7C3AED" suffix="个" />
      </div>

      {/* 筛选栏 */}
      <Card size="small" className="mb-4" style={{ borderRadius: 12 }}>
        <Space wrap size="middle">
          <Select placeholder="评级筛选" allowClear style={{ width: 120 }} value={filterRating || undefined} onChange={setFilterRating}>
            {['AAA', 'AA', 'A', 'BBB', 'BB', 'B'].map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
          </Select>
          <Select placeholder="风险等级" allowClear style={{ width: 120 }} value={filterRisk || undefined} onChange={setFilterRisk}>
            <Select.Option value="low">低风险</Select.Option>
            <Select.Option value="medium">中风险</Select.Option>
            <Select.Option value="high">高风险</Select.Option>
            <Select.Option value="extreme">极高风险</Select.Option>
          </Select>
          <Select placeholder="趋势筛选" allowClear style={{ width: 120 }} value={filterTrend || undefined} onChange={setFilterTrend}>
            <Select.Option value="bullish">看涨</Select.Option>
            <Select.Option value="bearish">看跌</Select.Option>
            <Select.Option value="neutral">中性</Select.Option>
          </Select>
          <Input.Search placeholder="搜索代币名称/符号" allowClear style={{ width: 220 }}
            onSearch={(v) => setSearchText(v)} enterButton={<SearchOutlined />} />
        </Space>
      </Card>

      {/* 数据表格 */}
      <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="id" loading={isLoading} actions={actions}
        pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }} />

      {/* 详情Modal */}
      <Modal title={`${detailRecord?.symbol} - AIOPC综合评估详情`} open={modalOpen} onCancel={() => setModalOpen(false)}
        footer={null} width={860}>
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="代币名称">{detailRecord.name}</Descriptions.Item>
              <Descriptions.Item label="交易符号">{detailRecord.symbol}</Descriptions.Item>
              <Descriptions.Item label="综合评级">
                <Tag color={getRatingColor(detailRecord.rating)} style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{detailRecord.rating}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="风险等级">
                <Tag color={getRiskColor(detailRecord.riskLevel)}>{getRiskLabel(detailRecord.riskLevel)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前价格">${detailRecord.priceUsd.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="24h涨跌">
                <span style={{ color: detailRecord.change24h >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {detailRecord.change24h >= 0 ? '+' : ''}{detailRecord.change24h.toFixed(2)}%
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Descriptions bordered column={2} size="small" title="市场数据" className="mb-4">
              <Descriptions.Item label="市值">{formatMarketCap(detailRecord.marketCap)}</Descriptions.Item>
              <Descriptions.Item label="24h成交量">${(detailRecord.volume24h / 1e9).toFixed(2)}B</Descriptions.Item>
              <Descriptions.Item label="趋势方向">
                <Space>{getTrendIcon(detailRecord.trend)}<span>{detailRecord.trend === 'bullish' ? '看涨' : detailRecord.trend === 'bearish' ? '看跌' : '中性'}</span></Space>
              </Descriptions.Item>
              <Descriptions.Item label="最后更新">{dayjs(detailRecord.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Card title={<Space><ThunderboltFilled style={{ color: '#F0B90B' }} /><span style={{ color: '#F0B90B', fontWeight: 700 }}>AIOPC 综合评估</span></Space>}
              size="small" className="mb-4" style={{ borderLeft: `4px solid #F0B90B` }}>
              <div className="space-y-3">
                {[
                  { label: '技术面', score: detailRecord.techScore, color: '#1677FF' },
                  { label: '基本面', score: detailRecord.fundamentalScore, color: '#16A34A' },
                  { label: '链上数据', score: detailRecord.onchainScore, color: '#7C3AED' },
                  { label: '社区活跃度', score: detailRecord.communityScore, color: '#F59E0B' },
                  { label: 'AI融合评估', score: detailRecord.aiopcScore, color: '#F0B90B' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1"><span style={{ fontSize: 13 }}>{item.label}</span><span style={{ fontWeight: 600, color: item.color }}>{item.score}/100</span></div>
                    <Progress percent={item.score} size="small" showInfo={false} strokeColor={item.color} trailColor="#F3F4F6" />
                  </div>
                ))}
                <Divider style={{ margin: '12px 0' }} />
                <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  <strong style={{ color: '#D97706' }}>💡 AI建议：</strong>
                  {detailRecord.overallScore >= 85 ? ' 该资产综合表现优异，适合作为核心持仓配置。' :
                   detailRecord.overallScore >= 70 ? ' 该资产具备一定投资价值，建议关注关键指标变化。' :
                   ' 该资产存在较高不确定性，建议谨慎配置或观望。'}
                </div>
                <div style={{ background: '#FEE2E2', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                  <strong style={{ color: '#DC2626' }}>⚠ 风险提示：</strong>
                  {detailRecord.riskLevel === 'extreme' ? ' 极高风险！该资产波动剧烈，可能面临归零风险，仅限专业投资者参与。' :
                   detailRecord.riskLevel === 'high' ? ' 高风险资产，请严格控制仓位比例（建议不超过总资产的5%）。' :
                   detailRecord.riskLevel === 'medium' ? ' 中等风险，建议分散投资并设置止损策略。' :
                   ' 风险可控，但仍需关注宏观环境与监管动态。'}
                </div>
              </div>
            </Card>

            <div style={{ marginBottom: 12 }}>
              <strong>📈 评分趋势描述：</strong>
              <p style={{ color: '#6B7280', marginTop: 4, lineHeight: 1.8 }}>
                近30日内，{detailRecord.symbol}的综合评分呈现{detailRecord.change24h > 0 ? '上升' : '下降'}趋势。
                技术面指标{detailRecord.techScore >= 80 ? '稳健向好' : '有待改善'}，
                基本面{detailRecord.fundamentalScore >= 80 ? '支撑有力' : '承压明显'}。
                AIOPC引擎预测未来7天置信区间为±{(100 - detailRecord.aiopcScore) / 10}%。
              </p>
            </div>

            <Table size="small" dataSource={[
              { metric: '活跃地址数', value: `${Math.floor(Math.random() * 500000 + 50000).toLocaleString()}`, status: '正常' },
              { metric: '大额转账次数', value: `${Math.floor(Math.random() * 2000 + 100)}`, status: detailRecord.riskLevel !== 'extreme' ? '正常' : '异常' },
              { metric: '交易所净流入', value: `${(Math.random() * 100 - 50).toFixed(2)}M USD`, status: Math.random() > 0.3 ? '正常' : '注意' },
              { metric: '新增持币地址', value: `+${Math.floor(Math.random() * 10000 + 500)}`, status: '正常' },
              { metric: 'Gas费用中位数', value: `${(Math.random() * 50 + 1).toFixed(4)} GWEI`, status: '正常' },
            ]} pagination={false} rowKey="metric" columns={[
              { title: '链上指标', dataIndex: 'metric', key: 'm' },
              { title: '数值', dataIndex: 'value', key: 'v' },
              { title: '状态', dataIndex: 'status', key: 's', render: (s: string) => <Tag color={s === '正常' ? 'green' : s === '注意' ? 'orange' : 'red'}>{s}</Tag> },
            ]} title={() => '链上数据摘要'} />

            <Table size="small" dataSource={[
              { time: dayjs().subtract(2, 'hour').format('MM-DD HH:mm'), action: '自动评分更新', operator: 'AIOPC Engine' },
              { time: dayjs().subtract(5, 'hour').format('MM-DD HH:mm'), action: '风险等级调整', operator: '风控系统' },
              { time: dayjs().subtract(1, 'day').format('MM-DD HH:mm'), action: '链上数据同步', operator: '数据采集器' },
            ]} pagination={false} rowKey="time" columns={[
              { title: '时间', dataIndex: 'time', key: 't' },
              { title: '操作', dataIndex: 'action', key: 'a' },
              { title: '执行者', dataIndex: 'operator', key: 'o' },
            ]} title={() => '操作日志'} style={{ marginTop: 16 }} />
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
