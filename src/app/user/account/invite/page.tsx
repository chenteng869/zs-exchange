'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Table, Statistic, Tag, Space, Alert, Input } from 'antd';
import { CopyOutlined, ShareAltOutlined, GiftOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import UserLayout from '@/components/user/UserLayout';

const inviteChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'bar', data: [5, 8, 6, 10], name: '邀请人数' },
  ],
};

const mockInviteList = [
  { id: '1', username: 'user_002', registerTime: '2026-05-10', status: 'active', level: 'VIP 1', contribution: 250 },
  { id: '2', username: 'user_003', registerTime: '2026-05-08', status: 'active', level: 'VIP 2', contribution: 500 },
  { id: '3', username: 'user_004', registerTime: '2026-05-05', status: 'inactive', level: '普通用户', contribution: 0 },
  { id: '4', username: 'user_005', registerTime: '2026-05-01', status: 'active', level: 'VIP 1', contribution: 180 },
  { id: '5', username: 'user_006', registerTime: '2026-04-28', status: 'active', level: 'VIP 3', contribution: 1200 },
];

const rewardRules = [
  { level: 'Lv.1', requirement: '邀请 5 人', reward: '100 GXT' },
  { level: 'Lv.2', requirement: '邀请 20 人', reward: '500 GXT' },
  { level: 'Lv.3', requirement: '邀请 50 人', reward: '1500 GXT' },
  { level: 'Lv.4', requirement: '邀请 100 人', reward: '4000 GXT' },
];

export default function UserAccountInvite() {
  const [inviteCode, setInviteCode] = useState('GXT8888');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://example.com/register?ref=${inviteCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '注册时间',
      dataIndex: 'registerTime',
      key: 'registerTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '活跃' : '未活跃'}
        </Tag>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Tag color={level.includes('VIP') ? 'blue' : 'default'}>{level}</Tag>
      ),
    },
    {
      title: '贡献收益',
      dataIndex: 'contribution',
      key: 'contribution',
      render: (val: number) => (
        <span className="text-green-600 font-semibold">+{val} GXT</span>
      ),
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">邀请好友</h1>
          <Space>
            <Button icon={<ShareAltOutlined />}>分享</Button>
            <Button type="primary">生成海报</Button>
          </Space>
        </div>

        <Alert
          message="邀请奖励活动"
          description="邀请好友注册并完成 KYC，双方均可获得奖励！邀请越多，奖励越丰厚！"
          type="success"
          showIcon
          icon={<GiftOutlined />}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="累计邀请"
                value={25}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={18}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="累计收益"
                value={2230}
                suffix="GXT"
                precision={0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待领取"
                value={150}
                suffix="GXT"
                precision={0}
                valueStyle={{ color: '#faad14' }}
              />
              <Button type="primary" size="small" className="mt-2">领取</Button>
            </Card>
          </Col>
        </Row>

        <Card title="我的邀请码">
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="text-lg text-gray-500 mb-2">专属邀请码</div>
              <div className="inline-flex items-center gap-4 bg-gray-100 px-6 py-3 rounded-lg">
                <span className="text-2xl font-bold tracking-wider">{inviteCode}</span>
                <Button
                  type={copied ? 'default' : 'primary'}
                  icon={<CopyOutlined />}
                  onClick={handleCopyCode}
                >
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-lg text-gray-500 mb-2">邀请链接</div>
              <div className="inline-flex items-center gap-4 bg-gray-100 px-4 py-3 rounded-lg max-w-full">
                <Input
                  value={`https://example.com/register?ref=${inviteCode}`}
                  readOnly
                  style={{ width: 400 }}
                />
                <Button
                  type={copied ? 'default' : 'primary'}
                  icon={<CopyOutlined />}
                  onClick={handleCopyLink}
                >
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
            </div>

            <Space>
              <Button>微信分享</Button>
              <Button>QQ分享</Button>
              <Button>微博分享</Button>
            </Space>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="邀请记录">
              <Table
                dataSource={mockInviteList}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="邀请数据">
              <SafeECharts option={inviteChartOption} style={{ height: 250 }} />
            </Card>

            <Card title="奖励规则" className="mt-4">
              <div className="space-y-3">
                {rewardRules.map((rule, index) => (
                  <Card key={index} size="small" className="border-l-4 border-l-blue-500">
                    <div className="font-semibold">{rule.level}</div>
                    <div className="text-sm text-gray-600">{rule.requirement}</div>
                    <div className="text-green-600 font-semibold mt-1">{rule.reward}</div>
                  </Card>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
