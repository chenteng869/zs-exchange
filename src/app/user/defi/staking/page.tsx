'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Space, Modal, Form, InputNumber, Statistic, Table, Tag, Progress } from 'antd';
import { PlusOutlined, ArrowUpOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import UserLayout from '@/components/user/UserLayout';

const mockStakingPools = [
  {
    id: '1',
    name: 'GXT 30天锁仓',
    token: 'GXT',
    apy: 12.5,
    lockDays: 30,
    minStake: 100,
    tvl: 1250000,
    totalStakers: 2500,
    status: 'active',
  },
  {
    id: '2',
    name: 'GXT 90天锁仓',
    token: 'GXT',
    apy: 18.8,
    lockDays: 90,
    minStake: 500,
    tvl: 2800000,
    totalStakers: 1800,
    status: 'active',
  },
  {
    id: '3',
    name: 'ETH-GXT LP 挖矿',
    token: 'LP',
    apy: 25.6,
    lockDays: 0,
    minStake: 10,
    tvl: 5200000,
    totalStakers: 3200,
    status: 'active',
  },
  {
    id: '4',
    name: 'GXT 365天锁仓',
    token: 'GXT',
    apy: 35.0,
    lockDays: 365,
    minStake: 1000,
    tvl: 1800000,
    totalStakers: 800,
    status: 'active',
  },
];

const mockMyStaking = [
  {
    id: '1',
    poolName: 'GXT 90天锁仓',
    amount: 10000,
    earned: 468.5,
    startTime: '2026-04-15',
    endTime: '2026-07-14',
    daysLeft: 62,
    status: 'active',
  },
  {
    id: '2',
    poolName: 'ETH-GXT LP 挖矿',
    amount: 500,
    earned: 125.3,
    startTime: '2026-05-01',
    endTime: null,
    daysLeft: null,
    status: 'active',
  },
];

const apyChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月'] },
  yAxis: { type: 'value' },
  series: [
    {
      name: '平均APY',
      type: 'line',
      smooth: true,
      data: [15.2, 16.8, 18.5, 20.3, 19.8],
    },
  ],
};

export default function UserDefiStaking() {
  const [isStakeModalVisible, setIsStakeModalVisible] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [form] = Form.useForm();

  const handleStake = (pool: any) => {
    setSelectedPool(pool);
    form.resetFields();
    setIsStakeModalVisible(true);
  };

  const handleConfirmStake = () => {
    form.validateFields().then(values => {
      Modal.success({
        title: '质押成功',
        content: `已成功质押 ${values.amount} ${selectedPool.token}`,
        onOk: () => setIsStakeModalVisible(false),
      });
    });
  };

  const handleClaimReward = () => {
    Modal.success({
      title: '领取成功',
      content: '奖励已发放到您的钱包',
    });
  };

  const poolColumns = [
    {
      title: '矿池名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.lockDays > 0 ? `锁仓 ${record.lockDays} 天` : '灵活存取'}</div>
        </div>
      ),
    },
    {
      title: 'APY',
      dataIndex: 'apy',
      key: 'apy',
      render: (val: number) => (
        <div className="text-green-600 font-bold text-lg">{val}%</div>
      ),
    },
    {
      title: 'TVL',
      dataIndex: 'tvl',
      key: 'tvl',
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M`,
    },
    {
      title: '质押人数',
      dataIndex: 'totalStakers',
      key: 'totalStakers',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '进行中' : '已结束'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="primary" onClick={() => handleStake(record)}>质押</Button>
      ),
    },
  ];

  const myStakingColumns = [
    {
      title: '矿池',
      dataIndex: 'poolName',
      key: 'poolName',
    },
    {
      title: '质押数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '已赚收益',
      dataIndex: 'earned',
      key: 'earned',
      render: (val: number) => (
        <span className="text-green-600 font-semibold">{val.toFixed(2)}</span>
      ),
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      key: 'daysLeft',
      render: (val: number | null) => (
        val ? (
          <Space>
            <ClockCircleOutlined />
            {val} 天
          </Space>
        ) : (
          <span className="text-gray-500">灵活</span>
        )
      ),
    },
    {
      title: '进度',
      key: 'progress',
      render: (_: any, record: any) => {
        if (!record.daysLeft) return null;
        const total = 90;
        const passed = total - record.daysLeft;
        return <Progress percent={Math.round(passed / total * 100)} size="small" />;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          {record.earned > 0 && (
            <Button type="primary" size="small" onClick={handleClaimReward}>领取</Button>
          )}
          <Button size="small">详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">质押挖矿</h1>
          <Button type="primary" icon={<PlusOutlined />}>创建矿池</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总质押金额"
                value={10500}
                suffix="GXT"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待领取收益"
                value={593.8}
                precision={2}
                suffix="GXT"
                valueStyle={{ color: '#52c41a' }}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="累计收益"
                value={1250.5}
                precision={2}
                suffix="GXT"
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +12.5% 本月
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均APY"
                value={19.8}
                precision={1}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="我的质押">
              <Table
                dataSource={mockMyStaking}
                columns={myStakingColumns}
                pagination={false}
                rowKey="id"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="APY 走势">
              <SafeECharts option={apyChartOption} style={{ height: 300 }} />
            </Card>
          </Col>
        </Row>

        <Card title="可质押矿池">
          <Table
            dataSource={mockStakingPools}
            columns={poolColumns}
            pagination={{ pageSize: 8 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={`质押 - ${selectedPool?.name}`}
          open={isStakeModalVisible}
          onOk={handleConfirmStake}
          onCancel={() => setIsStakeModalVisible(false)}
          okText="确认质押"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="质押数量"
              name="amount"
              rules={[
                { required: true, message: '请输入质押数量' },
                { type: 'number', min: selectedPool?.minStake, message: `最小质押 ${selectedPool?.minStake} ${selectedPool?.token}` },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder={`请输入质押数量 (最小 ${selectedPool?.minStake})`}
                min={selectedPool?.minStake}
                precision={8}
              />
            </Form.Item>

            {selectedPool && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">
                  预估收益：<span className="text-green-600 font-semibold">
                    {(form.getFieldValue('amount') || 0) * selectedPool.apy / 100 / 365 * selectedPool.lockDays || '灵活'}
                    {selectedPool.token}
                  </span>
                </div>
                {selectedPool.lockDays > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    锁仓天数：<span className="font-semibold">{selectedPool.lockDays} 天</span>
                  </div>
                )}
              </div>
            )}
          </Form>
        </Modal>
      </div>
    </UserLayout>
  );
}
