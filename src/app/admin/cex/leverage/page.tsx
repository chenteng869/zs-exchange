'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert,
} from 'antd';
import {
  FundOutlined,
  DollarOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
  AimOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface LeverageAccount {
  id: string;
  userId: string;
  nickname: string;
  totalAssets: number;
  borrowedAmount: number;
  healthScore: number;
  liquidationPrice: number;
  interestRate: number;
  dailyInterest: number;
  leverageLevel: number;
  collateralValue: number;
  status: 'healthy' | 'caution' | 'danger' | 'liquidated';
  openSince: string;
}

export default function LeveragePage() {
  const [selectedAccount, setSelectedAccount] = useState<LeverageAccount | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [accounts, setAccounts] = useState<LeverageAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/cex/leverage?pageSize=100', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setAccounts(d?.data?.items ?? []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, []);


  const totalAssets = accounts.reduce((sum, a) => sum + a.totalAssets, 0);
  const totalBorrowed = accounts.reduce((sum, a) => sum + a.borrowedAmount, 0);
  const avgHealth = (accounts.reduce((sum, a) => sum + a.healthScore, 0) / accounts.length).toFixed(1);
  const dangerCount = accounts.filter(a => a.status === 'danger').length;
  const totalInterest = accounts.reduce((sum, a) => sum + a.dailyInterest, 0);

  const getHealthColor = (score: number) => score >= 85 ? '#16A34A' : score >= 70 ? '#F59E0B' : score >= 55 ? '#F97316' : '#DC2626';

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      healthy: { status: 'success', text: '健康' },
      caution: { status: 'warning', text: '注意' },
      danger: { status: 'error', text: '危险' },
      liquidated: { status: 'default', text: '已强平' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: LeverageAccount) => { setSelectedAccount(record); setDetailModalVisible(true); };

  const columns = [
    { title: '账户ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => <Text code className="text-xs">{id}</Text> },
    { title: '用户昵称', dataIndex: 'nickname', key: 'nickname', width: 160, render: (name: string) => (<div className="flex items-center gap-2"><UserOutlined className="text-blue-500" /><span className="font-medium text-sm">{name}</span></div>) },
    { title: '总资产', dataIndex: 'totalAssets', key: 'totalAssets', width: 140, render: (v: number) => <span className="font-mono font-semibold">${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
    { title: '借贷余额', dataIndex: 'borrowedAmount', key: 'borrowedAmount', width: 130, render: (v: number) => <span className="font-mono text-red-500">-${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> },
    { title: '健康度', key: 'health', width: 160, render: (_: any, r: LeverageAccount) => (<div className="flex items-center gap-2"><Progress percent={r.healthScore} size="small" strokeColor={getHealthColor(r.healthScore)} className="flex-1" showInfo={false} /><span className="text-xs font-bold w-10" style={{ color: getHealthColor(r.healthScore) }}>{r.healthScore}%</span></div>) },
    { title: '杠杆倍数', dataIndex: 'leverageLevel', key: 'leverageLevel', width: 100, render: (lev: number) => <Tag color={lev <= 2 ? 'green' : lev <= 5 ? 'orange' : 'red'}>{lev}x</Tag> },
    { title: '日利息', dataIndex: 'dailyInterest', key: 'dailyInterest', width: 110, render: (v: number) => <span className="font-mono text-sm">${v.toFixed(2)}</span> },
    { title: '强平价', dataIndex: 'liquidationPrice', key: 'liquidationPrice', width: 110, render: (p: number) => <span className="font-mono text-red-600">${p.toLocaleString()}</span> },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: LeverageAccount) => getStatusBadge(r.status) },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '调整', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><FundOutlined style={{ color: '#7C3AED' }} /> 杠杆交易管理</h1><p className="text-gray-500 mt-1">杠杆账户管理 · 风险评估 · 强平线监控 · 利息结算</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>开通杠杆</Button><Button icon={<ReloadOutlined />}>刷新</Button>{dangerCount > 0 && <Button icon={<WarningOutlined />} danger>{dangerCount}个强平预警</Button>}</Space>
        </div>

        {dangerCount > 0 && <Alert message={`检测到 ${dangerCount} 个账户健康度低于55%，存在强平风险，需立即关注`} type="error" showIcon icon={<WarningOutlined />} action={<Button size="small">查看详情</Button>} />}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="杠杆总资产" value={`${(totalAssets / 1000000).toFixed(1)}M`} suffix=" USDT" icon={<DollarOutlined />} color="#1677FF" trend="up" trendValue="+15.2%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="借贷余额" value={`${(totalBorrowed / 1000000).toFixed(1)}M`} suffix=" USDT" icon={<DollarOutlined />} color="#DC2626" trend="up" trendValue="+8.7%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="平均健康度" value={avgHealth} suffix="" icon={<SafetyCertificateOutlined />} color="#16A34A" trend="down" trendValue="-2.1" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="强平预警数" value={dangerCount} suffix="个" icon={<WarningOutlined />} color="#DC2626" trend={dangerCount > 0 ? 'up' : 'none'} /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="今日利息支出" value={`$${(totalInterest).toFixed(0)}`} suffix="" icon={<LineChartOutlined />} color="#F59E0B" trend="up" trendValue="+3.5%" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={accounts}
            loading={loading} rowKey="id" title="杠杆账户列表" searchPlaceholder="搜索用户昵称或账户ID..." actions={actions} pagination={{ pageSize: 10 }} showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '健康', value: 'healthy' }, { label: '注意', value: 'caution' }, { label: '危险', value: 'danger' }, { label: '已强平', value: 'liquidated' }]} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><ThunderboltOutlined style={{ color: '#DC2626' }} /> 杠杆风险分布</span>} className="shadow-sm">
              <div className="space-y-3">
                {[{ l: '健康(≥85%)', c: '#16A34A', n: accounts.filter(a => a.status === 'healthy').length }, { l: '注意(70-84%)', c: '#F59E0B', n: accounts.filter(a => a.status === 'caution').length }, { l: '危险(&lt;55%)', c: '#DC2626', n: accounts.filter(a => a.status === 'danger').length }].map(item => (<div key={item.l}><div className="flex justify-between mb-1"><span>{item.l}</span><span style={{ color: item.c }} className="font-semibold">{item.n} 个</span></div><Progress percent={(item.n / accounts.length) * 100} strokeColor={item.c} showInfo={false} /></div>))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><AimOutlined style={{ color: '#1677FF' }} /> 杠杆参数配置</span>} className="shadow-sm">
              <List size="small" dataSource={[
                { t: '最大初始杠杆', v: '10x' }, { t: '最低健康度阈值', v: '110%' }, { t: '强制平仓线', v: '105%' }, { t: '追加保证金线', v: '125%' }, { t: '最高借款限额', v: '$5,000,000/户' }, { t: '年化利率范围', v: '2.2% ~ 18.0%' },
              ]} renderItem={item => (<List.Item><div className="flex justify-between w-full"><span className="text-gray-600">{item.t}</span><span className="font-semibold">{item.v}</span></div></List.Item>)} />
            </Card>
          </Col>
        </Row>

        <Modal title={`杠杆账户详情 - ${selectedAccount?.nickname}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={<Space><Button icon={<EditOutlined />}>调整仓位</Button><Button type="primary" icon={<EyeOutlined />}>查看明细</Button></Space>}>
          {selectedAccount && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="账户ID"><Text strong className="text-blue-600">{selectedAccount.id}</Text></Descriptions.Item>
              <Descriptions.Item label="用户ID"><Text code>{selectedAccount.userId}</Text></Descriptions.Item>
              <Descriptions.Item label="用户昵称">{selectedAccount.nickname}</Descriptions.Item>
              <Descriptions.Item label="账户状态">{getStatusBadge(selectedAccount.status)}</Descriptions.Item>
              <Descriptions.Item label="总资产"><span className="font-mono font-bold text-lg">${selectedAccount.totalAssets.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></Descriptions.Item>
              <Descriptions.Item label="借贷金额"><span className="font-mono font-bold text-red-500">${selectedAccount.borrowedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></Descriptions.Item>
              <Descriptions.Item label="抵押品价值"><span className="font-mono">${selectedAccount.collateralValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></Descriptions.Item>
              <Descriptions.Item label="当前杠杆"><Tag color={selectedAccount.leverageLevel <= 2 ? 'green' : selectedAccount.leverageLevel <= 5 ? 'orange' : 'red'}>{selectedAccount.leverageLevel}x</Tag></Descriptions.Item>
              <Descriptions.Item label="健康度"><Progress percent={selectedAccount.healthScore} format={() => `${selectedAccount.healthScore}%`} strokeColor={getHealthColor(selectedAccount.healthScore)} /></Descriptions.Item>
              <Descriptions.Item label="强平价格"><span className="font-mono text-red-600">${selectedAccount.liquidationPrice.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="年化利率"><span className="font-mono">{(selectedAccount.interestRate * 100).toFixed(2)}%</span></Descriptions.Item>
              <Descriptions.Item label="每日利息"><span className="font-mono">${selectedAccount.dailyInterest.toFixed(2)}</span></Descriptions.Item>
              <Descriptions.Item label="开户时间" span={2}>{selectedAccount.openSince}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
