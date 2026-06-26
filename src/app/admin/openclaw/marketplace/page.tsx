'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Rate, Avatar, Typography, List, Badge, Input, Select, Form, message, Divider, Descriptions, Progress, Tabs, Empty, Tooltip, Pagination,
} from 'antd';
import {
  ShopOutlined, StarOutlined, DownloadOutlined, ShoppingCartOutlined, EyeOutlined, ApiOutlined, UserOutlined,
  ThunderboltOutlined, DollarOutlined, PlusOutlined, SearchOutlined, FilterOutlined, HeartOutlined,
  MessageOutlined, UploadOutlined, CheckCircleOutlined, ClockCircleOutlined, TrophyOutlined, FireOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟Agent市场数据
const mockAgents = [
  {
    id: 'AGENT-001', name: 'SecurityGuard Pro', developer: 'ZSDT AI Lab', category: '安全防护',
    rating: 4.8, reviewCount: 256, downloads: 3850, price: '$299/月', priceValue: 299,
    description: '企业级区块链安全智能体，支持实时威胁检测、漏洞扫描、攻击模式识别',
    tags: ['安全', '实时监控', '威胁检测'], version: 'v4.2.0', updatedAt: '2024-06-05', subscribers: 1280,
  },
  {
    id: 'AGENT-002', name: 'DeFi Risk Analyst', developer: 'FinTech Solutions', category: '金融分析',
    rating: 4.6, reviewCount: 182, downloads: 2680, price: '$199/月', priceValue: 199,
    description: '专业DeFi协议风险量化分析，支持无常损失预测、清算风险评估、TVL趋势建模',
    tags: ['DeFi', '风险管理', '量化分析'], version: 'v3.1.0', updatedAt: '2024-06-03', subscribers: 856,
  },
  {
    id: 'AGENT-003', name: 'NLP Customer Service', developer: 'ChatAI Inc.', category: '客户服务',
    rating: 4.9, reviewCount: 520, downloads: 6720, price: '$149/月', priceValue: 149,
    description: '多语言智能客服机器人，支持Web3场景问答、交易指导、故障排查',
    tags: ['NLP', '客服', '多语言'], version: 'v2.5.0', updatedAt: '2024-06-07', subscribers: 2450,
  },
  {
    id: 'AGENT-004', name: 'Smart Contract Auditor', developer: 'AuditChain', category: '安全审计',
    rating: 4.7, reviewCount: 98, downloads: 1240, price: '$499/月', priceValue: 499,
    description: 'Solidity智能合约自动化审计工具，支持常见漏洞模式检测、Gas优化建议',
    tags: ['合约审计', 'Solidity', '静态分析'], version: 'v2.0.0', updatedAt: '2024-06-01', subscribers: 420,
  },
  {
    id: 'AGENT-005', name: 'Price Prediction Engine', developer: 'QuantAlpha', category: '市场分析',
    rating: 4.3, reviewCount: 145, downloads: 980, price: '$399/月', priceValue: 399,
    description: '加密货币价格预测引擎，融合技术指标、链上数据、情绪分析的多因子模型',
    tags: ['价格预测', '机器学习', '市场分析'], version: 'v1.8.0', updatedAt: '2024-05-28', subscribers: 678,
  },
  {
    id: 'AGENT-006', name: 'Identity Verifier', developer: 'ComplyTech', category: '合规验证',
    rating: 4.5, reviewCount: 76, downloads: 1890, price: '$179/月', priceValue: 179,
    description: '去中心化身份核验智能体，支持KYC/AML文档OCR识别、人脸比对',
    tags: ['KYC', 'AML', 'OCR'], version: 'v3.0.0', updatedAt: '2024-06-04', subscribers: 735,
  },
  {
    id: 'AGENT-007', name: 'Content Moderator', developer: 'SafeContent AI', category: '内容审核',
    rating: 4.4, reviewCount: 203, downloads: 4560, price: '$99/月', priceValue: 99,
    description: 'AI内容审核智能体，支持文本/图片/视频多模态内容安全检测',
    tags: ['内容审核', '多模态', '监管合规'], version: 'v2.2.0', updatedAt: '2024-05-30', subscribers: 1580,
  },
  {
    id: 'AGENT-008', name: 'Trading Bot Framework', developer: 'TradeFlow', category: '交易工具',
    rating: 4.2, reviewCount: 310, downloads: 12300, price: '免费开源', priceValue: 0,
    description: '开源交易机器人框架，支持策略回测、网格交易、DCA定投等多种策略模板',
    tags: ['交易', '开源', '策略回测'], version: 'v1.5.0', updatedAt: '2024-06-06', subscribers: 3680,
  },
  {
    id: 'AGENT-009', name: 'Data Pipeline Orchestrator', developer: 'DataStream Inc.', category: '数据处理',
    rating: 4.6, reviewCount: 88, downloads: 1560, price: '$249/月', priceValue: 249,
    description: 'ETL数据管道编排智能体，支持多源数据采集、清洗转换和实时同步',
    tags: ['ETL', '数据管道', '实时同步'], version: 'v2.8.0', updatedAt: '2024-06-02', subscribers: 520,
  },
  {
    id: 'AGENT-010', name: 'Sentiment Analyzer', developer: 'SocialPulse', category: '舆情分析',
    rating: 4.4, reviewCount: 167, downloads: 2340, price: '$179/月', priceValue: 179,
    description: '社交媒体情绪分析引擎，实时追踪Twitter/Telegram/Discord的市场情绪变化',
    tags: ['舆情', '社交媒体', 'NLP'], version: 'v1.9.0', updatedAt: '2024-05-25', subscribers: 890,
  },
];

// 分类颜色映射
const categoryColors: Record<string, string> = {
  '安全防护': 'red',
  '金融分析': 'blue',
  '客户服务': 'green',
  '安全审计': 'orange',
  '市场分析': 'purple',
  '合规验证': 'cyan',
  '内容审核': 'magenta',
  '交易工具': 'gold',
  '数据处理': 'geekblue',
  '舆情分析': 'lime',
};

export default function MarketplacePage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [subscribeModalVisible, setSubscribeModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('marketplace');

  const totalAgents = mockAgents.length;
  const totalDownloads = mockAgents.reduce((sum, a) => sum + a.downloads, 0);
  const avgRating = (mockAgents.reduce((sum, a) => sum + a.rating, 0) / totalAgents).toFixed(1);
  const categories = [...new Set(mockAgents.map(a => a.category))];
  const newThisWeek = 3;

  const columns = [
    {
      title: 'Agent信息',
      key: 'info',
      width: 300,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar shape="square" className="bg-gradient-to-br from-violet-100 to-purple-200" size={48} icon={<ShopOutlined />} />
          <div>
            <div className="font-semibold text-base flex items-center gap-2">
              {record.name}
              <Tag color="blue" className="!text-xs !ml-0">{record.version}</Tag>
            </div>
            <div className="text-xs text-gray-400">by {record.developer}</div>
          </div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (cat: string) => <Tag color={categoryColors[cat] || 'default'}>{cat}</Tag>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (rating: number, r: any) => (
        <div className="flex items-center gap-2">
          <Rate disabled defaultValue={rating} allowHalf count={5} className="text-xs" />
          <span className="text-xs text-gray-400">({r.reviewCount})</span>
        </div>
      ),
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
      width: 100,
      align: 'right' as const,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (price: string, r: any) => (
        <span className={r.priceValue === 0 ? 'text-green-600 font-bold' : 'font-semibold text-blue-600'}>
          {price}
        </span>
      ),
    },
    {
      title: '订阅者',
      dataIndex: 'subscribers',
      key: 'subscribers',
      width: 90,
      align: 'right' as const,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedAgent(record); setDetailModalVisible(true); }} />
          </Tooltip>
          <Tooltip title="订阅">
            <Button type="primary" size="small" icon={<ShoppingCartOutlined />} onClick={() => { setSelectedAgent(record); setSubscribeModalVisible(true); }} />
          </Tooltip>
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
            <ShopOutlined className="text-2xl text-violet-600" />
            <h1 className="text-2xl font-bold m-0">智能体市场</h1>
          </div>
          <Space>
            <Button icon={<FireOutlined />}>热门推荐</Button>
            <Button type="primary" icon={<PlusOutlined />}>发布Agent</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="上架Agent"
              value={totalAgents}
              icon={<ShopOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+{newThisWeek} 本周"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="总下载量"
              value={totalDownloads.toLocaleString()}
              icon={<DownloadOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+12%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均评分"
              value={avgRating}
              icon={<StarOutlined />}
              color="#F59E0B"
              suffix="/5"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="分类数"
              value={categories.length}
              icon={<AppstoreOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="新增本周"
              value={newThisWeek}
              icon={<TrophyOutlined />}
              color="#DC2626"
              description="新上架Agent"
            />
          </Col>
        </Row>

        {/* 主内容区 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'marketplace',
            label: <><ShopOutlined /> 市场广场 ({totalAgents})</>,
            children: (
              <>
                <DataTable
                  columns={columns}
                  dataSource={mockAgents}
                  rowKey="id"
                  title="Agent列表"
                  showSearch
                  searchPlaceholder="搜索Agent名称、开发者或功能..."
                  showFilter
                  filterOptions={[
                    { label: '全部分类', value: '' },
                    ...categories.map(c => ({ label: c, value: c })),
                  ]}
                  pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个Agent` }}
                />

                {/* 热门推荐 */}
                <Card title={<span><FireOutlined /> 本周热门推荐</span>} className="shadow-sm mt-6">
                  <List
                    grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                    dataSource={mockAgents.sort((a, b) => b.downloads - a.downloads).slice(0, 4)}
                    renderItem={(agent) => (
                      <List.Item>
                        <Card hoverable size="small" className="!h-full">
                          <div className="text-center mb-3">
                            <Avatar shape="square" className="bg-gradient-to-br from-violet-100 to-purple-200 mx-auto" size={48} icon={<ShopOutlined />} />
                          </div>
                          <div className="font-semibold text-sm mb-1 truncate text-center">{agent.name}</div>
                          <div className="flex justify-center mb-2">
                            <Rate disabled defaultValue={agent.rating} allowHalf count={5} className="text-xs" />
                          </div>
                          <div className="flex justify-between items-center mb-3 px-1">
                            <span className="text-green-600 font-bold text-sm">{agent.price}</span>
                            <span className="text-xs text-gray-400">{agent.downloads.toLocaleString()} 下载</span>
                          </div>
                          <Button type="primary" size="small" block icon={<ShoppingCartOutlined />}>立即订阅</Button>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'my-subscriptions',
            label: <><ShoppingCartOutlined /> 我的订阅</>,
            children: (
              <Card className="shadow-sm">
                <Empty description="暂无订阅的Agent，去市场逛逛吧！" className="py-12">
                  <Button type="primary" icon={<ShopOutlined />} onClick={() => setActiveTab('marketplace')}>浏览市场</Button>
                </Empty>
              </Card>
            ),
          },
        ]} />

        {/* Agent详情弹窗 */}
        <Modal
          title={null}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={720}
          footer={
            <div className="flex justify-between w-full">
              <Space>
                <Button icon={<HeartOutlined />}>收藏</Button>
              </Space>
              <Space>
                <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
                <Button type="primary" size="large" icon={<ShoppingCartOutlined />} onClick={() => { setDetailModalVisible(false); setSubscribeModalVisible(true); }}>
                  立即订阅 · {selectedAgent?.price}
                </Button>
              </Space>
            </div>
          }
        >
          {selectedAgent && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b">
                <Avatar shape="square" className="bg-gradient-to-br from-violet-100 to-purple-200" size={72} icon={<ShopOutlined />} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold m-0">{selectedAgent.name}</h2>
                    <Tag color="blue">{selectedAgent.version}</Tag>
                    <Badge status="processing" text="在线服务中" />
                  </div>
                  <Paragraph className="text-gray-500 mb-2 !mb-2">{selectedAgent.description}</Paragraph>
                  <div className="flex items-center gap-4 flex-wrap">
                    <Space><Rate disabled defaultValue={selectedAgent.rating} allowHalf /><span className="text-sm text-gray-400">{selectedAgent.reviewCount} 评价</span></Space>
                    <span className="text-sm text-gray-400">by <Text strong>{selectedAgent.developer}</Text></span>
                    <span className="text-green-600 font-bold text-lg">{selectedAgent.price}</span>
                  </div>
                </div>
              </div>

              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" title="功能标签">
                    <div className="flex flex-wrap gap-2">
                      {selectedAgent.tags.map((tag: string) => <Tag key={tag} color="blue" className="!px-3 !py-1">{tag}</Tag>)}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="使用统计">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="累计下载">{selectedAgent.downloads.toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="订阅人数">{selectedAgent.subscribers.toLocaleString()}</Descriptions.Item>
                      <Descriptions.Item label="最后更新">{selectedAgent.updatedAt}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="用户评价" extra={<a>查看全部 {selectedAgent.reviewCount} 条</a>}>
                <List
                  size="small"
                  dataSource={[
                    { user: '张工', avatar: 'Z', rating: 5, content: '非常好用的智能体，准确率很高！', date: '2024-06-05' },
                    { user: '李经理', avatar: 'L', rating: 4, content: '功能强大，API设计清晰。', date: '2024-05-28' },
                  ]}
                  renderItem={(review) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar size="small">{review.avatar}</Avatar>}
                        title={<Space>{review.user}<Rate disabled defaultValue={review.rating} className="ml-2 text-xs" /></Space>}
                        description={<><Paragraph className="!mb-1 !text-sm">{review.content}</Paragraph><Text type="secondary" className="text-xs">{review.date}</Text></>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}
        </Modal>

        {/* 订阅确认弹窗 */}
        <Modal
          title="确认订阅"
          open={subscribeModalVisible}
          onCancel={() => setSubscribeModalVisible(false)}
          onOk={() => { message.success(`成功订阅 ${selectedAgent?.name}`); setSubscribeModalVisible(false); }}
          okText="确认订阅"
        >
          {selectedAgent && (
            <div className="text-center py-4">
              <Avatar shape="square" className="bg-gradient-to-br from-violet-100 to-purple-200 mx-auto mb-3" size={64} icon={<ShopOutlined />} />
              <h3 className="text-lg font-bold mb-2">{selectedAgent.name}</h3>
              <div className="text-2xl font-bold text-green-600 mb-4">{selectedAgent.price}</div>
              <Select
                className="w-full"
                defaultValue="monthly"
                options={[
                  { label: '月付 - $299/月', value: 'monthly' },
                  { label: '季付 - $269/月 (省10%)', value: 'quarterly' },
                  { label: '年付 - $239/月 (省20%)', value: 'yearly' },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

// 补充导入 AppstoreOutlined
import { AppstoreOutlined } from '@ant-design/icons';
