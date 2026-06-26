'use client';

import { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  message,
  Tabs,
  Table,
  Divider,
  Statistic,
  Descriptions,
  Tooltip,
} from 'antd';
import {
  DollarOutlined,
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  MoneyCollectOutlined,
  HistoryOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  GiftOutlined,
  TeamOutlined,
  CrownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import UserLayout from '@/components/user/UserLayout';
import { SafeECharts } from '@/components/admin/SafeECharts';

const { Title, Text } = Typography;

interface ProfitRecord {
  id: string;
  type: 'direct' | 'team' | 'management' | 'other';
  typeName: string;
  source: string;
  orderId?: string;
  amount: number;
  time: string;
  status: 'settled' | 'pending';
  description?: string;
  level?: string;
}

const mockProfitData: ProfitRecord[] = [
  {
    id: 'PR202606250001',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606250002',
    orderId: 'FJ202606250002',
    amount: 29.97,
    time: '2026-06-25 10:15:32',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒',
    level: '一级推荐',
  },
  {
    id: 'PR202606250002',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606250001',
    orderId: 'FJ202606250001',
    amount: 25.83,
    time: '2026-06-25 09:30:15',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒',
    level: '一级推荐',
  },
  {
    id: 'PR202606240001',
    type: 'team',
    typeName: '团队奖励',
    source: '张小明下单',
    orderId: 'FJ202606240005',
    amount: 12.80,
    time: '2026-06-24 16:45:22',
    status: 'pending',
    description: '二级团队成员张小明下单产生的团队奖励',
    level: '二级团队',
  },
  {
    id: 'PR202606240002',
    type: 'management',
    typeName: '管理津贴',
    source: '李小红团队',
    orderId: 'FJ202606240003',
    amount: 86.50,
    time: '2026-06-24 14:30:08',
    status: 'settled',
    description: '管理的李小红团队本月业绩达标管理津贴',
    level: '团队管理',
  },
  {
    id: 'PR202606240003',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606240003',
    orderId: 'FJ202606240003',
    amount: 15.96,
    time: '2026-06-24 11:20:45',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒',
    level: '一级推荐',
  },
  {
    id: 'PR202606230001',
    type: 'team',
    typeName: '团队奖励',
    source: '王小强下单',
    orderId: 'FJ202606230007',
    amount: 6.50,
    time: '2026-06-23 18:20:33',
    status: 'pending',
    description: '三级团队成员王小强下单产生的团队奖励',
    level: '三级团队',
  },
  {
    id: 'PR202606230002',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606230002',
    orderId: 'FJ202606230002',
    amount: 22.30,
    time: '2026-06-23 10:30:12',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒',
    level: '一级推荐',
  },
  {
    id: 'PR202606220001',
    type: 'management',
    typeName: '管理津贴',
    source: '陈大伟团队',
    orderId: 'FJ202606220010',
    amount: 156.80,
    time: '2026-06-22 16:50:28',
    status: 'settled',
    description: '管理的陈大伟团队本月业绩达标管理津贴',
    level: '团队管理',
  },
  {
    id: 'PR202606220002',
    type: 'team',
    typeName: '团队奖励',
    source: '刘小芳下单',
    orderId: 'FJ202606220008',
    amount: 18.60,
    time: '2026-06-22 14:15:42',
    status: 'settled',
    description: '二级团队成员刘小芳下单产生的团队奖励',
    level: '二级团队',
  },
  {
    id: 'PR202606210001',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606210005',
    orderId: 'FJ202606210005',
    amount: 33.50,
    time: '2026-06-21 11:45:18',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒礼盒装',
    level: '一级推荐',
  },
  {
    id: 'PR202606200001',
    type: 'other',
    typeName: '其他',
    source: '市场活动奖励',
    amount: 50.00,
    time: '2026-06-20 09:00:00',
    status: 'settled',
    description: '618推广活动达标奖励',
    level: '活动奖励',
  },
  {
    id: 'PR202606190001',
    type: 'team',
    typeName: '团队奖励',
    source: '赵小龙下单',
    orderId: 'FJ202606190003',
    amount: 9.20,
    time: '2026-06-19 15:30:55',
    status: 'settled',
    description: '二级团队成员赵小龙下单产生的团队奖励',
    level: '二级团队',
  },
  {
    id: 'PR202606180001',
    type: 'direct',
    typeName: '直接推荐',
    source: 'FJ202606180001',
    orderId: 'FJ202606180001',
    amount: 45.00,
    time: '2026-06-18 10:20:30',
    status: 'settled',
    description: '直接推荐用户下单购买福建老酒珍藏版',
    level: '一级推荐',
  },
  {
    id: 'PR202606170001',
    type: 'management',
    typeName: '管理津贴',
    source: '周小美团队',
    orderId: 'FJ202606170006',
    amount: 72.40,
    time: '2026-06-17 16:10:15',
    status: 'settled',
    description: '管理的周小美团队本月业绩达标管理津贴',
    level: '团队管理',
  },
  {
    id: 'PR202606160001',
    type: 'other',
    typeName: '其他',
    source: '新人推荐奖',
    amount: 20.00,
    time: '2026-06-16 14:00:00',
    status: 'settled',
    description: '成功推荐3位新用户注册奖励',
    level: '新人奖励',
  },
];

const statusMap: Record<string, { color: string; text: string }> = {
  settled: { color: 'green', text: '已结算' },
  pending: { color: 'orange', text: '待结算' },
};

const typeColorMap: Record<string, string> = {
  direct: 'blue',
  team: 'purple',
  management: 'gold',
  other: 'default',
};

export default function ShopProfitsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ProfitRecord | null>(null);
  const [withdrawForm] = Form.useForm();

  const totalProfit = mockProfitData.reduce((sum, item) => sum + item.amount, 0);
  const withdrawableBalance = mockProfitData.filter(item => item.status === 'settled').reduce((sum, item) => sum + item.amount, 0) * 0.6;
  const pendingAmount = mockProfitData.filter(item => item.status === 'pending').reduce((sum, item) => sum + item.amount, 0);
  const withdrawnAmount = 520.50;

  const filteredData = useMemo(() => {
    if (activeTab === 'all') return mockProfitData;
    return mockProfitData.filter(item => item.type === activeTab);
  }, [activeTab]);

  const handleViewDetail = (record: ProfitRecord) => {
    setCurrentRecord(record);
    setDetailModalVisible(true);
  };

  const handleWithdraw = () => {
    withdrawForm.validateFields().then((values) => {
      if (values.amount > withdrawableBalance) {
        message.error('提现金额不能超过可提现余额');
        return;
      }
      message.success(`提现申请已提交，金额：¥${values.amount}`);
      setWithdrawModalVisible(false);
      withdrawForm.resetFields();
    });
  };

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#E2E8F0' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [
        '6/1', '6/2', '6/3', '6/4', '6/5', '6/6', '6/7',
        '6/8', '6/9', '6/10', '6/11', '6/12', '6/13', '6/14',
        '6/15', '6/16', '6/17', '6/18', '6/19', '6/20', '6/21',
        '6/22', '6/23', '6/24', '6/25', '6/26'
      ],
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94A3B8' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94A3B8', formatter: '¥{value}' },
      splitLine: { lineStyle: { color: '#1E293B' } },
    },
    series: [
      {
        name: '分润金额',
        type: 'line',
        smooth: true,
        data: [
          25, 32, 28, 45, 38, 52, 48,
          55, 62, 58, 70, 65, 75, 72,
          80, 85, 78, 92, 88, 95, 102,
          98, 105, 110, 108, 115
        ],
        lineStyle: { color: '#D4AF37', width: 3 },
        itemStyle: { color: '#D4AF37' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(212, 175, 55, 0.4)' },
              { offset: 1, color: 'rgba(212, 175, 55, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  const columns: ColumnsType<ProfitRecord> = [
    {
      title: '分润时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'type',
      width: 100,
      render: (text: string, record) => (
        <Tag color={typeColorMap[record.type]}>{text}</Tag>
      ),
    },
    {
      title: '来源订单',
      dataIndex: 'source',
      key: 'source',
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ color: '#E2E8F0' }}>{text}</Text>
          {record.level && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.level}</Text>
          )}
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#D4AF37', fontSize: 15 }}>
          +¥{amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', tab: '全部' },
    { key: 'direct', tab: '直接推荐' },
    { key: 'team', tab: '团队奖励' },
    { key: 'management', tab: '管理津贴' },
    { key: 'other', tab: '其他' },
  ];

  return (
    <UserLayout>
      <div style={{ background: '#0F172A', minHeight: 'calc(100vh - 48px)', margin: -24, padding: 24 }}>
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <GiftOutlined style={{ fontSize: 28, color: '#D4AF37' }} />
            <h1 style={{ color: '#F1F5F9', fontSize: 24, fontWeight: 700, margin: 0 }}>
              福建老酒分润明细
            </h1>
          </div>
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>
            查看您的分润收益明细，4/3/3分润制度让您的努力更有价值
          </Text>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                border: '1px solid #D4AF37',
                borderRadius: 12,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>累计分润</Text>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(212, 175, 55, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DollarOutlined style={{ color: '#D4AF37', fontSize: 18 }} />
                </div>
              </div>
              <div style={{ color: '#D4AF37', fontSize: 28, fontWeight: 700, letterSpacing: 1 }}>
                ¥{totalProfit.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpOutlined style={{ color: '#22C55E', fontSize: 12 }} />
                <Text style={{ color: '#22C55E', fontSize: 12 }}>较上月 +18.5%</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>可提现余额</Text>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <WalletOutlined style={{ color: '#22C55E', fontSize: 18 }} />
                </div>
              </div>
              <div style={{ color: '#22C55E', fontSize: 28, fontWeight: 700 }}>
                ¥{withdrawableBalance.toFixed(2)}
              </div>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8, display: 'block' }}>
                已结算金额的60%可提现
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>待结算金额</Text>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ClockCircleOutlined style={{ color: '#FBBF24', fontSize: 18 }} />
                </div>
              </div>
              <div style={{ color: '#FBBF24', fontSize: 28, fontWeight: 700 }}>
                ¥{pendingAmount.toFixed(2)}
              </div>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8, display: 'block' }}>
                预计T+7工作日内结算
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div className="flex items-center justify-between mb-3">
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>已提现金额</Text>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircleOutlined style={{ color: '#3B82F6', fontSize: 18 }} />
                </div>
              </div>
              <div style={{ color: '#3B82F6', fontSize: 28, fontWeight: 700 }}>
                ¥{withdrawnAmount.toFixed(2)}
              </div>
              <Text style={{ color: '#64748B', fontSize: 12, marginTop: 8, display: 'block' }}>
                累计已提现到账
              </Text>
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 12,
            marginBottom: 24,
          }}
          title={
            <Space>
              <InfoCircleOutlined style={{ color: '#D4AF37' }} />
              <span style={{ color: '#E2E8F0' }}>分润规则说明</span>
            </Space>
          }
        >
          <Row gutter={[24, 16]}>
            <Col xs={24} md={8}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: '#3B82F6' }}>40%</div>
                <div style={{ fontSize: 14, color: '#93C5FD', marginTop: 8, fontWeight: 500 }}>平台运营</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>
                  用于平台技术维护、服务器成本、运营推广等
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 16px',
                  background: 'rgba(212, 175, 55, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: '#D4AF37' }}>30%</div>
                <div style={{ fontSize: 14, color: '#FDE68A', marginTop: 8, fontWeight: 500 }}>渠道团队</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>
                  分配给推广渠道，按渠道等级进行层级分配
                </div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div
                style={{
                  textAlign: 'center',
                  padding: '20px 16px',
                  background: 'rgba(168, 85, 247, 0.1)',
                  borderRadius: 12,
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 700, color: '#A855F7' }}>30%</div>
                <div style={{ fontSize: 14, color: '#D8B4FE', marginTop: 8, fontWeight: 500 }}>市场基金</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 10, lineHeight: 1.6 }}>
                  用于市场活动、品牌推广、用户激励基金等
                </div>
              </div>
            </Col>
          </Row>
          <Divider style={{ borderColor: '#334155', margin: '20px 0' }} />
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <div className="flex items-start gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'rgba(212, 175, 55, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <TeamOutlined style={{ color: '#D4AF37' }} />
                </div>
                <div>
                  <div style={{ color: '#E2E8F0', fontWeight: 600, marginBottom: 4 }}>您的分润比例</div>
                  <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.8 }}>
                    直接推荐：一级推荐 <Text style={{ color: '#D4AF37', fontWeight: 600 }}>15%</Text><br />
                    团队奖励：二级 <Text style={{ color: '#D4AF37', fontWeight: 600 }}>8%</Text> / 三级 <Text style={{ color: '#D4AF37', fontWeight: 600 }}>5%</Text><br />
                    管理津贴：团队业绩达标额外 <Text style={{ color: '#D4AF37', fontWeight: 600 }}>3-5%</Text>
                  </div>
                </div>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="flex items-start gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'rgba(34, 197, 94, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <CrownOutlined style={{ color: '#22C55E' }} />
                </div>
                <div>
                  <div style={{ color: '#E2E8F0', fontWeight: 600, marginBottom: 4 }}>当前等级</div>
                  <div style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.8 }}>
                    您当前是 <Tag color="gold">黄金渠道商</Tag><br />
                    享受团队管理津贴 5%<br />
                    下一等级：钻石渠道商（团队月销¥50000）
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        <div className="flex gap-4 mb-6">
          <Button
            type="primary"
            size="large"
            icon={<MoneyCollectOutlined />}
            onClick={() => setWithdrawModalVisible(true)}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
              borderColor: '#D4AF37',
              borderRadius: 8,
              height: 44,
              padding: '0 32px',
              fontWeight: 600,
            }}
          >
            立即提现
          </Button>
          <Button
            size="large"
            icon={<HistoryOutlined />}
            style={{
              background: '#1E293B',
              borderColor: '#334155',
              color: '#E2E8F0',
              borderRadius: 8,
              height: 44,
              padding: '0 32px',
            }}
          >
            提现记录
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
                height: '100%',
              }}
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#D4AF37' }} />
                  <span style={{ color: '#E2E8F0' }}>分润趋势图</span>
                </Space>
              }
              extra={<Text style={{ color: '#64748B', fontSize: 12 }}>近30天</Text>}
            >
              <SafeECharts option={trendChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: 12,
                height: '100%',
              }}
              title={
                <Space>
                  <GiftOutlined style={{ color: '#D4AF37' }} />
                  <span style={{ color: '#E2E8F0' }}>分润构成</span>
                </Space>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3" style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3B82F6' }} />
                    <Text style={{ color: '#94A3B8' }}>直接推荐</Text>
                  </div>
                  <Text strong style={{ color: '#3B82F6' }}>¥172.56</Text>
                </div>
                <div className="flex items-center justify-between p-3" style={{ background: 'rgba(168, 85, 247, 0.1)', borderRadius: 8 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#A855F7' }} />
                    <Text style={{ color: '#94A3B8' }}>团队奖励</Text>
                  </div>
                  <Text strong style={{ color: '#A855F7' }}>¥47.10</Text>
                </div>
                <div className="flex items-center justify-between p-3" style={{ background: 'rgba(212, 175, 55, 0.1)', borderRadius: 8 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#D4AF37' }} />
                    <Text style={{ color: '#94A3B8' }}>管理津贴</Text>
                  </div>
                  <Text strong style={{ color: '#D4AF37' }}>¥315.70</Text>
                </div>
                <div className="flex items-center justify-between p-3" style={{ background: 'rgba(107, 114, 128, 0.1)', borderRadius: 8 }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#6B7280' }} />
                    <Text style={{ color: '#94A3B8' }}>其他奖励</Text>
                  </div>
                  <Text strong style={{ color: '#9CA3AF' }}>¥70.00</Text>
                </div>
                <Divider style={{ borderColor: '#334155', margin: '12px 0' }} />
                <div className="flex items-center justify-between">
                  <Text style={{ color: '#E2E8F0', fontWeight: 600 }}>总计</Text>
                  <Text strong style={{ color: '#D4AF37', fontSize: 18 }}>¥605.36</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          style={{
            background: '#1E293B',
            border: '1px solid #334155',
            borderRadius: 12,
          }}
          tabList={tabItems}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
        >
          <Table
            dataSource={filteredData}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            style={{ color: '#E2E8F0' }}
            className="profits-table"
          />
        </Card>

        <Modal
          title={
            <div className="flex items-center gap-2">
              <MoneyCollectOutlined style={{ color: '#D4AF37' }} />
              <span>申请提现</span>
            </div>
          }
          open={withdrawModalVisible}
          onCancel={() => setWithdrawModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setWithdrawModalVisible(false)}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleWithdraw}
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                borderColor: '#D4AF37',
              }}
            >
              确认提现
            </Button>,
          ]}
          width={480}
        >
          <Form form={withdrawForm} layout="vertical">
            <div
              style={{
                padding: 16,
                background: 'rgba(212, 175, 55, 0.1)',
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <div style={{ color: '#64748B', fontSize: 13, marginBottom: 4 }}>可提现余额</div>
              <div style={{ color: '#D4AF37', fontSize: 24, fontWeight: 700 }}>
                ¥{withdrawableBalance.toFixed(2)}
              </div>
            </div>
            <Form.Item
              label="提现金额"
              name="amount"
              rules={[{ required: true, message: '请输入提现金额' }]}
            >
              <Input
                prefix="¥"
                placeholder="请输入提现金额"
                size="large"
                addonAfter={
                  <Button
                    type="link"
                    size="small"
                    onClick={() => withdrawForm.setFieldsValue({ amount: withdrawableBalance.toFixed(2) })}
                  >
                    全部提现
                  </Button>
                }
              />
            </Form.Item>
            <Form.Item
              label="提现方式"
              name="method"
              rules={[{ required: true, message: '请选择提现方式' }]}
              initialValue="alipay"
            >
              <Input.Group compact>
                <Button style={{ width: '50%' }} type={withdrawForm.getFieldValue('method') === 'alipay' ? 'primary' : 'default'} onClick={() => withdrawForm.setFieldsValue({ method: 'alipay' })}>
                  支付宝
                </Button>
                <Button style={{ width: '50%' }} type={withdrawForm.getFieldValue('method') === 'bank' ? 'primary' : 'default'} onClick={() => withdrawForm.setFieldsValue({ method: 'bank' })}>
                  银行卡
                </Button>
              </Input.Group>
            </Form.Item>
            <div style={{ color: '#64748B', fontSize: 12, lineHeight: 1.6 }}>
              <div>• 提现将在1-3个工作日内到账</div>
              <div>• 最低提现金额：¥10.00</div>
              <div>• 每月最多可提现5次</div>
            </div>
          </Form>
        </Modal>

        <Modal
          title={
            <div className="flex items-center gap-2">
              <EyeOutlined style={{ color: '#D4AF37' }} />
              <span>分润详情</span>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={560}
        >
          {currentRecord && (
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="分润ID" span={2}>
                <Text copyable>{currentRecord.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="分润类型">
                <Tag color={typeColorMap[currentRecord.type]}>{currentRecord.typeName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusMap[currentRecord.status]?.color}>
                  {statusMap[currentRecord.status]?.text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源" span={2}>
                {currentRecord.source}
              </Descriptions.Item>
              {currentRecord.orderId && (
                <Descriptions.Item label="订单号" span={2}>
                  <Text code>{currentRecord.orderId}</Text>
                </Descriptions.Item>
              )}
              {currentRecord.level && (
                <Descriptions.Item label="层级" span={2}>
                  {currentRecord.level}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="分润金额" span={2}>
                <Text strong style={{ color: '#D4AF37', fontSize: 18 }}>
                  +¥{currentRecord.amount.toFixed(2)}
                </Text>
              </Descriptions.Item>
              {currentRecord.description && (
                <Descriptions.Item label="说明" span={2}>
                  {currentRecord.description}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="分润时间" span={2}>
                {currentRecord.time}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </UserLayout>
  );
}
