'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert, Switch,
} from 'antd';
import {
  SwapOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ToolOutlined,
  TeamOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface TradingPair {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'online' | 'maintenance' | 'delisted';
  volume24h: number;
  minTradeAmount: number;
  pricePrecision: number;
  quantityPrecision: number;
  makerFee: number;
  takerFee: number;
  marketMakerCount: number;
  lastTradeTime: string;
  listedAt: string;
  description: string;
}


export default function PairsPage() {
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/cex/pairs', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const statusMap: Record<string, TradingPair['status']> = {
          active: 'online', online: 'online',
          suspended: 'maintenance', maintenance: 'maintenance',
          inactive: 'delisted', delisted: 'delisted',
        };
        const items: TradingPair[] = (d?.data ?? []).map((p: any) => ({
          id: p.id,
          symbol: p.symbol,
          baseAsset: p.base,
          quoteAsset: p.quote,
          status: statusMap[p.status] ?? 'online',
          volume24h: 0,
          minTradeAmount: parseFloat(p.minOrderAmount) || 0,
          pricePrecision: p.quotePrecision ?? 2,
          quantityPrecision: p.basePrecision ?? 6,
          makerFee: parseFloat(p.makerFeeRate) || 0,
          takerFee: parseFloat(p.takerFeeRate) || 0,
          marketMakerCount: 0,
          lastTradeTime: '-',
          listedAt: p.createdAt?.slice(0, 10) ?? '-',
          description: `${p.base}/${p.quote} 交易对`,
        }));
        setPairs(items);
      })
      .catch(() => setPairs([]))
      .finally(() => setLoading(false));
  }, []);

  const onlineCount = pairs.filter(p => p.status === 'online').length;
  const pendingReview = 0;
  const todayVolume = pairs.reduce((sum, p) => sum + p.volume24h, 0);
  const avgMinTrade = pairs.length > 0 ? Math.min(...pairs.map(p => p.minTradeAmount)) : 0;
  const totalMM = pairs.reduce((sum, p) => sum + p.marketMakerCount, 0);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      online: { status: 'success', text: '上线' },
      maintenance: { status: 'warning', text: '维护中' },
      delisted: { status: 'default', text: '已下架' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: TradingPair) => { setSelectedPair(record); setDetailModalVisible(true); };

  const columns = [
    { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 130, render: (sym: string) => <Text code className="text-sm font-mono font-bold">{sym}</Text> },
    { title: '基础资产', dataIndex: 'baseAsset', key: 'baseAsset', width: 100, render: (a: string) => <Tag color="blue">{a}</Tag> },
    { title: '计价资产', dataIndex: 'quoteAsset', key: 'quoteAsset', width: 100, render: (a: string) => <Tag color="green">{a}</Tag> },
    { title: '状态', key: 'status', width: 90, render: (_: any, r: TradingPair) => getStatusBadge(r.status) },
    { title: '24H成交量', dataIndex: 'volume24h', key: 'volume24h', width: 140, render: (v: number) => <span className="font-mono">${(v / 1000000).toFixed(1)}M</span> },
    { title: '最小交易额', dataIndex: 'minTradeAmount', key: 'minTradeAmount', width: 110, render: (v: number) => <span className="font-mono">${v} USDT</span> },
    { title: '手续费率', key: 'fees', width: 130, render: (_: any, r: TradingPair) => (<div className="flex flex-col text-xs"><span>M:{(r.makerFee * 100).toFixed(2)}%</span><span>T:{(r.takerFee * 100).toFixed(2)}%</span></div>) },
    { title: '做市商', dataIndex: 'marketMakerCount', key: 'marketMakerCount', width: 90, render: (n: number) => <Tag color="purple">{n}家</Tag> },
    { title: '最后成交', dataIndex: 'lastTradeTime', key: 'lastTradeTime', width: 150, render: (t: string) => <span className="text-xs text-gray-500">{t}</span> },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '编辑', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><SwapOutlined style={{ color: '#1677FF' }} /> 交易对配置</h1><p className="text-gray-500 mt-1">交易对管理 · 参数配置 · 上下架控制 · 手续费设置</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>上架新交易对</Button><Button icon={<ReloadOutlined />}>刷新</Button><Button icon={<SettingOutlined />}>批量操作</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="上线交易对" value={onlineCount} suffix="对" icon={<CheckCircleOutlined />} color="#16A34A" trend="up" trendValue="+2" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="待审核" value={pendingReview} suffix="对" icon={<ToolOutlined />} color="#F59E0B" trend="none" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="今日成交量" value={`${(todayVolume / 1000000000).toFixed(1)}B`} suffix=" USDT" icon={<LineChartOutlined />} color="#7C3AED" trend="up" trendValue="+18%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="最小交易额" value={`$${avgMinTrade}`} suffix="" icon={<DollarOutlined />} color="#DC2626" trend="none" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="做市商总数" value={totalMM} suffix="家" icon={<TeamOutlined />} color="#EC4899" trend="up" trendValue="+3" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={pairs} loading={loading} rowKey="id" title="交易对配置列表" searchPlaceholder="搜索交易对名称..." actions={actions} pagination={{ pageSize: 10 }} showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '上线', value: 'online' }, { label: '维护中', value: 'maintenance' }, { label: '已下架', value: 'delisted' }]} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><ThunderboltOutlined style={{ color: '#1677FF' }} /> 交易对状态统计</span>} className="shadow-sm">
              <div className="space-y-3">
                {[{ l: '正常上线', c: '#16A34A', n: pairs.filter(p => p.status === 'online').length }, { l: '维护中', c: '#F59E0B', n: pairs.filter(p => p.status === 'maintenance').length }, { l: '已下架', c: '#9CA3AF', n: pairs.filter(p => p.status === 'delisted').length }].map(item => (<div key={item.l}><div className="flex justify-between mb-1"><span>{item.l}</span><span style={{ color: item.c }} className="font-semibold">{item.n} 对</span></div><Progress percent={pairs.length > 0 ? (item.n / pairs.length) * 100 : 0} strokeColor={item.c} showInfo={false} /></div>))}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><DashboardOutlined style={{ color: '#7C3AED' }} /> 配置规范说明</span>} className="shadow-sm">
              <List size="small" dataSource={[
                { t: '价格精度范围', d: '支持2-8位小数，根据币种市值自动推荐' },
                { t: '数量精度范围', d: '支持0-8位小数，需考虑最小交易单位' },
                { t: '手续费率标准', d: 'Maker默认0.1%，Taker默认0.1%-0.2%' },
                { t: '上下架流程', d: '需经过技术评审→安全审计→运营审批三步' },
                { t: '维护窗口', d: '建议在低峰时段执行，提前24小时公告' },
              ]} renderItem={item => (<List.Item><div><div className="font-medium text-sm">{item.t}</div><div className="text-xs text-gray-500">{item.d}</div></div></List.Item>)} />
            </Card>
          </Col>
        </Row>

        <Modal title={`交易对详情 - ${selectedPair?.symbol}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={650} footer={<Space><Button icon={<EditOutlined />}>编辑配置</Button><Button type="primary" icon={<EyeOutlined />}>K线图表</Button></Space>}>
          {selectedPair && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="交易对ID"><Text strong className="text-blue-600">{selectedPair.id}</Text></Descriptions.Item>
              <Descriptions.Item label="交易对符号"><Text code className="text-lg font-bold">{selectedPair.symbol}</Text></Descriptions.Item>
              <Descriptions.Item label="基础资产"><Tag color="blue">{selectedPair.baseAsset}</Tag></Descriptions.Item>
              <Descriptions.Item label="计价资产"><Tag color="green">{selectedPair.quoteAsset}</Tag></Descriptions.Item>
              <Descriptions.Item label="当前状态">{getStatusBadge(selectedPair.status)}</Descriptions.Item>
              <Descriptions.Item label="上架时间">{selectedPair.listedAt}</Descriptions.Item>
              <Descriptions.Item label="价格精度">{selectedPair.pricePrecision} 位小数</Descriptions.Item>
              <Descriptions.Item label="数量精度">{selectedPair.quantityPrecision} 位小数</Descriptions.Item>
              <Descriptions.Item label="Maker费率">{(selectedPair.makerFee * 100).toFixed(2)}%</Descriptions.Item>
              <Descriptions.Item label="Taker费率">{(selectedPair.takerFee * 100).toFixed(2)}%</Descriptions.Item>
              <Descriptions.Item label="最小交易额">$ {selectedPair.minTradeAmount} USDT</Descriptions.Item>
              <Descriptions.Item label="做市商数量"><Tag color="purple">{selectedPair.marketMakerCount} 家</Tag></Descriptions.Item>
              <Descriptions.Item label="24H成交量" span={2}>{selectedPair.volume24h > 0 ? `$${(selectedPair.volume24h / 1000000).toFixed(1)}M` : '-'}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selectedPair.description}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
