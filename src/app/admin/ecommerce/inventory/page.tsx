'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Tabs, Alert } from 'antd';
import { ContainerOutlined, PlusOutlined, InboxOutlined, WarningOutlined, ArrowUpOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockInventoryProducts = [
  { id: '1', name: '文房四宝套装', sku: 'WF-001', category: '文具用品', currentStock: 85, safeStock: 50, status: 'normal' },
  { id: '2', name: '宣纸 - 特净皮', sku: 'XZ-002', category: '纸张本册', currentStock: 150, safeStock: 100, status: 'normal' },
  { id: '3', name: '湖笔 - 精品羊毫', sku: 'HB-003', category: '文具用品', currentStock: 200, safeStock: 80, status: 'normal' },
  { id: '4', name: '端砚 - 绿端', sku: 'DY-004', category: '文具用品', currentStock: 15, safeStock: 30, status: 'low' },
  { id: '5', name: '墨条 - 徽墨', sku: 'MT-005', category: '文具用品', currentStock: 0, safeStock: 50, status: 'out' },
  { id: '6', name: '镇纸 - 铜器', sku: 'ZZ-006', category: '文具用品', currentStock: 45, safeStock: 30, status: 'normal' },
  { id: '7', name: '毛笔架 - 红木', sku: 'BJ-007', category: '文具用品', currentStock: 25, safeStock: 40, status: 'low' },
  { id: '8', name: '毛笔套装 - 礼盒装', sku: 'TZ-008', category: '礼品礼盒', currentStock: 50, safeStock: 40, status: 'normal' },
];

const mockStockRecords = [
  { id: 'REC-001', product: '宣纸 - 特净皮', type: 'in', quantity: 100, operator: '管理员', createTime: '2024-05-10 09:30:00', remark: '采购入库' },
  { id: 'REC-002', product: '湖笔 - 精品羊毫', type: 'out', quantity: 5, operator: '管理员', createTime: '2024-05-10 10:15:00', remark: '订单发货' },
  { id: 'REC-003', product: '文房四宝套装', type: 'out', quantity: 2, operator: '管理员', createTime: '2024-05-09 14:45:00', remark: '订单发货' },
  { id: 'REC-004', product: '端砚 - 绿端', type: 'in', quantity: 20, operator: '管理员', createTime: '2024-05-09 16:20:00', remark: '采购入库' },
  { id: 'REC-005', product: '墨条 - 徽墨', type: 'out', quantity: 10, operator: '管理员', createTime: '2024-05-08 08:10:00', remark: '订单发货' },
];

const stockStatusMap: Record<string, { color: 'success' | 'warning' | 'error'; label: string }> = {
  normal: { color: 'success', label: '正常' },
  low: { color: 'warning', label: '库存不足' },
  out: { color: 'error', label: '缺货' },
};

const inventoryChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['入库量', '出库量'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-01', '05-02', '05-03', '05-04', '05-05', '05-06', '05-07'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'bar', name: '入库量', data: [120, 80, 150, 90, 110, 70, 100], itemStyle: { color: '#16A34A' } },
    { type: 'bar', name: '出库量', data: [45, 60, 35, 50, 80, 40, 65], itemStyle: { color: '#1677FF' } },
  ],
};

const inventoryColumns = [
  { title: '商品名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
  { title: 'SKU', dataIndex: 'sku', key: 'sku' },
  { title: '分类', dataIndex: 'category', key: 'category', render: (category: string) => <Tag color="blue">{category}</Tag> },
  { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock', render: (val: number, record: any) => {
    let color = '#16A34A';
    if (record.status === 'out') color = '#DC2626';
    else if (record.status === 'low') color = '#F59E0B';
    return <span style={{ color, fontWeight: 'bold' }}>{val}</span>;
  } },
  { title: '安全库存', dataIndex: 'safeStock', key: 'safeStock' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config = stockStatusMap[status];
      return <Badge status={config?.color} text={config?.label} />;
    },
  },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<InboxOutlined />}>入库</Button>
        <Button type="link" size="small" icon={<ArrowUpOutlined />}>出库</Button>
        <Button type="link" size="small">盘点</Button>
      </Space>
    ),
  },
];

const recordColumns = [
  { title: '记录编号', dataIndex: 'id', key: 'id' },
  { title: '商品', dataIndex: 'product', key: 'product' },
  { 
    title: '类型', 
    dataIndex: 'type', 
    key: 'type', 
    render: (type: string) => <Tag color={type === 'in' ? 'green' : 'red'}>{type === 'in' ? '入库' : '出库'}</Tag>,
  },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (val: number, record: any) => `${record.type === 'in' ? '+' : '-'}${val}` },
  { title: '操作人', dataIndex: 'operator', key: 'operator' },
  { title: '操作时间', dataIndex: 'createTime', key: 'createTime' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
];

export default function InventoryPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'in' | 'out'>('in');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form] = Form.useForm();

  const normalStock = mockInventoryProducts.filter(p => p.status === 'normal').length;
  const lowStock = mockInventoryProducts.filter(p => p.status === 'low').length;
  const outStock = mockInventoryProducts.filter(p => p.status === 'out').length;
  const totalValue = mockInventoryProducts.reduce((sum, p) => sum + p.currentStock * 100, 0);

  const handleOperate = (record: any, type: 'in' | 'out') => {
    setSelectedProduct(record);
    setModalType(type);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({
        title: modalType === 'in' ? '入库成功' : '出库成功',
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
            <ContainerOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">库存管理</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="库存正常"
                value={normalStock}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">商品数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="库存不足"
                value={lowStock}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-orange-500 text-sm mt-1">
                <WarningOutlined /> 需要补货
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="缺货商品"
                value={outStock}
                valueStyle={{ color: '#DC2626' }}
              />
              <div className="text-red-500 text-sm mt-1">
                <WarningOutlined /> 紧急补货
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="库存价值"
                value={(totalValue / 10000).toFixed(2)}
                prefix="¥"
                suffix="万"
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">预估库存金额</div>
            </Card>
          </Col>
        </Row>

        {outStock > 0 && (
          <Alert
            message="库存预警"
            description={`当前有 ${outStock} 个商品缺货，${lowStock} 个商品库存不足，请及时补货！`}
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="出入库趋势">
              <SafeECharts option={inventoryChartOption} style={{ height: 300 }} title="出入库趋势" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="1">
          <TabPane tab="库存列表" key="1">
            <Card>
              <Table
                dataSource={mockInventoryProducts}
                columns={[
                  ...inventoryColumns.map(col => 
                    col.key === 'action' 
                      ? { ...col, render: (_: any, record: any) => (
                          <Space size="small">
                            <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => handleOperate(record, 'in')}>入库</Button>
                            <Button type="link" size="small" icon={<ArrowUpOutlined />} onClick={() => handleOperate(record, 'out')}>出库</Button>
                            <Button type="link" size="small">盘点</Button>
                          </Space>
                        )}
                      : col
                  ),
                ]}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
          <TabPane tab="出入库记录" key="2">
            <Card>
              <Table
                dataSource={mockStockRecords}
                columns={recordColumns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title={modalType === 'in' ? '商品入库' : '商品出库'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={500}
        >
          {selectedProduct && (
            <Form form={form} layout="vertical">
              <Form.Item label="商品名称">
                <Input value={selectedProduct.name} disabled />
              </Form.Item>
              <Form.Item label="当前库存">
                <Input value={selectedProduct.currentStock} disabled />
              </Form.Item>
              <Form.Item label="操作数量" name="quantity" rules={[{ required: true, message: '请输入数量' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
              </Form.Item>
              <Form.Item label="备注" name="remark">
                <Input.TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
