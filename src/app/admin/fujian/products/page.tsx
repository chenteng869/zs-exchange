'use client';

import { useState, useMemo } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Upload, Image, Switch, Input as AntInput } from 'antd';
import { GiftOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowUpOutlined, SearchOutlined, UpCircleOutlined, DownCircleOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  sales: number;
  status: string;
  image: string;
  recommended: boolean;
  sort: number;
  description: string;
}

const mockProducts: Product[] = [
  { id: '1', name: '福建老酒·369（经典款）', sku: 'FJ-369-001', category: '369元档', price: 369, costPrice: 180, stock: 5000, sales: 1250, status: 'active', image: 'https://placehold.co/60x60/8B4513/ffffff?text=老酒', recommended: true, sort: 1, description: '福建老酒经典款，选用优质糯米，古法酿造，口感醇厚。' },
  { id: '2', name: '福建老酒·369（礼盒装）', sku: 'FJ-369-002', category: '369元档', price: 399, costPrice: 200, stock: 3000, sales: 860, status: 'active', image: 'https://placehold.co/60x60/A0522D/ffffff?text=礼盒', recommended: true, sort: 2, description: '精美礼盒包装，送礼佳品，内含经典款老酒两瓶。' },
  { id: '3', name: '福建老酒·699（珍藏款）', sku: 'FJ-699-001', category: '699元档', price: 699, costPrice: 350, stock: 2000, sales: 420, status: 'active', image: 'https://placehold.co/60x60/8B0000/ffffff?text=珍藏', recommended: true, sort: 3, description: '珍藏级老酒，十年窖藏，酒体醇厚，回味悠长。' },
  { id: '4', name: '福建老酒·699（VIP尊享）', sku: 'FJ-699-002', category: '699元档', price: 799, costPrice: 400, stock: 1000, sales: 180, status: 'active', image: 'https://placehold.co/60x60/B22222/ffffff?text=VIP', recommended: false, sort: 4, description: 'VIP尊享版，限量发售，专属编号，收藏价值极高。' },
  { id: '5', name: '企业定制·坛装', sku: 'FJ-CUSTOM-001', category: '企业定制', price: 1299, costPrice: 600, stock: 500, sales: 65, status: 'active', image: 'https://placehold.co/60x60/CD853F/ffffff?text=坛装', recommended: false, sort: 5, description: '企业定制坛装，可印企业LOGO，商务馈赠首选。' },
  { id: '6', name: '企业定制·礼盒', sku: 'FJ-CUSTOM-002', category: '企业定制', price: 1999, costPrice: 900, stock: 300, sales: 28, status: 'active', image: 'https://placehold.co/60x60/DAA520/ffffff?text=定制', recommended: false, sort: 6, description: '高端企业定制礼盒，内含珍藏款老酒及定制酒具。' },
  { id: '7', name: '酒具套装', sku: 'FJ-TOOLS-001', category: '周边产品', price: 199, costPrice: 80, stock: 2000, sales: 350, status: 'active', image: 'https://placehold.co/60x60/D2691E/ffffff?text=酒具', recommended: true, sort: 7, description: '精美酒具套装，含酒壶一把，酒杯六只，古典造型。' },
  { id: '8', name: '收藏证书', sku: 'FJ-CERT-001', category: '周边产品', price: 99, costPrice: 20, stock: 5000, sales: 720, status: 'inactive', image: 'https://placehold.co/60x60/D2B48C/ffffff?text=证书', recommended: false, sort: 8, description: '限量版收藏证书，编号唯一，具有收藏纪念意义。' },
];

const categories = ['369元档', '699元档', '企业定制', '周边产品'];

const categoryColors: Record<string, string> = {
  '369元档': 'blue',
  '699元档': 'purple',
  '企业定制': 'gold',
  '周边产品': 'cyan',
};

const salesChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['销量', '销售额'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: [
    { type: 'value', name: '销量' },
    { type: 'value', name: '销售额(万)', position: 'right' },
  ],
  series: [
    { type: 'line', name: '销量', data: [120, 132, 101, 134, 90, 230, 210], itemStyle: { color: '#8B4513' }, smooth: true, areaStyle: { opacity: 0.2 } },
    { type: 'line', name: '销售额', yAxisIndex: 1, data: [4.5, 5.2, 3.8, 5.6, 3.2, 8.9, 8.1], itemStyle: { color: '#D2691E' }, smooth: true },
  ],
};

export default function FujianProductsPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !searchText || p.name.includes(searchText) || p.sku.includes(searchText);
      const matchCategory = !filterCategory || p.category === filterCategory;
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchText, filterCategory, filterStatus]);

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active').length;
  const lowStockProducts = products.filter(p => p.stock < 500 && p.status === 'active').length;
  const todaySales = 168;

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ recommended: false, sort: 0, status: 'active' });
    setIsModalVisible(true);
  };

  const handleEdit = (record: Product) => {
    setEditingProduct(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleView = (record: Product) => {
    setViewingProduct(record);
    setViewModalVisible(true);
  };

  const handleToggleStatus = (record: Product) => {
    const newStatus = record.status === 'active' ? 'inactive' : 'active';
    Modal.confirm({
      title: newStatus === 'active' ? '确认上架' : '确认下架',
      content: `确定要${newStatus === 'active' ? '上架' : '下架'}商品「${record.name}」吗？`,
      onOk: () => {
        setProducts(prev => prev.map(p => p.id === record.id ? { ...p, status: newStatus } : p));
      },
    });
  };

  const handleDelete = (record: Product) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除商品「${record.name}」吗？此操作不可撤销。`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setProducts(prev => prev.filter(p => p.id !== record.id));
        Modal.success({ title: '删除成功', content: '商品已删除' });
      },
    });
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...values } : p));
        Modal.success({ title: '商品更新成功', content: '商品信息已更新' });
      } else {
        const newProduct: Product = {
          ...values,
          id: Date.now().toString(),
          sales: 0,
        };
        setProducts(prev => [newProduct, ...prev]);
        Modal.success({ title: '商品创建成功', content: '新商品已添加' });
      }
      setIsModalVisible(false);
    });
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
      render: (text: string, record: Product) => (
        <div>
          <span className="font-semibold text-amber-800">{text}</span>
          {record.recommended && <Tag color="gold" className="ml-2">推荐</Tag>}
        </div>
      ),
    },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 130 },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (category: string) => <Tag color={categoryColors[category] || 'blue'}>{category}</Tag>,
    },
    { title: '售价', dataIndex: 'price', key: 'price', render: (val: number) => <span className="text-red-500 font-semibold">¥{val.toFixed(2)}</span> },
    { title: '成本价', dataIndex: 'costPrice', key: 'costPrice', render: (val: number) => `¥${val.toFixed(2)}` },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (val: number) => {
        let color = 'green';
        if (val === 0) color = 'red';
        else if (val < 500) color = 'orange';
        return <span style={{ color }}>{val}</span>;
      },
    },
    { title: '销量', dataIndex: 'sales', key: 'sales' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'default' | 'error' | 'warning'; label: string }> = {
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
      width: 240,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'active' ? <DownCircleOutlined /> : <UpCircleOutlined />}
            onClick={() => handleToggleStatus(record)}
          >
            {record.status === 'active' ? '下架' : '上架'}
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GiftOutlined className="text-2xl text-amber-700" />
            <h1 className="text-2xl font-bold m-0">福建老酒商品管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ backgroundColor: '#8B4513', borderColor: '#8B4513' }}>
            添加商品
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="商品总数"
                value={totalProducts}
                valueStyle={{ color: '#8B4513' }}
              />
              <div className="text-gray-400 text-sm mt-1">SKU 数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="上架中"
                value={activeProducts}
                suffix={`/${totalProducts}`}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 在售商品
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="库存预警"
                value={lowStockProducts}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">库存低于500</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日销量"
                value={todaySales}
                valueStyle={{ color: '#DC2626' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较昨日 +12.5%
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex items-center gap-2">
              <SearchOutlined className="text-gray-400" />
              <AntInput
                placeholder="搜索商品名称/SKU"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">分类：</span>
              <Select
                placeholder="全部"
                value={filterCategory || undefined}
                onChange={(val) => setFilterCategory(val || '')}
                style={{ width: 140 }}
                allowClear
              >
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">状态：</span>
              <Select
                placeholder="全部"
                value={filterStatus || undefined}
                onChange={(val) => setFilterStatus(val || '')}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="active">上架中</Option>
                <Option value="inactive">已下架</Option>
              </Select>
            </div>
          </div>

          <Table
            dataSource={filteredProducts}
            columns={productColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Card title="销量趋势">
          <SafeECharts option={salesChartOption} style={{ height: 300 }} title="近7天销量趋势" />
        </Card>

        <Modal
          title={editingProduct ? '编辑商品' : '添加商品'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={700}
          okText="保存"
          cancelText="取消"
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
                  <Input placeholder="例如: FJ-369-001" />
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
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="是否推荐" name="recommended" valuePropName="checked">
                  <Switch checkedChildren="推荐" unCheckedChildren="不推荐" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="排序" name="sort">
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="商品详情" name="description">
              <TextArea rows={4} placeholder="请输入商品详情描述..." />
            </Form.Item>
            <Form.Item label="上架状态" name="status" valuePropName="checked">
              <Switch
                checkedChildren="上架"
                unCheckedChildren="下架"
                checked={form.getFieldValue('status') === 'active'}
                onChange={(checked) => form.setFieldsValue({ status: checked ? 'active' : 'inactive' })}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="商品详情"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>关闭</Button>,
          ]}
          width={600}
        >
          {viewingProduct && (
            <div className="space-y-4">
              <div className="flex gap-6">
                <Image width={120} height={120} src={viewingProduct.image} style={{ borderRadius: 8 }} />
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{viewingProduct.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>SKU: {viewingProduct.sku}</p>
                    <p>分类: <Tag color={categoryColors[viewingProduct.category]}>{viewingProduct.category}</Tag></p>
                    <p>售价: <span className="text-red-500 font-semibold">¥{viewingProduct.price.toFixed(2)}</span></p>
                    <p>成本价: ¥{viewingProduct.costPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card size="small">
                  <Statistic title="库存" value={viewingProduct.stock} valueStyle={{ fontSize: 18 }} />
                </Card>
                <Card size="small">
                  <Statistic title="销量" value={viewingProduct.sales} valueStyle={{ fontSize: 18 }} />
                </Card>
                <Card size="small">
                  <Statistic
                    title="状态"
                    value={viewingProduct.status === 'active' ? '上架中' : '已下架'}
                    valueStyle={{ fontSize: 16, color: viewingProduct.status === 'active' ? '#16A34A' : '#9CA3AF' }}
                  />
                </Card>
              </div>
              <div>
                <h4 className="font-semibold mb-2">商品详情</h4>
                <p className="text-gray-600">{viewingProduct.description}</p>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>推荐: {viewingProduct.recommended ? '是' : '否'}</span>
                <span>排序: {viewingProduct.sort}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
