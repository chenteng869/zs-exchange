'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Modal, Row, Col, Descriptions, Steps, Timeline, Space, Badge, Progress } from 'antd';
import {
  AuditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  CalendarOutlined,
  WarningOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface AuditRecord {
  id: string;
  auditId: string;
  licenseName: string;
  jurisdiction: string;
  type: string;
  auditor: string;
  startDate: string;
  endDate?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  findings: number;
  criticalFindings: number;
}

const mockAudits: AuditRecord[] = [
  {
    id: '1',
    auditId: 'AUD-2024-001',
    licenseName: '数字资产交易牌照',
    jurisdiction: '萨摩亚',
    type: '年度合规审计',
    auditor: '普华永道(PwC)',
    startDate: '2024-06-01',
    endDate: '2024-06-20',
    status: 'completed',
    progress: 100,
    findings: 3,
    criticalFindings: 0,
  },
  {
    id: '2',
    auditId: 'AUD-2024-002',
    licenseName: '证券交易牌照',
    jurisdiction: '中国香港',
    type: 'SFC专项检查',
    auditor: '德勤(Deloitte)',
    startDate: '2024-06-10',
    status: 'in-progress',
    progress: 65,
    findings: 1,
    criticalFindings: 0,
  },
  {
    id: '3',
    auditId: 'AUD-2024-003',
    licenseName: '支付服务牌照',
    jurisdiction: '新加坡',
    type: 'MAS合规审查',
    auditor: '安永(EY)',
    startDate: '2024-06-15',
    status: 'in-progress',
    progress: 35,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '4',
    auditId: 'AUD-2024-004',
    licenseName: 'VASP牌照',
    jurisdiction: '迪拜',
    type: 'VARA运营审计',
    auditor: '毕马威(KPMG)',
    startDate: '2024-07-01',
    status: 'planned',
    progress: 0,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '5',
    auditId: 'AUD-2024-005',
    licenseName: 'MSB牌照',
    jurisdiction: '美国',
    type: 'BSA/AML审计',
    auditor: '内部审计部',
    startDate: '2024-05-15',
    endDate: '2024-05-30',
    status: 'completed',
    progress: 100,
    findings: 2,
    criticalFindings: 1,
  },
  {
    id: '6',
    auditId: 'AUD-2024-006',
    licenseName: 'EMI牌照',
    jurisdiction: '英国',
    type: 'FCA监管报告',
    auditor: '德勤(Deloitte)',
    startDate: '2024-04-01',
    endDate: '2024-04-25',
    status: 'completed',
    progress: 100,
    findings: 1,
    criticalFindings: 0,
  },
  {
    id: '7',
    auditId: 'AUD-2024-007',
    licenseName: 'DPO牌照',
    jurisdiction: '澳大利亚',
    type: 'ASIC年度审计',
    auditor: '普华永道(PwC)',
    startDate: '2024-07-15',
    status: 'planned',
    progress: 0,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '8',
    auditId: 'AUD-2024-008',
    licenseName: '交易所牌照',
    jurisdiction: '爱沙尼亚',
    type: '续期前评估',
    auditor: '内部审计部',
    startDate: '2024-06-20',
    status: 'in-progress',
    progress: 20,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '9',
    auditId: 'AUD-2024-009',
    licenseName: '衍生品牌照',
    jurisdiction: '塞浦路斯',
    type: 'CySEC合规审计',
    auditor: '安永(EY)',
    startDate: '2024-08-01',
    status: 'planned',
    progress: 0,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '10',
    auditId: 'AUD-2024-010',
    licenseName: '信托牌照',
    jurisdiction: '美国·纽约州',
    type: 'NYDFS检查',
    auditor: '毕马威(KPMG)',
    startDate: '2024-05-01',
    endDate: '2024-05-20',
    status: 'completed',
    progress: 100,
    findings: 4,
    criticalFindings: 1,
  },
  {
    id: '11',
    auditId: 'AUD-2024-011',
    licenseName: '技术牌照',
    jurisdiction: '日本',
    type: 'FSA Japan预审',
    auditor: '德勤(Deloitte)',
    startDate: '2024-09-01',
    status: 'planned',
    progress: 0,
    findings: 0,
    criticalFindings: 0,
  },
  {
    id: '12',
    auditId: 'AUD-2024-012',
    licenseName: 'STO牌照',
    jurisdiction: '泰国',
    type: 'SEC恢复条件审计',
    auditor: '安永(EY)',
    startDate: '2024-06-25',
    status: 'in-progress',
    progress: 55,
    findings: 2,
    criticalFindings: 1,
  },
];

const getStatusConfig = (status: string) => {
  const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    planned: { color: 'default', text: '已计划', icon: <CalendarOutlined /> },
    'in-progress': { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> },
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '失败', icon: <WarningOutlined /> },
  };
  return map[status] || { color: 'default', text: status, icon: <AuditOutlined /> };
};

const getStepStatus = (status: string): 'wait' | 'process' | 'finish' | 'error' => {
  if (status === 'completed') return 'finish';
  if (status === 'in-progress') return 'process';
  if (status === 'failed') return 'error';
  return 'wait';
};

export default function LicenseAuditPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  const handleViewDetail = (record: AuditRecord) => {
    setSelectedAudit(record);
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
      key: 'report',
      label: '下载报告',
      icon: <FileTextOutlined />,
      type: 'link',
      onClick: (record: AuditRecord) =>
        console.log('下载报告:', record.auditId),
      hidden: (record: AuditRecord) => record.status !== 'completed',
    },
  ];

  const columns = [
    {
      title: '审计编号',
      dataIndex: 'auditId',
      key: 'auditId',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '牌照名称',
      dataIndex: 'licenseName',
      key: 'licenseName',
      width: 180,
      render: (text: string) => (
        <Space>
          <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '法域',
      dataIndex: 'jurisdiction',
      key: 'jurisdiction',
      width: 110,
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '审计类型',
      dataIndex: 'type',
      key: 'type',
      width: 150,
    },
    {
      title: '审计机构',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 160,
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 160,
      render: (progress: number, record: AuditRecord) => (
        <Progress
          percent={progress}
          size="small"
          strokeColor={
            record.status === 'completed' ? '#16A34A' :
            record.status === 'in-progress' ? '#1677FF' :
            record.status === 'failed' ? '#DC2626' : '#D1D5DB'
          }
          format={(p) => `${Number(p)}%`}
        />
      ),
    },
    {
      title: '发现项',
      dataIndex: 'findings',
      key: 'findings',
      width: 90,
      render: (val: number, record: AuditRecord) => (
        <Space>
          <Badge
            count={val}
            style={{
              backgroundColor: val > 0 ? '#F59E0B' : '#D1D5DB',
              marginRight: record.criticalFindings > 0 ? 4 : 0,
            }}
          />
          {record.criticalFindings > 0 && (
            <Badge
              count={record.criticalFindings}
              style={{ backgroundColor: '#DC2626' }}
            />
          )}
        </Space>
      ),
    },
  ];

  const completedCount = mockAudits.filter((a) => a.status === 'completed').length;
  const inProgressCount = mockAudits.filter((a) => a.status === 'in-progress').length;
  const totalFindings = mockAudits.reduce((sum, a) => sum + a.findings, 0);
  const criticalFindings = mockAudits.reduce((sum, a) => sum + a.criticalFindings, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          牌照审计跟踪
        </Title>
        <Text type="secondary">审计计划 · 进度追踪 · 发现管理</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="总审计数"
            value={mockAudits.length}
            icon={<AuditOutlined />}
            color="#F0B90B"
            suffix="次"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="已完成"
            value={completedCount}
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            suffix="次"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="进行中"
            value={inProgressCount}
            icon={<ClockCircleOutlined />}
            color="#1677FF"
            suffix="次"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="待处理发现"
            value={totalFindings}
            icon={<FileSearchOutlined />}
            color="#F59E0B"
            suffix={`项${criticalFindings > 0 ? ` (${criticalFindings}严重)` : ''}`}
          />
        </Col>
      </Row>

      {/* 审计流程概览 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Title level={4}>标准审计流程</Title>
        <Steps
          current={
            inProgressCount > 0 ? 2 :
            completedCount > 3 ? 3 : 1
          }
          items={[
            { title: '计划制定', description: '确定范围和时间表' },
            { title: '资料准备', description: '收集文件和证据' },
            { title: '现场审计', description: `${inProgressCount}项进行中` },
            { title: '报告出具', description: `${completedCount}项已完成` },
          ]}
          style={{ marginTop: 16, marginBottom: 8 }}
        />
      </Card>

      {/* 审计记录表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="审计记录"
          columns={columns}
          dataSource={mockAudits}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索审计编号或牌照..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '已计划', value: 'planned' },
            { label: '进行中', value: 'in-progress' },
            { label: '已完成', value: 'completed' },
            { label: '失败', value: 'failed' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 审计详情弹窗 */}
      <Modal
        title={`审计详情 - ${selectedAudit?.auditId || ''}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={750}
      >
        {selectedAudit && (
          <div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="审计编号">{selectedAudit.auditId}</Descriptions.Item>
              <Descriptions.Item label="牌照名称">{selectedAudit.licenseName}</Descriptions.Item>
              <Descriptions.Item label="所属法域">{selectedAudit.jurisdiction}</Descriptions.Item>
              <Descriptions.Item label="审计类型">{selectedAudit.type}</Descriptions.Item>
              <Descriptions.Item label="审计机构">{selectedAudit.auditor}</Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {(() => {
                  const config = getStatusConfig(selectedAudit.status);
                  return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="开始日期">{selectedAudit.startDate}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{selectedAudit.endDate || '--'}</Descriptions.Item>
            </Descriptions>

            {/* 审计流程步骤 */}
            <div className="mt-4">
              <Text strong>审计阶段</Text>
              <Steps
                direction="vertical"
                size="small"
                current={selectedAudit.status === 'completed' ? 3 :
                        selectedAudit.status === 'in-progress' ? Math.floor(selectedAudit.progress / 33) :
                        0}
                style={{ marginTop: 12 }}
                items={[
                  { title: '准备阶段', status: getStepStatus(selectedAudit.status), description: '资料收集与初步评估' },
                  { title: '现场审计', status: selectedAudit.progress >= 30 ? getStepStatus(selectedAudit.status) as any : 'wait', description: '实地检查与访谈' },
                  { title: '分析报告', status: selectedAudit.progress >= 70 ? getStepStatus(selectedAudit.status) as any : 'wait', description: '数据分析与发现整理' },
                  { title: '最终报告', status: getStepStatus(selectedAudit.status), description: '报告撰写与提交' },
                ]}
              />
            </div>

            {/* 发现项摘要 */}
            <div className="mt-4">
              <Text strong>发现项摘要</Text>
              <Row gutter={[16, 16]} className="mt-2">
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">总发现</Text>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#F59E0B' }}>
                      {selectedAudit.findings}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">严重问题</Text>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#DC2626' }}>
                      {selectedAudit.criticalFindings}
                    </div>
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" style={{ textAlign: 'center' }}>
                    <Text type="secondary">整改率</Text>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#16A34A' }}>
                      {selectedAudit.status === 'completed' ? '85%' : '--'}
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
