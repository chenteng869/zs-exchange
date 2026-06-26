'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Steps, Typography, Tooltip, message, Popconfirm, Drawer, Switch, Progress, Alert, Divider,
} from 'antd';
import {
  ApiOutlined, PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SettingOutlined,
  BranchesOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, RobotOutlined, SaveOutlined, CopyOutlined,
  TeamOutlined, ThunderboltOutlined, LineChartOutlined, SafetyCertificateOutlined, DashboardOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟工作流数据
const mockWorkflows = [
  {
    id: 'WF-001', name: '安全事件自动响应', agentCount: 5, status: 'running', complexity: 'high',
    executions: 1580, lastRun: '2024-06-08 09:25', avgDuration: '45s', successRate: 98.5,
    description: '检测到安全威胁时，自动触发风险评估→通知→响应的完整工作流',
    agents: ['SecurityGuard', 'RiskEngine', 'ComplyBot', 'Notifier', 'Logger'],
  },
  {
    id: 'WF-002', name: 'KYC自动化审核流水线', agentCount: 3, status: 'running', complexity: 'medium',
    executions: 8420, lastRun: '2024-06-08 09:00', avgDuration: '12s', successRate: 96.2,
    description: '定时扫描KYC队列，使用AI自动审核符合条件的用户申请',
    agents: ['ComplyBot', 'OCR-Engine', 'UserManager'],
  },
  {
    id: 'WF-003', name: '交易异常检测与风控', agentCount: 4, status: 'paused', complexity: 'high',
    executions: 3250, lastRun: '2024-06-07 22:15', avgDuration: '28s', successRate: 94.8,
    description: '实时监控链上交易行为，识别异常模式并触发风控措施',
    agents: ['AnomalyDetector', 'FraudScanner', 'RiskEngine', 'Blocker'],
  },
  {
    id: 'WF-004', name: '定期报告生成系统', agentCount: 2, status: 'draft', complexity: 'low',
    executions: 0, lastRun: '-', avgDuration: '-', successRate: 0,
    description: '每日/每周自动生成运营报告、安全报告和财务摘要',
    agents: ['ReportGenerator', 'EmailSender'],
  },
  {
    id: 'WF-005', name: 'NFT铸造审核流程', agentCount: 3, status: 'running', complexity: 'medium',
    executions: 562, lastRun: '2024-06-08 08:45', avgDuration: '90s', successRate: 99.1,
    description: 'NFT内容AI审核→版权检查→上链确认的全流程管理',
    agents: ['ContentModerator', 'CopyrightChecker', 'Minter'],
  },
  {
    id: 'WF-006', name: '流动性再平衡策略', agentCount: 2, status: 'stopped', complexity: 'medium',
    executions: 128, lastRun: '2024-06-05 14:20', avgDuration: '180s', successRate: 87.5,
    description: '当池子深度偏离阈值时，自动执行流动性调整策略',
    agents: ['LiquidityOptimizer', 'Trader'],
  },
  {
    id: 'WF-007', name: '智能客服路由分发', agentCount: 6, status: 'running', complexity: 'high',
    executions: 12580, lastRun: '2024-06-08 09:30', avgDuration: '8s', successRate: 99.3,
    description: '基于意图识别的智能客服工单路由，支持多渠道接入和优先级排序',
    agents: ['IntentClassifier', 'PriorityScorer', 'HumanRouter', 'BotHandler', 'FeedbackCollector', 'KnowledgeBase'],
  },
  {
    id: 'WF-008', name: '链上数据分析管道', agentCount: 4, status: 'running', complexity: 'high',
    executions: 4520, lastRun: '2024-06-08 09:10', avgDuration: '120s', successRate: 97.8,
    description: '多链数据采集→清洗→聚合→可视化的全链路数据处理',
    agents: ['DataFetcher', 'DataCleaner', 'Aggregator', 'Visualizer'],
  },
];

// 复杂度映射
const complexityMap: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: '高复杂度' },
  medium: { color: 'orange', label: '中复杂度' },
  low: { color: 'green', label: '低复杂度' },
};

// 状态映射
const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  running: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
  paused: { color: 'orange', text: '已暂停', icon: <PauseCircleOutlined /> },
  stopped: { color: 'red', text: '已停止', icon: <PauseCircleOutlined /> },
  draft: { color: 'default', text: '草稿', icon: <EditOutlined /> },
};

export default function OrchestrationPage() {
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 统计数据
  const activeWorkflows = mockWorkflows.filter(w => w.status === 'running').length;
  const totalAgents = mockWorkflows.reduce((sum, w) => sum + w.agentCount, 0);
  const todayExecutions = 342;
  const avgSuccessRate = (mockWorkflows.filter(w => w.successRate > 0).reduce((sum, w) => sum + w.successRate, 0) / mockWorkflows.filter(w => w.successRate > 0).length).toFixed(1);
  const avgDuration = '52s';

  const columns = [
    {
      title: '工作流信息',
      key: 'info',
      width: 280,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
            <BranchesOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="font-semibold text-base">{record.name}</div>
            <div className="text-xs text-gray-400 mt-0.5 max-w-[180px] truncate">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: '工作流ID',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: 'Agent数',
      dataIndex: 'agentCount',
      key: 'agentCount',
      width: 90,
      align: 'center' as const,
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#7C3AED' }} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = statusMap[status];
        return s ? <Tag color={s.color} icon={s.icon}>{s.text}</Tag> : status;
      },
    },
    {
      title: '复杂度',
      dataIndex: 'complexity',
      key: 'complexity',
      width: 100,
      render: (complexity: string) => {
        const c = complexityMap[complexity];
        return c ? <Tag color={c.color}>{c.label}</Tag> : complexity;
      },
    },
    {
      title: '执行次数',
      dataIndex: 'executions',
      key: 'executions',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 120,
      render: (rate: number) => (
        <Progress
          percent={Math.round(rate)}
          size="small"
          strokeColor={rate >= 98 ? '#16A34A' : rate >= 95 ? '#1677FF' : '#F59E0B'}
          format={percent => `${percent}%`}
        />
      ),
    },
    {
      title: '最近运行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      width: 150,
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedWorkflow(record); setDetailDrawerVisible(true); }} />
          </Tooltip>
          {record.status === 'running' ? (
            <Popconfirm title="确定暂停此工作流？" onConfirm={() => message.success(`${record.name} 已暂停`)}>
              <Button type="text" size="small" icon={<PauseCircleOutlined />} className="text-orange-500" />
            </Popconfirm>
          ) : (
            <Popconfirm title="确定启动此工作流？" onConfirm={() => message.success(`${record.name} 已启动`)}>
              <Button type="text" size="small" icon={<PlayCircleOutlined />} className="text-green-500" />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center gap-3">
          <ApiOutlined className="text-2xl text-violet-600" />
          <h1 className="text-2xl font-bold m-0">智能体编排</h1>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="活跃工作流"
              value={activeWorkflows}
              icon={<ThunderboltOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+2 本周新增"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="Agent总数"
              value={totalAgents}
              icon={<TeamOutlined />}
              color="#7C3AED"
              description="跨所有工作流"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日执行"
              value={todayExecutions}
              icon={<PlayCircleOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+18%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均成功率"
              value={`${avgSuccessRate}%`}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均耗时"
              value={avgDuration}
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
            />
          </Col>
        </Row>

        {/* 工作流列表 */}
        <DataTable
          columns={columns}
          dataSource={mockWorkflows}
          rowKey="id"
          title="编排任务列表"
          showSearch
          searchPlaceholder="搜索工作流名称或描述..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '运行中', value: 'running' },
            { label: '已暂停', value: 'paused' },
            { label: '草稿', value: 'draft' },
            { label: '已停止', value: 'stopped' },
          ]}
          showAdd
          addButtonText="新建工作流"
          onAdd={() => setCreateModalVisible(true)}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个工作流` }}
        />

        {/* 业务特性说明 */}
        <Card title={<span><SafetyCertificateOutlined /> 编排引擎特性</span>} className="shadow-sm">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <BranchesOutlined className="text-blue-600 text-lg" />
                  <span className="font-semibold">可视化编排</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">拖拽式节点编辑器，支持条件分支、并行执行、循环迭代等复杂流程控制</p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <LineChartOutlined className="text-green-600 text-lg" />
                  <span className="font-semibold">实时监控</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">全链路执行追踪，支持断点调试、性能分析和异常告警通知</p>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <DashboardOutlined className="text-purple-600 text-lg" />
                  <span className="font-semibold">版本管理</span>
                </div>
                <p className="text-sm text-gray-600 mb-0">内置版本控制系统，支持灰度发布、回滚操作和多环境部署</p>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详情抽屉 */}
        <Drawer
          title={`工作流详情 - ${selectedWorkflow?.name}`}
          open={detailDrawerVisible}
          onClose={() => setDetailDrawerVisible(false)}
          width={720}
        >
          {selectedWorkflow && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="工作流ID"><Text code>{selectedWorkflow.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const s = statusMap[selectedWorkflow.status]; return s ? <Tag color={s.color} icon={s.icon}>{s.text}</Tag> : selectedWorkflow.status; })()}</Descriptions.Item>
                <Descriptions.Item label="复杂度">{(() => { const c = complexityMap[selectedWorkflow.complexity]; return c ? <Tag color={c.color}>{c.label}</Tag> : selectedWorkflow.complexity; })()}</Descriptions.Item>
                <Descriptions.Item label="Agent数量">{selectedWorkflow.agentCount} 个</Descriptions.Item>
                <Descriptions.Item label="总执行次数">{selectedWorkflow.executions.toLocaleString()} 次</Descriptions.Item>
                <Descriptions.Item label="平均耗时">{selectedWorkflow.avgDuration}</Descriptions.Item>
                <Descriptions.Item label="成功率" span={2}>
                  <Progress percent={Math.round(selectedWorkflow.successRate)} style={{ maxWidth: 300 }} />
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">参与智能体 ({selectedWorkflow.agents.length})</Divider>
              <div className="flex flex-wrap gap-2">
                {selectedWorkflow.agents.map((agent: string, i: number) => (
                  <Tag key={i} color="purple" className="!px-3 !py-1 !text-sm !rounded-full">
                    <RobotOutlined className="mr-1" />{agent}
                  </Tag>
                ))}
              </div>

              <Divider orientation="left">工作流描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedWorkflow.description}</Paragraph>

              <Card size="small" title="快速操作">
                <Space wrap>
                  <Button type="primary" icon={<PlayCircleOutlined />} size="small">立即执行</Button>
                  <Button icon={<EditOutlined />} size="small">编辑配置</Button>
                  <Button icon={<CopyOutlined />} size="small">复制工作流</Button>
                  <Button danger icon={<DeleteOutlined />} size="small">删除</Button>
                </Space>
              </Card>
            </div>
          )}
        </Drawer>

        {/* 新建工作流弹窗 */}
        <Modal
          title="新建编排工作流"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          width={650}
          okText="创建"
          onOk={() => { message.success('工作流创建成功'); setCreateModalVisible(false); }}
        >
          <Alert type="info" showIcon className="mb-4" message="提示" description="创建后可在可视化编辑器中设计工作流的详细逻辑和Agent协作关系。" />
          <Form layout="vertical" className="mt-4">
            <Form.Item label="工作流名称" rules={[{ required: true, message: '请输入工作流名称' }]}>
              <Input placeholder="例如：安全事件自动响应" prefix={<BranchesOutlined />} />
            </Form.Item>
            <Form.Item label="工作流描述">
              <Input.TextArea rows={3} placeholder="简要描述该工作流的用途和业务场景..." />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="触发方式">
                  <Select
                    options={[
                      { label: '事件驱动', value: 'event' },
                      { label: '定时触发', value: 'schedule' },
                      { label: '实时流', value: 'realtime' },
                      { label: '手动触发', value: 'manual' },
                    ]}
                    placeholder="选择触发方式"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="初始复杂度">
                  <Select
                    options={[
                      { label: '低复杂度（1-2个Agent）', value: 'low' },
                      { label: '中复杂度（3-5个Agent）', value: 'medium' },
                      { label: '高复杂度（6+个Agent）', value: 'high' },
                    ]}
                    placeholder="预估复杂度"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
