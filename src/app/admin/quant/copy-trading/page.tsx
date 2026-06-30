'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col } from 'antd';
import {
  TeamOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  WifiOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface CopyTrade {
  id: string;
  copyId: string;
  masterTrader: string;
  followerUser: string;
  strategyName: string;
  symbol: string;
  action: 'copy_open' | 'copy_close' | 'modify';
  masterPrice: number;
  copyPrice: number;
  quantity: number;
  ratio: number;
  status: 'pending' | 'executed' | 'partial_failed' | 'cancelled';
  executionLatencyMs: number;
  slippageBps: number;
  fee: number;
  realizedPnl: number;
  copiedAt: string;
  source: 'api' | 'websocket' | 'scheduled';
}

const mockData: CopyTrade[] = [
  { id: '1', copyId: 'CPY-20240623-001', masterTrader: 'QuantKing', followerUser: 'user_0x1a2b', strategyName: '趋势跟踪Pro', symbol: 'BTC/USDT', action: 'copy_open', masterPrice: 67200, copyPrice: 67215, quantity: 0.5, ratio: 100, status: 'executed', executionLatencyMs: 85, slippageBps: 2.2, fee: 3.36, realizedPnl: 1250, copiedAt: '2024-06-23 14:32:15', source: 'websocket' },
  { id: '2', copyId: 'CPY-20240623-002', masterTrader: 'AlphaTrader', followerUser: 'user_0x3c4d', strategyName: '套利精灵', symbol: 'ETH/USDT', action: 'copy_close', masterPrice: 3450, copyPrice: 3449.5, quantity: 10, ratio: 80, status: 'executed', executionLatencyMs: 120, slippageBps: -1.4, fee: 17.25, realizedPnl: -320, copiedAt: '2024-06-23 14:28:42', source: 'api' },
  { id: '3', copyId: 'CPY-20240623-003', masterTrader: 'CryptoWhale', followerUser: 'user_0x5e6f', strategyName: '网格大师', symbol: 'SOL/USDT', action: 'modify', masterPrice: 152, copyPrice: 151.8, quantity: 100, ratio: 50, status: 'partial_failed', executionLatencyMs: 250, slippageBps: -13.2, fee: 76.50, realizedPnl: 450, copiedAt: '2024-06-23 14:15:30', source: 'websocket' },
  { id: '4', copyId: 'CPY-20240623-004', masterTrader: 'MomentumMaster', followerUser: 'user_0x7g8h', strategyName: '动量突破', symbol: 'AVAX/USDT', action: 'copy_open', masterPrice: 38.5, copyPrice: 38.55, quantity: 200, ratio: 100, status: 'executed', executionLatencyMs: 95, slippageBps: 13.0, fee: 19.30, realizedPnl: 0, copiedAt: '2024-06-23 13:58:22', source: 'api' },
  { id: '5', copyId: 'CPY-20240623-005', masterTrader: 'DeFiGuru', followerUser: 'user_0x9i0j', strategyName: 'DeFi聚合器', symbol: 'LINK/USDT', action: 'copy_close', masterPrice: 18.2, copyPrice: 0, quantity: 500, ratio: 60, status: 'cancelled', executionLatencyMs: 0, slippageBps: 0, fee: 0, realizedPnl: 0, copiedAt: '2024-06-23 13:45:18', source: 'scheduled' },
  { id: '6', copyId: 'CPY-20240623-006', masterTrader: 'QuantKing', followerUser: 'user_0x1k2l', strategyName: '趋势跟踪Pro', symbol: 'ETH/USDT', action: 'copy_open', masterPrice: 3452, copyPrice: 3451.8, quantity: 20, ratio: 100, status: 'executed', executionLatencyMs: 78, slippageBps: -5.8, fee: 69.04, realizedPnl: 560, copiedAt: '2024-06-23 13:30:05', source: 'websocket' },
  { id: '7', copyId: 'CPY-20240623-007', masterTrader: 'SmartMoney', followerUser: 'user_0x3m4n', strategyName: '聪明钱追踪', symbol: 'DOGE/USDT', action: 'copy_open', masterPrice: 0.159, copyPrice: 0.1595, quantity: 50000, ratio: 75, status: 'executed', executionLatencyMs: 180, slippageBps: 31.4, fee: 39.80, realizedPnl: -85, copiedAt: '2024-06-23 13:15:48', source: 'api' },
  { id: '8', copyId: 'CPY-20240623-008', masterTrader: 'AlphaTrader', followerUser: 'user_0x5o6p', strategyName: '套利精灵', symbol: 'BNB/USDT', action: 'copy_close', masterPrice: 598, copyPrice: 597.9, quantity: 15, ratio: 90, status: 'executed', executionLatencyMs: 110, slippageBps: -16.7, fee: 44.85, realizedPnl: 280, copiedAt: '2024-06-23 12:58:33', source: 'websocket' },
  { id: '9', copyId: 'CPY-20240622-098', masterTrader: 'CryptoWhale', followerUser: 'user_0x7q8r', strategyName: '网格大师', symbol: 'MATIC/USDT', action: 'copy_open', masterPrice: 0.715, copyPrice: 0.714, quantity: 2000, ratio: 100, status: 'executed', executionLatencyMs: 135, slippageBps: -140.0, fee: 14.28, realizedPnl: 120, copiedAt: '2024-06-22 23:58:44', source: 'scheduled' },
  { id: '10', copyId: 'CPY-20240622-097', masterTrader: 'MomentumMaster', followerUser: 'user_0x9s0t', strategyName: '动量突破', symbol: 'ARB/USDT', action: 'modify', masterPrice: 1.15, copyPrice: 1.148, quantity: 800, ratio: 70, status: 'pending', executionLatencyMs: 0, slippageBps: 0, fee: 0, realizedPnl: 0, copiedAt: '2024-06-22 23:45:12', source: 'api' },
];

const actionMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  copy_open: { label: '开仓跟单', color: '#16A34A', icon: <PlayCircleOutlined /> },
  copy_close: { label: '平仓跟单', color: '#DC2626', icon: <CloseCircleOutlined /> },
  modify: { label: '调整仓位', color: '#F59E0B', icon: <EditOutlined /> },
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待执行', color: '#1677FF' },
  executed: { label: '已执行', color: '#16A34A' },
  partial_failed: { label: '部分失败', color: '#F59E0B' },
  cancelled: { label: '已取消', color: '#9CA3AF' },
};

const sourceMap: Record<string, { label: string; color: string }> = {
  api: { label: 'API', color: '#1677FF' },
  websocket: { label: 'WebSocket', color: '#16A34A' },
  scheduled: { label: '定时任务', color: '#F59E0B' },
};

export default function CopyTradingPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState<CopyTrade | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (actionFilter && item.action !== actionFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (sourceFilter && item.source !== sourceFilter) return false;
    return true;
  });

  const todayCopies = mockData.filter(i => dayjs(i.copiedAt).isSame(dayjs(), 'day')).length;
  const successRate = Math.round(mockData.filter(i => i.status === 'executed').length / mockData.length * 100);
  const avgLatency = Math.round(mockData.filter(i => i.executionLatencyMs > 0).reduce((sum, i) => sum + i.executionLatencyMs, 0) / mockData.filter(i => i.executionLatencyMs > 0).length);
  const totalCapital = mockData.reduce((sum, i) => sum + i.quantity * i.copyPrice, 0);
  const activeTraders = [...new Set(mockData.map(i => i.masterTrader))].length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: CopyTrade) => {
        setSelectedCopy(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'execute',
      label: '手动执行',
      icon: <PlayCircleOutlined />,
      type: 'primary',
      hidden: (record: CopyTrade) => record.status !== 'pending',
      onClick: (record: CopyTrade) => {
        message.success(`手动执行跟单 ${record.copyId}`);
      },
    },
    {
      key: 'cancel',
      label: '取消',
      icon: <CloseCircleOutlined />,
      danger: true,
      hidden: (record: CopyTrade) => record.status === 'cancelled' || record.status === 'executed',
      onClick: (record: CopyTrade) => {
        message.warning(`取消跟单 ${record.copyId}`);
      },
    },
    {
      key: 'adjust',
      label: '调整参数',
      icon: <EditOutlined />,
      onClick: (record: CopyTrade) => {
        message.info(`调整跟单 ${record.copyId} 的参数`);
      },
    },
  ];

  const columns = [
    {
      title: '跟单ID',
      dataIndex: 'copyId',
      key: 'copyId',
      width: 170,
      render: (id: string) => <code className="text-xs">{id}</code>,
    },
    {
      title: '主交易员',
      dataIndex: 'masterTrader',
      key: 'masterTrader',
      width: 120,
      render: (name: string) => <span className="font-semibold text-blue-600">{name}</span>,
    },
    {
      title: '跟随用户',
      dataIndex: 'followerUser',
      key: 'followerUser',
      width: 130,
      render: (user: string) => <code className="text-xs">{user}</code>,
    },
    {
      title: '策略',
      dataIndex: 'strategyName',
      key: 'strategyName',
      width: 110,
      ellipsis: true,
    },
    {
      title: '标的',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 105,
      render: (s: string) => <code className="font-semibold">{s}</code>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 95,
      render: (action: string) => (
        <Tag color={actionMap[action]?.color as any} icon={actionMap[action]?.icon}>
          {actionMap[action]?.label}
        </Tag>
      ),
    },
    {
      title: '主交易价',
      dataIndex: 'masterPrice',
      key: 'masterPrice',
      width: 95,
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: '跟单价',
      dataIndex: 'copyPrice',
      key: 'copyPrice',
      width: 90,
      render: (val: number) => val > 0 ? `$${val.toLocaleString()}` : '-',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '比例%',
      dataIndex: 'ratio',
      key: 'ratio',
      width: 70,
      render: (val: number) => `${val}%`,
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
      title: '延迟ms',
      dataIndex: 'executionLatencyMs',
      key: 'executionLatencyMs',
      width: 80,
      render: (val: number) => val > 0 ? (
        <span className={val < 150 ? 'text-green-600' : val < 300 ? 'text-orange-500' : 'text-red-600'}>
          {val}ms
        </span>
      ) : '-',
    },
    {
      title: '滑点bp',
      dataIndex: 'slippageBps',
      key: 'slippageBps',
      width: 75,
      render: (val: number) => (
        <span className={Math.abs(val) > 50 ? 'text-red-600 font-bold' : ''}>
          {val.toFixed(1)}
        </span>
      ),
    },
    {
      title: '手续费$',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      render: (val: number) => `$${val.toFixed(2)}`,
    },
    {
      title: 'PnL$',
      dataIndex: 'realizedPnl',
      key: 'realizedPnl',
      width: 80,
      render: (val: number) => (
        <span className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 95,
      render: (src: string) => (
        <Tag color={sourceMap[src]?.color as any}>{sourceMap[src]?.label}</Tag>
      ),
    },
    {
      title: '时间',
      dataIndex: 'copiedAt',
      key: 'copiedAt',
      width: 155,
    },
  ];

  const mockMasterPerformance = [
    { date: '2024-06-23', trades: 15, winRate: 73, pnl: '+$2,850' },
    { date: '2024-06-22', trades: 18, winRate: 67, pnl: '+$1,920' },
    { date: '2024-06-21', trades: 12, winRate: 83, pnl: '+$3,450' },
  ];

  const mockHistory = [
    { id: 1, copyId: 'CPY-20240620-055', symbol: 'BTC/USDT', action: 'copy_open', result: '成功', time: '14:25:33' },
    { id: 2, copyId: 'CPY-20240619-042', symbol: 'ETH/USDT', action: 'copy_close', result: '成功', time: '10:18:22' },
    { id: 3, copyId: 'CPY-20240618-038', symbol: 'SOL/USDT', action: 'copy_open', result: '部分失败', time: '16:42:11' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <TeamOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">智能跟单交易中心</h1>
            <p className="text-gray-500 text-sm mt-1">
              实时跟单执行引擎 · 信号分发/订单拆分/滑点控制 · AIOPC跟单大脑
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="今日跟单笔数"
              value={todayCopies}
              suffix="笔"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="执行成功率"
              value={successRate}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color={successRate >= 80 ? '#16A34A' : '#F59E0B'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均延迟"
              value={avgLatency}
              suffix="ms"
              icon={<ClockCircleOutlined />}
              color={avgLatency < 150 ? '#16A34A' : avgLatency < 300 ? '#F59E0B' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="活跃交易员"
              value={activeTraders}
              suffix="位"
              icon={<TeamOutlined />}
              color="#7C3AED"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select placeholder="动作" allowClear style={{ width: 120 }} value={actionFilter || undefined} onChange={setActionFilter}>
              {Object.entries(actionMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
            </Select>
            <Select placeholder="状态" allowClear style={{ width: 120 }} value={statusFilter || undefined} onChange={setStatusFilter}>
              {Object.entries(statusMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
            </Select>
            <Select placeholder="来源" allowClear style={{ width: 120 }} value={sourceFilter || undefined} onChange={setSourceFilter}>
              {Object.entries(sourceMap).map(([key, { label }]) => (<Select.Option key={key} value={key}>{label}</Select.Option>))}
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
          title={`跟单详情 - ${selectedCopy?.copyId || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={900}
        >
          {selectedCopy && (
            <div className="space-y-6">
              {/* 跟单详情 */}
              <Descriptions title="跟单信息" bordered column={2} size="small">
                <Descriptions.Item label="跟单ID" span={2}><code className="text-base">{selectedCopy.copyId}</code></Descriptions.Item>
                <Descriptions.Item label="主交易员"><span className="font-semibold text-blue-600">{selectedCopy.masterTrader}</span></Descriptions.Item>
                <Descriptions.Item label="跟随用户"><code>{selectedCopy.followerUser}</code></Descriptions.Item>
                <Descriptions.Item label="执行策略">{selectedCopy.strategyName}</Descriptions.Item>
                <Descriptions.Item label="标的资产"><code className="font-bold">{selectedCopy.symbol}</code></Descriptions.Item>
                <Descriptions.Item label="跟单动作">
                  <Tag color={actionMap[selectedCopy.action]?.color as any} icon={actionMap[selectedCopy.action]?.icon}>
                    {actionMap[selectedCopy.action]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[selectedCopy.status]?.color as any}>{statusMap[selectedCopy.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="主交易价格">${selectedCopy.masterPrice.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="跟单成交价">{selectedCopy.copyPrice > 0 ? `$${selectedCopy.copyPrice.toLocaleString()}` : '-'}</Descriptions.Item>
                <Descriptions.Item label="跟单数量">{selectedCopy.quantity.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="复制比例">{selectedCopy.ratio}%</Descriptions.Item>
                <Descriptions.Item label="数据来源">
                  <Tag color={sourceMap[selectedCopy.source]?.color as any}>{sourceMap[selectedCopy.source]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{selectedCopy.copiedAt}</Descriptions.Item>
              </Descriptions>

              {/* 执行链路 */}
              <Card
                title={
                  <span>
                    <ApiOutlined style={{ marginRight: 8 }} />
                    执行链路分析
                  </span>
                }
                size="small"
              >
                <Row gutter={[16, 12]}>
                  <Col span={6}>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-500">信号接收</div>
                      <div className="text-lg font-bold text-blue-600">0ms</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-sm text-gray-500">订单处理</div>
                      <div className="text-lg font-bold text-yellow-600">{Math.round(selectedCopy.executionLatencyMs * 0.3)}ms</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-500">交易所提交</div>
                      <div className="text-lg font-bold text-orange-600">{Math.round(selectedCopy.executionLatencyMs * 0.5)}ms</div>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-500">成交确认</div>
                      <div className="text-lg font-bold text-green-600">{selectedCopy.executionLatencyMs}ms</div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* AIOPC跟单质量 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC跟单质量评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '及时性', score: selectedCopy.executionLatencyMs < 100 ? 95 : selectedCopy.executionLatencyMs < 200 ? 78 : 62, color: '#1677FF' },
                    { label: '准确率', score: Math.max(60, 100 - Math.abs(selectedCopy.slippageBps)), color: '#16A34A' },
                    { label: '成本控制', score: Math.max(65, 95 - selectedCopy.fee), color: '#F59E0B' },
                    { label: '风控合规', score: 92, color: '#7C3AED' },
                    { label: '稳定性', score: selectedCopy.status === 'executed' ? 88 : 55, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={item.score}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 主交易员近期表现 */}
              <Table
                dataSource={mockMasterPerformance}
                rowKey="date"
                size="small"
                pagination={false}
                title={() => <span><TeamOutlined /> 主交易员 &quot;{selectedCopy.masterTrader}&quot; 近期表现</span>}
                columns={[
                  { title: '日期', dataIndex: 'date', width: 110 },
                  { title: '交易数', dataIndex: 'trades', width: 80 },
                  { title: '胜率%', dataIndex: 'winRate', width: 80, render: (v: number) => <span className="text-green-600">{v}%</span> },
                  { title: '盈亏', dataIndex: 'pnl', render: (p: string) => <span className="font-semibold text-green-600">{p}</span> },
                ]}
              />

              {/* 历史跟单记录 */}
              <Table
                dataSource={mockHistory}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span>历史跟单记录</span>}
                columns={[
                  { title: '时间', dataIndex: 'time', width: 100 },
                  { title: '跟单ID', dataIndex: 'copyId', render: (c: string) => <code className="text-xs">{c}</code>, width: 170 },
                  { title: '标的', dataIndex: 'symbol', render: (s: string) => <code>{s}</code>, width: 110 },
                  { title: '动作', dataIndex: 'action', render: (a: string) => <Tag color={actionMap[a]?.color as any}>{actionMap[a]?.label}</Tag> },
                  { title: '结果', dataIndex: 'result', render: (r: string) => r === '成功' ? <Tag color="success">✓</Tag> : <Tag color="warning">△</Tag> },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
