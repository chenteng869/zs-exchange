'use client';

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Alert,
  Tag,
  Badge,
  Modal,
  Descriptions,
  Typography,
  message,
} from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  SwapOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockOrders = [
  { id: 'OTC-2024062301', buyer: 'Galaxy Digital', seller: 'Cumberland', asset: 'BTC', quantity: 150, price: 67250, total: 10087500, status: 'completed', time: '2024-06-23 14:32' },
  { id: 'OTC-2024062302', buyer: 'Jump Trading', seller: 'B2C2', asset: 'ETH', quantity: 5000, price: 3285, total: 16425000, status: 'settling', time: '2024-06-23 13:15' },
  { id: 'OTC-2024062303', buyer: '机构客户A', seller: 'Wintermute', asset: 'USDT', quantity: 5000000, price: 1.0, total: 5000000, status: 'pending', time: '2024-06-23 12:48' },
  { id: 'OTC-2024062304', buyer: 'Flowdesk', seller: 'Galaxy Digital', asset: 'SOL', quantity: 10000, price: 178.5, total: 1785000, status: 'quoted', time: '2024-06-23 11:20' },
  { id: 'OTC-2024062305', buyer: '家族办公室B', seller: 'Jump Trading', asset: 'BTC', quantity: 80, price: 67100, total: 5368000, status: 'completed', time: '2024-06-23 10:55' },
  { id: 'OTC-2024062306', buyer: '对冲基金C', seller: 'Cumberland', asset: 'ETH', quantity: 8000, price: 3278, total: 26224000, status: 'negotiating', time: '2024-06-23 09:30' },
  { id: 'OTC-2024062307', buyer: 'Wintermute', seller: 'B2C2', asset: 'USDC', quantity: 3000000, price: 1.0, total: 3000000, status: 'completed', time: '2024-06-22 17:12' },
  { id: 'OTC-2024062308', buyer: '机构客户D', seller: 'Flowdesk', asset: 'BTC', quantity: 200, price: 66980, total: 13396000, status: 'cancelled', time: '2024-06-22 15:45' },
  { id: 'OTC-2024062309', buyer: 'Galaxy Digital', seller: 'Jump Trading', asset: 'SOL', quantity: 25000, price: 176.2, total: 4405000, status: 'completed', time: '2024-06-22 14:08' },
  { id: 'OTC-2024062310', buyer: '量化基金E', seller: 'Wintermute', asset: 'ETH', quantity: 12000, price: 3265, total: 39180000, status: 'settling', time: '2024-06-22 11:33' },
  { id: 'OTC-2024062311', buyer: 'B2C2', seller: 'Cumberland', asset: 'USDT', quantity: 8000000, price: 1.0, total: 8000000, status: 'pending', time: '2024-06-22 09:20' },
  { id: 'OTC-2024062312', buyer: '机构客户F', seller: 'Galaxy Digital', asset: 'BTC', quantity: 50, price: 67320, total: 3366000, status: 'quoted', time: '2024-06-21 16:55' },
];

export default function OtcPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedOrder(record);
    setDetailVisible(true);
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待确认' },
      quoted: { color: 'processing', text: '已报价' },
      negotiating: { color: 'warning', text: '协商中' },
      settling: { color: 'cyan', text: '结算中' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'error', text: '已取消' },
    };
    const item = map[status];
    return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{status}</Tag>;
  };

  const columns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '买方',
      dataIndex: 'buyer',
      key: 'buyer',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '卖方',
      dataIndex: 'seller',
      key: 'seller',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '资产',
      dataIndex: 'asset',
      key: 'asset',
      width: 90,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '价格(USDT)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (val: number) => (
        <span className="font-medium">${val.toLocaleString()}</span>
      ),
      sorter: (a: any, b: any) => a.price - b.price,
    },
    {
      title: '总额(USDT)',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      render: (val: number) => (
        <span className="font-semibold text-blue-600">
          ${(val / 1e6).toFixed(2)}M
        </span>
      ),
      sorter: (a: any, b: any) => a.total - b.total,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 120,
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
      label: '确认成交',
      icon: <CheckCircleOutlined />,
      type: 'link',
      hidden: (r: any) => r.status !== 'pending' && r.status !== 'quoted',
      confirm: {
        title: '确认该笔OTC订单成交？',
        onConfirm: () => message.success('订单确认成功'),
      },
    },
  ];

  const largeTradeCount = mockOrders.filter((o) => o.total > 10000000).length;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0F1B3D' }}
          >
            <BankOutlined style={{ color: '#F0B90B' }} />
            OTC场外交易中心
          </h1>
          <p className="text-gray-500 mt-2">
            大宗交易撮合 · 一对一报价 · 机构级流动性 · 合规结算
          </p>
        </div>

        {/* 大额交易提醒 */}
        {largeTradeCount > 0 && (
          <Alert
            message={
              <span>
                <WarningOutlined className="mr-2" />
                当前有{' '}
                <strong>{largeTradeCount}</strong> 笔大额交易（总额{'>'}10M USDT）需要关注
              </span>
            }
            description="大额OTC交易需经过双重审批流程，请确保合规部门已审核通过"
            type="warning"
            showIcon
            closable
            icon={<SafetyCertificateOutlined />}
          />
        )}

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日成交额"
              value={128.5}
              prefix="$"
              suffix="M"
              icon={<DollarOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+18.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="挂单总量"
              value={156}
              suffix="笔"
              icon={<SwapOutlined />}
              color="#16A34A"
              description="活跃报价中"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均单笔"
              value={824.5}
              prefix="$"
              suffix="K"
              icon={<ThunderboltOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+5.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="机构客户"
              value={42}
              suffix="家"
              icon={<TeamOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+3家"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="完成率"
              value={94.6}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+1.2%"
            />
          </Col>
        </Row>

        {/* 订单列表 */}
        <Card
          bordered={false}
          style={{ borderRadius: 12 }}
        >
          <DataTable
            columns={columns}
            dataSource={mockOrders}
            rowKey="id"
            title="OTC订单列表"
            searchPlaceholder="搜索订单ID/买卖方..."
            actions={actions}
            showAdd={false}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条订单`,
            }}
          />
        </Card>

        {/* 订单详情Modal */}
        <Modal
          title="OTC订单详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={600}
        >
          {selectedOrder && (
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="订单ID" span={2}>
                <Text copyable>{selectedOrder.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="买方">
                {selectedOrder.buyer}
              </Descriptions.Item>
              <Descriptions.Item label="卖方">
                {selectedOrder.seller}
              </Descriptions.Item>
              <Descriptions.Item label="交易资产">
                <Tag color="blue">{selectedOrder.asset}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                {selectedOrder.quantity.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="单价(USDT)">
                ${selectedOrder.price.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="总金额(USDT)">
                <Text strong className="text-lg">
                  ${(selectedOrder.total / 1e6).toFixed(2)}M
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                {getStatusTag(selectedOrder.status)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {selectedOrder.time}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
