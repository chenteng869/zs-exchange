'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Typography, Tooltip, message, Popconfirm, Progress, Alert, Divider, Switch, Table,
} from 'antd';
import {
  ThunderboltOutlined, PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ApiOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined, SyncOutlined,
  GlobalOutlined, BellOutlined, CalendarOutlined, DatabaseOutlined, SafetyCertificateOutlined,
  SettingOutlined, CopyOutlined, ReloadOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟触发器数据
const mockTriggers = [
  {
    id: 'TRIG-001', name: '安全告警Webhook', type: 'webhook', workflow: '安全事件响应', status: 'active',
    todayTriggers: 158, successRate: 99.8, avgLatency: 45, endpoint: '/webhook/security-alert',
    method: 'POST', authType: 'Bearer Token', lastTriggered: '2024-06-08 14:32:15',
    description: '接收来自安全监控系统的告警事件，触发自动化响应流程',
  },
  {
    id: 'TRIG-002', name: 'KYC定时扫描', type: 'schedule', workflow: 'KYC自动验证', status: 'active',
    todayTriggers: 96, successRate: 100, avgLatency: 120, cronExpr: '0 */30 * * * *',
    timezone: 'Asia/Shanghai', lastTriggered: '2024-06-08 14:30:00',
    description: '每30分钟扫描KYC待处理队列，自动启动身份核验流程',
  },
  {
    id: 'TRIG-003', name: '交易异常实时流', type: 'realtime', workflow: '交易风控检测', status: 'active',
    todayTriggers: 28456, successRate: 99.5, avgLatency: 12, source: 'Kafka Topic: trade-events',
    consumerGroup: 'risk-detector-v2', lastTriggered: '2024-06-08 14:33:01',
    description: '实时消费Kafka交易消息流，进行在线风险评估和异常检测',
  },
  {
    id: 'TRIG-004', name: 'NFT铸造请求', type: 'webhook', workflow: 'NFT审核流程', status: 'active',
    todayTriggers: 234, successRate: 98.7, avgLatency: 89, endpoint: '/webhook/nft-mint-request',
    method: 'POST', authType: 'API Key', lastTriggered: '2024-06-08 14:28:45',
    description: '接收NFT铸造申请，启动AI内容审核和合规检查流水线',
  },
  {
    id: 'TRIG-005', name: '日终结算调度', type: 'schedule', workflow: '结算对账处理', status: 'paused',
    todayTriggers: 0, successRate: 96.8, avgLatency: 2800, cronExpr: '0 2 * * *',
    timezone: 'UTC', lastTriggered: '2024-06-07 02:00:00',
    description: '每日凌晨2点(UTC)自动触发结算对账和报告生成任务',
  },
  {
    id: 'TRIG-006', name: '合约事件监听', type: 'blockchain', workflow: '智能合约事件', status: 'active',
    todayTriggers: 8934, successRate: 99.9, avgLatency: 8, network: 'Ethereum Mainnet',
    contractAddr: '0x7a25...3c12', events: ['Transfer', 'Approval'], lastTriggered: '2024-06-08 14:33:02',
    description: '监听指定智能合约的Transfer和Approval事件，触发业务处理',
  },
  {
    id: 'TRIG-007', name: '邮件触达回调', type: 'webhook', workflow: '邮件营销追踪', status: 'inactive',
    todayTriggers: 0, successRate: '-', avgLatency: '-', endpoint: '/webhook/email-callback',
    method: 'POST', authType: 'HMAC Signature', lastTriggered: '2024-05-20 15:22:33',
    description: '接收邮件服务商的打开/点击回调，更新用户行为数据',
  },
  {
    id: 'TRIG-008', name: '用户注册事件', type: 'database', workflow: '新用户Onboarding', status: 'active',
    todayTriggers: 567, successRate: 99.2, avgLatency: 156, table: 'users',
    operation: 'INSERT', conditions: "status = 'pending'", lastTriggered: '2024-06-08 14:31:48',
    description: '当新用户插入数据库时自动触发入职引导流程',
  },
  {
    id: 'TRIG-009', name: '价格预警轮询', type: 'schedule', workflow: '价格监控通知', status: 'active',
    todayTriggers: 288, successRate: 100, avgLatency: 35, cronExpr: '*/5 * * * *',
    timezone: 'Asia/Shanghai', lastTriggered: '2024-06-08 14:35:00',
    description: '每5分钟检查预设价格条件，满足时发送通知给订阅用户',
  },
  {
    id: 'TRIG-010', name: 'API限流重试', type: 'error', workflow: '失败重试机制', status: 'active',
    todayTriggers: 23, successRate: 87.5, avgLatency: 2500, errorType: '429 Too Many Requests',
    maxRetries: 3, backoffStrategy: 'exponential', lastTriggered: '2024-06-08 14:29:12',
    description: '当外部API返回429错误时，按指数退避策略自动重试',
  },
];

// 触发器类型配置
const triggerTypeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  webhook: { color: 'blue', label: 'Webhook', icon: <ApiOutlined /> },
  schedule: { color: 'green', label: '定时调度', icon: <CalendarOutlined /> },
  realtime: { color: 'cyan', label: '实时流', icon: <ThunderboltOutlined /> },
  blockchain: { color: 'purple', label: '区块链', icon: <GlobalOutlined /> },
  database: { color: 'orange', label: '数据库', icon: <DatabaseOutlined /> },
  error: { color: 'red', label: '错误触发', icon: <WarningOutlined /> },
};

// 状态配置
const triggerStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  active: { color: 'green', text: '活跃', icon: <SyncOutlined spin /> },
  inactive: { color: 'default', text: '已禁用', icon: <PauseCircleOutlined /> },
  paused: { color: 'orange', text: '已暂停', icon: <PauseCircleOutlined /> },
};

export default function TriggersPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 统计数据
  const totalTriggers = mockTriggers.length;
  const activeTriggers = mockTriggers.filter(t => t.status === 'active').length;
  const todayTotalTriggers = mockTriggers.reduce((sum, t) => sum + t.todayTriggers, 0);
  const avgSuccessRate = (mockTriggers.filter(t => t.successRate !== '-').reduce((sum, t) => sum + parseFloat(t.successRate as string), 0) / mockTriggers.filter(t => t.successRate !== '-').length).toFixed(1);
  const avgLatency = Math.round(mockTriggers.filter(t => typeof t.avgLatency === 'number').reduce((sum, t) => sum + (t.avgLatency as number), 0) / mockTriggers.filter(t => typeof t.avgLatency === 'number').length);

  const columns = [
    {
      title: '触发器信息',
      key: 'info',
      width: 260,
      render: (_: any, record: any) => {
        const typeCfg = triggerTypeConfig[record.type];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
              record.type === 'webhook' ? 'bg-blue-100 text-blue-600' :
              record.type === 'schedule' ? 'bg-green-100 text-green-600' :
              record.type === 'realtime' ? 'bg-cyan-100 text-cyan-600' :
              record.type === 'blockchain' ? 'bg-purple-100 text-purple-600' :
              record.type === 'database' ? 'bg-orange-100 text-orange-600' :
              'bg-red-100 text-red-600'
            }`}>
              {typeCfg?.icon || <ThunderboltOutlined />}
            </div>
            <div>
              <div className="font-semibold text-base">{record.name}</div>
              <div className="text-xs text-gray-400">{record.workflow}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '触发类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => {
        const cfg = triggerTypeConfig[type];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag> : type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const cfg = triggerStatusConfig[status];
        return cfg ? <Badge status={cfg.color as any} text={<span className="flex items-center gap-1">{cfg.icon}{cfg.text}</span>} /> : status;
      },
    },
    {
      title: '今日触发',
      dataIndex: 'todayTriggers',
      key: 'todayTriggers',
      width: 90,
      align: 'right' as const,
      render: (val: number) => val > 0 ? val.toLocaleString() : <span className="text-gray-400">-</span>,
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 90,
      align: 'right' as const,
      render: (rate: string | number) => rate !== '-' ? (
        <span className={parseFloat(rate as string) >= 99 ? 'text-green-600 font-semibold' : parseFloat(rate as string) >= 95 ? 'text-orange-500' : 'text-red-500'}>
          {rate}%
        </span>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      title: '平均延迟(ms)',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      align: 'right' as const,
      render: (latency: number | string) => latency !== '-' ? (
        <span className={typeof latency === 'number' && latency < 100 ? 'text-green-600' : typeof latency === 'number' && latency < 1000 ? 'text-orange-500' : 'text-red-500'}>
          {latency}ms
        </span>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      title: '最近触发',
      dataIndex: 'lastTriggered',
      key: 'lastTriggered',
      width: 150,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedTrigger(record); setDetailModalVisible(true); }} />
          </Tooltip>
          {record.status === 'active' ? (
            <Popconfirm title="禁用此触发器？" onConfirm={() => message.success(`${record.name} 已禁用`)}>
              <Button type="text" size="small" icon={<PauseCircleOutlined />} className="text-orange-500" />
            </Popconfirm>
          ) : (
            <Tooltip title="启用">
              <Button type="text" size="small" icon={<PlayCircleOutlined />} className="text-green-500" />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ThunderboltOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">触发器管理</h1>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新状态</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新建触发器</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="触发器总数"
              value={totalTriggers}
              icon={<ThunderboltOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="活跃数"
              value={activeTriggers}
              icon={<SyncOutlined />}
              color="#16A34A"
              trend="up"
              trendValue={`${Math.round(activeTriggers / totalTriggers * 100)}% 占比`}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日触发"
              value={todayTotalTriggers.toLocaleString()}
              icon={<BellOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+12%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="成功率"
              value={`${avgSuccessRate}%`}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均延迟"
              value={`${avgLatency}ms`}
              icon={<ClockCircleOutlined />}
              color={avgLatency < 100 ? '#16A34A' : '#F59E0B'}
            />
          </Col>
        </Row>

        {/* 触发器列表 */}
        <DataTable
          columns={columns}
          dataSource={mockTriggers}
          rowKey="id"
          title="触发器列表"
          showSearch
          searchPlaceholder="搜索触发器名称..."
          showFilter
          filterOptions={[
            { label: '全部类型', value: '' },
            ...Object.entries(triggerTypeConfig).map(([k, v]) => ({ label: v.label, value: k })),
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个触发器` }}
        />

        {/* 触发类型分布 */}
        <Card title={<span><SafetyCertificateOutlined /> 触发类型分布</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            {Object.entries(triggerTypeConfig).map(([key, config]) => {
              const count = mockTriggers.filter(t => t.type === key).length;
              const percent = Math.round((count / totalTriggers) * 100);
              return (
                <Col key={key} xs={12} sm={8} md={4}>
                  <div className="text-center p-4 rounded-lg border" style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}08` }}>
                    <div className="text-2xl font-bold" style={{ color: config.color }}>{count}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {config.icon}
                      <span className="text-sm text-gray-600">{config.label}</span>
                    </div>
                    <Progress percent={percent} size="small" strokeColor={config.color} className="mt-2" format={() => `${percent}%`} />
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`触发器详情 - ${selectedTrigger?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            <Button key="edit" type="primary" icon={<EditOutlined />}>编辑配置</Button>,
          ]}
        >
          {selectedTrigger && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="触发器ID"><Text code>{selectedTrigger.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const cfg = triggerStatusConfig[selectedTrigger.status]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : selectedTrigger.status; })()}</Descriptions.Item>
                <Descriptions.Item label="触发类型" span={2}>{(() => { const cfg = triggerTypeConfig[selectedTrigger.type]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag> : selectedTrigger.type; })()}</Descriptions.Item>
                <Descriptions.Item label="关联工作流" span={2}><Text strong>{selectedTrigger.workflow}</Text></Descriptions.Item>
                <Descriptions.Item label="今日触发次数">{selectedTrigger.todayTriggers.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="成功率"><Text strong className={parseFloat(selectedTrigger.successRate as string) >= 99 ? 'text-green-600' : 'text-orange-500'}>{selectedTrigger.successRate}%</Text></Descriptions.Item>
                <Descriptions.Item label="平均延迟">{selectedTrigger.avgLatency !== '-' ? `${selectedTrigger.avgLatency}ms` : '-'}</Descriptions.Item>
                <Descriptions.Item label="最近触发时间">{selectedTrigger.lastTriggered}</Descriptions.Item>
              </Descriptions>

              {selectedTrigger.endpoint && (
                <>
                  <Divider orientation="left">端点配置</Divider>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                    <div><Text className="text-gray-400">Method:</Text> {selectedTrigger.method}</div>
                    <div><Text className="text-gray-400">Endpoint:</Text> https://api.n8n.example.com{selectedTrigger.endpoint}</div>
                    <div><Text className="text-gray-400">Auth:</Text> {selectedTrigger.authType}</div>
                  </div>
                </>
              )}

              {selectedTrigger.cronExpr && (
                <>
                  <Divider orientation="left">调度配置</Divider>
                  <div className="space-y-2">
                    <div><Text strong>Cron表达式:</Text> <Text code>{selectedTrigger.cronExpr}</Text></div>
                    <div><Text strong>时区:</Text> {selectedTrigger.timezone}</div>
                  </div>
                </>
              )}

              <Divider orientation="left">描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedTrigger.description}</Paragraph>
            </div>
          )}
        </Modal>

        {/* 新建触发器弹窗 */}
        <Modal
          title="新建触发器"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          width={650}
          okText="创建"
          onOk={() => { message.success('触发器创建成功'); setCreateModalVisible(false); }}
        >
          <Form layout="vertical" className="mt-4">
            <Form.Item label="触发器名称" rules={[{ required: true }]}>
              <Input placeholder="例如：安全告警Webhook" prefix={<ThunderboltOutlined />} />
            </Form.Item>
            <Form.Item label="触发类型" rules={[{ required: true }]}>
              <Select
                options={Object.entries(triggerTypeConfig).map(([k, v]) => ({ label: v.label, value: k }))}
                placeholder="选择触发类型"
              />
            </Form.Item>
            <Form.Item label="关联工作流" rules={[{ required: true }]}>
              <Select
                options={mockWorkflows.map(w => ({ label: w.name, value: w.id }))}
                placeholder="选择要触发的工作流"
              />
            </Form.Item>
            <Form.Item label="描述">
              <Input.TextArea rows={3} placeholder="描述该触发器的用途和触发条件..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

// 补充引用
const mockWorkflows = [
  { id: 'WF-001', name: '安全事件响应' },
  { id: 'WF-002', name: 'KYC自动验证' },
  { id: 'WF-003', name: '交易风控检测' },
  { id: 'WF-004', name: 'NFT审核流程' },
  { id: 'WF-005', name: '结算对账处理' },
  { id: 'WF-006', name: '智能合约事件' },
  { id: 'WF-007', name: '邮件营销追踪' },
  { id: 'WF-008', name: '新用户Onboarding' },
  { id: 'WF-009', name: '价格监控通知' },
  { id: 'WF-010', name: '失败重试机制' },
];
