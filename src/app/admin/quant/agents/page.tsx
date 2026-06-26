'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col } from 'antd';
import {
  RobotOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  FileTextOutlined,
  DashboardOutlined,
  DollarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface AiAgent {
  id: string;
  agentName: string;
  agentType: 'momentum_agent' | 'arbitrage_agent' | 'market_maker_agent' | 'sentiment_agent' | 'portfolio_optimizer';
  modelVersion: string;
  status: 'idle' | 'running' | 'error' | 'cooldown';
  allocatedCapital: number;
  currentPnl: number;
  dailyTrades: number;
  winRate: number;
  avgHoldTimeMin: number;
  lastAction: string;
  uptimeHours: number;
  cpuUsage: number;
  memoryMB: number;
  apiCallsToday: number;
  errorCount: number;
}

const mockData: AiAgent[] = [
  { id: '1', agentName: 'Alpha动量猎手', agentType: 'momentum_agent', modelVersion: 'v3.2.1', status: 'running', allocatedCapital: 500000, currentPnl: 2.35, dailyTrades: 45, winRate: 68.5, avgHoldTimeMin: 120, lastAction: '买入 BTC/USDT', uptimeHours: 720, cpuUsage: 45, memoryMB: 512, apiCallsToday: 1250, errorCount: 0 },
  { id: '2', agentName: '跨所套利精灵', agentType: 'arbitrage_agent', modelVersion: 'v4.0.0', status: 'running', allocatedCapital: 1000000, currentPnl: 1.12, dailyTrades: 128, winRate: 85.2, avgHoldTimeMin: 5, lastAction: 'Binance→OKX价差套利', uptimeHours: 1680, cpuUsage: 78, memoryMB: 1024, apiCallsToday: 8900, errorCount: 2 },
  { id: '3', agentName: '做市机器人Pro', agentType: 'market_maker_agent', modelVersion: 'v2.8.5', status: 'running', allocatedCapital: 2000000, currentPnl: 0.89, dailyTrades: 356, winRate: 72.8, avgHoldTimeMin: 2, lastAction: '挂单 ETH/USDT', uptimeHours: 2160, cpuUsage: 92, memoryMB: 2048, apiCallsToday: 15600, errorCount: 5 },
  { id: '4', agentName: '情绪分析大师', agentType: 'sentiment_agent', modelVersion: 'v5.1.0-beta', status: 'idle', allocatedCapital: 300000, currentPnl: -0.45, dailyTrades: 12, winRate: 58.9, avgHoldTimeMin: 240, lastAction: '空仓观望', uptimeHours: 480, cpuUsage: 12, memoryMB: 256, apiCallsToday: 320, errorCount: 0 },
  { id: '5', agentName: '组合优化器V2', agentType: 'portfolio_optimizer', modelVersion: 'v3.0.2', status: 'running', allocatedCapital: 800000, currentPnl: 1.56, dailyTrades: 28, winRate: 71.3, avgHoldTimeMin: 360, lastAction: '再平衡调仓', uptimeHours: 1440, cpuUsage: 65, memoryMB: 768, apiCallsToday: 680, errorCount: 1 },
  { id: '6', agentName: '高频动量捕捉者', agentType: 'momentum_agent', modelVersion: 'v4.2.0', status: 'error', allocatedCapital: 250000, currentPnl: -2.18, dailyTrades: 0, winRate: 45.6, avgHoldTimeMin: 15, lastAction: 'API连接超时', uptimeHours: 96, cpuUsage: 5, memoryMB: 128, apiCallsToday: 0, errorCount: 15 },
  { id: '7', agentName: '三角套利专家', agentType: 'arbitrage_agent', modelVersion: 'v3.5.1', status: 'cooldown', allocatedCapital: 600000, currentPnl: 3.21, dailyTrades: 67, winRate: 79.4, avgHoldTimeMin: 3, lastAction: '冷却期等待中', uptimeHours: 1200, cpuUsage: 20, memoryMB: 384, apiCallsToday: 4200, errorCount: 0 },
  { id: '8', agentName: '社交媒体监听器', agentType: 'sentiment_agent', modelVersion: 'v2.1.0', status: 'running', allocatedCapital: 150000, currentPnl: 0.78, dailyTrades: 8, winRate: 62.1, avgHoldTimeMin: 480, lastAction: '检测到利多信号', uptimeHours: 600, cpuUsage: 35, memoryMB: 320, apiCallsToday: 180, errorCount: 0 },
  { id: '9', agentName: '智能资产配置师', agentType: 'portfolio_optimizer', modelVersion: 'v4.0.1', status: 'idle', allocatedCapital: 1500000, currentPnl: 0.00, dailyTrades: 0, winRate: 0, avgHoldTimeMin: 0, lastAction: '待命状态', uptimeHours: 24, cpuUsage: 8, memoryMB: 192, apiCallsToday: 50, errorCount: 0 },
  { id: '10', agentName: '深度做市引擎', agentType: 'market_maker_agent', modelVersion: 'v5.0.0-rc', status: 'running', allocatedCapital: 5000000, currentPnl: 1.98, dailyTrades: 520, winRate: 76.5, avgHoldTimeMin: 1, lastAction: '多币种挂单更新', uptimeHours: 3600, cpuUsage: 88, memoryMB: 4096, apiCallsToday: 28000, errorCount: 3 },
];

const agentTypeMap: Record<string, { label: string; color: string }> = {
  momentum_agent: { label: '动量代理', color: '#1677FF' },
  arbitrage_agent: { label: '套利代理', color: '#16A34A' },
  market_maker_agent: { label: '做市代理', color: '#F59E0B' },
  sentiment_agent: { label: '情绪代理', color: '#7C3AED' },
  portfolio_optimizer: { label: '组合优化', color: '#EC4899' },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  running: { label: '运行中', color: '#16A34A', icon: <CheckCircleOutlined /> },
  idle: { label: '空闲', color: '#9CA3AF', icon: <ClockCircleOutlined /> },
  error: { label: '异常', color: '#DC2626', icon: <CloseCircleOutlined /> },
  cooldown: { label: '冷却', color: '#F59E0B', icon: <WarningOutlined /> },
};

export default function AgentsPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (typeFilter && item.agentType !== typeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const totalAgents = mockData.length;
  const runningAgents = mockData.filter(i => i.status === 'running').length;
  const totalPnl = mockData.filter(i => i.status === 'running').reduce((sum, i) => sum + i.currentPnl, 0);
  const avgWinRate = mockData.filter(i => i.dailyTrades > 0).reduce((sum, i) => sum + i.winRate, 0) / mockData.filter(i => i.dailyTrades > 0).length || 0;
  const totalApiCalls = mockData.reduce((sum, i) => sum + i.apiCallsToday, 0);

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: AiAgent) => {
        setSelectedAgent(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'start',
      label: '启动',
      icon: <PlayCircleOutlined />,
      type: 'primary',
      hidden: (record: AiAgent) => record.status === 'running',
      onClick: (record: AiAgent) => {
        message.success(`Agent "${record.agentName}" 已启动`);
      },
    },
    {
      key: 'stop',
      label: '停止',
      icon: <PauseCircleOutlined />,
      danger: true,
      hidden: (record: AiAgent) => record.status !== 'running',
      onClick: (record: AiAgent) => {
        message.warning(`Agent "${record.agentName}" 已停止`);
      },
    },
    {
      key: 'restart',
      label: '重启',
      icon: <ReloadOutlined />,
      onClick: (record: AiAgent) => {
        message.info(`正在重启 Agent "${record.agentName}"`);
      },
    },
    {
      key: 'config',
      label: '配置',
      icon: <SettingOutlined />,
      onClick: (record: AiAgent) => {
        message.info(`配置 Agent "${record.agentName}"`);
      },
    },
    {
      key: 'logs',
      label: '日志',
      icon: <FileTextOutlined />,
      onClick: (record: AiAgent) => {
        message.info(`查看 Agent "${record.agentName}" 日志`);
      },
    },
  ];

  const columns = [
    {
      title: 'Agent名',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 160,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'agentType',
      key: 'agentType',
      width: 110,
      render: (type: string) => (
        <Tag color={agentTypeMap[type]?.color} style={{ fontWeight: 500 }}>
          {agentTypeMap[type]?.label}
        </Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'modelVersion',
      key: 'modelVersion',
      width: 110,
      render: (ver: string) => <code className="text-xs">{ver}</code>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusConfig[status];
        return (
          <Tag color={config?.color as any} icon={config?.icon}>
            {config?.label}
          </Tag>
        );
      },
    },
    {
      title: '配资$',
      dataIndex: 'allocatedCapital',
      key: 'allocatedCapital',
      width: 100,
      render: (val: number) => `$${(val / 10000).toFixed(1)}万`,
    },
    {
      title: '当日PnL%',
      dataIndex: 'currentPnl',
      key: 'currentPnl',
      width: 100,
      render: (val: number) => (
        <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '日交易量',
      dataIndex: 'dailyTrades',
      key: 'dailyTrades',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '胜率%',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 80,
      render: (val: number) => (val > 0 ? `${val.toFixed(1)}%` : '-'),
    },
    {
      title: '平均持仓(分)',
      dataIndex: 'avgHoldTimeMin',
      key: 'avgHoldTimeMin',
      width: 110,
      render: (val: number) => (val > 0 ? `${val}分钟` : '-'),
    },
    {
      title: '最后动作',
      dataIndex: 'lastAction',
      key: 'lastAction',
      width: 180,
      ellipsis: true,
    },
    {
      title: '运行时长',
      dataIndex: 'uptimeHours',
      key: 'uptimeHours',
      width: 90,
      render: (val: number) => `${(val / 24).toFixed(1)}天`,
    },
    {
      title: 'CPU%',
      dataIndex: 'cpuUsage',
      key: 'cpuUsage',
      width: 70,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val > 80 ? '#DC2626' : val > 50 ? '#F59E0B' : '#16A34A'}
          format={() => `${val}%`}
        />
      ),
    },
    {
      title: '内存MB',
      dataIndex: 'memoryMB',
      key: 'memoryMB',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: 'API调用',
      dataIndex: 'apiCallsToday',
      key: 'apiCallsToday',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '错误数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      width: 70,
      render: (val: number) => (
        <span className={val > 5 ? 'text-red-600 font-bold' : ''}>{val}</span>
      ),
    },
  ];

  const mockOperations = [
    { id: 1, time: '14:32:15', action: '执行买入', symbol: 'BTC/USDT', amount: 0.5, price: 67500, result: '成功' },
    { id: 2, time: '14:30:08', action: '信号检测', symbol: '-', amount: '-', price: '-', result: '检测到突破信号' },
    { id: 3, time: '14:28:42', action: '风控检查', symbol: '-', amount: '-', price: '-', result: '通过' },
  ];

  const mockErrors = [
    { id: 1, time: '10:15:33', type: 'API_TIMEOUT', message: 'Binance API响应超时 (>5s)', resolved: true },
    { id: 2, time: '09:42:18', type: 'ORDER_REJECT', message: '订单被交易所拒绝 - 余额不足', resolved: true },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <RobotOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">AI策略代理中心</h1>
            <p className="text-gray-500 text-sm mt-1">
              自主决策AI交易代理集群 · 多Agent协作/动态调仓/自适应风控 · AIOPC Agent Framework
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="Agent总数"
              value={totalAgents}
              suffix="个"
              icon={<RobotOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="运行中"
              value={runningAgents}
              suffix="个"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="今日总盈亏"
              value={`${totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}`}
              suffix="%"
              icon={<TrophyOutlined />}
              color={totalPnl >= 0 ? '#16A34A' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均胜率"
              value={avgWinRate.toFixed(1)}
              suffix="%"
              icon={<DashboardOutlined />}
              color="#7C3AED"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="Agent类型"
              allowClear
              style={{ width: 150 }}
              value={typeFilter || undefined}
              onChange={setTypeFilter}
            >
              {Object.entries(agentTypeMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="运行状态"
              allowClear
              style={{ width: 130 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
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
          title={`Agent详情 - ${selectedAgent?.agentName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={900}
        >
          {selectedAgent && (
            <div className="space-y-6">
              {/* Agent状态面板 */}
              <Descriptions title="Agent状态" bordered column={2} size="small">
                <Descriptions.Item label="名称">{selectedAgent.agentName}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={agentTypeMap[selectedAgent.agentType]?.color}>
                    {agentTypeMap[selectedAgent.agentType]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="模型版本">
                  <code>{selectedAgent.modelVersion}</code>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusConfig[selectedAgent.status]?.color as any} icon={statusConfig[selectedAgent.status]?.icon}>
                    {statusConfig[selectedAgent.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="配资金额">${selectedAgent.allocatedCapital.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="当前盈亏">
                  <span className={`font-bold text-lg ${selectedAgent.currentPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedAgent.currentPnl >= 0 ? '+' : ''}{selectedAgent.currentPnl.toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="最后动作">{selectedAgent.lastAction}</Descriptions.Item>
                <Descriptions.Item label="运行时长">{(selectedAgent.uptimeHours / 24).toFixed(1)} 天</Descriptions.Item>
              </Descriptions>

              {/* 性能指标 */}
              <Descriptions title="性能指标" bordered column={3} size="small">
                <Descriptions.Item label="日交易量" span={1}>{selectedAgent.dailyTrades} 笔</Descriptions.Item>
                <Descriptions.Item label="胜率" span={1}>
                  <span className={selectedAgent.winRate >= 70 ? 'text-green-600 font-semibold' : ''}>
                    {selectedAgent.winRate > 0 ? `${selectedAgent.winRate.toFixed(1)}%` : '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="平均持仓" span={1}>
                  {selectedAgent.avgHoldTimeMin > 0 ? `${selectedAgent.avgHoldTimeMin} 分钟` : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="CPU使用率" span={1}>
                  <Progress percent={selectedAgent.cpuUsage} size="small" />
                </Descriptions.Item>
                <Descriptions.Item label="内存占用" span={1}>{selectedAgent.memoryMB} MB</Descriptions.Item>
                <Descriptions.Item label="今日API调用" span={1}>{selectedAgent.apiCallsToday.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="错误数" span={1}>
                  <span className={selectedAgent.errorCount > 5 ? 'text-red-600 font-bold' : ''}>
                    {selectedAgent.errorCount}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {/* AIOPC Agent健康度 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC Agent健康度评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: 'CPU效率', score: Math.max(0, 100 - selectedAgent.cpuUsage), color: '#1677FF' },
                    { label: '内存健康', score: Math.max(0, 100 - selectedAgent.memoryMB / 50), color: '#16A34A' },
                    { label: '延迟表现', score: selectedAgent.status === 'running' ? 92 : 45, color: '#F59E0B' },
                    { label: '准确率', score: selectedAgent.winRate * 1.2, color: '#7C3AED' },
                    { label: '稳定性', score: selectedAgent.errorCount === 0 ? 98 : Math.max(60, 95 - selectedAgent.errorCount * 5), color: '#EC4899' },
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
                    健康评分: {Math.round([92, 88, 85, 78, 90].reduce((a, b) => a + b) / 5)} / 100
                  </Tag>
                </div>
              </Card>

              {/* 最近操作记录 */}
              <Table
                dataSource={mockOperations}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><ApiOutlined /> 最近操作记录</span>}
                columns={[
                  { title: '时间', dataIndex: 'time', width: 100 },
                  { title: '操作', dataIndex: 'action', width: 100 },
                  { title: '标的', dataIndex: 'symbol', render: (t: string) => t !== '-' ? <code>{t}</code> : '-' },
                  { title: '数量', dataIndex: 'amount', width: 80 },
                  { title: '价格', dataIndex: 'price', width: 100 },
                  { title: '结果', dataIndex: 'result', render: (r: string) => r === '成功' ? <Tag color="success">成功</Tag> : r },
                ]}
              />

              {/* 错误日志 */}
              <Table
                dataSource={mockErrors}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><WarningOutlined /> 错误日志</span>}
                columns={[
                  { title: '时间', dataIndex: 'time', width: 100 },
                  { title: '类型', dataIndex: 'type', render: (t: string) => <code className="text-xs text-red-600">{t}</code> },
                  { title: '消息', dataIndex: 'message' },
                  { title: '已解决', dataIndex: 'resolved', render: (r: boolean) => r ? <Tag color="success">是</Tag> : <Tag color="error">否</Tag> },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
