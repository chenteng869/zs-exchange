'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Tabs, Switch } from 'antd';
import { CarOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, ArrowUpOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockLogisticsCompanies = [
  { id: '1', name: '顺丰速运', code: 'SF', status: 'active', apiKey: '***', contact: '张三', phone: '138****1234' },
  { id: '2', name: '圆通快递', code: 'YT', status: 'active', apiKey: '***', contact: '李四', phone: '139****5678' },
  { id: '3', name: '中通快递', code: 'ZTO', status: 'inactive', apiKey: '***', contact: '王五', phone: '137****9012' },
  { id: '4', name: '韵达快递', code: 'YD', status: 'active', apiKey: '***', contact: '赵六', phone: '136****3456' },
  { id: '5', name: '申通快递', code: 'STO', status: 'active', apiKey: '***', contact: '孙七', phone: '135****7890' },
];

const mockShippingTemplates = [
  { id: '1', name: '全国包邮', isDefault: true, feeType: 'free', regions: '全国', createTime: '2024-04-01 10:00:00' },
  { id: '2', name: '按重量计费', isDefault: false, feeType: 'weight', firstWeight: 1, firstFee: 10, additionalWeight: 1, additionalFee: 5, regions: '全国', createTime: '2024-04-05 14:30:00' },
  { id: '3', name: '按件数计费', isDefault: false, feeType: 'piece', firstPiece: 1, firstFee: 8, additionalPiece: 1, additionalFee: 3, regions: '全国', createTime: '2024-04-10 09:15:00' },
  { id: '4', name: '偏远地区计费', isDefault: false, feeType: 'fixed', fixedFee: 20, regions: '新疆、西藏、内蒙古', createTime: '2024-04-15 16:45:00' },
];

const logisticsStatusMap: Record<string, { color: 'success' | 'default'; label: string }> = {
  active: { color: 'success', label: '启用' },
  inactive: { color: 'default', label: '禁用' },
};

const logisticsChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['顺丰', '圆通', '韵达', '申通'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-01', '05-02', '05-03', '05-04', '05-05', '05-06', '05-07'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', name: '顺丰', data: [45, 52, 38, 65, 48, 55, 60], itemStyle: { color: '#DC2626' }, smooth: true },
    { type: 'line', name: '圆通', data: [30, 35, 40, 32, 38, 42, 45], itemStyle: { color: '#1677FF' }, smooth: true },
    { type: 'line', name: '韵达', data: [25, 28, 30, 26, 32, 35, 38], itemStyle: { color: '#F59E0B' }, smooth: true },
    { type: 'line', name: '申通', data: [20, 22, 18, 25, 24, 28, 30], itemStyle: { color: '#16A34A' }, smooth: true },
  ],
};

const companyColumns = [
  { title: '物流公司', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
  { title: '编码', dataIndex: 'code', key: 'code', render: (code: string) => <Tag color="blue">{code}</Tag> },
  { title: '联系人', dataIndex: 'contact', key: 'contact' },
  { title: '联系电话', dataIndex: 'phone', key: 'phone' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config = logisticsStatusMap[status];
      return <Badge status={config?.color} text={config?.label} />;
    },
  },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    ),
  },
];

const templateColumns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', render: (text: string, record: any) => (
    <span>
      <span className="font-semibold text-blue-600">{text}</span>
      {record.isDefault && <Tag color="green" className="ml-2">默认</Tag>}
    </span>
  ) },
  { 
    title: '计费方式', 
    dataIndex: 'feeType', 
    key: 'feeType', 
    render: (type: string) => {
      const typeMap: Record<string, string> = {
        free: '包邮',
        weight: '按重量',
        piece: '按件数',
        fixed: '固定运费',
      };
      return typeMap[type] || type;
    },
  },
  { title: '适用地区', dataIndex: 'regions', key: 'regions' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Space>
    ),
  },
];

export default function LogisticsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'company' | 'template'>('company');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();

  const activeCompanies = mockLogisticsCompanies.filter(c => c.status === 'active').length;
  const totalTemplates = mockShippingTemplates.length;

  const handleAdd = (type: 'company' | 'template') => {
    setEditingItem(null);
    setModalType(type);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any, type: 'company' | 'template') => {
    setEditingItem(record);
    setModalType(type);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({
        title: editingItem ? '更新成功' : '创建成功',
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
            <CarOutlined className="text-2xl text-orange-600" />
            <h1 className="text-2xl font-bold m-0">物流配置</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="启用物流商"
                value={activeCompanies}
                suffix={`/ ${mockLogisticsCompanies.length}`}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">可用物流数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="运费模板"
                value={totalTemplates}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">模板数量</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="物流使用趋势">
              <SafeECharts option={logisticsChartOption} style={{ height: 300 }} title="物流使用趋势" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="1">
          <TabPane tab="物流公司" key="1">
            <Card 
              title="物流公司列表"
              extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('company')}>添加物流商</Button>}
            >
              <Table
                dataSource={mockLogisticsCompanies}
                columns={[
                  ...companyColumns.map(col => 
                    col.key === 'action' 
                      ? { ...col, render: (_: any, record: any) => (
                          <Space size="small">
                            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record, 'company')}>编辑</Button>
                            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
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
          <TabPane tab="运费模板" key="2">
            <Card 
              title="运费模板列表"
              extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => handleAdd('template')}>添加模板</Button>}
            >
              <Table
                dataSource={mockShippingTemplates}
                columns={[
                  ...templateColumns.map(col => 
                    col.key === 'action' 
                      ? { ...col, render: (_: any, record: any) => (
                          <Space size="small">
                            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record, 'template')}>编辑</Button>
                            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
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
        </Tabs>

        <Modal
          title={editingItem ? '编辑' : (modalType === 'company' ? '添加物流公司' : '添加运费模板')}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          {modalType === 'company' ? (
            <Form form={form} layout="vertical">
              <Form.Item label="物流公司名称" name="name" rules={[{ required: true, message: '请输入物流公司名称' }]}>
                <Input placeholder="请输入物流公司名称" />
              </Form.Item>
              <Form.Item label="物流编码" name="code" rules={[{ required: true, message: '请输入物流编码' }]}>
                <Input placeholder="如: SF、YT" />
              </Form.Item>
              <Form.Item label="API Key" name="apiKey">
                <Input placeholder="请输入API Key" />
              </Form.Item>
              <Form.Item label="联系人" name="contact">
                <Input placeholder="请输入联系人" />
              </Form.Item>
              <Form.Item label="联系电话" name="phone">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
              <Form.Item label="状态" name="status" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Form>
          ) : (
            <Form form={form} layout="vertical">
              <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
                <Input placeholder="请输入模板名称" />
              </Form.Item>
              <Form.Item label="计费方式" name="feeType" rules={[{ required: true, message: '请选择计费方式' }]}>
                <Select placeholder="请选择计费方式">
                  <Option value="free">包邮</Option>
                  <Option value="weight">按重量</Option>
                  <Option value="piece">按件数</Option>
                  <Option value="fixed">固定运费</Option>
                </Select>
              </Form.Item>
              <Form.Item label="适用地区" name="regions">
                <Input placeholder="请输入适用地区，多个地区用逗号分隔" />
              </Form.Item>
              <Form.Item label="设为默认" name="isDefault" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
