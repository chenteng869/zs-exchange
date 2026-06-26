'use client';

import { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Progress, Modal,
  Form, Input, InputNumber, Select, Badge, Drawer, Descriptions, DatePicker,
  Timeline, Tooltip, Popconfirm, Alert, Checkbox, Switch,
} from 'antd';
import {
  TrophyOutlined, PlusOutlined, EditOutlined, EyeOutlined, ClockCircleOutlined,
  PlayCircleOutlined, SyncOutlined, FileTextOutlined, SearchOutlined,
  SendOutlined, WarningOutlined, CheckCircleOutlined, CloseCircleOutlined,
  HistoryOutlined, DownloadOutlined, FilterOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const mockRewardRules = [
  {
    id: '1',
    name: 'GXT质押奖励',
    type: 'staking',
    token: 'GXT',
    rewardPool: 1000000,
    distributed: 685000,
    remaining: 315000,
    ratio: 18.5,
    cycle: 'daily',
    startTime: '2024-01-15 00:00:00',
    endTime: '2024-12-31 23:59:59',
    status: 'active',
    autoDistribute: true,
    rules: [
      { tier: '1', minStake: 100, maxStake: 1000, apr: 15 },
      { tier: '2', minStake: 1000, maxStake: 10000, apr: 18 },
      { tier: '3', minStake: 10000, maxStake: null, apr: 22 },
    ],
  },
  {
    id: '2',
    name: '流动性挖矿奖励',
    type: 'liquidity',
    token: 'GXT',
    rewardPool: 500000,
    distributed: 320000,
    remaining: 180000,
    ratio: 12.8,
    cycle: 'weekly',
    startTime: '2024-02-01 00:00:00',
    endTime: '2024-12-31 23:59:59',
    status: 'active',
    autoDistribute: true,
    rules: [
      { tier: '1', minStake: 1000, maxStake: 10000, apr: 10 },
      { tier: '2', minStake: 10000, maxStake: 50000, apr: 13 },
      { tier: '3', minStake: 50000, maxStake: null, apr: 15 },
    ],
  },
  {
    id: '3',
    name: '推荐奖励',
    type: 'referral',
    token: 'GXT',
    rewardPool: 200000,
    distributed: 156000,
    remaining: 44000,
    ratio: 5,
    cycle: 'daily',
    startTime: '2024-01-20 00:00:00',
    endTime: '2024-12-31 23:59:59',
    status: 'active',
    autoDistribute: true,
    rules: [
      { tier: '1', level: 1, reward: '5%' },
      { tier: '2', level: 2, reward: '2%' },
      { tier: '3', level: 3, reward: '1%' },
    ],
  },
];

const rewardTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['质押奖励', '挖矿奖励', '推荐奖励'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { name: '质押奖励', type: 'bar', data: [15000, 16500, 14800, 17200, 15800, 18500, 16200] },
    { name: '挖矿奖励', type: 'bar', data: [8500, 9200, 8800, 9500, 9000, 9800, 9300] },
    { name: '推荐奖励', type: 'bar', data: [3200, 3500, 3100, 3800, 3400, 4200, 3600] },
  ],
};

const distributionHistory = [
  { id: 'dist-001', rule: 'GXT质押奖励', batchNo: 'B20240510001', totalAmount: 16200, token: 'GXT', count: 1250, status: 'success', time: '2024-05-10 00:00:00', method: 'auto' },
  { id: 'dist-002', rule: '流动性挖矿奖励', batchNo: 'B20240509002', totalAmount: 65000, token: 'GXT', count: 820, status: 'success', time: '2024-05-09 00:00:00', method: 'auto' },
  { id: 'dist-003', rule: '推荐奖励', batchNo: 'B20240510003', totalAmount: 3600, token: 'GXT', count: 456, status: 'success', time: '2024-05-10 00:00:00', method: 'auto' },
  { id: 'dist-004', rule: 'GXT质押奖励', batchNo: 'B20240509001', totalAmount: 18500, token: 'GXT', count: 1320, status: 'partial', time: '2024-05-09 00:00:00', method: 'auto', failedCount: 15 },
  { id: 'dist-005', rule: '手动补发', batchNo: 'B20240508001', totalAmount: 2500, token: 'GXT', count: 15, status: 'success', time: '2024-05-08 14:30:00', method: 'manual' },
];

const userRewards = [
  { id: '1', user: '0xaaa...bbb', totalReward: 1250.50, token: 'GXT', pending: 250.50, claimed: 1000, staked: 5000, level: 'VIP3' },
  { id: '2', user: '0xccc...ddd', totalReward: 890.25, token: 'GXT', pending: 0, claimed: 890.25, staked: 3000, level: 'VIP2' },
  { id: '3', user: '0xeee...fff', totalReward: 3500.80, token: 'GXT', pending: 500.80, claimed: 3000, staked: 15000, level: 'VIP3' },
  { id: '4', user: '0xggg...hhh', totalReward: 420.00, token: 'GXT', pending: 120, claimed: 300, staked: 2000, level: 'VIP1' },
  { id: '5', user: '0xiii...jjj', totalReward: 6850.00, token: 'GXT', pending: 850, claimed: 6000, staked: 30000, level: 'VIP3' },
];

export default function RewardsPage() {
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [distModalVisible, setDistModalVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

  const ruleColumns = [
    { title: '奖励规则', dataIndex: 'name', key: 'name', render: (text: string) => <div className="font-semibold">{text}</div> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => {
      const typeMap = { staking: { color: 'purple', text: '质押' }, liquidity: { color: 'blue', text: '流动性' }, referral: { color: 'green', text: '推荐' } };
      return <Tag color={typeMap[type as keyof typeof typeMap]?.color}>{typeMap[type as keyof typeof typeMap]?.text}</Tag>;
    } },
    { title: '奖励代币', dataIndex: 'token', key: 'token', render: (text: string) => <Tag color="gold">{text}</Tag> },
    { title: '奖励池', dataIndex: 'rewardPool', key: 'rewardPool', render: (val: number) => `${val.toLocaleString()} GXT` },
    { title: '已发放', dataIndex: 'distributed', key: 'distributed', render: (val: number, record: any) => {
      const percent = (val / record.rewardPool) * 100;
      return (
        <div>
          <span>{val.toLocaleString()} GXT</span>
          <Progress percent={Math.round(percent)} size="small" showInfo={false} className="ml-2" />
        </div>
      );
    } },
    { title: '剩余', dataIndex: 'remaining', key: 'remaining', render: (val: number) => `${val.toLocaleString()} GXT` },
    { title: '发放周期', dataIndex: 'cycle', key: 'cycle', render: (cycle: string) => {
      const cycleMap = { hourly: '每小时', daily: '每日', weekly: '每周', monthly: '每月' };
      return cycleMap[cycle as keyof typeof cycleMap] || cycle;
    } },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => <Badge status={status === 'active' ? 'success' : 'warning'} text={status === 'active' ? '运行中' : '已暂停'} /> },
    {
      title: '操作', key: 'actions', render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedRule(record); setDrawerVisible(true); }}>详情</Button>
          <Button size="small" type="primary" icon={<EditOutlined />}>编辑规则</Button>
          <Button size="small" icon={<SendOutlined />} onClick={() => { setSelectedRule(record); setDistModalVisible(true); }}>手动发放</Button>
        </Space>
      ),
    },
  ];

  const totalRewardPool = mockRewardRules.reduce((sum, rule) => sum + rule.rewardPool, 0);
  const totalDistributed = mockRewardRules.reduce((sum, rule) => sum + rule.distributed, 0);
  const totalRemaining = mockRewardRules.reduce((sum, rule) => sum + rule.remaining, 0);
  const todayDistributed = distributionHistory.filter(d => d.time.includes('2024-05-10')).reduce((sum, d) => sum + d.totalAmount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-yellow-600" />
            <h1 className="text-2xl font-bold m-0">DeFi 收益分配</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)}>筛选</Button>
            <Button icon={<DownloadOutlined />}>导出记录</Button>
            <Button icon={<HistoryOutlined />}>审计日志</Button>
            <Button type="primary" icon={<PlusOutlined />}>新增奖励规则</Button>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总奖励池" value={totalRewardPool} precision={0} formatter={(val) => `${(Number(val) / 10000).toFixed(2)}万 GXT`} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已发放" value={totalDistributed} precision={0} formatter={(val) => `${(Number(val) / 10000).toFixed(2)}万 GXT`} />
              <div className="text-gray-400 text-sm mt-1">发放率 {Math.round((totalDistributed / totalRewardPool) * 100)}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="剩余奖励" value={totalRemaining} precision={0} formatter={(val) => `${(Number(val) / 10000).toFixed(2)}万 GXT`} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="今日发放" value={todayDistributed} suffix=" GXT" />
              <div className="text-gray-400 text-sm mt-1">3 笔发放任务</div>
            </Card>
          </Col>
        </Row>

        <Card title="奖励发放趋势">
          <SafeECharts option={rewardTrendOption} style={{ height: 300 }} title="奖励发放趋势" />
        </Card>

        <Card title="奖励规则配置">
          <Table
            dataSource={mockRewardRules}
            columns={ruleColumns}
            pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条规则` }}
            rowKey="id"
          />
        </Card>

        <Card title="发放记录" extra={<Button type="primary" icon={<SyncOutlined />}>刷新记录</Button>}>
          <Table
            dataSource={distributionHistory}
            columns={[
              { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
              { title: '奖励规则', dataIndex: 'rule', key: 'rule' },
              { title: '发放金额', key: 'amount', render: (_: any, record: any) => `${record.totalAmount} ${record.token}` },
              { title: '发放人数', dataIndex: 'count', key: 'count' },
              { title: '发放方式', dataIndex: 'method', key: 'method', render: (method: string) => method === 'auto' ? <Tag color="green">自动</Tag> : <Tag color="blue">手动</Tag> },
              { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
                const statusMap = { success: { color: 'green', text: '成功', icon: <CheckCircleOutlined /> }, partial: { color: 'orange', text: '部分成功', icon: <WarningOutlined /> }, failed: { color: 'red', text: '失败', icon: <CloseCircleOutlined /> } };
                const map = statusMap[status as keyof typeof statusMap];
                return <Tag color={map?.color} icon={map?.icon}>{map?.text}</Tag>;
              } },
              { title: '发放时间', dataIndex: 'time', key: 'time' },
              { title: '操作', key: 'actions', render: (_: any, record: any) => (
                <Space>
                  <Button size="small" icon={<EyeOutlined />}>详情</Button>
                  {record.status !== 'success' && <Button size="small" type="primary" icon={<SyncOutlined />}>重试</Button>}
                </Space>
              ) },
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Card title="用户收益明细">
          <div className="flex items-center gap-2 mb-4">
            <Input.Search placeholder="搜索用户地址" style={{ width: 300 }} />
            <Select placeholder="等级筛选" style={{ width: 150 }} options={[{ value: 'all', label: '全部' }, { value: 'VIP1', label: 'VIP1' }, { value: 'VIP2', label: 'VIP2' }, { value: 'VIP3', label: 'VIP3' }]} />
            <Button type="primary" icon={<SendOutlined />}>批量发放</Button>
          </div>
          <Table
            dataSource={userRewards}
            columns={[
              { title: '用户地址', dataIndex: 'user', key: 'user', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
              { title: '用户等级', dataIndex: 'level', key: 'level', render: (text: string) => <Tag color="gold">{text}</Tag> },
              { title: '质押量', dataIndex: 'staked', key: 'staked', render: (val: number) => `${val} GXT` },
              { title: '累计收益', dataIndex: 'totalReward', key: 'totalReward', render: (val: number) => `${val} GXT` },
              { title: '待领取', dataIndex: 'pending', key: 'pending', render: (val: number) => <span className="text-yellow-600">{val} GXT</span> },
              { title: '已领取', dataIndex: 'claimed', key: 'claimed', render: (val: number) => `${val} GXT` },
              { title: '操作', key: 'actions', render: (_: any, record: any) => (
                <Space>
                  <Button size="small">查看详情</Button>
                  {record.pending > 0 && <Button size="small" type="primary">强制发放</Button>}
                </Space>
              ) },
            ]}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Drawer title="奖励规则详情" width={700} open={drawerVisible} onClose={() => setDrawerVisible(false)}>
          {selectedRule && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <TrophyOutlined className="text-2xl text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedRule.name}</h2>
                  <div className="flex gap-2">
                    <Tag color={selectedRule.type === 'staking' ? 'purple' : selectedRule.type === 'liquidity' ? 'blue' : 'green'}>
                      {selectedRule.type === 'staking' ? '质押' : selectedRule.type === 'liquidity' ? '流动性' : '推荐'}
                    </Tag>
                    <Tag color="gold">{selectedRule.token}</Tag>
                  </div>
                </div>
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="奖励池总额">{selectedRule.rewardPool.toLocaleString()} {selectedRule.token}</Descriptions.Item>
                <Descriptions.Item label="已发放">{selectedRule.distributed.toLocaleString()} {selectedRule.token}</Descriptions.Item>
                <Descriptions.Item label="剩余奖励">{selectedRule.remaining.toLocaleString()} {selectedRule.token}</Descriptions.Item>
                <Descriptions.Item label="发放周期">
                  {selectedRule.cycle === 'hourly' ? '每小时' : selectedRule.cycle === 'daily' ? '每日' : selectedRule.cycle === 'weekly' ? '每周' : '每月'}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">{selectedRule.startTime}</Descriptions.Item>
                <Descriptions.Item label="结束时间">{selectedRule.endTime}</Descriptions.Item>
                <Descriptions.Item label="自动发放" span={2}>
                  <Switch checked={selectedRule.autoDistribute} disabled />
                </Descriptions.Item>
              </Descriptions>

              <div>
                <div className="font-semibold mb-2">收益规则</div>
                <Table
                  dataSource={selectedRule.rules}
                  columns={[
                    { title: '等级', dataIndex: 'tier' },
                    { title: '最低质押', dataIndex: 'minStake', render: (val: number) => val || '-' },
                    { title: '最高质押', dataIndex: 'maxStake', render: (val: number) => val || '不限' },
                    { title: 'APR/奖励', dataIndex: 'apr', render: (val: number) => val ? `${val}%` : '-' },
                  ]}
                  pagination={false}
                  rowKey="tier"
                />
              </div>
            </div>
          )}
        </Drawer>

        <Modal title="手动发放" open={distModalVisible} onCancel={() => setDistModalVisible(false)} footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDistModalVisible(false)}>取消</Button>
            <Popconfirm title="确认执行手动发放？" okText="确认" cancelText="取消">
              <Button type="primary" icon={<SendOutlined />}>执行发放</Button>
            </Popconfirm>
          </div>
        }>
          {selectedRule && (
            <div className="space-y-4">
              <Alert message="手动发放将立即执行，请注意余额是否充足" type="warning" showIcon />
              <Form layout="vertical">
                <Form.Item label="发放规则">
                  <Input value={selectedRule.name} disabled />
                </Form.Item>
                <Form.Item label="发放金额">
                  <InputNumber className="w-full" placeholder="输入发放金额" />
                </Form.Item>
                <Form.Item label="发放说明">
                  <Input.TextArea placeholder="请输入发放说明（可选）" rows={3} />
                </Form.Item>
                <Form.Item>
                  <Checkbox>发送通知邮件给用户</Checkbox>
                </Form.Item>
              </Form>
            </div>
          )}
        </Modal>

        <Modal title="筛选条件" open={filterVisible} onCancel={() => setFilterVisible(false)} footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFilterVisible(false)}>重置</Button>
            <Button type="primary" onClick={() => setFilterVisible(false)}>应用筛选</Button>
          </div>
        }>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="奖励规则">
                  <Select options={[{ value: 'all', label: '全部' }, ...mockRewardRules.map(r => ({ value: r.id, label: r.name }))]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="发放状态">
                  <Select options={[{ value: 'all', label: '全部' }, { value: 'success', label: '成功' }, { value: 'partial', label: '部分成功' }, { value: 'failed', label: '失败' }]} />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="时间范围">
                  <DatePicker.RangePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
