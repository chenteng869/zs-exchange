'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  Table,
  message,
  Descriptions,
  Divider,
  Select,
  Card,
  Tooltip,
  Progress,
  Popconfirm,
} from 'antd';
import {
  AlertFilled,
  EyeOutlined,
  CheckOutlined,
  StopOutlined,
  CloseCircleOutlined,
  ThunderboltFilled,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  BellOutlined,
  RobotOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  BugOutlined,
  LineChartOutlined,
  MoneyCollectOutlined,
  UsergroupDeleteOutlined,
  FileProtectOutlined,
  BankOutlined,
  HeartOutlined,
  ScanOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

/* ---------- 类型定义 ---------- */
interface TokenWarning {
  id: number;
  symbol: string;
  warningType: 'price_spike' | 'volume_anomaly' | 'whale_move' | 'social_fomo' | 'contract_risk' | 'exchange_drain' | 'smart_money';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  currentPrice: number;
  change24h: number;
  detectedAt: string;
  status: 'new' | 'acknowledged' | 'resolved' | 'false_positive';
  aiConfidence: number;
  recommendedAction: string;
  source: 'ai' | 'onchain' | 'social' | 'hybrid';
}

/* ---------- Mock 数据 ---------- */
const initialMockData: TokenWarning[] = [
  { id: 1, symbol: 'BTC', warningType: 'price_spike', severity: 'critical', title: 'BTC价格剧烈波动预警', description: 'BTC在15分钟内下跌超过8%，触发极端波动阈值。可能受宏观政策或大户抛售影响。', currentPrice: 61850.00, change24h: -8.32, detectedAt: '2026-06-23T09:15:00', status: 'new', aiConfidence: 96, recommendedAction: '立即通知风控团队，考虑临时提高保证金要求', source: 'hybrid' },
  { id: 2, symbol: 'SOL', warningType: 'whale_move', severity: 'high', title: '巨鲸大额转出预警', description: '检测到已知巨鲸地址向交易所转入50,000 SOL（约$8.9M），可能为抛售信号。', currentPrice: 172.30, change24h: -3.45, detectedAt: '2026-06-23T08:50:00', status: 'new', aiConfidence: 88, recommendedAction: '密切监控该地址后续动作，准备流动性应对方案', source: 'onchain' },
  { id: 3, symbol: 'UNI', warningType: 'volume_anomaly', severity: 'high', title: '交易量异常激增', description: 'UNI 1小时成交量达到日均量的12倍，疑似内幕消息或操控行为。', currentPrice: 9.85, change24h: 15.67, detectedAt: '2026-06-23T08:30:00', status: 'acknowledged', aiConfidence: 82, recommendedAction: '调查异常交易来源，排查潜在市场操纵', source: 'ai' },
  { id: 4, symbol: 'LINK', warningType: 'social_fomo', severity: 'medium', title: '社交媒体热度异常飙升', description: 'Twitter/X上LINK相关讨论量增长340%，情绪指标进入极度贪婪区间(FGI=82)。', currentPrice: 15.20, change24h: 5.43, detectedAt: '2026-06-23T08:00:00', status: 'new', aiConfidence: 75, recommendedAction: '警惕追高风险，关注是否有基本面支撑', source: 'social' },
  { id: 5, symbol: 'AVAX', warningType: 'contract_risk', severity: 'critical', title: '智能合约漏洞预警', description: 'AVAX桥接合约检测到潜在的签名重放漏洞模式，与历史攻击特征高度相似。', currentPrice: 36.80, change24h: -12.30, detectedAt: '2026-06-23T07:45:00', status: 'new', aiConfidence: 93, recommendedAction: '立即暂停跨链桥服务，联系安全团队进行紧急审查', source: 'hybrid' },
  { id: 6, symbol: 'ADA', warningType: 'exchange_drain', severity: 'high', title: '交易所提币潮预警', description: '过去6小时Binance ADA净流出达$45M，冷钱包余额降至警戒线以下。', currentPrice: 0.856, change24h: -4.21, detectedAt: '2026-06-23T07:20:00', status: 'acknowledged', aiConfidence: 86, recommendedAction: '协调交易所补充储备，监控后续提币趋势', source: 'onchain' },
  { id: 7, symbol: 'ETH', warningType: 'smart_money', severity: 'medium', title: '聪明钱异动提示', description: '跟踪的TOP 50聪明钱地址中有32个在近2小时内增持ETH，累计买入$12.5M。', currentPrice: 3520.00, change24h: 2.15, detectedAt: '2026-06-23T07:00:00', status: 'new', aiConfidence: 79, recommendedAction: '作为正向信号参考，结合其他指标综合判断', source: 'ai' },
  { id: 8, symbol: 'DOT', warningType: 'price_spike', severity: 'low', title: '价格突破技术位', description: 'DOT突破$8.0关键技术阻力位，成交量放大，可能开启新一轮上涨趋势。', currentPrice: 8.15, change24h: 12.68, detectedAt: '2026-06-23T06:30:00', status: 'resolved', aiConfidence: 68, recommendedAction: '可作为技术分析参考，设置合理止损点位', source: 'ai' },
  { id: 9, symbol: 'MATIC', warningType: 'volume_anomaly', severity: 'medium', title: 'DEX交易量异常', description: 'QuickSwap上MATIC/WETH交易对出现大量低价挂单被吃掉，疑似套利机器人活动。', currentPrice: 0.712, change24h: 1.89, detectedAt: '2026-06-23T06:00:00', status: 'new', aiConfidence: 71, recommendedAction: '监控套利规模是否扩大，注意滑点变化', source: 'onchain' },
  { id: 10, symbol: 'ATOM', warningType: 'social_fomo', severity: 'low', title: '社区情绪分化', description: 'Cosmos社区针对IBC升级提案产生激烈争论，正负面情绪比例接近1:1。', currentPrice: 9.45, change24h: -2.10, detectedAt: '2026-06-23T05:30:00', status: 'false_positive', aiConfidence: 55, recommendedAction: '常规监控即可，暂无需特别干预', source: 'social' },
  { id: 11, symbol: 'BNB', warningType: 'exchange_drain', severity: 'medium', title: '多交易所同步提币', description: '检测到BNB在3家主流交易所同时出现大额提币，总金额超$80M。', currentPrice: 578.50, change24h: -1.56, detectedAt: '2026-06-23T04:00:00', status: 'acknowledged', aiConfidence: 77, recommendedAction: '分析提币去向，判断是机构调仓还是散户恐慌', source: 'onchain' },
  { id: 12, symbol: 'FIL', warningType: 'contract_risk', severity: 'high', title: 'FVM合约 Gas 异常', description: 'Filecoin虚拟机上多个DeFi合约Gas消耗突增300%，可能存在DoS攻击或无限循环。', currentPrice: 5.12, change24h: -5.80, detectedAt: '2026-06-23T03:15:00', status: 'new', aiConfidence: 84, recommendedAction: '紧急排查相关合约，必要时暂停受影响协议', source: 'hybrid' },
];

/* ---------- 辅助函数 ---------- */
const getTypeConfig = (type: string) => ({
  price_spike: { label: '价格异动', color: '#EF4444', icon: <LineChartOutlined /> },
  volume_anomaly: { label: '量能异常', color: '#F97316', icon: <DashboardOutlined /> },
  whale_move: { label: '巨鲸动向', color: '#7C3AED', icon: <MoneyCollectOutlined /> },
  social_fomo: { label: '舆情异常', color: '#EC4899', icon: <HeartOutlined /> },
  contract_risk: { label: '合约风险', color: '#DC2626', icon: <FileProtectOutlined /> },
  exchange_drain: { label: '交易所异动', color: '#F59E0B', icon: <BankOutlined /> },
  smart_money: { label: '聪明钱信号', color: '#16A34A', icon: <ExperimentOutlined /> },
})[type] || { label: type, color: '#9CA3AF', icon: <AlertFilled /> };

const getSeverityConfig = (s: string) => ({
  critical: { label: 'Critical', color: '#DC2626', bg: '#FEE2E2' },
  high: { label: 'High', color: '#EF4444', bg: '#FEF2F2' },
  medium: { label: 'Medium', color: '#F59E0B', bg: '#FEF3C7' },
  low: { label: 'Low', color: '#9CA3AF', bg: '#F3F4F6' },
})[s] || { label: s, color: '#9CA3AF', bg: '#F3F4F6' };

const getStatusConfig = (s: string) => ({
  new: { label: '新增', color: 'red', icon: <BellOutlined /> },
  acknowledged: { label: '已确认', color: 'orange', icon: <CheckOutlined /> },
  resolved: { label: '已解决', color: 'green', icon: <SafetyCertificateOutlined /> },
  false_positive: { label: '误报', color: 'default', icon: <CloseCircleOutlined /> },
})[s] || { label: s, color: 'default', icon: null };

const getSourceLabel = (src: string) => ({ ai: 'AI引擎', onchain: '链上数据', social: '社交舆情', hybrid: '多源融合' })[src] || src;

const getSourceIcon = (src: string) => ({ ai: <RobotOutlined />, onchain: <ScanOutlined />, social: <HeartOutlined />, hybrid: <ThunderboltFilled /> })[src] || <AlertFilled />;

/* ---------- 页面组件 ---------- */
export default function TokenWarningsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [detailRecord, setDetailRecord] = useState<TokenWarning | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: warnings = initialMockData, isLoading } = useQuery({
    queryKey: ['token-warnings'],
    queryFn: () => Promise.resolve(initialMockData),
    staleTime: 60_000,
  });

  const filteredData = warnings.filter((item) => {
    if (filterType && item.warningType !== filterType) return false;
    if (filterSeverity && item.severity !== filterSeverity) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const activeWarnings = warnings.filter(w => w.status === 'new' || w.status === 'acknowledged').length;
  const criticalCount = warnings.filter(w => w.severity === 'critical').length;
  const todayNew = warnings.filter(w => dayjs(w.detectedAt).isSame(dayjs(), 'day')).length;
  const avgAiConfidence = (warnings.reduce((s, w) => s + w.aiConfidence, 0) / warnings.length).toFixed(0);

  const handleAcknowledge = (record: TokenWarning) => {
    message.success(`已确认预警 #${record.id}: ${record.title}`);
    queryClient.invalidateQueries({ queryKey: ['token-warnings'] });
  };

  const handleDismiss = (record: TokenWarning) => {
    message.info(`已忽略预警 #${record.id}`);
    queryClient.invalidateQueries({ queryKey: ['token-warnings'] });
  };

  const handleClose = (record: TokenWarning) => {
    message.success(`已关闭预警 #${record.id}`);
    queryClient.invalidateQueries({ queryKey: ['token-warnings'] });
  };

  const columns = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 80,
      render: (sym: string) => (
        <Space><AlertFilled style={{ color: '#EF4444' }} /><span style={{ fontWeight: 700 }}>{sym}</span></Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'warningType',
      key: 'warningType',
      width: 110,
      render: (type: string) => {
        const cfg = getTypeConfig(type);
        return <Tag color={cfg.color} icon={cfg.icon} style={{ color: '#fff' }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '严重级',
      dataIndex: 'severity',
      key: 'severity',
      width: 85,
      render: (s: string) => {
        const cfg = getSeverityConfig(s);
        return <Tag color={cfg.color} style={{ fontWeight: 700 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string) => <Tooltip title={title}><span style={{ fontWeight: 500 }}>{title}</span></Tooltip>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      ellipsis: true,
      render: (desc: string) => <span style={{ color: '#6B7280', fontSize: 12 }}>{desc.slice(0, 40)}...</span>,
    },
    {
      title: '当前价($)',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (p: number) => <span style={{ fontWeight: 600 }}>{p.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>,
    },
    {
      title: '24h变化',
      dataIndex: 'change24h',
      key: 'change24h',
      width: 85,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '检出时间',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 140,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const cfg = getStatusConfig(s);
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'AI置信度',
      dataIndex: 'aiConfidence',
      key: 'aiConfidence',
      width: 95,
      render: (c: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Progress percent={c} size="small" showInfo={false}
            strokeColor={c >= 85 ? '#16A34A' : c >= 70 ? '#F59E0B' : '#EF4444'} style={{ width: 50 }} />
          <span style={{ fontSize: 11, fontWeight: 600 }}>{c}</span>
        </div>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (src: string) => (
        <Tooltip title={getSourceLabel(src)}>
          <Tag icon={getSourceIcon(src)} color={src === 'hybrid' ? '#F0B90B' : src === 'ai' ? '#1677FF' : src === 'onchain' ? '#7C3AED' : '#EC4899'}>
            {getSourceLabel(src)}
          </Tag>
        </Tooltip>
      ),
    },
    { title: '操作', key: 'actions', width: 220 },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (r: TokenWarning) => { setDetailRecord(r); setModalOpen(true); } },
    {
      key: 'ack', label: '确认', icon: <CheckOutlined />,
      hidden: () => false,
      confirm: { title: '确认预警', description: '确认后将标记为已处理状态', onConfirm: handleAcknowledge },
    },
    { key: 'dismiss', label: '忽略', icon: <StopOutlined />, danger: true, onClick: handleDismiss, hidden: () => false },
    { key: 'close', label: '关闭', icon: <CloseCircleOutlined />, danger: true, onClick: handleClose, hidden: () => false },
  ];

  return (
    <AdminLayout
      title="代币风险预警系统"
      subtitle="7×24小时智能监控 · 异常检测/舆情分析/价格预警 · AIOPC预警雷达"
    >
      {/* DataCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DataCard title="活跃预警" value={activeWarnings} icon={<BellOutlined />} color="#EF4444" suffix="条" />
        <DataCard title="Critical级" value={criticalCount} icon={<WarningOutlined />} color="#DC2626" suffix="条" />
        <DataCard title="今日新增" value={todayNew} icon={<FireOutlined />} color="#F59E0B" suffix="条" />
        <DataCard title="AI检出率" value={`${avgAiConfidence}%`} icon={<RobotOutlined />} color="#1677FF" suffix="" />
        <DataCard title="平均处理时长" value="2.4h" icon={<ClockCircleOutlined />} color="#7C3AED" suffix="" />
      </div>

      {/* 筛选栏 */}
      <Card size="small" className="mb-4" style={{ borderRadius: 12 }}>
        <Space wrap size="middle">
          <Select placeholder="预警类型" allowClear style={{ width: 140 }} value={filterType || undefined} onChange={setFilterType}>
            <Select.Option value="price_spike">价格异动</Select.Option>
            <Select.Option value="volume_anomaly">量能异常</Select.Option>
            <Select.Option value="whale_move">巨鲸动向</Select.Option>
            <Select.Option value="social_fomo">舆情异常</Select.Option>
            <Select.Option value="contract_risk">合约风险</Select.Option>
            <Select.Option value="exchange_drain">交易所异动</Select.Option>
            <Select.Option value="smart_money">聪明钱信号</Select.Option>
          </Select>
          <Select placeholder="严重程度" allowClear style={{ width: 120 }} value={filterSeverity || undefined} onChange={setFilterSeverity}>
            <Select.Option value="critical">Critical</Select.Option>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>
          <Select placeholder="处理状态" allowClear style={{ width: 120 }} value={filterStatus || undefined} onChange={setFilterStatus}>
            <Select.Option value="new">新增</Select.Option>
            <Select.Option value="acknowledged">已确认</Select.Option>
            <Select.Option value="resolved">已解决</Select.Option>
            <Select.Option value="false_positive">误报</Select.Option>
          </Select>
        </Space>
      </Card>

      {/* 数据表格 */}
      <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="id" loading={isLoading} actions={actions}
        pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }} />

      {/* 详情Modal */}
      <Modal title={`🚨 预警 #${detailRecord?.id} - ${detailRecord?.title}`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={840}>
        {detailRecord && (() => {
          const typeCfg = getTypeConfig(detailRecord.warningType);
          const sevCfg = getSeverityConfig(detailRecord.severity);
          const statusCfg = getStatusConfig(detailRecord.status);
          return (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="预警ID">#{detailRecord.id}</Descriptions.Item>
              <Descriptions.Item label="关联代币"><span style={{ fontWeight: 700 }}>{detailRecord.symbol}</span></Descriptions.Item>
              <Descriptions.Item label="预警类型">
                <Tag color={typeCfg.color} icon={typeCfg.icon} style={{ color: '#fff' }}>{typeCfg.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="严重等级">
                <Tag color={sevCfg.color} style={{ fontWeight: 700, background: sevCfg.bg }}>{sevCfg.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前价格">${detailRecord.currentPrice.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="24h涨跌">
                <span style={{ color: detailRecord.change24h >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                  {detailRecord.change24h >= 0 ? '+' : ''}{detailRecord.change24h.toFixed(2)}%
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="检出时间">{dayjs(detailRecord.detectedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={statusCfg.color} icon={statusCfg.icon}>{statusCfg.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="AI置信度">
                <Progress percent={detailRecord.aiConfidence} size="small" format={(c) => `${c}%`}
                  strokeColor={detailRecord.aiConfidence >= 85 ? '#16A34A' : detailRecord.aiConfidence >= 70 ? '#F59E0B' : '#EF4444'} />
              </Descriptions.Item>
              <Descriptions.Item label="数据来源">
                <Tag icon={getSourceIcon(detailRecord.source)}
                  color={detailRecord.source === 'hybrid' ? '#F0B90B' : detailRecord.source === 'ai' ? '#1677FF' : detailRecord.source === 'onchain' ? '#7C3AED' : '#EC4899'}>
                  {getSourceLabel(detailRecord.source)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="完整描述" span={2}>{detailRecord.description}</Descriptions.Item>
            </Descriptions>

            {/* AI分析结论 */}
            <Card title={<Space><ThunderboltFilled style={{ color: '#F0B90B' }} /><span style={{ color: '#F0B90B', fontWeight: 700 }}>AI 分析结论</span></Space>}
              size="small" className="mb-4" style={{ borderLeft: `4px solid #F0B90B` }}>
              <div style={{ lineHeight: 1.8, color: '#374151' }}>
                <p>AIOPC预警雷达对 #{detailRecord.id} 的多维度分析结果：</p>
                <ul style={{ paddingLeft: 18 }}>
                  <li><strong>置信度评估：</strong>AI引擎对此预警的置信度为<strong style={{ color: '#F0B90B' }}>{detailRecord.aiConfidence}%</strong>，
                    基于{detailRecord.source === 'hybrid' ? '链上+社交+价格三源交叉验证' : detailRecord.source === 'ai' ? '机器学习模型预测' : detailRecord.source === 'onchain' ? '实时链上数据模式匹配' : '社交情感分析引擎'}得出结论。</li>
                  <li><strong>历史对比：</strong>类似模式的预警在过去{Math.floor(Math.random() * 180 + 30)}天内出现过{Math.floor(Math.random() * 8 + 1)}次，
                    其中{Math.floor(Math.random() * 60 + 30)}%最终演变为实际风险事件。</li>
                  <li><strong>影响范围预估：</strong>若此预警属实，预计影响{detailRecord.symbol}
                    价格波动±{(Math.random() * 10 + 3).toFixed(1)}%，涉及资金规模约${(Math.random() * 500 + 10).toFixed(0)}M。</li>
                </ul>
              </div>
            </Card>

            {/* 推荐操作 */}
            <Card title="推荐操作" size="small" className="mb-4" style={{
              background: detailRecord.severity === 'critical' ? '#FEE2E2' : detailRecord.severity === 'high' ? '#FEF3C7' : '#F0FDF4',
              borderLeft: `4px solid ${detailRecord.severity === 'critical' ? '#DC2626' : detailRecord.severity === 'high' ? '#F59E0B' : '#16A34A'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: detailRecord.severity === 'critical' ? '#DC2626' : detailRecord.severity === 'high' ? '#F59E0B' : '#16A34A', color: '#fff', flexShrink: 0,
                }}>
                  {detailRecord.severity === 'critical' ? <WarningOutlined /> : detailRecord.severity === 'high' ? <ExperimentOutlined /> : <SafetyCertificateOutlined />}
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {detailRecord.severity === 'critical' ? '🔴 紧急行动要求' : detailRecord.severity === 'high' ? '🟠 优先处理建议' : '🟢 常规跟进事项'}
                  </div>
                  <p style={{ color: '#374151', margin: 0, lineHeight: 1.8 }}>{detailRecord.recommendedAction}</p>
                  <div style={{ marginTop: 8 }}>
                    <Space>
                      <Button type="primary" size="small" icon={<CheckOutlined />}
                        onClick={() => { handleAcknowledge(detailRecord); setModalOpen(false); }}>确认并处理</Button>
                      <Button size="small" danger icon={<StopOutlined />}
                        onClick={() => { handleDismiss(detailRecord); setModalOpen(false); }}>暂时忽略</Button>
                      {detailRecord.severity !== 'critical' && (
                        <Button size="small" icon={<CloseCircleOutlined />}
                          onClick={() => { handleClose(detailRecord); setModalOpen(false); }}>标记误报</Button>
                      )}
                    </Space>
                  </div>
                </div>
              </div>
            </Card>

            {/* 相关历史 */}
            <div style={{ marginBottom: 8 }}>
              <strong>📋 相关历史记录：</strong>
              <p style={{ color: '#6B7280', marginTop: 4, lineHeight: 1.8 }}>
                过去30天内，{detailRecord.symbol}共触发了
                {initialMockData.filter(w => w.symbol === detailRecord.symbol).length}次同类型预警。
                最近一次同类事件发生在{dayjs().subtract(Math.floor(Math.random() * 14), 'day').format('YYYY-MM-DD')}，
                最终状态为{['已解决', '误报', '自动消除'][Math.floor(Math.random() * 3)]}。
                当前预警与历史事件的相似度为{(Math.random() * 30 + 60).toFixed(0)}%。
              </p>
            </div>

            {/* 处理记录 */}
            <Table size="small" dataSource={[
              { time: dayjs(detailRecord.detectedAt).format('MM-DD HH:mm:ss'), action: '系统自动检出预警', operator: 'AIOPC Radar', result: '生成预警' },
              ...(detailRecord.status !== 'new' ? [{ time: dayjs(detailRecord.detectedAt).add(10, 'minute').format('MM-DD HH:mm:ss'), action: '运营人员确认', operator: 'Admin', result: '已确认' }] : []),
              ...{ ...(detailRecord.status === 'resolved' ? [{ time: dayjs().subtract(1, 'hour').format('MM-DD HH:mm:ss'), action: '问题已解决', operator: 'Tech Team', result: '关闭预警' }] : []) },
            ].slice(0, 4)} pagination={false} rowKey="time" columns={[
              { title: '时间', dataIndex: 'time', key: 't', width: 140 },
              { title: '操作', dataIndex: 'action', key: 'a' },
              { title: '执行者', dataIndex: 'operator', key: 'o', width: 110 },
              { title: '结果', dataIndex: 'result', key: 'r', render: (r: string) => <Tag color="blue">{r}</Tag> },
            ]} title={() => '处理记录'} />
          </>
        );})()}
      </Modal>
    </AdminLayout>
  );
}
