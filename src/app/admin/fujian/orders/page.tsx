'use client';

import { useState, useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Descriptions, DatePicker, message } from 'antd';
import { ShoppingOutlined, EyeOutlined, CheckOutlined, TruckOutlined, ArrowUpOutlined, ArrowDownOutlined, CloseOutlined, DollarOutlined, SearchOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface LogisticsInfo {
  company: string;
  trackingNo: string;
}

interface AddressInfo {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
}

interface ProfitShareInfo {
  level: string;
  amount: number;
  status: string;
}

interface Order {
  id: string;
  user: string;
  phone: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding';
  totalAmount: number;
  payMethod: string;
  createTime: string;
  products: OrderProduct[];
  logistics?: LogisticsInfo;
  address?: AddressInfo;
  profitShare?: ProfitShareInfo[];
}

const mockOrders: Order[] = [
  {
    id: 'FJ202606250001',
    user: '张三',
    phone: '138****1234',
    status: 'paid',
    totalAmount: 738,
    payMethod: 'USDT',
    createTime: '2026-06-25 09:30:00',
    products: [{ name: '福建老酒·369', quantity: 2, price: 369 }],
    address: { name: '张三', phone: '138****1234', province: '福建省', city: '福州市', district: '鼓楼区', detail: '五四路88号环球广场1501' },
    profitShare: [{ level: '一级代理', amount: 73.8, status: '待结算' }, { level: '二级代理', amount: 36.9, status: '待结算' }],
  },
  {
    id: 'FJ202606250002',
    user: '李四',
    phone: '139****5678',
    status: 'shipped',
    totalAmount: 699,
    payMethod: '微信支付',
    createTime: '2026-06-25 10:15:00',
    logistics: { company: '顺丰速运', trackingNo: 'SF20260625000123' },
    products: [{ name: '福建老酒·699', quantity: 1, price: 699 }],
    address: { name: '李四', phone: '139****5678', province: '福建省', city: '厦门市', district: '思明区', detail: '中山路168号' },
    profitShare: [{ level: '一级代理', amount: 69.9, status: '待结算' }, { level: '二级代理', amount: 34.95, status: '待结算' }],
  },
  {
    id: 'FJ202606250003',
    user: '王五',
    phone: '137****9012',
    status: 'completed',
    totalAmount: 399,
    payMethod: 'USDT',
    createTime: '2026-06-25 11:20:00',
    logistics: { company: '圆通快递', trackingNo: 'YT20260625000456' },
    products: [{ name: '福建老酒·369礼盒', quantity: 1, price: 399 }],
    address: { name: '王五', phone: '137****9012', province: '浙江省', city: '杭州市', district: '西湖区', detail: '文三路398号' },
    profitShare: [{ level: '一级代理', amount: 39.9, status: '已结算' }, { level: '二级代理', amount: 19.95, status: '已结算' }],
  },
  {
    id: 'FJ202606240001',
    user: '赵六',
    phone: '136****3456',
    status: 'completed',
    totalAmount: 6495,
    payMethod: '银行转账',
    createTime: '2026-06-24 14:30:00',
    logistics: { company: '德邦物流', trackingNo: 'DB20260624000789' },
    products: [{ name: '企业定制·坛装', quantity: 5, price: 1299 }],
    address: { name: '赵六', phone: '136****3456', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园南区深南大道9996号' },
    profitShare: [{ level: '一级代理', amount: 649.5, status: '已结算' }, { level: '二级代理', amount: 324.75, status: '已结算' }],
  },
  {
    id: 'FJ202606240002',
    user: '孙七',
    phone: '135****7890',
    status: 'pending',
    totalAmount: 597,
    payMethod: '',
    createTime: '2026-06-24 16:45:00',
    products: [{ name: '酒具套装', quantity: 3, price: 199 }],
    address: { name: '孙七', phone: '135****7890', province: '江苏省', city: '南京市', district: '鼓楼区', detail: '北京东路23号' },
  },
  {
    id: 'FJ202606240003',
    user: '周八',
    phone: '134****2345',
    status: 'cancelled',
    totalAmount: 369,
    payMethod: '',
    createTime: '2026-06-24 09:10:00',
    products: [{ name: '福建老酒·369', quantity: 1, price: 369 }],
    address: { name: '周八', phone: '134****2345', province: '上海市', city: '上海市', district: '浦东新区', detail: '陆家嘴环路1000号' },
  },
  {
    id: 'FJ202606230001',
    user: '吴九',
    phone: '133****6789',
    status: 'refunding',
    totalAmount: 1398,
    payMethod: 'USDT',
    createTime: '2026-06-23 15:20:00',
    logistics: { company: '中通快递', trackingNo: 'ZT20260623000321' },
    products: [{ name: '福建老酒·699', quantity: 2, price: 699 }],
    address: { name: '吴九', phone: '133****6789', province: '北京市', city: '北京市', district: '朝阳区', detail: '建国路88号SOHO现代城' },
    profitShare: [{ level: '一级代理', amount: 139.8, status: '待退回' }, { level: '二级代理', amount: 69.9, status: '待退回' }],
  },
  {
    id: 'FJ202606230002',
    user: '郑十',
    phone: '132****0123',
    status: 'paid',
    totalAmount: 2598,
    payMethod: '支付宝',
    createTime: '2026-06-23 11:30:00',
    products: [{ name: '福建老酒·369礼盒', quantity: 2, price: 399 }, { name: '酒具套装', quantity: 2, price: 199 }, { name: '福建老酒·699', quantity: 2, price: 699 }],
    address: { name: '郑十', phone: '132****0123', province: '四川省', city: '成都市', district: '锦江区', detail: '春熙路IFS国际金融中心' },
    profitShare: [{ level: '一级代理', amount: 259.8, status: '待结算' }, { level: '二级代理', amount: 129.9, status: '待结算' }],
  },
  {
    id: 'FJ202606220001',
    user: '冯十一',
    phone: '131****4567',
    status: 'completed',
    totalAmount: 1299,
    payMethod: '微信支付',
    createTime: '2026-06-22 13:45:00',
    logistics: { company: '京东物流', trackingNo: 'JD20260622000654' },
    products: [{ name: '企业定制·坛装', quantity: 1, price: 1299 }],
    address: { name: '冯十一', phone: '131****4567', province: '山东省', city: '青岛市', district: '市南区', detail: '香港中路59号' },
    profitShare: [{ level: '一级代理', amount: 129.9, status: '已结算' }, { level: '二级代理', amount: 64.95, status: '已结算' }],
  },
  {
    id: 'FJ202606220002',
    user: '陈十二',
    phone: '130****8901',
    status: 'shipped',
    totalAmount: 798,
    payMethod: 'USDT',
    createTime: '2026-06-22 10:00:00',
    logistics: { company: '顺丰速运', trackingNo: 'SF20260622000987' },
    products: [{ name: '福建老酒·369', quantity: 1, price: 369 }, { name: '福建老酒·369礼盒', quantity: 1, price: 399 }, { name: '酒具套装', quantity: 1, price: 30 }],
    address: { name: '陈十二', phone: '130****8901', province: '湖南省', city: '长沙市', district: '芙蓉区', detail: '五一大道766号' },
    profitShare: [{ level: '一级代理', amount: 79.8, status: '待结算' }, { level: '二级代理', amount: 39.9, status: '待结算' }],
  },
];

const orderStatusMap: Record<string, { color: 'success' | 'processing' | 'warning' | 'error' | 'default'; label: string }> = {
  pending: { color: 'warning', label: '待付款' },
  paid: { color: 'processing', label: '待发货' },
  shipped: { color: 'processing', label: '已发货' },
  completed: { color: 'success', label: '已完成' },
  cancelled: { color: 'error', label: '已取消' },
  refunding: { color: 'warning', label: '退款中' },
};

const orderChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['订单数', '销售额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['06-20', '06-21', '06-22', '06-23', '06-24', '06-25', '06-26'] },
  yAxis: [
    { type: 'value', name: '订单数' },
    { type: 'value', name: '销售额(元)', position: 'right' },
  ],
  series: [
    { type: 'bar', name: '订单数', data: [8, 12, 15, 10, 18, 22, 5], itemStyle: { color: '#D97706' } },
    { type: 'line', name: '销售额', yAxisIndex: 1, data: [4500, 6800, 8500, 5200, 9800, 12500, 3200], itemStyle: { color: '#16A34A' } },
  ],
};

export default function FujianOrdersPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [payMethodFilter, setPayMethodFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const todayRevenue = orders.filter(o => o.createTime.startsWith('2026-06-25') && o.status !== 'cancelled' && o.status !== 'pending').reduce((sum, o) => sum + o.totalAmount, 0);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (payMethodFilter !== 'all' && order.payMethod !== payMethodFilter) return false;
      if (searchText && !order.id.includes(searchText) && !order.user.includes(searchText)) return false;
      return true;
    });
  }, [orders, statusFilter, payMethodFilter, searchText]);

  const handleView = (record: Order) => {
    setSelectedOrder(record);
    setIsModalVisible(true);
  };

  const handleShip = (record: Order) => {
    Modal.confirm({
      title: '确认发货',
      content: `确认对订单 ${record.id} 发货吗？`,
      onOk: () => {
        setOrders(prev => prev.map(o => 
          o.id === record.id 
            ? { ...o, status: 'shipped' as const, logistics: { company: '顺丰速运', trackingNo: 'SF' + Date.now() } }
            : o
        ));
        message.success('订单已发货！');
      },
    });
  };

  const handleConfirmReceive = (record: Order) => {
    Modal.confirm({
      title: '确认收货',
      content: `确认订单 ${record.id} 已收货吗？`,
      onOk: () => {
        setOrders(prev => prev.map(o => 
          o.id === record.id ? { ...o, status: 'completed' as const } : o
        ));
        message.success('订单已完成！');
      },
    });
  };

  const handleCancel = (record: Order) => {
    Modal.confirm({
      title: '取消订单',
      content: `确定要取消订单 ${record.id} 吗？`,
      okType: 'danger',
      onOk: () => {
        setOrders(prev => prev.map(o => 
          o.id === record.id ? { ...o, status: 'cancelled' as const } : o
        ));
        message.success('订单已取消！');
      },
    });
  };

  const handleRefund = (record: Order) => {
    Modal.confirm({
      title: '申请退款',
      content: `确定要为订单 ${record.id} 申请退款吗？`,
      onOk: () => {
        setOrders(prev => prev.map(o => 
          o.id === record.id ? { ...o, status: 'refunding' as const } : o
        ));
        message.success('退款申请已提交！');
      },
    });
  };

  const orderColumns = [
    { title: '订单号', dataIndex: 'id', key: 'id', width: 160, render: (text: string) => <span className="font-semibold text-amber-700">{text}</span> },
    { title: '用户', dataIndex: 'user', key: 'user', width: 80 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
    { 
      title: '商品', 
      dataIndex: 'products', 
      key: 'products', 
      width: 200,
      render: (products: OrderProduct[]) => (
        <div>
          {products.slice(0, 2).map((p, i) => (
            <div key={i} className="text-sm text-gray-600">
              {p.name} x{p.quantity}
            </div>
          ))}
          {products.length > 2 && <div className="text-xs text-gray-400">等{products.length}件商品</div>}
        </div>
      ),
    },
    { title: '订单金额', dataIndex: 'totalAmount', key: 'totalAmount', width: 100, render: (val: number) => <span className="text-orange-600 font-semibold">¥{val.toFixed(2)}</span> },
    { 
      title: '支付方式', 
      dataIndex: 'payMethod', 
      key: 'payMethod', 
      width: 100,
      render: (val: string) => val ? (
        <Tag color={val === 'USDT' ? 'blue' : 'green'}>{val}</Tag>
      ) : <span className="text-gray-400">未支付</span>,
    },
    { title: '下单时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
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
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {record.status === 'paid' && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleShip(record)}>发货</Button>
          )}
          {record.status === 'shipped' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleConfirmReceive(record)}>确认收货</Button>
          )}
          {(record.status === 'pending' || record.status === 'paid') && (
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleCancel(record)}>取消</Button>
          )}
          {(record.status === 'shipped' || record.status === 'completed') && (
            <Button type="link" size="small" icon={<DollarOutlined />} onClick={() => handleRefund(record)}>退款</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingOutlined className="text-2xl text-amber-600" />
            <h1 className="text-2xl font-bold m-0">福建老酒订单管理</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="总订单数"
                value={totalOrders}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较昨日 +15%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="待付款"
                value={pendingOrders}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">需要提醒</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="待发货"
                value={paidOrders}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-red-500 text-sm mt-1">
                <ArrowUpOutlined /> +1
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已发货"
                value={shippedOrders}
                valueStyle={{ color: '#0EA5E9' }}
              />
              <div className="text-gray-400 text-sm mt-1">配送中</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="已完成"
                value={completedOrders}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 增长稳定
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Card>
              <Statistic
                title="今日销售额"
                value={todayRevenue}
                prefix="¥"
                valueStyle={{ color: '#D97706' }}
              />
              <div className="text-gray-400 text-sm mt-1">截至当前</div>
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <Input
              placeholder="搜索订单号/用户名"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">待付款</Option>
              <Option value="paid">待发货</Option>
              <Option value="shipped">已发货</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="refunding">退款中</Option>
            </Select>
            <Select
              value={payMethodFilter}
              onChange={setPayMethodFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部支付</Option>
              <Option value="USDT">USDT</Option>
              <Option value="微信支付">微信支付</Option>
              <Option value="支付宝">支付宝</Option>
              <Option value="银行转账">银行转账</Option>
            </Select>
            <RangePicker style={{ width: 280 }} />
            <Button type="primary">查询</Button>
            <Button>重置</Button>
          </div>

          <Table
            dataSource={filteredOrders}
            columns={orderColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            scroll={{ x: 1300 }}
          />
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="订单趋势（近7天）">
              <SafeECharts option={orderChartOption} style={{ height: 300 }} title="订单趋势" />
            </Card>
          </Col>
        </Row>

        <Modal
          title="订单详情"
          open={isModalVisible}
          onOk={() => setIsModalVisible(false)}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          footer={[
            <Button key="close" onClick={() => setIsModalVisible(false)}>关闭</Button>,
          ]}
        >
          {selectedOrder && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small" title="基本信息">
                <Descriptions.Item label="订单号" span={2}>{selectedOrder.id}</Descriptions.Item>
                <Descriptions.Item label="用户">{selectedOrder.user}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{selectedOrder.phone}</Descriptions.Item>
                <Descriptions.Item label="订单金额"><span className="text-orange-600 font-semibold">¥{selectedOrder.totalAmount.toFixed(2)}</span></Descriptions.Item>
                <Descriptions.Item label="支付方式">{selectedOrder.payMethod || '未支付'}</Descriptions.Item>
                <Descriptions.Item label="下单时间" span={2}>{selectedOrder.createTime}</Descriptions.Item>
                <Descriptions.Item label="订单状态" span={2}>
                  <Badge status={orderStatusMap[selectedOrder.status]?.color} text={orderStatusMap[selectedOrder.status]?.label} />
                </Descriptions.Item>
              </Descriptions>

              {selectedOrder.address && (
                <Descriptions bordered column={1} size="small" title="收货地址">
                  <Descriptions.Item label="收货人">
                    {selectedOrder.address.name} &nbsp;&nbsp; {selectedOrder.address.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="详细地址">
                    {selectedOrder.address.province}{selectedOrder.address.city}{selectedOrder.address.district}{selectedOrder.address.detail}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {selectedOrder.logistics && (
                <Descriptions bordered column={2} size="small" title="物流信息">
                  <Descriptions.Item label="物流公司">{selectedOrder.logistics.company}</Descriptions.Item>
                  <Descriptions.Item label="物流单号">{selectedOrder.logistics.trackingNo}</Descriptions.Item>
                </Descriptions>
              )}

              <div>
                <h4 className="font-semibold mb-2">商品明细</h4>
                <Table
                  dataSource={selectedOrder.products}
                  columns={[
                    { title: '商品名称', dataIndex: 'name', key: 'name' },
                    { title: '单价', dataIndex: 'price', key: 'price', width: 100, render: (val: number) => `¥${val.toFixed(2)}` },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
                    { title: '小计', key: 'subtotal', width: 100, render: (_: any, record: OrderProduct) => `¥${(record.price * record.quantity).toFixed(2)}` },
                  ]}
                  pagination={false}
                  size="small"
                  rowKey="name"
                />
              </div>

              {selectedOrder.profitShare && selectedOrder.profitShare.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">分润信息</h4>
                  <Table
                    dataSource={selectedOrder.profitShare}
                    columns={[
                      { title: '级别', dataIndex: 'level', key: 'level' },
                      { title: '分润金额', dataIndex: 'amount', key: 'amount', render: (val: number) => <span className="text-green-600">¥{val.toFixed(2)}</span> },
                      { title: '状态', dataIndex: 'status', key: 'status' },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="level"
                  />
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
