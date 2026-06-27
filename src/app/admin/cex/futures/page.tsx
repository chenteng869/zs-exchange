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
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  FundOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  AimOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface FuturesContract {
  id: string;
  symbol: string;
  name: string;
  underlying: string;
  leverage: number;
  positionSize: number;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
  liquidationPrice: number;
  direction: 'long' | 'short' | 'neutral';
  status: 'active' | 'suspended' | 'settled';
  marginRatio: number;
  pnl24h: number;
}

export default function FuturesPage() {
  const [selectedContract, setSelectedContract] = useState<FuturesContract | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [futures, setFutures] = useState<FuturesContract[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/cex/futures', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFutures(d?.data ?? []))
      .catch(() => setFutures([]))
      .finally(() => setLoading(false));
  }, []);


  const totalPosition = futures.reduce((sum, f) => sum + f.positionSize, 0);
  const totalMargin = 158500000;
  const todayVolume = futures.reduce((sum, f) => sum + f.volume24h, 0);
  const liqWarning = futures.filter(f => f.marginRatio < 85).length;
  const feeIncome = 2450000;

  const getDirectionTag = (dir: string) => {
    switch (dir) {
      case 'long': return <Tag icon={<RiseOutlined />} color="green">做多</Tag>;
      case 'short': return <Tag icon={<FallOutlined />} color="red">做空</Tag>;
      default: return <Tag color="default">中性</Tag>;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      active: { status: 'success', text: '正常交易' },
      suspended: { status: 'warning', text: '已暂停' },
      settled: { status: 'default', text: '已结算' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: FuturesContract) => { setSelectedContract(record); setDetailModalVisible(true); };

  const columns = [
    { title: '合约标识', dataIndex: 'symbol', key: 'symbol', width: 170, render: (sym: string) => <Text code className="text-xs font-mono">{sym}</Text> },
    { title: '合约名称', dataIndex: 'name', key: 'name', width: 160, render: (n: string) => <span className="font-medium">{n}</span> },
    { title: '标的资产', dataIndex: 'underlying', key: 'underlying', width: 100, render: (u: string) => <Tag color="blue">{u}</Tag> },
    { title: '杠杆倍数', dataIndex: 'leverage', key: 'leverage', width: 100, render: (lev: number) => <span className="font-bold font-mono">{lev}x</span> },
    { title: '持仓量', dataIndex: 'positionSize', key: 'positionSize', width: 110, render: (size: number) => <span className="font-mono text-sm">{size.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span> },
    { title: '标记价格', dataIndex: 'markPrice', key: 'markPrice', width: 120, render: (price: number) => <span className="font-mono">${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> },
    { title: '多空方向', key: 'direction', width: 90, render: (_: any, r: FuturesContract) => getDirectionTag(r.direction) },
    { title: '资金费率', dataIndex: 'fundingRate', key: 'fundingRate', width: 100, render: (rate: number) => <span className={`font-mono ${rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : ''}`}>{(rate * 100).toFixed(4)}%</span> },
    { title: '保证金率', dataIndex: 'marginRatio', key: 'marginRatio', width: 130, render: (ratio: number) => (<div className="flex items-center gap-2"><Progress percent={ratio} size="small" strokeColor={ratio >= 90 ? '#16A34A' : ratio >= 75 ? '#F59E0B' : '#DC2626'} className="flex-1" showInfo={false} /><span className="text-xs w-10">{ratio}%</span></div>) },
    { title: '状态', key: 'status', width: 100, render: (_: any, r: FuturesContract) => getStatusBadge(r.status) },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '编辑', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><ThunderboltOutlined style={{ color: '#F59E0B' }} /> 合约交易管理</h1><p className="text-gray-500 mt-1">合约产品管理 · 持仓监控 · 保证金管理 · 风险预警</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>上架新合约</Button><Button icon={<ReloadOutlined />}>刷新</Button><Button icon={<WarningOutlined />} danger>{liqWarning}个爆仓预警</Button></Space>
        </div>

        {liqWarning > 0 && <Alert message={`当前有 ${liqWarning} 个合约保证金率低于安全阈值(85%)，存在爆仓风险`} type="error" showIcon icon={<WarningOutlined />} action={<Button size="small">立即处理</Button>} />}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="总持仓量" value={`${(totalPosition / 10000).toFixed(1)}万`} suffix="" icon={<FundOutlined />} color="#1677FF" trend="up" trendValue="+8.5%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="保证金余额" value={`${(totalMargin / 1000000).toFixed(1)}M`} suffix=" USDT" icon={<DollarOutlined />} color="#16A34A" trend="up" trendValue="+12.3%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="今日成交额" value={`${(todayVolume / 1000000000).toFixed(1)}B`} suffix=" USDT" icon={<LineChartOutlined />} color="#7C3AED" trend="up" trendValue="+22.1%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="爆仓预警数" value={liqWarning} suffix="个" icon={<WarningOutlined />} color="#DC2626" trend={liqWarning > 0 ? 'up' : 'none'} trendValue={liqWarning > 0 ? '+2' : undefined} /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="费率收入" value={`${(feeIncome / 1000).toFixed(0)}K`} suffix=" USDT" icon={<DollarOutlined />} color="#F59E0B" trend="up" trendValue="+5.8%" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={futures}
            loading={loading} rowKey="id" title="合约产品列表" searchPlaceholder="搜索合约名称或标的..." actions={actions} pagination={{ pageSize: 10 }} showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '正常交易', value: 'active' }, { label: '已暂停', value: 'suspended' }, { label: '已结算', value: 'settled' }]} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><SafetyCertificateOutlined style={{ color: '#1677FF' }} /> 合约风控指标</span>} className="shadow-sm">
              <List size="small" dataSource={[
                { t: '全仓保证金充足率', v: '92.5%', c: '#16A34A' },
                { t: '最大持仓集中度', v: '18.3%', c: '#F59E0B' },
                { t: '系统风险准备金', v: '$12.5M', c: '#16A34A' },
                { t: '今日爆仓损失', v: '$0.0', c: '#16A34A' },
                { t: 'ADL队列深度', v: 'Level 1', c: '#1677FF' },
              ]} renderItem={item => (<List.Item><div className="flex justify-between w-full"><span>{item.t}</span><span className="font-semibold" style={{ color: item.c }}>{item.v}</span></div></List.Item>)} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><AimOutlined style={{ color: '#7C3AED' }} /> 多空持仓分布</span>} className="shadow-sm">
              <div className="space-y-4">
                {[{ n: 'BTC永续', longPct: 62, shortPct: 38 }, { n: 'ETH永续', longPct: 45, shortPct: 55 }, { n: 'SOL永续', longPct: 71, shortPct: 29 }].map(item => (
                  <div key={item.n}>
                    <div className="flex justify-between mb-1 text-sm"><span className="font-medium">{item.n}</span><span className="text-gray-500">多{item.longPct}% / 空{item.shortPct}%</span></div>
                    <Progress percent={item.longPct} strokeColor="#16A34A" showInfo={false} success={{ percent: item.shortPct, strokeColor: '#DC2626' }} />
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`合约详情 - ${selectedContract?.name}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={<Space><Button icon={<EditOutlined />}>编辑参数</Button><Button type="primary" icon={<EyeOutlined />}>查看深度</Button></Space>}>
          {selectedContract && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="合约ID"><Text strong className="text-blue-600">{selectedContract.id}</Text></Descriptions.Item>
              <Descriptions.Item label="交易对"><Tag color="blue">{selectedContract.symbol}</Tag></Descriptions.Item>
              <Descriptions.Item label="标的资产"><Tag>{selectedContract.underlying}</Tag></Descriptions.Item>
              <Descriptions.Item label="最大杠杆"><span className="font-bold text-lg">{selectedContract.leverage}x</span></Descriptions.Item>
              <Descriptions.Item label="标记价格"><span className="font-mono font-bold">${selectedContract.markPrice.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="指数价格"><span className="font-mono">${selectedContract.indexPrice.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="资金费率"><span className={`${selectedContract.fundingRate > 0 ? 'text-green-600' : 'text-red-600'} font-mono`}>{(selectedContract.fundingRate * 100).toFixed(4)}%</span></Descriptions.Item>
              <Descriptions.Item label="多空方向">{getDirectionTag(selectedContract.direction)}</Descriptions.Item>
              <Descriptions.Item label="持仓量" span={2}>{selectedContract.positionSize.toLocaleString()} 张</Descriptions.Item>
              <Descriptions.Item label="未平仓量" span={2}>{(selectedContract.openInterest / 1000000).toFixed(0)}M USDT</Descriptions.Item>
              <Descriptions.Item label="24H成交量" span={2}>{(selectedContract.volume24h / 1000000000).toFixed(2)}B USDT</Descriptions.Item>
              <Descriptions.Item label="强平价格"><span className="text-red-600 font-mono">${selectedContract.liquidationPrice.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="保证金率"><Progress percent={selectedContract.marginRatio} size="small" format={() => `${selectedContract.marginRatio}%`} strokeColor={selectedContract.marginRatio >= 90 ? '#16A34A' : '#F59E0B'} /></Descriptions.Item>
              <Descriptions.Item label="24H盈亏"><span className={`font-bold ${selectedContract.pnl24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedContract.pnl24h >= 0 ? '+' : ''}{selectedContract.pnl24h}%</span></Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>{getStatusBadge(selectedContract.status)}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
