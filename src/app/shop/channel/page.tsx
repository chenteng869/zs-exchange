'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Avatar,
  Progress,
  Statistic,
  Divider,
  Tabs,
  Modal,
  Badge,
  Tooltip,
  theme,
} from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  TeamOutlined,
  UserOutlined,
  DollarOutlined,
  WalletOutlined,
  UserAddOutlined,
  EnvironmentOutlined,
  ShoppingOutlined,
  CustomerServiceOutlined,
  RightOutlined,
  ArrowUpOutlined,
  GiftOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  StarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';
import SafeECharts from '@/components/admin/SafeECharts';

const CHANNEL_LEVELS = {
  director: { label: '董事', color: '#D4AF37', icon: <CrownOutlined />, order: 1, minPerformance: 2000000 },
  president: { label: '总裁', color: '#8B4513', icon: <SafetyCertificateOutlined />, order: 2, minPerformance: 800000 },
  director_general: { label: '总监', color: '#CD853F', icon: <TrophyOutlined />, order: 3, minPerformance: 300000 },
  manager: { label: '经理', color: '#DAA520', icon: <StarOutlined />, order: 4, minPerformance: 100000 },
  member: { label: '会员', color: '#B8860B', icon: <FireOutlined />, order: 5, minPerformance: 30000 },
  normal: { label: '普通', color: '#8B7355', icon: <UserOutlined />, order: 6, minPerformance: 0 },
};

const CHANNEL_LEVEL_LIST = Object.entries(CHANNEL_LEVELS).sort((a, b) => a[1].order - b[1].order);

const mockChannelData = {
  id: 'QD003',
  name: '张伟强',
  level: 'director_general',
  teamCount: 52,
  totalPerformance: 520000,
  monthPerformance: 67000,
  todayProfit: 2580,
  pendingProfit: 12000,
  totalProfit: 78000,
  inviteCount: 18,
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangweiqiang',
  joinDate: '2024-07-10',
  nextLevel: 'president',
  nextLevelPerformance: 800000,
};

const mockTeamMembers = [
  { id: 'TM001', name: '张小明', level: 'normal', joinDate: '2026-05-10', totalConsume: 3690, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangxiaoming' },
  { id: 'TM002', name: '李小红', level: 'member', joinDate: '2026-05-12', totalConsume: 8500, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lixiaohong' },
  { id: 'TM003', name: '王小强', level: 'normal', joinDate: '2026-05-15', totalConsume: 1200, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangxiaoqiang' },
  { id: 'TM004', name: '赵小美', level: 'manager', joinDate: '2026-04-20', totalConsume: 12800, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoxiaomei' },
  { id: 'TM005', name: '孙大伟', level: 'member', joinDate: '2026-04-25', totalConsume: 5600, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sundawei' },
  { id: 'TM006', name: '周小丽', level: 'normal', joinDate: '2026-05-01', totalConsume: 2100, status: 'inactive', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouxiaoli' },
  { id: 'TM007', name: '吴志远', level: 'member', joinDate: '2026-03-15', totalConsume: 9800, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wuzhiyuan' },
  { id: 'TM008', name: '郑雅婷', level: 'normal', joinDate: '2026-05-08', totalConsume: 3200, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengdating' },
  { id: 'TM009', name: '冯建国', level: 'manager', joinDate: '2026-02-20', totalConsume: 15600, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fengjianguo' },
  { id: 'TM010', name: '陈美玲', level: 'normal', joinDate: '2026-05-20', totalConsume: 1800, status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenmeiling' },
];

const benefitItems = [
  { key: 'team', icon: <TeamOutlined />, label: '我的团队', color: '#CD853F' },
  { key: 'invite', icon: <UserAddOutlined />, label: '邀请好友', color: '#DAA520' },
  { key: 'profit', icon: <WalletOutlined />, label: '分润明细', color: '#8B4513' },
  { key: 'address', icon: <EnvironmentOutlined />, label: '收货地址', color: '#D4AF37' },
  { key: 'orders', icon: <ShoppingOutlined />, label: '我的订单', color: '#B8860B' },
  { key: 'service', icon: <CustomerServiceOutlined />, label: '联系客服', color: '#8B7355' },
];

export default function ChannelPage() {
  const { token } = theme.useToken();
  const [activeTab, setActiveTab] = useState('team');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [levelModalVisible, setLevelModalVisible] = useState(false);

  const currentLevel = CHANNEL_LEVELS[mockChannelData.level as keyof typeof CHANNEL_LEVELS];
  const nextLevel = CHANNEL_LEVELS[mockChannelData.nextLevel as keyof typeof CHANNEL_LEVELS];
  const progressPercent = (mockChannelData.totalPerformance / mockChannelData.nextLevelPerformance) * 100;
  const performanceToNext = mockChannelData.nextLevelPerformance - mockChannelData.totalPerformance;

  const performanceTrendOption = useMemo(() => {
    const dates = [];
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
      const base = 1500 + Math.random() * 1500;
      const trend = (29 - i) * 30;
      data.push(Math.round(base + trend));
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#CD853F',
        textStyle: { color: '#fff' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>业绩: ¥${p.value.toLocaleString()}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#999', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#444' } },
        axisLabel: { color: '#999', formatter: '¥{value}' },
        splitLine: { lineStyle: { color: '#333' } },
      },
      series: [
        {
          name: '业绩',
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: data,
          lineStyle: { color: '#D4AF37', width: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(212, 175, 55, 0.35)' },
                { offset: 1, color: 'rgba(212, 175, 55, 0.02)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  const columns = [
    {
      title: '成员',
      key: 'member',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} size={36} />
          <div>
            <div className="font-medium" style={{ color: token.colorText }}>{record.name}</div>
            <div className="text-xs" style={{ color: token.colorTextTertiary }}>ID: {record.id}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const cfg = CHANNEL_LEVELS[level as keyof typeof CHANNEL_LEVELS];
        return (
          <Tag color={cfg.color} icon={cfg.icon} style={{ margin: 0 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
      width: 120,
      render: (text: string) => <span style={{ color: token.colorTextSecondary }}>{text}</span>,
    },
    {
      title: '累计消费',
      dataIndex: 'totalConsume',
      key: 'totalConsume',
      width: 130,
      render: (amount: number) => (
        <span className="font-semibold" style={{ color: '#D4AF37' }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Button type="link" size="small" onClick={() => handleViewMember(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
  };

  const handleFeatureClick = (key: string) => {
    console.log('Feature clicked:', key);
  };

  return (
    <UserLayout activeMenu="/shop/channel">
      <div style={{ padding: 24, background: '#1a1a1a', minHeight: 'calc(100vh - 112px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrophyOutlined style={{ fontSize: 28, color: '#D4AF37' }} />
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', margin: 0 }}>
                  福建老酒渠道中心
                </h1>
                <p style={{ color: '#999', margin: '4px 0 0 0', fontSize: 14 }}>
                  渠道分销 · 团队管理 · 业绩分润
                </p>
              </div>
            </div>
            <Space>
              <Button icon={<GiftOutlined />} style={{ borderColor: '#CD853F', color: '#CD853F' }}>
                渠道权益
              </Button>
            </Space>
          </div>

          <Card
            style={{
              background: `linear-gradient(135deg, #2a2015 0%, #3d2e1a 50%, #2a2015 100%)`,
              border: `1px solid ${currentLevel.color}`,
              borderRadius: 12,
              boxShadow: `0 4px 20px rgba(212, 175, 55, 0.15)`,
            }}
            bodyStyle={{ padding: 28 }}
          >
            <Row gutter={[24, 24]} align="middle">
              <Col>
                <div
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${currentLevel.color} 0%, ${nextLevel.color} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 44,
                    boxShadow: `0 4px 15px ${currentLevel.color}40`,
                  }}
                >
                  <span style={{ color: '#fff' }}>{currentLevel.icon}</span>
                </div>
              </Col>
              <Col flex={1}>
                <div className="flex items-center gap-3 mb-2">
                  <Badge
                    count={currentLevel.label}
                    style={{
                      backgroundColor: currentLevel.color,
                      fontSize: 14,
                      padding: '4px 12px',
                      fontWeight: 'bold',
                    }}
                  />
                  <span style={{ fontSize: 22, fontWeight: 'bold', color: '#fff' }}>
                    {mockChannelData.name}
                  </span>
                  <span style={{ color: '#999', fontSize: 13, fontFamily: 'monospace' }}>
                    渠道ID: {mockChannelData.id}
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TeamOutlined style={{ color: '#CD853F' }} />
                    <span style={{ color: '#ccc' }}>
                      我的团队 <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 18 }}>{mockChannelData.teamCount}</span> 人
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <WalletOutlined style={{ color: '#CD853F' }} />
                    <span style={{ color: '#ccc' }}>
                      累计业绩 <span style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 18 }}>¥{mockChannelData.totalPerformance.toLocaleString()}</span>
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiseOutlined style={{ color: '#CD853F' }} />
                    <span style={{ color: '#ccc' }}>
                      本月业绩 <span style={{ color: '#52C41A', fontWeight: 'bold', fontSize: 18 }}>¥{mockChannelData.monthPerformance.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </Col>
              <Col style={{ minWidth: 280 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#999', fontSize: 13, marginBottom: 4 }}>
                    距离 <span style={{ color: nextLevel.color, fontWeight: 'bold' }}>{nextLevel.label}</span> 还需
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#D4AF37', marginBottom: 12 }}>
                    ¥{performanceToNext.toLocaleString()}
                  </div>
                </div>
                <Progress
                  percent={Math.min(progressPercent, 100)}
                  strokeColor={{
                    '0%': '#D4AF37',
                    '100%': '#CD853F',
                  }}
                  trailColor="#333"
                  format={() => `${mockChannelData.totalPerformance.toLocaleString()} / ${mockChannelData.nextLevelPerformance.toLocaleString()}`}
                  style={{ color: '#999' }}
                />
                <div className="flex justify-between mt-1" style={{ fontSize: 12 }}>
                  <span style={{ color: currentLevel.color }}>{currentLevel.label}</span>
                  <span style={{ color: nextLevel.color }}>{nextLevel.label}</span>
                </div>
              </Col>
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <Card
                style={{
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: 10,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Statistic
                  title={<span style={{ color: '#999', fontSize: 13 }}>今日收益</span>}
                  value={mockChannelData.todayProfit}
                  prefix={<ArrowUpOutlined style={{ color: '#52C41A' }} />}
                  suffix="元"
                  valueStyle={{ color: '#52C41A', fontWeight: 'bold', fontSize: 26 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  较昨日 +12.5%
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                style={{
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: 10,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Statistic
                  title={<span style={{ color: '#999', fontSize: 13 }}>待结算分润</span>}
                  value={mockChannelData.pendingProfit}
                  prefix={<WalletOutlined style={{ color: '#FAAD14' }} />}
                  suffix="元"
                  valueStyle={{ color: '#FAAD14', fontWeight: 'bold', fontSize: 26 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  预计3日内到账
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                style={{
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: 10,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Statistic
                  title={<span style={{ color: '#999', fontSize: 13 }}>累计分润</span>}
                  value={mockChannelData.totalProfit}
                  prefix={<DollarOutlined style={{ color: '#D4AF37' }} />}
                  suffix="元"
                  valueStyle={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 26 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  自加入以来
                </div>
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card
                style={{
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: 10,
                }}
                bodyStyle={{ padding: 20 }}
              >
                <Statistic
                  title={<span style={{ color: '#999', fontSize: 13 }}>邀请人数</span>}
                  value={mockChannelData.inviteCount}
                  prefix={<UserAddOutlined style={{ color: '#13C2C2' }} />}
                  suffix="人"
                  valueStyle={{ color: '#13C2C2', fontWeight: 'bold', fontSize: 26 }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  本月新增 3 人
                </div>
              </Card>
            </Col>
          </Row>

          <Card
            title={<span style={{ color: '#fff' }}>功能入口</span>}
            style={{ background: '#252525', border: '1px solid #333', borderRadius: 10 }}
            headStyle={{ borderBottom: '1px solid #333' }}
          >
            <Row gutter={[16, 16]}>
              {benefitItems.map((item) => (
                <Col xs={8} md={4} key={item.key}>
                  <div
                    onClick={() => handleFeatureClick(item.key)}
                    style={{
                      background: '#1e1e1e',
                      borderRadius: 10,
                      padding: '20px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: '1px solid #2a2a2a',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2a2015';
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#1e1e1e';
                      e.currentTarget.style.borderColor = '#2a2a2a';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${item.color}22`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 10px',
                        fontSize: 22,
                        color: item.color,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ color: '#ddd', fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card
                style={{ background: '#252525', border: '1px solid #333', borderRadius: 10 }}
                headStyle={{ borderBottom: '1px solid #333' }}
                tabList={[
                  { key: 'team', tab: '团队成员' },
                  { key: 'trend', tab: '业绩趋势' },
                ]}
                activeTabKey={activeTab}
                onTabChange={setActiveTab}
              >
                {activeTab === 'team' && (
                  <div>
                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#1e1e1e', borderRadius: 8 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>团队总人数</div>
                          <div style={{ color: '#D4AF37', fontSize: 20, fontWeight: 'bold' }}>{mockChannelData.teamCount} 人</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>本月新增</div>
                          <div style={{ color: '#52C41A', fontSize: 20, fontWeight: 'bold' }}>+8 人</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>活跃成员</div>
                          <div style={{ color: '#13C2C2', fontSize: 20, fontWeight: 'bold' }}>42 人</div>
                        </Col>
                      </Row>
                    </div>
                    <Table
                      columns={columns}
                      dataSource={mockTeamMembers}
                      rowKey="id"
                      pagination={{
                        pageSize: 5,
                        style: { color: '#999' },
                        showTotal: (total) => `共 ${total} 位成员`,
                      }}
                      size="middle"
                      style={{ color: '#fff' }}
                    />
                  </div>
                )}
                {activeTab === 'trend' && (
                  <div>
                    <div style={{ marginBottom: 16, padding: '12px 16px', background: '#1e1e1e', borderRadius: 8 }}>
                      <Row gutter={16}>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>近30天总业绩</div>
                          <div style={{ color: '#D4AF37', fontSize: 20, fontWeight: 'bold' }}>¥89,500</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>日均业绩</div>
                          <div style={{ color: '#52C41A', fontSize: 20, fontWeight: 'bold' }}>¥2,983</div>
                        </Col>
                        <Col span={8}>
                          <div style={{ color: '#999', fontSize: 12 }}>环比增长</div>
                          <div style={{ color: '#52C41A', fontSize: 20, fontWeight: 'bold' }}>+23.5%</div>
                        </Col>
                      </Row>
                    </div>
                    <SafeECharts
                      option={performanceTrendOption}
                      style={{ height: 300 }}
                      title="近30天业绩趋势"
                    />
                  </div>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={8}>
              <Card
                title={<span style={{ color: '#fff' }}>渠道等级说明</span>}
                extra={
                  <Button type="link" size="small" onClick={() => setLevelModalVisible(true)}>
                    查看详情
                  </Button>
                }
                style={{ background: '#252525', border: '1px solid #333', borderRadius: 10, height: '100%' }}
                headStyle={{ borderBottom: '1px solid #333' }}
              >
                <div className="space-y-3">
                  {CHANNEL_LEVEL_LIST.map(([key, level]) => (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: key === mockChannelData.level ? `${level.color}15` : '#1e1e1e',
                        borderRadius: 8,
                        border: key === mockChannelData.level ? `1px solid ${level.color}` : '1px solid #2a2a2a',
                        transition: 'all 0.3s',
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: `${level.color}33`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                          color: level.color,
                          fontSize: 16,
                        }}
                      >
                        {level.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#ddd', fontWeight: 500, fontSize: 14 }}>
                          {level.label}
                          {key === mockChannelData.level && (
                            <Tag color={level.color} style={{ marginLeft: 8 }}>当前</Tag>
                          )}
                        </div>
                        <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                          累计业绩 ≥ ¥{level.minPerformance.toLocaleString()}
                        </div>
                      </div>
                      <RightOutlined style={{ color: '#444', fontSize: 12 }} />
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-3">
              <Avatar src={selectedMember?.avatar} icon={<UserOutlined />} size={40} />
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedMember?.name}</div>
                <div style={{ fontSize: 12, color: '#999' }}>成员ID: {selectedMember?.id}</div>
              </div>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={500}
        >
          {selectedMember && (
            <div className="space-y-4 pt-2">
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ color: '#999', fontSize: 12 }}>会员等级</div>
                    <Tag
                      color={CHANNEL_LEVELS[selectedMember.level as keyof typeof CHANNEL_LEVELS].color}
                      icon={CHANNEL_LEVELS[selectedMember.level as keyof typeof CHANNEL_LEVELS].icon}
                      style={{ marginTop: 4 }}
                    >
                      {CHANNEL_LEVELS[selectedMember.level as keyof typeof CHANNEL_LEVELS].label}
                    </Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small">
                    <div style={{ color: '#999', fontSize: 12 }}>账户状态</div>
                    <Tag color={selectedMember.status === 'active' ? 'success' : 'default'} style={{ marginTop: 4 }}>
                      {selectedMember.status === 'active' ? '正常' : '未激活'}
                    </Tag>
                  </Card>
                </Col>
              </Row>
              <Card size="small" title="消费数据">
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="累计消费"
                      value={selectedMember.totalConsume}
                      prefix="¥"
                      valueStyle={{ fontSize: 18, color: '#D4AF37' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="加入时间"
                      value={selectedMember.joinDate}
                      valueStyle={{ fontSize: 14 }}
                    />
                  </Col>
                </Row>
              </Card>
              <Card size="small" title="推荐关系">
                <div style={{ color: '#666', fontSize: 13 }}>
                  推荐人：<span style={{ color: '#333' }}>{mockChannelData.name}</span>（{mockChannelData.id}）
                </div>
              </Card>
            </div>
          )}
        </Modal>

        <Modal
          title="渠道等级权益对比"
          open={levelModalVisible}
          onCancel={() => setLevelModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setLevelModalVisible(false)}>
              关闭
            </Button>,
          ]}
          width={900}
        >
          <div className="pt-2">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e8e8e8' }}>权益</th>
                  {CHANNEL_LEVEL_LIST.map(([key, level]) => (
                    <th
                      key={key}
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        borderBottom: '1px solid #e8e8e8',
                        color: key === mockChannelData.level ? level.color : '#333',
                        background: key === mockChannelData.level ? `${level.color}10` : 'transparent',
                      }}
                    >
                      <div style={{ fontSize: 12 }}>{level.icon}</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>{level.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>直推分润比例</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333', fontWeight: key === mockChannelData.level ? 'bold' : 'normal' }}>
                        {(5 + idx * 2).toFixed(1)}%
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>团队分润比例</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333', fontWeight: key === mockChannelData.level ? 'bold' : 'normal' }}>
                        {idx < 2 ? '-' : `${(idx * 1.5).toFixed(1)}%`}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>级差奖励</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333' }}>
                        {idx < 3 ? '-' : '✓'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>平级奖励</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333' }}>
                        {idx < 4 ? '-' : '✓'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>专属客服</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333' }}>
                        {idx < 2 ? '-' : '✓'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>优先发货</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333' }}>
                        {idx < 3 ? '-' : '✓'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ padding: '12px 16px' }}>线下活动邀请</td>
                  {CHANNEL_LEVEL_LIST.map(([key], idx) => (
                    <td key={key} style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span style={{ color: key === mockChannelData.level ? '#D4AF37' : '#333' }}>
                        {idx < 5 ? '-' : '✓'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      </div>
    </UserLayout>
  );
}
