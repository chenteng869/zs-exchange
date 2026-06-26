'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, message, Typography, Card, Progress, Space } from 'antd';
import {
  SafetyCertificateOutlined,
  DollarOutlined,
  WarningOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

const { Text } = Typography;

const mockPolicies = [
  { id: 'POL-001', holder: '0x8a2a...f3d1', policyName: 'BTC资产险 Pro', coverage: 100000, premium: 1200, startDate: '2026-01-15', endDate: '2027-01-14', status: 'active', claims: 0, payout: 0 },
  { id: 'POL-002', holder: '0x3c4e...a1b2', policyName: 'ETH组合保障计划', coverage: 80000, premium: 960, startDate: '2026-02-01', endDate: '2027-01-31', status: 'active', claims: 1, payout: 2500 },
  { id: 'POL-003', holder: '0x7d1f...c9e3', policyName: '稳定币脱锚险', coverage: 200000, premium: 2400, startDate: '2026-03-10', endDate: '2027-03-09', status: 'active', claims: 0, payout: 0 },
  { id: 'POL-004', holder: '0x2b5a...e4f7', policyName: '智能合约漏洞险', coverage: 500000, premium: 7500, startDate: '2026-04-05', endDate: '2027-04-04', status: 'active', claims: 2, payout: 18000 },
  { id: 'POL-005', holder: '0x9f1c...b8d2', policyName: 'CeFi托管风险险', coverage: 300000, premium: 4500, startDate: '2026-05-20', endDate: '2027-05-19', status: 'expired', claims: 0, payout: 0 },
  { id: 'POL-006', holder: '0x4e7d...a3c9', policyName: 'DeFi协议保险', coverage: 150000, premium: 2250, startDate: '2026-06-01', endDate: '2027-05-31', status: 'active', claims: 1, payout: 5200 },
  { id: 'POL-007', holder: '0x6a8e...d5f1', policyName: '私钥丢失险', coverage: 50000, premium: 600, startDate: '2026-06-10', endDate: '2027-06-09', status: 'pending', claims: 0, payout: 0 },
  { id: 'POL-008', holder: '0x1b3c...e7a8', policyName: 'NFT盗抢险', coverage: 80000, premium: 1600, startDate: '2026-06-15', endDate: '2027-06-14', status: 'active', claims: 0, payout: 0 },
  { id: 'POL-009', holder: '0x5d9f...c2b4', policyName: '链上钓鱼防护险', coverage: 60000, premium: 900, startDate: '2026-06-18', endDate: '2027-06-17', status: 'active', claims: 0, payout: 0 },
  { id: 'POL-010', holder: '0x8c2a...f9e1', policyName: 'BTC矿机中断险', coverage: 120000, premium: 3600, startDate: '2026-06-20', endDate: '2027-06-19', status: 'pending', claims: 0, payout: 0 },
];

const claimTrendChart = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['新增保单', '理赔案件'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value' },
  series: [
    { name: '新增保单', type: 'line', smooth: true, itemStyle: { color: '#1677ff' }, data: [125, 158, 185, 220, 285, 320] },
    { name: '理赔案件', type: 'line', smooth: true, itemStyle: { color: '#ff4d4f' }, data: [2, 5, 3, 8, 4, 6] },
  ],
};

export default function InsurancePage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedPolicy(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '保单号',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '持有人',
      dataIndex: 'holder',
      key: 'holder',
      render: (text: string) => <Text copyable style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: '险种名称',
      dataIndex: 'policyName',
      key: 'policyName',
      render: (text: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
          <span className="font-semibold">{text}</span>
        </Space>
      ),
    },
    {
      title: '保额',
      dataIndex: 'coverage',
      key: 'coverage',
      render: (val: number) => <span className="font-medium text-green-600">${(val / 1000).toFixed(0)}K</span>,
      sorter: (a: any, b: any) => a.coverage - b.coverage,
    },
    {
      title: '年保费',
      dataIndex: 'premium',
      key: 'premium',
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    {
      title: '理赔次数',
      dataIndex: 'claims',
      key: 'claims',
      render: (v: number) => v > 0 ? <Tag color="red">{v}次</Tag> : <Tag color="green">0次</Tag>,
    },
    {
      title: '累计赔付',
      dataIndex: 'payout',
      key: 'payout',
      render: (v: number) => v > 0 ? <span className="text-red-600">${v.toLocaleString()}</span> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          active: { color: 'success', text: '生效中' },
          pending: { color: 'processing', text: '待生效' },
          expired: { color: 'default', text: '已过期' },
          cancelled: { color: 'error', text: '已取消' },
        };
        const item = map[status];
        return item ? <Badge status={item.color as any} text={item.text} /> : status;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
    },
    {
      key: 'claim',
      label: '发起理赔',
      icon: <FileProtectOutlined />,
      type: 'link',
      hidden: (r: any) => r.status !== 'active',
      confirm: {
        title: '确认发起理赔申请？',
        description: '系统将启动理赔审核流程',
        onConfirm: () => message.success('理赔申请已提交'),
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
            数字资产保险中心
          </h1>
          <p className="text-gray-500 mt-2">智能合约险 · 资产保障险 · 脱锚险 · 理赔管理 · 风控定价</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="有效保单"
              value={1285}
              icon={<SafetyCertificateOutlined />}
              color="#1677FF"
              suffix="份"
              trend="up"
              trendValue="+8.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总承保额"
              value={496}
              prefix="$"
              suffix="M"
              icon={<SafetyCertificateOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+15.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="本月理赔"
              value={6}
              suffix="件"
              icon={<WarningOutlined />}
              color="#F59E0B"
              description="处理中: 2件"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="赔付率"
              value={4.2}
              suffix="%"
              icon={<DollarOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-0.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="参保用户"
              value={3856}
              suffix="人"
              icon={<TeamOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+12.5%"
            />
          </Col>
        </Row>

        {/* 图表 + 保单列表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="保单与理赔趋势" style={{ borderRadius: 12 }}>
              <SafeECharts option={claimTrendChart} style={{ height: 320 }} />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <DataTable
              columns={columns}
              dataSource={mockPolicies}
              rowKey="id"
              title="保单管理列表"
              searchPlaceholder="搜索保单号/持有人..."
              showFilter
              filterOptions={[
                { label: '全部状态', value: '' },
                { label: '生效中', value: 'active' },
                { label: '待生效', value: 'pending' },
                { label: '已过期', value: 'expired' },
              ]}
              actions={actions}
              onAdd={() => {}}
              addButtonText="新建保单"
              pagination={{ pageSize: 8, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }}
            />
          </Col>
        </Row>

        {/* 详情Modal */}
        <Modal
          title="保单详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={560}
        >
          {selectedPolicy && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">保单号:</Text><br /><Text strong>{selectedPolicy.id}</Text></Col>
                <Col span={12}><Text type="secondary">持有人:</Text><br /><Text strong>{selectedPolicy.holder}</Text></Col>
                <Col span={24}><Text type="secondary">险种名称:</Text><br /><Text strong>{selectedPolicy.policyName}</Text></Col>
                <Col span={12}><Text type="secondary">保额:</Text><br /><Text strong>${selectedPolicy.coverage.toLocaleString()}</Text></Col>
                <Col span={12}><Text type="secondary">年保费:</Text><br /><Text strong>${selectedPolicy.premium.toLocaleString()}</Text></Col>
                <Col span={12}><Text type="secondary">起保日期:</Text><br /><Text strong>{selectedPolicy.startDate}</Text></Col>
                <Col span={12}><Text type="secondary">到期日期:</Text><br /><Text strong>{selectedPolicy.endDate}</Text></Col>
                <Col span={12}><Text type="secondary">理赔次数:</Text><br /><Text strong>{selectedPolicy.claims} 次</Text></Col>
                <Col span={12}><Text type="secondary">累计赔付:</Text><br /><Text strong>${selectedPolicy.payout.toLocaleString()}</Text></Col>
                <Col span={24}><Text type="secondary">状态:</Text><br /><Badge status="success" text={selectedPolicy.status === 'active' ? '生效中' : selectedPolicy.status} /></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
