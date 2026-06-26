'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Space, Select, Statistic, Badge, List, Typography } from 'antd';
import {
  GlobalOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  FireOutlined,
  EyeOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
const { Text } = Typography;

// 风险热点接口
interface RiskHotspot {
  id: string;
  region: string;
  country: string;
  coordinates: [number, number];
  riskScore: number; // 0-100
  riskLevel: 'extreme' | 'high' | 'medium' | 'low';
  eventCount: number;
  topEventTypes: string[];
  trend: 'rising' | 'stable' | 'falling';
  description: string;
}

// 风险事件标注
interface RiskEventMarker {
  id: string;
  title: string;
  region: string;
  coordinates: [number, number];
  level: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  time: string;
  status: string;
}

// 模拟风险热点数据
const mockRiskHotspots: RiskHotspot[] = [
  { id: 'RS-001', region: '东亚', country: '中国', coordinates: [104.2, 35.8], riskScore: 78, riskLevel: 'high', eventCount: 156, topEventTypes: ['DDoS攻击', '钓鱼网站', '恶意爬虫'], trend: 'rising', description: '针对加密货币交易所的攻击活动显著增加，钓鱼域名数量月增40%' },
  { id: 'RS-002', region: '北美', country: '美国', coordinates: [-98.5, 39.8], riskScore: 85, riskLevel: 'high', eventCount: 234, topEventTypes: ['APT攻击', '勒索软件', '数据泄露'], trend: 'stable', description: 'Lazarus等APT组织活跃，勒索软件LockBit新变种传播迅速' },
  { id: 'RS-003', region: '西欧', country: '德国/法国', coordinates: [6.5, 48.5], riskScore: 62, riskLevel: 'medium', eventCount: 89, topEventTypes: ['GDPR合规', '扫描探测', 'API滥用'], trend: 'falling', description: '整体风险有所下降，但需关注新兴DeFi协议攻击' },
  { id: 'RS-004', region: '东南亚', country: '新加坡/越南', coordinates: [108.0, 8.0], riskScore: 71, riskLevel: 'high', eventCount: 112, topEventTypes: ['金融诈骗', '社交工程', '移动端攻击'], trend: 'rising', description: '加密货币相关诈骗案件激增，需加强用户安全教育' },
  { id: 'RS-005', region: '东欧', country: '俄罗斯', coordinates: [60.0, 60.0], riskScore: 92, riskLevel: 'extreme', eventCount: 312, topEventTypes: ['国家级攻击', '僵尸网络', '挖矿恶意软件'], trend: 'rising', description: '大规模僵尸网络和国家级攻击源集中区域，威胁等级极高' },
  { id: 'RS-006', region: '中东', country: '阿联酋/以色列', coordinates: [45.0, 25.0], riskScore: 55, riskLevel: 'medium', eventCount: 67, topEventTypes: ['APT攻击', '供应链攻击'], trend: 'stable', description: '区域性APT组织活动，主要针对金融机构' },
  { id: 'RS-007', region: '南美', country: '巴西', coordinates: [-55.0, -10.0], riskScore: 48, riskLevel: 'medium', eventCount: 45, topEventTypes: ['银行木马', '加密货币劫持'], trend: 'stable', description: '银行木马和加密货币挖矿恶意软件为主要威胁' },
  { id: 'RS-008', region: '大洋洲', country: '澳大利亚', coordinates: [134.0, -25.0], riskScore: 35, riskLevel: 'low', eventCount: 28, topEventTypes: ['扫描探测', '钓鱼邮件'], trend: 'falling', description: '整体安全态势良好，常规防护措施有效' },
];

// 风险事件地理标注
const mockRiskEvents: RiskEventMarker[] = [
  { id: 'RE-001', title: '大规模DDoS攻击源头', region: '莫斯科', coordinates: [37.6, 55.7], level: 'critical', type: 'DDoS攻击', time: '2024-06-08 13:00', status: 'active' },
  { id: 'RE-002', title: '钓鱼服务器集群', region: '洛杉矶', coordinates: [-118.2, 34.0], level: 'high', type: '钓鱼攻击', time: '2024-06-08 12:30', status: 'active' },
  { id: 'RE-003', title: '恶意IP段C&C', region: '阿姆斯特丹', coordinates: [4.9, 52.3], level: 'high', type: '僵尸网络', time: '2024-06-08 11:45', status: 'mitigated' },
  { id: 'RE-004', title: '合约漏洞利用节点', region: '未知(匿名)', coordinates: [0, 0], level: 'critical', type: '区块链攻击', time: '2024-06-08 11:20', status: 'active' },
  { id: 'RE-005', title: '数据泄露事件', region: '上海', coordinates: [121.4, 31.2], level: 'medium', type: '数据泄露', time: '2024-06-08 10:15', status: 'contained' },
  { id: 'RE-006', title: '扫描器活动密集区', region: '东京', coordinates: [139.7, 35.7], level: 'low', type: '扫描探测', time: '2024-06-08 09:30', status: 'blocked' },
];

// 全球风险地图配置
const riskMapOption = {
  backgroundColor: '#0a0e1a',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(20,20,30,0.95)',
    borderColor: '#333',
    textStyle: { color: '#fff', fontSize: 12 },
    formatter: (params: any) => {
      if (params.seriesType === 'effectScatter') {
        const d = params.data;
        return `<strong>${d.name}</strong><br/>风险评分: ${d.value[2]}<br/>事件数: ${d.eventCount || '-'}<br/>趋势: ${d.trend === 'rising' ? '📈 上升' : d.trend === 'falling' ? '📉 下降' : '➡️ 稳定'}`;
      }
      return params.name;
    },
  },
  geo: {
    map: 'world',
    roam: true,
    zoom: 1.2,
    itemStyle: {
      areaColor: '#1a1a2e',
      borderColor: '#16213e',
      borderWidth: 0.5,
    },
    emphasis: {
      itemStyle: { areaColor: '#0f3460' },
      label: { show: true, color: '#fff' },
    },
    regions: mockRiskHotspots.map(spot => ({
      name: spot.country,
      itemStyle: {
        areaColor: spot.riskScore >= 80 ? '#3d1111' : spot.riskScore >= 60 ? '#3d2000' : spot.riskScore >= 40 ? '#1a2e1a' : '#1a1a2e',
      },
    })),
  },
  series: [
    // 风险热力散点
    {
      type: 'effectScatter',
      coordinateSystem: 'geo',
      data: mockRiskHotspots.map(spot => ({
        name: `${spot.region} (${spot.country})`,
        value: [...spot.coordinates, spot.riskScore],
        eventCount: spot.eventCount,
        trend: spot.trend,
        symbolSize: Math.max(spot.riskScore / 4, 12),
        itemStyle: {
          color: spot.riskScore >= 80 ? '#DC2626' : spot.riskScore >= 60 ? '#F59E0B' : spot.riskScore >= 40 ? '#16A34A' : '#1677FF',
          shadowBlur: 10,
          shadowColor: spot.riskScore >= 70 ? 'rgba(255,77,79,0.5)' : 'rgba(250,173,20,0.3)',
        },
      })),
      showEffectOn: 'render',
      rippleEffect: { brushType: 'stroke', scale: spot => (spot.riskScore >= 70 ? 4 : 2) },
      label: { show: true, formatter: '{b}', color: '#ccc', fontSize: 9, position: 'right' },
      zlevel: 1,
    },
    // 具体事件标记点
    {
      type: 'scatter',
      coordinateSystem: 'geo',
      data: mockRiskEvents.filter(e => e.coordinates[0] !== 0).map(event => ({
        name: event.title,
        value: [...event.coordinates, 100],
        symbolSize: event.level === 'critical' ? 18 : event.level === 'high' ? 14 : 10,
        itemStyle: {
          color: event.level === 'critical' ? '#B91C1C' : event.level === 'high' ? '#DC2626' : event.level === 'medium' ? '#F59E0B' : '#1677FF',
          borderColor: '#fff',
          borderWidth: 1,
        },
        symbol: event.level === 'critical' ? 'diamond' : 'circle',
      })),
      zlevel: 2,
    },
  ],
};

// 区域风险排名表格列
const rankingColumns = [
  {
    title: '排名',
    key: 'rank',
    width: 60,
    render: (_: any, __: RiskHotspot, idx: number) => (
      <span className={`font-bold text-lg ${idx < 3 ? 'text-red-400' : 'text-gray-400'}`}>#{idx + 1}</span>
    ),
  },
  {
    title: '区域',
    key: 'region',
    render: (_: any, r: RiskHotspot) => (
      <div>
        <div className="font-medium">{r.region}</div>
        <div className="text-xs text-gray-500">{r.country}</div>
      </div>
    ),
  },
  {
    title: '风险评分',
    dataIndex: 'riskScore',
    key: 'riskScore',
    width: 100,
    render: (score: number) => (
      <div className="flex items-center gap-2">
        <span className={`font-bold ${score >= 80 ? 'text-red-400' : score >= 60 ? 'text-yellow-400' : score >= 40 ? 'text-blue-400' : 'text-green-400'}`}>
          {score}
        </span>
        <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${score >= 80 ? 'bg-red-500' : score >= 60 ? 'bg-yellow-500' : score >= 40 ? 'bg-blue-500' : 'bg-green-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    ),
  },
  {
    title: '风险等级',
    key: 'level',
    width: 90,
    render: (_: any, r: RiskHotspot) => {
      const configs: Record<string, { color: string; text: string }> = { extreme: { color: 'red', text: '极危' }, high: { color: 'orange', text: '高危' }, medium: { color: 'gold', text: '中危' }, low: { color: 'green', text: '低危' } };
      const c = configs[r.riskLevel];
      return <Tag color={c.color}>{c.text}</Tag>;
    },
  },
  { title: '事件数', dataIndex: 'eventCount', key: 'eventCount', width: 80, render: (v: number) => v.toLocaleString() },
  {
    title: '趋势',
    dataIndex: 'trend',
    key: 'trend',
    width: 80,
    render: (t: string) => (
      <span className={t === 'rising' ? 'text-red-400' : t === 'falling' ? 'text-green-400' : 'text-gray-400'}>
        {t === 'rising' ? <><RiseOutlined /> 上升</> : t === 'falling' ? <><FallOutlined /> 下降</> : <span>→ 稳定</span>}
      </span>
    ),
  },
];

export default function RiskMapPage() {
  const [regionFilter, setRegionFilter] = useState<string>('');

  const filteredHotspots = mockRiskHotspots.filter(h => !regionFilter || h.region.includes(regionFilter) || h.country.includes(regionFilter));

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0a0e1a] text-white -m-6 p-6">
        {/* 标题 */}
        <div className="flex items-center gap-3 mb-6">
          <GlobalOutlined className="text-3xl text-emerald-400" />
          <div>
            <h1 className="text-2xl font-bold m-0 bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">全球风险地图</h1>
            <p className="text-xs text-gray-500">GLOBAL RISK GEOGRAPHIC DISTRIBUTION MONITOR</p>
          </div>
        </div>

        {/* 统计概览 */}
        <Row gutter={[16, 16]} className="mb-6">
          {[
            { label: '监控区域', value: mockRiskHotspots.length, icon: <GlobalOutlined />, color: '#16A34A' },
            { label: '高危以上区域', value: mockRiskHotspots.filter(h => h.riskScore >= 60).length, icon: <WarningOutlined />, color: '#DC2626' },
            { label: '活跃风险事件', value: mockRiskEvents.filter(e => e.status === 'active').length, icon: <FireOutlined />, color: '#F59E0B' },
            { label: '平均风险评分', value: (mockRiskHotspots.reduce((s, h) => s + h.riskScore, 0) / mockRiskHotspots.length).toFixed(1), icon: <EnvironmentOutlined />, color: '#1677FF' },
          ].map((item, idx) => (
            <Col key={idx} xs={12} sm={6}>
              <Card className="bg-gray-900/50 border border-gray-700 rounded-lg" bordered={false}>
                <Statistic title={<span className="text-gray-400 text-sm">{item.label}</span>} value={item.value} prefix={item.icon} valueStyle={{ color: item.color }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 地图主体 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={17}>
            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg overflow-hidden" bordered={false} title={<span className="text-white">全球风险态势分布图</span>} extra={<Select placeholder="筛选区域" style={{ width: 140 }} allowClear value={regionFilter || undefined} onChange={setRegionFilter} options={mockRiskHotspots.map(h => ({ label: `${h.region} - ${h.country}`, value: h.region }))} className="[&_.ant-select-selector]:bg-gray-800 [&_.ant-select-selector]:border-gray-600 [&_*]:text-white" />}>
              <SafeECharts option={riskMapOption} style={{ height: 520 }} title="风险地图" />
              <div className="mt-2 flex items-center justify-center gap-6 text-xs text-gray-500">
                <span><span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>极危(&ge;80)</span>
                <span><span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>高危(60-79)</span>
                <span><span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>中危(40-59)</span>
                <span><span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>低危(&lt;40)</span>
                <span><span className="inline-block w-3 h-3 rotate-45 border-2 border-red-500 mr-1"></span>严重事件</span>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={7}>
            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg" bordered={false} title={<span className="text-white">区域风险排名</span>}>
              <Table
                dataSource={filteredHotspots.sort((a, b) => b.riskScore - a.riskScore)}
                columns={rankingColumns}
                rowKey="id"
                pagination={false}
                size="small"
                className="[&_.ant-table]:bg-transparent [&_.ant-table-thead_>tr_>th]:bg-gray-800/50 [&_.ant-table-thead_>tr_>th]:text-gray-300 [&_.ant-table-tbody_>tr]:hover:bg-gray-800/30 [&_td]:border-gray-800"
              />
            </Card>

            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg mt-4" bordered={false} title={<span className="text-white">风险事件标注列表</span>} size="small">
              <List
                dataSource={mockRiskEvents}
                size="small"
                renderItem={event => (
                  <List.Item className="!border-gray-800 !py-2">
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate flex-1 mr-2">{event.title}</span>
                        <Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'blue' }[event.level]} className="text-xs">{event.level}</Tag>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span><EnvironmentOutlined /> {event.region}</span>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* 底部说明 */}
        <Card className="bg-gradient-to-r from-emerald-950/30 to-cyan-950/30 border border-emerald-900/30" bordered={false} size="small">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-emerald-500 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-400 m-0 mb-1">风险地图数据说明</h4>
              <p className="text-sm text-gray-400 m-0">
                本地图展示全球各区域的网络安全风险分布情况。风险评分基于威胁情报、攻击频率、资产暴露面等多维度综合计算。
                东欧地区因国家级攻击活动和大型僵尸网络部署，当前风险等级最高。建议重点关注来自高风险地区的异常流量。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
