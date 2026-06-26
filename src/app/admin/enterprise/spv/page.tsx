'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Typography,
  Descriptions,
  Timeline,
} from 'antd';
import {
  ApartmentOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  BankOutlined,
  CalendarOutlined,
  ClusterOutlined,
  DeploymentUnitOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { Title, Text } = Typography;

const mockSPVs = [
  { id: 'SPV-001', name: 'ZS Digital SPV I', parent: '中萨数字科技集团', jurisdiction: '萨摩亚', assetType: '数字资产', scale: '$5,000,000', establishedDate: '2024-03-15', status: 'active' },
  { id: 'SPV-002', name: 'MetaVerse Fund LP', parent: 'MetaVerse Ventures Ltd.', jurisdiction: 'BVI', assetType: '基金资产', scale: '$12,000,000', establishedDate: '2024-04-01', status: 'active' },
  { id: 'SPV-003', name: 'DeFi Vault Holdings', parent: 'DeFi Protocol Foundation', jurisdiction: '新加坡', assetType: 'DeFi协议', scale: '$3,500,000', establishedDate: '2024-05-10', status: 'active' },
  { id: 'SPV-004', name: 'ChainX Bridge Entity', parent: 'ChainX Technology Pte Ltd', jurisdiction: '瑞士', assetType: '跨链桥接', scale: '$8,200,000', establishedDate: '2024-06-01', status: 'pending' },
  { id: 'SPV-005', name: 'OracleNet Data SPV', parent: 'OracleNet Solutions AG', jurisdiction: '爱尔兰', assetType: '数据资产', scale: '$2,800,000', establishedDate: '2024-06-15', status: 'active' },
  { id: 'SPV-006', name: 'GameOn IP Holding', parent: 'GameOn Studios Ltd', jurisdiction: '马耳他', assetType: '知识产权', scale: '$1,500,000', establishedDate: '2024-06-20', status: 'reviewing' },
  { id: 'SPV-007', name: 'Yield Aggregator SPV', parent: 'Yield Protocol LLC', jurisdiction: '怀俄明州', assetType: '量化策略', scale: '$6,700,000', establishedDate: '2024-06-22', status: 'pending' },
  { id: 'SPV-008', name: 'PrivacyShield Trust', parent: 'PrivacyTech Inc.', jurisdiction: '巴拿马', assetType: '隐私技术', scale: '$4,100,000', establishedDate: '2024-06-23', status: 'draft' },
  { id: 'SPV-009', name: 'QuantEdge Alpha SPV', parent: 'QuantEdge Trading Ltd', jurisdiction: '开曼群岛', assetType: '交易资产', scale: '$15,000,000', establishedDate: '2024-06-18', status: 'active' },
  { id: 'SPV-010', name: 'SocialDAO Community SPV', parent: 'SocialDAO Association', jurisdiction: '列支敦士登', assetType: '社区治理', scale: '$900,000', establishedDate: '-', status: 'pending' },
];

const spvStatusConfig: Record<string, { color: string; label: string }> = {
  active: { color: 'green', label: '运营中' },
  pending: { color: 'orange', label: '设立中' },
  reviewing: { color: 'blue', label: '审批中' },
  draft: { color: 'default', label: '草稿' },
  dissolved: { color: 'red', label: '已解散' },
};

export default function EnterpriseSpvPage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: 'SPV名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '母公司',
      dataIndex: 'parent',
      key: 'parent',
    },
    {
      title: '注册地',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
      render: (text: string) => (
        <Space size={4}>
          <GlobalOutlined style={{ color: '#1677FF' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '资产类型',
      dataIndex: 'assetType',
      key: 'assetType',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '规模',
      dataIndex: 'scale',
      key: 'scale',
      render: (val: string) => <span className="font-semibold text-green-600">{val}</span>,
    },
    {
      title: '设立日期',
      dataIndex: 'establishedDate',
      key: 'establishedDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = spvStatusConfig[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
  ];

  const actionColumn = {
    title: '操作',
    key: 'action',
    width: 160,
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentRecord(record); setDetailOpen(true); }}>详情</Button>
        <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
      </Space>
    ),
  };

  const allColumns = [...columns, actionColumn];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="m-0 flex items-center gap-3">
              <ApartmentOutlined style={{ color: '#F0B90B' }} />
              SPV企业架构管理
            </Title>
            <Text type="secondary" className="mt-2 block">
              特殊目的载体(SPV)架构设计、设立与管理 · 资产隔离与税务优化
            </Text>
          </div>
          <Space>
            <Button icon={<ClusterOutlined />}>架构视图</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>新建SPV</Button>
          </Space>
        </div>

        {/* SPV架构图 Card - 文字版 */}
        <Card
          title={
            <Space>
              <DeploymentUnitOutlined style={{ color: '#1677FF' }} />
              <span>SPV组织架构总览</span>
            </Space>
          }
          className="mb-4"
          style={{ borderRadius: 12 }}
        >
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
            {/* 母公司层 */}
            <div className="text-center mb-6">
              <div className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl font-bold text-lg shadow-md">
                <BankOutlined className="mr-2" />
                中萨数字科技集团（控股母公司）
              </div>
            </div>

            {/* 连接线 */}
            <div className="flex justify-center mb-4">
              <div className="w-px h-8 bg-gray-300 mx-auto"></div>
            </div>

            {/* SPV子实体网格 */}
            <Row gutter={[16, 16]} justify="center">
              {mockSPVs.filter((s) => s.status === 'active').slice(0, 6).map((spv) => (
                <Col xs={24} sm={12} md={8} lg={4} key={spv.id}>
                  <Card
                    size="small"
                    hoverable
                    className="text-center"
                    style={{ borderRadius: 8, borderLeft: `3px solid ${spv.status === 'active' ? '#16A34A' : '#F59E0B'}` }}
                  >
                    <div className="font-semibold text-sm mb-1">{spv.name}</div>
                    <Tag>{spv.jurisdiction}</Tag>
                    <div className="text-xs text-gray-500 mt-1">{spv.assetType}</div>
                    <div className="text-xs font-bold text-green-600 mt-1">{spv.scale}</div>
                  </Card>
                </Col>
              ))}
            </Row>

            <div className="text-center mt-4">
              <Text type="secondary">共 {mockSPVs.length} 个SPV实体 · 运营中 {mockSPVs.filter((s) => s.status === 'active').length} 个</Text>
            </div>
          </div>
        </Card>

        {/* DataTable */}
        <Table
          columns={allColumns}
          dataSource={mockSPVs}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
          scroll={{ x: 'max-content' }}
          bordered
          size="middle"
        />

        {/* 详情 Modal */}
        <Modal
          title={`SPV详情 · ${currentRecord?.name || ''}`}
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
            <Button key="edit" icon={<EditOutlined />}>编辑信息</Button>,
          ]}
          width={650}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="SPV ID">{currentRecord.id}</Descriptions.Item>
                <Descriptions.Item label="SPV全称"><span className="font-semibold">{currentRecord.name}</span></Descriptions.Item>
                <Descriptions.Item label="母公司">{currentRecord.parent}</Descriptions.Item>
                <Descriptions.Item label="注册司法管辖区">
                  <Space><GlobalOutlined /><span>{currentRecord.jurisdiction}</span></Space>
                </Descriptions.Item>
                <Descriptions.Item label="资产类型"><Tag color="blue">{currentRecord.assetType}</Tag></Descriptions.Item>
                <Descriptions.Item label="资产规模"><span className="font-bold text-green-600">{currentRecord.scale}</span></Descriptions.Item>
                <Descriptions.Item label="设立日期"><CalendarOutlined /> {currentRecord.establishedDate}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={spvStatusConfig[currentRecord.status]?.color}>{spvStatusConfig[currentRecord.status]?.label}</Tag>
                </Descriptions.Item>
              </Descriptions>

              <div>
                <Text strong>设立时间线</Text>
                <Timeline
                  className="mt-3"
                  items={[
                    { children: '项目启动与需求确认', color: 'green' },
                    { children: '法律文件起草与审核', color: 'green' },
                    { children: '注册申请提交', color: currentRecord.status !== 'draft' ? 'green' : 'gray' },
                    ...(currentRecord.status === 'active' ? [{ children: `${currentRecord.establishedDate} 设立完成 ✓`, color: 'green' }] :
                      currentRecord.status === 'pending' ? [{ children: '注册审批中...', color: 'orange' }] :
                      [{ children: '待启动', color: 'gray' }]),
                  ]}
                />
              </div>

              <div>
                <Text strong>关联银行账户</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded text-sm space-y-1">
                  <div className="flex justify-between"><span>主账户(Corporate)</span><Text code>****4589</Text></div>
                  <div className="flex justify-between"><span>信托账户(Escrow)</span><Text code>---- 待开设</Text></div>
                  <div className="flex justify-between"><span>运营账户(Operation)</span><Text code>****7621</Text></div>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* 新建 SPV Modal */}
        <Modal
          title="新建SPV实体"
          open={createModalOpen}
          onOk={() => {
            form.validateFields().then(() => {
              message.success('SPV创建请求已提交！');
              setCreateModalOpen(false);
              form.resetFields();
            });
          }}
          onCancel={() => setCreateModalOpen(false)}
          width={600}
          okText="提交"
          cancelText="取消"
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item label="SPV名称" name="spvName" rules={[{ required: true, message: '请输入SPV名称' }]}>
              <Input placeholder="例如：ZS Digital SPV II" />
            </Form.Item>
            <Form.Item label="所属母公司" name="parentCompany" rules={[{ required: true, message: '请选择母公司' }]}>
              <Select placeholder="选择控股母公司">
                <Option value="ZS Digital">中萨数字科技集团</Option>
                <Option value="MetaVerse">MetaVerse Ventures Ltd.</Option>
                <Option value="DeFi Protocol">DeFi Protocol Foundation</Option>
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="注册地" name="jurisdiction" rules={[{ required: true, message: '请选择注册地' }]}>
                  <Select placeholder="选择司法管辖区">
                    <Option value="萨摩亚">萨摩亚</Option>
                    <Option value="BVI">英属维尔京群岛</Option>
                    <Option value="新加坡">新加坡</Option>
                    <Option value="瑞士">瑞士</Option>
                    <Option value="香港">中国香港</Option>
                    <Option value="开曼群岛">开曼群岛</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="资产类型" name="assetType" rules={[{ required: true, message: '请选择资产类型' }]}>
                  <Select placeholder="选择资产类型">
                    <Option value="数字资产">数字资产</Option>
                    <Option value="基金资产">基金资产</Option>
                    <Option value="知识产权">知识产权</Option>
                    <Option value="量化策略">量化策略</Option>
                    <Option value="交易资产">交易资产</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="预计资产规模(USD)" name="scale">
              <InputNumber placeholder="例如：5000000" style={{ width: '100%' }} min={0} step={100000} formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
