'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Input, Select, DatePicker, App } from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminFetch } from '@/lib/admin/admin-fetch';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Q04-3.12.b2.1: route-aligned interface
// 保留 route 真实支撑字段: id / hash(=txHash) / type / amount / timestamp(=createdAt)
// 删除 route 不支撑字段: chain / from / to / fee / status
interface Transaction {
  id: string;
  hash: string;      // = route.txHash
  type: string;
  amount: number;    // route 返回 number, 渲染时 toLocaleString
  timestamp: string; // = route.createdAt
}

// 类型标签映射 (route 返回 type, 兼容历史 4 种 type 值)
const TYPE_LABELS: Record<string, { color: string; label: string }> = {
  transfer: { color: 'blue', label: '转账' },
  deposit:  { color: 'green', label: '充值' },
  withdraw: { color: 'orange', label: '提现' },
  swap:     { color: 'purple', label: '兑换' },
};

export default function TransactionHistoryPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Q04-3.12.b2.1: GET read-only realification
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ summary: any; rows: any[]; pagination: any }>(
        '/api/v1/admin/wallet/transactions?take=50'
      );
      // route-aligned 字段映射
      const items: Transaction[] = (Array.isArray(res?.rows) ? res.rows : []).map((r: any) => ({
        id: r.id,
        hash: r.txHash ?? '-',
        type: r.type ?? '-',
        amount: typeof r.amount === 'number' ? r.amount : Number(r.amount ?? 0),
        timestamp: r.createdAt ?? '-',
      }));
      setData(items);
      message.success('数据已刷新');
    } catch (e: any) {
      message.error(e?.message || '加载失败');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { load(); }, [load]);

  const showDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalVisible(true);
  };

  // Q04-3.12.b2.1: 保留 4 个真实字段列, 删除 chain/status 列
  const columns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    {
      title: '哈希',
      dataIndex: 'hash',
      key: 'hash',
      render: (text: string) => <span className="font-mono text-sm break-all">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const meta = TYPE_LABELS[type] || { color: 'gray', label: type };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (typeof val === 'number' ? val.toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: Transaction) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">交易记录</h1>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
          </Space>
        </div>

        <Card>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="搜索哈希或地址"
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选类型" style={{ width: '100%' }} defaultValue="all">
                <Option value="all">全部</Option>
                <Option value="transfer">转账</Option>
                <Option value="deposit">充值</Option>
                <Option value="withdraw">提现</Option>
                <Option value="swap">兑换</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker style={{ width: '100%' }} />
            </Col>
          </Row>

          <Table
            dataSource={data}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条交易` }}
            rowKey="id"
            locale={{ emptyText: loading ? '加载中...' : '暂无数据' }}
          />
        </Card>

        {/* 详情弹窗: 仅展示 route 真实支撑字段 (4 字段) */}
        {selectedTx && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setIsModalVisible(false)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4">交易详情</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 font-semibold">哈希:</div>
                  <div className="col-span-2 font-mono text-sm break-all">{selectedTx.hash}</div>
                  <div className="col-span-1 font-semibold">类型:</div>
                  <div className="col-span-2">
                    <Tag color={TYPE_LABELS[selectedTx.type]?.color || 'gray'}>
                      {TYPE_LABELS[selectedTx.type]?.label || selectedTx.type}
                    </Tag>
                  </div>
                  <div className="col-span-1 font-semibold">数量:</div>
                  <div className="col-span-2">
                    {typeof selectedTx.amount === 'number' ? selectedTx.amount.toLocaleString() : '-'}
                  </div>
                  <div className="col-span-1 font-semibold">时间:</div>
                  <div className="col-span-2">{selectedTx.timestamp}</div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setIsModalVisible(false)}>关闭</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
