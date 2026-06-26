'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Input, Select, Space, Modal, Descriptions, Badge, Timeline, message, Tabs, Alert, Progress, Statistic, Tooltip } from 'antd';
import {
  RadarChartOutlined,
  GlobalOutlined,
  WarningOutlined,
  SearchOutlined,
  EyeOutlined,
  BellOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
  FireOutlined,
  BugOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// IOC指标类型
type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'wallet';

// 威胁情报接口
interface ThreatIntel {
  id: string;
  source: string; // 来源
  type: 'apt' | 'ransomware' | 'phishing' | 'malware' | 'vulnerability' | 'blockchain_threat' | 'ddos' | 'data_breach';
  level: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  iocs: { type: IOCType; value: string }[];
  affectedSystems: string[];
  updatedAt: string;
  status: 'active' | 'expired' | 'false_positive';
  tlp: 'red' | 'amber' | 'green' | 'white'; // Traffic Light Protocol
}

// 预警规则接口
interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: string;
  enabled: boolean;
  notifyChannels: string[];
  lastTriggered?: string;
}

// 模拟威胁情报数据
const mockThreatIntels: ThreatIntel[] = [
  {
    id: 'TI-20240608-001', source: 'CN-CERT', type: 'apt', level: 'critical',
    title: 'APT组织Lazarus针对加密货币交易所的攻击活动',
    description: '检测到与 Lazarus APT 组织相关的攻击活动，目标包括多个亚洲地区的数字资产交易平台。攻击手法涉及供应链投毒和员工钓鱼。',
    iocs: [
      { type: 'ip', value: '185.220.101.[0-255]' },
      { type: 'domain', value: 'crypto-update[.]net' },
      { type: 'hash', value: 'a1b2c3d4e5f6...' },
      { type: 'wallet', value: '0x7aB3...xYz9' },
    ],
    affectedSystems: ['交易所Web平台', '内部办公网络', '钱包服务'],
    updatedAt: '2024-06-08 13:00:00', status: 'active', tlp: 'amber',
  },
  {
    id: 'TI-20240608-002', source: 'Aliyun Security', type: 'ransomware', level: 'high',
    title: 'LockBit 3.0勒索软件新变种活跃',
    description: 'LockBit 3.0 勒索软件新变种被发现针对金融行业发起攻击，采用双重勒索策略（数据加密+数据泄露威胁）。',
    iocs: [
      { type: 'hash', value: 'e5f6a7b8c9d0...' },
      { type: 'domain', value: 'lockbit-ransom[.]onion' },
      { type: 'url', value: 'hxxp://victim[.]com/payload.exe' },
    ],
    affectedSystems: ['文件服务器', '数据库服务器'],
    updatedAt: '2024-06-08 11:30:00', status: 'active', tlp: 'white',
  },
  {
    id: 'TI-20240608-003', source: 'SlowMist', type: 'blockchain_threat', level: 'critical',
    title: '新型DeFi闪电贷攻击模式预警',
    description: '发现一种新型的跨协议闪电贷款攻击模式，已导致多家DeFi协议损失超过$50M。攻击者利用价格预言机操控和套利机器人协同实施攻击。',
    iocs: [
      { type: 'wallet', value: '0xAttack...Wallet' },
      { type: 'hash', value: 'tx_hash: 0xabc123...' },
      { type: 'ip', value: '45.33.32.156' },
    ],
    affectedSystems: ['DeFi协议', '流动性池', '价格预言机'],
    updatedAt: '2024-06-08 10:15:00', status: 'active', tlp: 'red',
  },
  {
    id: 'TI-20240608-004', source: 'VirusTotal', type: 'malware', level: 'medium',
    title: '信息窃取木马RedLine新版本检测',
    description: '检测到 RedLine Stealer 新变种在暗网传播，主要窃取浏览器密码、cookie和加密货币钱包信息。',
    iocs: [
      { type: 'hash', value: 'f1a2b3c4d5e6...' },
      { type: 'domain', value: 'cdn-static[.]ru' },
    ],
    affectedSystems: ['员工终端设备'],
    updatedAt: '2024-06-08 09:00:00', status: 'active', tlp: 'green',
  },
  {
    id: 'TI-20240608-005', source: 'Chainalysis', type: 'phishing', level: 'high',
    title: '假冒中萨交易所钓鱼网站预警',
    description: '发现多个仿冒中萨数字科技交易所官方域名的钓鱼网站，通过社交媒体和搜索引擎投放进行传播。',
    iocs: [
      { type: 'domain', value: 'guoxue-exchange[.]xyz' },
      { type: 'domain', value: 'guoxue-login[.]top' },
      { type: 'url', value: 'hxxps://guoxue-exchange[.]xyz/login' },
      { type: 'ip', value: '103.21.244.10' },
    ],
    affectedSystems: ['用户账户', '资产安全'],
    updatedAt: '2024-06-08 08:30:00', status: 'active', tlp: 'amber',
  },
  {
    id: 'TI-20240608-006', source: 'NVD', type: 'vulnerability', level: 'high',
    title: 'OpenSSL严重漏洞CVE-2024-XXXX影响TLS连接',
    description: 'OpenSSL库发现新的严重漏洞，可能导致中间人攻击或远程代码执行，建议尽快升级。',
    iocs: [
      { type: 'hash', value: 'CVE-2024-XXXX' },
    ],
    affectedSystems: ['所有使用OpenSSL的服务'],
    updatedAt: '2024-06-07 22:00:00', status: 'active', tlp: 'white',
  },
  {
    id: 'TI-20240608-007', source: 'Cloudflare', type: 'ddos', level: 'medium',
    title: '亚太地区DDoS攻击活动增加',
    description: '监测到亚太地区针对金融行业的DDoS攻击活动较上月增长45%，主要攻击向量是DNS放大和应用层攻击。',
    iocs: [
      { type: 'ip', value: '大规模僵尸网络' },
    ],
    affectedSystems: ['公网入口', 'DNS服务'],
    updatedAt: '2024-06-07 18:00:00', status: 'active', tlp: 'green',
  },
  {
    id: 'TI-20240608-008', source: 'Internal', type: 'data_breach', level: 'low',
    title: '第三方供应商数据泄露通知',
    description: '某第三方安全服务商发生数据泄露事件，可能影响部分历史威胁情报数据。已启动影响评估程序。',
    iocs: [],
    affectedSystems: ['威胁情报数据库'],
    updatedAt: '2024-06-07 14:00:00', status: 'active', tlp: 'amber',
  },
];

// 预警规则模拟数据
const mockAlertRules: AlertRule[] = [
  { id: 'AR-001', name: 'APT攻击检测规则', condition: '匹配已知APT组织IOC指标', severity: 'critical', enabled: true, notifyChannels: ['邮件', '短信', '钉钉'], lastTriggered: '2024-06-08 13:00:00' },
  { id: 'AR-002', name: '区块链异常交易监控', condition: '单笔交易金额 > $500K 或频率异常', severity: 'high', enabled: true, notifyChannels: ['钉钉', '企业微信'], lastTriggered: '2024-06-08 10:15:00' },
  { id: 'AR-003', name: '钓鱼域名检测', condition: '新注册域名与官方域名相似度 > 80%', severity: 'high', enabled: true, notifyChannels: ['邮件'], lastTriggered: '2024-06-08 08:30:00' },
  { id: 'AR-004', name: '勒索软件特征检测', condition: '匹配已知勒索软件IOC哈希', severity: 'critical', enabled: true, notifyChannels: ['短信', '电话', '钉钉'], lastTriggered: '2024-06-07 22:00:00' },
  { id: 'AR-005', name: 'DDoS流量异常告警', condition: '入站流量超过基线300%', severity: 'high', enabled: true, notifyChannels: ['钉钉'], lastTriggered: null },
  { id: 'AR-006', name: '智能合约漏洞预警', condition: '检测到已知合约漏洞特征', severity: 'critical', enabled: false, notifyChannels: ['邮件', '钉钉'], lastTriggered: null },
];

// 全球威胁态势地图概念展示（用散点图模拟）
const threatMapOption = {
  backgroundColor: '#1a1a2e',
  tooltip: {
    formatter: (params: any) => `${params.name}<br/>威胁指数: ${params.value[2]}`,
  },
  geo: {
    map: 'world',
    roam: true,
    itemStyle: { areaColor: '#16213e', borderColor: '#0f3460' },
    emphasis: { itemStyle: { areaColor: '#1a1a2e' } },
  },
  series: [{
    type: 'effectScatter',
    coordinateSystem: 'geo',
    data: [
      { name: '北京', value: [116.46, 39.92, 85] },
      { name: '上海', value: [121.48, 31.22, 72] },
      { name: '东京', value: [139.69, 35.68, 65] },
      { name: '新加坡', value: [103.82, 1.35, 58] },
      { name: '洛杉矶', value: [-118.24, 34.05, 92] },
      { name: '法兰克福', value: [8.68, 50.11, 78] },
      { name: '伦敦', value: [-0.12, 51.51, 70] },
      { name: '莫斯科', value: [37.62, 55.75, 88] },
      { name: '首尔', value: [126.98, 37.57, 60] },
      { name: '香港', value: [114.17, 22.28, 55] },
    ].map(item => ({
      ...item,
      symbolSize: Math.max(item.value[2] / 5, 8),
      itemStyle: {
        color: item.value[2] >= 80 ? '#DC2626' : item.value[2] >= 60 ? '#F59E0B' : '#16A34A',
      },
    })),
    showEffectOn: 'render',
    rippleEffect: { brushType: 'stroke', scale: 4 },
  }],
};

export default function ThreatIntelPage() {
  const [selectedIntel, setSelectedIntel] = useState<ThreatIntel | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data: stats } = useQuery({
    queryKey: ['threat-intel-stats'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return { totalIntel: 1247, activeIntel: 89, criticalCount: 12, todayUpdated: 23 };
    },
  });

  // 筛选威胁情报
  const filteredIntels = mockThreatIntels.filter(intel => {
    const matchSearch = !searchText ||
      intel.title.toLowerCase().includes(searchText.toLowerCase()) ||
      intel.source.toLowerCase().includes(searchText.toLowerCase()) ||
      intel.iocs.some(ioc => ioc.value.toLowerCase().includes(searchText.toLowerCase()));
    const matchLevel = !levelFilter || intel.level === levelFilter;
    const matchType = !typeFilter || intel.type === typeFilter;
    return matchSearch && matchLevel && matchType;
  });

  // TLP颜色映射
  const tlpColors: Record<string, string> = { red: '#B91C1C', amber: '#F59E0B', green: '#16A34A', white: '#1677FF' };
  const tlpLabels: Record<string, string> = { red: 'TLP:RED', amber: 'TLP:AMBER', green: 'TLP:GREEN', white: 'TLP:WHITE' };

  // 表格列
  const columns = [
    {
      title: '威胁情报',
      key: 'info',
      render: (_: any, record: ThreatIntel) => (
        <div>
          <div className="font-medium text-sm">{record.title}</div>
          <div className="flex items-center gap-2 mt-1">
            <Tag color="default" className="text-xs">{record.source}</Tag>
            <Tag color={tlpColors[record.tlp]} className="text-xs">{tlpLabels[record.tlp]}</Tag>
          </div>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => {
        const configs: Record<string, { color: string; text: string }> = {
          apt: { color: 'red', text: 'APT攻击' },
          ransomware: { color: 'red', text: '勒索软件' },
          phishing: { color: 'orange', text: '钓鱼攻击' },
          malware: { color: 'purple', text: '恶意软件' },
          vulnerability: { color: 'gold', text: '漏洞威胁' },
          blockchain_threat: { color: 'magenta', text: '区块链威胁' },
          ddos: { color: 'volcano', text: 'DDoS攻击' },
          data_breach: { color: 'geekblue', text: '数据泄露' },
        };
        const c = configs[type] || { color: 'default', text: type };
        return <Tag color={c.color}>{c.text}</Tag>;
      },
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => {
        const colors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
        const texts: Record<string, string> = { critical: '严重', high: '高危', medium: '中危', low: '低危' };
        return <Tag color={colors[level]}>{texts[level]}</Tag>;
      },
    },
    {
      title: 'IOC指标',
      key: 'iocs',
      width: 200,
      render: (_: any, record: ThreatIntel) => (
        <Space size={[4, 4]} wrap>
          {record.iocs.slice(0, 3).map((ioc, idx) => (
            <Tooltip key={idx} title={`${ioc.type.toUpperCase()}: ${ioc.value}`}>
              <Tag color="blue" className="text-xs font-mono max-w-[120px] truncate block">{ioc.value.substring(0, 16)}...</Tag>
            </Tooltip>
          ))}
          {record.iocs.length > 3 && <Tag className="text-xs">+{record.iocs.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Badge status={status === 'active' ? 'processing' : 'default'} text={status === 'active' ? '活跃' : '过期'} />,
    },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: ThreatIntel) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedIntel(record); setDetailVisible(true); }}>详情</Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <RadarChartOutlined className="text-2xl text-cyan-600" />
          <h1 className="text-2xl font-bold m-0">威胁情报中心</h1>
          <Badge count={stats?.criticalCount || 0} style={{ backgroundColor: '#B91C1C' }} />
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="情报总数" value={stats?.totalIntel || 0} prefix={<GlobalOutlined />} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="活跃情报" value={stats?.activeIntel || 0} valueStyle={{ color: '#1677FF' }} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="严重级别" value={stats?.criticalCount || 0} valueStyle={{ color: '#B91C1C' }} prefix={<WarningOutlined />} /></Card></Col>
          <Col xs={12} sm={6}><Card size="small" className="shadow-sm"><Statistic title="今日更新" value={stats?.todayUpdated || 0} prefix={<ThunderboltOutlined />} valueStyle={{ color: '#16A34A' }} /></Card></Col>
        </Row>

        {/* 重要预警横幅 */}
        <Alert
          type="error"
          showIcon
          icon={<FireOutlined />}
          message="严重威胁预警"
          description={
            <span>
              检测到 <strong>Lazarus APT组织</strong> 针对加密货币交易所的攻击活动 (TI-20240608-001)
              和 <strong>新型DeFi闪电贷攻击</strong> (TI-20240608-003)。请立即检查相关IOC指标是否命中本系统，
              并加强对应防护措施。
            </span>
          }
          className="shadow-sm"
        />

        {/* 主内容区域 */}
        <Tabs items={[
          {
            key: 'intel-list',
            label: <><RadarChartOutlined /> 威胁情报库</>,
            children: (
              <Card className="shadow-sm">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <Input.Search placeholder="搜索标题/来源/IOC..." allowClear style={{ width: 280 }} value={searchText} onChange={(e) => setSearchText(e.target.value)} enterButton={<SearchOutlined />} />
                  <Select placeholder="级别筛选" style={{ width: 120 }} allowClear value={levelFilter || undefined} onChange={setLevelFilter} options={[
                    { label: '严重', value: 'critical' }, { label: '高危', value: 'high' }, { label: '中危', value: 'medium' }, { label: '低危', value: 'low' },
                  ]} />
                  <Select placeholder="类型筛选" style={{ width: 140 }} allowClear value={typeFilter || undefined} onChange={setTypeFilter} options={[
                    { label: 'APT攻击', value: 'apt' }, { label: '勒索软件', value: 'ransomware' }, { label: '钓鱼攻击', value: 'phishing' }, { label: '恶意软件', value: 'malware' }, { label: '区块链威胁', value: 'blockchain_threat' }, { label: 'DDoS', value: 'ddos' },
                  ]} />
                  <span className="text-sm text-gray-500 ml-auto">共 {filteredIntels.length} 条情报</span>
                </div>
                <Table dataSource={filteredIntels} columns={columns} rowKey="id" pagination={{ pageSize: 6 }} size="middle" />
              </Card>
            ),
          },
          {
            key: 'alert-rules',
            label: <><BellOutlined /> 预警规则 ({mockAlertRules.filter(r => r.enabled).length})</>,
            children: (
              <Card className="shadow-sm">
                <Table
                  dataSource={mockAlertRules}
                  columns={[
                    { title: '规则名称', dataIndex: 'name', key: 'name', render: (name: string) => <span className="font-medium">{name}</span> },
                    { title: '触发条件', dataIndex: 'condition', key: 'condition', ellipsis: true },
                    { title: '级别', dataIndex: 'severity', key: 'severity', width: 90, render: (sev: string) => <Tag color={sev === 'critical' ? 'red' : 'orange'}>{sev === 'critical' ? '严重' : '高危'}</Tag> },
                    { title: '状态', key: 'enabled', width: 80, render: (_: any, r: AlertRule) => <Badge status={r.enabled ? 'success' : 'default'} text={r.enabled ? '启用' : '禁用'} /> },
                    { title: '通知渠道', dataIndex: 'notifyChannels', key: 'notifyChannels', render: (chs: string[]) => chs.map(c => <Tag key={c}>{c}</Tag>) },
                    { title: '最后触发', dataIndex: 'lastTriggered', key: 'lastTriggered', width: 160, render: (t: string) => t || '-' },
                    { title: '操作', key: 'action', width: 100, render: () => <Button type="link" size="small" icon={<SettingOutlined />}>配置</Button> },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                />
              </Card>
            ),
          },
          {
            key: 'threat-map',
            label: <><GlobalOutlined /> 全球态势</>,
            children: (
              <Card className="shadow-sm" title="全球威胁热点分布（概念示意）">
                <SafeECharts option={threatMapOption} style={{ height: 450 }} title="全球威胁地图" />
                <div className="mt-2 text-center text-sm text-gray-500">
                  散点大小和颜色表示威胁指数：红色(&gt;80) 高危 | 黄色(60-80) 中危 | 绿色(&lt;60) 低危
                </div>
              </Card>
            ),
          },
        ]} />

        {/* 详情弹窗 */}
        <Modal title={`威胁情报详情 - ${selectedIntel?.id || ''}`} open={detailVisible} onCancel={() => setDetailVisible(false)} width={750} footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}>
          {selectedIntel && (
            <div className="space-y-4">
              <Alert type={selectedIntel.level === 'critical' ? 'error' : selectedIntel.level === 'high' ? 'warning' : 'info'} showIcon message={selectedIntel.title} description={selectedIntel.description} />

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="情报ID">{selectedIntel.id}</Descriptions.Item>
                <Descriptions.Item label="来源"><Tag>{selectedIntel.source}</Tag></Descriptions.Item>
                <Descriptions.Item label="类型">
                  {{ apt: 'APT攻击', ransomware: '勒索软件', phishing: '钓鱼攻击', malware: '恶意软件', vulnerability: '漏洞威胁', blockchain_threat: '区块链威胁', ddos: 'DDoS攻击', data_breach: '数据泄露' }[selectedIntel.type]}
                </Descriptions.Item>
                <Descriptions.Item label="级别">
                  <Tag color={{ critical: 'red', high: 'orange', medium: 'gold', low: 'green' }[selectedIntel.level]}>
                    {{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[selectedIntel.level]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="TLP等级"><Tag color={tlpColors[selectedIntel.tlp]}>{tlpLabels[selectedIntel.tlp]}</Tag></Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedIntel.updatedAt}</Descriptions.Item>
                <Descriptions.Item label="影响系统" span={2}>{selectedIntel.affectedSystems.map(s => <Tag key={s} color="red">{s}</Tag>)}</Descriptions.Item>
              </Descriptions>

              <div>
                <h4 className="font-bold mb-2">IOC指标清单</h4>
                <Table
                  dataSource={selectedIntel.iocs.map((ioc, idx) => ({ key: idx, ...ioc }))}
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: IOCType) => <Tag>{{ ip: 'IP地址', domain: '域名', url: 'URL', hash: '哈希值', email: '邮箱', wallet: '钱包地址' }[t]}</Tag> },
                    { title: '指标值', dataIndex: 'value', key: 'value', render: (val: string) => <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-sm">{val}</code> },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-cyan-500 mt-1" />
            <div>
              <h4 className="font-bold text-cyan-700 m-0 mb-1">威胁情报使用规范</h4>
              <p className="text-sm text-cyan-600 m-0">
                威胁情报遵循TLP(Traffic Light Protocol)分级标准。TLP:RED仅限内部核心团队使用；
                TLP:AMBER可在组织内有限共享；TLP:GREEN可与合作伙伴共享；TLP:WHITE可公开发布。
                区块链相关威胁需特别关注钱包地址和交易哈希等链上IOC指标的实时监控。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
