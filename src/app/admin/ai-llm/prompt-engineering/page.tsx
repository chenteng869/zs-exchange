'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Badge, Button, Space, Modal, Form, Input, Select, Descriptions, Typography, Tooltip, message, Progress, Divider, Rate, Tabs, Alert,
} from 'antd';
import {
  EditOutlined, PlusOutlined, CopyOutlined, EyeOutlined, StarOutlined,
  ThunderboltOutlined, TeamOutlined, ExperimentOutlined, HistoryOutlined,
  SafetyCertificateOutlined, CodeOutlined, FileTextOutlined, PlayCircleOutlined,
  BranchesOutlined, CheckCircleOutlined, SwapOutlined, RocketOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟Prompt模板数据
const mockPrompts = [
  {
    id: 'PROMPT-001', name: '安全事件分析助手', category: '安全分析', model: 'GPT-4o',
    todayCalls: 2850, avgRating: 4.7, versions: 8, collaborators: 5, status: 'active',
    description: '用于分析区块链安全事件的智能Prompt模板，自动提取攻击向量、影响范围和修复建议',
    template: '你是一位资深区块链安全专家。请分析以下安全事件：\n1. 识别攻击类型和手法\n2. 评估影响范围（资金/数据）\n3. 提供具体的修复建议\n\n事件详情：{{event_data}}',
    variables: ['event_data', 'chain_type', 'time_range'],
    lastModified: '2024-06-07 14:30', author: '张伟',
  },
  {
    id: 'PROMPT-002', name: 'KYC审核报告生成器', category: '合规审核', model: 'Claude 3.5 Sonnet',
    todayCalls: 5620, avgRating: 4.9, versions: 12, collaborators: 3, status: 'active',
    description: '根据KYC审核数据自动生成结构化的合规报告，支持多语言输出',
    template: '基于以下用户身份核验结果，生成合规审核报告：\n- 用户信息：{{user_info}}\n- OCR识别结果：{{ocr_result}}\n- 人脸比对分数：{{face_score}}\n- AML筛查状态：{{aml_status}}\n\n请按以下格式输出报告...',
    variables: ['user_info', 'ocr_result', 'face_score', 'aml_status'],
    lastModified: '2024-06-08 09:15', author: '李娜',
  },
  {
    id: 'PROMPT-003', name: 'DeFi协议风险摘要', category: '金融分析', model: 'GPT-4o',
    todayCalls: 1890, avgRating: 4.5, versions: 5, collaborators: 4, status: 'active',
    description: '快速生成DeFi协议的风险评估摘要，涵盖TVL趋势、无常损失、智能合约风险等维度',
    template: '请为以下DeFi协议生成风险评估摘要：\n协议名称：{{protocol_name}}\n链上数据：{{on_chain_data}}\nTVL变化：{{tvl_change}}\n\n输出格式：风险等级(A-D) + 关键指标 + 建议',
    variables: ['protocol_name', 'on_chain_data', 'tvl_change'],
    lastModified: '2024-06-06 16:45', author: '王强',
  },
  {
    id: 'PROMPT-004', name: '客服回复优化器', category: '客户服务', model: 'Claude 3.5 Sonnet',
    todayCalls: 12450, avgRating: 4.6, versions: 15, collaborators: 8, status: 'active',
    description: '将客服草稿回复优化为专业、友好且符合品牌调性的最终版本',
    template: '请优化以下客服回复，要求：\n1. 保持专业友好的语气\n2. 符合品牌调性（{{brand_tone}}）\n3. 简洁明了，避免冗余\n\n原始回复：{{draft_reply}}\n用户问题：{{user_query}}',
    variables: ['brand_tone', 'draft_reply', 'user_query'],
    lastModified: '2024-06-08 11:20', author: '刘芳',
  },
  {
    id: 'PROMPT-005', name: '代码审查助手', category: '开发工具', model: 'Claude 3.5 Sonnet',
    todayCalls: 3200, avgRating: 4.8, versions: 6, collaborators: 6, status: 'active',
    description: '对Solidity/TypeScript代码进行自动化审查，检测安全漏洞、性能问题和编码规范违规',
    template: '请审查以下代码，关注以下方面：\n1. 安全漏洞（重入、溢出、权限等）\n2. Gas优化机会\n3. 编码规范遵循度\n\n语言：{{language}}\n代码：\n```{{code}}```',
    variables: ['language', 'code'],
    lastModified: '2024-06-07 18:00', author: '陈浩',
  },
  {
    id: 'PROMPT-006', name: 'NFT内容描述生成', category: '内容创作', model: 'GPT-4o',
    todayCalls: 4560, avgRating: 4.3, versions: 4, collaborators: 2, status: 'ab_testing',
    description: 'A/B测试中的NFT元数据描述生成模板，两个版本对比不同风格的效果',
    template: '版本A - 专业风格：\n为以下NFT作品生成专业级描述...\n\n版本B - 故事风格：\n为以下NFT作品创作引人入胜的故事背景...\n\n作品信息：{{nft_metadata}}',
    variables: ['nft_metadata'],
    lastModified: '2024-06-05 10:30', author: '周静',
  },
  {
    id: 'PROMPT-007', name: '交易异常解释器', category: '金融分析', model: 'GPT-4o',
    todayCalls: 890, avgRating: 4.4, versions: 3, collaborators: 2, status: 'active',
    description: '将复杂的交易异常数据转化为用户可理解的解释说明',
    template: '请用通俗易懂的语言解释以下交易异常：\n异常类型：{{anomaly_type}}\n涉及金额：{{amount}}\n相关地址：{{address}}\n时间线：{{timeline}}\n\n面向对象：普通用户 / 运营人员 / 技术人员',
    variables: ['anomaly_type', 'amount', 'address', 'timeline'],
    lastModified: '2024-06-04 15:10', author: '孙磊',
  },
  {
    id: 'PROMPT-008', name: '多语言内容适配', category: '内容创作', model: 'Qwen2.5-72B',
    todayCalls: 15670, avgRating: 4.2, versions: 7, collaborators: 4, status: 'active',
    description: '将中文源内容翻译并本地化为目标语言的营销文案，保持品牌一致性',
    template: '将以下内容翻译并本地化为目标语言：\n源语言：中文\n目标语言：{{target_lang}}\n产品：{{product}}\n品牌调性：{{tone}}\n\n原文：{{source_text}}\n\n注意：保留关键术语的英文原文。',
    variables: ['target_lang', 'product', 'tone', 'source_text'],
    lastModified: '2024-06-08 08:45', author: '赵敏',
  },
];

const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  active: { color: 'green', text: '活跃', icon: <CheckCircleOutlined /> },
  ab_testing: { color: 'blue', text: 'A/B测试中', icon: <ExperimentOutlined /> },
  archived: { color: 'default', text: '已归档', icon: <HistoryOutlined /> },
};

export default function PromptEngineeringPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);

  const totalTemplates = mockPrompts.length;
  const totalTodayCalls = mockPrompts.reduce((sum, p) => sum + p.todayCalls, 0);
  const avgRating = (mockPrompts.reduce((sum, p) => sum + p.avgRating, 0) / totalTemplates).toFixed(1);
  const totalVersions = mockPrompts.reduce((sum, p) => sum + p.versions, 0);
  const totalCollaborators = new Set(mockPrompts.flatMap(p => [p.author])).size;

  const columns = [
    {
      title: 'Prompt模板', key: 'prompt', width: 260,
      render: (_: any, r: any) => (<div className="flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-indigo-600"><EditOutlined style={{ fontSize: 20 }} /></div><div><div className="font-semibold text-sm">{r.name}</div><div className="text-xs text-gray-400">by {r.author} · {r.model}</div></div></div>),
    },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100, render: (c: string) => <Tag color="blue">{c}</Tag> },
    { title: '使用模型', dataIndex: 'model', key: 'model', width: 140, render: (m: string) => <Text code>{m}</Text> },
    { title: '今日调用', dataIndex: 'todayCalls', key: 'todayCalls', width: 90, align: 'right', render: (v: number) => v.toLocaleString() },
    { title: '平均评分', dataIndex: 'avgRating', key: 'avgRating', width: 120, render: (rating: number) => (<Space><Rate disabled defaultValue={rating} allowHalf count={5} className="text-xs" /><span className="text-sm">{rating}</span></Space>) },
    { title: '版本数', dataIndex: 'versions', key: 'versions', width: 80, align: 'center', render: (v: number) => <Badge count={v} style={{ backgroundColor: '#7C3AED' }} /> },
    { title: '协作者', dataIndex: 'collaborators', key: 'collaborators', width: 80, align: 'center', render: (c: number) => <TeamOutlined style={{ color: '#1677FF' }} /> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110, render: (st: string) => { const c = statusConfig[st]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : st; } },
    { title: '操作', key: 'actions', width: 120, render: (_: any, r: any) => (<Space size="small"><Tooltip title="查看"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPrompt(r); setDetailModalVisible(true); }} /></Tooltip><Tooltip title="复制"><Button type="text" size="small" icon={<CopyOutlined />} onClick={() => message.success('已复制到剪贴板')} /></Tooltip><Tooltip title="运行"><Button type="text" size="small" icon={<PlayCircleOutlined />} className="text-green-500" /></Tooltip></Space>) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><EditOutlined className="text-2xl text-blue-600" /><h1 className="text-2xl font-bold m-0">Prompt工程</h1></div>
          <Space><Button icon={<SwapOutlined />}>版本对比</Button><Button type="primary" icon={<PlusOutlined />}>新建模板</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="模板总数" value={totalTemplates} icon={<FileTextOutlined />} color="#1677FF" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="今日调用" value={totalTodayCalls.toLocaleString()} icon={<ThunderboltOutlined />} color="#16A34A" trend="up" trendValue="+25%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均评分" value={avgRating} icon={<StarOutlined />} color="#F59E0B" suffix="/5" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="版本总数" value={totalVersions} icon={<BranchesOutlined />} color="#7C3AED" description="历史迭代" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="协作者" value={totalCollaborators} icon={<TeamOutlined />} color="#DC2626" /></Col>
        </Row>

        <DataTable columns={columns as any} dataSource={mockPrompts} rowKey="id" title="Prompt模板列表" showSearch searchPlaceholder="搜索模板名称或分类..." showFilter filterOptions={[{ label: '全部状态', value: '' }, ...Object.entries(statusConfig).map(([k, v]) => ({ label: v.text, value: k }))]} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个模板` }} />

        <Card title={<span><SafetyCertificateOutlined /> 最佳实践指南</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="font-semibold mb-2 flex items-center gap-2"><CodeOutlined className="text-blue-600" />结构化设计</div><p className="text-sm text-gray-600 mb-0">使用清晰的分段和变量占位符，便于维护和复用</p></div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200"><div className="font-semibold mb-2 flex items-center gap-2"><RocketOutlined className="text-green-600" />迭代优化</div><p className="text-sm text-gray-600 mb-0">通过版本控制和A/B测试持续优化Prompt效果</p></div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200"><div className="font-semibold mb-2 flex items-center gap-2"><ExperimentOutlined className="text-purple-600" />效果度量</div><p className="text-sm text-gray-600 mb-0">建立评分体系，量化追踪每个版本的输出质量</p></div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200"><div className="font-semibold mb-2 flex items-center gap-2"><SafetyCertificateOutlined className="text-orange-600" />安全约束</div><p className="text-sm text-gray-600 mb-0">在Prompt中加入输出格式限制和安全边界条件</p></div>
            </Col>
          </Row>
        </Card>

        <Modal title={`模板详情 - ${selectedPrompt?.name}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={750} footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>, <Button key="copy" icon={<CopyOutlined />}>复制模板</Button>, <Button key="run" type="primary" icon={<PlayCircleOutlined />}>立即运行</Button>]}>
          {selectedPrompt && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="模板ID"><Text code>{selectedPrompt.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const c = statusConfig[selectedPrompt.status]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : selectedPrompt.status; })()}</Descriptions.Item>
                <Descriptions.Item label="分类"><Tag color="blue">{selectedPrompt.category}</Tag></Descriptions.Item>
                <Descriptions.Item label="模型"><Text code>{selectedPrompt.model}</Text></Descriptions.Item>
                <Descriptions.Item label="今日调用">{selectedPrompt.todayCalls.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="平均评分"><Rate disabled defaultValue={selectedPrompt.avgRating} allowHalf /> {selectedPrompt.avgRating}</Descriptions.Item>
                <Descriptions.Item label="版本数">{selectedPrompt.versions} 个版本</Descriptions.Item>
                <Descriptions.Item label="协作者">{selectedPrompt.collaborators} 人</Descriptions.Item>
                <Descriptions.Item label="作者"><Text strong>{selectedPrompt.author}</Text></Descriptions.Item>
                <Descriptions.Item label="最后修改">{selectedPrompt.lastModified}</Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">模板预览</Divider>
              <Alert type="info" showIcon message="提示" description="以下是当前版本的Prompt模板内容，变量以 {{variable}} 形式标记。" />
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">{selectedPrompt.template}</div>
              <Divider orientation="left">变量列表 ({selectedPrompt.variables.length})</Divider>
              <div className="flex flex-wrap gap-2">{selectedPrompt.variables.map((v: string) => <Tag key={v} color="orange" className="!px-3 !py-1 !font-mono">{'{'}{v}{'}'}</Tag>)}</div>
              <Divider orientation="left">描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedPrompt.description}</Paragraph>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
