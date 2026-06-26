'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Typography, Tooltip, message, Popconfirm, Progress, Alert, Divider,
} from 'antd';
import {
  CodeOutlined, PlusOutlined, PlayCircleOutlined, SaveOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  BranchesOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, CopyOutlined,
  ThunderboltOutlined, TeamOutlined, FileTextOutlined, SettingOutlined, ApiOutlined,
  DatabaseOutlined, FilterOutlined, AppstoreOutlined, LineChartOutlined, PauseCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟工作流数据
const mockWorkflows = [
  {
    id: 'WF-001', name: '交易风控实时检测', nodeCount: 12, status: 'active',
    author: '张伟', lastModified: '2024-06-08 14:30', runsCount: 15820, successRate: 99.2,
    complexity: 'high', description: '实时监控异常交易行为，自动触发风险预警',
    nodes: ['Webhook触发', 'JSON解析', '规则引擎', '风控评分', '告警通知', '日志记录'],
  },
  {
    id: 'WF-002', name: 'NFT铸造审核流程', nodeCount: 8, status: 'active',
    author: '李娜', lastModified: '2024-06-07 16:45', runsCount: 8560, successRate: 98.7,
    complexity: 'medium', description: 'NFT作品自动审核与合规检查流水线',
    nodes: ['定时触发', '队列扫描', 'AI审核', '版权检测', '链上确认'],
  },
  {
    id: 'WF-003', name: '用户KYC自动验证', nodeCount: 15, status: 'active',
    author: '王强', lastModified: '2024-06-07 10:20', runsCount: 23500, successRate: 97.5,
    complexity: 'high', description: '多渠道身份核验与反洗钱筛查自动化',
    nodes: ['表单提交', 'OCR识别', '人脸比对', 'AML筛查', '结果通知'],
  },
  {
    id: 'WF-004', name: '结算对账日终处理', nodeCount: 20, status: 'draft',
    author: '赵敏', lastModified: '2024-06-06 09:15', runsCount: 180, successRate: 96.8,
    complexity: 'high', description: '每日交易数据汇总、对账差异分析与报告生成',
    nodes: ['Cron触发', '数据拉取', '对账计算', '差异分析', '报告生成', '邮件发送'],
  },
  {
    id: 'WF-005', name: '智能合约事件监听', nodeCount: 6, status: 'inactive',
    author: '陈浩', lastModified: '2024-06-05 18:00', runsCount: 45600, successRate: 99.8,
    complexity: 'low', description: '链上事件捕获与业务系统联动处理',
    nodes: ['WebSocket连接', '事件过滤', '数据转换', '业务处理'],
  },
  {
    id: 'WF-006', name: '多语言内容翻译管线', nodeCount: 10, status: 'active',
    author: '刘芳', lastModified: '2024-06-04 11:30', runsCount: 3200, successRate: 98.1,
    complexity: 'medium', description: 'AI驱动的内容多语言翻译与质量校验',
    nodes: ['内容输入', '语言检测', 'AI翻译', '质量评分', '人工审核', '发布'],
  },
  {
    id: 'WF-007', name: '用户行为数据分析', nodeCount: 14, status: 'active',
    author: '孙磊', lastModified: '2024-06-03 16:00', runsCount: 6780, successRate: 98.9,
    complexity: 'high', description: '采集并分析用户行为数据，输出运营洞察报告',
    nodes: ['事件收集', '数据清洗', '聚合计算', '特征提取', '模型推理', '报告输出'],
  },
  {
    id: 'WF-008', name: '邮件营销自动化', nodeCount: 7, status: 'paused',
    author: '周静', lastModified: '2024-06-02 14:20', runsCount: 1250, successRate: 97.2,
    complexity: 'medium', description: '基于用户分群的自动化邮件营销发送流程',
    nodes: ['Cron触发', '用户分群', '内容模板', '批量发送', '效果追踪'],
  },
];

// 复杂度映射
const complexityConfig: Record<string, { color: string; label: string }> = {
  high: { color: 'red', label: '高' },
  medium: { color: 'orange', label: '中' },
  low: { color: 'green', label: '低' },
};

// 状态映射
const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  active: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
  inactive: { color: 'default', text: '已停用', icon: <PauseCircleOutlined /> },
  draft: { color: 'blue', text: '草稿', icon: <EditOutlined /> },
  paused: { color: 'orange', text: '已暂停', icon: <PauseCircleOutlined /> },
};

export default function EditorPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 统计数据
  const totalWorkflows = mockWorkflows.length;
  const activeWorkflows = mockWorkflows.filter(w => w.status === 'active').length;
  const todaySaves = 5;
  const collaborators = 12;
  const autoExecutions = mockWorkflows.filter(w => w.status === 'active').reduce((sum, w) => sum + w.runsCount, 0);

  const columns = [
    {
      title: '工作流名称',
      key: 'name',
      width: 260,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
            <BranchesOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="font-semibold text-base">{record.name}</div>
            <div className="text-xs text-gray-400 mt-0.5 max-w-[170px] truncate">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: '节点数',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 80,
      align: 'center',
      render: (count: number) => (
        <Tag color={count > 12 ? 'red' : count > 8 ? 'orange' : 'blue'}>{count}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : status;
      },
    },
    {
      title: '复杂度',
      dataIndex: 'complexity',
      key: 'complexity',
      width: 80,
      render: (comp: string) => {
        const c = complexityConfig[comp];
        return c ? <Tag color={c.color}>{c.label}</Tag> : comp;
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 80,
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 140,
    },
    {
      title: '执行次数',
      dataIndex: 'runsCount',
      key: 'runsCount',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedWorkflow(record); setDetailModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} className="text-blue-500" />
          </Tooltip>
          {record.status === 'active' ? (
            <Popconfirm title="停用此工作流？" onConfirm={() => message.success(`${record.name} 已停用`)}>
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
            <CodeOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">可视化编辑器</h1>
          </div>
          <Space>
            <Button icon={<SettingOutlined />}>版本管理</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新建工作流</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="工作流总数"
              value={totalWorkflows}
              icon={<AppstoreOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="节点类型"
              value="42"
              icon={<ApiOutlined />}
              color="#1677FF"
              description="可拖拽使用"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日保存"
              value={todaySaves}
              icon={<SaveOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+2"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="协作人数"
              value={collaborators}
              icon={<TeamOutlined />}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="自动执行"
              value={autoExecutions.toLocaleString()}
              icon={<ThunderboltOutlined />}
              color="#DC2626"
              description="累计次数"
            />
          </Col>
        </Row>

        {/* 工作流列表 */}
        <DataTable
          columns={columns as any}
          dataSource={mockWorkflows}
          rowKey="id"
          title="工作流列表"
          showSearch
          searchPlaceholder="搜索工作流名称或描述..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '运行中', value: 'active' },
            { label: '草稿', value: 'draft' },
            { label: '已停用', value: 'inactive' },
            { label: '已暂停', value: 'paused' },
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个工作流` }}
        />

        {/* 节点类型库概览 */}
        <Card title={<span><DatabaseOutlined /> 常用节点类型库</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <ThunderboltOutlined className="text-red-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">触发器</div>
                <div className="text-xs text-gray-400">8 种类型</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <CodeOutlined className="text-blue-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">数据处理</div>
                <div className="text-xs text-gray-400">12 种类型</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <ApiOutlined className="text-green-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">HTTP请求</div>
                <div className="text-xs text-gray-400">6 种类型</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <DatabaseOutlined className="text-purple-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">数据库</div>
                <div className="text-xs text-gray-400">8 种类型</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <BranchesOutlined className="text-orange-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">逻辑控制</div>
                <div className="text-xs text-gray-400">5 种类型</div>
              </div>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-200 text-center cursor-pointer hover:shadow-md transition-shadow">
                <FileTextOutlined className="text-cyan-500 text-xl mb-1 block" />
                <div className="font-medium text-sm">文件处理</div>
                <div className="text-xs text-gray-400">3 种类型</div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`工作流详情 - ${selectedWorkflow?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            <Button key="edit" type="primary" icon={<EditOutlined />}>进入编辑</Button>,
          ]}
        >
          {selectedWorkflow && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="工作流ID"><Text code>{selectedWorkflow.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const cfg = statusConfig[selectedWorkflow.status]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : selectedWorkflow.status; })()}</Descriptions.Item>
                <Descriptions.Item label="复杂度">{(() => { const c = complexityConfig[selectedWorkflow.complexity]; return c ? <Tag color={c.color}>{c.label}</Tag> : selectedWorkflow.complexity; })()}</Descriptions.Item>
                <Descriptions.Item label="节点数量">{selectedWorkflow.nodeCount} 个</Descriptions.Item>
                <Descriptions.Item label="创建者"><Text strong>{selectedWorkflow.author}</Text></Descriptions.Item>
                <Descriptions.Item label="最后修改">{selectedWorkflow.lastModified}</Descriptions.Item>
                <Descriptions.Item label="总执行次数" span={2}>{selectedWorkflow.runsCount.toLocaleString()} 次</Descriptions.Item>
                <Descriptions.Item label="成功率" span={2}>
                  <Progress percent={Math.round(selectedWorkflow.successRate)} style={{ maxWidth: 300 }} strokeColor={selectedWorkflow.successRate >= 99 ? '#16A34A' : '#1677FF'} />
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">节点组成 ({selectedWorkflow.nodes.length})</Divider>
              <div className="flex flex-wrap gap-2">
                {selectedWorkflow.nodes.map((node: string, i: number) => (
                  <Tag key={i} color="purple" className="!px-3 !py-1">{node}</Tag>
                ))}
              </div>

              <Divider orientation="left">描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedWorkflow.description}</Paragraph>
            </div>
          )}
        </Modal>

        {/* 新建工作流弹窗 */}
        <Modal
          title="新建工作流"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          width={600}
          okText="创建"
          onOk={() => { message.success('工作流创建成功，即将打开编辑器'); setCreateModalVisible(false); }}
        >
          <Alert type="info" showIcon className="mb-4" message="提示" description="创建后可在可视化画布中通过拖拽节点来构建工作流逻辑。" />
          <Form layout="vertical" className="mt-4">
            <Form.Item label="工作流名称" rules={[{ required: true }]}>
              <Input placeholder="例如：交易风控实时检测" prefix={<CodeOutlined />} />
            </Form.Item>
            <Form.Item label="工作流描述">
              <Input.TextArea rows={3} placeholder="简要描述该工作流的用途..." />
            </Form.Item>
            <Form.Item label="初始模板">
              <Select
                options={[
                  { label: '空白工作流（从零开始）', value: 'blank' },
                  { label: 'Webhook 触发模板', value: 'webhook' },
                  { label: '定时任务模板', value: 'cron' },
                  { label: '数据处理管道模板', value: 'etl' },
                ]}
                placeholder="选择初始模板（可选）"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
