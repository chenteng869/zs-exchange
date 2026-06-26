'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Badge, Input, Select, Button, Modal, Descriptions, Space, Statistic, Progress, Timeline } from 'antd';
import {
  RadarChartOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  SearchOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
  FireOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// 入侵检测统计模拟数据
const mockIntrusionStats = {
  realTimeAttacks: 47,
  blockedCount: 1234,
  highRiskAlerts: 8,
  todayDetected: 156,
  attackRate: 23.5,
  blockRate: 98.7,
};

// 攻击类型趋势数据
const attackTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['SQL注入', 'XSS攻击', 'DDoS', '暴力破解', 'CSRF'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  },
  yAxis: { type: 'value' },
  series: [
    { name: 'SQL注入', type: 'line', smooth: true, data: [12, 8, 25, 35, 28, 18, 15], lineStyle: { color: '#DC2626' }, itemStyle: { color: '#DC2626' } },
    { name: 'XSS攻击', type: 'line', smooth: true, data: [8, 5, 15, 22, 18, 12, 9], lineStyle: { color: '#F59E0B' }, itemStyle: { color: '#F59E0B' } },
    { name: 'DDoS', type: 'line', smooth: true, data: [2, 1, 5, 8, 12, 6, 3], lineStyle: { color: '#B91C1C' }, itemStyle: { color: '#B91C1C' } },
    { name: '暴力破解', type: 'line', smooth: true, data: [15, 10, 30, 45, 38, 25, 20], lineStyle: { color: '#F59E0B' }, itemStyle: { color: '#F59E0B' } },
    { name: 'CSRF', type: 'line', smooth: true, data: [5, 3, 8, 12, 10, 7, 4], lineStyle: { color: '#7C3AED' }, itemStyle: { color: '#7C3AED' } },
  ],
};

// TOP5攻击源IP排行
const topAttackersOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: ['203.0.113.50', '185.220.101.50', '91.121.87.100', '45.33.32.156', '172.16.0.88'],
  },
  series: [
    {
      name: '攻击次数',
      type: 'bar',
      data: [
        { value: 256, itemStyle: { color: '#B91C1C' } },
        { value: 198, itemStyle: { color: '#DC2626' } },
        { value: 156, itemStyle: { color: '#ff7a45' } },
        { value: 134, itemStyle: { color: '#F59E0B' } },
        { value: 98, itemStyle: { color: '#ffc53d' } },
      ],
      label: { show: true, position: 'right' },
    },
  ],
};

// 入侵事件列表数据
const mockIntrusionEvents = [
  { id: 'INC-20240608-001', time: '2024-06-08 14:35:22', type: 'SQL注入', level: 'critical', sourceIP: '203.0.113.50', target: '/api/v1/users/login', method: 'POST', payload: "SELECT * FROM users", status: 'blocked', location: '美国·洛杉矶' },
  { id: 'INC-20240608-002', time: '2024-06-08 14:32:15', type: 'XSS攻击', level: 'high', sourceIP: '185.220.101.50', target: '/api/v1/content/comment', method: 'POST', payload: '<script>alert(1)</script>', status: 'blocked', location: '德国·法兰克福' },
  { id: 'INC-20240608-003', time: '2024-06-08 14:28:43', type: 'DDoS攻击', level: 'critical', sourceIP: '91.121.87.100', target: '/api/v1/trade/order', method: 'GET', payload: '高频请求 1200/min', status: 'mitigated', location: '法国·巴黎' },
  { id: 'INC-20240608-004', time: '2024-06-08 14:15:22', type: '暴力破解', level: 'high', sourceIP: '45.33.32.156', target: '/api/v1/auth/login', method: 'POST', payload: '尝试密码组合 856次', status: 'blocked', location: '日本·东京' },
  { id: 'INC-20240608-005', time: '2024-06-08 13:58:10', type: 'CSRF攻击', level: 'medium', sourceIP: '172.16.0.88', target: '/api/v1/wallet/transfer', method: 'POST', payload: '伪造跨站请求', status: 'detected', location: '内部网络' },
  { id: 'INC-20240608-006', time: '2024-06-08 13:45:33', type: '路径遍历', level: 'high', sourceIP: '192.168.1.105', target: '/api/v1/file/download', method: 'GET', payload: '../../../etc/passwd', status: 'blocked', location: '中国·北京' },
  { id: 'INC-20240608-007', time: '2024-06-08 13:30:18', type: '命令注入', level: 'critical', sourceIP: '10.0.0.55', target: '/api/v1/system/exec', method: 'POST', payload: '; rm -rf /', status: 'blocked', location: '内部网络' },
  { id: 'INC-20240608-008', time: '2024-06-08 13:15:45', type: 'SSRF攻击', level: 'medium', sourceIP: '103.21.244.10', target: '/api/v1/proxy/fetch', method: 'GET', payload: 'http://169.254.169.254/', status: 'detected', location: '新加坡' },
];

// 实时告警滚动条数据
const realtimeAlerts = [
  { time: '14:36:05', level: 'critical', msg: '[严重] 检测到来自203.0.113.50的SQL注入攻击' },
  { time: '14:35:58', level: 'high', msg: '[高危] IP 185.220.101.50发起XSS攻击被拦截' },
  { time: '14:35:42', level: 'warning', msg: '[警告] 异常登录尝试超过阈值限制' },
  { time: '14:35:30', level: 'info', msg: '[信息] WAF规则库已自动更新至v2.3.1' },
  { time: '14:35:15', level: 'high', msg: '[高危] 发现新型区块链钓鱼网站域名' },
  { time: '14:34:58', level: 'critical', msg: '[严重] DDoS攻击流量峰值达2.5Gbps' },
  { time: '14:34:45', level: 'medium', msg: '[中危] 检测到可疑的智能合约交互模式' },
  { time: '14:34:30', level: 'info', msg: '[信息] 安全策略同步完成' },
];

export default function IntrusionDetectionPage() {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [alertIndex, setAlertIndex] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('');

  // 实时告警轮播效果
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertIndex(prev => (prev + 1) % realtimeAlerts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['intrusion-stats'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockIntrusionStats;
    },
  });

  // 筛选后的入侵事件
  const filteredEvents = mockIntrusionEvents.filter(event => {
    const matchSearch = !searchText ||
      event.id.toLowerCase().includes(searchText.toLowerCase()) ||
      event.type.includes(searchText) ||
      event.sourceIP.includes(searchText);
    const matchLevel = !filterLevel || event.level === filterLevel;
    return matchSearch && matchLevel;
  });

  // 表格列定义
  const columns = [
    { title: '事件ID', dataIndex: 'id', key: 'id', width: 160, render: (id: string) => <span className="font-mono text-xs">{id}</span> },
    { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
    {
      title: '攻击类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="red">{type}</Tag>,
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 90,
      render: (level: string) => {
        const colors: Record<string, string> = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' };
        const texts: Record<string, string> = { critical: '严重', high: '高危', medium: '中危', low: '低危' };
        return <Tag color={colors[level]}>{texts[level]}</Tag>;
      },
    },
    {
      title: '来源IP',
      dataIndex: 'sourceIP',
      key: 'sourceIP',
      render: (ip: string) => <span className="font-mono text-sm">{ip}</span>,
    },
    { title: '目标接口', dataIndex: 'target', key: 'target', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const configs: Record<string, { status: 'success' | 'processing' | 'warning' | 'default'; text: string }> = {
          blocked: { status: 'success', text: '已拦截' },
          mitigated: { status: 'processing', text: '已缓解' },
          detected: { status: 'warning', text: '已检测' },
          pending: { status: 'default', text: '待处理' },
        };
        const c = configs[status] || { status: 'default' as const, text: status };
        return <Badge status={c.status} text={c.text} />;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedEvent(record); setDetailVisible(true); }}>
          详情
        </Button>
      ),
    },
  ];

  const currentAlert = realtimeAlerts[alertIndex];
  const alertColors: Record<string, string> = {
    critical: 'border-l-red-500 bg-red-50',
    high: 'border-l-orange-500 bg-orange-50',
    warning: 'border-l-yellow-500 bg-yellow-50',
    info: 'border-l-blue-500 bg-blue-50',
    medium: 'border-l-purple-500 bg-purple-50',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <RadarChartOutlined className="text-2xl text-red-600" />
          <h1 className="text-2xl font-bold m-0">入侵检测中心</h1>
          <Badge status="processing" text="实时监控中" className="ml-2" />
        </div>

        {/* 核心指标卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm border-t-4 border-t-red-500">
              <Statistic
                title="实时攻击数"
                value={stats?.realTimeAttacks || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#B91C1C' }}
                suffix="/分钟"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm border-t-4 border-t-green-500">
              <Statistic
                title="已拦截"
                value={stats?.blockedCount || 0}
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm border-t-4 border-t-orange-500">
              <Statistic
                title="高危告警"
                value={stats?.highRiskAlerts || 0}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#F59E0B' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm border-t-4 border-t-blue-500">
              <Statistic
                title="今日检测量"
                value={stats?.todayDetected || 0}
                prefix={<RadarChartOutlined />}
                valueStyle={{ color: '#1677FF' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 防护效率 */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" className="shadow-sm">
              <Statistic title="攻击拦截率" value={stats?.blockRate || 0} suffix="%" precision={1} valueStyle={{ color: '#16A34A' }} />
              <Progress percent={Math.round(stats?.blockRate || 0)} strokeColor="#16A34A" />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" className="shadow-sm">
              <Statistic title="攻击增长率" value={stats?.attackRate || 0} suffix="%" precision={1} valueStyle={{ color: '#DC2626' }} />
              <Progress percent={Math.round(stats?.attackRate || 0)} strokeColor="#DC2626" status="exception" />
            </Card>
          </Col>
        </Row>

        {/* 实时告警滚动条 */}
        <Card className="shadow-sm overflow-hidden" title={<><FireOutlined className="text-red-500 mr-2" />实时告警流</>}>
          <div className={`border-l-4 p-3 rounded-r transition-all duration-500 ${alertColors[currentAlert.level] || ''}`}>
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className={`mt-1 ${currentAlert.level === 'critical' ? 'text-red-500' : currentAlert.level === 'high' ? 'text-orange-500' : 'text-yellow-500'}`} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Tag color={currentAlert.level === 'critical' ? 'red' : currentAlert.level === 'high' ? 'orange' : 'blue'}>{currentAlert.level.toUpperCase()}</Tag>
                  <span className="text-xs text-gray-400 font-mono">{currentAlert.time}</span>
                </div>
                <p className="text-sm m-0">{currentAlert.msg}</p>
              </div>
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            {realtimeAlerts.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx === alertIndex ? 'bg-red-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </Card>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="攻击类型趋势（24小时）" className="shadow-sm">
              <SafeECharts option={attackTrendOption} style={{ height: 320 }} title="攻击类型趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="TOP5 攻击源IP排行" className="shadow-sm">
              <SafeECharts option={topAttackersOption} style={{ height: 320 }} title="TOP5攻击源" />
            </Card>
          </Col>
        </Row>

        {/* 入侵事件列表 */}
        <Card title="入侵事件列表" className="shadow-sm">
          {/* 搜索和筛选工具栏 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Input.Search
              placeholder="搜索事件ID/类型/IP地址"
              allowClear
              style={{ width: 280 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={<SearchOutlined />}
            />
            <Select
              placeholder="选择级别筛选"
              style={{ width: 140 }}
              allowClear
              value={filterLevel || undefined}
              onChange={setFilterLevel}
              options={[
                { label: '严重', value: 'critical' },
                { label: '高危', value: 'high' },
                { label: '中危', value: 'medium' },
                { label: '低危', value: 'low' },
              ]}
            />
            <span className="text-sm text-gray-500 ml-auto">共 {filteredEvents.length} 条记录</span>
          </div>

          <Table
            dataSource={filteredEvents}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条入侵事件`,
            }}
            size="middle"
            loading={isLoading}
          />
        </Card>

        {/* 事件详情弹窗 */}
        <Modal
          title={`入侵事件详情 - ${selectedEvent?.id}`}
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          width={750}
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
            <Button key="block" type="primary" danger icon={<SafetyCertificateOutlined />}>封禁IP</Button>,
          ]}
        >
          {selectedEvent && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="事件ID">{selectedEvent.id}</Descriptions.Item>
                <Descriptions.Item label="发生时间">{selectedEvent.time}</Descriptions.Item>
                <Descriptions.Item label="攻击类型"><Tag color="red">{selectedEvent.type}</Tag></Descriptions.Item>
                <Descriptions.Item label="威胁级别">
                  <Tag color={selectedEvent.level === 'critical' ? 'red' : selectedEvent.level === 'high' ? 'orange' : 'gold'}>
                    {{ critical: '严重', high: '高危', medium: '中危', low: '低危' }[selectedEvent.level]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="来源IP" span={2}><span className="font-mono">{selectedEvent.sourceIP}</span> ({selectedEvent.location})</Descriptions.Item>
                <Descriptions.Item label="目标接口" span={2}><code className="bg-gray-100 px-2 py-1 rounded">{selectedEvent.method} {selectedEvent.target}</code></Descriptions.Item>
                <Descriptions.Item label="攻击载荷" span={2}>
                  <pre className="bg-red-50 text-red-700 p-3 rounded text-sm overflow-x-auto mt-1">{selectedEvent.payload}</pre>
                </Descriptions.Item>
                <Descriptions.Item label="处理状态">
                  <Badge status={selectedEvent.status === 'blocked' ? 'success' : selectedEvent.status === 'mitigated' ? 'processing' : 'warning'} text={
                    { blocked: '已拦截', mitigated: '已缓解', detected: '已检测', pending: '待处理' }[selectedEvent.status]
                  } />
                </Descriptions.Item>
                <Descriptions.Item label="地理位置">{selectedEvent.location}</Descriptions.Item>
              </Descriptions>

              <div className="mt-4">
                <h4 className="font-bold mb-2">处理流程</h4>
                <Timeline
                  items={[
                    { color: 'green', children: <><strong>检测到攻击</strong><br/><span className="text-gray-500 text-xs">{selectedEvent.time}</span></> },
                    { color: 'blue', children: <><strong>规则匹配</strong><br/><span className="text-gray-500 text-xs">WAF规则 #1024 命中</span></> },
                    { color: selectedEvent.status === 'blocked' ? 'green' : 'gray', children: <><strong>{selectedEvent.status === 'blocked' ? '已自动拦截' : '等待处理'}</strong><br/><span className="text-gray-500 text-xs">{selectedEvent.status === 'blocked' ? '响应时间 &lt; 10ms' : '-'}</span></> },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
