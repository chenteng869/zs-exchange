'use client';

import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Form, Input, Select, DatePicker, Tabs } from 'antd';
import { SearchOutlined, FilterOutlined, SyncOutlined, DownloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { transactionApi } from '@/services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function OrderManagementPage() {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await transactionApi.getTransactions({ pageSize: 50, status: statusFilter === 'all' ? undefined : statusFilter });
      const items: any[] = (res as any)?.data?.items ?? [];
      const keyword = searchText.toLowerCase();
      const filtered = keyword
        ? items.filter((o: any) => o.id.includes(keyword) || o.symbol?.toLowerCase().includes(keyword))
        : items;
      const open = filtered.filter((o: any) => ['pending', 'new', 'partial', 'open'].includes(o.status));
      const filled = filtered.filter((o: any) => ['filled', 'cancelled', 'rejected'].includes(o.status));
      setOrders(open);
      setTrades(filled);
    } catch {
      setOrders([]);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const statusColors: Record<string, string> = { open: 'blue', new: 'blue', pending: 'blue', partial: 'orange', filled: 'green', cancelled: 'gray', rejected: 'red' };
  const statusLabels: Record<string, string> = { open: '待成交', new: '待成交', pending: '待成交', partial: '部分成交', filled: '已成交', cancelled: '已取消', rejected: '已拒绝' };

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
                <Button type="primary" icon={<FilterOutlined />} onClick={fetchOrders}>筛选</Button>
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={orders}
            loading={loading}
            columns={[
              { title: '订单号', dataIndex: 'id', key: 'id', width: 120, render: (v: string) => v.slice(0, 8) + '...' },
              { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 120 },
              {
                title: '方向',
                dataIndex: 'side',
                key: 'side',
                width: 80,
                render: (val: string) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val === 'buy' ? '买入' : '卖出'}</Tag>
              },
              {
                title: '类型',
                dataIndex: 'type',
                key: 'type',
                width: 100,
                render: (val: string) => {
                  const types: Record<string, string> = { limit: '限价单', market: '市价单', stop: '止损单' };
                  return <Tag color="blue">{types[val] ?? val}</Tag>;
                }
              },
              { title: '价格', dataIndex: 'price', key: 'price', width: 120, render: (val: string) => val ? `$${Number(val).toLocaleString()}` : '市价' },
              { title: '数量', dataIndex: 'amount', key: 'amount', width: 100 },
              {
                title: '成交',
                dataIndex: 'filledAmount',
                key: 'filledAmount',
                width: 100,
                render: (val: string, record: any) => `${Number(val).toFixed(4)}/${Number(record.amount).toFixed(4)}`
              },
              {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (val: string) => <Tag color={statusColors[val] ?? 'default'}>{statusLabels[val] ?? val}</Tag>
              },
              { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180, render: (v: string) => v?.slice(0, 19).replace('T', ' ') },
              {
                title: '操作',
                key: 'action',
                width: 150,
                render: (_: any, record: any) => (
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
            dataSource={trades}
            loading={loading}
            columns={[
              { title: '订单号', dataIndex: 'id', key: 'id', width: 120, render: (v: string) => v.slice(0, 8) + '...' },
              { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 120 },
              {
                title: '方向',
                dataIndex: 'side',
                key: 'side',
                width: 80,
                render: (val: string) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val === 'buy' ? '买入' : '卖出'}</Tag>
              },
              { title: '成交价格', dataIndex: 'price', key: 'price', width: 120, render: (val: string) => val ? `$${Number(val).toLocaleString()}` : '-' },
              { title: '成交数量', dataIndex: 'filledAmount', key: 'filledAmount', width: 100 },
              { title: '手续费', dataIndex: 'fee', key: 'fee', width: 100, render: (val: string) => `$${Number(val).toFixed(4)}` },
              { title: '成交总额', dataIndex: 'executedValue', key: 'executedValue', width: 120, render: (val: string) => `$${Number(val).toFixed(2)}` },
              { title: '成交时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180, render: (v: string) => v?.slice(0, 19).replace('T', ' ') },
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
            <Button icon={<SyncOutlined />} onClick={fetchOrders}>刷新订单</Button>
            <Button icon={<DownloadOutlined />} type="primary">导出订单</Button>
          </Space>
        </div>

        <Tabs defaultActiveKey="open" items={tabItems} />
      </div>
    </AdminLayout>
  );
}
