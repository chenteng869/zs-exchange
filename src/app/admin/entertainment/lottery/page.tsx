'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic, Switch } from 'antd';
import { GiftOutlined, PlusOutlined, EditOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockLotteries = [
  { id: '1', name: '每日幸运抽奖', prizePool: 50000, participants: 12500, winnerCount: 850, totalWinners: 850, startDate: '2024-05-01', endDate: '2024-05-31', status: 'active', ticketPrice: 10, ticketsSold: 15600 },
  { id: '2', name: '周年庆特别抽奖', prizePool: 200000, participants: 56000, winnerCount: 3200, totalWinners: 3200, startDate: '2024-06-01', endDate: '2024-06-15', status: 'upcoming', ticketPrice: 50, ticketsSold: 0 },
  { id: '3', name: '春节红包大抽奖', prizePool: 100000, participants: 35000, winnerCount: 2100, totalWinners: 2100, startDate: '2024-02-01', endDate: '2024-02-15', status: 'ended', ticketPrice: 20, ticketsSold: 42000 },
  { id: '4', name: '每周幸运轮', prizePool: 10000, participants: 2800, winnerCount: 150, totalWinners: 150, startDate: '2024-05-13', endDate: '2024-05-19', status: 'active', ticketPrice: 5, ticketsSold: 3200 },
];

const mockPrizeConfig = [
  { id: '1', lotteryId: '1', prizeName: '一等奖', amount: 10000, count: 1, probability: 0.01, awarded: 0 },
  { id: '2', lotteryId: '1', prizeName: '二等奖', amount: 1000, count: 10, probability: 0.1, awarded: 5 },
  { id: '3', lotteryId: '1', prizeName: '三等奖', amount: 100, count: 100, probability: 1.0, awarded: 80 },
  { id: '4', lotteryId: '1', prizeName: '参与奖', amount: 10, count: 1000, probability: 10.0, awarded: 765 },
];

const participationTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '参与人数' },
  series: [
    { type: 'line', smooth: true, data: [1200, 1500, 1800, 2100, 2500, 3200, 3000], areaStyle: { color: 'rgba(255, 192, 0, 0.3)' }, itemStyle: { color: '#F59E0B' }, name: '参与人数' },
  ],
};

export default function LotteryPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [editingLottery, setEditingLottery] = useState<any>(null);
  const [selectedLottery, setSelectedLottery] = useState<any>(null);
  const [form] = Form.useForm();
  const [configForm] = Form.useForm();

  const lotteryColumns = [
    { title: '抽奖活动', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-orange-600">{text}</span> },
    { title: '奖池金额', dataIndex: 'prizePool', key: 'prizePool', render: (val: number) => `$${val.toLocaleString()}` },
    { title: '参与人数', dataIndex: 'participants', key: 'participants', render: (val: number) => val.toLocaleString() },
    { title: '中奖人数', dataIndex: 'winnerCount', key: 'winnerCount', render: (val: number) => val.toLocaleString() },
    { title: '票价', dataIndex: 'ticketPrice', key: 'ticketPrice', render: (val: number) => `$${val}` },
    { title: '已售票数', dataIndex: 'ticketsSold', key: 'ticketsSold', render: (val: number) => val.toLocaleString() },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default'; label: string }> = {
          active: { color: 'success', label: '进行中' },
          upcoming: { color: 'warning', label: '即将开始' },
          ended: { color: 'default', label: '已结束' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewConfig(record)}>配置</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' ? (
            <Button type="link" size="small" icon={<PauseCircleOutlined />} danger>暂停</Button>
          ) : record.status === 'upcoming' ? (
            <Button type="link" size="small" icon={<PlayCircleOutlined />}>启动</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const prizeConfigColumns = [
    { title: '奖项名称', dataIndex: 'prizeName', key: 'prizeName' },
    { title: '奖金金额', dataIndex: 'amount', key: 'amount', render: (val: number) => `$${val}` },
    { title: '名额', dataIndex: 'count', key: 'count' },
    { title: '中奖概率', dataIndex: 'probability', key: 'probability', render: (val: number) => `${val}%` },
    { title: '已中奖', dataIndex: 'awarded', key: 'awarded' },
    { 
      title: '进度', 
      key: 'progress', 
      render: (_: any, record: any) => <Progress percent={Math.round((record.awarded / record.count) * 100)} size="small" />,
    },
  ];

  const handleAdd = () => {
    setEditingLottery(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingLottery(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleViewConfig = (record: any) => {
    setSelectedLottery(record);
    setIsConfigModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({ title: '操作成功', content: editingLottery ? '抽奖活动已更新！' : '抽奖活动已创建！' });
      setIsModalVisible(false);
    });
  };

  const totalLotteries = mockLotteries.length;
  const activeLotteries = mockLotteries.filter(l => l.status === 'active').length;
  const totalPrizePool = mockLotteries.reduce((sum, l) => sum + l.prizePool, 0);
  const totalParticipants = mockLotteries.reduce((sum, l) => sum + l.participants, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GiftOutlined className="text-2xl text-orange-500" />
            <h1 className="text-2xl font-bold m-0">幸运抽奖</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建抽奖</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="活动总数" value={totalLotteries} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">抽奖活动数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="进行中" value={activeLotteries} suffix={`/${totalLotteries}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃活动数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总奖池" value={(totalPrizePool / 10000).toFixed(2)} prefix="$" suffix="万" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">所有活动累计</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="参与人数" value={totalParticipants.toLocaleString()} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计参与用户</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="参与趋势">
              <SafeECharts option={participationTrendOption} style={{ height: 250 }} title="参与趋势" />
            </Card>
          </Col>
        </Row>

        <Card title="抽奖活动列表">
          <Table
            dataSource={mockLotteries}
            columns={lotteryColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingLottery ? '编辑抽奖活动' : '创建抽奖活动'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="活动名称" name="name" rules={[{ required: true, message: '请输入活动名称' }]}>
              <Input placeholder="例如：每日幸运抽奖" />
            </Form.Item>
            <Form.Item label="奖池金额($)" name="prizePool" rules={[{ required: true, message: '请输入奖池金额' }]}>
              <InputNumber placeholder="奖池金额" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="单张票价($)" name="ticketPrice" rules={[{ required: true, message: '请输入票价' }]}>
              <InputNumber placeholder="票价" style={{ width: '100%' }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]}>
                  <Input type="date" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="结束日期" name="endDate" rules={[{ required: true, message: '请选择结束日期' }]}>
                  <Input type="date" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="活动描述">
              <Input.TextArea rows={3} placeholder="请输入活动描述..." />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`${selectedLottery?.name} - 奖品配置`}
          open={isConfigModalVisible}
          onCancel={() => setIsConfigModalVisible(false)}
          width={900}
          footer={[
            <Button key="close" onClick={() => setIsConfigModalVisible(false)}>关闭</Button>,
            <Button key="add" type="primary" icon={<PlusOutlined />}>添加奖项</Button>,
          ]}
        >
          <Table
            dataSource={mockPrizeConfig}
            columns={prizeConfigColumns}
            pagination={false}
            rowKey="id"
          />
        </Modal>
      </div>
    </AdminLayout>
  );
}
