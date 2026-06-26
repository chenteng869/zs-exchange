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
  Table,
  message,
  Typography,
  Progress,
  Badge,
  Timeline,
  Descriptions,
  Alert,
} from 'antd';
import {
  SafetyCertificateOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  ReloadOutlined,
  TeamOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockComplianceRecords = [
  { id: 'ECM-001', enterprise: '中萨数字科技集团', reviewType: '年度合规审查', result: 'passed', score: 96, date: '2024-06-20', reportId: 'RPT-2024-06-001', riskItems: 0 },
  { id: 'ECM-002', enterprise: 'MetaVerse Ventures Ltd.', reviewType: 'KYC/AML审计', result: 'passed', score: 88, date: '2024-06-18', reportId: 'RPT-2024-06-002', riskItems: 1 },
  { id: 'ECM-003', enterprise: 'DeFi Protocol Foundation', reviewType: '数据保护审查', result: 'conditional', score: 72, date: '2024-06-15', reportId: 'RPT-2024-06-003', riskItems: 3 },
  { id: 'ECM-004', enterprise: 'ChainX Technology Pte Ltd', reviewType: '反洗钱评估', result: 'passed', score: 91, date: '2024-06-12', reportId: 'RPT-2024-06-004', riskItems: 0 },
  { id: 'ECM-005', enterprise: 'OracleNet Solutions AG', reviewType: '年度合规审查', result: 'passed', score: 94, date: '2024-06-10', reportId: 'RPT-2024-06-005', riskItems: 1 },
  { id: 'ECM-006', enterprise: 'NFT Finance Corp', reviewType: '牌照合规检查', result: 'failed', score: 45, date: '2024-06-08', reportId: 'RPT-2024-06-006', riskItems: 5 },
  { id: 'ECM-007', enterprise: 'Yield Protocol LLC', reviewType: 'SEC备案审查', result: 'reviewing', score: 0, date: '2024-06-22', reportId: '--', riskItems: 0 },
  { id: 'ECM-008', enterprise: 'QuantEdge Trading Ltd', reviewType: 'MiFID II合规', result: 'passed', score: 86, date: '2024-06-19', reportId: 'RPT-2024-06-008', riskItems: 2 },
  { id: 'ECM-009', enterprise: 'PrivacyTech Inc.', reviewType: 'GDPR合规审查', result: 'conditional', score: 68, date: '2024-06-16', reportId: 'RPT-2024-06-009', riskItems: 4 },
  { id: 'ECM-010', enterprise: 'GameOn Studios Ltd', reviewType: '游戏牌照审查', result: 'reviewing', score: 0, date: '2024-06-21', reportId: '--', riskItems: 0 },
];

const resultConfig: Record<string, { color: string; label: string; iconColor: string }> = {
  passed: { color: 'green', label: '通过', iconColor: '#16A34A' },
  conditional: { color: 'orange', label: '有条件通过', iconColor: '#F59E0B' },
  failed: { color: 'red', label: '未通过', iconColor: '#DC2626' },
  reviewing: { color: 'blue', label: '审查中', iconColor: '#1677FF' },
};

export default function EnterpriseCompliancePage() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const reviewingCount = mockComplianceRecords.filter((r) => r.result === 'reviewing').length;
  const passedCount = mockComplianceRecords.filter((r) => r.result === 'passed').length;
  const totalRiskItems = mockComplianceRecords.reduce((sum, r) => sum + r.riskItems, 0);
  const rectificationRate = '78.5%';

  const columns = [
    {
      title: '企业名称',
      dataIndex: 'enterprise',
      key: 'enterprise',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '审查类型',
      dataIndex: 'reviewType',
      key: 'reviewType',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '审查结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const config = resultConfig[result];
        if (!config) return <Tag>{result}</Tag>;
        return (
          <Badge
            status={config.color as 'success' | 'warning' | 'error' | 'processing'}
            text={<span style={{ color: config.iconColor }}>{config.label}</span>}
          />
        );
      },
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number, record: any) => {
        if (score === 0 && record.result === 'reviewing') {
          return <Progress percent={60} size="small" strokeColor="#1677FF" status="active" />;
        }
        let color = '#DC2626';
        if (score >= 85) color = '#16A34A';
        else if (score >= 65) color = '#F59E0B';
        return <Progress percent={score} size="small" strokeColor={color} format={() => `${score}分`} />;
      },
    },
    {
      title: '审查日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '报告编号',
      dataIndex: 'reportId',
      key: 'reportId',
      render: (id: string) => id === '--' ? <Text type="secondary">--</Text> : <Text code>{id}</Text>,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看报告',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: any) => {
        setCurrentRecord(record);
        setDetailOpen(true);
      },
    },
    {
      key: 'recheck',
      label: '重新审查',
      icon: <ReloadOutlined />,
      type: 'link' as const,
      hidden: (r: any) => r.result !== 'failed' && r.result !== 'conditional',
      onClick: (record: any) => message.info(`已触发 ${record.enterprise} 的重新审查`),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Title level={2} className="m-0 flex items-center gap-3">
            <SafetyCertificateOutlined style={{ color: '#F0B90B' }} />
            企业合规审查中心
          </Title>
          <Text type="secondary" className="mt-2 block">
            企业级合规审查全流程管理 · 多维度风险评估 · 整改追踪闭环
          </Text>
        </div>

        {/* DataCards - 4个 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="审查中" value={reviewingCount} icon={<ClockCircleOutlined />} color="#1677FF" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="已通过" value={passedCount} icon={<CheckCircleOutlined />} color="#16A34A" suffix={`/${mockComplianceRecords.length}`} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="风险项总数" value={totalRiskItems} icon={<WarningOutlined />} color="#F59E0B" suffix="项" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="整改完成率" value={rectificationRate} icon={<FileProtectOutlined />} color="#7C3AED" />
          </Col>
        </Row>

        {/* 风险预警横幅 */}
        {totalRiskItems > 0 && (
          <Alert
            message={`发现 ${totalRiskItems} 个风险项需要关注`}
            description={
              <Space wrap>
                {mockComplianceRecords.filter((r) => r.riskItems > 0).map((r) => (
                  <Tag key={r.id} color={r.result === 'failed' ? 'red' : 'orange'} icon={<ExclamationCircleOutlined />}>
                    {r.enterprise} ({r.riskItems}项)
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
          dataSource={mockComplianceRecords}
          title="企业合规审查列表"
          showSearch
          searchPlaceholder="搜索企业名称..."
          showFilter
          filterOptions={[
            { label: '全部', value: '' },
            { label: '通过', value: 'passed' },
            { label: '有条件通过', value: 'conditional' },
            { label: '未通过', value: 'failed' },
            { label: '审查中', value: 'reviewing' },
          ]}
          actions={actions}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (t) => `共 ${t} 条` }}
        />

        {/* 详情 Modal */}
        <Modal
          title={`合规审查报告 · ${currentRecord?.enterprise || ''}`}
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={[
            <Button key="download" icon={<FileSearchOutlined />}>下载报告</Button>,
            ...(currentRecord?.result === 'failed' || currentRecord?.result === 'conditional' ? [
              <Button key="rectify" type="primary" icon={<DashboardOutlined />}>发起整改</Button>,
            ] : []),
            <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
          ]}
          width={720}
        >
          {currentRecord && (
            <div className="mt-4 space-y-5">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="记录ID">{currentRecord.id}</Descriptions.Item>
                <Descriptions.Item label="企业名称"><span className="font-semibold">{currentRecord.enterprise}</span></Descriptions.Item>
                <Descriptions.Item label="审查类型"><Tag color="blue">{currentRecord.reviewType}</Tag></Descriptions.Item>
                <Descriptions.Item label="审查结果">
                  <Badge
                    status={resultConfig[currentRecord.result]?.color as 'success' | 'warning' | 'error' | 'processing'}
                    text={
                      <span style={{ color: resultConfig[currentRecord.result]?.iconColor }}>
                        {resultConfig[currentRecord.result]?.label}
                      </span>
                    }
                  />
                </Descriptions.Item>
                <Descriptions.Item label="综合评分">
                  {currentRecord.score > 0 ? (
                    <Progress percent={currentRecord.score} size="small" format={(p) => `${p}分`} style={{ width: 140 }} />
                  ) : <Text type="secondary">审查进行中...</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="审查日期">{currentRecord.date}</Descriptions.Item>
                <Descriptions.Item label="报告编号">
                  {currentRecord.reportId !== '--' ? <Text copyable>{currentRecord.reportId}</Text> : <Text type="secondary">--</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="发现风险项" span={2}>
                  <Tag color={currentRecord.riskItems === 0 ? 'green' : currentRecord.riskItems <= 2 ? 'orange' : 'red'}>
                    {currentRecord.riskItems === 0 ? '无风险项' : `${currentRecord.riskItems} 项需关注`}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {/* 审查维度明细 */}
              <div>
                <Text strong>审查维度得分</Text>
                <div className="mt-3 space-y-3">
                  {[
                    { dim: '法规合规性', score: Math.max(40, currentRecord.score + Math.floor(Math.random() * 15) - 5), max: 100 },
                    { dim: '内部控制有效性', score: Math.max(35, currentRecord.score + Math.floor(Math.random() * 20) - 8), max: 100 },
                    { dim: '风险管理能力', score: Math.max(30, currentRecord.score + Math.floor(Math.random() * 18) - 6), max: 100 },
                    { dim: '信息安全保障', score: Math.max(50, currentRecord.score + Math.floor(Math.random() * 12) - 3), max: 100 },
                    { dim: '财务透明度', score: Math.max(45, currentRecord.score + Math.floor(Math.random() * 14) - 4), max: 100 },
                  ].map((item) => {
                    const pct = Math.min(item.score, item.max);
                    const barColor = pct >= 80 ? '#16A34A' : pct >= 60 ? '#F59E0B' : '#DC2626';
                    return (
                      <div key={item.dim}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.dim}</span>
                          <span style={{ color: barColor }}>{pct}%</span>
                        </div>
                        <Progress percent={pct} size="small" strokeColor={barColor} showInfo={false} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 风险项详情 */}
              {currentRecord.riskItems > 0 && (
                <div>
                  <Text strong>风险项清单</Text>
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
                    {Array.from({ length: currentRecord.riskItems }).map((_, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <WarningOutlined style={{ color: '#DC2626', marginTop: 2 }} />
                        <div>
                          <span className="font-medium">风险 #{idx + 1}: </span>
                          <span>{
                            ['缺少有效的AML程序文档', '客户身份识别流程不完善', '交易监控系统存在漏洞', '员工培训记录不完整', '数据备份机制未达标'][idx % 5]
                          }</span>
                          <div className="ml-4 mt-1">
                            <Tag color="orange">中等优先级</Tag>
                            <Tag>待整改</Tag>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 审查时间线 */}
              <div>
                <Text strong>审查流程</Text>
                <Timeline
                  className="mt-3"
                  items={[
                    { children: `${currentRecord.date} 审查任务启动`, color: 'green' },
                    { children: '资料收集与初步分析', color: 'green' },
                    { children: '现场/远程访谈完成', color: 'green' },
                    { children: '报告编制中...', color: currentRecord.result === 'reviewing' ? 'blue' : 'green' },
                    ...(currentRecord.result !== 'reviewing' ? [{
                      children: `最终结论: ${resultConfig[currentRecord.result]?.label}`,
                      color: currentRecord.result === 'passed' ? 'green' : currentRecord.result === 'failed' ? 'red' : 'orange',
                    }] : []),
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
