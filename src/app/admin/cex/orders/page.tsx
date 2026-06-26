'use client';

import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Form, Input, Select, DatePicker, Tabs } from 'antd';
import { SearchOutlined, FilterOutlined, SyncOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { RangePicker } = DatePicker;

const mockOrders = [
  { id: '1', symbol: 'BTC/USDT', side: 'buy', type: 'limit', price: 67523.80, quantity: 0.1, filled: 0.05, status: 'partial', time: '2024-05-12 14:30:22' },
  { id: '2', symbol: 'ETH/USDT', side: 'sell', type: 'market', price: 3285.50, quantity: 1, filled: 1, status: 'filled', time: '2024-05-12 14:25:15' },
  { id: '3', symbol: 'GXT/USDT', side: 'buy', type: 'limit', price: 0.85, quantity: 1000, filled: 0, status: 'open', time: '2024-05-12 14:20:08' },
  { id: '4', symbol: 'SOL/USDT', side: 'sell', type: 'limit', price: 180.00, quantity: 50, filled: 30, status: 'partial', time: '2024-05-12 14:15:33' },
  { id: '5', symbol: 'BTC/USDT', side: 'sell', type: 'stop', price: 66000, quantity: 0.5, filled: 0, status: 'open', time: '2024-05-12 13:45:10' },
];

const mockTradeHistory = [
  { id: '1', symbol: 'BTC/USDT', side: 'buy', price: 67523.80, quantity: 0.05, fee: 3.376, total: 3376.19, time: '2024-05-12 14:30:22' },
  { id: '2', symbol: 'ETH/USDT', side: 'sell', price: 3285.50, quantity: 1, fee: 3.285, total: 3282.215, time: '2024-05-12 14:25:15' },
  { id: '3', symbol: 'GXT/USDT', side: 'buy', price: 0.845, quantity: 500, fee: 0.4225, total: 422.0775, time: '2024-05-12 13:50:45' },
];

export default function OrderManagementPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusColors = {
    open: 'blue',
    partial: 'orange',
    filled: 'green',
    cancelled: 'gray',
  };

  const statusLabels = {
    open: '待成交',
    partial: '部分成交',
    filled: '已成交',
    cancelled: '已取消',
  };

  const tabItems = [
    {
      key: 'open',
      label: '当前委托',
      children: (
        <Card>
          <div className="flex gap-4 mb-4">
            <Form layout="inline">
              <Form.Item>
                <Input 
                  placeholder="搜索订单号或交易对" 
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                />
              </Form.Item>
              <Form.Item>
                <Select 
                  placeholder="筛选状态" 
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: 150 }}
                >
                  <Option value="all">全部</Option>
                  <Option value="open">待成交</Option>
                  <Option value="partial">部分成交</Option>
                  <Option value="filled">已成交</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<FilterOutlined />}>筛选</Button>
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={mockOrders}
            columns={[
              { title: '订单号', dataIndex: 'id', key: 'id', width: 120 },
              { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 120 },
              { 
                title: '方向', 
                dataIndex: 'side', 
                key: 'side',
                width: 80,
                render: (val) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val === 'buy' ? '买入' : '卖出'}</Tag>
              },
              { 
                title: '类型', 
                dataIndex: 'type', 
                key: 'type',
                width: 100,
                render: (val: string) => {
                  const types: Record<string, string> = { limit: '限价单', market: '市价单', stop: '止损单' };
                  return <Tag color="blue">{types[val]}</Tag>;
                }
              },
              { title: '价格', dataIndex: 'price', key: 'price', width: 120, render: (val) => `$${val.toLocaleString()}` },
              { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
              { 
                title: '成交', 
                dataIndex: 'filled', 
                key: 'filled',
                width: 100,
                render: (val, record) => `${val}/${record.quantity}`
              },
              { 
                title: '状态', 
                dataIndex: 'status', 
                key: 'status',
                width: 100,
                render: (val: string) => <Tag color={statusColors[val as keyof typeof statusColors]}>{statusLabels[val as keyof typeof statusLabels]}</Tag>
              },
              { title: '创建时间', dataIndex: 'time', key: 'time', width: 180 },
              { 
                title: '操作', 
                key: 'action',
                width: 150,
                render: (_, record) => (
                  <Space>
                    {record.status !== 'filled' && (
                      <>
                        <Button type="link">修改</Button>
                        <Button type="link" danger>取消</Button>
                      </>
                    )}
                  </Space>
                )
              },
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: '成交历史',
      children: (
        <Card>
          <div className="flex gap-4 mb-4">
            <Form layout="inline">
              <Form.Item>
                <Input 
                  placeholder="搜索订单号或交易对" 
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
              </Form.Item>
              <Form.Item>
                <RangePicker style={{ width: 300 }} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" icon={<FilterOutlined />}>筛选</Button>
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={mockTradeHistory}
            columns={[
              { title: '订单号', dataIndex: 'id', key: 'id', width: 120 },
              { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 120 },
              { 
                title: '方向', 
                dataIndex: 'side', 
                key: 'side',
                width: 80,
                render: (val) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val === 'buy' ? '买入' : '卖出'}</Tag>
              },
              { title: '成交价格', dataIndex: 'price', key: 'price', width: 120, render: (val) => `$${val.toLocaleString()}` },
              { title: '成交数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
              { title: '手续费', dataIndex: 'fee', key: 'fee', width: 100, render: (val) => `$${val.toFixed(4)}` },
              { title: '成交总额', dataIndex: 'total', key: 'total', width: 120, render: (val) => `$${val.toFixed(2)}` },
              { title: '成交时间', dataIndex: 'time', key: 'time', width: 180 },
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClockCircleOutlined className="text-2xl text-cyan-600" />
            <h1 className="text-2xl font-bold m-0">订单管理</h1>
          </div>
          <Space>
            <Button icon={<SyncOutlined />}>刷新订单</Button>
            <Button icon={<DownloadOutlined />} type="primary">导出订单</Button>
          </Space>
        </div>

        <Tabs defaultActiveKey="open" items={tabItems} />
      </div>
    </AdminLayout>
  );
}
