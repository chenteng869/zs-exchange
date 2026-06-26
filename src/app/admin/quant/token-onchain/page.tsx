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
  Tooltip,
  Progress,
} from 'antd';
import {
  BlockOutlined,
  EyeOutlined,
  GlobalOutlined,
  WalletOutlined,
  SwapOutlined,
  ThunderboltFilled,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  FireOutlined,
  TeamOutlined,
  DatabaseOutlined,
  AlertOutlined,
  ApiOutlined,
  BarChartOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

/* ---------- 类型定义 ---------- */
interface OnchainMetric {
  id: number;
  symbol: string;
  chain: string;
  activeAddresses: number;
  txCount: number;
  tps: number;
  tvl: number;
  whaleTxCount: number;
  exchangeNetFlow: number;
  holderDistribution: { top10pct: string; top1pct: string };
  burnRate: number;
  stakingRatio: number;
  nulUpdates: string;
  dataTimestamp: string;
}

/* ---------- Mock 数据 ---------- */
const mockData: OnchainMetric[] = [
  { id: 1, symbol: 'BTC', chain: 'Bitcoin', activeAddresses: 892340, txCount: 285600, tps: 7.2, tvl: 52000000000, whaleTxCount: 1245, exchangeNetFlow: 320000000, holderDistribution: { top10pct: '5.2%', top1pct: '1.8%' }, burnRate: 0.0, stakingRatio: 0.0, nulUpdates: '2026-06-23T08:30:00', dataTimestamp: '2026-06-23T08:30:00' },
  { id: 2, symbol: 'ETH', chain: 'Ethereum', activeAddresses: 456780, txCount: 1123000, tps: 15.8, tvl: 38500000000, whaleTxCount: 3560, exchangeNetFlow: -185000000, holderDistribution: { top10pct: '12.3%', top1pct: '3.1%' }, burnRate: 0.52, stakingRatio: 28.5, nulUpdates: '2026-06-23T08:25:00', dataTimestamp: '2026-06-23T08:25:00' },
  { id: 3, symbol: 'SOL', chain: 'Solana', activeAddresses: 678900, txCount: 28900000, tps: 6500, tvl: 5200000000, whaleTxCount: 8920, exchangeNetFlow: 89000000, holderDistribution: { top10pct: '18.5%', top1pct: '5.2%' }, burnRate: 0.0, stakingRatio: 67.3, nulUpdates: '2026-06-23T08:20:00', dataTimestamp: '2026-06-23T08:20:00' },
  { id: 4, symbol: 'BNB', chain: 'BSC', activeAddresses: 345600, txCount: 4560000, tps: 160, tvl: 4800000000, whaleTxCount: 2130, exchangeNetFlow: 45000000, holderDistribution: { top10pct: '22.1%', top1pct: '7.8%' }, burnRate: 0.78, stakingRatio: 0.0, nulUpdates: '2026-06-23T08:15:00', dataTimestamp: '2026-06-23T08:15:00' },
  { id: 5, symbol: 'ADA', chain: 'Cardano', activeAddresses: 123400, txCount: 89000, tps: 0.8, tvl: 420000000, whaleTxCount: 340, exchangeNetFlow: -12000000, holderDistribution: { top10pct: '28.3%', top1pct: '9.5%' }, burnRate: 0.0, stakingRatio: 72.1, nulUpdates: '2026-06-23T08:10:00', dataTimestamp: '2026-06-23T08:10:00' },
  { id: 6, symbol: 'DOT', chain: 'Polkadot', activeAddresses: 98700, txCount: 156000, tps: 0.5, tvl: 380000000, whaleTxCount: 280, exchangeNetFlow: -8500000, holderDistribution: { top10pct: '31.2%', top1pct: '11.2%' }, burnRate: 0.0, stakingRatio: 54.8, nulUpdates: '2026-06-23T08:05:00', dataTimestamp: '2026-06-23T08:05:00' },
  { id: 7, symbol: 'MATIC', chain: 'Polygon', activeAddresses: 567800, txCount: 3450000, tps: 120, tvl: 1200000000, whaleTxCount: 1890, exchangeNetFlow: 23000000, holderDistribution: { top10pct: '19.8%', top1pct: '6.3%' }, burnRate: 0.0, stakingRatio: 0.0, nulUpdates: '2026-06-23T08:00:00', dataTimestamp: '2026-06-23T08:00:00' },
  { id: 8, symbol: 'LINK', chain: 'Ethereum', activeAddresses: 234500, txCount: 178000, tps: 2.1, tvl: 560000000, whaleTxCount: 560, exchangeNetFlow: -5600000, holderDistribution: { top10pct: '42.5%', top1pct: '15.8%' }, burnRate: 0.0, stakingRatio: 0.0, nulUpdates: '2026-06-23T07:55:00', dataTimestamp: '2026-06-23T07:55:00' },
  { id: 9, symbol: 'AVAX', chain: 'Avalanche', activeAddresses: 189000, txCount: 678000, tps: 25, tvl: 720000000, whaleTxCount: 720, exchangeNetFlow: 15000000, holderDistribution: { top10pct: '25.6%', top1pct: '8.9%' }, burnRate: 0.0, stakingRatio: 58.2, nulUpdates: '2026-06-23T07:50:00', dataTimestamp: '2026-06-23T07:50:00' },
  { id: 10, symbol: 'ATOM', chain: 'Cosmos', activeAddresses: 89000, txCount: 123000, tps: 0.4, tvl: 280000000, whaleTxCount: 210, exchangeNetFlow: -9800000, holderDistribution: { top10pct: '35.7%', top1pct: '13.4%' }, burnRate: 0.0, stakingRatio: 63.5, nulUpdates: '2026-06-23T07:45:00', dataTimestamp: '2026-06-23T07:45:00' },
];

/* ---------- 辅助函数 ---------- */
const formatNumber = (n: number): string => {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
};

const formatTvl = (v: number): string => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
};

const formatFlow = (v: number): string => {
  const prefix = v >= 0 ? '+' : '';
  if (Math.abs(v) >= 1e9) return `${prefix}$${(v / 1e9).toFixed(2)}B`;
  if (Math.abs(v) >= 1e6) return `${prefix}$${(v / 1e6).toFixed(1)}M`;
  return `${prefix}$${(v / 1e3).toFixed(0)}K`;
};

const getChainColor = (c: string) => ({ Bitcoin: '#F7931A', Ethereum: '#627EEA', Solana: '#00FFA3', BSC: '#F0B90B', Cardano: '#0033AD', Polkadot: '#E6007A', Polygon: '#8247E5', Avalanche: '#E84142', Cosmos: '#2E3148' })[c] || '#1677FF';

const totalActiveAddr = mockData.reduce((s, m) => s + m.activeAddresses, 0);
const totalTvl = mockData.reduce((s, m) => s + m.tvl, 0);
const whaleAnomaly = mockData.filter(m => m.whaleTxCount > 2000).length;

/* ---------- 页面组件 ---------- */
export default function TokenOnchainPage() {
  const [filterChain, setFilterChain] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [detailRecord, setDetailRecord] = useState<OnchainMetric | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: metrics = mockData, isLoading } = useQuery({
    queryKey: ['onchain-metrics'],
    queryFn: () => Promise.resolve(mockData),
    staleTime: 60_000,
  });

  let filteredData = metrics.filter((item) => {
    if (filterChain && item.chain !== filterChain) return false;
    return true;
  });

  if (sortBy === 'activeAddresses') filteredData = [...filteredData].sort((a, b) => b.activeAddresses - a.activeAddresses);
  if (sortBy === 'tvl') filteredData = [...filteredData].sort((a, b) => b.tvl - a.tvl);
  if (sortBy === 'txCount') filteredData = [...filteredData].sort((a, b) => b.txCount - a.txCount);
  if (sortBy === 'whaleTxCount') filteredData = [...filteredData].sort((a, b) => b.whaleTxCount - a.whaleTxCount);

  const chainCoverage = new Set(metrics.map(m => m.chain)).size;

  const columns = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 90,
      render: (sym: string) => (
        <Space><BlockOutlined style={{ color: '#7C3AED' }} /><span style={{ fontWeight: 700 }}>{sym}</span></Space>
      ),
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      width: 110,
      render: (c: string) => <Tag color={getChainColor(c)} style={{ color: c === 'Solana' || c === 'BSC' ? '#000' : '#fff' }}>{c}</Tag>,
    },
    {
      title: '日活地址',
      dataIndex: 'activeAddresses',
      key: 'activeAddresses',
      width: 100,
      sorter: (a: OnchainMetric, b: OnchainMetric) => a.activeAddresses - b.activeAddresses,
      render: (n: number) => formatNumber(n),
    },
    {
      title: '交易量(24h)',
      dataIndex: 'txCount',
      key: 'txCount',
      width: 105,
      sorter: (a: OnchainMetric, b: OnchainMetric) => a.txCount - b.txCount,
      render: (n: number) => formatNumber(n),
    },
    {
      title: 'TPS',
      dataIndex: 'tps',
      key: 'tps',
      width: 70,
      sorter: (a: OnchainMetric, b: OnchainMetric) => a.tps - b.tps,
      render: (t: number) => <span style={{ fontWeight: 600, color: t > 100 ? '#16A34A' : t > 10 ? '#F59E0B' : '#9CA3AF' }}>{t.toFixed(1)}</span>,
    },
    {
      title: 'TVL',
      dataIndex: 'tvl',
      key: 'tvl',
      width: 100,
      sorter: (a: OnchainMetric, b: OnchainMetric) => a.tvl - b.tvl,
      render: (v: number) => <span style={{ fontWeight: 600 }}>{formatTvl(v)}</span>,
    },
    {
      title: '巨鲸交易',
      dataIndex: 'whaleTxCount',
      key: 'whaleTxCount',
      width: 85,
      render: (n: number) => (
        <Tooltip title="单笔>$100K的大额转账">
          <Tag color={n > 2000 ? 'red' : n > 500 ? 'orange' : 'default'}>{n}</Tag>
        </Tooltip>
      ),
    },
    {
      title: '交易所净流向',
      dataIndex: 'exchangeNetFlow',
      key: 'exchangeNetFlow',
      width: 115,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#16A34A' : '#DC2626', fontWeight: 600, fontSize: 12 }}>{formatFlow(v)}</span>
      ),
    },
    {
      title: '持仓集中度',
      key: 'holderDist',
      width: 100,
      render: (_: any, r: OnchainMetric) => (
        <Tooltip title={`Top1%: ${r.holderDistribution.top1pct}`}>
          <Progress percent={parseFloat(r.holderDistribution.top10pct)} size="small" showInfo={false}
            strokeColor={parseFloat(r.holderDistribution.top10pct) > 30 ? '#EF4444' : parseFloat(r.holderDistribution.top10pct) > 20 ? '#F59E0B' : '#16A34A'} />
        </Tooltip>
      ),
    },
    {
      title: '销毁率',
      dataIndex: 'burnRate',
      key: 'burnRate',
      width: 75,
      render: (r: number) => r > 0 ? <span style={{ color: '#16A34A' }}>{(r * 100).toFixed(1)}%</span> : <span style={{ color: '#9CA3AF' }}>-</span>,
    },
    {
      title: '质押率',
      dataIndex: 'stakingRatio',
      key: 'stakingRatio',
      width: 75,
      render: (r: number) => r > 0 ? <span>{r.toFixed(1)}%</span> : <span style={{ color: '#9CA3AF' }}>-</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'dataTimestamp',
      key: 'dataTimestamp',
      width: 140,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '操作', key: 'actions', width: 100 },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (r: OnchainMetric) => { setDetailRecord(r); setModalOpen(true); } },
  ];

  return (
    <AdminLayout
      title="链上数据分析中心"
      subtitle="多链数据聚合 · 地址追踪/巨鲸监控/资金流向 · AIOPC链上大脑"
    >
      {/* DataCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DataCard title="监控代币数" value={metrics.length} icon={<DatabaseOutlined />} color="#1677FF" suffix="个" />
        <DataCard title="日活地址总和" value={formatNumber(totalActiveAddr)} icon={<TeamOutlined />} color="#16A34A" suffix="" />
        <DataCard title="TVL总额" value={formatTvl(totalTvl)} icon={<WalletOutlined />} color="#7C3AED" suffix="" />
        <DataCard title="巨鲸异动" value={whaleAnomaly} icon={<AlertOutlined />} color="#EF4444" suffix="个" />
        <DataCard title="链覆盖率" value={`${chainCoverage}条`} icon={<GlobalOutlined />} color="#F0B90B" suffix="" />
      </div>

      {/* 筛选栏 */}
      <Card size="small" className="mb-4" style={{ borderRadius: 12 }}>
        <Space wrap size="middle">
          <Select placeholder="区块链筛选" allowClear style={{ width: 150 }} value={filterChain || undefined} onChange={setFilterChain}>
            {[...new Set(metrics.map(m => m.chain))].map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
          </Select>
          <Select placeholder="排序指标" allowClear style={{ width: 140 }} value={sortBy || undefined} onChange={setSortBy}>
            <Select.Option value="activeAddresses">日活地址</Select.Option>
            <Select.Option value="tvl">TVL排序</Select.Option>
            <Select.Option value="txCount">交易量排序</Select.Option>
            <Select.Option value="whaleTxCount">巨鲸交易排序</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* 数据表格 */}
      <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="id" loading={isLoading} actions={actions}
        pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }} />

      {/* 详情Modal */}
      <Modal title={`${detailRecord?.symbol} (${detailRecord?.chain}) - 链上数据分析`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={820}>
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="代币符号">{detailRecord.symbol}</Descriptions.Item>
              <Descriptions.Item label="所在链路"><Tag color={getChainColor(detailRecord.chain)} style={{ color: detailRecord.chain === 'Solana' || detailRecord.chain === 'BSC' ? '#000' : '#fff' }}>{detailRecord.chain}</Tag></Descriptions.Item>
              <Descriptions.Item label="日活地址">{formatNumber(detailRecord.activeAddresses)}</Descriptions.Item>
              <Descriptions.Item label="24h交易量">{formatNumber(detailRecord.txCount)}</Descriptions.Item>
              <Descriptions.Item label="TPS">{detailRecord.tps.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="TVL">{formatTvl(detailRecord.tvl)}</Descriptions.Item>
              <Descriptions.Item label="巨鲸交易数">{detailRecord.whaleTxCount}</Descriptions.Item>
              <Descriptions.Item label="交易所净流向">
                <span style={{ color: detailRecord.exchangeNetFlow > 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>{formatFlow(detailRecord.exchangeNetFlow)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Top10%持仓">{detailRecord.holderDistribution.top10pct}</Descriptions.Item>
              <Descriptions.Item label="Top1%持仓">{detailRecord.holderDistribution.top1pct}</Descriptions.Item>
              <Descriptions.Item label="销毁率">{detailRecord.burnRate > 0 ? `${(detailRecord.burnRate * 100).toFixed(1)}%` : '无'}</Descriptions.Item>
              <Descriptions.Item label="质押率">{detailRecord.stakingRatio > 0 ? `${detailRecord.stakingRatio.toFixed(1)}%` : '无'}</Descriptions.Item>
              <Descriptions.Item label="数据更新" span={2}>{dayjs(detailRecord.dataTimestamp).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Card title="链上概览仪表盘" size="small" className="mb-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: '活跃度指数', value: Math.min(100, Math.round(detailRecord.activeAddresses / 10000)), color: '#1677FF', desc: '基于DAU与网络规模的相对活跃度' },
                  { label: '交易健康度', value: Math.min(100, Math.round(detailRecord.tps / 70)), color: '#16A34A', desc: 'TPS利用率与网络承载能力比' },
                  { label: '资金健康度', value: detailRecord.exchangeNetFlow > 0 ? 75 : 45, color: detailRecord.exchangeNetFlow > 0 ? '#16A34A' : '#EF4444', desc: '交易所资金流向反映的市场情绪' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: 16, borderRadius: 10, background: `${item.color}08`, border: `1px solid ${item.color}25` }}>
                    <Progress type="circle" percent={item.value} size={72} strokeColor={item.color} format={(p) => p} />
                    <div style={{ fontWeight: 600, marginTop: 6 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="资金流向分析" size="small" className="mb-4">
              <div style={{ lineHeight: 1.8, color: '#374151' }}>
                <p>
                  近24小时内，{detailRecord.symbol}在{detailRecord.chain}链上的资金流动呈现
                  {detailRecord.exchangeNetFlow > 0 ? <span style={{ color: '#16A34A', fontWeight: 600 }}> 净流入态势</span> : <span style={{ color: '#DC2626', fontWeight: 600 }}> 净流出态势</span>}，
                  交易所净流向金额为<span style={{ fontWeight: 600 }}> {formatFlow(detailRecord.exchangeNetFlow)}</span>。
                </p>
                <p>
                  巨鲸账户活动频繁度{detailRecord.whaleTxCount > 2000 ? <span style={{ color: '#EF4444', fontWeight: 600 }}> 偏高（{detailRecord.whaleTxCount}笔大额交易）</span> : <span style={{ color: '#16A34A' }}> 正常范围</span>}，
                  {detailRecord.whaleTxCount > 2000 ? '可能预示着大额持仓调整或市场操纵行为，AIOPC引擎已标记为重点关注。' : '未见明显异常动向。'}
                </p>
                <p>
                  持仓分布方面，Top10%地址持有{detailRecord.holderDistribution.top10pct}的流通供应量，
                  {parseFloat(detailRecord.holderDistribution.top10pct) > 30 ? <span style={{ color: '#EF4444' }}> 集中度偏高，存在一定的抛售压力风险。</span> :
                   parseFloat(detailRecord.holderDistribution.top10pct) > 20 ? <span style={{ color: '#F59E0B' }}> 集中度适中，需持续关注。</span> :
                   <span style={{ color: '#16A34A' }}> 分布较为健康。</span>}
                </p>
              </div>
            </Card>

            <Card title={<Space><ThunderboltFilled style={{ color: '#F0B90B' }} /><span style={{ color: '#F0B90B', fontWeight: 700 }}>AIOPC 链上评分</span></Space>}
              size="small" className="mb-4" style={{ borderLeft: `4px solid #F0B90B` }}>
              <div className="space-y-3">
                {[
                  { label: '网络活跃度', score: Math.min(100, Math.round(detailRecord.activeAddresses / 10000)), color: '#1677FF' },
                  { label: '交易吞吐能力', score: Math.min(100, Math.round(detailRecord.tps / 70)), color: '#16A34A' },
                  { label: '资金健康度', score: detailRecord.exchangeNetFlow > 0 ? 78 : 42, color: detailRecord.exchangeNetFlow > 0 ? '#16A34A' : '#EF4444' },
                  { label: '持仓分散度', score: Math.max(20, 100 - parseFloat(detailRecord.holderDistribution.top10pct) * 2.5), color: '#7C3AED' },
                  { label: '巨鲸稳定性', score: Math.max(20, 100 - detailRecord.whaleTxCount / 30), color: '#F59E0B' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1"><span style={{ fontSize: 13 }}>{item.label}</span><span style={{ fontWeight: 600, color: item.color }}>{item.score}/100</span></div>
                    <Progress percent={item.score} size="small" showInfo={false} strokeColor={item.color} trailColor="#F3F4F6" />
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ marginBottom: 8 }}>
              <strong>📈 历史趋势描述：</strong>
              <p style={{ color: '#6B7280', marginTop: 4, lineHeight: 1.8 }}>
                过去30天，{detailRecord.symbol}在{detailRecord.chain}上的链上指标呈现
                {detailRecord.exchangeNetFlow > 0 ? '积极向好' : '谨慎观望'}趋势。
                日活地址{detailRecord.activeAddresses > 300000 ? '保持高位运行' : '处于平稳区间'}，
                TVL较上月{Math.random() > 0.5 ? '增长' : '下降'}约{(Math.random() * 15 + 2).toFixed(1)}%。
                AIOPC链上大脑预测未来一周该资产链上活跃度将维持{['当前水平', '小幅上升', '震荡调整'][Math.floor(Math.random() * 3)]}。
              </p>
            </div>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
