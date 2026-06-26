'use client';

import React from 'react';
import { Card, Typography, Tag, Row, Col, Progress, Space, Badge } from 'antd';
import {
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface Jurisdiction {
  id: string;
  name: string;
  region: string;
  status: 'compliant' | 'partial' | 'non-compliant' | 'pending';
  complianceScore: number;
  licenseCount: number;
  lastAudit: string;
  nextReview: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface RegulationRecord {
  id: string;
  jurisdiction: string;
  regulationName: string;
  category: string;
  requirement: string;
  deadline: string;
  status: 'compliant' | 'in-progress' | 'overdue' | 'not-applicable';
  owner: string;
}

const mockJurisdictions: Jurisdiction[] = [
  {
    id: '1',
    name: '萨摩亚',
    region: '大洋洲',
    status: 'compliant',
    complianceScore: 95,
    licenseCount: 2,
    lastAudit: '2024-03-15',
    nextReview: '2024-09-15',
    riskLevel: 'low',
  },
  {
    id: '2',
    name: '中国香港',
    region: '亚洲',
    status: 'compliant',
    complianceScore: 98,
    licenseCount: 1,
    lastAudit: '2024-04-01',
    nextReview: '2024-10-01',
    riskLevel: 'low',
  },
  {
    id: '3',
    name: '新加坡',
    region: '亚洲',
    status: 'partial',
    complianceScore: 78,
    licenseCount: 1,
    lastAudit: '2024-02-20',
    nextReview: '2024-08-20',
    riskLevel: 'medium',
  },
  {
    id: '4',
    name: '阿联酋·迪拜',
    region: '中东',
    status: 'compliant',
    complianceScore: 92,
    licenseCount: 1,
    lastAudit: '2024-05-10',
    nextReview: '2024-11-10',
    riskLevel: 'low',
  },
  {
    id: '5',
    name: '美国',
    region: '北美洲',
    status: 'compliant',
    complianceScore: 88,
    licenseCount: 2,
    lastAudit: '2024-01-30',
    nextReview: '2024-07-30',
    riskLevel: 'low',
  },
  {
    id: '6',
    name: '英国',
    region: '欧洲',
    status: 'compliant',
    complianceScore: 94,
    licenseCount: 1,
    lastAudit: '2024-04-10',
    nextReview: '2024-10-10',
    riskLevel: 'low',
  },
];

const mockRegulations: RegulationRecord[] = [
  {
    id: '1',
    jurisdiction: '中国香港',
    regulationName: 'SFC反洗钱指引',
    category: 'AML/CTF',
    requirement: '建立完善的客户身份识别(CDD)和交易监控系统',
    deadline: '2024-06-30',
    status: 'compliant',
    owner: '合规部-张伟',
  },
  {
    id: '2',
    jurisdiction: '新加坡',
    regulationName: 'MAS支付服务法PSA',
    category: '资金安全',
    requirement: '维持最低资本金要求 SGD50万',
    deadline: '2024-07-15',
    status: 'in-progress',
    owner: '财务部-李娜',
  },
  {
    id: '3',
    jurisdiction: '美国',
    regulationName: 'FinCEN BSA规则',
    category: 'AML/CTF',
    requirement: '提交年度可疑活动报告(SAR)',
    deadline: '2024-06-30',
    status: 'compliant',
    owner: '风控部-王强',
  },
  {
    id: '4',
    jurisdiction: '英国',
    regulationName: 'FCA SYSC规则',
    category: '运营管理',
    requirement: '实施有效的管理和控制安排',
    deadline: '2024-08-31',
    status: 'in-progress',
    owner: '运营部-刘芳',
  },
  {
    id: '5',
    jurisdiction: '萨摩亚',
    regulationName: 'FSA数字资产监管框架',
    category: '牌照合规',
    requirement: '完成年度合规报告提交',
    deadline: '2024-07-01',
    status: 'compliant',
    owner: '合规部-陈明',
  },
  {
    id: '6',
    jurisdiction: '迪拜',
    regulationName: 'VARA虚拟资产规则书',
    category: '市场行为',
    requirement: '实施市场操纵监测系统',
    deadline: '2024-09-30',
    status: 'in-progress',
    owner: '技术部-杨丽',
  },
  {
    id: '7',
    jurisdiction: '新加坡',
    regulationName: 'PDPA数据保护法',
    category: '数据隐私',
    requirement: '制定个人数据保护政策(DPP)',
    deadline: '2024-05-31',
    status: 'overdue',
    owner: '法务部-赵刚',
  },
  {
    id: '8',
    jurisdiction: '澳大利亚',
    regulationName: 'ASIC Corporations Act',
    category: '公司治理',
    requirement: '任命合规官并报备ASIC',
    deadline: '2024-08-15',
    status: 'in-progress',
    owner: '人事部-孙静',
  },
  {
    id: '9',
    jurisdiction: '日本',
    regulationName: 'FSA Japan资金决算法',
    category: '资金安全',
    requirement: '完成信托银行账户开设及资金托管协议',
    deadline: '2025-03-31',
    status: 'in-progress',
    owner: '财务部-吴敏',
  },
  {
    id: '10',
    jurisdiction: '欧盟',
    regulationName: 'MiCA法规',
    category: '综合合规',
    requirement: '满足MiCA对CASPs的全面要求',
    deadline: '2024-12-30',
    status: 'in-progress',
    owner: '合规部-郑华',
  },
];

const getJurStatusConfig = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    compliant: { color: 'success', text: '完全合规' },
    partial: { color: 'warning', text: '部分合规' },
    'non-compliant': { color: 'error', text: '不合规' },
    pending: { color: 'processing', text: '待评估' },
  };
  return map[status] || { color: 'default', text: status };
};

const getRiskColor = (level: string) => {
  const map: Record<string, string> = {
    low: '#16A34A',
    medium: '#F59E0B',
    high: '#DC2626',
  };
  return map[level] || '#6B7280';
};

const getRegStatusTag = (status: string) => {
  const map: Record<string, { color: string; text: string }> = {
    compliant: { color: 'success', text: '已达标' },
    'in-progress': { color: 'processing', text: '进行中' },
    overdue: { color: 'error', text: '已逾期' },
    'not-applicable': { color: 'default', text: '不适用' },
  };
  const item = map[status] || { color: 'default', text: status };
  return <Tag color={item.color}>{item.text}</Tag>;
};

export default function LicenseJurisdictionsPage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <FileTextOutlined />,
      type: 'link',
      onClick: (record: RegulationRecord) =>
        console.log('查看法规:', record.regulationName),
      hidden: () => false,
    },
  ];

  const columns = [
    {
      title: '法域',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
      width: 120,
      render: (text: string) => (
        <Space>
          <EnvironmentOutlined style={{ color: '#1677FF' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '法规名称',
      dataIndex: 'regulationName',
      key: 'regulationName',
      width: 220,
      render: (text: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '核心要求',
      dataIndex: 'requirement',
      key: 'requirement',
      width: 280,
      ellipsis: true,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getRegStatusTag(status),
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 130,
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          多法域适配中心
        </Title>
        <Text type="secondary">全球合规 · 法规追踪 · 差异化管理</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="覆盖法域"
            value={mockJurisdictions.length}
            icon={<GlobalOutlined />}
            color="#F0B90B"
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="完全合规"
            value={mockJurisdictions.filter((j) => j.status === 'compliant').length}
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            suffix="个"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="待改进项"
            value={mockRegulations.filter((r) => r.status === 'in-progress').length}
            icon={<ClockCircleOutlined />}
            color="#1677FF"
            suffix="项"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="逾期项目"
            value={mockRegulations.filter((r) => r.status === 'overdue').length}
            icon={<WarningOutlined />}
            color="#DC2626"
            suffix="项"
          />
        </Col>
      </Row>

      {/* 法域状态卡片 */}
      <div className="mt-6">
        <Title level={4}>法域合规状态</Title>
        <Row gutter={[16, 16]}>
          {mockJurisdictions.map((jur) => (
            <Col xs={24} sm={12} lg={8} key={jur.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  height: '100%',
                  borderLeft: `4px solid ${getRiskColor(jur.riskLevel)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>{jur.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>{jur.region}</Text>
                  </div>
                  <Badge
                    count={jur.licenseCount}
                    style={{ backgroundColor: '#F0B90B' }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text type="secondary">合规评分</Text>
                    <Text strong>{jur.complianceScore}/100</Text>
                  </div>
                  <Progress
                    percent={jur.complianceScore}
                    strokeColor={
                      jur.complianceScore >= 90 ? '#16A34A' :
                      jur.complianceScore >= 70 ? '#F59E0B' : '#DC2626'
                    }
                    size="small"
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color={getJurStatusConfig(jur.status).color}>
                    {getJurStatusConfig(jur.status).text}
                  </Tag>
                  <Tag color={getRiskColor(jur.riskLevel)}>
                    风险{jur.riskLevel === 'low' ? '低' : jur.riskLevel === 'medium' ? '中' : '高'}
                  </Tag>
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                  <Space size={16}>
                    <span>
                      <ClockCircleOutlined style={{ color: '#6B7280', marginRight: 4 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>下次审查: {jur.nextReview.slice(5)}</Text>
                    </span>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 法规要求表格 */}
      <Card bordered={false} style={{ borderRadius: 12, marginTop: 24 }}>
        <DataTable
          title="法规要求跟踪"
          columns={columns}
          dataSource={mockRegulations}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索法规或法域..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '已达标', value: 'compliant' },
            { label: '进行中', value: 'in-progress' },
            { label: '已逾期', value: 'overdue' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条法规`,
          }}
        />
      </Card>
    </div>
  );
}
