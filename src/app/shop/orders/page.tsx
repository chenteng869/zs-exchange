'use client';

import { useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Tabs,
  Empty,
  Image,
  Space,
  Badge,
  Modal,
  Row,
  Col,
  Divider,
  message,
} from 'antd';
import {
  ShoppingOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TruckOutlined,
  GiftOutlined,
  ExclamationCircleOutlined,
  StarOutlined,
  ReloadOutlined,
  EyeOutlined,
  PayCircleOutlined,
} from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunding';

interface OrderItem {
  id: string;
  name: string;
  spec: string;
  price: number;
  quantity: number;
  image: string;
  emoji: string;
}

interface Order {
  orderNo: string;
  createTime: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  payMethod: string;
  trackingNo?: string;
  trackingCompany?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending:   { label: '待付款',  color: '#F0B90B', bgColor: 'rgba(240, 185, 11, 0.15)' },
  paid:      { label: '待发货',  color: '#38BDF8', bgColor: 'rgba(56, 189, 248, 0.15)' },
  shipped:   { label: '待收货',  color: '#A78BFA', bgColor: 'rgba(167, 139, 250, 0.15)' },
  completed: { label: '已完成',  color: '#34D399', bgColor: 'rgba(52, 211, 153, 0.15)' },
  cancelled: { label: '已取消',  color: '#7B89B8', bgColor: 'rgba(123, 137, 184, 0.15)' },
  refunding: { label: '退款中',  color: '#F472B6', bgColor: 'rgba(244, 114, 182, 0.15)' },
};

const mockOrders: Order[] = [
  {
    orderNo: 'FJ202606250001',
    createTime: '2026-06-25 09:30',
    status: 'paid',
    items: [
      {
        id: '1',
        name: '福建老酒·369',
        spec: '500ml/瓶',
        price: 369,
        quantity: 2,
        image: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
        emoji: '🍶',
      },
    ],
    totalAmount: 738,
    payMethod: 'USDT支付',
  },
  {
    orderNo: 'FJ202606250002',
    createTime: '2026-06-25 10:15',
    status: 'shipped',
    items: [
      {
        id: '2',
        name: '福建老酒·699',
        spec: '500ml/瓶',
        price: 699,
        quantity: 1,
        image: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
        emoji: '🍾',
      },
    ],
    totalAmount: 699,
    payMethod: '微信支付',
    trackingNo: 'SF1234567890',
    trackingCompany: '顺丰速运',
  },
  {
    orderNo: 'FJ202606240003',
    createTime: '2026-06-24 11:20',
    status: 'completed',
    items: [
      {
        id: '3',
        name: '福建老酒·369礼盒',
        spec: '500mlx2/礼盒装',
        price: 399,
        quantity: 1,
        image: 'linear-gradient(135deg, #F0B90B 0%, #F472B6 100%)',
        emoji: '🎁',
      },
    ],
    totalAmount: 399,
    payMethod: 'USDT',
  },
  {
    orderNo: 'FJ202606240001',
    createTime: '2026-06-24 14:30',
    status: 'completed',
    items: [
      {
        id: '4',
        name: '企业定制·坛装',
        spec: '5L/坛 企业定制',
        price: 1299,
        quantity: 5,
        image: 'linear-gradient(135deg, #DC2626 0%, #F0B90B 100%)',
        emoji: '🏺',
      },
    ],
    totalAmount: 6495,
    payMethod: '银行转账',
  },
  {
    orderNo: 'FJ202606230001',
    createTime: '2026-06-23 16:45',
    status: 'pending',
    items: [
      {
        id: '5',
        name: '酒具套装',
        spec: '6件套 陶瓷酒具',
        price: 199,
        quantity: 3,
        image: 'linear-gradient(135deg, #38BDF8 0%, #A78BFA 100%)',
        emoji: '🍷',
      },
    ],
    totalAmount: 597,
    payMethod: 'USDT',
  },
  {
    orderNo: 'FJ202606220001',
    createTime: '2026-06-22 08:30',
    status: 'cancelled',
    items: [
      {
        id: '6',
        name: '福建老酒·369',
        spec: '500ml/瓶',
        price: 369,
        quantity: 1,
        image: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
        emoji: '🍶',
      },
    ],
    totalAmount: 369,
    payMethod: '支付宝',
  },
  {
    orderNo: 'FJ202606210001',
    createTime: '2026-06-21 13:15',
    status: 'refunding',
    items: [
      {
        id: '7',
        name: '收藏证书',
        spec: '限量版 带编号',
        price: 99,
        quantity: 2,
        image: 'linear-gradient(135deg, #F472B6 0%, #A78BFA 100%)',
        emoji: '📜',
      },
    ],
    totalAmount: 198,
    payMethod: 'USDT',
  },
  {
    orderNo: 'FJ202606200001',
    createTime: '2026-06-20 15:40',
    status: 'completed',
    items: [
      {
        id: '8',
        name: '福建老酒·699VIP尊享',
        spec: '700ml VIP尊享版',
        price: 799,
        quantity: 1,
        image: 'linear-gradient(135deg, #F0B90B 0%, #DC2626 100%)',
        emoji: '👑',
      },
    ],
    totalAmount: 799,
    payMethod: 'USDT',
  },
];

const tabItems = [
  { key: 'all', label: '全部', icon: <ShoppingOutlined /> },
  { key: 'pending', label: '待付款', icon: <CreditCardOutlined /> },
  { key: 'paid', label: '待发货', icon: <GiftOutlined /> },
  { key: 'shipped', label: '待收货', icon: <TruckOutlined /> },
  { key: 'completed', label: '已完成', icon: <CheckCircleOutlined /> },
  { key: 'cancelled', label: '已取消', icon: <CloseCircleOutlined /> },
];

export default function ShopOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<string>('');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const filteredOrders = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const orderCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    refunding: orders.filter(o => o.status === 'refunding').length,
  };

  const handleAction = (order: Order, type: string) => {
    setCurrentOrder(order);
    setModalType(type);
    setModalVisible(true);
  };

  const confirmAction = () => {
    if (!currentOrder) return;

    let newStatus: OrderStatus | null = null;
    let successMsg = '';

    switch (modalType) {
      case 'pay':
        newStatus = 'paid';
        successMsg = '支付成功！';
        break;
      case 'cancel':
        newStatus = 'cancelled';
        successMsg = '订单已取消';
        break;
      case 'confirm':
        newStatus = 'completed';
        successMsg = '确认收货成功！';
        break;
      case 'refund':
        newStatus = 'refunding';
        successMsg = '退款申请已提交';
        break;
      default:
        break;
    }

    if (newStatus) {
      setOrders(prev =>
        prev.map(o =>
          o.orderNo === currentOrder.orderNo
            ? { ...o, status: newStatus! }
            : o
        )
      );
      messageApi.success(successMsg);
    }

    setModalVisible(false);
    setCurrentOrder(null);
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'pay': return '确认付款';
      case 'cancel': return '取消订单';
      case 'confirm': return '确认收货';
      case 'refund': return '申请退款';
      case 'logistics': return '物流信息';
      case 'review': return '商品评价';
      case 'rebuy': return '再次购买';
      default: return '提示';
    }
  };

  const getModalContent = () => {
    if (!currentOrder) return null;

    switch (modalType) {
      case 'pay':
        return (
          <div className="space-y-4">
            <p>确定要支付订单 <span className="font-bold" style={{ color: '#F0B90B' }}>{currentOrder.orderNo}</span> 吗？</p>
            <div className="p-4 rounded-lg" style={{ background: 'rgba(240, 185, 11, 0.1)' }}>
              <div className="flex justify-between items-center">
                <span style={{ color: '#B4C0E0' }}>支付金额</span>
                <span className="text-2xl font-bold" style={{ color: '#F0B90B' }}>¥{currentOrder.totalAmount}</span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span style={{ color: '#7B89B8' }}>支付方式</span>
                <span style={{ color: '#B4C0E0' }}>{currentOrder.payMethod}</span>
              </div>
            </div>
          </div>
        );
      case 'cancel':
        return (
          <div className="space-y-4">
            <p>确定要取消订单 <span className="font-bold" style={{ color: '#F0B90B' }}>{currentOrder.orderNo}</span> 吗？</p>
            <p className="text-sm" style={{ color: '#7B89B8' }}>取消后将无法恢复，请谨慎操作。</p>
          </div>
        );
      case 'confirm':
        return (
          <div className="space-y-4">
            <p>确定已收到商品，确认收货吗？</p>
            <p className="text-sm" style={{ color: '#7B89B8' }}>订单号：{currentOrder.orderNo}</p>
          </div>
        );
      case 'refund':
        return (
          <div className="space-y-4">
            <p>确定要对订单 <span className="font-bold" style={{ color: '#F0B90B' }}>{currentOrder.orderNo}</span> 申请退款吗？</p>
            <p className="text-sm" style={{ color: '#7B89B8' }}>退款金额将原路返回，预计3-5个工作日到账。</p>
          </div>
        );
      case 'logistics':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: '#B4C0E0' }}>物流公司</span>
              <span style={{ color: '#F8FAFC' }}>{currentOrder.trackingCompany}</span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#B4C0E0' }}>运单号</span>
              <span className="font-mono" style={{ color: '#F0B90B' }}>{currentOrder.trackingNo}</span>
            </div>
            <Divider style={{ margin: '12px 0', borderColor: 'rgba(148, 163, 184, 0.18)' }} />
            <div className="space-y-3">
              {[
                { time: '2026-06-25 14:30', desc: '快件已从【福州转运中心】发出，下一站【厦门】', active: true },
                { time: '2026-06-25 10:15', desc: '卖家已发货' },
                { time: '2026-06-25 09:30', desc: '订单处理中' },
              ].map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                    style={{ background: item.active ? '#F0B90B' : '#7B89B8' }}
                  />
                  <div>
                    <div className="text-sm" style={{ color: item.active ? '#F8FAFC' : '#7B89B8' }}>{item.desc}</div>
                    <div className="text-xs mt-1" style={{ color: '#7B89B8' }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="space-y-4">
            <p>请对商品进行评价：</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <StarOutlined
                  key={star}
                  style={{ fontSize: 24, color: star <= 4 ? '#F0B90B' : '#7B89B8', cursor: 'pointer' }}
                />
              ))}
            </div>
            <textarea
              placeholder="请输入您的评价..."
              className="w-full p-3 rounded-lg border text-sm"
              rows={4}
              style={{
                background: 'rgba(26, 36, 86, 0.55)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
                color: '#F8FAFC',
                resize: 'none',
              }}
            />
          </div>
        );
      case 'rebuy':
        return (
          <div className="space-y-4">
            <p>确定将以下商品加入购物车吗？</p>
            {currentOrder.items.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(26, 36, 86, 0.55)' }}>
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ background: item.image }}
                >
                  {item.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: '#F8FAFC' }}>{item.name}</div>
                  <div className="text-xs mt-1" style={{ color: '#7B89B8' }}>{item.spec} × {item.quantity}</div>
                </div>
                <div className="font-bold" style={{ color: '#F0B90B' }}>¥{item.price * item.quantity}</div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const renderOrderActions = (order: Order) => {
    const actions: JSX.Element[] = [];

    switch (order.status) {
      case 'pending':
        actions.push(
          <Button
            key="cancel"
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleAction(order, 'cancel')}
            style={{ borderColor: 'rgba(123, 137, 184, 0.3)', color: '#7B89B8' }}
          >
            取消订单
          </Button>
        );
        actions.push(
          <Button
            key="pay"
            type="primary"
            size="small"
            icon={<PayCircleOutlined />}
            onClick={() => handleAction(order, 'pay')}
            style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', border: 'none', color: '#0F1B3D' }}
          >
            立即付款
          </Button>
        );
        break;
      case 'paid':
        actions.push(
          <Button
            key="refund"
            size="small"
            icon={<ExclamationCircleOutlined />}
            onClick={() => handleAction(order, 'refund')}
            style={{ borderColor: 'rgba(244, 114, 182, 0.4)', color: '#F472B6' }}
          >
            申请退款
          </Button>
        );
        break;
      case 'shipped':
        actions.push(
          <Button
            key="logistics"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleAction(order, 'logistics')}
            style={{ borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38BDF8' }}
          >
            查看物流
          </Button>
        );
        actions.push(
          <Button
            key="confirm"
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleAction(order, 'confirm')}
            style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)', border: 'none' }}
          >
            确认收货
          </Button>
        );
        break;
      case 'completed':
        actions.push(
          <Button
            key="rebuy"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleAction(order, 'rebuy')}
            style={{ borderColor: 'rgba(167, 139, 250, 0.4)', color: '#A78BFA' }}
          >
            再次购买
          </Button>
        );
        actions.push(
          <Button
            key="review"
            type="primary"
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleAction(order, 'review')}
            style={{ background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', border: 'none', color: '#0F1B3D' }}
          >
            评价
          </Button>
        );
        break;
      case 'cancelled':
        actions.push(
          <Button
            key="rebuy"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleAction(order, 'rebuy')}
            style={{ borderColor: 'rgba(167, 139, 250, 0.4)', color: '#A78BFA' }}
          >
            再次购买
          </Button>
        );
        break;
      case 'refunding':
        actions.push(
          <Button
            key="detail"
            size="small"
            icon={<EyeOutlined />}
            style={{ borderColor: 'rgba(244, 114, 182, 0.4)', color: '#F472B6' }}
          >
            退款详情
          </Button>
        );
        break;
    }

    return actions;
  };

  return (
    <UserLayout activeMenu="/shop/orders">
      {contextHolder}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingOutlined style={{ fontSize: 24, color: '#F0B90B' }} />
            <h1 className="text-2xl font-bold m-0" style={{ color: '#F8FAFC' }}>我的订单</h1>
          </div>
          <Space>
            <Badge count={orderCounts.pending} size="small" color="#F0B90B">
              <span style={{ color: '#7B89B8' }}>待付款</span>
            </Badge>
            <Badge count={orderCounts.paid} size="small" color="#38BDF8">
              <span style={{ color: '#7B89B8' }}>待发货</span>
            </Badge>
            <Badge count={orderCounts.shipped} size="small" color="#A78BFA">
              <span style={{ color: '#7B89B8' }}>待收货</span>
            </Badge>
            <Badge count={orderCounts.refunding} size="small" color="#F472B6">
              <span style={{ color: '#7B89B8' }}>退款中</span>
            </Badge>
          </Space>
        </div>

        <Card
          style={{
            background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 16,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems.map(item => ({
              ...item,
              label: (
                <span style={{ color: activeTab === item.key ? '#F0B90B' : '#B4C0E0' }}>
                  {item.label}
                </span>
              ),
            }))}
          />

          <div style={{ padding: 24 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ padding: '60px 0' }}>
                <Empty
                  description={
                    <span style={{ color: '#7B89B8' }}>暂无订单</span>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  style={{ color: '#7B89B8' }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map(order => {
                  const statusConfig = STATUS_CONFIG[order.status];
                  return (
                    <Card
                      key={order.orderNo}
                      style={{
                        background: 'rgba(15, 27, 61, 0.7)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        borderRadius: 12,
                      }}
                      bodyStyle={{ padding: 0 }}
                    >
                      <div
                        style={{
                          padding: '16px 24px',
                          borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Space size="middle">
                          <span style={{ color: '#7B89B8', fontSize: 13 }}>
                            订单号：<span style={{ color: '#B4C0E0', fontFamily: 'monospace' }}>{order.orderNo}</span>
                          </span>
                          <span style={{ color: '#7B89B8', fontSize: 13 }}>
                            下单时间：{order.createTime}
                          </span>
                        </Space>
                        <Tag
                          color={statusConfig.color}
                          style={{
                            background: statusConfig.bgColor,
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {statusConfig.label}
                        </Tag>
                      </div>

                      {order.items.map(item => (
                        <Row
                          key={item.id}
                          align="middle"
                          style={{ padding: '20px 24px' }}
                          gutter={16}
                        >
                          <Col>
                            <div
                              style={{
                                width: 80,
                                height: 80,
                                borderRadius: 12,
                                background: item.image,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 40,
                              }}
                            >
                              {item.emoji}
                            </div>
                          </Col>
                          <Col flex={1}>
                            <div className="font-medium text-base" style={{ color: '#F8FAFC' }}>
                              {item.name}
                            </div>
                            <div className="text-sm mt-2" style={{ color: '#7B89B8' }}>
                              规格：{item.spec}
                            </div>
                          </Col>
                          <Col style={{ textAlign: 'center' }}>
                            <div style={{ color: '#B4C0E0' }}>¥{item.price}</div>
                            <div className="text-sm mt-1" style={{ color: '#7B89B8' }}>单价</div>
                          </Col>
                          <Col style={{ textAlign: 'center' }}>
                            <div style={{ color: '#B4C0E0' }}>×{item.quantity}</div>
                            <div className="text-sm mt-1" style={{ color: '#7B89B8' }}>数量</div>
                          </Col>
                          <Col style={{ textAlign: 'right' }}>
                            <div className="text-lg font-bold" style={{ color: '#F0B90B' }}>
                              ¥{item.price * item.quantity}
                            </div>
                          </Col>
                        </Row>
                      ))}

                      {order.trackingNo && (
                        <div
                          style={{
                            padding: '12px 24px',
                            margin: '0 24px',
                            background: 'rgba(167, 139, 250, 0.1)',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Space>
                            <TruckOutlined style={{ color: '#A78BFA' }} />
                            <span style={{ color: '#B4C0E0', fontSize: 13 }}>
                              {order.trackingCompany}
                            </span>
                            <span style={{ color: '#A78BFA', fontSize: 13, fontFamily: 'monospace' }}>
                              {order.trackingNo}
                            </span>
                          </Space>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => handleAction(order, 'logistics')}
                            style={{ color: '#A78BFA' }}
                          >
                            查看物流
                          </Button>
                        </div>
                      )}

                      <div
                        style={{
                          padding: '16px 24px',
                          borderTop: '1px solid rgba(148, 163, 184, 0.10)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Space size="middle">
                          <span style={{ color: '#7B89B8', fontSize: 13 }}>
                            支付方式：<span style={{ color: '#B4C0E0' }}>{order.payMethod}</span>
                          </span>
                          <span style={{ color: '#7B89B8', fontSize: 13 }}>
                            共 {order.items.reduce((sum, i) => sum + i.quantity, 0)} 件商品
                          </span>
                        </Space>
                        <div className="flex items-center gap-4">
                          <span style={{ color: '#B4C0E0' }}>
                            实付：<span className="text-xl font-bold ml-1" style={{ color: '#F0B90B' }}>¥{order.totalAmount}</span>
                          </span>
                          <Space size="small">
                            {renderOrderActions(order)}
                          </Space>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Modal
          title={
            <span style={{ color: '#F8FAFC' }}>{getModalTitle()}</span>
          }
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          onOk={confirmAction}
          okText={
            modalType === 'pay' ? '确认支付' :
            modalType === 'cancel' ? '确认取消' :
            modalType === 'confirm' ? '确认收货' :
            modalType === 'refund' ? '提交申请' :
            modalType === 'review' ? '提交评价' :
            modalType === 'rebuy' ? '加入购物车' :
            '确定'
          }
          cancelText="取消"
          okButtonProps={{
            style: {
              background: modalType === 'cancel'
                ? 'transparent'
                : 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
              border: modalType === 'cancel' ? '1px solid rgba(244, 114, 182, 0.4)' : 'none',
              color: modalType === 'cancel' ? '#F472B6' : '#0F1B3D',
            },
          }}
          cancelButtonProps={{
            style: {
              borderColor: 'rgba(123, 137, 184, 0.3)',
              color: '#7B89B8',
              background: 'transparent',
            },
          }}
          styles={{
            content: {
              background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.95) 0%, rgba(21, 34, 74, 0.95) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.18)',
              borderRadius: 16,
            },
            header: {
              borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
            },
            footer: {
              borderTop: '1px solid rgba(148, 163, 184, 0.18)',
            },
          }}
          footer={
            modalType === 'logistics'
              ? [
                  <Button
                    key="close"
                    onClick={() => setModalVisible(false)}
                    style={{ borderColor: 'rgba(123, 137, 184, 0.3)', color: '#7B89B8' }}
                  >
                    关闭
                  </Button>,
                ]
              : undefined
          }
        >
          {getModalContent()}
        </Modal>
      </div>
    </UserLayout>
  );
}
