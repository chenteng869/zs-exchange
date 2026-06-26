'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Upload, Image, Switch } from 'antd';
import { ShopOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TextArea } = Input;

const mockProducts = [
  { id: '1', name: '文房四宝套装', sku: 'WF-001', category: '文具用品', price: 299, costPrice: 120, stock: 85, status: 'active', image: 'https://placehold.co/60x60/1890ff/ffffff?text=文房', sales: 320 },
  { id: '2', name: '宣纸 - 特净皮', sku: 'XZ-002', category: '纸张本册', price: 158, costPrice: 60, stock: 150, status: 'active', image: 'https://placehold.co/60x60/52c41a/ffffff?text=宣纸', sales: 480 },
  { id: '3', name: '湖笔 - 精品羊毫', sku: 'HB-003', category: '文具用品', price: 89, costPrice: 35, stock: 200, status: 'active', image: 'https://placehold.co/60x60/722ed1/ffffff?text=湖笔', sales: 620 },
  { id: '4', name: '端砚 - 绿端', sku: 'DY-004', category: '文具用品', price: 599, costPrice: 250, stock: 15, status: 'active', image: 'https://placehold.co/60x60/fa8c16/ffffff?text=端砚', sales: 98 },
  { id: '5', name: '墨条 - 徽墨', sku: 'MT-005', category: '文具用品', price: 68, costPrice: 25, stock: 0, status: 'out_of_stock', image: 'https://placehold.co/60x60/f5222d/ffffff?text=徽墨', sales: 350 },
  { id: '6', name: '镇纸 - 铜器', sku: 'ZZ-006', category: '文具用品', price: 128, costPrice: 50, stock: 45, status: 'active', image: 'https://placehold.co/60x60/eb2f96/ffffff?text=镇纸', sales: 180 },
  { id: '7', name: '毛笔架 - 红木', sku: 'BJ-007', category: '文具用品', price: 198, costPrice: 80, stock: 25, status: 'low_stock', image: 'https://placehold.co/60x60/13c2c2/ffffff?text=笔架', sales: 120 },
  { id: '8', name: '毛笔套装 - 礼盒装', sku: 'TZ-008', category: '礼品礼盒', price: 399, costPrice: 160, stock: 50, status: 'active', image: 'https://placehold.co/60x60/1890ff/ffffff?text=礼盒', sales: 280 },
];

const categories = ['文具用品', '纸张本册', '礼品礼盒', '装饰摆件', '书籍书画', '其他'];

const salesChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['销量', '销售额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['文具用品', '纸张本册', '礼品礼盒', '装饰摆件', '书籍书画', '其他'] },
  yAxis: [
    { type: 'value', name: '销量' },
    { type: 'value', name: '销售额(万)', position: 'right' },
  ],
  series: [
    { type: 'bar', name: '销量', data: [1520, 480, 280, 120, 60, 30], itemStyle: { color: '#1677FF' } },
    { type: 'line', name: '销售额', yAxisIndex: 1, data: [45.2, 7.6, 11.2, 5.8, 3.2, 1.5], itemStyle: { color: '#16A34A' } },
  ],
};

const productColumns = [
  { 
    title: '商品图片', 
    dataIndex: 'image', 
    key: 'image', 
    width: 80,
    render: (image: string) => <Image width={60} height={60} src={image} style={{ borderRadius: 4 }} />,
  },
  { 
    title: '商品名称', 
    dataIndex: 'name', 
    key: 'name', 
    render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
  },
  { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 120, render: (category: string) => <Tag color="blue">{category}</Tag> },
  { title: '售价', dataIndex: 'price', key: 'price', render: (val: number) => `¥${val.toFixed(2)}` },
  { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', render: (val: number) => `¥${val.toFixed(2)}` },
  { title: '库存', dataIndex: 'stock', key: 'stock', render: (val: number, record: any) => {
    let color = 'green';
    if (val === 0) color = 'red';
    else if (val < 30) color = 'orange';
    return <span style={{ color }}>{val}</span>;
  } },
  { title: '销量', dataIndex: 'sales', key: 'sales' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    width: 100,
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
        active: { color: 'success', label: '上架中' },
        inactive: { color: 'default', label: '已下架' },
        out_of_stock: { color: 'error', label: '缺货' },
        low_stock: { color: 'warning', label: '库存低' },
      };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { 
    title: '操作', 
    key: 'action', 
    width: 180,
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    ),
  },
];

export default function ProductsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [form] = Form.useForm();

  const totalProducts = mockProducts.length;
  const activeProducts = mockProducts.filter(p => p.status === 'active' || p.status === 'low_stock').length;
  const outOfStock = mockProducts.filter(p => p.status === 'out_of_stock').length;
  const totalSales = mockProducts.reduce((sum, p) => sum + p.sales * p.price, 0);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({
        title: editingProduct ? '商品更新成功' : '商品创建成功',
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
            <ShopOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">商品管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加商品</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="商品总数"
                value={totalProducts}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">SKU 数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="在售商品"
                value={activeProducts}
                suffix={`/${totalProducts}`}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较昨日 +2
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="缺货商品"
                value={outOfStock}
                valueStyle={{ color: '#DC2626' }}
              />
              <div className="text-gray-400 text-sm mt-1">需要补货</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="销售总额"
                value={(totalSales / 10000).toFixed(2)}
                prefix="¥"
                suffix="万"
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">累计销售额</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="分类销售统计">
              <SafeECharts option={salesChartOption} style={{ height: 300 }} title="分类销售统计" />
            </Card>
          </Col>
        </Row>

        <Card title="商品列表">
          <Table
            dataSource={mockProducts}
            columns={productColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingProduct ? '编辑商品' : '添加商品'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={700}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={14}>
                <Form.Item label="商品名称" name="name" rules={[{ required: true, message: '请输入商品名称' }]}>
                  <Input placeholder="请输入商品名称" />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item label="SKU" name="sku" rules={[{ required: true, message: '请输入SKU' }]}>
                  <Input placeholder="例如: WF-001" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="商品分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
                  <Select placeholder="请选择分类">
                    {categories.map(cat => (
                      <Option key={cat} value={cat}>{cat}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="商品图片" name="image">
                  <Upload listType="picture-card" maxCount={1}>
                    <div>上传图片</div>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="售价(¥)" name="price" rules={[{ required: true, message: '请输入售价' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="售价" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="成本价(¥)" name="costPrice" rules={[{ required: true, message: '请输入成本价' }]}>
                  <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="成本价" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="库存数量" name="stock" rules={[{ required: true, message: '请输入库存' }]}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="库存" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="商品描述" name="description">
              <TextArea rows={4} placeholder="请输入商品描述..." />
            </Form.Item>
            <Form.Item label="上架状态" name="status" valuePropName="checked">
              <Switch checkedChildren="上架" unCheckedChildren="下架" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
