'use client';

import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Modal,
  Typography,
  Progress,
  Alert,
  Badge,
  Timeline,
  Descriptions,
} from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  AuditOutlined,
  ThunderboltOutlined,
  ExclamationCircleOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockComplianceData = [
  { id: '1', token: 'AIOPC', tokenName: 'AIOPC Protocol', riskLevel: 'low', complianceScore: 95, lastCheck: '2024-06-20', status: 'compliant', checksPassed: 18, checksTotal: 19 },
  { id: '2', token: 'ZSDEX', tokenName: 'ZS Exchange Token', riskLevel: 'low', complianceScore: 92, lastCheck: '2024-06-19', status: 'compliant', checksPassed: 17, checksTotal: 19 },
  { id: '3', token: 'DEFI+', tokenName: 'DeFi Plus Protocol', riskLevel: 'medium', complianceScore: 78, lastCheck: '2024-06-18', status: 'warning', checksPassed: 15, checksTotal: 19 },
  { id: '4', token: 'META3', tokenName: 'MetaVerse 3.0', riskLevel: 'medium', complianceScore: 72, lastCheck: '2024-06-17', status: 'review', checksPassed: 14, checksTotal: 19 },
  { id: '5', token: 'CHAINX', tokenName: 'Chain X Network', riskLevel: 'low', complianceScore: 88, lastCheck: '2024-06-16', status: 'compliant', checksPassed: 17, checksTotal: 19 },
  { id: '6', token: 'NFTFI', tokenName: 'NFT Finance', riskLevel: 'high', complianceScore: 55, lastCheck: '2024-06-15', status: 'violation', checksPassed: 11, checksTotal: 19 },
  { id: '7', token: 'WEB3H', tokenName: 'Web3 Hub', riskLevel: 'low', complianceScore: 90, lastCheck: '2024-06-14', status: 'compliant', checksPassed: 17, checksTotal: 19 },
  { id: '8', token: 'ORACLE', tokenName: 'Oracle Data Chain', riskLevel: 'low', complianceScore: 94, lastCheck: '2024-06-13', status: 'compliant', checksPassed: 18, checksTotal: 19 },
  { id: '9', token: 'PRIVX', tokenName: 'Privacy Shield', riskLevel: 'medium', complianceScore: 76, lastCheck: '2024-06-12', status: 'warning', checksPassed: 14, checksTotal: 19 },
  { id: '10', token: 'YIELDA', tokenName: 'Yield Aggregator', riskLevel: 'medium', complianceScore: 80, lastCheck: '2024-06-11', status: 'warning', checksPassed: 15, checksTotal: 19 },
  { id: '11', token: 'GAMEON', tokenName: 'GameOn Platform', riskLevel: 'high', complianceScore: 48, lastCheck: '2024-06-10', status: 'violation', checksPassed: 9, checksTotal: 19 },
  { id: '12', token: 'SOCIAL', tokenName: 'SocialFi DAO', riskLevel: 'low', complianceScore: 86, lastCheck: '2024-06-09', status: 'compliant', checksPassed: 16, checksTotal: 19 },
];

const riskConfig: Record<string, { color: string; label: string; iconColor: string }> = {
  low: { color: 'green', label: '低风险', iconColor: '#16A34A' },
  medium: { color: 'orange', label: '中风险', iconColor: '#F59E0B' },
  high: { color: 'red', label: '高风险', iconColor: '#DC2626' },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  compliant: { color: 'green', label: '合规' },
  warning: { color: 'orange', label: '预警' },
  review: { color: 'blue', label: '审查中' },
  violation: { color: 'red', label: '违规' },
};

export default function TokenCompliancePage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const monitoredTokens = mockComplianceData.length;
  const avgScore = Math.round(mockComplianceData.reduce((s, d) => s + d.complianceScore, 0) / monitoredTokens);
  const warningsCount = mockComplianceData.filter((d) => d.status === 'warning' || d.status === 'violation').length;
  const reportCount = 156;
  const auditCoverage = '96.8%';

  const columns = [
    {
      title: '代币',
      dataIndex: 'token',
      key: 'token',
      render: (_: any, record: any) => (
        <Space>
          <Tag color="gold">{record.token}</Tag>
          <span className="text-sm text-gray-500">{record.tokenName}</span>
        </Space>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (level: string) => {
        const config = riskConfig[level];
        return (
          <Badge
            status={config?.color as 'success' | 'warning' | 'error'}
            text={<span style={{ color: config?.iconColor }}>{config?.label}</span>}
          />
        );
      },
    },
    {
      title: '合规分数',
      dataIndex: 'complianceScore',
      key: 'complianceScore',
      width: 140,
      render: (score: number) => {
        let color = '#DC2626';
        if (score >= 80) color = '#16A34A';
        else if (score >= 60) color = '#F59E0B';
        return <Progress percent={score} size="small" strokeColor={color} format={() => `${score}分`} />;
      },
    },
    {
      title: '最近检查',
      dataIndex: 'lastCheck',
      key: 'lastCheck',
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
      label: '详情报告',
      icon: <FileSearchOutlined />,
      type: 'link' as const,
      onClick: (record: any) => {
        setCurrentRecord(record);
        setDetailOpen(true);
      },
    },
    {
      key: 'scan',
      label: '重新扫描',
      icon: <DashboardOutlined />,
      type: 'link' as const,
      onClick: (record: any) => console.log('重新扫描:', record.token),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Title level={2} className="m-0 flex items-center gap-3">
            <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
            代币合规监控中心
          </Title>
          <Text type="secondary" className="mt-2 block">
            实时监控代币合规状态 · 自动化风险评估与预警通知
          </Text>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="监控代币数" value={monitoredTokens} icon={<SafetyCertificateOutlined />} color="#1677FF" suffix="个" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="平均合规评分" value={avgScore} icon={<AuditOutlined />} color="#F0B90B" suffix="分" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="风险预警数" value={warningsCount} icon={<WarningOutlined />} color="#F59E0B" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard title="监管报告数" value={reportCount} icon={<FileSearchOutlined />} color="#7C3AED" suffix="份" />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard title="审计覆盖率" value={auditCoverage} icon={<ThunderboltOutlined />} color="#16A34A" />
          </Col>
        </Row>

        {/* 风险预警横幅 */}
        {warningsCount > 0 && (
          <Alert
            message={`当前有 ${warningsCount} 个代币存在合规风险，请及时处理`}
            description={
              <Space wrap>
                {mockComplianceData.filter((d) => d.status === 'violation').map((d) => (
                  <Tag key={d.id} color="red" icon={<ExclamationCircleOutlined />}>
                    {d.token} ({d.complianceScore}分)
                  </Tag>
                ))}
                {mockComplianceData.filter((d) => d.status === 'warning').map((d) => (
                  <Tag key={d.id} color="orange" icon={<WarningOutlined />}>
                    {d.token} ({d.complianceScore}分)
                  </Tag>
                ))}
              </Space>
            }
            type="warning"
            showIcon
            closable
            className="mb-4"
          />
        )}

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockComplianceData}
          title="代币合规列表"
          showSearch
          searchPlaceholder="搜索代币..."
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '低风险', value: 'low' },
            { label: '中风险', value: 'medium' },
            { label: '高风险', value: 'high' },
          ]}
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 详情 Modal */}
        <Modal
          title={`合规详情 · ${currentRecord?.token || ''}`}
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={[
            <Button key="scan" icon={<DashboardOutlined />}>立即扫描</Button>,
            <Button key="export" type="primary" icon={<FileSearchOutlined />}>导出报告</Button>,
          ]}
          width={700}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="代币符号"><Tag color="gold">{currentRecord.token}</Tag></Descriptions.Item>
                <Descriptions.Item label="项目名称">{currentRecord.tokenName}</Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Badge status={riskConfig[currentRecord.riskLevel]?.color as 'success' | 'warning' | 'error'} text={riskConfig[currentRecord.riskLevel]?.label} />
                </Descriptions.Item>
                <Descriptions.Item label="合规分数">
                  <Progress percent={currentRecord.complianceScore} size="small" strokeColor={currentRecord.complianceScore >= 80 ? '#16A34A' : currentRecord.complianceScore >= 60 ? '#F59E0B' : '#DC2626'} format={(p) => `${p}分`} style={{ width: 150 }} />
                </Descriptions.Item>
                <Descriptions.Item label="检查通过率">
                  <Text>{currentRecord.checksPassed}/{currentRecord.checksTotal} 项</Text>
                </Descriptions.Item>
                <Descriptions.Item label="最近检查时间">{currentRecord.lastCheck}</Descriptions.Item>
                <Descriptions.Item label="合规状态">
                  <Tag color={statusConfig[currentRecord.status]?.color}>{statusConfig[currentRecord.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="下次计划检查">2024-{String(parseInt(currentRecord.lastCheck.split('-')[2]) + 7).padStart(2, '0')}-{currentRecord.lastCheck.split('-')[1]}</Descriptions.Item>
              </Descriptions>

              <div>
                <Text strong>合规检查明细</Text>
                <div className="mt-3 space-y-2">
                  {[
                    { name: 'KYC/AML 合规', pass: currentRecord.complianceScore > 50 },
                    { name: '智能合约安全审计', pass: currentRecord.complianceScore > 45 },
                    { name: '流动性证明', pass: currentRecord.complianceScore > 40 },
                    { name: '团队背景调查', pass: currentRecord.complianceScore > 35 },
                    { name: '白皮书真实性验证', pass: currentRecord.complianceScore > 30 },
                    { name: '交易量异常检测', pass: currentRecord.complianceScore > 25 },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <Space>
                        {item.pass ? <CheckCircleOutlined style={{ color: '#16A34A' }} /> : <CloseCircleOutlined style={{ color: '#DC2626' }} />}
                        <span>{item.name}</span>
                      </Space>
                      <Tag color={item.pass ? 'green' : 'red'}>{item.pass ? '通过' : '未通过'}</Tag>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Text strong>历史检查记录</Text>
                <Timeline
                  className="mt-3"
                  items={[
                    { children: `${currentRecord.lastCheck} 最近一次检查 · 得分${currentRecord.complianceScore}`, color: currentRecord.status === 'compliant' ? 'green' : currentRecord.status === 'violation' ? 'red' : 'orange' },
                    { children: '2024-05-20 定期检查 · 得分88', color: 'green' },
                    { children: '2024-04-20 定期检查 · 得分85', color: 'green' },
                    { children: '2024-03-20 初始评估 · 得分82', color: 'blue' },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
