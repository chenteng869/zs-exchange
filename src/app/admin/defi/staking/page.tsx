'use client';

import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Progress, Modal,
  Form, Input, InputNumber, Select, Badge, Drawer, Descriptions, DatePicker,
  Timeline, Switch, Popconfirm, Tooltip,
} from 'antd';
import {
  LockOutlined, PlusOutlined, EditOutlined, EyeOutlined, HistoryOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const stakeTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['GXT质押池', 'ETH质押池', 'USDT质押池'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月'] },
  yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
  series: [
    { name: 'GXT质押池', type: 'bar', data: [1200, 1800, 2100, 2350, 2580] },
    { name: 'ETH质押池', type: 'bar', data: [800, 1200, 1500, 1720, 1850] },
    { name: 'USDT质押池', type: 'bar', data: [5000, 6200, 7100, 7800, 8500] },
  ],
};

export default function StakingPage() {
  const [stakingPools, setStakingPools] = useState<any[]>([]);
  const [stakingRecords, setStakingRecords] = useState<any[]>([]);
  const [loadingPools, setLoadingPools] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedPool, setSelectedPool] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/defi/staking').then(r => r.json()).then(d => {
      if (Array.isArray(d.data)) setStakingPools(d.data);
      setLoadingPools(false);
    }).catch(() => setLoadingPools(false));
  }, []);

  useEffect(() => {
    fetch('/api/admin/staking/records?pageSize=50').then(r => r.json()).then(d => {
      if (d.data?.items) setStakingRecords(d.data.items);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, []);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [configDrawerVisible, setConfigDrawerVisible] = useState(false);
  const [versionHistoryVisible, setVersionHistoryVisible] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const columns = [
    { title: '质押池名称', dataIndex: 'name', key: 'name', render: (text: string) => <div className="font-semibold">{text}</div> },
    { title: '质押代币', key: 'token', render: (_: any, record: any) => <Tag color="blue">{record.token}</Tag> },
    { title: 'APR', dataIndex: 'apr', key: 'apr', render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span> },
    { title: '锁定期', dataIndex: 'lockPeriod', key: 'lockPeriod', render: (val: number) => val === 0 ? <span className="text-gray-400">灵活</span> : <span>{val}天</span> },
    { title: '最低质押', dataIndex: 'minStake', key: 'minStake', render: (val: number, record: any) => `${val} ${record.token}` },
    { title: '最高质押', dataIndex: 'maxStake', key: 'maxStake', render: (val: number, record: any) => `${val.toLocaleString()} ${record.token}` },
    { title: '总质押量', dataIndex: 'totalStaked', key: 'totalStaked', render: (val: number, record: any) => `${val.toLocaleString()} ${record.token}` },
    { title: '活跃用户', dataIndex: 'activeUsers', key: 'activeUsers', render: (val: number) => val.toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => <Badge status={status === 'active' ? 'success' : 'warning'} text={status === 'active' ? '运行中' : '已暂停'} /> },
    {
      title: '操作', key: 'actions', render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPool(record); setDrawerVisible(true); }}>详情</Button>
          <Button size="small" type="primary" onClick={() => { setSelectedPool(record); setConfigDrawerVisible(true); }}>配置</Button>
          <Button size="small" type={record.status === 'active' ? 'default' : 'primary'}>
            {record.status === 'active' ? '暂停' : '启动'}
          </Button>
        </Space>
      ),
    },
  ];

  const totalStaked = stakingPools.reduce((sum: number, pool: any) => sum + pool.totalStaked, 0);
  const totalUsers = stakingPools.reduce((sum: number, pool: any) => sum + pool.activeUsers, 0);
  const avgAPR = stakingPools.length > 0 ? (stakingPools.reduce((sum: number, pool: any) => sum + pool.apr, 0) / stakingPools.length).toFixed(1) : '0';

  const toggleRow = (record: any) => {
    const key = record.id.toString();
    setExpandedRowKeys(expandedRowKeys.includes(key) ? expandedRowKeys.filter(k => k !== key) : [...expandedRowKeys, key]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <LockOutlined className="text-2xl text-purple-600" />
          <h1 className="text-2xl font-bold m-0">DeFi 质押管理</h1>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总质押量" value={totalStaked} precision={0} formatter={(val) => `${(Number(val) / 10000).toFixed(2)}万`} />
              <div className="text-gray-400 text-sm mt-1">GXT + ETH + USDT</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="平均APR" value={Number(avgAPR)} suffix="%" valueStyle={{ color: '#3f8600' }} />
              <div className="text-gray-400 text-sm mt-1">最高 {stakingPools.length > 0 ? Math.max(...stakingPools.map((p: any) => p.apr)) : 0}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="活跃质押池" value={stakingPools.filter((p: any) => p.status === 'active').length} suffix={`/ ${stakingPools.length}`} />
              <div className="text-gray-400 text-sm mt-1">运行中</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="质押用户" value={totalUsers} />
              <div className="text-gray-400 text-sm mt-1">今日新增 128</div>
            </Card>
          </Col>
        </Row>

        <Card title="质押趋势" extra={<Button type="primary" icon={<PlusOutlined />}>新增质押池</Button>}>
          <SafeECharts option={stakeTrendOption} style={{ height: 300 }} title="质押趋势" />
        </Card>

        <Card title="质押池列表">
          <Table
            dataSource={stakingPools}
            loading={loadingPools}
            columns={columns}
            expandable={{
              expandedRowKeys,
              expandedRowRender: (record: any) => (
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">合约地址</div>
                      <div className="font-mono text-sm">{record.tokenAddress}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">创建时间</div>
                      <div className="font-mono text-sm">{record.createdAt}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">更新时间</div>
                      <div className="font-mono text-sm">{record.updatedAt}</div>
                    </div>
                    <div>
                      <Button size="small" icon={<HistoryOutlined />} onClick={() => { setSelectedPool(record); setVersionHistoryVisible(true); }}>
                        查看配置历史
                      </Button>
                    </div>
                  </div>
                </div>
              ),
              rowExpandable: () => true,
              onExpand: (expanded, record) => toggleRow(record),
            }}
            pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 个质押池` }}
            rowKey="id"
          />
        </Card>

        <Card title="最新质押记录">
          <Table
            dataSource={stakingRecords}
              loading={loadingRecords}
            columns={[
              { title: '交易ID', dataIndex: 'id', key: 'id', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
              { title: '用户地址', dataIndex: 'user', key: 'user', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
              { title: '质押金额', key: 'amount', render: (_: any, record: any) => `${record.amount} ${record.token}` },
              { title: '锁定期', dataIndex: 'lockPeriod', key: 'lockPeriod', render: (val: number) => val === 0 ? '灵活' : `${val}天` },
              { title: '质押时间', dataIndex: 'stakeTime', key: 'stakeTime' },
              { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => (
                status === 'staking' ? <Tag color="green">质押中</Tag> : <Tag color="gray">已解除</Tag>
              ) },
            ]}
            pagination={{ pageSize: 5 }}
            rowKey="id"
          />
        </Card>

        <Drawer title="质押池详情" width={600} open={drawerVisible} onClose={() => setDrawerVisible(false)}>
          {selectedPool && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <LockOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedPool.name}</h2>
                  <Tag color="blue">{selectedPool.token}</Tag>
                </div>
              </div>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="年化收益率"><span className="text-green-600 font-bold text-xl">{selectedPool.apr}%</span></Descriptions.Item>
                <Descriptions.Item label="合约地址">
                  <span className="font-mono text-xs break-all">{selectedPool.tokenAddress}</span>
                </Descriptions.Item>
                <Descriptions.Item label="最低质押">{selectedPool.minStake} {selectedPool.token}</Descriptions.Item>
                <Descriptions.Item label="最高质押">{selectedPool.maxStake.toLocaleString()} {selectedPool.token}</Descriptions.Item>
                <Descriptions.Item label="锁定期">{selectedPool.lockPeriod === 0 ? '灵活质押' : `${selectedPool.lockPeriod}天`}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Badge status={selectedPool.status === 'active' ? 'success' : 'warning'} text={selectedPool.status === 'active' ? '运行中' : '已暂停'} />
                </Descriptions.Item>
                <Descriptions.Item label="总质押量" span={2}>{selectedPool.totalStaked.toLocaleString()} {selectedPool.token}</Descriptions.Item>
                <Descriptions.Item label="活跃用户">{selectedPool.activeUsers.toLocaleString()} 人</Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Drawer>

        <Drawer title="质押池配置" width={700} open={configDrawerVisible} onClose={() => setConfigDrawerVisible(false)} footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConfigDrawerVisible(false)}>取消</Button>
            <Button type="primary">保存配置</Button>
          </div>
        }>
          {selectedPool && (
            <Form layout="vertical" initialValues={{
              name: selectedPool.name,
              token: selectedPool.token,
              apr: selectedPool.apr,
              minStake: selectedPool.minStake,
              maxStake: selectedPool.maxStake,
              lockPeriod: selectedPool.lockPeriod,
              enabled: selectedPool.status === 'active',
            }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="质押池名称" name="name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="质押代币" name="token" rules={[{ required: true }]}>
                    <Select options={[{ value: 'GXT', label: 'GXT' }, { value: 'ETH', label: 'ETH' }, { value: 'USDT', label: 'USDT' }, { value: 'BNB', label: 'BNB' }]} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="年化收益率(APR)" name="apr" rules={[{ required: true, type: 'number', min: 0, max: 100 }]}>
                    <InputNumber className="w-full" suffix="%" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="锁定期(天)" name="lockPeriod" rules={[{ type: 'number', min: 0 }]}>
                    <InputNumber className="w-full" placeholder="0表示灵活质押" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="最低质押量" name="minStake" rules={[{ required: true, type: 'number', min: 0 }]}>
                    <InputNumber className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="最高质押量" name="maxStake" rules={[{ required: true, type: 'number', min: 0 }]}>
                    <InputNumber className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="enabled" valuePropName="checked">
                    <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                  </Form.Item>
                </Col>
              </Row>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-gray-600">
                  <span className="text-sm">⚠ 修改配置将生成新版本记录，支持版本回溯</span>
                </div>
              </div>
            </Form>
          )}
        </Drawer>

        <Drawer title="配置历史记录" width={600} open={versionHistoryVisible} onClose={() => setVersionHistoryVisible(false)} footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setVersionHistoryVisible(false)}>关闭</Button>
            <Button type="primary" icon={<HistoryOutlined />}>回溯到上一版本</Button>
          </div>
        }>
          {selectedPool && (
            <div className="space-y-4">
              <Timeline>
                {selectedPool.configHistory.map((item: { version: string; date: string; changes: string }, index: number) => (
                  <Timeline.Item key={index} color={index === 0 ? 'green' : 'blue'}>
                    <div className="font-semibold">{item.version}</div>
                    <div className="text-gray-500 text-sm">{item.date}</div>
                    <div className="text-sm">{item.changes}</div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}
