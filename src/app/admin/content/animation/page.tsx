'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, InputNumber } from 'antd';
import { VideoCameraAddOutlined, PlusOutlined, EyeOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockAnimations = [
  { id: '1', title: '山海经奇幻之旅', category: '神话改编', episodes: 52, duration: '5分钟/集', status: 'published', views: 389000, likes: 23400, shares: 5600, rating: 4.9, createdAt: '2024-01-05', updatedAt: '2024-05-15' },
  { id: '2', title: '封神榜动画版', category: '神话改编', episodes: 72, duration: '8分钟/集', status: 'published', views: 512000, likes: 32100, shares: 8900, rating: 4.9, createdAt: '2024-01-12', updatedAt: '2024-05-15' },
  { id: '3', title: '西游记Q版', category: '文学改编', episodes: 108, duration: '3分钟/集', status: 'published', views: 728000, likes: 45600, shares: 12300, rating: 5.0, createdAt: '2023-11-20', updatedAt: '2024-05-14' },
  { id: '4', title: '中华传统节日', category: '文化科普', episodes: 24, duration: '6分钟/集', status: 'published', views: 198000, likes: 11200, shares: 3400, rating: 4.7, createdAt: '2024-02-08', updatedAt: '2024-05-13' },
  { id: '5', title: '二十四节气故事', category: '文化科普', episodes: 24, duration: '4分钟/集', status: 'producing', views: 0, likes: 0, shares: 0, rating: 0, createdAt: '2024-04-10', updatedAt: '2024-05-12' },
];

const animationViewChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['山海经奇幻', '封神榜动画', '西游记Q版', '传统节日', '二十四节气'] },
  yAxis: { type: 'value', name: '播放量' },
  series: [
    { type: 'bar', data: [389000, 512000, 728000, 198000, 0], itemStyle: { color: '#F59E0B' }, name: '播放量' },
  ],
};

export default function GuoxueAnimationPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAnimation, setSelectedAnimation] = useState<any>(null);
  const [form] = Form.useForm();

  const animationColumns = [
    { title: '动漫名称', dataIndex: 'title', key: 'title', render: (text: string) => <span className="font-semibold text-amber-600">{text}</span> },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const colors = { '神话改编': 'gold', '文学改编': 'blue', '文化科普': 'green', '历史人物': 'purple' };
        return <Tag color={colors[category as keyof typeof colors]}>{category}</Tag>;
      },
    },
    { title: '集数', dataIndex: 'episodes', key: 'episodes', render: (val: number) => val + '集' },
    { title: '单集时长', dataIndex: 'duration', key: 'duration' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
          published: { color: 'success', label: '已发布' },
          producing: { color: 'warning', label: '制作中' },
          draft: { color: 'default', label: '草稿' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '播放量', dataIndex: 'views', key: 'views', render: (val: number) => val.toLocaleString() },
    { title: '点赞数', dataIndex: 'likes', key: 'likes', render: (val: number) => val.toLocaleString() },
    { title: '分享数', dataIndex: 'shares', key: 'shares', render: (val: number) => val.toLocaleString() },
    { title: '评分', dataIndex: 'rating', key: 'rating', render: (val: number) => val > 0 ? val + '分' : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<PlayCircleOutlined />}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'published' ? (
            <Button type="link" size="small" danger>下架</Button>
          ) : record.status === 'draft' ? (
            <Button type="link" size="small">发布</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const handleEdit = (record: any) => {
    setSelectedAnimation(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const totalAnimations = mockAnimations.length;
  const publishedAnimations = mockAnimations.filter(a => a.status === 'published').length;
  const totalViews = mockAnimations.reduce((sum, a) => sum + a.views, 0);
  const totalLikes = mockAnimations.reduce((sum, a) => sum + a.likes, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VideoCameraAddOutlined className="text-2xl text-amber-500" />
            <h1 className="text-2xl font-bold m-0">国学动漫</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>添加动漫</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="动漫总数" value={totalAnimations} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">动漫作品数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已发布" value={publishedAnimations} suffix={'/' + totalAnimations} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">上线动漫数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总播放量" value={totalViews.toLocaleString()} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计播放</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总点赞" value={totalLikes.toLocaleString()} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">用户点赞</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="播放量统计">
              <SafeECharts option={animationViewChartOption} style={{ height: 250 }} title="播放量统计" />
            </Card>
          </Col>
        </Row>

        <Card title="动漫列表">
          <Table
            dataSource={mockAnimations}
            columns={animationColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={selectedAnimation ? selectedAnimation.title + ' - 编辑' : '添加新动漫'}
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: selectedAnimation ? '动漫已更新！' : '动漫已创建！' });
              setIsModalVisible(false);
              setSelectedAnimation(null);
            });
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedAnimation(null);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="动漫名称" name="title" rules={[{ required: true, message: '请输入动漫名称' }]}>
              <Input placeholder="例如：山海经奇幻之旅" />
            </Form.Item>
            <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类">
                <Option value="神话改编">神话改编</Option>
                <Option value="文学改编">文学改编</Option>
                <Option value="文化科普">文化科普</Option>
                <Option value="历史人物">历史人物</Option>
              </Select>
            </Form.Item>
            <Form.Item label="集数" name="episodes" rules={[{ required: true, message: '请输入集数' }]}>
              <InputNumber placeholder="集数" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="单集时长" name="duration" rules={[{ required: true, message: '请输入单集时长' }]}>
              <Input placeholder="例如：5分钟/集" />
            </Form.Item>
            <Form.Item label="动漫简介">
              <Input.TextArea rows={3} placeholder="请输入动漫简介..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
