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
  Select,
  DatePicker,
  message,
  Typography,
  Descriptions,
  Avatar,
} from 'antd';
import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  GlobalOutlined,
  TeamOutlined,
  FileProtectOutlined,
  FieldTimeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Option } = Select;
const { Title, Text } = Typography;

const mockEnterprises = [
  { id: 'ENT-001', name: '中萨数字科技集团', type: '控股公司', country: '萨摩亚', applyDate: '2024-06-01', status: 'approved', contact: '张总', email: 'zhang@zs-digital.com' },
  { id: 'ENT-002', name: 'MetaVerse Ventures Ltd.', type: '投资机构', country: 'BVI', applyDate: '2024-06-03', status: 'pending', contact: '李经理', email: 'li@metaverse.vc' },
  { id: 'ENT-003', name: 'DeFi Protocol Foundation', type: '基金会', country: '新加坡', applyDate: '2024-06-05', status: 'reviewing', contact: '王理事', email: 'wang@defi-fund.org' },
  { id: 'ENT-004', name: 'ChainX Technology Pte Ltd', type: '科技公司', country: '新加坡', applyDate: '2024-06-07', status: 'approved', contact: '陈CTO', email: 'chen@chainx.tech' },
  { id: 'ENT-005', name: 'NFT Finance Corp', type: '金融公司', country: '香港', applyDate: '2024-06-09', status: 'rejected', contact: '刘总监', email: 'liu@nftfi.finance' },
  { id: 'ENT-006', name: 'Web3 Hub Limited', type: '咨询公司', country: '迪拜', applyDate: '2024-06-11', status: 'pending', contact: '赵顾问', email: 'zhao@web3hub.ae' },
  { id: 'ENT-007', name: 'OracleNet Solutions AG', type: '技术公司', country: '瑞士', applyDate: '2024-06-13', status: 'approved', contact: '吴CEO', email: 'wu@oraclenet.ch' },
  { id: 'ENT-008', name: 'PrivacyTech Inc.', type: '隐私科技', country: '巴拿马', applyDate: '2024-06-15', status: 'reviewing', contact: '郑CPO', email: 'zheng@privacytech.io' },
  { id: 'ENT-009', name: 'Yield Protocol LLC', type: 'DeFi协议', country: '美国(怀俄明)', applyDate: '2024-06-17', status: 'pending', contact: '孙创始人', email: 'sun@yieldprotocol.llc' },
  { id: 'ENT-010', name: 'GameOn Studios Ltd', type: '游戏公司', country: '马耳他', applyDate: '2024-06-19', status: 'approved', contact: '周制作人', email: 'zhou@gameon.mt' },
  { id: 'ENT-011', name: 'SocialDAO Association', type: '协会组织', country: '瑞士', applyDate: '2024-06-21', status: 'pending', contact: '吴主席', email: 'wu@socialdao.ch' },
  { id: 'ENT-012', name: 'QuantEdge Trading Ltd', type: '量化交易', country: '英国', applyDate: '2024-06-22', status: 'reviewing', contact: '钱合伙人', email: 'qian@quantedge.uk' },
];

const entStatusConfig: Record<string, { color: string; label: string }> = {
  approved: { color: 'green', label: '已注册' },
  pending: { color: 'orange', label: '待审核' },
  reviewing: { color: 'blue', label: '审核中' },
  rejected: { color: 'red', label: '已拒绝' },
};

const typeOptions = [
  { value: '控股公司', label: '控股公司' },
  { value: '投资机构', label: '投资机构' },
  { value: '基金会', label: '基金会' },
  { value: '科技公司', label: '科技公司' },
  { value: '金融公司', label: '金融公司' },
  { value: '咨询公司', label: '咨询公司' },
  { value: 'DeFi协议', label: 'DeFi协议' },
  { value: '游戏公司', label: '游戏公司' },
  { value: '量化交易', label: '量化交易' },
];

const countryOptions = [
  { value: '萨摩亚', label: '萨摩亚' }, { value: 'BVI', label: '英属维尔京群岛(BVI)' },
  { value: '新加坡', label: '新加坡' }, { value: '香港', label: '中国香港' },
  { value: '迪拜', label: '阿联酋·迪拜' }, { value: '瑞士', label: '瑞士' },
  { value: '巴拿马', label: '巴拿马' }, { value: '美国(怀俄明)', label: '美国·怀俄明州' },
  { value: '马耳他', label: '马耳他' }, { value: '英国', label: '英国' },
];

export default function EnterpriseRegistrationPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const pendingCount = mockEnterprises.filter((e) => e.status === 'pending').length;
  const approvedCount = mockEnterprises.filter((e) => e.status === 'approved').length;
  const newThisMonth = 8;
  const approvalRate = '75.0%';
  const avgProcessDays = '4.5天';

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '企业类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '注册地',
      dataIndex: 'country',
      key: 'country',
      render: (text: string) => (
        <Space size={4}>
          <GlobalOutlined style={{ color: '#1677FF' }} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '申请日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = entStatusConfig[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: any) => {
        setCurrentRecord(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'approve',
      label: '通过',
      icon: <CheckCircleOutlined />,
      type: 'link' as const,
      hidden: (r: any) => r.status !== 'pending' && r.status !== 'reviewing',
      confirm: {
        title: '确认通过该企业注册？',
        onConfirm: (record: any) => message.success(`已批准 ${record.name}`),
      },
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <CloseCircleOutlined />,
      type: 'link' as const,
      danger: true,
      hidden: (r: any) => r.status !== 'pending' && r.status !== 'reviewing',
      confirm: {
        title: '确认拒绝该注册申请？',
        onConfirm: (record: any) => message.warning(`已拒绝 ${record.name}`),
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="m-0 flex items-center gap-3">
              <BankOutlined style={{ color: '#F0B90B' }} />
              企业注册服务中心
            </Title>
            <Text type="secondary" className="mt-2 block">
              全球客户境外公司注册申请审核与进度跟踪
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>新建申请</Button>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="待审核" value={pendingCount} icon={<ClockCircleOutlined />} color="#F59E0B" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="已注册" value={approvedCount} icon={<CheckCircleOutlined />} color="#16A34A" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="本月新增" value={newThisMonth} icon={<TeamOutlined />} color="#1677FF" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="通过率" value={approvalRate} icon={<FileProtectOutlined />} color="#F0B90B" />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard title="平均处理天数" value={avgProcessDays} icon={<FieldTimeOutlined />} color="#7C3AED" />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockEnterprises}
          title="企业注册列表"
          showSearch
          searchPlaceholder="搜索企业名称或联系人..."
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '待审核', value: 'pending' },
            { label: '审核中', value: 'reviewing' },
            { label: '已注册', value: 'approved' },
            { label: '已拒绝', value: 'rejected' },
          ]}
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 详情 Modal - Descriptions 展示注册信息 */}
        <Modal
          title={`注册详情 · ${currentRecord?.name || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="print" icon={<EditOutlined />}>打印证书</Button>,
            ...(currentRecord?.status === 'pending' || currentRecord?.status === 'reviewing' ? [
              <Button key="approve" type="primary" icon={<CheckCircleOutlined />}>审批通过</Button>,
            ] : []),
          ]}
          width={720}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="企业ID">{currentRecord.id}</Descriptions.Item>
                <Descriptions.Item label="企业全称"><span className="font-semibold">{currentRecord.name}</span></Descriptions.Item>
                <Descriptions.Item label="企业类型"><Tag>{currentRecord.type}</Tag></Descriptions.Item>
                <Descriptions.Item label="注册国家/地区"><Space><GlobalOutlined />{currentRecord.country}</Space></Descriptions.Item>
                <Descriptions.Item label="申请日期">{currentRecord.applyDate}</Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={entStatusConfig[currentRecord.status]?.color}>{entStatusConfig[currentRecord.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="联系人"><Space size={4}><Avatar size="small" icon={<UserOutlined />} /><span>{currentRecord.contact}</span></Space></Descriptions.Item>
                <Descriptions.Item label="联系邮箱"><Text copyable>{currentRecord.email}</Text></Descriptions.Item>
              </Descriptions>

              <div>
                <Text strong>企业资质文件</Text>
                <div className="mt-2 space-y-1">
                  {[
                    { name: '营业执照/注册证书', status: 'verified' },
                    { name: '法人身份证明(KYC)', status: 'verified' },
                    { name: '公司章程', status: 'verified' },
                    { name: '股东名册', status: 'pending' },
                    { name: '银行资信证明', status: 'pending' },
                  ].map((doc) => (
                    <div key={doc.name} className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
                      <Space>
                        {doc.status === 'verified' ? <CheckCircleOutlined style={{ color: '#16A34A' }} /> : <ClockCircleOutlined style={{ color: '#F59E0B' }} />}
                        <span>{doc.name}</span>
                      </Space>
                      <Tag color={doc.status === 'verified' ? 'green' : 'orange'}>{doc.status === 'verified' ? '已验证' : '待上传'}</Tag>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Text strong>审核流程记录</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span>{currentRecord.applyDate} 提交注册申请</span><Tag color="blue">已完成</Tag></div>
                  <div className="flex justify-between"><span>{currentRecord.applyDate.replace('06-', '06-')} 材料初审</span><Tag color="green">通过</Tag></div>
                  <div className="flex justify-between"><span>合规审查中...</span><Tag color="orange">进行中</Tag></div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
