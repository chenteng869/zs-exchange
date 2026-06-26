'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Tabs } from 'antd';
import { PictureOutlined, PlusOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockHeritages = [
  { id: '1', name: '景泰蓝制作技艺', category: '传统工艺', level: '国家级', status: 'approved', views: 89000, likes: 5600, collector: 1200, rating: 4.8, createdAt: '2024-01-05', updatedAt: '2024-05-13' },
  { id: '2', name: '苏绣', category: '传统工艺', level: '国家级', status: 'approved', views: 76000, likes: 4800, collector: 980, rating: 4.9, createdAt: '2024-02-10', updatedAt: '2024-05-13' },
  { id: '3', name: '昆曲', category: '传统戏曲', level: '世界级', status: 'pending', views: 0, likes: 0, collector: 0, rating: 0, createdAt: '2024-03-15', updatedAt: '2024-05-12' },
  { id: '4', name: '景德镇瓷器', category: '传统工艺', level: '国家级', status: 'approved', views: 125000, likes: 7200, collector: 1560, rating: 4.7, createdAt: '2024-01-20', updatedAt: '2024-05-13' },
  { id: '5', name: '中医针灸', category: '传统医药', level: '世界级', status: 'rejected', views: 0, likes: 0, collector: 0, rating: 0, createdAt: '2024-04-01', updatedAt: '2024-05-10' },
  { id: '6', name: '剪纸艺术', category: '民间美术', level: '省级', status: 'approved', views: 56000, likes: 3200, collector: 650, rating: 4.6, createdAt: '2024-02-25', updatedAt: '2024-05-13' },
];

const heritageChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['浏览量', '收藏数'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['景泰蓝', '苏绣', '昆曲', '景德镇', '中医针灸', '剪纸'] },
  yAxis: { type: 'value', name: '数量' },
  series: [
    { type: 'bar', data: [89000, 76000, 0, 125000, 0, 56000], itemStyle: { color: '#1677FF' }, name: '浏览量' },
    { type: 'bar', data: [1200, 980, 0, 1560, 0, 650], itemStyle: { color: '#16A34A' }, name: '收藏数' },
  ],
};

export default function HeritageContentPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedHeritage, setSelectedHeritage] = useState<any>(null);
  const [form] = Form.useForm();

  const heritageColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-orange-600">{text}</span> },
    { 
      title: '分类', 
      dataIndex: 'category', 
      key: 'category', 
      render: (category: string) => {
        const colors = { '传统工艺': 'blue', '传统戏曲': 'green', '传统医药': 'purple', '民间美术': 'orange' };
        return <Tag color={colors[category as keyof typeof colors]}>{category}</Tag>;
      },
    },
    { 
      title: '级别', 
      dataIndex: 'level', 
      key: 'level', 
      render: (level: string) => {
        const colors = { '世界级': 'red', '国家级': 'blue', '省级': 'green' };
        return <Tag color={colors[level as keyof typeof colors]}>{level}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
          approved: { color: 'success', label: '已通过' },
          pending: { color: 'warning', label: '待审核' },
          rejected: { color: 'error', label: '已驳回' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '浏览量', dataIndex: 'views', key: 'views', render: (val: number) => val.toLocaleString() },
    { title: '点赞数', dataIndex: 'likes', key: 'likes', render: (val: number) => val.toLocaleString() },
    { title: '收藏数', dataIndex: 'collector', key: 'collector', render: (val: number) => val.toLocaleString() },
    { title: '评分', dataIndex: 'rating', key: 'rating', render: (val: number) => val > 0 ? `${val}分` : '-' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#16A34A' }}>通过</Button>
              <Button type="link" size="small" icon={<CloseCircleOutlined />} danger>驳回</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    setSelectedHeritage(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const totalHeritages = mockHeritages.length;
  const approvedHeritages = mockHeritages.filter(h => h.status === 'approved').length;
  const pendingHeritages = mockHeritages.filter(h => h.status === 'pending').length;
  const totalViews = mockHeritages.reduce((sum, h) => sum + h.views, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PictureOutlined className="text-2xl text-orange-600" />
            <h1 className="text-2xl font-bold m-0">非遗内容</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>添加项目</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="项目总数" value={totalHeritages} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">非遗项目数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已通过" value={approvedHeritages} suffix={`/${totalHeritages}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">已上线项目</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待审核" value={pendingHeritages} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">待审核项目</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总浏览量" value={totalViews.toLocaleString()} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计浏览</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="数据统计">
              <SafeECharts option={heritageChartOption} style={{ height: 250 }} title="数据统计" />
            </Card>
          </Col>
        </Row>

        <Card title="项目列表">
          <Table
            dataSource={mockHeritages}
            columns={heritageColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={selectedHeritage ? `${selectedHeritage.name} - 编辑` : '添加非遗项目'}
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: selectedHeritage ? '项目已更新！' : '项目已创建！' });
              setIsModalVisible(false);
              setSelectedHeritage(null);
            });
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedHeritage(null);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="例如：景泰蓝制作技艺" />
            </Form.Item>
            <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类">
                <Option value="传统工艺">传统工艺</Option>
                <Option value="传统戏曲">传统戏曲</Option>
                <Option value="传统医药">传统医药</Option>
                <Option value="民间美术">民间美术</Option>
              </Select>
            </Form.Item>
            <Form.Item label="级别" name="level" rules={[{ required: true, message: '请选择级别' }]}>
              <Select placeholder="请选择级别">
                <Option value="世界级">世界级</Option>
                <Option value="国家级">国家级</Option>
                <Option value="省级">省级</Option>
              </Select>
            </Form.Item>
            <Form.Item label="项目简介">
              <Input.TextArea rows={4} placeholder="请输入项目简介..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}