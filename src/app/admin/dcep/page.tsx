'use client';

import { useState } from 'react';
import {
  Card,
  Tag,
  Badge,
  Button,
  Space,
  Row,
  Col,
  Typography,
  Divider,
} from 'antd';
import {
  WalletOutlined,
  DollarOutlined,
  ShopOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Title, Paragraph } = Typography;

interface DcepTransaction {
  id: string;
  user: string;
  amount: number;
  type: string;
  status: string;
  time: string;
  channel: string;
}

const mockTransactions: DcepTransaction[] = [
  { id: 'DCEP-20240623001', user: '张*明', amount: 50000, type: 'recharge', status: 'success', time: '2024-06-23 14:32:15', channel: 'APP' },
  { id: 'DCEP-20240623002', user: '李*华', amount: 20000, type: 'withdraw', status: 'processing', time: '2024-06-23 14:28:08', channel: 'WEB' },
  { id: 'DCEP-20240623003', user: '王*强', amount: 100000, type: 'recharge', status: 'success', time: '2024-06-23 14:15:42', channel: 'API' },
  { id: 'DCEP-20240623004', user: '赵*芳', amount: 1280, type: 'pay', status: 'success', time: '2024-06-23 13:58:20', channel: 'APP' },
  { id: 'DCEP-20240623005', user: '刘*伟', amount: 8000, type: 'recharge', status: 'failed', time: '2024-06-23 13:42:55', channel: 'WEB' },
  { id: 'DCEP-20240623006', user: '陈*静', amount: 35000, type: 'exchange', status: 'success', time: '2024-06-23 13:25:10', channel: 'API' },
  { id: 'DCEP-20240623007', user: '周*磊', amount: 50000, type: 'recharge', status: 'processing', time: '2024-06-23 12:58:33', channel: 'APP' },
  { id: 'DCEP-20240623008', user: '吴*敏', amount: 15000, type: 'withdraw', status: 'success', time: '2024-06-23 12:35:18', channel: 'WEB' },
  { id: 'DCEP-20240623009', user: '郑*涛', amount: 250000, type: 'recharge', status: 'success', time: '2024-06-23 11:48:22', channel: 'API' },
  { id: 'DCEP-20240623010', user: '孙*琳', amount: 6500, type: 'pay', status: 'processing', time: '2024-06-23 11:22:05', channel: 'APP' },
];

const txTypeMap: Record<string, { color: string; label: string }> = {
  recharge: { color: 'green', label: '充值' },
  withdraw: { color: 'blue', label: '提现' },
  pay: { color: 'purple', label: '消费/支付' },
  exchange: { color: 'orange', label: '兑换USDT' },
};

const statusConfig: Record<string, { color: any; label: string }> = {
  success: { color: 'success', label: '成功' },
  processing: { color: 'processing', label: '处理中' },
  failed: { color: 'error', label: '失败' },
};

const features = [
  {
    icon: <BankOutlined style={{ fontSize: 24 }} />,
    title: '央行数字货币对接',
    desc: '直连中国人民银行数字人民币运营体系，支持四大行及多家商业银行通道，T+0 实时结算。',
    color: '#1677FF',
  },
  {
    icon: <SafetyCertificateOutlined style={{ fontSize: 24 }} />,
    title: '合规风控体系',
    desc: '符合《数字人民币研发进展》白皮书要求，AML/KYC 全链路覆盖，交易限额分级管理。',
    color: '#16A34A',
  },
  {
    icon: <ThunderboltOutlined style={{ fontSize: 24 }} />,
    title: '高并发处理能力',
    desc: '支持 10,000+ TPS 峰值吞吐，平均延迟低于 50ms，99.99% 系统可用性保障。',
    color: '#F59E0B',
  },
  {
    icon: <ApiOutlined style={{ fontSize: 24 }} />,
    title: '多端统一接入',
    desc: '提供 APP / WEB / API 三端统一接入能力，SDK 开箱即用，开发者友好。',
    color: '#7C3AED',
  },
];

export default function DcepPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<DcepTransaction | null>(null);

  const handleViewDetail = (record: DcepTransaction) => {
    setSelectedTx(record);
    setDetailOpen(true);
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: handleViewDetail,
    },
  ];

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'txId',
      render: (t: string) => (
        <span className="font-mono text-xs text-blue-600">{t}</span>
      ),
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'userName',
    },
    {
      title: '金额(CNY)',
      dataIndex: 'amount',
      key: 'amountCny',
      render: (v: number) => (
        <span className="font-semibold">{'\u00A5'}{v.toLocaleString()}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'txType',
      render: (t: string) => {
        const cfg = txTypeMap[t];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{t}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'txStatus',
      render: (s: string) => {
        const cfg = statusConfig[s];
        return cfg ? <Badge status={cfg.color} text={cfg.label} /> : <Badge status="default" text={s} />;
      },
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'txTime',
      render: (t: string) => (
        <Text type="secondary" className="text-xs">{t}</Text>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <WalletOutlined /> 数字人民币DCEP管理中心
            </h1>
            <p className="text-gray-500 mt-1">e-CNY桥接 · 央行数字货币对接 · 合规兑换</p>
          </div>
          <Space>
            <Button icon={<SwapOutlined />}>对账</Button>
            <Button type="primary" icon={<ApiOutlined />}>接口配置</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日交易额"
              value="4,862"
              suffix="万 CNY"
              icon={<DollarOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+15.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="累计用户"
              value={28650}
              suffix="人"
              icon={<SafetyCertificateOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+328 今日"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="商户数"
              value={158}
              suffix="家"
              icon={<ShopOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+5 本月"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="待清算"
              value="128.5"
              suffix="万 CNY"
              icon={<ClockCircleOutlined />}
              color="#DC2626"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="兑换率"
              value="7.2456"
              suffix=" CNY/USDT"
              icon={<SwapOutlined />}
              color="#0891B2"
              trend="down"
              trendValue="-0.02%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockTransactions}
          rowKey="id"
          title="DCEP交易记录"
          searchPlaceholder="搜索交易ID或用户..."
          showAdd={false}
          actions={actions}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
        />

        <Divider />

        {/* DCEP特性说明卡片 */}
        <div>
          <Title level={4} className="mb-4">DCEP 核心特性</Title>
          <Row gutter={[16, 16]}>
            {features.map((f) => (
              <Col xs={24} sm={12} lg={6} key={f.title}>
                <Card hoverable className="h-full" style={{ borderRadius: 12 }}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${f.color}15`, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                  <Paragraph type="secondary" className="text-sm mb-0" ellipsis={{ rows: 3 }}>
                    {f.desc}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 交易详情弹窗 */}
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailOpen(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">交易详情</h3>
                <button
                  onClick={() => setDetailOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  x
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b"><Text type="secondary">交易ID</Text><span className="font-mono">{selectedTx.id}</span></div>
                <div className="flex justify-between py-2 border-b"><Text type="secondary">用户</Text><span>{selectedTx.user}</span></div>
                <div className="flex justify-between py-2 border-b"><Text type="secondary">金额</Text><span className="font-bold text-lg">{'\u00A5'}{selectedTx.amount.toLocaleString()}</span></div>
                <div className="flex justify-between py-2 border-b"><Text type="secondary">类型</Text><Tag color={txTypeMap[selectedTx.type]?.color}>{txTypeMap[selectedTx.type]?.label}</Tag></div>
                <div className="flex justify-between py-2 border-b"><Text type="secondary">状态</Text><Badge status={statusConfig[selectedTx.status]?.color} text={statusConfig[selectedTx.status]?.label} /></div>
                <div className="flex justify-between py-2 border-b"><Text type="secondary">渠道</Text><Tag>{selectedTx.channel}</Tag></div>
                <div className="flex justify-between py-2"><Text type="secondary">时间</Text><span>{selectedTx.time}</span></div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={() => setDetailOpen(false)}>关闭</Button>
                <Button type="primary" icon={<CheckCircleOutlined />}>确认无误</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
