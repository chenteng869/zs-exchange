'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic } from 'antd';
import { TrophyOutlined, PlusOutlined, EditOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, CalendarOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟挖矿池数据
const mockFarmingPools = [
  { id: '1', name: 'GXT/USDT LP', lpToken: 'GXT/USDT-LP', apr: 12.5, tvl: 5200000, totalStakers: 1250, startDate: '2024-04-01', endDate: '2024-07-01', status: 'active' },
  { id: '2', name: 'ETH/USDT LP', lpToken: 'ETH/USDT-LP', apr: 8.5, tvl: 3800000, totalStakers: 850, startDate: '2024-04-15', endDate: '2024-07-15', status: 'active' },
  { id: '3', name: 'GXT单币', lpToken: 'GXT', apr: 6.2, tvl: 1800000, totalStakers: 2300, startDate: '2024-03-20', endDate: '2024-06-20', status: 'active' },
  { id: '4', name: 'BTC/USDT LP', lpToken: 'BTC/USDT-LP', apr: 9.8, tvl: 4500000, totalStakers: 420, startDate: '2024-05-01', endDate: '2024-08-01', status: 'upcoming' },
  { id: '5', name: 'BNB/USDT LP', lpToken: 'BNB/USDT-LP', apr: 5.5, tvl: 800000, totalStakers: 180, startDate: '2024-02-01', endDate: '2024-05-01', status: 'ended' },
];

// 模拟质押记录
const mockStakingRecords = [
  { id: '1', user: '0x1234...5678', pool: 'GXT/USDT LP', amount: 1000, earned: 12.5, stakeTime: '2024-05-01 10:30:00', status: 'staking' },
  { id: '2', user: '0xabc1...def2', pool: 'ETH/USDT LP', amount: 0.5, earned: 2.8, stakeTime: '2024-05-02 14:20:00', status: 'staking' },
  { id: '3', user: '0x9876...5432', pool: 'GXT单币', amount: 5000, earned: 25.2, stakeTime: '2024-04-15 08:15:00', status: 'unlocked' },
  { id: '4', user: '0x1111...2222', pool: 'GXT/USDT LP', amount: 2500, earned: 45.0, stakeTime: '2024-04-10 16:45:00', status: 'staking' },
  { id: '5', user: '0x3333...4444', pool: 'GXT单币', amount: 3000, earned: 8.5, stakeTime: '2024-05-10 11:30:00', status: 'staking' },
];

// TVL趋势图表
const tvlTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['04-01', '04-15', '05-01', '05-15', '05-20', '05-25', '05-30'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [8, 10, 12, 13, 14, 15, 15.3], areaStyle: { color: 'rgba(16, 185, 129, 0.3)' }, name: 'TVL(M)' },
  ],
};

export default function DexFarmingPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<any>(null);
  const [form] = Form.useForm();

  const poolColumns = [
    { 
      title: '挖矿池', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    { title: 'LP代币', dataIndex: 'lpToken', key: 'lpToken' },
    { 
      title: 'APR', 
      dataIndex: 'apr', 
      key: 'apr', 
      render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span>,
    },
    { title: 'TVL', dataIndex: 'tvl', key: 'tvl', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '质押人数', dataIndex: 'totalStakers', key: 'totalStakers' },
    { 
      title: '开始/结束时间', 
      key: 'date', 
      render: (_: any, record: any) => (
        <div>
          <div className="text-sm text-gray-500">开始: {record.startDate}</div>
          <div className="text-sm text-gray-500">结束: {record.endDate}</div>
        </div>
      ),
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors = { active: 'green', upcoming: 'blue', ended: 'gray' };
        const labels = { active: '进行中', upcoming: '即将开始', ended: '已结束' };
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const stakingColumns = [
    { title: '用户', dataIndex: 'user', key: 'user', width: 140, render: (text: string) => <span className="font-mono">{text}</span> },
    { title: '挖矿池', dataIndex: 'pool', key: 'pool' },
    { title: '质押数量', dataIndex: 'amount', key: 'amount' },
    { title: '已获得收益', dataIndex: 'earned', key: 'earned', render: (val: number) => <span className="text-green-600">{val} GXT</span> },
    { title: '质押时间', dataIndex: 'stakeTime', key: 'stakeTime', width: 180 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'default'> = { staking: 'success', unlocked: 'default', unstaked: 'default' };
        const labels: Record<string, string> = { staking: '质押中', unlocked: '已解锁', unstaked: '已解押' };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
  ];

  const handleAdd = () => {
    setEditingPool(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingPool(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      Modal.success({
        title: editingPool ? '挖矿池更新成功' : '挖矿池创建成功',
        content: '操作已完成！',
      });
      setIsModalVisible(false);
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">流动性挖矿</h1>
          </div>
          <Space>
            <Button icon={<CalendarOutlined />}>时间周期</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建挖矿池</Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总TVL"
                value={15.3}
                precision={2}
                prefix="$"
                suffix="M"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +5.2% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总质押人数"
                value={5000}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +3.1% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="活跃挖矿池"
                value={3}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                总挖矿池: 5
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已发放奖励"
                value={125680}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                GXT 代币
              </div>
            </Card>
          </Col>
        </Row>

        {/* TVL趋势图 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="TVL增长趋势">
              <SafeECharts option={tvlTrendOption} style={{ height: 300 }} title="TVL增长趋势" />
            </Card>
          </Col>
        </Row>

        {/* 挖矿池列表 */}
        <Card title="挖矿池列表">
          <Table
            dataSource={mockFarmingPools}
            columns={poolColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 质押记录 */}
        <Card title="用户质押记录">
          <Table
            dataSource={mockStakingRecords}
            columns={stakingColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 新增/编辑模态框 */}
        <Modal
          title={editingPool ? '编辑挖矿池' : '创建挖矿池'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="池名称" name="name" rules={[{ required: true, message: '请输入池名称' }]}>
              <Input placeholder="例如：GXT/USDT LP" />
            </Form.Item>
            <Form.Item label="LP代币" name="lpToken" rules={[{ required: true, message: '请选择LP代币' }]}>
              <Select placeholder="选择LP代币">
                <Option value="GXT/USDT-LP">GXT/USDT-LP</Option>
                <Option value="ETH/USDT-LP">ETH/USDT-LP</Option>
                <Option value="GXT">GXT (单币)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="年化收益 (%)" name="apr" rules={[{ required: true, message: '请输入年化收益' }]}>
              <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="开始时间" name="startDate">
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="结束时间" name="endDate">
                  <Input placeholder="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
