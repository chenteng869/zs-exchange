'use client';

import { useState } from 'react';
import { Button, Space, Tag, Modal, Descriptions, Divider, Select, Card, Tooltip, Progress, Table, message } from 'antd';
import {
  TeamOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  RiseOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import DataCard from '@/components/admin/DataCard';

const { Option } = Select;

const mockSubscriptions = [
  { subId: 'SUB-001', userId: 'U-1001', userName: '张伟', strategyName: 'AIOPC趋势跟踪V3', tier: 'enterprise', status: 'active', capitalAllocated: 500000, feeRate: 1.5, copyMode: 'ratio', riskLevel: 'medium', pnl: 78500, roi: 15.7, subscribeDate: '2024-06-01', expiryDate: '2025-12-01', autoRenew: true },
  { subId: 'SUB-002', userId: 'U-1002', userName: '李娜', strategyName: '网格套利增强版', tier: 'pro', status: 'active', capitalAllocated: 200000, feeRate: 2.0, copyMode: 'fixed', riskLevel: 'low', pnl: 28900, roi: 14.45, subscribeDate: '2024-07-15', expiryDate: '2025-07-15', autoRenew: true },
  { subId: 'SUB-003', userId: 'U-1003', userName: '王强', strategyName: 'AI做市策略Pro', tier: 'enterprise', status: 'paused', capitalAllocated: 1000000, feeRate: 1.2, copyMode: 'signal', riskLevel: 'high', pnl: -12500, roi: -1.25, subscribeDate: '2024-03-20', expiryDate: '2025-03-20', autoRenew: false },
  { subId: 'SUB-004', userId: 'U-1004', userName: '赵敏', strategyName: '高频网格V2', tier: 'pro', status: 'active', capitalAllocated: 150000, feeRate: 2.5, copyMode: 'ratio', riskLevel: 'medium', pnl: 22300, roi: 14.87, subscribeDate: '2024-09-01', expiryDate: '2025-03-01', autoRenew: true },
  { subId: 'SUB-005', userId: 'U-1005', userName: '陈刚', strategyName: '跨交易所价差套利', tier: 'free', status: 'expired', capitalAllocated: 30000, feeRate: 3.0, copyMode: 'signal', riskLevel: 'low', pnl: 2100, roi: 7.0, subscribeDate: '2024-04-10', expiryDate: '2025-05-10', autoRenew: false },
  { subId: 'SUB-006', userId: 'U-1006', userName: '刘芳', strategyName: 'AIOPC趋势跟踪V3', tier: 'pro', status: 'active', capitalAllocated: 350000, feeRate: 2.0, copyMode: 'ratio', riskLevel: 'medium', pnl: 49800, roi: 14.23, subscribeDate: '2024-11-01', expiryDate: '2025-11-01', autoRenew: true },
  { subId: 'SUB-007', userId: 'U-1007', userName: '周杰', strategyName: '波动率均值回归', tier: 'free', status: 'cancelled', capitalAllocated: 20000, feeRate: 3.0, copyMode: 'fixed', riskLevel: 'low', pnl: 890, roi: 4.45, subscribeDate: '2025-02-15', expiryDate: '2025-05-15', autoRenew: false },
  { subId: 'SUB-008', userId: 'U-1008', userName: '吴婷', strategyName: 'AI做市策略Pro', tier: 'enterprise', status: 'active', capitalAllocated: 800000, feeRate: 1.0, copyMode: 'ratio', riskLevel: 'high', pnl: 56700, roi: 7.09, subscribeDate: '2024-08-20', expiryDate: '2025-08-20', autoRenew: true },
  { subId: 'SUB-009', userId: 'U-1009', userName: '郑浩', strategyName: '网格套利增强版', tier: 'pro', status: 'active', capitalAllocated: 250000, feeRate: 2.0, copyMode: 'fixed', riskLevel: 'low', pnl: 35600, roi: 14.24, subscribeDate: '2025-01-10', expiryDate: '2026-01-10', autoRenew: true },
  { subId: 'SUB-010', userId: 'U-1010', userName: '孙丽', strategyName: 'AIOPC多因子选币', tier: 'enterprise', status: 'paused', capitalAllocated: 600000, feeRate: 1.5, copyMode: 'signal', riskLevel: 'medium', pnl: -3200, roi: -0.53, subscribeDate: '2025-03-01', expiryDate: '2025-09-01', autoRenew: false },
];

const tierMap: Record<string, { label: string; color: string }> = {
  free: { label: '免费版', color: 'default' },
  pro: { label: '专业版', color: 'blue' },
  enterprise: { label: '企业版', color: '#F0B90B' },
};
const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '活跃', color: 'success' },
  paused: { label: '已暂停', color: 'warning' },
  expired: { label: '已过期', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};
const copyModeMap: Record<string, string> = { fixed: '固定金额', ratio: '比例跟单', signal: '信号跟随' };
const riskMap: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: 'green' },
  medium: { label: '中风险', color: 'orange' },
  high: { label: '高风险', color: 'red' },
};

const mockSubHistory = [
  { time: '2025-06-23 14:30', action: '跟单执行', detail: '跟随策略开仓 BTC/USDT 多头 $5000', result: '成功' },
  { time: '2025-06-22 18:15', action: '收益结算', detail: '本周收益 +$2,350 已入账', result: '成功' },
  { time: '2025-06-20 09:00', action: '续费扣款', detail: '企业版月费 ¥999 已扣除', result: '成功' },
  { time: '2025-06-18 16:42', action: '风控触发', detail: '单日亏损超限，自动暂停跟单', result: '预警' },
  { time: '2025-06-15 00:00', action: '参数调整', detail: '跟单比例从80%调整为60%', result: '成功' },
];

export default function QuantSubscriptionsPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [tierFilter, setTierFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');

  const filteredData = mockSubscriptions.filter(item => {
    if (tierFilter && item.tier !== tierFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (modeFilter && item.copyMode !== modeFilter) return false;
    return true;
  });

  const activeCount = mockSubscriptions.filter(s => s.status === 'active').length;
  const monthNewCount = 2;
  const totalAUM = mockSubscriptions.filter(s => s.status === 'active').reduce((s, sub) => s + sub.capitalAllocated, 0);
  const avgRoi = (mockSubscriptions.filter(s => s.status === 'active').reduce((s, sub) => s + sub.roi, 0) / activeCount || 0).toFixed(2);

  const columns = [
    { title: '订阅ID', dataIndex: 'subId', key: 'subId', width: 95, render: (t: string) => <span className="font-mono text-xs">{t}</span> },
    { title: '用户名', dataIndex: 'userName', key: 'userName', width: 85, render: (t: string) => <span className="font-semibold">{t}</span> },
    { title: '策略名称', dataIndex: 'strategyName', key: 'strategyName', width: 170, render: (t: string) => <span className="text-blue-600">{t}</span> },
    {
      title: '等级', dataIndex: 'tier', key: 'tier', width: 85,
      render: (t: string) => <Tag color={tierMap[t]?.color}>{tierMap[t]?.label}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 85,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    { title: '分配资金($)', dataIndex: 'capitalAllocated', key: 'capitalAllocated', width: 115, render: (v: number) => `$${v.toLocaleString()}` },
    { title: '费率(%)', dataIndex: 'feeRate', key: 'feeRate', width: 80, render: (v: number) => `${v}%` },
    {
      title: '跟单模式', dataIndex: 'copyMode', key: 'copyMode', width: 95,
      render: (m: string) => <Tag color="purple">{copyModeMap[m]}</Tag>,
    },
    {
      title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 90,
      render: (r: string) => <Tag color={riskMap[r]?.color}>{riskMap[r]?.label}</Tag>,
    },
    {
      title: '盈亏($)', dataIndex: 'pnl', key: 'pnl', width: 100,
      render: (v: number) => <span className={v >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{v >= 0 ? '+' : ''}$${v.toLocaleString()}</span>,
    },
    {
      title: 'ROI(%)', dataIndex: 'roi', key: 'roi', width: 80,
      render: (v: number) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? '+' : ''}{v}%</span>,
    },
    { title: '订阅日期', dataIndex: 'subscribeDate', key: 'subscribeDate', width: 110 },
    { title: '到期日期', dataIndex: 'expiryDate', key: 'expiryDate', width: 110 },
    {
      title: '自动续费', dataIndex: 'autoRenew', key: 'autoRenew', width: 85,
      render: (v: boolean) => v ? <Tag color="green">开启</Tag> : <Tag color="default">关闭</Tag>,
    },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedSub(record); setDetailModalOpen(true); } },
    {
      key: 'pause', label: '暂停',
      icon: <PauseCircleOutlined />,
      hidden: () => false,
      danger: true,
      onClick: (record: any) => message.warning(`已暂停 ${record.userName} 的跟单服务`),
    },
    { key: 'renew', label: '续费', icon: <SyncOutlined />, onClick: (record: any) => message.success(`${record.userName} 续费操作已发起`) },
    { key: 'log', label: '日志', icon: <FileTextOutlined />, onClick: (record: any) => message.info(`查看 ${record.userName} 跟单日志`) },
  ];

  const historyColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '操作类型', dataIndex: 'action', key: 'action', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
    { title: '结果', dataIndex: 'result', key: 'result', width: 80, render: (r: string) => <Tag color={r === '成功' ? 'green' : r === '预警' ? 'orange' : 'red'}>{r}</Tag> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <TeamOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
              <h1 className="text-2xl font-bold m-0">跟单订阅管理</h1>
              <Tag color="#F0B90B" style={{ border: 'none', color: '#000', fontWeight: 600 }}>AIOPC</Tag>
            </div>
            <p className="text-gray-500 text-sm mt-2 ml-11">智能跟单订阅平台 · 策略跟随/资金分配/风控联动 · Powered by AIOPC</p>
          </div>
          <Space>
            <Button icon={<SyncOutlined />}>刷新数据</Button>
            <Button type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ThunderboltOutlined />}>新建订阅</Button>
          </Space>
        </div>

        {/* DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="订阅总数" value={mockSubscriptions.length} icon={<TeamOutlined />} color="#1677FF" description="全部订阅记录" />
          <DataCard title="活跃订阅" value={activeCount} icon={<RiseOutlined />} color="#16A34A" suffix={`/${mockSubscriptions.length}`} description="正在运行中" />
          <DataCard title="本月新增" value={monthNewCount} icon={<UserOutlined />} color="#7C3AED" description="近30天新增" trend="up" trendValue="+2" />
          <DataCard title="总管理资产(AUM)" value={`${(totalAUM / 10000).toFixed(0)}万`} prefix="$" icon={<DollarOutlined />} color="#F59E0B" description="活跃用户资金池" />
          <DataCard title="平均ROI" value={avgRoi} suffix="%" icon={<SafetyCertificateOutlined />} color="#F0B90B" description="活跃用户均值" />
        </div>

        {/* 筛选栏 */}
        <Card size="small">
          <Space wrap>
            <Select placeholder="订阅等级" allowClear value={tierFilter || undefined} onChange={setTierFilter} style={{ width: 130 }}>
              <Option value="free">免费版</Option>
              <Option value="pro">专业版</Option>
              <Option value="enterprise">企业版</Option>
            </Select>
            <Select placeholder="订阅状态" allowClear value={statusFilter || undefined} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="active">活跃</Option>
              <Option value="paused">已暂停</Option>
              <Option value="expired">已过期</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Select placeholder="跟单模式" allowClear value={modeFilter || undefined} onChange={setModeFilter} style={{ width: 130 }}>
              <Option value="fixed">固定金额</Option>
              <Option value="ratio">比例跟单</Option>
              <Option value="signal">信号跟随</Option>
            </Select>
            <Tag icon={<FilterOutlined />} color="processing">共 {filteredData.length} 条</Tag>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="subId" actions={actions} />

        {/* 详情弹窗 */}
        <Modal
          title={
            <Space>
              <UserOutlined />
              <span>{selectedSub?.userName} 的订阅详情</span>
              <Tag color={tierMap[selectedSub?.tier]?.color}>{tierMap[selectedSub?.tier]?.label}</Tag>
            </Space>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="pause" danger icon={<PauseCircleOutlined />}>
              {selectedSub?.status === 'active' ? '暂停订阅' : '恢复订阅'}
            </Button>,
            <Button key="renew" type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<SyncOutlined />}>立即续费</Button>,
          ]}
          width={850}
        >
          {selectedSub && (
            <div className="space-y-4">
              {/* 用户信息 */}
              <Card size="small" title="用户基本信息">
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="用户ID">{selectedSub.userId}</Descriptions.Item>
                  <Descriptions.Item label="用户名"><span className="font-semibold text-lg">{selectedSub.userName}</span></Descriptions.Item>
                  <Descriptions.Item label="订阅ID">{selectedSub.subId}</Descriptions.Item>
                  <Descriptions.Item label="订阅等级"><Tag color={tierMap[selectedSub.tier]?.color} style={{ fontWeight: 600 }}>{tierMap[selectedSub.tier]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="当前状态"><Tag color={statusMap[selectedSub.status]?.color}>{statusMap[selectedSub.status]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="自动续费">{selectedSub.autoRenew ? <Tag color="green">已开启</Tag> : <Tag>已关闭</Tag>}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 策略配置 */}
              <Card size="small" title="跟单策略配置">
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="跟单策略"><span className="text-blue-600 font-semibold">{selectedSub.strategyName}</span></Descriptions.Item>
                  <Descriptions.Item label="跟单模式"><Tag color="purple">{copyModeMap[selectedSub.copyMode]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="风险等级"><Tag color={riskMap[selectedSub.riskLevel]?.color}>{riskMap[selectedSub.riskLevel]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="分配资金"><span className="font-semibold">${selectedSub.capitalAllocated.toLocaleString()}</span></Descriptions.Item>
                  <Descriptions.Item label="服务费率"><span className="font-semibold">{selectedSub.feeRate}%</span></Descriptions.Item>
                  <Descriptions.Item label="订阅周期">{selectedSub.subscribeDate} ~ {selectedSub.expiryDate}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 收益分析 */}
              <Card size="small" title="收益分析概览">
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="累计盈亏"><span className={`font-bold text-lg ${selectedSub.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedSub.pnl >= 0 ? '+' : ''}${selectedSub.pnl.toLocaleString()}</span></Descriptions.Item>
                  <Descriptions.Item label="ROI收益率"><span className={`font-bold ${selectedSub.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedSub.roi > 0 ? '+' : ''}{selectedSub.roi}%</span></Descriptions.Item>
                  <Descriptions.Item label="本月预估费用"><span className="text-orange-500">${(selectedSub.capitalAllocated * selectedSub.feeRate / 100).toFixed(0)}</span></Descriptions.Item>
                  <Descriptions.Item label="剩余天数"><span className="font-semibold">{Math.max(0, Math.floor((new Date(selectedSub.expiryDate).getTime() - Date.now()) / 86400000))}天</span></Descriptions.Item>
                </Descriptions>
              </Card>

              {/* AIOPC风险提示 */}
              <Card size="small" title={<Space><SafetyCertificateOutlined style={{ color: '#F0B90B' }} /><span>AIOPC 风控提示</span></Space>} style={{ borderColor: selectedSub.riskLevel === 'high' ? '#DC2626' : '#F0B90B' }}>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 w-20">风险评级:</span>
                    <Progress
                      percent={selectedSub.riskLevel === 'low' ? 25 : selectedSub.riskLevel === 'medium' ? 55 : 85}
                      strokeColor={selectedSub.riskLevel === 'low' ? '#16A34A' : selectedSub.riskLevel === 'medium' ? '#F59E0B' : '#DC2626'}
                      format={() => <span className="font-semibold">{riskMap[selectedSub.riskLevel]?.label}</span>}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedSub.riskLevel === 'high'
                      ? `⚠️ 高风险预警：该用户采用${copyModeMap[selectedSub.copyMode]}模式，资金规模$${(selectedSub.capitalAllocated / 10000).toFixed(0)}万，当前亏损$${Math.abs(selectedSub.pnl).toLocaleString()}。AIOPC建议：降低跟单比例至50%以下，或切换为信号跟随模式以降低风险敞口。`
                      : selectedSub.riskLevel === 'medium'
                        ? `中等风险：当前配置较为均衡，建议持续监控ROI波动。如连续3个交易日亏损超过2%，系统将自动触发风控提醒。`
                        : `低风险：该用户跟单配置稳健，AIOPC评估通过。可适当提高资金利用率以获取更高收益，但需注意市场极端行情下的保护机制。`}
                  </p>
                </div>
              </Card>

              {/* 订阅历史 */}
              <Card size="small" title="订阅操作历史">
                <Table dataSource={mockSubHistory} columns={historyColumns} rowKey="time" pagination={false} size="small" />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
