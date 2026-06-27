'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Tabs, Image } from 'antd';
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const kycTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['申请', '通过', '拒绝'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-08', '05-09', '05-10', '05-11', '05-12', '05-13'] },
  yAxis: { type: 'value' },
  series: [
    { name: '申请', type: 'line', data: [15, 22, 18, 25, 20, 12], itemStyle: { color: '#1677FF' } },
    { name: '通过', type: 'line', data: [12, 18, 15, 20, 16, 8], itemStyle: { color: '#16A34A' } },
    { name: '拒绝', type: 'line', data: [3, 4, 3, 5, 4, 2], itemStyle: { color: '#DC2626' } },
  ],
};

const statusConfig = {
  pending: { color: 'warning', label: '待审核', icon: <ClockCircleOutlined /> },
  approved: { color: 'success', label: '已通过', icon: <CheckCircleOutlined /> },
  rejected: { color: 'error', label: '已拒绝', icon: <CloseCircleOutlined /> },
};

export default function KYCAdminPage() {
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/kyc?pageSize=50', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setKycRequests(d?.data?.items ?? []))
      .catch(() => setKycRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = kycRequests.filter(r => r.status === 'pending').length;
  const approvedCount = kycRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = kycRequests.filter(r => r.status === 'rejected').length;
  const totalCount = kycRequests.length;

  const filteredRequests = activeTab === 'all'
    ? kycRequests
    : kycRequests.filter(r => r.status === activeTab);

  const columns = [
    { title: '申请ID', dataIndex: 'id', key: 'id', width: 80, render: (v: string) => v.slice(0, 8) + '...' },
    { title: '用户ID', dataIndex: 'userId', key: 'userId', render: (text: string) => <span className="font-mono text-gray-700">{text.slice(0, 12)}...</span> },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '证件类型', dataIndex: 'idType', key: 'idType', render: (t: string) => <Tag color="blue">{t}</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        const color = config?.color as 'success' | 'warning' | 'error' | 'default' | 'processing';
        return <Badge status={color} text={config?.label} />;
      },
    },
    { title: '提交时间', dataIndex: 'createdAt', key: 'createdAt', render: (v: string) => v?.slice(0, 19).replace('T', ' ') },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {record.status === 'pending' && (
            <>
              <Button type="primary" size="small" onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger onClick={() => handleReject(record)}>拒绝</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (record: any) => {
    setSelectedRequest(record);
    setIsViewModalVisible(true);
  };

  const handleApprove = (record: any) => {
    Modal.confirm({
      title: '确认通过KYC申请',
      content: `确认通过用户 ${record.name} 的KYC申请？`,
      onOk: async () => {
        await fetch('/api/admin/kyc', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: record.id, action: 'approve' }),
        });
        setKycRequests((prev) => prev.map((r) => r.id === record.id ? { ...r, status: 'approved' } : r));
        Modal.success({ title: '操作成功', content: 'KYC申请已通过！' });
      },
    });
  };

  const handleReject = (record: any) => {
    let rejectReason = '';
    Modal.confirm({
      title: '拒绝KYC申请',
      content: (
        <Form layout="vertical">
          <Form.Item label="拒绝原因" name="reason" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入拒绝原因..." onChange={(e) => { rejectReason = e.target.value; }} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        await fetch('/api/admin/kyc', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: record.id, action: 'reject', reviewNotes: rejectReason }),
        });
        setKycRequests((prev) => prev.map((r) => r.id === record.id ? { ...r, status: 'rejected' } : r));
        Modal.success({ title: '操作成功', content: 'KYC申请已拒绝！' });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IdcardOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">KYC审核</h1>
          </div>
          <Space>
            <Button icon={<SearchOutlined />}>搜索</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="待审核" value={pendingCount} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">需要处理的申请</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已通过" value={approvedCount} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">已审核通过</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已拒绝" value={rejectedCount} valueStyle={{ color: '#DC2626' }} />
              <div className="text-gray-400 text-sm mt-1">已拒绝的申请</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总数" value={totalCount} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计申请数</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="KYC申请趋势">
              <SafeECharts option={kycTrendOption} style={{ height: 250 }} title="KYC申请趋势" />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="全部" key="all" />
            <TabPane tab="待审核" key="pending" />
            <TabPane tab="已通过" key="approved" />
            <TabPane tab="已拒绝" key="rejected" />
          </Tabs>
          <Table
            dataSource={filteredRequests}
            loading={loading}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
            style={{ marginTop: 16 }}
          />
        </Card>

        <Modal
          title="KYC申请详情"
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={
            selectedRequest?.status === 'pending' ? (
              <Space>
                <Button onClick={() => setIsViewModalVisible(false)}>关闭</Button>
                <Button type="primary" onClick={() => { handleApprove(selectedRequest); setIsViewModalVisible(false); }}>通过</Button>
                <Button danger onClick={() => { handleReject(selectedRequest); setIsViewModalVisible(false); }}>拒绝</Button>
              </Space>
            ) : (
              <Button onClick={() => setIsViewModalVisible(false)}>关闭</Button>
            )
          }
          width={800}
        >
          {selectedRequest && (
            <div className="space-y-4">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">用户名</div>
                  <div className="font-semibold">{selectedRequest.username}</div>
                </Col>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">钱包地址</div>
                  <div className="font-mono">{selectedRequest.user}</div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">真实姓名/企业名称</div>
                  <div className="font-semibold">{selectedRequest.realName}</div>
                </Col>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">认证类型</div>
                  <Tag color={selectedRequest.type === 'individual' ? 'blue' : 'purple'}>
                    {selectedRequest.type === 'individual' ? '个人认证' : '企业认证'}
                  </Tag>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">证件类型</div>
                  <div>{selectedRequest.idType}</div>
                </Col>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">证件号码</div>
                  <div>{selectedRequest.idNumber}</div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">手机号码</div>
                  <div>{selectedRequest.phone}</div>
                </Col>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">邮箱</div>
                  <div>{selectedRequest.email}</div>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">国家/地区</div>
                  <div>{selectedRequest.country}</div>
                </Col>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">当前等级</div>
                  <Tag color="orange">{selectedRequest.level}</Tag>
                </Col>
              </Row>
              <div>
                <div className="mb-2 text-gray-500">证件照片</div>
                <div className="flex gap-4">
                  <div className="w-40 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    身份证正面
                  </div>
                  <div className="w-40 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    身份证背面
                  </div>
                  <div className="w-40 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                    手持身份证
                  </div>
                </div>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="mb-2 text-gray-500">提交时间</div>
                  <div>{selectedRequest.submitTime}</div>
                </Col>
                {selectedRequest.approveTime && (
                  <Col span={12}>
                    <div className="mb-2 text-gray-500">审核时间</div>
                    <div>{selectedRequest.approveTime}</div>
                  </Col>
                )}
              </Row>
              {selectedRequest.rejectReason && (
                <div>
                  <div className="mb-2 text-gray-500">拒绝原因</div>
                  <div className="text-red-600">{selectedRequest.rejectReason}</div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
