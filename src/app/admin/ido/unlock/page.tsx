'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Progress, Timeline } from 'antd';
import { LockOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockUnlockPlans = [
  { id: '1', projectName: 'GXT Protocol', symbol: 'GXT', totalTokens: 10000000, releasedTokens: 3500000, lockedTokens: 6500000, status: 'active', nextUnlockDate: '2024-07-01', nextUnlockAmount: 1000000 },
  { id: '2', projectName: 'MetaVerse Chain', symbol: 'MVC', totalTokens: 5000000, releasedTokens: 0, lockedTokens: 5000000, status: 'pending', nextUnlockDate: '2024-08-01', nextUnlockAmount: 500000 },
  { id: '3', projectName: 'DeFi Gateway', symbol: 'DFG', totalTokens: 8000000, releasedTokens: 8000000, lockedTokens: 0, status: 'completed', nextUnlockDate: '-', nextUnlockAmount: 0 },
  { id: '4', projectName: 'Web3 Gaming', symbol: 'WGX', totalTokens: 15000000, releasedTokens: 4500000, lockedTokens: 10500000, status: 'active', nextUnlockDate: '2024-06-20', nextUnlockAmount: 1500000 },
];

const unlockPlanColumns = [
  { title: '项目名称', dataIndex: 'projectName', key: 'projectName', render: (text: string, record: any) => (
    <span className="font-semibold text-blue-600">{text} <Tag color="cyan">{record.symbol}</Tag></span>
  ) },
  { title: '代币总量', dataIndex: 'totalTokens', key: 'totalTokens', render: (val: number) => val.toLocaleString() },
  { title: '已释放', dataIndex: 'releasedTokens', key: 'releasedTokens', render: (val: number) => val.toLocaleString() },
  { title: '锁定中', dataIndex: 'lockedTokens', key: 'lockedTokens', render: (val: number) => val.toLocaleString() },
  { 
    title: '释放进度', 
    dataIndex: 'releasedTokens', 
    key: 'progress', 
    render: (released: number, record: any) => {
      const percent = Math.round((released / record.totalTokens) * 100);
      return <Progress percent={percent} strokeColor={percent === 100 ? '#16A34A' : '#1677FF'} />;
    },
  },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'processing' | 'default'; label: string }> = {
          active: { color: 'success', label: '进行中' },
          pending: { color: 'processing', label: '未开始' },
          completed: { color: 'default', label: '已完成' },
          paused: { color: 'default', label: '已暂停' },
        };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { title: '下次解锁', dataIndex: 'nextUnlockDate', key: 'nextUnlockDate' },
  { title: '解锁数量', dataIndex: 'nextUnlockAmount', key: 'nextUnlockAmount', render: (val: number) => val > 0 ? val.toLocaleString() : '-' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<CalendarOutlined />}>查看详情</Button>
        {record.status === 'active' && (
          <Button type="link" size="small" danger>暂停</Button>
        )}
        {record.status === 'pending' && (
          <Button type="link" size="small">启动</Button>
        )}
      </Space>
    ),
  },
];

const mockUnlockHistory = [
  { id: '1', projectName: 'GXT Protocol', round: 'TGE', amount: 2000000, date: '2024-06-01', status: 'completed' },
  { id: '2', projectName: 'GXT Protocol', round: '第1期', amount: 1500000, date: '2024-06-15', status: 'completed' },
  { id: '3', projectName: 'GXT Protocol', round: '第2期', amount: 1000000, date: '2024-07-01', status: 'pending' },
  { id: '4', projectName: 'Web3 Gaming', round: 'TGE', amount: 3000000, date: '2024-05-20', status: 'completed' },
  { id: '5', projectName: 'Web3 Gaming', round: '第1期', amount: 1500000, date: '2024-06-20', status: 'pending' },
];

const unlockChartOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['GXT', 'MVC', 'DFG', 'WGX'] },
  yAxis: { type: 'value', name: '代币数量(万)' },
  series: [
    { type: 'bar', data: [350, 0, 800, 450], itemStyle: { color: '#16A34A' }, name: '已释放' },
    { type: 'bar', data: [650, 500, 0, 1050], itemStyle: { color: '#e0e0e0' }, name: '锁定中' },
  ],
};

export default function IDOUnlockPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form] = Form.useForm();

  const totalLocked = mockUnlockPlans.reduce((sum, p) => sum + p.lockedTokens, 0);
  const totalReleased = mockUnlockPlans.reduce((sum, p) => sum + p.releasedTokens, 0);
  const activePlans = mockUnlockPlans.filter(p => p.status === 'active').length;
  const upcomingUnlocks = mockUnlockHistory.filter(h => h.status === 'pending').length;

  const handleViewDetail = (record: any) => {
    setSelectedPlan(record);
    setIsModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LockOutlined className="text-2xl text-orange-600" />
            <h1 className="text-2xl font-bold m-0">解锁计划</h1>
          </div>
          <Button type="primary" icon={<CalendarOutlined />}>创建计划</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="锁定代币" value={(totalLocked / 10000).toFixed(0)} suffix="万" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">待释放代币总量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已释放" value={(totalReleased / 10000).toFixed(0)} suffix="万" valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">已释放代币总量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="进行中" value={activePlans} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">解锁计划数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待解锁" value={upcomingUnlocks} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">即将解锁期数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="代币解锁分布">
              <SafeECharts option={unlockChartOption} style={{ height: 250 }} title="代币解锁分布" />
            </Card>
          </Col>
        </Row>

        <Card title="解锁计划列表">
          <Table
            dataSource={mockUnlockPlans}
            columns={unlockPlanColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Card title="解锁历史">
          <Timeline mode="left">
            {mockUnlockHistory.map(item => (
              <Timeline.Item 
                key={item.id} 
                color={item.status === 'completed' ? 'green' : 'gray'}
                dot={item.status === 'completed' ? <ClockCircleOutlined /> : <LockOutlined />}
              >
                <div className="font-semibold">{item.projectName}</div>
                <div className="text-gray-500 text-sm">
                  {item.round} | {item.amount.toLocaleString()} 代币 | {item.date}
                </div>
                <Tag color={item.status === 'completed' ? 'green' : 'gray'}>
                  {item.status === 'completed' ? '已完成' : '待解锁'}
                </Tag>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

        <Modal
          title="解锁计划详情"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedPlan(null);
          }}
          width={600}
        >
          {selectedPlan && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{selectedPlan.projectName}</span>
                <Tag color="cyan">{selectedPlan.symbol}</Tag>
                <Badge status={selectedPlan.status === 'active' ? 'success' : selectedPlan.status === 'pending' ? 'processing' : 'default'} text={selectedPlan.status === 'active' ? '进行中' : selectedPlan.status === 'pending' ? '未开始' : '已完成'} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-sm">代币总量</div>
                  <div className="text-lg font-semibold">{selectedPlan.totalTokens.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-sm">已释放</div>
                  <div className="text-lg font-semibold text-green-600">{selectedPlan.releasedTokens.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-sm">锁定中</div>
                  <div className="text-lg font-semibold text-orange-600">{selectedPlan.lockedTokens.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-gray-400 text-sm">下次解锁</div>
                  <div className="text-lg font-semibold">{selectedPlan.nextUnlockDate !== '-' ? selectedPlan.nextUnlockDate : '无'}</div>
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-2">释放进度</div>
                <Progress 
                  percent={Math.round((selectedPlan.releasedTokens / selectedPlan.totalTokens) * 100)} 
                  showInfo={true}
                  strokeColor={Math.round((selectedPlan.releasedTokens / selectedPlan.totalTokens) * 100) === 100 ? '#16A34A' : '#1677FF'}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}