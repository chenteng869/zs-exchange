'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Tabs } from 'antd';
import { AuditOutlined, PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockPendingAudits = [
  { id: '1', title: '昆曲视频', type: '国学动漫', submitter: '张小明', submitTime: '2024-05-13 10:30:00', status: 'pending' },
  { id: '2', title: '红楼梦短剧', type: '真人短剧', submitter: '李小红', submitTime: '2024-05-13 09:15:00', status: 'pending' },
  { id: '3', title: '景泰蓝工艺', type: '非遗内容', submitter: '王小华', submitTime: '2024-05-12 16:45:00', status: 'pending' },
];

const mockAuditHistory = [
  { id: '1', title: '孔子的故事', type: '国学动漫', submitter: '赵小刚', auditor: '管理员', action: 'approved', auditTime: '2024-05-12 14:20:00' },
  { id: '2', title: '唐诗动画', type: '国学动漫', submitter: '钱小芳', auditor: '管理员', action: 'rejected', auditTime: '2024-05-12 11:30:00', reason: '内容不符合规范' },
  { id: '3', title: '苏绣展示', type: '非遗内容', submitter: '孙大壮', auditor: '管理员', action: 'approved', auditTime: '2024-05-11 16:10:00' },
];

const auditChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['已通过', '已驳回', '待审核'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['国学动漫', '真人短剧', '非遗内容'] },
  yAxis: { type: 'value', name: '数量' },
  series: [
    { type: 'bar', data: [25, 18, 12], itemStyle: { color: '#16A34A' }, name: '已通过' },
    { type: 'bar', data: [3, 2, 1], itemStyle: { color: '#DC2626' }, name: '已驳回' },
    { type: 'bar', data: [1, 1, 1], itemStyle: { color: '#F59E0B' }, name: '待审核' },
  ],
};

export default function ContentAuditPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('pending');

  const pendingColumns = [
    { title: '内容标题', dataIndex: 'title', key: 'title', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { 
      title: '内容类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const colors = { '国学动漫': 'blue', '真人短剧': 'green', '非遗内容': 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{type}</Tag>;
      },
    },
    { title: '提交人', dataIndex: 'submitter', key: 'submitter' },
    { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'warning'; label: string }> = {
          pending: { color: 'warning', label: '待审核' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#16A34A' }}>通过</Button>
          <Button type="link" size="small" icon={<CloseCircleOutlined />} danger onClick={() => handleReject(record)}>驳回</Button>
        </Space>
      ),
    },
  ];

  const historyColumns = [
    { title: '内容标题', dataIndex: 'title', key: 'title', render: (text: string) => <span className="font-semibold text-gray-600">{text}</span> },
    { 
      title: '内容类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const colors = { '国学动漫': 'blue', '真人短剧': 'green', '非遗内容': 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{type}</Tag>;
      },
    },
    { title: '提交人', dataIndex: 'submitter', key: 'submitter' },
    { title: '审核人', dataIndex: 'auditor', key: 'auditor' },
    { 
      title: '审核结果', 
      dataIndex: 'action', 
      key: 'action', 
      render: (action: string) => {
        const config: Record<string, { color: 'success' | 'error'; label: string }> = {
          approved: { color: 'success', label: '已通过' },
          rejected: { color: 'error', label: '已驳回' },
        };
        const c = config[action];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '审核时间', dataIndex: 'auditTime', key: 'auditTime' },
    { title: '驳回原因', dataIndex: 'reason', key: 'reason', render: (text: string) => text || '-' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
        </Space>
      ),
    },
  ];

  const handleView = (record: any) => {
    setSelectedAudit(record);
    setIsModalVisible(true);
  };

  const handleReject = (record: any) => {
    setSelectedAudit(record);
    setIsModalVisible(true);
  };

  const totalPending = mockPendingAudits.length;
  const totalApproved = mockAuditHistory.filter(h => h.action === 'approved').length;
  const totalRejected = mockAuditHistory.filter(h => h.action === 'rejected').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AuditOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">内容审核</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待审核" value={totalPending} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">待审核内容</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已通过" value={totalApproved} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">已通过审核</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已驳回" value={totalRejected} valueStyle={{ color: '#DC2626' }} />
              <div className="text-gray-400 text-sm mt-1">已驳回内容</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总审核" value={totalApproved + totalRejected} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计审核数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="审核统计">
              <SafeECharts option={auditChartOption} style={{ height: 250 }} title="审核统计" />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab={<span><ClockCircleOutlined />待审核列表</span>} key="pending">
              <Table
                dataSource={mockPendingAudits}
                columns={pendingColumns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </TabPane>
            <TabPane tab="审核历史" key="history">
              <Table
                dataSource={mockAuditHistory}
                columns={historyColumns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </TabPane>
          </Tabs>
        </Card>

        <Modal
          title={selectedAudit ? `审核详情 - ${selectedAudit.title}` : '审核详情'}
          open={isModalVisible}
          onOk={() => {
            Modal.success({ title: '操作成功', content: '审核操作已完成！' });
            setIsModalVisible(false);
            setSelectedAudit(null);
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedAudit(null);
          }}
          width={700}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="内容标题">
              <Input value={selectedAudit?.title} disabled />
            </Form.Item>
            <Form.Item label="内容类型">
              <Input value={selectedAudit?.type} disabled />
            </Form.Item>
            <Form.Item label="提交人">
              <Input value={selectedAudit?.submitter} disabled />
            </Form.Item>
            <Form.Item label="提交时间">
              <Input value={selectedAudit?.submitTime || selectedAudit?.auditTime} disabled />
            </Form.Item>
            {selectedAudit?.reason && (
              <Form.Item label="驳回原因">
                <Input value={selectedAudit?.reason} disabled />
              </Form.Item>
            )}
            {activeTab === 'pending' && (
              <Form.Item label="驳回原因" name="reason">
                <Input.TextArea rows={4} placeholder="请输入驳回原因（仅在驳回时必填）" />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}