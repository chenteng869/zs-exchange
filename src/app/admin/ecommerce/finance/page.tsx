'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Statistic, Tabs, DatePicker } from 'antd';
import { DollarOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

const mockTransactionRecords = [
  { id: '1', type: 'income', category: '商品销售', amount: 2890, orderNo: 'ORD-20240510-001', createTime: '2024-05-10 14:30:00', status: 'completed' },
  { id: '2', type: 'income', category: '商品销售', amount: 568, orderNo: 'ORD-20240510-002', createTime: '2024-05-10 15:20:00', status: 'completed' },
  { id: '3', type: 'expense', category: '物流费用', amount: 120, orderNo: 'EXP-20240510-001', createTime: '2024-05-10 16:45:00', status: 'completed' },
  { id: '4', type: 'expense', category: '采购成本', amount: 1500, orderNo: 'EXP-20240509-001', createTime: '2024-05-09 10:15:00', status: 'completed' },
  { id: '5', type: 'income', category: '商品销售', amount: 899, orderNo: 'ORD-20240509-003', createTime: '2024-05-09 11:30:00', status: 'completed' },
  { id: '6', type: 'expense', category: '平台服务费', amount: 58, orderNo: 'EXP-20240508-001', createTime: '2024-05-08 09:00:00', status: 'pending' },
];

const mockSettlementRecords = [
  { id: '1', period: '2024年4月', startDate: '2024-04-01', endDate: '2024-04-30', totalIncome: 125800, totalExpense: 45200, netProfit: 80600, status: 'settled', settleTime: '2024-05-05 10:00:00' },
  { id: '2', period: '2024年3月', startDate: '2024-03-01', endDate: '2024-03-31', totalIncome: 98500, totalExpense: 36800, netProfit: 61700, status: 'settled', settleTime: '2024-04-05 10:00:00' },
  { id: '3', period: '2024年5月', startDate: '2024-05-01', endDate: '2024-05-31', totalIncome: 45200, totalExpense: 18600, netProfit: 26600, status: 'pending', settleTime: '' },
];

const typeMap: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  income: { color: '#16A34A', label: '收入', icon: <ArrowUpOutlined /> },
  expense: { color: '#DC2626', label: '支出', icon: <ArrowDownOutlined /> },
};

const statusMap: Record<string, { color: 'success' | 'warning' | 'default'; label: string }> = {
  completed: { color: 'success', label: '已完成' },
  pending: { color: 'warning', label: '待处理' },
  settled: { color: 'success', label: '已结算' },
};

const financeChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['收入', '支出', '净利润'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['05-01', '05-02', '05-03', '05-04', '05-05', '05-06', '05-07'] },
  yAxis: [
    { type: 'value', name: '金额(元)' },
  ],
  series: [
    { type: 'bar', name: '收入', data: [3200, 4500, 2800, 5600, 3800, 4200, 4800], itemStyle: { color: '#16A34A' } },
    { type: 'bar', name: '支出', data: [1200, 1800, 900, 2200, 1500, 1700, 1900], itemStyle: { color: '#DC2626' } },
    { type: 'line', name: '净利润', data: [2000, 2700, 1900, 3400, 2300, 2500, 2900], itemStyle: { color: '#1677FF' }, smooth: true },
  ],
};

const transactionColumns = [
  { title: '流水号', dataIndex: 'id', key: 'id' },
  { 
    title: '类型', 
    dataIndex: 'type', 
    key: 'type', 
    render: (type: string) => {
      const config = typeMap[type];
      return <Tag color={config.color}>{config.icon} {config.label}</Tag>;
    },
  },
  { title: '分类', dataIndex: 'category', key: 'category' },
  { 
    title: '金额', 
    dataIndex: 'amount', 
    key: 'amount', 
    render: (val: number, record: any) => (
      <span style={{ color: record.type === 'income' ? '#16A34A' : '#DC2626', fontWeight: 'bold' }}>
        {record.type === 'income' ? '+' : '-'}{val.toFixed(2)}
      </span>
    ),
  },
  { title: '关联单号', dataIndex: 'orderNo', key: 'orderNo' },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config = statusMap[status];
      return <Badge status={config?.color} text={config?.label} />;
    },
  },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
      </Space>
    ),
  },
];

const settlementColumns = [
  { title: '结算周期', dataIndex: 'period', key: 'period', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate' },
  { title: '结束日期', dataIndex: 'endDate', key: 'endDate' },
  { title: '总收入', dataIndex: 'totalIncome', key: 'totalIncome', render: (val: number) => <span style={{ color: '#16A34A' }}>+{val.toFixed(2)}</span> },
  { title: '总支出', dataIndex: 'totalExpense', key: 'totalExpense', render: (val: number) => <span style={{ color: '#DC2626' }}>-{val.toFixed(2)}</span> },
  { title: '净利润', dataIndex: 'netProfit', key: 'netProfit', render: (val: number) => <span style={{ color: val >= 0 ? '#16A34A' : '#DC2626', fontWeight: 'bold' }}>{val >= 0 ? '+' : ''}{val.toFixed(2)}</span> },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config = statusMap[status];
      return <Badge status={config?.color} text={config?.label} />;
    },
  },
  { title: '结算时间', dataIndex: 'settleTime', key: 'settleTime' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
        {record.status === 'pending' && (
          <Button type="link" size="small" icon={<CheckCircleOutlined />}>结算</Button>
        )}
      </Space>
    ),
  },
];

export default function FinancePage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [form] = Form.useForm();

  const totalIncome = mockTransactionRecords.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = mockTransactionRecords.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const handleView = (record: any) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleSettle = (record: any) => {
    Modal.confirm({
      title: '确认结算',
      content: `确认结算 ${record.period} 的账目吗？`,
      onOk: () => {
        Modal.success({ title: '操作成功', content: '结算成功！' });
      },
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarOutlined className="text-2xl text-yellow-600" />
            <h1 className="text-2xl font-bold m-0">财务管理</h1>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总收入"
                value={totalIncome}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较上月 +12.5%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总支出"
                value={totalExpense}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#DC2626' }}
              />
              <div className="text-gray-400 text-sm mt-1">较上月 +8.3%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="净利润"
                value={netProfit}
                precision={2}
                prefix="¥"
                valueStyle={{ color: netProfit >= 0 ? '#16A34A' : '#DC2626' }}
              />
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> 较上月 +15.2%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待结算周期"
                value={mockSettlementRecords.filter(s => s.status === 'pending').length}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">需要处理</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="收支趋势">
              <SafeECharts option={financeChartOption} style={{ height: 300 }} title="收支趋势" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="1">
          <TabPane tab="收支明细" key="1">
            <Card title="收支流水">
              <Table
                dataSource={mockTransactionRecords}
                columns={[
                  ...transactionColumns.map(col => 
                    col.key === 'action' 
                      ? { ...col, render: (_: any, record: any) => (
                          <Space size="small">
                            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
                          </Space>
                        )}
                      : col
                  ),
                ]}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
          <TabPane tab="结算管理" key="2">
            <Card title="结算记录">
              <Table
                dataSource={mockSettlementRecords}
                columns={[
                  ...settlementColumns.map(col => 
                    col.key === 'action' 
                      ? { ...col, render: (_: any, record: any) => (
                          <Space size="small">
                            <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
                            {record.status === 'pending' && (
                              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleSettle(record)}>结算</Button>
                            )}
                          </Space>
                        )}
                      : col
                  ),
                ]}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </TabPane>
        </Tabs>

        <Modal
          title="详情"
          open={isModalVisible}
          onOk={() => setIsModalVisible(false)}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          {selectedRecord && (
            <div>
              <p>详细信息展示区域</p>
              <pre>{JSON.stringify(selectedRecord, null, 2)}</pre>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
