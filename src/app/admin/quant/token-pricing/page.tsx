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
  DollarCircleOutlined,
  EyeOutlined,
  FundOutlined,
  LineChartOutlined,
  ThunderboltFilled,
  CalculatorOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ExperimentOutlined,
  ApiOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

/* ---------- 类型定义 ---------- */
interface TokenPricing {
  id: number;
  symbol: string;
  modelName: 'dcf' | 'nvr' | 'metcalfe' | 'sfpt' | 'composite';
  currentPrice: number;
  fairValue: number;
  undervaluation: number;
  confidence: number;
  factors: { growth: number; risk: number; adoption: number; network: number };
  lastCalculated: string;
  analyst: string;
}

/* ---------- Mock 数据 ---------- */
const mockData: TokenPricing[] = [
  { id: 1, symbol: 'BTC', modelName: 'composite', currentPrice: 67234.50, fairValue: 85000, undervaluation: 20.9, confidence: 92, factors: { growth: 88, risk: 75, adoption: 95, network: 90 }, lastCalculated: '2026-06-23T08:00:00', analyst: 'AIOPC Engine' },
  { id: 2, symbol: 'ETH', modelName: 'dcf', currentPrice: 3456.78, fairValue: 4200, undervaluation: 17.7, confidence: 85, factors: { growth: 82, risk: 70, adoption: 88, network: 85 }, lastCalculated: '2026-06-23T07:55:00', analyst: 'Quant Team A' },
  { id: 3, symbol: 'SOL', modelName: 'metcalfe', currentPrice: 178.90, fairValue: 220, undervaluation: 18.7, confidence: 78, factors: { growth: 85, risk: 65, adoption: 80, network: 78 }, lastCalculated: '2026-06-23T07:50:00', analyst: 'AIOPC Engine' },
  { id: 4, symbol: 'BNB', modelName: 'nvr', currentPrice: 587.32, fairValue: 650, undervaluation: 9.6, confidence: 80, factors: { growth: 76, risk: 72, adoption: 82, network: 80 }, lastCalculated: '2026-06-23T07:45:00', analyst: 'Quant Team B' },
  { id: 5, symbol: 'ADA', modelName: 'sfpt', currentPrice: 0.892, fairValue: 1.35, undervaluation: 33.9, confidence: 68, factors: { growth: 70, risk: 60, adoption: 65, network: 68 }, lastCalculated: '2026-06-23T07:40:00', analyst: 'AIOPC Engine' },
  { id: 6, symbol: 'DOT', modelName: 'metcalfe', currentPrice: 7.23, fairValue: 12.50, undervaluation: 42.2, confidence: 65, factors: { growth: 65, risk: 58, adoption: 60, network: 70 }, lastCalculated: '2026-06-23T07:35:00', analyst: 'Quant Team A' },
  { id: 7, symbol: 'LINK', modelName: 'composite', currentPrice: 14.67, fairValue: 22.00, undervaluation: 33.3, confidence: 74, factors: { growth: 78, risk: 62, adoption: 75, network: 72 }, lastCalculated: '2026-06-23T07:30:00', analyst: 'AIOPC Engine' },
  { id: 8, symbol: 'AVAX', modelName: 'dcf', currentPrice: 38.45, fairValue: 52.00, undervaluation: 26.1, confidence: 70, factors: { growth: 72, risk: 60, adoption: 68, network: 70 }, lastCalculated: '2026-06-23T07:25:00', analyst: 'Quant Team B' },
  { id: 9, symbol: 'UNI', modelName: 'nvr', currentPrice: 8.92, fairValue: 14.00, undervaluation: 36.3, confidence: 66, factors: { growth: 68, risk: 55, adoption: 62, network: 65 }, lastCalculated: '2026-06-23T07:20:00', analyst: 'AIOPC Engine' },
  { id: 10, symbol: 'MATIC', modelName: 'sfpt', currentPrice: 0.685, fairValue: 1.10, undervaluation: 37.7, confidence: 72, factors: { growth: 75, risk: 64, adoption: 70, network: 73 }, lastCalculated: '2026-06-23T07:15:00', analyst: 'Quant Team A' },
];

/* ---------- 辅助函数 ---------- */
const getModelLabel = (m: string) => ({ dcf: 'DCF模型', nvr: 'NVR模型', metcalfe: 'Metcalfe法则', sfpt: 'SFPT模型', composite: '综合模型' })[m] || m;

const getModelColor = (m: string) => ({ dcf: 'blue', nvr: 'purple', metcalfe: 'green', sfpt: 'orange', composite: 'gold' })[m] || 'default';

const getValuationRange = (v: number) => {
  if (v > 30) return 'deep_undervalue';
  if (v > 15) return 'undervalue';
  if (v > -10) return 'fair';
  return 'overvalue';
};

const getRangeColor = (r: string) => ({
  deep_undervalue: '#16A34A',
  undervalue: '#22C55E',
  fair: '#F59E0B',
  overvalue: '#EF4444',
})[r] || '#9CA3AF';

const getRangeLabel = (r: string) => ({
  deep_undervalue: '深度低估',
  undervalue: '低估',
  fair: '合理估值',
  overvalue: '高估',
})[r] || r;

/* ---------- 页面组件 ---------- */
export default function TokenPricingPage() {
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterRange, setFilterRange] = useState<string>('');
  const [detailRecord, setDetailRecord] = useState<TokenPricing | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: pricings = mockData, isLoading } = useQuery({
    queryKey: ['token-pricings'],
    queryFn: () => Promise.resolve(mockData),
    staleTime: 60_000,
  });

  const filteredData = pricings.filter((item) => {
    if (filterModel && item.modelName !== filterModel) return false;
    if (filterRange && getValuationRange(item.undervaluation) !== filterRange) return false;
    return true;
  });

  const underCount = pricings.filter(p => p.undervaluation > 15).length;
  const avgConfidence = (pricings.reduce((s, p) => s + p.confidence, 0) / pricings.length).toFixed(1);
  const dcfItems = pricings.filter(p => p.modelName === 'dcf');
  const dcfDeviation = dcfItems.length ? (dcfItems.reduce((s, p) => s + Math.abs(p.undervaluation), 0) / dcfItems.length).toFixed(1) : '0';

  const columns = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 100,
      render: (sym: string) => (
        <Space>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#1677FF15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1677FF', fontSize: 11 }}>{sym.slice(0, 2)}</div>
          <span style={{ fontWeight: 600 }}>{sym}</span>
        </Space>
      ),
    },
    {
      title: '模型',
      dataIndex: 'modelName',
      key: 'modelName',
      width: 120,
      render: (m: string) => <Tag color={getModelColor(m)}>{getModelLabel(m)}</Tag>,
    },
    {
      title: '当前价($)',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 110,
      render: (p: number) => <span style={{ fontWeight: 600 }}>${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      title: '公允价值($)',
      dataIndex: 'fairValue',
      key: 'fairValue',
      width: 115,
      render: (fv: number) => <span>${fv.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>,
    },
    {
      title: '低估%',
      dataIndex: 'undervaluation',
      key: 'undervaluation',
      width: 90,
      sorter: (a: TokenPricing, b: TokenPricing) => a.undervaluation - b.undervaluation,
      render: (uv: number) => (
        <Tooltip title={getRangeLabel(getValuationRange(uv))}>
          <Tag color={uv > 0 ? 'green' : uv === 0 ? 'default' : 'red'} style={{ fontWeight: 700 }}>
            {uv > 0 ? '+' : ''}{uv.toFixed(1)}%
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (c: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Progress percent={c} size="small" showInfo={false}
            strokeColor={c >= 80 ? '#16A34A' : c >= 60 ? '#F59E0B' : '#EF4444'} style={{ width: 60 }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{c}</span>
        </div>
      ),
    },
    {
      title: '成长因子',
      key: 'growthFactor',
      width: 80,
      render: (_: any, r: TokenPricing) => <Progress percent={r.factors.growth} size="small" showInfo={false} strokeColor="#1677FF" />,
    },
    {
      title: '风险因子',
      key: 'riskFactor',
      width: 80,
      render: (_: any, r: TokenPricing) => <Progress percent={r.factors.risk} size="small" showInfo={false} strokeColor="#EF4444" />,
    },
    {
      title: '采用率因子',
      key: 'adoptionFactor',
      width: 90,
      render: (_: any, r: TokenPricing) => <Progress percent={r.factors.adoption} size="small" showInfo={false} strokeColor="#7C3AED" />,
    },
    {
      title: '分析师',
      dataIndex: 'analyst',
      key: 'analyst',
      width: 110,
      render: (a: string) => a.includes('AIOPC') ? <Tag color="#F0B90B">{a}</Tag> : <span>{a}</span>,
    },
    {
      title: '更新时间',
      dataIndex: 'lastCalculated',
      key: 'lastCalculated',
      width: 140,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '操作', key: 'actions', width: 100 },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (r: TokenPricing) => { setDetailRecord(r); setModalOpen(true); } },
  ];

  return (
    <AdminLayout
      title="代币定价模型中心"
      subtitle="科学估值体系 · DCF/NVR/Metcalfe/SFPT多模型交叉验证 · AIOPC增强定价"
    >
      {/* DataCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DataCard title="定价模型数" value={pricings.length} icon={<CalculatorOutlined />} color="#1677FF" suffix="个" />
        <DataCard title="低估标的" value={underCount} icon={<RiseOutlined />} color="#16A34A" suffix="个" />
        <DataCard title="平均置信度" value={`${avgConfidence}%`} icon={<BarChartOutlined />} color="#7C3AED" suffix="" />
        <DataCard title="DCF偏差均值" value={`${dcfDeviation}%`} icon={<LineChartOutlined />} color="#F59E0B" suffix="" />
        <DataCard title="AIOPC修正次数" value={47} icon={<ThunderboltFilled />} color="#F0B90B" suffix="次" />
      </div>

      {/* 筛选栏 */}
      <Card size="small" className="mb-4" style={{ borderRadius: 12 }}>
        <Space wrap size="middle">
          <Select placeholder="模型类型" allowClear style={{ width: 150 }} value={filterModel || undefined} onChange={setFilterModel}>
            <Select.Option value="dcf">DCF现金流折现</Select.Option>
            <Select.Option value="nvr">NVR网络价值比率</Select.Option>
            <Select.Option value="metcalfe">Metcalfe法则</Select.Option>
            <Select.Option value="sfpt">SFPT存量流量</Select.Option>
            <Select.Option value="composite">综合交叉验证</Select.Option>
          </Select>
          <Select placeholder="估值区间" allowClear style={{ width: 140 }} value={filterRange || undefined} onChange={setFilterRange}>
            <Select.Option value="deep_undervalue">{'深度低估 (>30%)'}</Select.Option>
            <Select.Option value="undervalue">{'低估 (15-30%)'}</Select.Option>
            <Select.Option value="fair">{'合理估值 (-10%~15%)'}</Select.Option>
            <Select.Option value="overvalue">{'高估 (<-10%)'}</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* 数据表格 */}
      <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="id" loading={isLoading} actions={actions}
        pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }} />

      {/* 详情Modal */}
      <Modal title={`${detailRecord?.symbol} - 定价模型详情`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={800}>
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="代币符号">{detailRecord.symbol}</Descriptions.Item>
              <Descriptions.Item label="估值模型">
                <Tag color={getModelColor(detailRecord.modelName)}>{getModelLabel(detailRecord.modelName)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前价格">${detailRecord.currentPrice.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="公允价值">${detailRecord.fairValue.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="低估程度">
                <Tag color={detailRecord.undervaluation > 0 ? 'green' : 'red'} style={{ fontWeight: 700 }}>
                  {detailRecord.undervaluation > 0 ? '+' : ''}{detailRecord.undervaluation.toFixed(1)}%
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="置信度">
                <Progress percent={detailRecord.confidence} size="small" format={(c) => `${c}%`}
                  strokeColor={detailRecord.confidence >= 80 ? '#16A34A' : detailRecord.confidence >= 60 ? '#F59E0B' : '#EF4444'} />
              </Descriptions.Item>
              <Descriptions.Item label="分析师">{detailRecord.analyst}</Descriptions.Item>
              <Descriptions.Item label="计算时间">{dayjs(detailRecord.lastCalculated).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
            </Descriptions>

            <Card title="因子分解分析" size="small" className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: '成长因子', value: detailRecord.factors.growth, icon: <RiseOutlined />, color: '#1677FF', desc: '项目增长率、用户扩张速度、生态发展潜力' },
                  { label: '风险因子', value: detailRecord.factors.risk, icon: <WarningOutlined />, color: '#EF4444', desc: '波动性、流动性、监管风险、竞争格局' },
                  { label: '采用率因子', value: detailRecord.factors.adoption, icon: <CheckCircleOutlined />, color: '#7C3AED', desc: '市场渗透率、社区活跃度、开发者参与度' },
                  { label: '网络效应因子', value: detailRecord.factors.network, icon: <ApiOutlined />, color: '#16A34A', desc: '节点数量、交易网络密度、跨链连接数' },
                ].map(f => (
                  <div key={f.label} style={{ padding: 12, borderRadius: 8, border: `1px solid ${f.color}30`, background: `${f.color}08` }}>
                    <div className="flex items-center gap-2 mb-2"><span style={{ color: f.color }}>{f.icon}</span><strong>{f.label}</strong></div>
                    <Progress percent={f.value} strokeColor={f.color} trailColor="#F3F4F6" />
                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title={<Space><ThunderboltFilled style={{ color: '#F0B90B' }} /><span style={{ color: '#F0B90B', fontWeight: 700 }}>AIOPC修正说明</span></Space>}
              size="small" className="mb-4" style={{ borderLeft: `4px solid #F0B90B` }}>
              <div style={{ lineHeight: 1.8, color: '#374151' }}>
                <p>基于{getModelLabel(detailRecord.modelName)}基础估值结果，AIOPC引擎进行了以下增强修正：</p>
                <ul style={{ paddingLeft: 18 }}>
                  <li>引入链上实时数据（活跃地址、TVL变化、巨鲸动向）对公允价值进行动态调整，调整幅度约±{(Math.random() * 8 + 2).toFixed(1)}%</li>
                  <li>结合市场情绪指标（恐惧贪婪指数、社交热度）进行情绪溢价/折价修正</li>
                  <li>通过多模型交叉验证消除单一模型的系统性偏差，最终置信度提升至{detailRecord.confidence}%</li>
                </ul>
                <Divider />
                <div style={{ background: '#FEF3C7', padding: '10px 14px', borderRadius: 8, marginTop: 8 }}>
                  <strong style={{ color: '#D97706' }}>💡 AIOPC结论：</strong>
                  {detailRecord.undervaluation > 25 ? ` ${detailRecord.symbol} 当前被显著低估（${detailRecord.undervaluation.toFixed(1)}%），建议关注配置机会。AIOPC引擎预测其公允价值回归周期为${Math.floor(Math.random() * 90 + 30)}天。` :
                   detailRecord.undervaluation > 10 ? ` ${detailRecord.symbol} 存在一定低估空间（${detailRecord.undervaluation.toFixed(1)}%），可考虑分批建仓。` :
                   detailRecord.undervaluation > -10 ? ` ${detailRecord.symbol} 当前处于合理估值区间，建议持有观望。` :
                   ` ${detailRecord.symbol} 存在高估风险（${Math.abs(detailRecord.undervaluation).toFixed(1)}%），建议谨慎或减仓。`}
                </div>
              </div>
            </Card>

            <div style={{ marginBottom: 8 }}>
              <strong>📊 历史估值对比：</strong>
              <p style={{ color: '#6B7280', marginTop: 4, lineHeight: 1.8 }}>
                过去90天内，{detailRecord.symbol}的估值呈现{detailRecord.currentPrice < detailRecord.fairValue ? '逐步收敛至公允价值的趋势' : '偏离公允价值扩大的趋势'}。
                近期{Math.floor(Math.random() * 5 + 1)}次模型迭代中，公允价值调整幅度在±{(Math.random() * 10 + 2).toFixed(1)}%之间，
                主要驱动因素为{['DeFi TVL增长', '监管政策变化', '技术升级进展', '市场情绪波动'][Math.floor(Math.random() * 4)]}。
                AIOPC引擎持续监控中，下次重算预计在{dayjs().add(Math.floor(Math.random() * 24), 'hour').format('MM-DD HH:mm')}。
              </p>
            </div>
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
