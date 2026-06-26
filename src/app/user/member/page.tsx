'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Progress, Badge, Statistic, Divider, Avatar } from 'antd';
import {
  TrophyOutlined,
  CrownOutlined,
  GiftOutlined,
  RightOutlined,
  StarOutlined,
  RocketOutlined,
  SafetyOutlined,
  DollarOutlined,
  UpOutlined,
  LockOutlined,
} from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const memberLevels = [
  {
    level: 'LV1',
    name: '普通会员',
    icon: '🥉',
    color: '#d9d9d9',
    minPoints: 0,
    maxPoints: 999,
    discount: 0,
    feeRate: 0.2,
    benefits: ['基础交易功能', '每日签到', '基础客服'],
  },
  {
    level: 'LV2',
    name: '白银会员',
    icon: '🥈',
    color: '#c0c0c0',
    minPoints: 1000,
    maxPoints: 4999,
    discount: 5,
    feeRate: 0.18,
    benefits: ['LV1权益', '交易手续费9.5折', '专属客服', '优先提现'],
  },
  {
    level: 'LV3',
    name: '黄金会员',
    icon: '🥇',
    color: '#ffd700',
    minPoints: 5000,
    maxPoints: 19999,
    discount: 10,
    feeRate: 0.15,
    benefits: ['LV2权益', '交易手续费9折', '生日礼包', '专属活动', 'VIP通道'],
  },
  {
    level: 'LV4',
    name: '铂金会员',
    icon: '💎',
    color: '#e5e4e2',
    minPoints: 20000,
    maxPoints: 49999,
    discount: 15,
    feeRate: 0.12,
    benefits: ['LV3权益', '交易手续费8.5折', '专属理财顾问', '定制服务'],
  },
  {
    level: 'LV5',
    name: '钻石会员',
    icon: '💠',
    color: '#b9f2ff',
    minPoints: 50000,
    maxPoints: 99999,
    discount: 20,
    feeRate: 0.1,
    benefits: ['LV4权益', '1对1顾问', '优先上币权', '线下活动邀请'],
  },
  {
    level: 'LV6',
    name: '皇冠会员',
    icon: '👑',
    color: '#ffd700',
    minPoints: 100000,
    maxPoints: null,
    discount: 25,
    feeRate: 0.08,
    benefits: ['LV5权益', '专属客户经理', '董事会列席权', '定制权益', '最高优先级'],
  },
];

const mockUserData = {
  username: 'ZhangSan',
  level: 'LV3',
  points: 8500,
  nextLevel: 'LV4',
  pointsToNext: 11500,
  totalTradingVolume: 256000,
  totalOrders: 1234,
  thisMonthFee: 128.5,
  feeDiscount: 12.85,
};

const mockPointHistory = [
  { id: '1', type: 'earning', action: '交易手续费返积分', amount: '+150', time: '2024-05-13 14:30' },
  { id: '2', type: 'earning', action: '每日签到', amount: '+10', time: '2024-05-13 09:00' },
  { id: '3', type: 'spending', action: '兑换VIP特权', amount: '-500', time: '2024-05-12 18:20' },
  { id: '4', type: 'earning', action: '交易手续费返积分', amount: '+280', time: '2024-05-12 15:45' },
  { id: '5', type: 'earning', action: '邀请用户奖励', amount: '+1000', time: '2024-05-11 10:00' },
];

export default function MemberPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<typeof memberLevels[0] | null>(null);

  const currentLevel = memberLevels.find(l => l.level === mockUserData.level)!;
  const nextLevel = memberLevels.find(l => l.level === mockUserData.nextLevel)!;
  const progressPercent = (mockUserData.points / nextLevel.minPoints) * 100;

  const columns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'earning' ? 'green' : 'red'}>
          {type === 'earning' ? '获得' : '消耗'}
        </Tag>
      ),
    },
    {
      title: '说明',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: '积分',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: string) => (
        <span style={{ color: amount.startsWith('+') ? '#52C41A' : '#FF4D4F', fontWeight: 600 }}>
          {amount}
        </span>
      ),
    },
  ];

  const handleViewLevel = (level: typeof memberLevels[0]) => {
    setSelectedLevel(level);
    setLevelModalVisible(true);
  };

  return (
    <UserLayout activeMenu="/user/member">
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CrownOutlined className="text-2xl text-yellow-500" />
            <h1 className="text-2xl font-bold m-0">会员中心</h1>
          </div>
          <Space>
            <Button icon={<GiftOutlined />}>积分商城</Button>
          </Space>
        </div>

        {/* 当前会员卡片 */}
        <Card
          style={{
            background: `linear-gradient(135deg, ${currentLevel.color}22, ${currentLevel.color}44)`,
            border: `1px solid ${currentLevel.color}`,
          }}
        >
          <Row gutter={24} align="middle">
            <Col>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: currentLevel.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                }}
              >
                {currentLevel.icon}
              </div>
            </Col>
            <Col flex={1}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">{currentLevel.name}</span>
                <Tag color={currentLevel.color}>{currentLevel.level}</Tag>
                <Badge status="processing" text="当前等级" />
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>累计积分：{mockUserData.points.toLocaleString()}</span>
                <span>|</span>
                <span>交易量：${mockUserData.totalTradingVolume.toLocaleString()}</span>
                <span>|</span>
                <span>订单数：{mockUserData.totalOrders}</span>
              </div>
            </Col>
            <Col>
              <div style={{ textAlign: 'right' }}>
                <div className="text-sm text-gray-500 mb-1">
                  距离 {nextLevel.level} 还需
                </div>
                <div className="text-2xl font-bold text-blue-500">
                  {mockUserData.pointsToNext.toLocaleString()} 积分
                </div>
              </div>
            </Col>
          </Row>
          <div className="mt-4">
            <Progress
              percent={progressPercent}
              strokeColor={currentLevel.color}
              trailColor="#E5E7EB"
              format={() => `${mockUserData.points} / ${nextLevel.minPoints}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{currentLevel.name}</span>
            <span>{nextLevel.name}</span>
          </div>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="本月节省手续费"
                value={mockUserData.feeDiscount}
                prefix={<DollarOutlined />}
                suffix="USD"
                valueStyle={{ color: '#52C41A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="当前折扣率"
                value={currentLevel.discount}
                suffix="%"
                valueStyle={{ color: '#1677FF' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="实际手续费率"
                value={currentLevel.feeRate * 100}
                suffix="%"
                valueStyle={{ color: '#722ED1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 等级权益 */}
        <Card title="会员等级" extra={<Button type="link">全部等级</Button>}>
          <Row gutter={[16, 16]}>
            {memberLevels.map((level) => (
              <Col xs={24} sm={12} lg={4} key={level.level}>
                <Card
                  size="small"
                  style={{
                    border: level.level === mockUserData.level ? `2px solid ${level.color}` : '1px solid #E5E7EB',
                    background: level.level === mockUserData.level ? `${level.color}11` : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onClick={() => handleViewLevel(level)}
                >
                  <div className="text-center">
                    <div style={{ fontSize: 32 }}>{level.icon}</div>
                    <div className="font-bold mt-2">{level.name}</div>
                    <div className="text-xs text-gray-500">{level.level}</div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div className="text-xs">
                      <div className="text-green-500">手续费 {level.feeRate * 100}%</div>
                      <div className="text-orange-500">折扣 {level.discount}%</div>
                    </div>
                    {level.level === mockUserData.level && (
                      <Tag color="green" className="mt-2">当前</Tag>
                    )}
                    {level.level === mockUserData.nextLevel && (
                      <Tag color="blue" className="mt-2">下一级</Tag>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* 积分明细 */}
        <Card
          title="积分明细"
          tabList={[
            { key: 'overview', tab: '概览' },
            { key: 'history', tab: '明细' },
          ]}
          activeTabKey={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'overview' ? (
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <StarOutlined className="text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium">如何获得更多积分？</div>
                      <div className="text-sm text-gray-500">交易、邀请、签到均可获得积分</div>
                    </div>
                  </div>
                  <Button type="link">了解更多</Button>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="交易积分">
                  <div className="text-center py-4">
                    <RocketOutlined className="text-3xl text-blue-500 mb-2" />
                    <div className="text-sm text-gray-500">每笔交易手续费返积分</div>
                    <div className="text-lg font-bold text-blue-500">最高50%返还</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="邀请奖励">
                  <div className="text-center py-4">
                    <SafetyOutlined className="text-3xl text-green-500 mb-2" />
                    <div className="text-sm text-gray-500">邀请好友注册交易</div>
                    <div className="text-lg font-bold text-green-500">最高1000积分/好友</div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" title="每日签到">
                  <div className="text-center py-4">
                    <GiftOutlined className="text-3xl text-orange-500 mb-2" />
                    <div className="text-sm text-gray-500">每日签到领取积分</div>
                    <div className="text-lg font-bold text-orange-500">最高100积分/天</div>
                  </div>
                </Card>
              </Col>
            </Row>
          ) : (
            <Table
              dataSource={mockPointHistory}
              columns={columns}
              pagination={{ pageSize: 5 }}
              rowKey="id"
            />
          )}
        </Card>

        {/* 会员特权 */}
        <Card title="会员专属特权">
          <Row gutter={[16, 16]}>
            {currentLevel.benefits.map((benefit, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <RightOutlined className="text-white text-xs" />
                  </div>
                  <span className="text-green-700">{benefit}</span>
                </div>
              </Col>
            ))}
            {nextLevel.benefits
              .filter(b => !currentLevel.benefits.includes(b))
              .map((benefit, index) => (
                <Col xs={24} sm={12} md={8} key={`next-${index}`}>
                  <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg opacity-60">
                    <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                      <LockOutlined className="text-white text-xs" />
                    </div>
                    <span className="text-gray-500">{benefit}</span>
                    <Tag color="blue" className="ml-auto">LV{nextLevel.level.slice(-1)}</Tag>
                  </div>
                </Col>
              ))}
          </Row>
        </Card>

        {/* 等级详情弹窗 */}
        <Modal
          title={selectedLevel ? `${selectedLevel.icon} ${selectedLevel.name}` : ''}
          open={levelModalVisible}
          onCancel={() => setLevelModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setLevelModalVisible(false)}>
              关闭
            </Button>,
            selectedLevel && memberLevels.findIndex(l => l.level === selectedLevel.level) > memberLevels.findIndex(l => l.level === mockUserData.level) ? (
              <Button key="upgrade" type="primary" icon={<UpOutlined />}>
                升级到 {selectedLevel.name}
              </Button>
            ) : null,
          ]}
          width={500}
        >
          {selectedLevel && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">等级要求</span>
                <span className="font-bold">
                  {selectedLevel.minPoints.toLocaleString()} ~ {selectedLevel.maxPoints?.toLocaleString() || '∞'} 积分
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">交易手续费率</span>
                <span className="font-bold text-blue-500">{(selectedLevel.feeRate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">专属折扣</span>
                <span className="font-bold text-green-500">{selectedLevel.discount}%</span>
              </div>
              <Divider>会员权益</Divider>
              <div className="space-y-2">
                {selectedLevel.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </UserLayout>
  );
}
