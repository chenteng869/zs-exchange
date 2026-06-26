'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Descriptions } from 'antd';
import { ShoppingCartOutlined, EyeOutlined, CheckOutlined, TruckOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockOrders = [
  { id: 'ORD-20240501-001', user: '张三', phone: '138****1234', status: 'pending', totalAmount: 457, payMethod: '支付宝', createTime: '2024-05-01 09:30:00', products: [{ name: '文房四宝套装', quantity: 1, price: 299 }, { name: '宣纸 - 特净皮', quantity: 1, price: 158 }] },
  { id: 'ORD-20240501-002', user: '李四', phone: '139****5678', status: 'paid', totalAmount: 178, payMethod: '微信支付', createTime: '2024-05-01 10:15:00', products: [{ name: '湖笔 - 精品羊毫', quantity: 2, price: 89 }] },
  { id: 'ORD-20240502-001', user: '王五', phone: '137****9012', status: 'shipped', totalAmount: 727, payMethod: '支付宝', createTime: '2024-05-02 14:45:00', logistics: { company: '顺丰速运', trackingNo: 'SF1234567890' }, products: [{ name: '端砚 - 绿端', quantity: 1, price: 599 }, { name: '镇纸 - 铜器', quantity: 1, price: 128 }] },
  { id: 'ORD-20240503-001', user: '赵六', phone: '136****3456', status: 'completed', totalAmount: 399, payMethod: '微信支付', createTime: '2024-05-03 16:20:00', logistics: { company: '圆通快递', trackingNo: 'YT9876543210' }, products: [{ name: '毛笔套装 - 礼盒装', quantity: 1, price: 399 }] },
  { id: 'ORD-20240504-001', user: '孙七', phone: '135****7890', status: 'cancelled', totalAmount: 68, payMethod: '', createTime: '2024-05-04 08:10:00', products: [{ name: '墨条 - 徽墨', quantity: 1, price: 68 }] },
  { id: 'ORD-20240505-001', user: '周八', phone: '134****2345', status: 'pending', totalAmount: 597, payMethod: '', createTime: '2024-05-05 11:55:00', products: [{ name: '文房四宝套装', quantity: 2, price: 299 }] },
];

const orderStatusMap: Record<string, { color: 'success' | 'processing' | 'warning' | 'error' | 'default'; label: string }> = {
  pending: { color: 'warning', label: '待付款' },
  paid: { color: 'processing', label: '待发货' },
  shipped: { color: 'processing', label: '已发货' },
  completed: { color: 'success', label: '已完成' },
  cancelled: { color: 'error', label: '已取消' },
};

const orderChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['订单数', '销售额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-01', '05-02', '05-03', '05-04', '05-05', '05-06', '05-07'] },
  yAxis: [
    { type: 'value', name: '订单数' },
    { type: 'value', name: '销售额(万)', position: 'right' },
  ],
  series: [
    { type: 'bar', name: '订单数', data: [12, 18, 15, 10, 22, 16, 20], itemStyle: { color: '#1677FF' } },
    { type: 'line', name: '销售额', yAxisIndex: 1, data: [3.2, 4.5, 3.8, 2.5, 5.2, 4.0, 4.8], itemStyle: { color: '#16A34A' } },
  ],
};

const orderColumns = [
  { title: '订单号', dataIndex: 'id', key: 'id', width: 180, render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
  { title: '用户', dataIndex: 'user', key: 'user', width: 100 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120 },
  { title: '订单金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (val: number) => <span className="text-orange-600 font-semibold">¥{val.toFixed(2)}</span> },
  { title: '支付方式', dataIndex: 'payMethod', key: 'payMethod' },
  { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    width: 100,
    render: (status: string) => {
      const config = orderStatusMap[status];
      return <Badge status={config?.color} text={config?.label} />;
    },
  },
  { 
    title: '操作', 
    key: 'action', 
    width: 200,
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        {record.status === 'paid' && (
          <Button type="link" size="small" icon={<TruckOutlined />}>发货</Button>
        )}
        {record.status === 'shipped' && (
          <Button type="link" size="small" icon={<CheckOutlined />}>确认收货</Button>
        )}
      </Space>
    ),
  },
];

export default function OrdersPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [form] = Form.useForm();

  const totalOrders = mockOrders.length;
  const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
  const paidOrders = mockOrders.filter(o => o.status === 'paid').length;
  const todayRevenue = mockOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalAmount, 0);

  const handleView = (record: any) => {
    setSelectedOrder(record);
    setIsModalVisible(true);
  };

  const handleShip = (record: any) => {
    Modal.confirm({
      title: '确认发货',
      content: `确认对订单 ${record.id} 发货吗？`,
      onOk: () => {
        Modal.success({ title: '操作成功', content: '订单已发货！' });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCartOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">订单管理</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总订单数"
                value={totalOrders}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较昨日 +12%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待付款"
                value={pendingOrders}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">需要提醒</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待发货"
                value={paidOrders}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-red-500 text-sm mt-1">
                <ArrowUpOutlined /> +2
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日营收"
                value={todayRevenue}
                prefix="¥"
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">累计金额</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="订单趋势">
              <SafeECharts option={orderChartOption} style={{ height: 300 }} title="订单趋势" />
            </Card>
          </Col>
        </Row>

        <Card title="订单列表">
          <Table
            dataSource={mockOrders}
            columns={[
              ...orderColumns.map(col => 
                col.key === 'action' 
                  ? { ...col, render: (_: any, record: any) => (
                      <Space size="small">
                        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
                        {record.status === 'paid' && (
                          <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record)}>发货</Button>
                        )}
                      </Space>
                    )}
                  : col
              ),
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="订单详情"
          open={isModalVisible}
          onOk={() => setIsModalVisible(false)}
          onCancel={() => setIsModalVisible(false)}
          width={700}
        >
          {selectedOrder && (
            <div>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="订单号" span={2}>{selectedOrder.id}</Descriptions.Item>
                <Descriptions.Item label="用户">{selectedOrder.user}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{selectedOrder.phone}</Descriptions.Item>
                <Descriptions.Item label="订单金额">¥{selectedOrder.totalAmount.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="支付方式">{selectedOrder.payMethod || '未支付'}</Descriptions.Item>
                <Descriptions.Item label="下单时间" span={2}>{selectedOrder.createTime}</Descriptions.Item>
                <Descriptions.Item label="订单状态" span={2}>
                  <Badge status={orderStatusMap[selectedOrder.status]?.color} text={orderStatusMap[selectedOrder.status]?.label} />
                </Descriptions.Item>
                {selectedOrder.logistics && (
                  <>
                    <Descriptions.Item label="物流公司">{selectedOrder.logistics.company}</Descriptions.Item>
                    <Descriptions.Item label="物流单号">{selectedOrder.logistics.trackingNo}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
              <div className="mt-4">
                <h4 className="font-semibold mb-2">商品明细</h4>
                <Table
                  dataSource={selectedOrder.products}
                  columns={[
                    { title: '商品名称', dataIndex: 'name', key: 'name' },
                    { title: '单价', dataIndex: 'price', key: 'price', render: (val: number) => `¥${val.toFixed(2)}` },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { title: '小计', key: 'subtotal', render: (_: any, record: any) => `¥${(record.price * record.quantity).toFixed(2)}` },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
