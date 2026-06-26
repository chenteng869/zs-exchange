'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, message, Typography, Card } from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  SwapOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  EditOutlined,
  ExportOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

const { Text } = Typography;

const mockOrders = [
  { id: 'FO-001', user: '0x8a2a...f3d1', type: 'deposit', channel: 'SEPA EUR', amount: 15000, currency: 'EUR', fee: 15, status: 'completed', createdAt: '2026-06-23 10:30' },
  { id: 'FO-002', user: '0x3c4e...a1b2', type: 'withdrawal', channel: 'SWIFT USD', amount: 50000, currency: 'USD', fee: 250, status: 'processing', createdAt: '2026-06-23 09:15' },
  { id: 'FO-003', user: '0x7d1f...c9e3', type: 'deposit', channel: 'WeChat CNY', amount: 8000, currency: 'CNY', fee: 48, status: 'completed', createdAt: '2026-06-22 16:45' },
  { id: 'FO-004', user: '0x2b5a...e4f7', type: 'deposit', channel: 'Alipay CNY', amount: 25000, currency: 'CNY', fee: 150, status: 'pending', createdAt: '2026-06-22 14:20' },
  { id: 'FO-005', user: '0x9f1c...b8d2', type: 'withdrawal', channel: 'ACH USD', amount: 12000, currency: 'USD', fee: 6, status: 'completed', createdAt: '2026-06-22 11:00' },
  { id: 'FO-006', user: '0x4e7d...a3c9', type: 'deposit', channel: 'PIX BRL', amount: 35000, currency: 'BRL', fee: 0, status: 'processing', createdAt: '2026-06-21 18:30' },
  { id: 'FO-007', user: '0x6a8e...d5f1', type: 'deposit', channel: 'FPS GBP', amount: 8500, currency: 'GBP', fee: 6.8, status: 'failed', createdAt: '2026-06-21 09:45' },
  { id: 'FO-008', user: '0x1b3c...e7a8', type: 'withdrawal', channel: 'SWIFT USD', amount: 100000, currency: 'USD', fee: 500, status: 'review', createdAt: '2026-06-20 15:00' },
  { id: 'FO-009', user: '0x5d9f...c2b4', type: 'deposit', channel: 'SEPA EUR', amount: 42000, currency: 'EUR', fee: 42, status: 'completed', createdAt: '2026-06-20 11:30' },
  { id: 'FO-010', user: '0x8c2a...f9e1', type: 'deposit', channel: 'WeChat CNY', amount: 5000, currency: 'CNY', fee: 30, status: 'completed', createdAt: '2026-06-19 16:00' },
  { id: 'FO-011', user: '0x3e7b...a5d8', type: 'withdrawal', channel: 'ACH USD', amount: 28000, currency: 'USD', fee: 14, status: 'pending', createdAt: '2026-06-19 13:20' },
  { id: 'FO-012', user: '0x7f4c...b1e3', type: 'deposit', channel: 'Alipay CNY', amount: 18000, currency: 'CNY', fee: 108, status: 'completed', createdAt: '2026-06-18 10:50' },
];

const volumeChart = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '金额 (K USDT)' },
  series: [
    { type: 'bar', itemStyle: { color: '#1677ff' }, data: [12.5, 14.8, 16.2, 15.5, 18.3, 9.2, 7.8] },
  ],
};

export default function FiatManagePage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="font-mono text-sm">{text}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (text: string) => <Text copyable style={{ fontSize: 13 }}>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'deposit' ? 'green' : 'orange'} icon={type === 'deposit' ? <SwapOutlined /> : <ExportOutlined />}>
          {type === 'deposit' ? '充值' : '提现'}
        </Tag>
      ),
    },
    {
      title: '通道',
      dataIndex: 'channel',
      key: 'channel',
      render: (text: string) => <Tag icon={<GlobalOutlined />} color="blue">{text}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number, r: any) => (
        <span className="font-medium">
          {r.currency === 'CNY' ? '¥' : r.currency === 'EUR' ? '€' : '$'}
          {val.toLocaleString()}
        </span>
      ),
      sorter: (a: any, b: any) => a.amount - b.amount,
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      render: (val: number) => <Text type="secondary">${val}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          completed: { color: 'success', text: '已完成' },
          processing: { color: 'processing', text: '处理中' },
          pending: { color: 'warning', text: '待处理' },
          review: { color: 'cyan', text: '审核中' },
          failed: { color: 'error', text: '失败' },
        };
        const item = map[status];
        return item ? <Badge status={item.color as any} text={item.text} /> : status;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      key: 'approve',
      label: '审批',
      icon: <CheckCircleOutlined />,
      type: 'link',
      hidden: (r: any) => r.status !== 'review',
      confirm: {
        title: '确认审批通过？',
        onConfirm: () => message.success('审批通过'),
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
            <BankOutlined style={{ color: '#F0B90B' }} />
            法币出入金管理
          </h1>
          <p className="text-gray-500 mt-2">多通道出入金 · AML/KYC · 实时监控 · 风控预警</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日入金"
              value={285.6}
              prefix="$"
              suffix="K"
              icon={<SwapOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+12.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日出金"
              value={168.2}
              prefix="$"
              suffix="K"
              icon={<ExportOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-5.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="待处理订单"
              value={18}
              icon={<ClockCircleOutlined />}
              color="#1677FF"
              suffix="笔"
              description="需尽快处理"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="成功率"
              value={96.8}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+0.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="风控预警"
              value={3}
              suffix="条"
              icon={<WarningOutlined />}
              color="#DC2626"
              description="需关注"
            />
          </Col>
        </Row>

        {/* 图表 + 订单列表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="近7日交易额趋势" style={{ borderRadius: 12 }}>
              <SafeECharts option={volumeChart} style={{ height: 280 }} />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <DataTable
              columns={columns}
              dataSource={mockOrders}
              rowKey="id"
              title="法币订单列表"
              searchPlaceholder="搜索订单号/用户..."
              showFilter
              filterOptions={[
                { label: '全部类型', value: '' },
                { label: '充值', value: 'deposit' },
                { label: '提现', value: 'withdrawal' },
              ]}
              actions={actions}
              showAdd={false}
              pagination={{ pageSize: 8, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }}
            />
          </Col>
        </Row>

        {/* 详情Modal */}
        <Modal
          title="订单详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={520}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">订单ID:</Text><br /><Text strong>{selectedOrder.id}</Text></Col>
                <Col span={12}><Text type="secondary">用户:</Text><br /><Text strong>{selectedOrder.user}</Text></Col>
                <Col span={12}><Text type="secondary">类型:</Text><br /><Tag color={selectedOrder.type === 'deposit' ? 'green' : 'orange'}>{selectedOrder.type === 'deposit' ? '充值' : '提现'}</Tag></Col>
                <Col span={12}><Text type="secondary">通道:</Text><br /><Text strong>{selectedOrder.channel}</Text></Col>
                <Col span={12}><Text type="secondary">金额:</Text><br /><Text strong>{selectedOrder.currency === 'CNY' ? '¥' : '$'}{selectedOrder.amount.toLocaleString()}</Text></Col>
                <Col span={12}><Text type="secondary">手续费:</Text><br /><Text strong>${selectedOrder.fee}</Text></Col>
                <Col span={12}><Text type="secondary">状态:</Text><br /><Badge status="processing" text={selectedOrder.status} /></Col>
                <Col span={12}><Text type="secondary">创建时间:</Text><br /><Text strong>{selectedOrder.createdAt}</Text></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
