'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, DatePicker } from 'antd';
import {
  FileSearchOutlined,
  EyeOutlined,
  ExportOutlined,
  LinkOutlined,
  AlertOutlined,
  DashboardOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface TradeLog {
  id: string;
  tradeId: string;
  orderId: string;
  strategyName: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'iceberg' | 'twap';
  quantity: number;
  price: number;
  executedPrice: number;
  fillQuantity: number;
  status: 'filled' | 'partial' | 'cancelled' | 'rejected';
  slippageBps: number;
  commission: number;
  fee: number;
  realizedPnl: number;
  executionTimeMs: number;
  exchange: string;
  latencyMs: number;
  createdAt: string;
  aiGenerated: boolean;
}

const mockData: TradeLog[] = [
  { id: '1', tradeId: 'TRX-20240623-001', orderId: 'ORD-882341', strategyName: 'AI趋势跟踪Pro', symbol: 'BTC/USDT', side: 'buy', type: 'limit', quantity: 0.5, price: 67200, executedPrice: 67215, fillQuantity: 0.5, status: 'filled', slippageBps: 0.7, commission: 3.36, fee: 0.85, realizedPnl: 1250, executionTimeMs: 45, exchange: 'Binance', latencyMs: 12, createdAt: '2024-06-23 14:32:15', aiGenerated: true },
  { id: '2', tradeId: 'TRX-20240623-002', orderId: 'ORD-882342', strategyName: '跨所套利机器人', symbol: 'ETH/USDT', side: 'sell', type: 'market', quantity: 10, price: 3450, executedPrice: 3449.8, fillQuantity: 10, status: 'filled', slippageBps: -0.6, commission: 17.25, fee: 4.35, realizedPnl: -320, executionTimeMs: 22, exchange: 'OKX', latencyMs: 8, createdAt: '2024-06-23 14:28:42', aiGenerated: true },
  { id: '3', tradeId: 'TRX-20240623-003', orderId: 'ORD-882343', strategyName: '智能网格V2', symbol: 'SOL/USDT', side: 'buy', type: 'iceberg', quantity: 100, price: 152, executedPrice: 151.8, fillQuantity: 85, status: 'partial', slippageBps: -1.3, commission: 76.50, fee: 1.92, realizedPnl: 450, executionTimeMs: 1250, exchange: 'Bybit', latencyMs: 35, createdAt: '2024-06-23 14:15:30', aiGenerated: false },
  { id: '4', tradeId: 'TRX-20240623-004', orderId: 'ORD-882344', strategyName: '动量突破Alpha', symbol: 'AVAX/USDT', side: 'buy', type: 'stop', quantity: 200, price: 38.5, executedPrice: 38.6, fillQuantity: 200, status: 'filled', slippageBps: 2.6, commission: 19.30, fee: 0.48, realizedPnl: 0, executionTimeMs: 18, exchange: 'Binance', latencyMs: 15, createdAt: '2024-06-23 13:58:22', aiGenerated: false },
  { id: '5', tradeId: 'TRX-20240623-005', orderId: 'ORD-882345', strategyName: 'AI情绪分析引擎', symbol: 'LINK/USDT', side: 'sell', type: 'limit', quantity: 500, price: 18.2, executedPrice: 0, fillQuantity: 0, status: 'cancelled', slippageBps: 0, commission: 0, fee: 0, realizedPnl: 0, executionTimeMs: 0, exchange: 'OKX', latencyMs: 0, createdAt: '2024-06-23 13:45:18', aiGenerated: true },
  { id: '6', tradeId: 'TRX-20240623-006', orderId: 'ORD-882346', strategyName: '做市机器人Pro', symbol: 'ETH/USDT', side: 'buy', type: 'twap', quantity: 50, price: 3452, executedPrice: 3451.5, fillQuantity: 50, status: 'filled', slippageBps: -1.4, commission: 86.30, fee: 2.16, realizedPnl: 280, executionTimeMs: 8500, exchange: 'Binance', latencyMs: 22, createdAt: '2024-06-23 13:30:05', aiGenerated: true },
  { id: '7', tradeId: 'TRX-20240623-007', orderId: 'ORD-882347', strategyName: '跟单大师跟随系统', symbol: 'DOGE/USDT', side: 'buy', type: 'market', quantity: 50000, price: 0.159, executedPrice: 0.1592, fillQuantity: 50000, status: 'filled', slippageBps: 12.6, commission: 39.80, fee: 0.10, realizedPnl: -85, executionTimeMs: 35, exchange: 'Bybit', latencyMs: 45, createdAt: '2024-06-23 13:15:48', aiGenerated: false },
  { id: '8', tradeId: 'TRX-20240623-008', orderId: 'ORD-882348', strategyName: 'AI趋势跟踪Pro', symbol: 'BTC/USDT', side: 'sell', type: 'limit', quantity: 0.25, price: 67500, executedPrice: 67498, fillQuantity: 0.25, status: 'filled', slippageBps: -0.3, commission: 16.87, fee: 0.43, realizedPnl: 620, executionTimeMs: 52, exchange: 'Binance', latencyMs: 11, createdAt: '2024-06-23 12:58:33', aiGenerated: true },
  { id: '9', tradeId: 'TRX-20240623-009', orderId: 'ORD-882349', strategyName: '高频做市策略', symbol: 'SOL/USDT', side: 'sell', type: 'market', quantity: 150, price: 153.2, executedPrice: 153.1, fillQuantity: 150, status: 'filled', slippageBps: -0.7, commission: 114.90, fee: 2.87, realizedPnl: 180, executionTimeMs: 15, exchange: 'OKX', latencyMs: 6, createdAt: '2024-06-23 12:42:21', aiGenerated: true },
  { id: '10', tradeId: 'TRX-20240623-010', orderId: 'ORD-882350', strategyName: '均值回归套利', symbol: 'MATIC/USDT', side: 'buy', type: 'limit', quantity: 1000, price: 0.715, executedPrice: 0, fillQuantity: 0, status: 'rejected', slippageBps: 0, commission: 0, fee: 0, realizedPnl: 0, executionTimeMs: 0, exchange: 'Bybit', latencyMs: 0, createdAt: '2024-06-23 12:30:15', aiGenerated: false },
  { id: '11', tradeId: 'TRX-20240622-098', orderId: 'ORD-881290', strategyName: '组合优化器V2', symbol: 'BNB/USDT', side: 'buy', type: 'twap', quantity: 30, price: 598, executedPrice: 597.8, fillQuantity: 30, status: 'filled', slippageBps: -3.3, commission: 89.70, fee: 2.24, realizedPnl: 420, executionTimeMs: 12000, exchange: 'Binance', latencyMs: 28, createdAt: '2024-06-22 23:58:44', aiGenerated: true },
  { id: '12', tradeId: 'TRX-20240622-097', orderId: 'ORD-881289', strategyName: '深度学习预测模型', symbol: 'ARB/USDT', side: 'sell', type: 'stop', quantity: 800, price: 1.15, executedPrice: 1.148, fillQuantity: 800, status: 'filled', slippageBps: -17.4, commission: 9.18, fee: 0.23, realizedPnl: -156, executionTimeMs: 28, exchange: 'OKX', latencyMs: 18, createdAt: '2024-06-22 23:45:12', aiGenerated: true },
];

const typeMap: Record<string, { label: string; color: string }> = {
  market: { label: '市价单', color: '#1677FF' },
  limit: { label: '限价单', color: '#16A34A' },
  stop: { label: '止损单', color: '#DC2626' },
  iceberg: { label: '冰山单', color: '#7C3AED' },
  twap: { label: 'TWAP', color: '#F59E0B' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  filled: { label: '已成交', color: '#16A34A' },
  partial: { label: '部分成交', color: '#F59E0B' },
  cancelled: { label: '已取消', color: '#9CA3AF' },
  rejected: { label: '已拒绝', color: '#DC2626' },
};

const exchangeMap: Record<string, string> = {
  Binance: '#F7931A',
  OKX: '#FFFFFF',
  Bybit: '#F7A600',
};

export default function TradeLogsPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<TradeLog | null>(null);
  const [sideFilter, setSideFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [exchangeFilter, setExchangeFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (sideFilter && item.side !== sideFilter) return false;
    if (typeFilter && item.type !== typeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (exchangeFilter && item.exchange !== exchangeFilter) return false;
    return true;
  });

  const todayTrades = mockData.filter(i => dayjs(i.createdAt).isSame(dayjs(), 'day')).length;
  const totalVolume = mockData.filter(i => i.status === 'filled').reduce((sum, i) => sum + i.fillQuantity * i.executedPrice, 0);
  const avgSlippage = (mockData.filter(i => i.status === 'filled').reduce((sum, i) => sum + Math.abs(i.slippageBps), 0) / mockData.filter(i => i.status === 'filled').length).toFixed(1);
  const totalFees = mockData.reduce((sum, i) => sum + i.commission + i.fee, 0);
  const aiRatio = Math.round(mockData.filter(i => i.aiGenerated).length / mockData.length * 100);

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: TradeLog) => {
        setSelectedTrade(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'export',
      label: '导出',
      icon: <ExportOutlined />,
      onClick: (record: TradeLog) => {
        message.success(`导出交易记录 ${record.tradeId}`);
      },
    },
    {
      key: 'link',
      label: '关联订单',
      icon: <LinkOutlined />,
      onClick: (record: TradeLog) => {
        message.info(`查看关联订单 ${record.orderId}`);
      },
    },
    {
      key: 'flag',
      label: '异常标记',
      icon: <AlertOutlined />,
      danger: true,
      onClick: (record: TradeLog) => {
        message.warning(`标记交易 ${record.tradeId} 为异常`);
      },
    },
  ];

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'tradeId',
      key: 'tradeId',
      width: 170,
      render: (id: string) => <code className="text-xs">{id}</code>,
    },
    {
      title: '订单ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 130,
      render: (id: string) => <code className="text-xs text-gray-500">{id}</code>,
    },
    {
      title: '策略',
      dataIndex: 'strategyName',
      key: 'strategyName',
      width: 140,
      ellipsis: true,
    },
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 110,
      render: (s: string) => <code className="font-semibold">{s}</code>,
    },
    {
      title: '方向',
      dataIndex: 'side',
      key: 'side',
      width: 70,
      render: (side: string) => (
        <Tag color={side === 'buy' ? '#16A34A' : '#DC2626'} style={{ fontWeight: 'bold' }}>
          {side === 'buy' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 85,
      render: (type: string) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.label}</Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '委托价',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: '成交价',
      dataIndex: 'executedPrice',
      key: 'executedPrice',
      width: 95,
      render: (val: number) => val > 0 ? `$${val.toLocaleString()}` : '-',
    },
    {
      title: '成交量',
      dataIndex: 'fillQuantity',
      key: 'fillQuantity',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color as any}>{statusMap[status]?.label}</Tag>
      ),
    },
    {
      title: '滑点bp',
      dataIndex: 'slippageBps',
      key: 'slippageBps',
      width: 75,
      render: (val: number) => (
        <span className={Math.abs(val) > 10 ? 'text-red-600 font-bold' : ''}>
          {val > 0 ? '+' : ''}{val.toFixed(1)}
        </span>
      ),
    },
    {
      title: '手续费$',
      dataIndex: 'commission',
      key: 'commission',
      width: 80,
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'PnL$',
      dataIndex: 'realizedPnl',
      key: 'realizedPnl',
      width: 90,
      render: (val: number) => (
        <span className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '耗时ms',
      dataIndex: 'executionTimeMs',
      key: 'executionTimeMs',
      width: 75,
      render: (val: number) => val > 0 ? `${val}ms` : '-',
    },
    {
      title: '交易所',
      dataIndex: 'exchange',
      key: 'exchange',
      width: 85,
      render: (ex: string) => <Tag color={exchangeMap[ex] as any || 'default'}>{ex}</Tag>,
    },
    {
      title: '延迟ms',
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      width: 70,
      render: (val: number) => val > 0 ? `${val}ms` : '-',
    },
    {
      title: 'AI?',
      dataIndex: 'aiGenerated',
      key: 'aiGenerated',
      width: 60,
      render: (ai: boolean) => ai
        ? <Tag color="#F0B90B" icon={<RobotOutlined />}>是</Tag>
        : <span className="text-gray-400">否</span>,
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 155,
    },
  ];

  const mockRelatedOrders = [
    { id: 1, orderId: 'ORD-882340', time: '14:31:55', action: '创建订单', status: 'pending' },
    { id: 2, orderId: 'ORD-882341', time: '14:32:01', action: '提交交易所', status: 'submitted' },
    { id: 3, orderId: 'ORD-882341', time: '14:32:15', action: '成交确认', status: 'filled' },
  ];

  const mockSameStrategy = [
    { id: 1, tradeId: 'TRX-20240623-000', symbol: 'BTC/USDT', side: 'buy', amount: '$33,600', time: '14:20:33' },
    { id: 2, tradeId: 'TRX-20240622-088', symbol: 'BTC/USDT', side: 'sell', amount: '$16,875', time: '22:15:22' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <FileSearchOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">全量交易日志</h1>
            <p className="text-gray-500 text-sm mt-1">
              每一笔交易的可追溯记录 · 执行质量/滑点分析/成交统计 · AIOPC交易审计
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="今日交易笔数"
              value={todayTrades}
              suffix="笔"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="成交总额"
              value={`${(totalVolume / 1000000).toFixed(2)}`}
              suffix="M"
              prefix="$"
              icon={<DollarOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均滑点"
              value={avgSlippage}
              suffix="bp"
              icon={<ClockCircleOutlined />}
              color={parseFloat(avgSlippage) < 5 ? '#16A34A' : '#F59E0B'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="AI驱动占比"
              value={aiRatio}
              suffix="%"
              icon={<RobotOutlined />}
              color="#F0B90B"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select placeholder="方向" allowClear style={{ width: 100 }} value={sideFilter || undefined} onChange={setSideFilter}>
              <Select.Option value="buy">买入</Select.Option>
              <Select.Option value="sell">卖出</Select.Option>
            </Select>
            <Select placeholder="类型" allowClear style={{ width: 110 }} value={typeFilter || undefined} onChange={setTypeFilter}>
              {Object.entries(typeMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
            </Select>
            <Select placeholder="状态" allowClear style={{ width: 110 }} value={statusFilter || undefined} onChange={setStatusFilter}>
              {Object.entries(statusMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
            </Select>
            <Select placeholder="交易所" allowClear style={{ width: 110 }} value={exchangeFilter || undefined} onChange={setExchangeFilter}>
              <Select.Option value="Binance">Binance</Select.Option>
              <Select.Option value="OKX">OKX</Select.Option>
              <Select.Option value="Bybit">Bybit</Select.Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情 Modal */}
        <Modal
          title={`交易详情 - ${selectedTrade?.tradeId || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={900}
        >
          {selectedTrade && (
            <div className="space-y-6">
              {/* 交易详情 */}
              <Descriptions title="交易完整信息" bordered column={2} size="small">
                <Descriptions.Item label="交易ID" span={2}><code className="text-base">{selectedTrade.tradeId}</code></Descriptions.Item>
                <Descriptions.Item label="关联订单"><code>{selectedTrade.orderId}</code></Descriptions.Item>
                <Descriptions.Item label="执行策略">{selectedTrade.strategyName}</Descriptions.Item>
                <Descriptions.Item label="标的资产"><code className="text-base font-bold">{selectedTrade.symbol}</code></Descriptions.Item>
                <Descriptions.Item label="交易方向">
                  <Tag color={selectedTrade.side === 'buy' ? '#16A34A' : '#DC2626'} style={{ fontWeight: 'bold', fontSize: 14 }}>
                    {selectedTrade.side === 'buy' ? '买入' : '卖出'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="订单类型">
                  <Tag color={typeMap[selectedTrade.type]?.color}>{typeMap[selectedTrade.type]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="委托数量">{selectedTrade.quantity.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="委托价格">${selectedTrade.price.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="成交价格">{selectedTrade.executedPrice > 0 ? `$${selectedTrade.executedPrice.toLocaleString()}` : '-'}</Descriptions.Item>
                <Descriptions.Item label="成交量">{selectedTrade.fillQuantity.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="执行状态">
                  <Tag color={statusMap[selectedTrade.status]?.color as any}>{statusMap[selectedTrade.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="交易所"><Tag color={exchangeMap[selectedTrade.exchange] as any}>{selectedTrade.exchange}</Tag></Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedTrade.createdAt}</Descriptions.Item>
                <Descriptions.Item label="AI生成">
                  {selectedTrade.aiGenerated ? <Tag color="#F0B90B" icon={<RobotOutlined />}>AI驱动</Tag> : <span>人工下单</span>}
                </Descriptions.Item>
              </Descriptions>

              {/* 执行质量分析 */}
              <Descriptions title="执行质量分析" bordered column={3} size="small">
                <Descriptions.Item label="滑点(bp)">
                  <span className={Math.abs(selectedTrade.slippageBps) > 10 ? 'text-red-600 font-bold' : ''}>
                    {selectedTrade.slippageBps.toFixed(1)} bp
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="手续费">${selectedTrade.commission.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="其他费用">${selectedTrade.fee.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="已实现盈亏">
                  <span className={`text-lg font-bold ${selectedTrade.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTrade.realizedPnl >= 0 ? '+' : ''}${selectedTrade.realizedPnl.toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="执行耗时">{selectedTrade.executionTimeMs > 0 ? `${selectedTrade.executionTimeMs}ms` : '-'}</Descriptions.Item>
                <Descriptions.Item label="网络延迟">{selectedTrade.latencyMs > 0 ? `${selectedTrade.latencyMs}ms` : '-'}</Descriptions.Item>
              </Descriptions>

              {/* AIOPC交易评分 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC交易质量评分
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '价格执行', score: Math.max(60, 100 - Math.abs(selectedTrade.slippageBps) * 3), color: '#1677FF' },
                    { label: '时机把握', score: selectedTrade.executionTimeMs < 100 ? 92 : Math.max(50, 95 - selectedTrade.executionTimeMs / 100), color: '#16A34A' },
                    { label: '数量完成', score: selectedTrade.quantity > 0 ? (selectedTrade.fillQuantity / selectedTrade.quantity * 100) : 0, color: '#F59E0B' },
                    { label: '成本控制', score: Math.max(50, 95 - (selectedTrade.commission + selectedTrade.fee)), color: '#7C3AED' },
                    { label: '合规检查', score: 98, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={Math.min(100, item.score)}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
                <div className="mt-4 text-center">
                  <Tag color="#F0B90B" style={{ fontSize: 16, padding: '4px 16px' }}>
                    综合评分: {Math.round([88, 92, 85, 78, 98].reduce((a, b) => a + b) / 5)} / 100
                  </Tag>
                </div>
              </Card>

              {/* 关联订单 */}
              <Table
                dataSource={mockRelatedOrders}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><LinkOutlined /> 关联订单链路</span>}
                columns={[
                  { title: '时间', dataIndex: 'time', width: 100 },
                  { title: '操作', dataIndex: 'action' },
                  { title: '订单ID', dataIndex: 'orderId', render: (o: string) => <code>{o}</code> },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'filled' ? 'success' : s === 'pending' ? 'processing' : 'default'}>{s}</Tag> },
                ]}
              />

              {/* 同策略近期交易 */}
              <Table
                dataSource={mockSameStrategy}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span>同策略近期交易</span>}
                columns={[
                  { title: '交易ID', dataIndex: 'tradeId', render: (t: string) => <code className="text-xs">{t}</code>, width: 170 },
                  { title: '标的', dataIndex: 'symbol', render: (s: string) => <code>{s}</code> },
                  { title: '方向', dataIndex: 'side', render: (s: string) => <Tag color={s === 'buy' ? 'green' : 'red'}>{s === 'buy' ? '买' : '卖'}</Tag> },
                  { title: '金额', dataIndex: 'amount' },
                  { title: '时间', dataIndex: 'time', width: 100 },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
