'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, InputNumber } from 'antd';
import { VideoCameraOutlined, PlusOutlined, EyeOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockDramas = [
  { id: '1', title: '红楼梦短剧', category: '文学改编', episodes: 24, duration: '8分钟/集', status: 'published', views: 256000, likes: 15600, shares: 3200, rating: 4.9, createdAt: '2024-01-10', updatedAt: '2024-05-13' },
  { id: '2', title: '孔子传', category: '历史人物', episodes: 36, duration: '10分钟/集', status: 'published', views: 189000, likes: 12000, shares: 2800, rating: 4.8, createdAt: '2024-02-15', updatedAt: '2024-05-13' },
  { id: '3', title: '三国演义精选', category: '文学改编', episodes: 48, duration: '12分钟/集', status: 'producing', views: 0, likes: 0, shares: 0, rating: 0, createdAt: '2024-03-20', updatedAt: '2024-05-12' },
  { id: '4', title: '宋词小故事', category: '诗词文化', episodes: 30, duration: '6分钟/集', status: 'published', views: 145000, likes: 9800, shares: 2100, rating: 4.7, createdAt: '2024-01-28', updatedAt: '2024-05-13' },
  { id: '5', title: '聊斋志异', category: '传统故事', episodes: 20, duration: '15分钟/集', status: 'draft', views: 0, likes: 0, shares: 0, rating: 0, createdAt: '2024-04-05', updatedAt: '2024-05-10' },
];

const dramaViewChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['红楼梦短剧', '孔子传', '三国演义精选', '宋词小故事', '聊斋志异'] },
  yAxis: { type: 'value', name: '播放量' },
  series: [
    { type: 'bar', data: [256000, 189000, 0, 145000, 0], itemStyle: { color: '#16A34A' }, name: '播放量' },
  ],
};

export default function GuoxueDramaPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDrama, setSelectedDrama] = useState<any>(null);
  const [form] = Form.useForm();

  const dramaColumns = [
    { title: '短剧名称', dataIndex: 'title', key: 'title', render: (text: string) => <span className="font-semibold text-green-600">{text}</span> },
    { 
      title: '分类', 
      dataIndex: 'category', 
      key: 'category', 
      render: (category: string) => {
        const colors = { '文学改编': 'blue', '历史人物': 'green', '诗词文化': 'purple', '传统故事': 'orange' };
        return <Tag color={colors[category as keyof typeof colors]}>{category}</Tag>;
      },
    },
    { title: '集数', dataIndex: 'episodes', key: 'episodes', render: (val: number) => `${val}集` },
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
    { title: '评分', dataIndex: 'rating', key: 'rating', render: (val: number) => val > 0 ? `${val}分` : '-' },
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
    setSelectedDrama(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const totalDramas = mockDramas.length;
  const publishedDramas = mockDramas.filter(d => d.status === 'published').length;
  const totalViews = mockDramas.reduce((sum, d) => sum + d.views, 0);
  const totalLikes = mockDramas.reduce((sum, d) => sum + d.likes, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <VideoCameraOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">真人短剧</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>添加短剧</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="短剧总数" value={totalDramas} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">短剧作品数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已发布" value={publishedDramas} suffix={`/${totalDramas}`} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">上线短剧数</div>
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
              <Statistic title="总点赞" value={totalLikes.toLocaleString()} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">用户点赞</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="播放量统计">
              <SafeECharts option={dramaViewChartOption} style={{ height: 250 }} title="播放量统计" />
            </Card>
          </Col>
        </Row>

        <Card title="短剧列表">
          <Table
            dataSource={mockDramas}
            columns={dramaColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={selectedDrama ? `${selectedDrama.title} - 编辑` : '添加新短剧'}
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: selectedDrama ? '短剧已更新！' : '短剧已创建！' });
              setIsModalVisible(false);
              setSelectedDrama(null);
            });
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedDrama(null);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="短剧名称" name="title" rules={[{ required: true, message: '请输入短剧名称' }]}>
              <Input placeholder="例如：红楼梦短剧" />
            </Form.Item>
            <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
              <Select placeholder="请选择分类">
                <Option value="文学改编">文学改编</Option>
                <Option value="历史人物">历史人物</Option>
                <Option value="诗词文化">诗词文化</Option>
                <Option value="传统故事">传统故事</Option>
              </Select>
            </Form.Item>
            <Form.Item label="集数" name="episodes" rules={[{ required: true, message: '请输入集数' }]}>
              <InputNumber placeholder="集数" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="单集时长" name="duration" rules={[{ required: true, message: '请输入单集时长' }]}>
              <Input placeholder="例如：8分钟/集" />
            </Form.Item>
            <Form.Item label="短剧简介">
              <Input.TextArea rows={3} placeholder="请输入短剧简介..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}