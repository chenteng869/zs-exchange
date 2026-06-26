'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Tabs, Image } from 'antd';
import { IdcardOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockKYCRequests = [
  { id: '1', user: '0x1234...5678', username: '张三', level: 'LV2', status: 'pending', submitTime: '2024-05-13 10:30:00', type: 'individual', idType: '身份证', idNumber: '1101011990********', realName: '张三', phone: '138****8888', email: 'zhangsan***@gmail.com', country: '中国' },
  { id: '2', user: '0x5678...9abc', username: '李四', level: 'LV1', status: 'approved', submitTime: '2024-05-12 14:20:00', approveTime: '2024-05-12 16:45:00', type: 'individual', idType: '护照', idNumber: 'E1234567', realName: '李四', phone: '139****6666', email: 'lisi***@outlook.com', country: '中国', approvedBy: 'admin1' },
  { id: '3', user: '0x9abc...def0', username: '王五', level: 'LV1', status: 'rejected', submitTime: '2024-05-11 08:15:00', rejectTime: '2024-05-11 10:20:00', type: 'individual', idType: '驾照', idNumber: '1100001990********', realName: '王五', phone: '137****5555', email: 'wangwu***@163.com', country: '中国', rejectReason: '身份证照片模糊不清', rejectedBy: 'admin2' },
  { id: '4', user: '0xdef0...1234', username: '赵六', level: 'LV3', status: 'pending', submitTime: '2024-05-10 16:45:00', type: 'corporate', idType: '营业执照', idNumber: '911100********', realName: '北京科技有限公司', phone: '010-12345678', email: 'contact***@tech.com', country: '中国' },
  { id: '5', user: '0x2345...6789', username: '钱七', level: 'LV1', status: 'approved', submitTime: '2024-05-09 09:00:00', approveTime: '2024-05-09 11:30:00', type: 'individual', idType: '身份证', idNumber: '3101011985********', realName: '钱七', phone: '136****4444', email: 'qianqi***@qq.com', country: '中国', approvedBy: 'admin1' },
];

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

  const pendingCount = mockKYCRequests.filter(r => r.status === 'pending').length;
  const approvedCount = mockKYCRequests.filter(r => r.status === 'approved').length;
  const rejectedCount = mockKYCRequests.filter(r => r.status === 'rejected').length;
  const totalCount = mockKYCRequests.length;

  const filteredRequests = activeTab === 'all' 
    ? mockKYCRequests 
    : mockKYCRequests.filter(r => r.status === activeTab);

  const columns = [
    { title: '申请ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '用户地址', dataIndex: 'user', key: 'user', render: (text: string) => <span className="font-mono text-gray-700">{text}</span> },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '认证类型', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={type === 'individual' ? 'blue' : 'purple'}>{type === 'individual' ? '个人' : '企业'}</Tag> },
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
    { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime' },
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
      content: `确认通过用户 ${record.username} 的KYC申请？`,
      onOk() {
        Modal.success({ title: '操作成功', content: 'KYC申请已通过！' });
      },
    });
  };

  const handleReject = (record: any) => {
    Modal.confirm({
      title: '拒绝KYC申请',
      content: (
        <Form layout="vertical">
          <Form.Item label="拒绝原因" name="reason" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入拒绝原因..." />
          </Form.Item>
        </Form>
      ),
      onOk() {
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
