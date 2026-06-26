'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Select,
  Table,
  Card,
  Progress,
  Tooltip,
  Divider,
  Input,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  SwapOutlined,
  CopyOutlined,
  ShopOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  StarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface DistributionProduct {
  id: string;
  productName: string;
  productCode: string;
  strategyId: string;
  strategyName: string;
  type: 'signal' | 'fund' | 'managed_account';
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  price: Record<string, number>;
  currency: string;
  minInvestment: number;
  maxDrawdownLimit: number;
  targetReturn: number;
  subscriberCount: number;
  totalAum: number;
  status: 'draft' | 'active' | 'suspended' | 'retired';
  listingDate: string;
  aiopcProductScore: number;
  riskRating: number;
}

const mockProducts: DistributionProduct[] = [
  {
    id: '1',
    productName: 'Alpha动量信号V3',
    productCode: 'PRD-ALPHA-001',
    strategyId: 'STR-001',
    strategyName: 'Alpha动量策略',
    type: 'signal',
    tier: 'pro',
    price: { monthly: 299, yearly: 2990, lifetime: 9990 },
    currency: 'USDT',
    minInvestment: 1000,
    maxDrawdownLimit: 15,
    targetReturn: 25.5,
    subscriberCount: 1256,
    totalAum: 2850000,
    status: 'active',
    listingDate: '2024-01-15',
    aiopcProductScore: 92,
    riskRating: 3,
  },
  {
    id: '2',
    productName: '量化套利基金Pro',
    productCode: 'PRD-ARB-002',
    strategyId: 'STR-002',
    strategyName: '跨交易所套利策略',
    type: 'fund',
    tier: 'enterprise',
    price: { monthly: 1999, yearly: 19990, lifetime: 59990 },
    currency: 'USDT',
    minInvestment: 50000,
    maxDrawdownLimit: 8,
    targetReturn: 18.2,
    subscriberCount: 89,
    totalAum: 12800000,
    status: 'active',
    listingDate: '2024-02-20',
    aiopcProductScore: 88,
    riskRating: 2,
  },
  {
    id: '3',
    productName: '网格交易入门版',
    productCode: 'PRD-GRID-003',
    strategyId: 'STR-003',
    strategyName: '网格交易策略',
    type: 'signal',
    tier: 'free',
    price: { monthly: 0, yearly: 0, lifetime: 0 },
    currency: 'USDT',
    minInvestment: 100,
    maxDrawdownLimit: 25,
    targetReturn: 12.8,
    subscriberCount: 8542,
    totalAum: 920000,
    status: 'active',
    listingDate: '2024-03-01',
    aiopcProductScore: 75,
    riskRating: 4,
  },
  {
    id: '4',
    productName: 'AI智能投顾账户',
    productCode: 'PRD-AI-004',
    strategyId: 'STR-004',
    strategyName: 'AI多因子策略',
    type: 'managed_account',
    tier: 'pro',
    price: { monthly: 599, yearly: 5990, lifetime: 17990 },
    currency: 'USDT',
    minInvestment: 10000,
    maxDrawdownLimit: 12,
    targetReturn: 22.6,
    subscriberCount: 342,
    totalAum: 5680000,
    status: 'active',
    listingDate: '2024-03-15',
    aiopcProductScore: 95,
    riskRating: 3,
  },
  {
    id: '5',
    productName: '趋势跟踪基础版',
    productCode: 'PRD-TREND-005',
    strategyId: 'STR-005',
    strategyName: '趋势跟踪策略',
    type: 'signal',
    tier: 'basic',
    price: { monthly: 99, yearly: 990, lifetime: 2990 },
    currency: 'USDT',
    minInvestment: 500,
    maxDrawdownLimit: 20,
    targetReturn: 18.5,
    subscriberCount: 2341,
    totalAum: 1450000,
    status: 'active',
    listingDate: '2024-04-01',
    aiopcProductScore: 82,
    riskRating: 3,
  },
  {
    id: '6',
    productName: '做市商专用工具包',
    productCode: 'PRD-MM-006',
    strategyId: 'STR-006',
    strategyName: '做市策略',
    type: 'managed_account',
    tier: 'enterprise',
    price: { monthly: 2999, yearly: 29990, lifetime: 89990 },
    currency: 'USDT',
    minInvestment: 100000,
    maxDrawdownLimit: 5,
    targetReturn: 15.3,
    subscriberCount: 28,
    totalAum: 8500000,
    status: 'active',
    listingDate: '2024-04-15',
    aiopcProductScore: 90,
    riskRating: 2,
  },
  {
    id: '7',
    productName: '波动率套利信号',
    productCode: 'PRD-VOL-007',
    strategyId: 'STR-007',
    strategyName: '波动率套利策略',
    type: 'signal',
    tier: 'basic',
    price: { monthly: 149, yearly: 1490, lifetime: 4490 },
    currency: 'USDT',
    minInvestment: 2000,
    maxDrawdownLimit: 18,
    targetReturn: 16.8,
    subscriberCount: 987,
    totalAum: 2340000,
    status: 'suspended',
    listingDate: '2024-05-01',
    aiopcProductScore: 78,
    riskRating: 3,
  },
  {
    id: '8',
    productName: 'DeFi收益聚合器',
    productCode: 'PRD-DEFI-008',
    strategyId: 'STR-008',
    strategyName: 'DeFi聚合策略',
    type: 'fund',
    tier: 'pro',
    price: { monthly: 399, yearly: 3990, lifetime: 11990 },
    currency: 'USDT',
    minInvestment: 5000,
    maxDrawdownLimit: 22,
    targetReturn: 32.1,
    subscriberCount: 567,
    totalAum: 3920000,
    status: 'draft',
    listingDate: '2024-05-15',
    aiopcProductScore: 86,
    riskRating: 4,
  },
  {
    id: '9',
    productName: '机构级风控系统',
    productCode: 'PRD-RISK-009',
    strategyId: 'STR-009',
    strategyName: '风险平价策略',
    type: 'managed_account',
    tier: 'enterprise',
    price: { monthly: 4999, yearly: 49990, lifetime: 149990 },
    currency: 'USDT',
    minInvestment: 250000,
    maxDrawdownLimit: 6,
    targetReturn: 12.4,
    subscriberCount: 12,
    totalAum: 15600000,
    status: 'active',
    listingDate: '2024-06-01',
    aiopcProductScore: 96,
    riskRating: 1,
  },
  {
    id: '10',
    productName: '社交跟单信号Lite',
    productCode: 'PRD-SOCIAL-010',
    strategyId: 'STR-010',
    strategyName: '社交跟单策略',
    type: 'signal',
    tier: 'free',
    price: { monthly: 0, yearly: 0, lifetime: 0 },
    currency: 'USDT',
    minInvestment: 50,
    maxDrawdownLimit: 30,
    targetReturn: 10.2,
    subscriberCount: 12453,
    totalAum: 680000,
    status: 'retired',
    listingDate: '2024-01-01',
    aiopcProductScore: 68,
    riskRating: 5,
  },
];

export default function DistributionProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<DistributionProduct | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterTier, setFilterTier] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const filteredProducts = mockProducts.filter((product) => {
    if (filterType && product.type !== filterType) return false;
    if (filterTier && product.tier !== filterTier) return false;
    if (filterStatus && product.status !== filterStatus) return false;
    if (
      searchText &&
      !product.productName.toLowerCase().includes(searchText.toLowerCase()) &&
      !product.productCode.toLowerCase().includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  const totalProducts = mockProducts.length;
  const activeProducts = mockProducts.filter((p) => p.status === 'active').length;
  const totalSubscribers = mockProducts.reduce((sum, p) => sum + p.subscriberCount, 0);
  const totalAum = mockProducts.reduce((sum, p) => sum + p.totalAum, 0);
  const avgAiopcScore = Math.round(
    mockProducts.reduce((sum, p) => sum + p.aiopcProductScore, 0) / totalProducts
  );

  const typeConfig: Record<string, { label: string; color: string }> = {
    signal: { label: '信号', color: 'blue' },
    fund: { label: '基金', color: 'green' },
    managed_account: { label: '管理账户', color: 'purple' },
  };

  const tierConfig: Record<string, { label: string; color: string }> = {
    free: { label: '免费版', color: 'default' },
    basic: { label: '基础版', color: 'cyan' },
    pro: { label: '专业版', color: 'gold' },
    enterprise: { label: '企业版', color: 'magenta' },
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: 'default' },
    active: { label: '上架中', color: 'success' },
    suspended: { label: '已下架', color: 'warning' },
    retired: { label: '已退役', color: 'error' },
  };

  const columns = [
    {
      title: '产品名',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: '编码',
      dataIndex: 'productCode',
      key: 'productCode',
      render: (text: string) => <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: '关联策略',
      dataIndex: 'strategyName',
      key: 'strategyName',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.label}</Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: string) => <Tag color={tierConfig[tier]?.color}>{tierConfig[tier]?.label}</Tag>,
    },
    {
      title: '价格(月/年)',
      key: 'price',
      render: (_: any, record: DistributionProduct) => (
        <span className="text-sm">
          ${record.price.monthly}/${record.price.yearly}
        </span>
      ),
    },
    {
      title: '最低投资',
      dataIndex: 'minInvestment',
      key: 'minInvestment',
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: '最大回撤',
      dataIndex: 'maxDrawdownLimit',
      key: 'maxDrawdownLimit',
      render: (val: number) => <span className="text-orange-600">{val}%</span>,
    },
    {
      title: '目标收益',
      dataIndex: 'targetReturn',
      key: 'targetReturn',
      render: (val: number) => <span className="text-green-600">{val}%</span>,
    },
    {
      title: '订阅人数',
      dataIndex: 'subscriberCount',
      key: 'subscriberCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: 'AUM',
      dataIndex: 'totalAum',
      key: 'totalAum',
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M`,
    },
    {
      title: 'AIOPC产品分',
      dataIndex: 'aiopcProductScore',
      key: 'aiopcProductScore',
      render: (val: number) => (
        <span style={{ color: '#F0B90B', fontWeight: 600 }}>{val}</span>
      ),
    },
    {
      title: '风险评级',
      dataIndex: 'riskRating',
      key: 'riskRating',
      render: (val: number) => (
        <Tooltip title={`${val}星风险`}>
          <span style={{ color: '#F0B90B' }}>
            {'★'.repeat(val)}{'☆'.repeat(5 - val)}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>
      ),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: DistributionProduct) => {
        setSelectedProduct(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: DistributionProduct) => {
        message.info(`编辑产品: ${record.productName}`);
      },
    },
    {
      key: 'toggle',
      label: (_: any, record: DistributionProduct) =>
        record.status === 'active' ? '下架' : '上架',
      icon: <SwapOutlined />,
      onClick: (record: DistributionProduct) => {
        message.success(
          `产品 ${record.productName} 已${record.status === 'active' ? '下架' : '上架'}`
        );
      },
    },
    {
      key: 'copy',
      label: '复制',
      icon: <CopyOutlined />,
      onClick: (record: DistributionProduct) => {
        message.success(`已复制产品: ${record.productName}`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <ShopOutlined style={{ color: '#F0B90B' }} />
              策略产品化中心
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              量化策略产品封装与管理 · 产品设计/定价/上架/下架 · AIOPC产品力评估
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              新建产品
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="产品总数"
            value={totalProducts}
            icon={<ShopOutlined />}
            color="#1677FF"
            description="全部策略产品"
          />
          <DataCard
            title="上架中"
            value={activeProducts}
            icon={<TrophyOutlined />}
            color="#16A34A"
            suffix={`/${totalProducts}`}
            description="活跃产品数"
          />
          <DataCard
            title="订阅用户总数"
            value={totalSubscribers.toLocaleString()}
            icon={<TeamOutlined />}
            color="#7C3AED"
            description="全平台累计"
          />
          <DataCard
            title="总AUM"
            value={`${(totalAum / 1000000).toFixed(1)}M`}
            prefix="$"
            icon={<DollarOutlined />}
            color="#F59E0B"
            description="管理资产规模"
          />
          <DataCard
            title="平均AIOPC产品分"
            value={avgAiopcScore}
            icon={<StarOutlined />}
            color="#F0B90B"
            suffix="/100"
            description="AIOPC综合评估"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select
              placeholder="产品类型"
              style={{ width: 140 }}
              allowClear
              value={filterType || undefined}
              onChange={setFilterType}
            >
              <Option value="signal">信号</Option>
              <Option value="fund">基金</Option>
              <Option value="managed_account">管理账户</Option>
            </Select>
            <Select
              placeholder="等级"
              style={{ width: 120 }}
              allowClear
              value={filterTier || undefined}
              onChange={setFilterTier}
            >
              <Option value="free">免费版</Option>
              <Option value="basic">基础版</Option>
              <Option value="pro">专业版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              value={filterStatus || undefined}
              onChange={setFilterStatus}
            >
              <Option value="draft">草稿</Option>
              <Option value="active">上架中</Option>
              <Option value="suspended">已下架</Option>
              <Option value="retired">已退役</Option>
            </Select>
            <Input.Search
              placeholder="搜索产品名称或编码"
              allowClear
              style={{ width: 260 }}
              onSearch={setSearchText}
              enterButton={<SearchOutlined />}
            />
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredProducts as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              产品详情 - <span style={{ color: '#F0B90B' }}>{selectedProduct?.productName}</span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>,
            <Button key="edit" type="primary" icon={<EditOutlined />}>
              编辑产品
            </Button>,
          ]}
          width={860}
        >
          {selectedProduct && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <Divider orientation="left">基本信息</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="产品名称">{selectedProduct.productName}</Descriptions.Item>
                <Descriptions.Item label="产品编码">
                  <code className="font-mono">{selectedProduct.productCode}</code>
                </Descriptions.Item>
                <Descriptions.Item label="关联策略">{selectedProduct.strategyName}</Descriptions.Item>
                <Descriptions.Item label="策略ID">
                  <code className="font-mono text-xs">{selectedProduct.strategyId}</code>
                </Descriptions.Item>
                <Descriptions.Item label="产品类型">
                  <Tag color={typeConfig[selectedProduct.type]?.color}>
                    {typeConfig[selectedProduct.type]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="产品等级">
                  <Tag color={tierConfig[selectedProduct.tier]?.color}>
                    {tierConfig[selectedProduct.tier]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusConfig[selectedProduct.status]?.color}>
                    {statusConfig[selectedProduct.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="上架日期">
                  {dayjs(selectedProduct.listingDate).format('YYYY-MM-DD')}
                </Descriptions.Item>
              </Descriptions>

              {/* 定价与收益 */}
              <Divider orientation="left">定价与收益</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="月度价格">
                  ${selectedProduct.price.monthly}
                </Descriptions.Item>
                <Descriptions.Item label="年度价格">
                  ${selectedProduct.price.yearly}
                </Descriptions.Item>
                <Descriptions.Item label="终身价格">
                  ${selectedProduct.price.lifetime}
                </Descriptions.Item>
                <Descriptions.Item label="货币单位">{selectedProduct.currency}</Descriptions.Item>
                <Descriptions.Item label="最低投资额">
                  ${selectedProduct.minInvestment.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="目标年化收益率">
                  <span className="text-green-600 font-semibold">
                    {selectedProduct.targetReturn}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="最大回撤限制">
                  <span className="text-orange-600 font-semibold">
                    {selectedProduct.maxDrawdownLimit}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="风险评级">
                  <span style={{ color: '#F0B90B' }}>
                    {'★'.repeat(selectedProduct.riskRating)}
                    {'☆'.repeat(5 - selectedProduct.riskRating)}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {/* AIOPC产品力评估 */}
              <Divider orientation="left">
                <StarOutlined style={{ color: '#F0B90B' }} /> AIOPC产品力评估
              </Divider>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)',
                  borderColor: '#F0B90B',
                }}
                size="small"
              >
                <div className="mb-3">
                  <span className="text-lg font-bold" style={{ color: '#F0B90B' }}>
                    综合评分: {selectedProduct.aiopcProductScore}/100
                  </span>
                </div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">市场契合度</span>
                      <span className="text-sm font-semibold">88%</span>
                    </div>
                    <Progress percent={88} strokeColor="#1677FF" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">收益稳定性</span>
                      <span className="text-sm font-semibold">92%</span>
                    </div>
                    <Progress percent={92} strokeColor="#16A34A" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">风险控制能力</span>
                      <span className="text-sm font-semibold">85%</span>
                    </div>
                    <Progress percent={85} strokeColor="#F59E0B" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">用户体验评分</span>
                      <span className="text-sm font-semibold">94%</span>
                    </div>
                    <Progress percent={94} strokeColor="#7C3AED" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">创新性指数</span>
                      <span className="text-sm font-semibold">90%</span>
                    </div>
                    <Progress percent={90} strokeColor="#F0B90B" showInfo={false} size="small" />
                  </div>
                </Space>
              </Card>

              {/* 订阅者分布 */}
              <Divider orientation="left">运营数据</Divider>
              <Descriptions column={3} bordered size="small">
                <Descriptions.Item label="订阅用户总数">
                  {selectedProduct.subscriberCount.toLocaleString()}人
                </Descriptions.Item>
                <Descriptions.Item label="管理资产(AUM)">
                  ${(selectedProduct.totalAum / 1000000).toFixed(2)}M
                </Descriptions.Item>
                <Descriptions.Item label="人均投资额">
                  $
                  {Math.round(
                    selectedProduct.totalAum / selectedProduct.subscriberCount
                  ).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>

              {/* 操作日志 */}
              <Divider orientation="left">操作日志</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { time: '2024-06-20 14:30', action: '价格调整', operator: 'admin', detail: '月度价格从$299调整至$319' },
                  { time: '2024-06-15 09:15', action: '状态变更', operator: 'system', detail: '自动审核通过，产品上架' },
                  { time: '2024-06-10 16:45', action: '内容更新', operator: 'editor', detail: '更新产品描述和风险提示' },
                  { time: '2024-06-01 10:00', action: '创建产品', operator: 'admin', detail: '初始创建并提交审核' },
                ]}
                columns={[
                  { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
                  { title: '操作类型', dataIndex: 'action', key: 'action', width: 100 },
                  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 80 },
                  { title: '详情', dataIndex: 'detail', key: 'detail' },
                ]}
                rowKey="time"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
