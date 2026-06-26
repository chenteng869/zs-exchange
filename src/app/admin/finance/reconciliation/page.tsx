'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Progress, Tabs, Alert, Descriptions } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined, EyeOutlined, SearchOutlined, SyncOutlined, FileTextOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockReconciliationData = {
  totalRecords: 12580,
  matched: 12450,
  unmatched: 85,
  pending: 45,
  successRate: 98.9,
};

const mockReconciliationRecords = [
  { id: '1', type: 'deposit', platformId: 'P123456789', chainId: 'C987654321', platformAmount: 5000, chainAmount: 5000, currency: 'USDT', status: 'matched', time: '2024-05-13 10:30:00' },
  { id: '2', type: 'withdrawal', platformId: 'P987654321', chainId: 'C123456789', platformAmount: 1200, chainAmount: 1200, currency: 'USDT', status: 'matched', time: '2024-05-13 09:45:00' },
  { id: '3', type: 'deposit', platformId: 'P456789123', chainId: 'C654321987', platformAmount: 2500, chainAmount: 2495, currency: 'USDT', status: 'unmatched', diffAmount: -5, time: '2024-05-13 08:20:00' },
  { id: '4', type: 'deposit', platformId: 'P789123456', chainId: '', platformAmount: 1000, chainAmount: 0, currency: 'BTC', status: 'pending', time: '2024-05-12 23:15:00' },
  { id: '5', type: 'withdrawal', platformId: 'P321654987', chainId: 'C369258147', platformAmount: 800, chainAmount: 820, currency: 'ETH', status: 'unmatched', diffAmount: 20, time: '2024-05-12 18:30:00' },
];

const reconciliationTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['已匹配', '未匹配', '待处理'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-08', '05-09', '05-10', '05-11', '05-12', '05-13'] },
  yAxis: { type: 'value' },
  series: [
    { name: '已匹配', type: 'bar', stack: 'total', data: [1850, 2020, 1980, 2100, 2250, 2250], itemStyle: { color: '#16A34A' } },
    { name: '未匹配', type: 'bar', stack: 'total', data: [15, 12, 18, 22, 10, 8], itemStyle: { color: '#DC2626' } },
    { name: '待处理', type: 'bar', stack: 'total', data: [10, 8, 5, 12, 8, 5], itemStyle: { color: '#F59E0B' } },
  ],
};

export default function ReconciliationPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const statusColors: Record<string, string> = {
    matched: 'success',
    unmatched: 'error',
    pending: 'warning',
  };

  const statusLabels: Record<string, string> = {
    matched: '已匹配',
    unmatched: '未匹配',
    pending: '待处理',
  };

  const typeColors: Record<string, string> = {
    deposit: 'green',
    withdrawal: 'red',
  };

  const typeLabels: Record<string, string> = {
    deposit: '充值',
    withdrawal: '提现',
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={typeColors[type]}>{typeLabels[type]}</Tag> },
    { title: '平台流水号', dataIndex: 'platformId', key: 'platformId' },
    { title: '链上交易号', dataIndex: 'chainId', key: 'chainId', render: (text: string) => text || <span className="text-gray-400">-</span> },
    { title: '平台金额', dataIndex: 'platformAmount', key: 'platformAmount', render: (val: number, record: any) => `${val} ${record.currency}` },
    { title: '链上金额', dataIndex: 'chainAmount', key: 'chainAmount', render: (val: number, record: any) => `${val} ${record.currency}` },
    { 
      title: '差额', 
      key: 'diff', 
      render: (_: any, record: any) => record.diffAmount ? (
        <span className={record.diffAmount > 0 ? 'text-red-600' : 'text-orange-600'}>
          {record.diffAmount > 0 ? '+' : ''}{record.diffAmount}
        </span>
      ) : <span className="text-gray-400">-</span>,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const color = statusColors[status] as 'success' | 'warning' | 'error' | 'default' | 'processing';
        return <Badge status={color} text={statusLabels[status]} />;
      },
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {record.status === 'unmatched' && <Button type="primary" size="small">处理</Button>}
          {record.status === 'pending' && <Button type="link" size="small" icon={<SyncOutlined />}>重试</Button>}
        </Space>
      ),
    },
  ];

  const filteredRecords = activeTab === 'all' 
    ? mockReconciliationRecords 
    : mockReconciliationRecords.filter(r => r.status === activeTab);

  const handleViewDetail = (record: any) => {
    setSelectedRecord(record);
    setIsDetailModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircleOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">对账管理</h1>
          </div>
          <Space>
            <Button icon={<SearchOutlined />}>搜索</Button>
            <Button icon={<SyncOutlined />}>手动对账</Button>
            <Button type="primary" icon={<FileTextOutlined />}>生成对账报告</Button>
          </Space>
        </div>

        {mockReconciliationData.unmatched > 0 && (
          <Alert
            message={`发现 ${mockReconciliationData.unmatched} 条未匹配记录，${mockReconciliationData.pending} 条待处理记录`}
            type="warning"
            showIcon
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="对账记录" 
                value={mockReconciliationData.totalRecords} 
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                今日新增 +235
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="已匹配" 
                value={mockReconciliationData.matched} 
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                成功率 {mockReconciliationData.successRate}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="未匹配" 
                value={mockReconciliationData.unmatched} 
                valueStyle={{ color: '#DC2626' }}
              />
              <div className="text-red-500 text-sm mt-2">
                需要处理
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic 
                title="待处理" 
                value={mockReconciliationData.pending} 
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-orange-500 text-sm mt-2">
                等待链上确认
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="对账趋势">
              <SafeECharts option={reconciliationTrendOption} style={{ height: 250 }} title="对账趋势" />
            </Card>
          </Col>
        </Row>

        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="全部" key="all" />
            <TabPane tab="已匹配" key="matched" />
            <TabPane tab="未匹配" key="unmatched" />
            <TabPane tab="待处理" key="pending" />
          </Tabs>
          
          <Table
            dataSource={filteredRecords}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="对账详情"
          open={isDetailModalVisible}
          onCancel={() => setIsDetailModalVisible(false)}
          width={700}
          footer={
            selectedRecord?.status === 'unmatched' ? [
              <Button key="cancel" onClick={() => setIsDetailModalVisible(false)}>关闭</Button>,
              <Button key="resolve" type="primary">标记为已处理</Button>,
            ] : [
              <Button key="close" onClick={() => setIsDetailModalVisible(false)}>关闭</Button>,
            ]
          }
        >
          {selectedRecord && (
            <div className="space-y-4">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="类型" span={2}>
                  <Tag color={typeColors[selectedRecord.type]}>{typeLabels[selectedRecord.type]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="平台流水号">{selectedRecord.platformId}</Descriptions.Item>
                <Descriptions.Item label="链上交易号">
                  {selectedRecord.chainId || <span className="text-gray-400">-</span>}
                </Descriptions.Item>
                <Descriptions.Item label="平台金额">{selectedRecord.platformAmount} {selectedRecord.currency}</Descriptions.Item>
                <Descriptions.Item label="链上金额">{selectedRecord.chainAmount} {selectedRecord.currency}</Descriptions.Item>
                {selectedRecord.diffAmount && (
                  <Descriptions.Item label="差额" span={2}>
                    <span className={selectedRecord.diffAmount > 0 ? 'text-red-600' : 'text-orange-600'}>
                      {selectedRecord.diffAmount > 0 ? '+' : ''}{selectedRecord.diffAmount} {selectedRecord.currency}
                    </span>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="状态" span={2}>
                  <Badge 
                    status={statusColors[selectedRecord.status] as 'success' | 'warning' | 'error' | 'default' | 'processing'} 
                    text={statusLabels[selectedRecord.status]} 
                  />
                </Descriptions.Item>
                <Descriptions.Item label="时间" span={2}>{selectedRecord.time}</Descriptions.Item>
              </Descriptions>

              {selectedRecord.status === 'unmatched' && (
                <Card size="small" title="处理建议" type="inner">
                  <p>建议：核对链上交易详情，确认金额差异原因，必要时进行人工调账。</p>
                </Card>
              )}
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
