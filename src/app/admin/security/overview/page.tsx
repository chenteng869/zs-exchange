'use client';

import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Table, Tag, Badge, Progress } from 'antd';
import {
  SafetyCertificateOutlined,
  AlertOutlined,
  BugOutlined,
  DesktopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// 安全态势概览模拟数据
const mockSecurityStats = {
  securityScore: 92,
  todayAlerts: 23,
  pendingVulnerabilities: 5,
  onlineDevices: 1286,
  totalEvents: 158,
  blockedAttacks: 1247,
  avgResponseTime: 2.3,
};

// 最近安全事件列表
const mockSecurityEvents = [
  { id: '1', time: '2024-06-08 14:32:15', type: 'SQL注入', level: 'high', source: '192.168.1.105', status: 'handled', detail: '检测到针对用户登录接口的SQL注入尝试' },
  { id: '2', time: '2024-06-08 14:28:43', type: 'XSS攻击', level: 'medium', source: '10.0.0.55', status: 'handling', detail: '发现存储型XSS攻击向量' },
  { id: '3', time: '2024-06-08 14:15:22', type: 'DDoS攻击', level: 'critical', source: '203.0.113.50', status: 'handled', detail: '遭受大规模DDoS攻击，已启动防护' },
  { id: '4', time: '2024-06-08 13:58:10', type: '暴力破解', level: 'high', source: '172.16.0.88', status: 'handled', detail: '检测到管理员账户暴力破解行为' },
  { id: '5', time: '2024-06-08 13:45:33', type: '异常访问', level: 'low', source: '192.168.2.200', status: 'pending', detail: '检测到非工作时间异常API调用' },
  { id: '6', time: '2024-06-08 13:30:18', type: '恶意爬虫', level: 'medium', source: '45.33.32.156', status: 'handled', detail: '识别并拦截恶意爬虫请求' },
  { id: '7', time: '2024-06-08 13:15:45', type: 'CSRF攻击', level: 'high', source: '91.121.87.100', status: 'pending', detail: '检测到跨站请求伪造攻击' },
  { id: '8', time: '2024-06-08 12:58:22', type: '文件上传漏洞', level: 'critical', source: '185.220.101.50', status: 'handled', detail: '拦截恶意文件上传尝试' },
];

// 安全事件趋势图配置（7天）
const securityTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['安全事件', '已处理', '高危事件'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['6月2日', '6月3日', '6月4日', '6月5日', '6月6日', '6月7日', '6月8日'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '安全事件',
      type: 'line',
      smooth: true,
      data: [145, 132, 158, 142, 165, 152, 158],
      areaStyle: { opacity: 0.3 },
    },
    {
      name: '已处理',
      type: 'line',
      smooth: true,
      data: [138, 125, 150, 135, 158, 145, 148],
    },
    {
      name: '高危事件',
      type: 'line',
      smooth: true,
      data: [12, 8, 15, 10, 18, 14, 16],
      lineStyle: { type: 'dashed' },
    },
  ],
};

// 威胁类型分布饼图
const threatTypeOption = {
  tooltip: { trigger: 'item', formatter: '{a}<br/>{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: '威胁类型',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false, position: 'center' },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' },
      },
      labelLine: { show: false },
      data: [
        { value: 45, name: 'Web攻击', itemStyle: { color: '#DC2626' } },
        { value: 28, name: '恶意扫描', itemStyle: { color: '#F59E0B' } },
        { value: 18, name: 'DDoS攻击', itemStyle: { color: '#ff7a45' } },
        { value: 12, name: '数据泄露', itemStyle: { color: '#7C3AED' } },
        { value: 8, name: '其他威胁', itemStyle: { color: '#8c8c8c' } },
      ],
    },
  ],
};

// 风险等级分布柱状图
const riskLevelOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['严重', '高危', '中危', '低危', '信息'],
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '风险数量',
      type: 'bar',
      barWidth: '50%',
      data: [
        { value: 3, itemStyle: { color: '#B91C1C' } },
        { value: 12, itemStyle: { color: '#DC2626' } },
        { value: 28, itemStyle: { color: '#F59E0B' } },
        { value: 45, itemStyle: { color: '#1677FF' } },
        { value: 70, itemStyle: { color: '#16A34A' } },
      ],
    },
  ],
};

// 表格列定义
const eventColumns = [
  {
    title: '时间',
    dataIndex: 'time',
    key: 'time',
    width: 180,
  },
  {
    title: '事件类型',
    dataIndex: 'type',
    key: 'type',
    render: (type: string) => <Tag color="blue">{type}</Tag>,
  },
  {
    title: '级别',
    dataIndex: 'level',
    key: 'level',
    width: 100,
    render: (level: string) => {
      const config: Record<string, { color: string; text: string }> = {
        critical: { color: 'red', text: '严重' },
        high: { color: 'orange', text: '高危' },
        medium: { color: 'gold', text: '中危' },
        low: { color: 'green', text: '低危' },
      };
      const c = config[level] || { color: 'default', text: level };
      return <Tag color={c.color}>{c.text}</Tag>;
    },
  },
  {
    title: '来源IP',
    dataIndex: 'source',
    key: 'source',
    render: (ip: string) => <span className="font-mono text-sm">{ip}</span>,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: string) => {
      const config: Record<string, { status: string; text: string }> = {
        handled: { status: 'success', text: '已处理' },
        handling: { status: 'processing', text: '处理中' },
        pending: { status: 'warning', text: '待处理' },
      };
      const c = config[status] || { status: 'default', text: status };
      return <Badge status={c as any} text={c.text} />;
    },
  },
  {
    title: '详情',
    dataIndex: 'detail',
    key: 'detail',
    ellipsis: true,
  },
];

export default function SecurityOverviewPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['security-overview-stats'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 600));
      return mockSecurityStats;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <SafetyCertificateOutlined className="text-2xl text-red-600" />
          <h1 className="text-2xl font-bold m-0">安全总览仪表盘</h1>
          <Badge count={stats?.todayAlerts || 0} style={{ backgroundColor: '#DC2626' }} />
        </div>

        {/* 核心指标卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="安全评分"
                value={stats?.securityScore || 0}
                suffix="/100"
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{ color: stats?.securityScore && stats.securityScore >= 90 ? '#3f8600' : '#F59E0B' }}
              />
              <Progress
                percent={stats?.securityScore || 0}
                size="small"
                status={stats?.securityScore && stats.securityScore >= 90 ? 'success' : 'active'}
                strokeColor={stats?.securityScore && stats.securityScore >= 90 ? '#16A34A' : '#F59E0B'}
                className="mt-2"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="今日告警数"
                value={stats?.todayAlerts || 0}
                prefix={<AlertOutlined />}
                valueStyle={{ color: '#DC2626' }}
                suffix={
                  <span className="text-sm text-gray-400 ml-2">
                    较昨日 +15%
                  </span>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="待处理漏洞"
                value={stats?.pendingVulnerabilities || 0}
                prefix={<BugOutlined />}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-sm text-orange-500 mt-1">需尽快处理</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <Statistic
                title="在线设备数"
                value={stats?.onlineDevices || 0}
                prefix={<DesktopOutlined />}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-sm text-blue-500 mt-1">设备在线率 98.5%</div>
            </Card>
          </Col>
        </Row>

        {/* 次级指标 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title="今日拦截攻击"
                value={stats?.blockedAttacks || 0}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: '#B91C1C' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title="平均响应时间"
                value={stats?.avgResponseTime || 0}
                suffix="秒"
                precision={1}
                valueStyle={{ color: '#16A34A' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" className="shadow-sm">
              <Statistic
                title="本周事件总数"
                value={stats?.totalEvents || 0}
                valueStyle={{ color: '#7C3AED' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="安全事件趋势（近7天）" className="shadow-sm">
              <SafeECharts option={securityTrendOption} style={{ height: 350 }} title="安全事件趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="威胁类型分布" className="shadow-sm">
              <SafeECharts option={threatTypeOption} style={{ height: 350 }} title="威胁类型分布" />
            </Card>
          </Col>
        </Row>

        {/* 风险等级分布 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="风险等级分布" className="shadow-sm">
              <SafeECharts option={riskLevelOption} style={{ height: 300 }} title="风险等级分布" />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="安全状态摘要" className="shadow-sm" style={{ height: 'calc(300px + 48px)' }}>
              <div className="space-y-4 p-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">防火墙状态</span>
                  <Badge status="success" text="运行正常" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">WAF防护</span>
                  <Badge status="success" text="已启用" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">入侵检测系统</span>
                  <Badge status="processing" text="监控中" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">加密传输</span>
                  <Badge status="success" text="TLS 1.3" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">备份状态</span>
                  <Badge status="success" text="最新备份 2小时前" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">证书有效期</span>
                  <Badge status="warning" text="剩余89天" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最后扫描时间</span>
                  <span className="text-sm text-gray-500">2024-06-08 12:00</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最近安全事件列表 */}
        <Card title="最近安全事件" className="shadow-sm" extra={<a>查看全部 →</a>}>
          <Table
            dataSource={mockSecurityEvents}
            columns={eventColumns}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            size="middle"
            loading={isLoading}
          />
        </Card>

        {/* 中萨交易所安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-red-500 mt-1" />
            <div>
              <h4 className="font-bold text-red-700 m-0 mb-1">中萨数字科技交易所安全提示</h4>
              <p className="text-sm text-red-600 m-0">
                当前系统安全评分{stats?.securityScore || 92}分，整体安全态势良好。
                请注意：区块链资产安全是重中之重，建议定期更新钱包密钥，开启双重认证，
                密切关注异常交易告警。所有涉及资金操作均需二次验证。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
