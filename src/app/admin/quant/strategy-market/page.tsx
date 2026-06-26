'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Rate, Row, Col, Input } from 'antd';
import {
  ShopOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  DashboardOutlined,
  UserOutlined,
  DollarOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface MarketProduct {
  id: string;
  productName: string;
  vendorName: string;
  category: 'trend' | 'follow' | 'arbitrage' | 'grid' | 'ai_ml';
  riskLevel: number;
  minCapital: number;
  monthlyFee: number;
  aum: number;
  subscriberCount: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  runDays: number;
  status: 'pending_review' | 'listed' | 'delisted' | 'rejected';
  listingDate: string;
  avgRating: number;
  aiopcVerified: boolean;
}

const mockData: MarketProduct[] = [
  { id: '1', productName: 'AI趋势跟踪策略Pro', vendorName: 'QuantMaster', category: 'trend', riskLevel: 3, minCapital: 5000, monthlyFee: 299, aum: 1250000, subscriberCount: 156, sharpeRatio: 2.35, maxDrawdown: -12.5, winRate: 68.2, runDays: 365, status: 'listed', listingDate: '2024-01-15', avgRating: 4.6, aiopcVerified: true },
  { id: '2', productName: '智能网格交易V2', vendorName: 'GridPro', category: 'grid', riskLevel: 2, minCapital: 3000, monthlyFee: 199, aum: 890000, subscriberCount: 234, sharpeRatio: 1.89, maxDrawdown: -8.3, winRate: 72.5, runDays: 280, status: 'listed', listingDate: '2024-02-20', avgRating: 4.3, aiopcVerified: true },
  { id: '3', productName: '跨所套利机器人', vendorName: 'ArbitrageBot', category: 'arbitrage', riskLevel: 2, minCapital: 10000, monthlyFee: 499, aum: 2100000, subscriberCount: 89, sharpeRatio: 3.12, maxDrawdown: -5.2, winRate: 85.6, runDays: 420, status: 'listed', listingDate: '2023-11-10', avgRating: 4.8, aiopcVerified: true },
  { id: '4', productName: '动量突破Alpha', vendorName: 'MomentumKing', category: 'trend', riskLevel: 4, minCapital: 8000, monthlyFee: 399, aum: 780000, subscriberCount: 67, sharpeRatio: 1.56, maxDrawdown: -22.8, winRate: 58.9, runDays: 195, status: 'pending_review', listingDate: '', avgRating: 0, aiopcVerified: false },
  { id: '5', productName: 'AI情绪分析引擎', vendorName: 'SentimentAI', category: 'ai_ml', riskLevel: 4, minCapital: 6000, monthlyFee: 349, aum: 560000, subscriberCount: 123, sharpeRatio: 1.78, maxDrawdown: -18.6, winRate: 63.4, runDays: 150, status: 'listed', listingDate: '2024-03-05', avgRating: 4.1, aiopcVerified: false },
  { id: '6', productName: '跟单大师跟随系统', vendorName: 'CopyMaster', category: 'follow', riskLevel: 3, minCapital: 2000, monthlyFee: 149, aum: 1450000, subscriberCount: 345, sharpeRatio: 1.45, maxDrawdown: -15.3, winRate: 61.2, runDays: 520, status: 'listed', listingDate: '2023-08-22', avgRating: 3.9, aiopcVerified: true },
  { id: '7', productName: '高频做市策略', vendorName: 'MarketMaker', category: 'arbitrage', riskLevel: 5, minCapital: 50000, monthlyFee: 999, aum: 3200000, subscriberCount: 23, sharpeRatio: 4.25, maxDrawdown: -3.8, winRate: 78.9, runDays: 680, status: 'listed', listingDate: '2023-06-01', avgRating: 4.9, aiopcVerified: true },
  { id: '8', productName: '自适应网格V3', vendorName: 'SmartGrid', category: 'grid', riskLevel: 2, minCapital: 2500, monthlyFee: 179, aum: 670000, subscriberCount: 189, sharpeRatio: 1.92, maxDrawdown: -9.1, winRate: 74.3, runDays: 310, status: 'delisted', listingDate: '2024-01-01', avgRating: 4.0, aiopcVerified: false },
  { id: '9', productName: '深度学习预测模型', vendorName: 'DeepQuant', category: 'ai_ml', riskLevel: 5, minCapital: 15000, monthlyFee: 599, aum: 430000, subscriberCount: 45, sharpeRatio: 0.98, maxDrawdown: -35.2, winRate: 52.1, runDays: 90, status: 'rejected', listingDate: '', avgRating: 0, aiopcVerified: false },
  { id: '10', productName: '均值回归套利', vendorName: 'MeanRevert', category: 'arbitrage', riskLevel: 3, minCapital: 7000, monthlyFee: 279, aum: 980000, subscriberCount: 112, sharpeRatio: 2.08, maxDrawdown: -11.7, winRate: 69.8, runDays: 245, status: 'pending_review', listingDate: '', avgRating: 0, aiopcVerified: false },
];

const categoryMap: Record<string, { label: string; color: string }> = {
  trend: { label: '趋势跟踪', color: 'blue' },
  follow: { label: '跟单跟随', color: 'purple' },
  arbitrage: { label: '套利策略', color: 'green' },
  grid: { label: '网格交易', color: 'orange' },
  ai_ml: { label: 'AI/ML', color: 'cyan' },
};

const statusMap: Record<string, { label: string; color: string }> = {
  pending_review: { label: '审核中', color: 'processing' },
  listed: { label: '已上架', color: 'success' },
  delisted: { label: '已下架', color: 'default' },
  rejected: { label: '已拒绝', color: 'error' },
};

export default function StrategyMarketPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const filteredData = mockData.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (riskFilter && item.riskLevel !== parseInt(riskFilter)) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchText && !item.productName.toLowerCase().includes(searchText.toLowerCase()) &&
        !item.vendorName.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const totalProducts = mockData.length;
  const listedCount = mockData.filter(i => i.status === 'listed').length;
  const totalSubscribers = mockData.reduce((sum, i) => sum + i.subscriberCount, 0);
  const totalAUM = mockData.reduce((sum, i) => sum + i.aum, 0);
  const verifiedCount = mockData.filter(i => i.aiopcVerified).length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: MarketProduct) => {
        setSelectedProduct(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'approve',
      label: '审核通过',
      icon: <CheckCircleOutlined />,
      type: 'primary',
      hidden: () => selectedProduct?.status !== 'pending_review',
      onClick: (record: MarketProduct) => {
        message.success(`策略 "${record.productName}" 已通过审核`);
      },
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <CloseCircleOutlined />,
      danger: true,
      hidden: () => selectedProduct?.status !== 'pending_review',
      onClick: (record: MarketProduct) => {
        message.warning(`策略 "${record.productName}" 已被拒绝`);
      },
    },
    {
      key: 'delist',
      label: '下架',
      icon: <StopOutlined />,
      danger: true,
      hidden: (record: MarketProduct) => record.status !== 'listed',
      onClick: (record: MarketProduct) => {
        message.warning(`策略 "${record.productName}" 已下架`);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: MarketProduct) => {
        message.info(`编辑策略 "${record.productName}"`);
      },
    },
  ];

  const columns = [
    {
      title: '产品名',
      dataIndex: 'productName',
      key: 'productName',
      width: 180,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '供应商',
      dataIndex: 'vendorName',
      key: 'vendorName',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (cat: string) => (
        <Tag color={categoryMap[cat]?.color || 'default'}>{categoryMap[cat]?.label || cat}</Tag>
      ),
    },
    {
      title: '风险星级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: number) => (
        <Rate disabled defaultValue={level} count={5} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: '最低资金',
      dataIndex: 'minCapital',
      key: 'minCapital',
      width: 110,
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: '月费',
      dataIndex: 'monthlyFee',
      key: 'monthlyFee',
      width: 90,
      render: (val: number) => <span className="text-blue-600 font-medium">${val}</span>,
    },
    {
      title: 'AUM',
      dataIndex: 'aum',
      key: 'aum',
      width: 120,
      render: (val: number) => `$${(val / 10000).toFixed(1)}万`,
    },
    {
      title: '订阅者',
      dataIndex: 'subscriberCount',
      key: 'subscriberCount',
      width: 90,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: 'Sharpe',
      dataIndex: 'sharpeRatio',
      key: 'sharpeRatio',
      width: 80,
      render: (val: number) => (
        <span className={val >= 2 ? 'text-green-600 font-semibold' : ''}>{val.toFixed(2)}</span>
      ),
    },
    {
      title: '最大回撤%',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      width: 110,
      render: (val: number) => (
        <span className={val > -15 ? 'text-green-600' : val > -25 ? 'text-orange-500' : 'text-red-600'}>
          {val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '胜率%',
      dataIndex: 'winRate',
      key: 'winRate',
      width: 80,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: '运行天数',
      dataIndex: 'runDays',
      key: 'runDays',
      width: 90,
      render: (val: number) => `${val}天`,
    },
    {
      title: 'AIOPC认证',
      dataIndex: 'aiopcVerified',
      key: 'aiopcVerified',
      width: 110,
      render: (verified: boolean) => verified
        ? <Tag color="#F0B90B" icon={<SafetyCertificateOutlined />}>已认证</Tag>
        : <Tag color="default">未认证</Tag>,
    },
    {
      title: '评级',
      dataIndex: 'avgRating',
      key: 'avgRating',
      width: 90,
      render: (rating: number) => rating > 0 ? (
        <span><StarOutlined style={{ color: '#F0B90B' }} /> {rating.toFixed(1)}</span>
      ) : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color as any}>{statusMap[status]?.label || status}</Tag>
      ),
    },
  ];

  const mockSubscribers = [
    { id: 1, user: '0x1234...abcd', joinDate: '2024-03-15', capital: 10000, status: 'active' },
    { id: 2, user: '0x5678...efgh', joinDate: '2024-04-02', capital: 5000, status: 'active' },
    { id: 3, user: '0xabcd...ijkl', joinDate: '2024-05-10', capital: 20000, status: 'paused' },
  ];

  const mockAuditLogs = [
    { id: 1, action: '提交审核', operator: 'system', time: '2024-03-10 14:30', remark: '自动提交' },
    { id: 2, action: '初审通过', operator: 'auditor_01', time: '2024-03-12 09:15', remark: '资料完整' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <ShopOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">策略商城管理中心</h1>
            <p className="text-gray-500 text-sm mt-1">
              量化策略产品化平台 · 策略上架/定价/展示/下架 · Powered by AIOPC
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="商城产品总数"
              value={totalProducts}
              suffix="个"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="在架产品"
              value={listedCount}
              suffix="个"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总订阅用户"
              value={totalSubscribers}
              suffix="人"
              icon={<UserOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总AUM"
              value={`${(totalAUM / 100000000).toFixed(2)}`}
              suffix="亿"
              prefix="$"
              icon={<DollarOutlined />}
              color="#F59E0B"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="分类筛选"
              allowClear
              style={{ width: 140 }}
              value={categoryFilter || undefined}
              onChange={setCategoryFilter}
            >
              {Object.entries(categoryMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="风险等级"
              allowClear
              style={{ width: 130 }}
              value={riskFilter || undefined}
              onChange={setRiskFilter}
            >
              {[1, 2, 3, 4, 5].map(v => (
                <Select.Option key={v} value={String(v)}>{'★'.repeat(v)} 级</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 130 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              {Object.entries(statusMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Input.Search
              placeholder="搜索产品名/供应商..."
              allowClear
              style={{ width: 240 }}
              onSearch={setSearchText}
              enterButton={<SearchOutlined />}
            />
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
          title={`策略详情 - ${selectedProduct?.productName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={860}
        >
          {selectedProduct && (
            <div className="space-y-6">
              {/* 产品基本信息 */}
              <Descriptions title="产品信息" bordered column={2} size="small">
                <Descriptions.Item label="产品名称">{selectedProduct.productName}</Descriptions.Item>
                <Descriptions.Item label="供应商">{selectedProduct.vendorName}</Descriptions.Item>
                <Descriptions.Item label="分类">
                  <Tag color={categoryMap[selectedProduct.category]?.color}>
                    {categoryMap[selectedProduct.category]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[selectedProduct.status]?.color as any}>
                    {statusMap[selectedProduct.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="最低资金">${selectedProduct.minCapital.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="月费">
                  <span className="text-blue-600 font-bold">${selectedProduct.monthlyFee}</span>
                </Descriptions.Item>
                <Descriptions.Item label="上架日期">{selectedProduct.listingDate || '-'}</Descriptions.Item>
                <Descriptions.Item label="运行天数">{selectedProduct.runDays} 天</Descriptions.Item>
              </Descriptions>

              {/* 绩效指标 */}
              <Descriptions title="绩效指标" bordered column={2} size="small">
                <Descriptions.Item label="AUM">
                  ${(selectedProduct.aum / 10000).toFixed(1)}万
                </Descriptions.Item>
                <Descriptions.Item label="订阅者">{selectedProduct.subscriberCount} 人</Descriptions.Item>
                <Descriptions.Item label="Sharpe比率">
                  <span className={selectedProduct.sharpeRatio >= 2 ? 'text-green-600 font-bold' : ''}>
                    {selectedProduct.sharpeRatio.toFixed(2)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="最大回撤">
                  <span className={selectedProduct.maxDrawdown > -15 ? 'text-green-600' : 'text-red-600'}>
                    {selectedProduct.maxDrawdown.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="胜率">{selectedProduct.winRate.toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label="平均评级">
                  <StarOutlined style={{ color: '#F0B90B' }} /> {selectedProduct.avgRating.toFixed(1)}
                </Descriptions.Item>
                <Descriptions.Item label="AIOPC认证">
                  {selectedProduct.aiopcVerified ? (
                    <Tag color="#F0B90B" icon={<SafetyCertificateOutlined />}>已通过AIOPC认证</Tag>
                  ) : (
                    <Tag color="default">未认证</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  {'★'.repeat(selectedProduct.riskLevel)}{'☆'.repeat(5 - selectedProduct.riskLevel)}
                </Descriptions.Item>
              </Descriptions>

              {/* AIOPC认证评估 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC认证评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '策略逻辑', score: 88, color: '#1677FF' },
                    { label: '风控体系', score: 82, color: '#16A34A' },
                    { label: '收益稳定性', score: 91, color: '#F59E0B' },
                    { label: '透明度', score: 75, color: '#7C3AED' },
                    { label: '创新性', score: 85, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={item.score}
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
                    综合评分: 84.2 / 100
                  </Tag>
                </div>
              </Card>

              {/* 订阅者列表 */}
              <Table
                dataSource={mockSubscribers}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><UserOutlined /> 订阅者列表</span>}
                columns={[
                  { title: '用户地址', dataIndex: 'user', render: (t: string) => <code className="text-xs">{t}</code> },
                  { title: '加入日期', dataIndex: 'joinDate' },
                  { title: '投资金额', dataIndex: 'capital', render: (v: number) => `$${v.toLocaleString()}` },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'success' : 'warning'}>{s === 'active' ? '活跃' : '暂停'}</Tag> },
                ]}
              />

              {/* 审核日志 */}
              <Table
                dataSource={mockAuditLogs}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><LineChartOutlined /> 审核日志</span>}
                columns={[
                  { title: '操作', dataIndex: 'action' },
                  { title: '操作人', dataIndex: 'operator' },
                  { title: '时间', dataIndex: 'time' },
                  { title: '备注', dataIndex: 'remark' },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
