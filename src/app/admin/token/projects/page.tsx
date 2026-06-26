'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Switch,
  message,
  Typography,
} from 'antd';
import {
  ProjectOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Option } = Select;
const { Title, Text } = Typography;

const mockTokenProjects = [
  { id: '1', symbol: 'AIOPC', name: 'AIOPC Protocol', chain: 'BSC', type: 'Utility', totalSupply: '1,000,000,000', marketCap: '$125.6M', listingDate: '2024-03-15', status: 'active' },
  { id: '2', symbol: 'ZSDEX', name: 'ZS Exchange Token', chain: 'ETH', type: 'Governance', totalSupply: '500,000,000', marketCap: '$89.2M', listingDate: '2024-04-01', status: 'active' },
  { id: '3', symbol: 'DEFI+', name: 'DeFi Plus Protocol', chain: 'Polygon', type: 'Utility', totalSupply: '2,000,000,000', marketCap: '$45.8M', listingDate: '2024-05-10', status: 'active' },
  { id: '4', symbol: 'META3', name: 'MetaVerse 3.0', chain: 'Arbitrum', type: 'GameFi', totalSupply: '800,000,000', marketCap: '$32.1M', listingDate: '2024-05-20', status: 'pending' },
  { id: '5', symbol: 'CHAINX', name: 'Chain X Network', chain: 'ETH', type: 'Infrastructure', totalSupply: '300,000,000', marketCap: '$67.4M', listingDate: '2024-06-01', status: 'active' },
  { id: '6', symbol: 'NFTFI', name: 'NFT Finance', chain: 'Solana', type: 'DeFi', totalSupply: '1,500,000,000', marketCap: '$28.9M', listingDate: '2024-06-08', status: 'review' },
  { id: '7', symbol: 'WEB3H', name: 'Web3 Hub', chain: 'Avalanche', type: 'Utility', totalSupply: '750,000,000', marketCap: '$18.5M', listingDate: '2024-06-12', status: 'pending' },
  { id: '8', symbol: 'ORACLE', name: 'Oracle Data Chain', chain: 'ETH', type: 'Oracle', totalSupply: '400,000,000', marketCap: '$52.3M', listingDate: '2024-06-15', status: 'active' },
  { id: '9', symbol: 'PRIVX', name: 'Privacy Shield', chain: 'Secret', type: 'Privacy', totalSupply: '600,000,000', marketCap: '$41.7M', listingDate: '2024-06-18', status: 'active' },
  { id: '10', symbol: 'YIELDA', name: 'Yield Aggregator', chain: 'Optimism', type: 'DeFi', totalSupply: '1,200,000,000', marketCap: '$22.6M', listingDate: '2024-06-20', status: 'pending' },
  { id: '11', symbol: 'GAMEON', name: 'GameOn Platform', chain: 'Immutable X', type: 'GameFi', totalSupply: '900,000,000', marketCap: '$15.2M', listingDate: '2024-06-22', status: 'review' },
  { id: '12', symbol: 'SOCIAL', name: 'SocialFi DAO', chain: 'Base', type: 'Social', totalSupply: '1,800,000,000', marketCap: '$9.8M', listingDate: '2024-06-23', status: 'draft' },
];

const statusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '已上线' },
  pending: { color: 'orange', label: '待审核' },
  review: { color: 'blue', label: '审核中' },
  draft: { color: 'default', label: '草稿' },
  delisted: { color: 'red', label: '已退市' },
};

const chainOptions = [
  { value: 'ETH', label: 'Ethereum' },
  { value: 'BSC', label: 'BNB Smart Chain' },
  { value: 'Polygon', label: 'Polygon' },
  { value: 'Solana', label: 'Solana' },
  { value: 'Arbitrum', label: 'Arbitrum' },
  { value: 'Optimism', label: 'Optimism' },
  { value: 'Avalanche', label: 'Avalanche' },
  { value: 'Base', label: 'Base' },
];

const typeOptions = [
  { value: 'Utility', label: '功能型代币' },
  { value: 'Governance', label: '治理代币' },
  { value: 'DeFi', label: 'DeFi代币' },
  { value: 'GameFi', label: '游戏代币' },
  { value: 'Infrastructure', label: '基础设施' },
  { value: 'Oracle', label: '预言机' },
  { value: 'Privacy', label: '隐私保护' },
  { value: 'Social', label: '社交代币' },
];

export default function TokenProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const totalTokens = mockTokenProjects.length;
  const activeTokens = mockTokenProjects.filter((t) => t.status === 'active').length;
  const totalMarketCap = '$549.1M';
  const volume24h = '$28.6M';
  const newThisMonth = 7;
  const complianceRate = '94.2%';

  const columns = [
    {
      title: '代币符号',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string) => <Tag color="gold">{text}</Tag>,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '总供应量',
      dataIndex: 'totalSupply',
      key: 'totalSupply',
      render: (text: string) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      render: (text: string) => <span className="font-semibold text-green-600">{text}</span>,
    },
    {
      title: '上架日期',
      dataIndex: 'listingDate',
      key: 'listingDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: any) => message.info(`查看 ${record.symbol}`),
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link' as const,
      onClick: (record: any) => {
        setEditingRecord(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
      },
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      type: 'link' as const,
      danger: true,
      hidden: () => false,
      confirm: {
        title: '确认删除',
        description: '删除后数据不可恢复',
        onConfirm: (record: any) => message.success(`已删除 ${record.symbol}`),
      },
    },
  ];

  const handleAddNew = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      message.success(editingRecord ? '更新成功！' : '创建成功！');
      setIsModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Title level={2} className="m-0 flex items-center gap-3">
            <ProjectOutlined style={{ color: '#F0B90B' }} />
            代币项目管理中心
          </Title>
          <Text type="secondary" className="mt-2 block">
            代币全生命周期管理 · 发行{'→'}上线{'→'}运营{'→'}退市
          </Text>
        </div>

        {/* DataCards 统计 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="项目总数"
              value={totalTokens}
              icon={<ProjectOutlined />}
              color="#1677FF"
              suffix="个"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="活跃代币"
              value={activeTokens}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix={`/${totalTokens}`}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="总市值"
              value={totalMarketCap}
              icon={<DollarOutlined />}
              color="#F0B90B"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="24h交易量"
              value={volume24h}
              icon={<RiseOutlined />}
              color="#7C3AED"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="本月新增"
              value={newThisMonth}
              icon={<ThunderboltOutlined />}
              color="#F59E0B"
              suffix="个"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="合规率"
              value={complianceRate}
              icon={<SafetyCertificateOutlined />}
              color="#16A34A"
            />
          </Col>
        </Row>

        {/* DataTable 数据表格 */}
        <DataTable
          columns={columns}
          dataSource={mockTokenProjects}
          title="代币项目列表"
          showSearch
          searchPlaceholder="搜索代币符号或名称..."
          showAdd
          addButtonText="新建代币项目"
          onAdd={handleAddNew}
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 新建/编辑 Modal */}
        <Modal
          title={editingRecord ? '编辑代币项目' : '新建代币项目'}
          open={isModalOpen}
          onOk={handleSubmit}
          onCancel={() => setIsModalOpen(false)}
          width={700}
          okText="提交"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="代币符号" name="symbol" rules={[{ required: true, message: '请输入代币符号' }]}>
                  <Input placeholder="例如：AIOPC" maxLength={10} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="项目名称" name="name" rules={[{ required: true, message: '请输入项目名称' }]}>
                  <Input placeholder="例如：AIOPC Protocol" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="所属链" name="chain" rules={[{ required: true, message: '请选择所属链' }]}>
                  <Select placeholder="选择区块链网络">
                    {chainOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="代币类型" name="type" rules={[{ required: true, message: '请选择代币类型' }]}>
                  <Select placeholder="选择代币类型">
                    {typeOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="总供应量" name="totalSupply" rules={[{ required: true, message: '请输入总供应量' }]}>
                  <InputNumber placeholder="例如：1000000000" style={{ width: '100%' }} min={0} step={1000000} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="上架日期" name="listingDate">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="项目描述" name="description">
              <Input.TextArea rows={3} placeholder="请简要描述代币项目的愿景和用途..." maxLength={500} />
            </Form.Item>

            <Form.Item label="是否启用自动合规检查" name="autoCompliance" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" defaultChecked />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
