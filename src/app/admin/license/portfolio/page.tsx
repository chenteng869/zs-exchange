'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Row, Col, Descriptions, Progress, Space, Tooltip } from 'antd';
import {
  IdcardOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  DollarOutlined,
  AlertOutlined,
  EyeOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  FileProtectOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface LicenseRecord {
  id: string;
  name: string;
  issuer: string;
  jurisdiction: string;
  type: string;
  validFrom: string;
  validTo: string;
  status: 'active' | 'expiring' | 'expired' | 'pending' | 'suspended';
  annualFee: number;
}

const mockLicenses: LicenseRecord[] = [
  {
    id: '1',
    name: '数字资产交易牌照',
    issuer: '萨摩亚金融服务管理局(FSA)',
    jurisdiction: '萨摩亚',
    type: '交易所牌照',
    validFrom: '2023-01-15',
    validTo: '2026-01-14',
    status: 'active',
    annualFee: 85000,
  },
  {
    id: '2',
    name: '证券交易牌照',
    issuer: '香港证券及期货事务监察委员会(SFC)',
    jurisdiction: '中国香港',
    type: '证券牌照',
    validFrom: '2023-06-01',
    validTo: '2025-05-31',
    status: 'active',
    annualFee: 250000,
  },
  {
    id: '3',
    name: '支付服务牌照',
    issuer: '新加坡金融管理局(MAS)',
    jurisdiction: '新加坡',
    type: '支付牌照',
    validFrom: '2023-03-20',
    validTo: '2025-03-19',
    status: 'expiring',
    annualFee: 120000,
  },
  {
    id: '4',
    name: '虚拟资产服务提供商VASP',
    issuer: '迪拜虚拟资产监管局(VARA)',
    jurisdiction: '阿联酋·迪拜',
    type: 'VASP牌照',
    validFrom: '2023-09-01',
    validTo: '2026-08-31',
    status: 'active',
    annualFee: 180000,
  },
  {
    id: '5',
    name: '加密货币交易许可证',
    issuer: '美国金融犯罪执法网络(FinCEN)',
    jurisdiction: '美国',
    type: 'MSB牌照',
    validFrom: '2022-11-15',
    validTo: '2025-11-14',
    status: 'active',
    annualFee: 45000,
  },
  {
    id: '6',
    name: '电子货币机构EMI牌照',
    issuer: '英国金融行为监管局(FCA)',
    jurisdiction: '英国',
    type: '电子货币牌照',
    validFrom: '2023-04-10',
    validTo: '2025-04-09',
    status: 'active',
    annualFee: 200000,
  },
  {
    id: '7',
    name: '数字支付运营商DPO',
    issuer: '澳大利亚证券投资委员会(ASIC)',
    jurisdiction: '澳大利亚',
    type: '支付牌照',
    validFrom: '2023-07-15',
    validTo: '2025-07-14',
    status: 'active',
    annualFee: 95000,
  },
  {
    id: '8',
    name: '虚拟货币交易所牌照',
    issuer: '爱沙尼亚金融监督管理局(FI)',
    jurisdiction: '爱沙尼亚',
    type: '交易所牌照',
    validFrom: '2022-08-01',
    validTo: '2025-07-31',
    status: 'expiring',
    annualFee: 35000,
  },
  {
    id: '9',
    name: '金融衍生品交易牌照',
    issuer: '塞浦路斯证券交易委员会(CySEC)',
    jurisdiction: '塞浦路斯',
    type: '衍生品牌照',
    validFrom: '2023-02-28',
    validTo: '2026-02-27',
    status: 'active',
    annualFee: 150000,
  },
  {
    id: '10',
    name: '区块链技术服务许可',
    issuer: '日本金融厅(FSA Japan)',
    jurisdiction: '日本',
    type: '技术牌照',
    validFrom: '2023-12-01',
    validTo: '2025-11-30',
    status: 'pending',
    annualFee: 280000,
  },
  {
    id: '11',
    name: '数字资产托管牌照',
    issuer: '纽约州金融服务部(NYDFS)',
    jurisdiction: '美国·纽约州',
    type: '信托牌照',
    validFrom: '2023-05-15',
    validTo: '2025-05-14',
    status: 'active',
    annualFee: 320000,
  },
  {
    id: '12',
    name: 'STO交易平台牌照',
    issuer: '泰国证券交易委员会(SEC)',
    jurisdiction: '泰国',
    type: 'STO牌照',
    validFrom: '2023-10-01',
    validTo: '2025-09-30',
    status: 'suspended',
    annualFee: 65000,
  },
];

const getStatusConfig = (status: string) => {
  const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    active: { color: 'success', text: '有效', icon: <CheckCircleOutlined /> },
    expiring: { color: 'warning', text: '即将到期', icon: <AlertOutlined /> },
    expired: { color: 'error', text: '已过期', icon: <AlertOutlined /> },
    pending: { color: 'processing', text: '申请中', icon: <ThunderboltOutlined /> },
    suspended: { color: 'default', text: '暂停', icon: <AlertOutlined /> },
  };
  return map[status] || { color: 'default', text: status, icon: <IdcardOutlined /> };
};

const getJurisdictionColor = (jurisdiction: string) => {
  const colors: Record<string, string> = {
    '萨摩亚': '#F0B90B',
    '中国香港': '#DC2626',
    '新加坡': '#1677FF',
    '阿联酋·迪拜': '#16A34A',
    '美国': '#7C3AED',
    '英国': '#0891B2',
    '澳大利亚': '#EC4899',
    '爱沙尼亚': '#F59E0B',
    '塞浦路斯': '#6366F1',
    '日本': '#EF4444',
    '美国·纽约州': '#8B5CF6',
    '泰国': '#14B8A6',
  };
  return colors[jurisdiction] || '#6B7280';
};

export default function LicensePortfolioPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);

  const handleViewDetail = (record: LicenseRecord) => {
    setSelectedLicense(record);
    setDetailModalOpen(true);
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
      hidden: () => false,
    },
    {
      key: 'edit',
      label: '编辑信息',
      icon: <EditOutlined />,
      type: 'link',
      onClick: (record: LicenseRecord) =>
        console.log('编辑牌照:', record.name),
      hidden: () => false,
    },
  ];

  const columns = [
    {
      title: '牌照名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '颁发机构',
      dataIndex: 'issuer',
      key: 'issuer',
      width: 260,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text type="secondary">{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '法域',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
      width: 120,
      render: (text: string) => (
        <Tag
          color={getJurisdictionColor(text)}
          style={{ fontWeight: 500 }}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '有效期至',
      dataIndex: 'validTo',
      key: 'validTo',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '年费(USD)',
      dataIndex: 'annualFee',
      key: 'annualFee',
      width: 120,
      sorter: (a: LicenseRecord, b: LicenseRecord) => a.annualFee - b.annualFee,
      render: (val: number) => (
        <Text strong style={{ color: '#16A34A' }}>
          ${val.toLocaleString()}
        </Text>
      ),
    },
  ];

  const activeCount = mockLicenses.filter((l) => l.status === 'active').length;
  const expiringCount = mockLicenses.filter((l) => l.status === 'expiring').length;
  const totalAnnualFee = mockLicenses.reduce((sum, l) => sum + l.annualFee, 0);
  const jurisdictions = new Set(mockLicenses.map((l) => l.jurisdiction)).size;

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          全球牌照组合管理
        </Title>
        <Text type="secondary">多法域覆盖 · 合规运营 · 牌照全生命周期管理</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="牌照总数"
            value={mockLicenses.length}
            icon={<IdcardOutlined />}
            color="#F0B90B"
            suffix="张"
            trend="up"
            trendValue="+2张"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="活跃牌照"
            value={activeCount}
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            suffix="张"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="覆盖法域"
            value={jurisdictions}
            icon={<GlobalOutlined />}
            color="#1677FF"
            suffix="个地区"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="年费总额(USD)"
            value={`${(totalAnnualFee / 10000).toFixed(0)}万`}
            icon={<DollarOutlined />}
            color="#7C3AED"
            prefix="$"
          />
        </Col>
      </Row>

      {/* 续期预警 */}
      {expiringCount > 0 && (
        <Card
          style={{
            borderRadius: 12,
            background: '#FFF7E6',
            border: '1px solid #FFD591',
          }}
          size="small"
        >
          <Space>
            <AlertOutlined style={{ color: '#FA8C16', fontSize: 18 }} />
            <div>
              <Text strong style={{ color: '#D46B08' }}>
                续期预警：有 {expiringCount} 张牌照将在90天内到期，请及时处理续期事宜。
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: 13 }}>
                包括：{mockLicenses.filter((l) => l.status === 'expiring').map((l) => l.name).join('、')}
              </Text>
            </div>
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <DataCard
            title="续期预警"
            value={expiringCount}
            icon={<AlertOutlined />}
            color="#F59E0B"
            suffix="张"
            description="90天内到期"
          />
        </Col>
      </Row>

      {/* 牌照列表表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="牌照列表"
          columns={columns}
          dataSource={mockLicenses}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索牌照名称或法域..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '有效', value: 'active' },
            { label: '即将到期', value: 'expiring' },
            { label: '申请中', value: 'pending' },
            { label: '暂停', value: 'suspended' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 张牌照`,
          }}
        />
      </Card>

      {/* 牌照详情弹窗 */}
      <Modal
        title={`牌照详情 - ${selectedLicense?.name || ''}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedLicense && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="牌照名称" span={2}>{selectedLicense.name}</Descriptions.Item>
              <Descriptions.Item label="颁发机构" span={2}>{selectedLicense.issuer}</Descriptions.Item>
              <Descriptions.Item label="所属法域">
                <Tag color={getJurisdictionColor(selectedLicense.jurisdiction)}>
                  {selectedLicense.jurisdiction}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="牌照类型">
                <Tag color="blue">{selectedLicense.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="生效日期">{selectedLicense.validFrom}</Descriptions.Item>
              <Descriptions.Item label="有效期至">{selectedLicense.validTo}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {(() => {
                  const config = getStatusConfig(selectedLicense.status);
                  return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="年度费用">
                <Text strong style={{ color: '#16A34A' }}>${selectedLicense.annualFee.toLocaleString()}</Text>
              </Descriptions.Item>
            </Descriptions>

            <div className="mt-4">
              <Text strong>剩余有效期</Text>
              <Progress
                percent={75}
                strokeColor="#F0B90B"
                format={() => '约18个月'}
                className="mt-2"
              />
            </div>

            <div className="mt-4">
              <Text strong>合规要求</Text>
              <Card size="small" style={{ marginTop: 8, background: '#F9FAFB' }}>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>季度合规报告提交</li>
                  <li>资本充足率维持要求</li>
                  <li>客户资金隔离存放</li>
                  <li>反洗钱(AML)流程审计</li>
                  <li>了解你的客户(KYC)标准执行</li>
                </ul>
              </Card>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
