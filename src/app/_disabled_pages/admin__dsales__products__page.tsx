'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Row, Col, Descriptions, InputNumber, Form, Switch, Select, Button, Space, Input } from 'antd';
import {
  ShopOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  StarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface ProductRecord {
  id: string;
  name: string;
  type: string;
  price: number;
  benefits: string;
  sales: number;
  status: 'active' | 'inactive' | 'draft';
}

const mockProducts: ProductRecord[] = [
  {
    id: '1',
    name: '钻石创业套餐',
    type: '创业版',
    price: 10000,
    benefits: '最高30%佣金+团队管理权+专属培训',
    sales: 156,
    status: 'active',
  },
  {
    id: '2',
    name: '金牌代理套餐',
    type: '代理版',
    price: 5000,
    benefits: '20%佣金+二级分销+月度奖励',
    sales: 289,
    status: 'active',
  },
  {
    id: '3',
    name: '银牌代理套餐',
    type: '代理版',
    price: 2500,
    benefits: '15%佣金+一级分销+基础培训',
    sales: 445,
    status: 'active',
  },
  {
    id: '4',
    name: '铜牌入门套餐',
    type: '入门版',
    price: 1000,
    benefits: '10%佣金+个人销售权限',
    sales: 678,
    status: 'active',
  },
  {
    id: '5',
    name: 'VIP尊享套餐',
    type: '尊享版',
    price: 25000,
    benefits: '35%佣金+区域独家+董事会席位',
    sales: 34,
    status: 'active',
  },
  {
    id: '6',
    name: '体验试用套餐',
    type: '体验版',
    price: 299,
    benefits: '7天体验期+基础功能+导师指导',
    sales: 1234,
    status: 'active',
  },
  {
    id: '7',
    name: '企业定制套餐',
    type: '企业版',
    price: 50000,
    benefits: '专属方案+API对接+技术支持',
    sales: 12,
    status: 'active',
  },
  {
    id: '8',
    name: '季度成长套餐',
    type: '成长版',
    price: 8000,
    benefits: '90天有效期+进阶课程+业绩加速',
    sales: 89,
    status: 'inactive',
  },
  {
    id: '9',
    name: '年度战略套餐',
    type: '战略版',
    price: 30000,
    benefits: '365天全权益+年度大会+股权激励',
    sales: 23,
    status: 'active',
  },
  {
    id: '10',
    name: '新人特惠套餐',
    type: '特惠版',
    price: 599,
    benefits: '首月5折+新人礼包+1对1辅导',
    sales: 567,
    status: 'active',
  },
];

const getTypeIcon = (type: string) => {
  const map: Record<string, React.ReactNode> = {
    '创业版': <CrownOutlined style={{ color: '#F0B90B' }} />,
    '代理版': <ThunderboltOutlined style={{ color: '#1677FF' }} />,
    '入门版': <StarOutlined style={{ color: '#16A34A' }} />,
    '尊享版': <FireOutlined style={{ color: '#DC2626' }} />,
    '体验版': <AppstoreOutlined style={{ color: '#7C3AED' }} />,
    '企业版': <ShopOutlined style={{ color: '#F59E0B' }} />,
    '成长版': <ThunderboltOutlined style={{ color: '#0891B2' }} />,
    '战略版': <CrownOutlined style={{ color: '#EC4899' }} />,
    '特惠版': <StarOutlined style={{ color: '#F97316' }} />,
  };
  return map[type] || <AppstoreOutlined />;
};

const getStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '在售' },
    inactive: { color: 'default', text: '停售' },
    draft: { color: 'warning', text: '草稿' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

export default function DsalesProductsPage() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [form] = Form.useForm();

  const handleEdit = (record: ProductRecord) => {
    setSelectedProduct(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      price: record.price,
      status: record.status,
      benefits: record.benefits,
    });
    setEditModalOpen(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      console.log('保存套餐:', values);
      setEditModalOpen(false);
    });
  };

  const actions: any[] = [
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
      onClick: handleEdit,
      hidden: () => false,
    },
    {
      key: 'toggle',
      label: (record: ProductRecord) =>
        record.status === 'active' ? '停售' : '上架',
      icon: (record: ProductRecord) =>
        record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />,
      type: 'link',
      onClick: (record: ProductRecord) =>
        console.log('切换状态:', record.name),
      hidden: () => false,
      danger: (record: ProductRecord) => record.status === 'active',
    },
  ];

  const columns = [
    {
      title: '套餐名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: ProductRecord) => (
        <Space>
          {getTypeIcon(record.type)}
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '价格(USDT)',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      sorter: (a: ProductRecord, b: ProductRecord) => a.price - b.price,
      render: (val: number) => (
        <Text strong style={{ color: '#F0B90B', fontSize: 16 }}>
          ${val.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '权益说明',
      dataIndex: 'benefits',
      key: 'benefits',
      width: 320,
      ellipsis: true,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 100,
      sorter: (a: ProductRecord, b: ProductRecord) => a.sales - b.sales,
      render: (val: number) => (
        <Text strong>{val.toLocaleString()}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          产品套餐中心
        </Title>
        <Text type="secondary">套餐配置 · 价格体系 · 权益管理</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="套餐总数"
            value={10}
            icon={<AppstoreOutlined />}
            color="#F0B90B"
            suffix="款"
            trend="up"
            trendValue="+2款"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="在售套餐"
            value={8}
            icon={<ShoppingOutlined />}
            color="#16A34A"
            suffix="款"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="本月销量"
            value={3527}
            icon={<ShoppingCartOutlined />}
            color="#1677FF"
            suffix="单"
            trend="up"
            trendValue="+18.6%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总收入(USDT)"
            value="1,258万"
            icon={<DollarOutlined />}
            color="#7C3AED"
            prefix="$"
            trend="up"
            trendValue="+22.3%"
          />
        </Col>
      </Row>

      {/* 套餐列表表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="套餐列表"
          columns={columns}
          dataSource={mockProducts}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索套餐名称..."
          showFilter={true}
          filterOptions={[
            { label: '全部类型', value: '' },
            { label: '创业版', value: '创业版' },
            { label: '代理版', value: '代理版' },
            { label: '入门版', value: '入门版' },
            { label: '尊享版', value: '尊享版' },
            { label: '企业版', value: '企业版' },
          ]}
          addButtonText="新增套餐"
          onAdd={() => console.log('新增套餐')}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 款套餐`,
          }}
        />
      </Card>

      {/* 编辑套餐弹窗 */}
      <Modal
        title={`编辑套餐 - ${selectedProduct?.name || ''}`}
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={handleSave}
        okText="保存"
        cancelText="取消"
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="套餐名称" name="name" rules={[{ required: true, message: '请输入套餐名称' }]}>
                <Input placeholder="请输入套餐名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="套餐类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择类型">
                  <Select.Option value="创业版">创业版</Select.Option>
                  <Select.Option value="代理版">代理版</Select.Option>
                  <Select.Option value="入门版">入门版</Select.Option>
                  <Select.Option value="尊享版">尊享版</Select.Option>
                  <Select.Option value="企业版">企业版</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="价格(USDT)" name="price" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber
                  min={0}
                  step={100}
                  style={{ width: '100%' }}
                  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value): number => Number(value?.replace(/\$\s?|(,*)/g, '') || '0')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="状态" name="status">
                <Select placeholder="请选择状态">
                  <Select.Option value="active">在售</Select.Option>
                  <Select.Option value="inactive">停售</Select.Option>
                  <Select.Option value="draft">草稿</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="权益说明" name="benefits" rules={[{ required: true, message: '请输入权益说明' }]}>
            <Input.TextArea rows={3} placeholder="请描述套餐包含的权益..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
