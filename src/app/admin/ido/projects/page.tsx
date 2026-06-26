'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic } from 'antd';
import { TrophyOutlined, PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockProjects = [
  { id: '1', name: 'GXT Protocol', symbol: 'GXT', status: 'active', totalRaised: 5000000, targetAmount: 8000000, investors: 1250, price: 0.05, startDate: '2024-06-01', endDate: '2024-06-15', progress: 62 },
  { id: '2', name: 'MetaVerse Chain', symbol: 'MVC', status: 'upcoming', totalRaised: 0, targetAmount: 10000000, investors: 0, price: 0.08, startDate: '2024-07-01', endDate: '2024-07-15', progress: 0 },
  { id: '3', name: 'DeFi Gateway', symbol: 'DFG', status: 'completed', totalRaised: 3000000, targetAmount: 3000000, investors: 890, price: 0.12, startDate: '2024-04-01', endDate: '2024-04-15', progress: 100 },
  { id: '4', name: 'Web3 Gaming', symbol: 'WGX', status: 'active', totalRaised: 2500000, targetAmount: 5000000, investors: 678, price: 0.03, startDate: '2024-05-20', endDate: '2024-06-05', progress: 50 },
  { id: '5', name: 'NFT Market', symbol: 'NFM', status: 'paused', totalRaised: 1200000, targetAmount: 4000000, investors: 450, price: 0.06, startDate: '2024-05-01', endDate: '2024-05-15', progress: 30 },
];

const projectColumns = [
  { title: '项目名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
  { title: '代币符号', dataIndex: 'symbol', key: 'symbol', render: (text: string) => <Tag color="cyan">{text}</Tag> },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
        active: { color: 'success', label: '进行中' },
        upcoming: { color: 'warning', label: '即将开始' },
        completed: { color: 'default', label: '已完成' },
        paused: { color: 'error', label: '已暂停' },
      };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { title: '目标金额', dataIndex: 'targetAmount', key: 'targetAmount', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
  { title: '已筹集', dataIndex: 'totalRaised', key: 'totalRaised', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
  { title: '代币价格', dataIndex: 'price', key: 'price', render: (val: number) => `$${val}` },
  { title: '参与人数', dataIndex: 'investors', key: 'investors', render: (val: number) => val.toLocaleString() },
  { title: '开始时间', dataIndex: 'startDate', key: 'startDate' },
  { title: '进度', dataIndex: 'progress', key: 'progress', render: (val: number) => <Progress percent={val} strokeColor="#1677FF" /> },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        {record.status === 'active' ? (
          <Button type="link" size="small" danger>暂停</Button>
        ) : record.status === 'upcoming' ? (
          <Button type="link" size="small">启动</Button>
        ) : null}
      </Space>
    ),
  },
];

const raiseChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['GXT', 'MVC', 'DFG', 'WGX', 'NFM'] },
  yAxis: { type: 'value', name: '筹集金额(USD)' },
  series: [
    { type: 'bar', data: [500, 0, 300, 250, 120], itemStyle: { color: '#1677FF' }, name: '已筹集(万$)' },
    { type: 'bar', data: [300, 1000, 0, 250, 280], itemStyle: { color: '#e0e0e0' }, name: '剩余目标(万$)' },
  ],
};

export default function IDOProjectsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const totalProjects = mockProjects.length;
  const activeProjects = mockProjects.filter(p => p.status === 'active').length;
  const totalRaised = mockProjects.reduce((sum, p) => sum + p.totalRaised, 0);
  const totalInvestors = mockProjects.reduce((sum, p) => sum + p.investors, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">项目管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>创建项目</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="项目总数" value={totalProjects} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">IDO项目数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="进行中" value={activeProjects} suffix={`/${totalProjects}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃项目数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总筹集" value={(totalRaised / 1000000).toFixed(2)} prefix="$" suffix="M" valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">所有项目累计</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="参与用户" value={totalInvestors.toLocaleString()} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计参与人数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="筹资进度">
              <SafeECharts option={raiseChartOption} style={{ height: 250 }} title="筹资进度" />
            </Card>
          </Col>
        </Row>

        <Card title="项目列表">
          <Table
            dataSource={mockProjects}
            columns={projectColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="创建新项目"
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: '项目已创建！' });
              setIsModalVisible(false);
            });
          }}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="例如：GXT Protocol" />
            </Form.Item>
            <Form.Item label="代币符号" name="symbol" rules={[{ required: true, message: '请输入代币符号' }]}>
              <Input placeholder="例如：GXT" />
            </Form.Item>
            <Form.Item label="代币价格($)" name="price" rules={[{ required: true, message: '请输入代币价格' }]}>
              <InputNumber placeholder="代币价格" step={0.001} />
            </Form.Item>
            <Form.Item label="目标金额($)" name="targetAmount" rules={[{ required: true, message: '请输入目标金额' }]}>
              <InputNumber placeholder="目标金额" step={100000} />
            </Form.Item>
            <Form.Item label="开始日期" name="startDate" rules={[{ required: true, message: '请选择开始日期' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="结束日期" name="endDate" rules={[{ required: true, message: '请选择结束日期' }]}>
              <Input type="date" />
            </Form.Item>
            <Form.Item label="项目描述">
              <Input.TextArea rows={3} placeholder="请输入项目描述..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}