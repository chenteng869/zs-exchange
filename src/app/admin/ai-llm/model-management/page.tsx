'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Typography, Tooltip, message, Popconfirm, Progress, Alert, Divider, Switch,
} from 'antd';
import {
  RobotOutlined, PlusOutlined, PlayCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, SettingOutlined,
  ThunderboltOutlined, DollarCircleOutlined, DatabaseOutlined, SafetyCertificateOutlined,
  CloudServerOutlined, ApiOutlined, LineChartOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟模型数据
const mockModels = [
  {
    id: 'MODEL-001', name: 'GPT-4o', provider: 'OpenAI', params: '1.8T', contextLength: '128K',
    status: 'active', monthlyCost: '$12,450', dailyTokens: '2.8M', totalTokens: '45.6M',
    cacheHitRate: 78.5, activeProjects: 8, version: 'gpt-4o-2024-05-13',
    description: '多模态大语言模型，支持文本、图像、音频理解与生成',
    capabilities: ['文本生成', '图像理解', '函数调用', 'JSON模式'],
  },
  {
    id: 'MODEL-002', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', params: '?', contextLength: '200K',
    status: 'active', monthlyCost: '$8,920', dailyTokens: '3.2M', totalTokens: '38.2M',
    cacheHitRate: 82.3, activeProjects: 6, version: 'claude-3-5-sonnet-20240620',
    description: '高性能对话模型，擅长长文档分析、代码编写和复杂推理',
    capabilities: ['长文本', '代码生成', '数据分析', '安全对齐'],
  },
  {
    id: 'MODEL-003', name: 'Qwen2.5-72B-Instruct', provider: '阿里云', params: '72B', contextLength: '128K',
    status: 'active', monthlyCost: '$3,450', dailyTokens: '5.6M', totalTokens: '89.4M',
    cacheHitRate: 65.8, activeProjects: 12, version: 'Qwen2.5-72B-Instruct',
    description: '开源大语言模型，中英文能力均衡，支持私有化部署',
    capabilities: ['中文优化', '多语言', '工具调用', '私有部署'],
  },
  {
    id: 'MODEL-004', name: 'DeepSeek-V2', provider: 'DeepSeek', params: '236B (MoE)', contextLength: '32K',
    status: 'active', monthlyCost: '$2,180', dailyTokens: '8.9M', totalTokens: '156.7M',
    cacheHitRate: 71.2, activeProjects: 5, version: 'deepseek-v2-0528',
    description: 'MoE架构大模型，高性价比的代码和数学能力',
    capabilities: ['MoE架构', '代码能力', '数学推理', '低成本'],
  },
  {
    id: 'MODEL-005', name: 'Gemini 1.5 Pro', provider: 'Google', params: '?', contextLength: '1M',
    status: 'inactive', monthlyCost: '$15,600', dailyTokens: '1.2M', totalTokens: '22.1M',
    cacheHitRate: 88.7, activeProjects: 0, version: 'gemini-1.5-pro-preview',
    description: '超长上下文窗口模型，支持百万级token输入',
    capabilities: ['超长上下文', '视频理解', '多模态', '原生搜索'],
  },
  {
    id: 'MODEL-006', name: 'LLaMA-3-70B', provider: 'Meta', params: '70B', contextLength: '8K',
    status: 'active', monthlyCost: '$1,890', dailyTokens: '12.3M', totalTokens: '234.5M',
    cacheHitRate: 58.4, activeProjects: 10, version: 'Meta-Llama-3-70B',
    description: 'Meta开源旗舰模型，轻量高效适合边缘部署场景',
    capabilities: ['开源免费', '高效推理', '边缘部署', '微调友好'],
  },
  {
    id: 'MODEL-007', name: 'Mistral Large', provider: 'Mistral AI', params: '176B', contextLength: '32K',
    status: 'active', monthlyCost: '$6,780', dailyTokens: '4.1M', totalTokens: '67.8M',
    cacheHitRate: 74.6, activeProjects: 4, version: 'mistral-large-latest',
    description: '欧洲顶级AI实验室出品，多语言和代码能力突出',
    capabilities: ['多语言', '代码精通', '欧洲合规', 'RAG优化'],
  },
  {
    id: 'MODEL-008', name: 'Yi-34B-200K', provider: '零一万物', params: '34B', contextLength: '200K',
    status: 'draft', monthlyCost: '-', dailyTokens: '-', totalTokens: '-',
    cacheHitRate: 0, activeProjects: 0, version: 'Yi-34B-200K',
    description: '超长上下文中文大模型，待接入测试',
    capabilities: ['超长上下文', '中文专项', '知识密集'],
  },
];

// 提供商颜色
const providerColors: Record<string, string> = {
  'OpenAI': '#10A37F',
  'Anthropic': '#D97706',
  '阿里云': '#FF6A00',
  'DeepSeek': '#2563EB',
  'Google': '#4285F4',
  'Meta': '#1877F2',
  'Mistral AI': '#F97316',
  '零一万物': '#7C3AED',
};

// 状态配置
const modelStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  active: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
  inactive: { color: 'default', text: '已停用', icon: <PauseCircleOutlined /> },
  draft: { color: 'blue', text: '草稿', icon: <EditOutlined /> },
};

export default function ModelManagementPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 统计数据
  const activeModels = mockModels.filter(m => m.status === 'active').length;
  const totalTokenCalls = mockModels.filter(m => m.totalTokens !== '-').reduce((sum, m) => sum + parseFloat(m.totalTokens.replace('M', '')), 0).toFixed(1);
  const todayTotalCost = mockModels.filter(m => m.monthlyCost !== '-').reduce((sum, m) => sum + parseFloat(m.monthlyCost.replace('$', '').replace(',', '')), 0) / 30;
  const totalActiveProjects = mockModels.reduce((sum, m) => sum + m.activeProjects, 0);
  const avgCacheHit = (mockModels.filter(m => m.cacheHitRate > 0).reduce((sum, m) => sum + m.cacheHitRate, 0) / mockModels.filter(m => m.cacheHitRate > 0).length).toFixed(1);

  const columns = [
    {
      title: '模型信息',
      key: 'model',
      width: 280,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${providerColors[record.provider]}15`, color: providerColors[record.provider] }}>
            <RobotOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="font-semibold text-base">{record.name}</div>
            <div className="text-xs text-gray-400">{record.version}</div>
          </div>
        </div>
      ),
    },
    {
      title: '提供商',
      dataIndex: 'provider',
      key: 'provider',
      width: 110,
      render: (provider: string) => (
        <Tag style={{ backgroundColor: `${providerColors[provider]}15`, borderColor: providerColors[provider], color: providerColors[provider] }}>
          {provider}
        </Tag>
      ),
    },
    {
      title: '参数量',
      dataIndex: 'params',
      key: 'params',
      width: 100,
      align: 'center',
      render: (params: string) => <Text code>{params}</Text>,
    },
    {
      title: '上下文长度',
      dataIndex: 'contextLength',
      key: 'contextLength',
      width: 110,
      render: (ctx: string) => <Tag color="blue">{ctx}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const cfg = modelStatusConfig[status];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : status;
      },
    },
    {
      title: '月费用',
      dataIndex: 'monthlyCost',
      key: 'monthlyCost',
      width: 110,
      align: 'right',
      render: (cost: string) => cost !== '-' ? <span className="font-semibold text-blue-600">{cost}</span> : <span className="text-gray-400">-</span>,
    },
    {
      title: '活跃项目',
      dataIndex: 'activeProjects',
      key: 'activeProjects',
      width: 90,
      align: 'center',
      render: (count: number) => count > 0 ? <Badge count={count} style={{ backgroundColor: '#1677FF' }} /> : <span className="text-gray-400">-</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedModel(record); setDetailModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="配置">
            <Button type="text" size="small" icon={<SettingOutlined />} className="text-orange-500" />
          </Tooltip>
          {record.status === 'active' ? (
            <Popconfirm title="停用此模型？" onConfirm={() => message.success(`${record.name} 已停用`)}>
              <Button type="text" size="small" className="text-red-500">停用</Button>
            </Popconfirm>
          ) : null}
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
            <RobotOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">模型管理</h1>
          </div>
          <Space>
            <Button icon={<SettingOutlined />}>配额设置</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>接入新模型</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="已接入模型"
              value={`${activeModels}/${mockModels.length}`}
              icon={<RobotOutlined />}
              color="#1677FF"
              description={`${mockModels.length - activeModels} 个未启用`}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="总Token调用"
              value={`${totalTokenCalls}M`}
              icon={<ThunderboltOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+18%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日费用(估)"
              value={`$${todayTotalCost.toFixed(0)}`}
              icon={<DollarCircleOutlined />}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="活跃项目"
              value={totalActiveProjects}
              icon={<DatabaseOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="缓存命中率"
              value={`${avgCacheHit}%`}
              icon={<LineChartOutlined />}
              color="#DC2626"
              suffix="%"
            />
          </Col>
        </Row>

        {/* 模型列表 */}
        <DataTable
          columns={columns as any}
          dataSource={mockModels}
          rowKey="id"
          title="LLM模型列表"
          showSearch
          searchPlaceholder="搜索模型名称或提供商..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '运行中', value: 'active' },
            { label: '已停用', value: 'inactive' },
            { label: '草稿', value: 'draft' },
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个模型` }}
        />

        {/* 提供商分布 */}
        <Card title={<span><ApiOutlined /> 提供商分布</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            {[...new Set(mockModels.map(m => m.provider))].map(provider => {
              const models = mockModels.filter(m => m.provider === provider);
              return (
                <Col key={provider} xs={12} sm={8} md={4}>
                  <div className="text-center p-4 rounded-lg border border-solid hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: `${providerColors[provider]}30` }}>
                    <div className="w-12 h-12 mx-auto rounded-full mb-2 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: providerColors[provider] }}>
                      {provider.charAt(0)}
                    </div>
                    <div className="font-semibold text-sm truncate">{provider}</div>
                    <div className="text-xs text-gray-500 mt-1">{models.length} 个模型</div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`模型详情 - ${selectedModel?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={720}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            <Button key="config" icon={<SettingOutlined />}>配置参数</Button>,
          ]}
        >
          {selectedModel && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="模型ID"><Text code>{selectedModel.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const c = modelStatusConfig[selectedModel.status]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : selectedModel.status; })()}</Descriptions.Item>
                <Descriptions.Item label="提供商" span={2}><Tag style={{ backgroundColor: `${providerColors[selectedModel.provider]}15`, borderColor: providerColors[selectedModel.provider], color: providerColors[selectedModel.provider] }}>{selectedModel.provider}</Tag></Descriptions.Item>
                <Descriptions.Item label="参数规模"><Text strong>{selectedModel.params}</Text></Descriptions.Item>
                <Descriptions.Item label="上下文长度"><Tag color="blue">{selectedModel.contextLength}</Tag></Descriptions.Item>
                <Descriptions.Item label="版本标识"><Text code>{selectedModel.version}</Text></Descriptions.Item>
                <Descriptions.Item label="月度费用"><Text className="text-blue-600 font-bold text-lg">{selectedModel.monthlyCost}</Text></Descriptions.Item>
                <Descriptions.Item label="日调用量">{selectedModel.dailyTokens !== '-' ? selectedModel.dailyTokens : '-'}</Descriptions.Item>
                <Descriptions.Item label="总调用量">{selectedModel.totalTokens !== '-' ? selectedModel.totalTokens : '-'}</Descriptions.Item>
                <Descriptions.Item label="缓存命中率" span={2}>
                  <Progress percent={Math.round(selectedModel.cacheHitRate)} strokeColor={selectedModel.cacheHitRate >= 80 ? '#16A34A' : selectedModel.cacheHitRate >= 60 ? '#1677FF' : '#F59E0B'} style={{ maxWidth: 300 }} format={percent => `${percent}%`} />
                </Descriptions.Item>
                <Descriptions.Item label="关联项目" span={2}>{selectedModel.activeProjects > 0 ? `${selectedModel.activeProjects} 个活跃项目` : '无关联项目'}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">核心能力</Divider>
              <div className="flex flex-wrap gap-2">
                {selectedModel.capabilities.map((cap: string) => (
                  <Tag key={cap} color="blue" className="!px-3 !py-1 !rounded-full">{cap}</Tag>
                ))}
              </div>

              <Divider orientation="left">模型描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedModel.description}</Paragraph>
            </div>
          )}
        </Modal>

        {/* 接入新模型弹窗 */}
        <Modal
          title="接入新模型"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          width={650}
          okText="开始接入"
          onOk={() => { message.success('模型接入请求已提交，正在进行连接测试...'); setCreateModalVisible(false); }}
        >
          <Alert type="info" showIcon className="mb-4" message="接入须知" description="请确保您拥有该模型的API访问权限，并准备好相应的API Key或端点地址。" />
          <Form layout="vertical" className="mt-4">
            <Form.Item label="模型名称" rules={[{ required: true }]}>
              <Input placeholder="例如：GPT-4o" prefix={<RobotOutlined />} />
            </Form.Item>
            <Form.Item label="提供商" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'OpenAI', value: 'openai' },
                  { label: 'Anthropic (Claude)', value: 'anthropic' },
                  { label: '阿里云 (通义千问)', value: 'alibaba' },
                  { label: 'DeepSeek', value: 'deepseek' },
                  { label: 'Google (Gemini)', value: 'google' },
                  { label: '其他 / 自定义', value: 'custom' },
                ]}
                placeholder="选择模型提供商"
              />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="API Key">
                  <Input.Password placeholder="输入API Key" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="API端点（可选）">
                  <Input placeholder="自定义端点URL" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="备注说明">
              <Input.TextArea rows={2} placeholder="描述该模型的用途和接入原因..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}

// 补充导入
import { PauseCircleOutlined } from '@ant-design/icons';
