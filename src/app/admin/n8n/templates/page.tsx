'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Rate, Avatar, Typography, List, Input, Select, Form, message, Divider, Descriptions, Tabs, Tooltip,
} from 'antd';
import {
  AppstoreOutlined, PlusOutlined, DownloadOutlined, EyeOutlined, StarOutlined,
  ThunderboltOutlined, FireOutlined, TrophyOutlined, CopyOutlined, CloudUploadOutlined,
  CodeOutlined, DatabaseOutlined, ApiOutlined, TeamOutlined, HeartOutlined, ArrowRightOutlined, SafetyCertificateOutlined, FileTextOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

const mockTemplates = [
  { id: 'TPL-001', name: 'Webhook → 数据库存储', category: '数据处理', author: 'n8n官方', rating: 4.9, useCount: 15680, difficulty: 'beginner', nodes: 5, description: '经典的Webhook接收数据并存入数据库的模板', tags: ['Webhook', 'MySQL', '入门推荐'], version: 'v2.1', updatedAt: '2024-06-05', preview: '接收HTTP POST → 数据格式化 → 写入MySQL → 返回确认' },
  { id: 'TPL-002', name: '定时数据同步管道', category: '数据处理', author: 'Community', rating: 4.7, useCount: 8930, difficulty: 'intermediate', nodes: 8, description: '定期从多个数据源同步到统一数仓的ETL模板', tags: ['Cron', 'ETL', 'PostgreSQL'], version: 'v1.8', updatedAt: '2024-06-03', preview: 'Cron触发 → 拉取API → 数据去重 → 合并写入 → 通知' },
  { id: 'TPL-003', name: 'AI客服工单系统', category: '客户服务', author: 'ZSDT团队', rating: 4.8, useCount: 5620, difficulty: 'advanced', nodes: 14, description: '集成LLM的智能客服，支持意图识别、知识库检索', tags: ['LLM', 'RAG', 'OpenAI'], version: 'v3.2', updatedAt: '2024-06-07', preview: '用户消息 → 意图分类 → RAG检索 → LLM回复 → 发送' },
  { id: 'TPL-004', name: '区块链事件监控', category: '区块链', author: 'Web3Dev', rating: 4.6, useCount: 3450, difficulty: 'intermediate', nodes: 7, description: '监听链上事件并推送到Discord/Telegram的通知模板', tags: ['WebSocket', 'EVM', 'DeFi'], version: 'v1.5', updatedAt: '2024-06-01', preview: 'WS连接 → 事件过滤 → 格式化 → 多渠道推送' },
  { id: 'TPL-005', name: '邮件营销自动化', category: '市场营销', author: 'MarketingPro', rating: 4.5, useCount: 12890, difficulty: 'beginner', nodes: 6, description: '基于用户行为的自动化邮件发送流程，支持A/B测试', tags: ['Email', 'SendGrid', '用户分群'], version: 'v2.0', updatedAt: '2024-05-28', preview: '行为触发 → 分群判断 → 选模板 → 发送 → 追踪' },
  { id: 'TPL-006', name: '文件处理与转换', category: '文件处理', author: 'DataEngineer', rating: 4.4, useCount: 9780, difficulty: 'intermediate', nodes: 9, description: 'CSV/Excel/JSON文件自动处理、格式转换和数据校验', tags: ['文件', 'CSV', 'Excel', '清洗'], version: 'v1.6', updatedAt: '2024-05-25', preview: '文件上传 → 格式检测 → 解析 → 校验 → 输出目标格式' },
  { id: 'TPL-007', name: 'Slack/GitHub集成', category: 'DevOps', author: 'DevTools', rating: 4.8, useCount: 18230, difficulty: 'beginner', nodes: 5, description: 'GitHub事件自动同步到Slack频道的DevOps通知模板', tags: ['GitHub', 'Slack', 'DevOps'], version: 'v2.3', updatedAt: '2024-06-06', preview: 'GitHub Webhook → 分类 → 格式化 → 发送到Slack' },
  { id: 'TPL-008', name: 'API限流与重试', category: '可靠性', author: 'ReliabilityExpert', rating: 4.7, useCount: 11240, difficulty: 'intermediate', nodes: 7, description: '处理外部API调用中的限流、超时和重试的模式模板', tags: ['限流', '重试', '错误处理'], version: 'v1.9', updatedAt: '2024-06-04', preview: '请求发送 → 错误捕获 → 限流等待 → 指数退避重试' },
  { id: 'TPL-009', name: '报表自动生成', category: '办公效率', author: 'ProductivityGuru', rating: 4.5, useCount: 7680, difficulty: 'intermediate', nodes: 10, description: '查询数据生成图表导出PDF并通过邮件发送', tags: ['报表', 'PDF', 'Chart.js'], version: 'v1.4', updatedAt: '2024-05-22', preview: 'Cron触发 → SQL查询 → 生成图表 → PDF渲染 → 邮件发送' },
  { id: 'TPL-010', name: '社媒发布矩阵', category: '市场营销', author: 'SocialMediaAI', rating: 4.3, useCount: 4560, difficulty: 'advanced', nodes: 12, description: '一键分发内容到Twitter/LinkedIn等平台', tags: ['Twitter', 'LinkedIn', 'AI改写'], version: 'v1.2', updatedAt: '2024-05-20', preview: '内容输入 → AI适配各平台 → 并行发布 → 收集链接' },
];

const categoryColors: Record<string, string> = { '数据处理': 'blue', '客户服务': 'green', '区块链': 'purple', '市场营销': 'orange', '文件处理': 'cyan', 'DevOps': 'geekblue', '可靠性': 'red', '办公效率': 'lime' };
const diffConfig: Record<string, { color: string; label: string }> = { beginner: { color: 'green', label: '入门' }, intermediate: { color: 'orange', label: '中级' }, advanced: { color: 'red', label: '高级' } };

export default function TemplatesPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [deployModalVisible, setDeployModalVisible] = useState(false);

  const totalTemplates = mockTemplates.length;
  const categories = [...new Set(mockTemplates.map(t => t.category))];
  const totalUses = mockTemplates.reduce((sum, t) => sum + t.useCount, 0);
  const avgRating = (mockTemplates.reduce((sum, t) => sum + t.rating, 0) / totalTemplates).toFixed(1);

  const columns = [
    { title: '模板信息', key: 'info', width: 280, render: (_: any, r: any) => (<div className="flex items-center gap-3"><Avatar shape="square" className="bg-gradient-to-br from-purple-100 to-pink-200" size={48} icon={<AppstoreOutlined />} /><div><div className="font-semibold text-base">{r.name}</div><div className="text-xs text-gray-400">by {r.author} · v{r.version}</div></div></div>) },
    { title: '分类', dataIndex: 'category', key: 'category', width: 110, render: (cat: string) => <Tag color={categoryColors[cat] || 'default'}>{cat}</Tag> },
    { title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 80, render: (d: string) => { const c = diffConfig[d]; return c ? <Tag color={c.color}>{c.label}</Tag> : d; } },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 120, render: (rating: number) => (<div className="flex items-center gap-1"><Rate disabled defaultValue={rating} allowHalf count={5} className="text-xs" /></div>) },
    { title: '使用次数', dataIndex: 'useCount', key: 'useCount', width: 100, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: '操作', key: 'actions', width: 140, render: (_: any, r: any) => (<Space size="small"><Tooltip title="预览"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedTemplate(r); setDetailModalVisible(true); }} /></Tooltip><Tooltip title="部署"><Button type="primary" size="small" icon={<CloudUploadOutlined />} onClick={() => { setSelectedTemplate(r); setDeployModalVisible(true); }} /></Tooltip></Space>) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><AppstoreOutlined className="text-2xl text-purple-600" /><h1 className="text-2xl font-bold m-0">模板市场</h1></div>
          <Space><Button icon={<FireOutlined />}>热门模板</Button><Button type="primary" icon={<PlusOutlined />}>发布模板</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="模板总数" value={totalTemplates} icon={<AppstoreOutlined />} color="#7C3AED" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="分类数" value={categories.length} icon={<DatabaseOutlined />} color="#1677FF" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="使用次数" value={totalUses.toLocaleString()} icon={<ThunderboltOutlined />} color="#16A34A" trend="up" trendValue="+15%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="本月新增" value={4} icon={<TrophyOutlined />} color="#F59E0B" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均评分" value={avgRating} icon={<StarOutlined />} color="#DC2626" suffix="/5" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockTemplates} rowKey="id" title="模板列表" showSearch searchPlaceholder="搜索模板名称或功能..." showFilter filterOptions={[{ label: '全部分类', value: '' }, ...categories.map(c => ({ label: c, value: c }))]} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个模板` }} />

        <Card title={<span><FireOutlined /> 最受欢迎 TOP 4</span>} className="shadow-sm">
          <List grid={{ gutter: 16, column: 4 }} dataSource={mockTemplates.sort((a, b) => b.useCount - a.useCount).slice(0, 4)} renderItem={(tpl) => (
            <List.Item><Card hoverable size="small" className="!h-full"><div className="text-center mb-3"><Avatar shape="square" className="bg-gradient-to-br from-purple-100 to-pink-200 mx-auto" size={48} icon={<AppstoreOutlined />} /></div><div className="font-semibold text-sm mb-1 truncate text-center">{tpl.name}</div><div className="flex justify-center mb-2"><Rate disabled defaultValue={tpl.rating} allowHalf count={5} className="text-xs" /></div><div className="flex justify-between items-center mb-3 px-1"><Tag color={categoryColors[tpl.category]} className="!text-xs">{tpl.category}</Tag><span className="text-xs text-gray-400">{tpl.useCount.toLocaleString()} 次</span></div><Button type="primary" size="small" block icon={<CloudUploadOutlined />}>立即部署</Button></Card></List.Item>
          )} />
        </Card>

        <Modal title={null} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={720} footer={<div className="flex justify-between w-full"><Space><Button icon={<HeartOutlined />}>收藏</Button></Space><Space><Button onClick={() => setDetailModalVisible(false)}>关闭</Button><Button type="primary" icon={<CloudUploadOutlined />} onClick={() => { setDetailModalVisible(false); setDeployModalVisible(true); }}>一键部署</Button></Space></div>}>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b"><Avatar shape="square" className="bg-gradient-to-br from-purple-100 to-pink-200" size={72} icon={<AppstoreOutlined />} /><div className="flex-1"><div className="flex items-center gap-3 mb-1"><h2 className="text-xl font-bold m-0">{selectedTemplate.name}</h2><Tag color="blue">{selectedTemplate.version}</Tag></div><Paragraph className="text-gray-500 mb-2 !mb-2">{selectedTemplate.description}</Paragraph><div className="flex items-center gap-4 flex-wrap"><Space><Rate disabled defaultValue={selectedTemplate.rating} allowHalf /></Space><span className="text-sm text-gray-400">by <Text strong>{selectedTemplate.author}</Text></span><Tag color={categoryColors[selectedTemplate.category]}>{selectedTemplate.category}</Tag>{(() => { const d = diffConfig[selectedTemplate.difficulty]; return d ? <Tag color={d.color}>{d.label}</Tag> : null; })()}</div></div></div>
              <Row gutter={16}><Col span={12}><Card size="small" title="功能标签"><div className="flex flex-wrap gap-2">{selectedTemplate.tags.map((tag: string) => <Tag key={tag} color="blue" className="!px-3 !py-1">{tag}</Tag>)}</div></Card></Col><Col span={12}><Card size="small" title="统计数据"><Descriptions column={1} size="small"><Descriptions.Item label="使用次数">{selectedTemplate.useCount.toLocaleString()}</Descriptions.Item><Descriptions.Item label="节点数量">{selectedTemplate.nodes} 个</Descriptions.Item><Descriptions.Item label="最后更新">{selectedTemplate.updatedAt}</Descriptions.Item></Descriptions></Card></Col></Row>
              <Card size="small" title={<span><CodeOutlined /> 工作流预览</span>}>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTemplate.preview.split(' → ').map((step: string, i: number, arr: string[]) => (
                      <span key={i} className="flex items-center gap-2">
                        <Tag color="purple" className="!px-3 !py-1">{step}</Tag>
                        {i < arr.length - 1 && <ArrowRightOutlined className="text-gray-400" />}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Modal>

        <Modal title="部署模板" open={deployModalVisible} onCancel={() => setDeployModalVisible(false)} onOk={() => { message.success(`模板「${selectedTemplate?.name}」部署成功！`); setDeployModalVisible(false); }} okText="确认部署">
          {selectedTemplate && (<div className="text-center py-4"><Avatar shape="square" className="bg-gradient-to-br from-purple-100 to-pink-200 mx-auto mb-3" size={64} icon={<AppstoreOutlined />} /><h3 className="text-lg font-bold mb-2">{selectedTemplate.name}</h3><p className="text-gray-500 mb-4">该模板将作为新工作流创建，您可以在编辑器中进行自定义调整。</p><div className="bg-gray-50 p-4 rounded-lg text-left"><div className="text-sm font-medium mb-2">包含以下节点：</div><div className="flex flex-wrap gap-1">{selectedTemplate.preview.split(' → ').map((step: string, i: number) => <Tag key={i} color="blue">{step}</Tag>)}</div></div></div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
