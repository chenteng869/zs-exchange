/**
 * 自动化协同工作中心
 *
 * - 6大自动化引擎统一监控面板
 * - 自动化工作流管理
 * - 实时事件流
 * - 任务执行历史
 * - 跨引擎协同效果展示
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Switch as AntdSwitch,
  InputNumber,
  Descriptions,
  Badge,
  Progress,
  Alert,
  Tooltip,
  message,
  Popconfirm,
  Empty,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ApiOutlined,
  RobotOutlined,
  BlockOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  SettingOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  ENGINE_LABELS,
  ENGINE_DESCRIPTIONS,
  ENGINE_CAPABILITIES,
  type AutomationEngineId,
  type AutomationWorkflow,
  type EngineStatus,
  type EngineTask,
  type AutomationEvent,
  automationHub,
} from '@/lib/admin/automation-hub';
import {
  executeEngineAction,
  checkAllEnginesHealth,
  setEngineMode,
  type EngineActionResult,
} from '@/lib/admin/engine-adapter';

const { TextArea } = Input;
const { Option } = Select;

const engineIcons: Record<AutomationEngineId, React.ReactNode> = {
  'ai-center': <RobotOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
  blockchain: <BlockOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
  openclaw: <ThunderboltOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
  n8n: <NodeIndexOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
  'ai-llm': <ApiOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
  bpm: <NodeIndexOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
};

const engineColors: Record<AutomationEngineId, string> = {
  'ai-center': '#1890ff',
  blockchain: '#52c41a',
  openclaw: '#fa8c16',
  n8n: '#eb2f96',
  'ai-llm': '#722ed1',
  bpm: '#13c2c2',
};

const taskStatusColors: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  success: 'success',
  failed: 'error',
  cancelled: 'default',
  timeout: 'warning',
  waiting_approval: 'warning',
};

const taskStatusLabels: Record<string, string> = {
  pending: '等待中',
  running: '执行中',
  success: '成功',
  failed: '失败',
  cancelled: '已取消',
  timeout: '超时',
  waiting_approval: '待审批',
};

function AutomationHubContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(automationHub.getHubStatistics());
  const [engineStatuses, setEngineStatuses] = useState<EngineStatus[]>(
    automationHub.getAllEngineStatuses()
  );
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(
    automationHub.getAllWorkflows()
  );
  const [tasks, setTasks] = useState<EngineTask[]>([]);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AutomationWorkflow | null>(null);
  const [selectedTask, setSelectedTask] = useState<EngineTask | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // 真实引擎调用测试状态
  const [engineTestResults, setEngineTestResults] = useState<Record<AutomationEngineId, EngineActionResult | null>>({
    'ai-center': null,
    blockchain: null,
    openclaw: null,
    n8n: null,
    'ai-llm': null,
    bpm: null,
  });
  const [testingEngine, setTestingEngine] = useState<AutomationEngineId | null>(null);
  const [engineHealth, setEngineHealth] = useState<Record<AutomationEngineId, { healthy: boolean; mode: string }>>({
    'ai-center': { healthy: false, mode: 'auto' },
    blockchain: { healthy: false, mode: 'auto' },
    openclaw: { healthy: false, mode: 'auto' },
    n8n: { healthy: false, mode: 'auto' },
    'ai-llm': { healthy: false, mode: 'auto' },
    bpm: { healthy: false, mode: 'auto' },
  });

  const refresh = () => {
    setStats(automationHub.getHubStatistics());
    setEngineStatuses(automationHub.getAllEngineStatuses());
    setWorkflows(automationHub.getAllWorkflows());
    setTasks(automationHub.getAllTasks({ pageSize: 50 }).list);
    setEvents(automationHub.getRecentEvents(100));
  };

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    // 检查引擎健康状态
    checkAllEnginesHealth().then(setEngineHealth);
    return () => clearInterval(timer);
  }, []);

  // 真实引擎调用测试
  const handleTestEngine = async (engine: AutomationEngineId) => {
    setTestingEngine(engine);
    message.info(`正在测试 ${ENGINE_LABELS[engine]} 真实调用...`);

    const testActions: Record<AutomationEngineId, { action: string; input: Record<string, unknown> }> = {
      'ai-center': { action: 'analyze_risk', input: { userId: 'test-user-001', scene: 'login' } },
      blockchain: { action: 'evidence_store', input: { dataType: 'test-evidence', data: { test: true } } },
      openclaw: { action: 'execute_task', input: { taskId: 'test-task-001', params: { action: 'test' } } },
      n8n: { action: 'send_notification', input: { channel: 'email', title: '测试通知', content: '这是一条真实调用测试消息' } },
      'ai-llm': { action: 'generate_welcome', input: { userId: 'test-user-001' } },
      bpm: { action: 'start_approval', input: { type: 'test-approval', applicantId: 'test-user' } },
    };

    const testConfig = testActions[engine];

    try {
      const result = await executeEngineAction({
        engine,
        action: testConfig.action,
        input: testConfig.input,
      });

      setEngineTestResults((prev) => ({ ...prev, [engine]: result }));
      setTestingEngine(null);

      if (result.success) {
        if (result.mode === 'real') {
          message.success(`✅ ${ENGINE_LABELS[engine]} 真实调用成功 (${result.latencyMs}ms)`);
        } else {
          message.warning(`⚠️ ${ENGINE_LABELS[engine]} 使用 Mock 模式 (${result.latencyMs}ms)`);
        }
      } else {
        message.error(`❌ ${ENGINE_LABELS[engine]} 调用失败: ${result.error}`);
      }

      // 更新健康状态
      checkAllEnginesHealth().then(setEngineHealth);
    } catch (e: any) {
      setTestingEngine(null);
      message.error(`测试异常: ${e.message}`);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      automationHub.createWorkflow({
        name: values.name,
        description: values.description,
        trigger: { type: values.triggerType, eventType: values.eventType },
        steps: values.steps || [],
        enabled: values.enabled ?? true,
        approvalRequired: values.approvalRequired ?? false,
        createdBy: 'admin',
      } as any);
      message.success('工作流创建成功');
      setCreateModal(false);
      form.resetFields();
      refresh();
    } catch (e: any) {
      message.error(e.message || '创建失败');
    }
  };

  const handleTrigger = async (id: string) => {
    try {
      const result = await automationHub.triggerWorkflowManually(id, {
        triggeredBy: 'admin',
        timestamp: new Date().toISOString(),
      });
      if (result.success) {
        message.success('工作流已触发，正在异步执行');
      } else {
        message.warning('工作流触发存在问题');
      }
      setTimeout(refresh, 1000);
    } catch (e: any) {
      message.error(e.message || '触发失败');
    }
  };

  const handleToggle = (id: string, enabled: boolean) => {
    automationHub.toggleWorkflow(id, enabled);
    message.success(enabled ? '已启用' : '已停用');
    refresh();
  };

  const handleDelete = (id: string) => {
    automationHub.deleteWorkflow(id);
    message.success('已删除');
    refresh();
  };

  const handleMaintenance = (engine: AutomationEngineId, maintenance: boolean) => {
    automationHub.setEngineMaintenance(engine, maintenance);
    message.success(maintenance ? '已进入维护模式' : '已恢复服务');
    refresh();
  };

  const handleViewWorkflow = (wf: AutomationWorkflow) => {
    setSelectedWorkflow(wf);
    setDetailModal(true);
  };

  const handleViewTask = (task: EngineTask) => {
    setSelectedTask(task);
  };

  const workflowColumns = [
    {
      title: '工作流名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: '触发方式',
      key: 'trigger',
      width: 160,
      render: (_: any, record: AutomationWorkflow) => {
        if (record.trigger.type === 'event') {
          return <Tag color="blue">事件: {record.trigger.eventType}</Tag>;
        }
        if (record.trigger.type === 'schedule') {
          return <Tag color="purple">定时: {record.trigger.cron}</Tag>;
        }
        return <Tag color="default">手动</Tag>;
      },
    },
    {
      title: '步骤数',
      key: 'steps',
      width: 100,
      render: (_: any, record: AutomationWorkflow) => (
        <Tag>{record.steps.length} 步</Tag>
      ),
    },
    {
      title: '执行统计',
      key: 'stats',
      width: 200,
      render: (_: any, record: AutomationWorkflow) => {
        const rate =
          record.executionCount > 0
            ? ((record.successCount / record.executionCount) * 100).toFixed(1)
            : '0';
        return (
          <div>
            <div style={{ fontSize: 12 }}>
              总: {record.executionCount} | 成功: {record.successCount}
            </div>
            <Progress
              percent={parseFloat(rate)}
              size="small"
              status={parseFloat(rate) >= 90 ? 'success' : parseFloat(rate) >= 70 ? 'normal' : 'exception'}
            />
          </div>
        );
      },
    },
    {
      title: '需审批',
      dataIndex: 'approvalRequired',
      key: 'approvalRequired',
      width: 90,
      render: (val: boolean) =>
        val ? <Tag color="orange">是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (val: boolean) =>
        val ? <Badge status="success" text="启用" /> : <Badge status="default" text="停用" />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      fixed: 'right' as const,
      render: (_: any, record: AutomationWorkflow) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTrigger(record.id)}
          >
            触发
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewWorkflow(record)}
          >
            详情
          </Button>
          <Switch
            size="small"
            checked={record.enabled}
            onChange={(checked) => handleToggle(record.id, checked)}
          />
          <Popconfirm
            title="确认删除"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '引擎',
      dataIndex: 'engine',
      key: 'engine',
      width: 140,
      render: (val: AutomationEngineId) => (
        <Tag color={engineColors[val]}>{ENGINE_LABELS[val]}</Tag>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (val: string) => (
        <Badge
          status={taskStatusColors[val] as any}
          text={taskStatusLabels[val] || val}
        />
      ),
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (val?: number) => (val ? `${val}ms` : '-'),
    },
    {
      title: '重试',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 80,
      render: (val: number, record: EngineTask) => `${val}/${record.maxRetries}`,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: EngineTask) => (
        <Button type="link" size="small" onClick={() => handleViewTask(record)}>
          详情
        </Button>
      ),
    },
  ];

  const eventColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '事件类型',
      dataIndex: 'type',
      key: 'type',
      width: 220,
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (val: string) => <Tag>{val}</Tag>,
    },
    {
      title: 'Payload',
      dataIndex: 'payload',
      key: 'payload',
      ellipsis: true,
      render: (val: any) => (
        <code style={{ fontSize: 12 }}>{JSON.stringify(val).slice(0, 100)}</code>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Alert
        message="自动化协同工作中心"
        description="统一调度 AI分析中心 / 区块链 / OpenClaw智能体 / n8n工作流 / AI大模型 / BPM工作流引擎 六大自动化引擎，实现交易所全场景自动化协同。"
        type="info"
        showIcon
        icon={<ApiOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总工作流"
              value={stats.totalWorkflows}
              suffix={`/ 启用 ${stats.enabledWorkflows}`}
              valueStyle={{ color: '#1890ff' }}
              prefix={<NodeIndexOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总执行次数"
              value={stats.totalExecutions}
              valueStyle={{ color: '#722ed1' }}
              prefix={<SyncOutlined />}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              成功率: {stats.successRate.toFixed(1)}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行中任务"
              value={stats.runningTasks}
              suffix={`/ 待处理 ${stats.pendingTasks}`}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="在线引擎"
              value={stats.onlineEngines}
              suffix={`/ 总 ${stats.totalEngines}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <span>六大自动化引擎状态</span>
            <Tooltip title="点击引擎可进入对应管理页面">
              <Tag color="blue">实时监控</Tag>
            </Tooltip>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            刷新
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {(Object.keys(ENGINE_LABELS) as AutomationEngineId[]).map((engineId) => {
            const status = engineStatuses.find((s) => s.engine === engineId);
            if (!status) return null;
            return (
              <Col xs={24} sm={12} md={8} key={engineId}>
                <Card
                  size="small"
                  hoverable
                  style={{ borderTop: `3px solid ${engineColors[engineId]}` }}
                >
                  <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space>
                      {engineIcons[engineId]}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 15 }}>
                          {ENGINE_LABELS[engineId]}
                        </div>
                        <div style={{ fontSize: 11, color: '#999' }}>
                          v{status.version}
                        </div>
                      </div>
                    </Space>
                    <div>
                      {status.status === 'online' && (
                        <Badge status="success" text="在线" />
                      )}
                      {status.status === 'maintenance' && (
                        <Badge status="warning" text="维护" />
                      )}
                      {status.status === 'degraded' && (
                        <Badge status="error" text="降级" />
                      )}
                      {status.status === 'offline' && (
                        <Badge status="default" text="离线" />
                      )}
                    </div>
                  </Space>

                  <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                    {ENGINE_DESCRIPTIONS[engineId]}
                  </div>

                  <Row gutter={8} style={{ marginTop: 12 }}>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#999' }}>成功率</div>
                      <div style={{ fontSize: 16, color: '#52c41a' }}>
                        {(status.successRate * 100).toFixed(1)}%
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#999' }}>执行数</div>
                      <div style={{ fontSize: 16 }}>{status.totalTasks}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ fontSize: 11, color: '#999' }}>平均耗时</div>
                      <div style={{ fontSize: 16 }}>
                        {status.avgDuration > 0 ? `${Math.round(status.avgDuration)}ms` : '-'}
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 12, fontSize: 11, color: '#999' }}>
                    心跳: {dayjs(status.lastHeartbeat).format('HH:mm:ss')}
                  </div>

                  {/* 真实调用状态指示 */}
                  <div style={{ marginTop: 8, fontSize: 11 }}>
                    <Space>
                      <span style={{ color: '#999' }}>调用模式:</span>
                      {engineHealth[engineId]?.healthy ? (
                        <Tag color="green">真实可用</Tag>
                      ) : (
                        <Tag color="default">Mock 模式</Tag>
                      )}
                    </Space>
                  </div>

                  <div style={{ marginTop: 8, fontSize: 11 }}>
                    能力: {ENGINE_CAPABILITIES[engineId].slice(0, 3).join(' / ')}
                    {ENGINE_CAPABILITIES[engineId].length > 3 && ' ...'}
                  </div>

                  {/* 测试结果展示 */}
                  {engineTestResults[engineId] && (
                    <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                      <div style={{ fontSize: 12 }}>
                        <Space>
                          {engineTestResults[engineId]?.success ? (
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          ) : (
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                          )}
                          <span>
                            {engineTestResults[engineId]?.mode === 'real' ? '真实调用' : 'Mock 模式'}
                          </span>
                          <span style={{ color: '#999' }}>
                            {engineTestResults[engineId]?.latencyMs}ms
                          </span>
                        </Space>
                      </div>
                      {engineTestResults[engineId]?.chainTxHash && (
                        <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
                          链上 TxHash: {engineTestResults[engineId]?.chainTxHash?.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <Space>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => handleTestEngine(engineId)}
                        icon={<PlayCircleOutlined />}
                        loading={testingEngine === engineId}
                      >
                        真实调用测试
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleMaintenance(engineId, status.status !== 'maintenance')}
                        icon={<ToolOutlined />}
                      >
                        {status.status === 'maintenance' ? '恢复' : '维护'}
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: '工作流列表',
              children: (
                <>
                  <Space style={{ marginBottom: 16 }}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => setCreateModal(true)}
                    >
                      新建工作流
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={refresh}>
                      刷新
                    </Button>
                  </Space>
                  <Table
                    columns={workflowColumns}
                    dataSource={workflows}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1400 }}
                  />
                </>
              ),
            },
            {
              key: 'tasks',
              label: `任务执行历史 (${tasks.length})`,
              children: (
                <Table
                  columns={taskColumns}
                  dataSource={tasks}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                  size="middle"
                />
              ),
            },
            {
              key: 'events',
              label: `事件流 (${events.length})`,
              children: (
                <Table
                  columns={eventColumns}
                  dataSource={events}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                  size="small"
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="新建工作流"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="工作流名称"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="例如：用户注册智能引导" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="description"
            label="工作流描述"
            rules={[{ required: true, message: '请输入工作流描述' }]}
          >
            <TextArea rows={2} placeholder="请描述工作流的业务场景" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="triggerType"
            label="触发方式"
            rules={[{ required: true, message: '请选择触发方式' }]}
            initialValue="event"
          >
            <Select>
              <Option value="event">事件触发</Option>
              <Option value="schedule">定时触发</Option>
              <Option value="manual">手动触发</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="eventType"
            label="事件类型（事件触发时填写）"
          >
            <Input placeholder="例如：user.registered" />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="approvalRequired" label="是否需要审批" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                创建工作流
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="工作流详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedWorkflow && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工作流名称" span={2}>
                <strong>{selectedWorkflow.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedWorkflow.description}
              </Descriptions.Item>
              <Descriptions.Item label="触发方式">
                {selectedWorkflow.trigger.type === 'event'
                  ? `事件: ${selectedWorkflow.trigger.eventType}`
                  : selectedWorkflow.trigger.type === 'schedule'
                  ? `定时: ${selectedWorkflow.trigger.cron}`
                  : '手动'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedWorkflow.enabled ? (
                  <Badge status="success" text="启用" />
                ) : (
                  <Badge status="default" text="停用" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="执行统计">
                总: {selectedWorkflow.executionCount} | 成功: {selectedWorkflow.successCount} | 失败: {selectedWorkflow.failureCount}
              </Descriptions.Item>
              <Descriptions.Item label="需审批">
                {selectedWorkflow.approvalRequired ? '是' : '否'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <h4>执行步骤（按引擎协同）</h4>
              <Timeline
                items={selectedWorkflow.steps.map((step, idx) => ({
                  color: engineColors[step.engine],
                  children: (
                    <div>
                      <Space>
                        {engineIcons[step.engine]}
                        <strong>
                          步骤 {idx + 1}: {ENGINE_LABELS[step.engine]} - {step.action}
                        </strong>
                      </Space>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                        参数: {JSON.stringify(step.params)}
                      </div>
                      {step.dependsOn && step.dependsOn.length > 0 && (
                        <div style={{ marginTop: 4, fontSize: 12, color: '#fa8c16' }}>
                          依赖步骤: {step.dependsOn.join(', ')}
                        </div>
                      )}
                      {step.continueOnError && (
                        <Tag color="orange" style={{ marginTop: 4 }}>
                          失败继续
                        </Tag>
                      )}
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="任务详情"
        open={!!selectedTask}
        onCancel={() => setSelectedTask(null)}
        footer={null}
        width={700}
      >
        {selectedTask && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="任务ID" span={2}>
              <code>{selectedTask.id}</code>
            </Descriptions.Item>
            <Descriptions.Item label="任务名称" span={2}>
              {selectedTask.name}
            </Descriptions.Item>
            <Descriptions.Item label="引擎">
              <Tag color={engineColors[selectedTask.engine]}>
                {ENGINE_LABELS[selectedTask.engine]}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="操作">{selectedTask.action}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={taskStatusColors[selectedTask.status] as any}
                text={taskStatusLabels[selectedTask.status]}
              />
            </Descriptions.Item>
            <Descriptions.Item label="优先级">
              <Tag>{selectedTask.priority}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            {selectedTask.startedAt && (
              <Descriptions.Item label="开始时间" span={2}>
                {dayjs(selectedTask.startedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedTask.completedAt && (
              <Descriptions.Item label="完成时间" span={2}>
                {dayjs(selectedTask.completedAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            )}
            {selectedTask.duration !== undefined && (
              <Descriptions.Item label="耗时" span={2}>
                {selectedTask.duration}ms
              </Descriptions.Item>
            )}
            <Descriptions.Item label="重试次数">
              {selectedTask.retryCount} / {selectedTask.maxRetries}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {selectedTask.createdBy}
            </Descriptions.Item>
            {selectedTask.approvalId && (
              <Descriptions.Item label="审批ID" span={2}>
                <code>{selectedTask.approvalId}</code>
              </Descriptions.Item>
            )}
            {selectedTask.workflowId && (
              <Descriptions.Item label="工作流ID" span={2}>
                <code>{selectedTask.workflowId}</code>
              </Descriptions.Item>
            )}
            {selectedTask.result && (
              <Descriptions.Item label="执行结果" span={2}>
                <pre style={{ fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                  {JSON.stringify(selectedTask.result, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedTask.error && (
              <Descriptions.Item label="错误信息" span={2}>
                <Alert type="error" message={selectedTask.error} />
              </Descriptions.Item>
            )}
            <Descriptions.Item label="输入参数" span={2}>
              <pre style={{ fontSize: 12, maxHeight: 200, overflow: 'auto' }}>
                {JSON.stringify(selectedTask.input, null, 2)}
              </pre>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}

// 使用 dynamic + ssr:false 完全在客户端渲染
// automationHub 依赖 localStorage 和 useAuthStore，server 端无法执行
// 同时避开 hydration mismatch
function AutomationHubPage() {
  return (
    <AdminLayout>
      <AutomationHubContent />
    </AdminLayout>
  );
}

export default dynamic(() => Promise.resolve(AutomationHubPage), {
  ssr: false,
});
