'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col, Statistic,
  Tabs, message, Progress, Descriptions, List, Divider, Select, Modal,
  InputNumber, Radio,
} from 'antd';
import {
  LineChartOutlined, BarChartOutlined, DownloadOutlined,
  TrophyOutlined, RiseOutlined, FallOutlined, BulbOutlined,
  ExperimentOutlined, FileTextOutlined as ReportIcon, FilterOutlined, AimOutlined,
  ThunderboltOutlined, CheckCircleOutlined, SwapOutlined,
  PieChartOutlined, EyeOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 流程效率报表数据（10条）
const efficiencyReport = [
  { processName: 'KYC认证流程', totalInstances: 35600, completed: 34888, rejected: 520, timeout: 192, avgDuration: '18m', passRate: 98.0, reworkRate: 1.46, lastWeekPassRate: 97.5, change: '+0.5', costSaving: '¥12.5万', autoRate: 92 },
  { processName: '用户提现审批流程', totalInstances: 15200, completed: 14440, rejected: 580, timeout: 180, avgDuration: '45m', passRate: 95.0, reworkRate: 3.82, lastWeekPassRate: 94.2, change: '+0.8', costSaving: '¥8.3万', autoRate: 78 },
  { processName: 'NFT上架审批流程', totalInstances: 2850, completed: 2508, rejected: 280, timeout: 62, avgDuration: '2h15m', passRate: 88.0, reworkRate: 9.82, lastWeekPassRate: 86.5, change: '+1.5', costSaving: '¥5.2万', autoRate: 65 },
  { processName: '异常交易处理流程', totalInstances: 320, completed: 262, rejected: 42, timeout: 16, avgDuration: '4h', passRate: 81.9, reworkRate: 13.12, lastWeekPassRate: 80.0, change: '+1.9', costSaving: '¥2.1万', autoRate: 45 },
  { processName: '项目入驻申请流程', totalInstances: 420, completed: 315, rejected: 85, timeout: 20, avgDuration: '5d', passRate: 75.0, reworkRate: 20.24, lastWeekPassRate: 72.0, change: '+3.0', costSaving: '¥1.8万', autoRate: 35 },
  { processName: '合规审查工作流', totalInstances: 8920, completed: 8560, rejected: 280, timeout: 80, avgDuration: '3h30m', passRate: 96.0, reworkRate: 3.14, lastWeekPassRate: 95.2, change: '+0.8', costSaving: '¥15.6万', autoRate: 85 },
  { processName: '用户投诉处理流程', totalInstances: 12500, completed: 11875, rejected: 480, timeout: 145, avgDuration: '1h20m', passRate: 95.0, reworkRate: 3.84, lastWeekPassRate: 93.8, change: '+1.2', costSaving: '¥6.8万', autoRate: 72 },
  { processName: '资金清算对账流程', totalInstances: 7680, completed: 7520, rejected: 120, timeout: 40, avgDuration: '55m', passRate: 97.9, reworkRate: 1.56, lastWeekPassRate: 97.0, change: '+0.9', costSaving: '¥10.2万', autoRate: 90 },
  { processName: '代币发行审批流程', totalInstances: 180, completed: 156, rejected: 18, timeout: 6, avgDuration: '6d', passRate: 86.7, reworkRate: 13.33, lastWeekPassRate: 84.0, change: '+2.7', costSaving: '¥0.8万', autoRate: 28 },
  { processName: 'API密钥轮换流程', totalInstances: 2400, completed: 2376, rejected: 16, timeout: 8, avgDuration: '3m', passRate: 99.0, reworkRate: 0.67, lastWeekPassRate: 98.8, change: '+0.2', costSaving: '¥3.5万', autoRate: 98 },
];

// 自动化率趋势图配置
const automationTrendOption: Record<string, any> = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['自动化率(%)', '目标线'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
  xAxis: { type: 'category' as const, data: ['KYC', '提现', 'NFT上架', '异常处理', '项目入驻', '合规审查', '投诉处理', '资金对账'] },
  yAxis: { type: 'value' as const, min: 0, max: 100 },
  series: [
    { name: '自动化率(%)', type: 'bar' as const, data: [92, 78, 65, 45, 35, 85, 72, 90], itemStyle: (params: any) => { const v = params.value; return { color: v >= 80 ? '#16A34A' : v >= 50 ? '#F59E0B' : '#DC2626' }; }, barWidth: '45%' },
    { name: '目标线', type: 'line' as const, data: [90, 75, 70, 55, 50, 85, 75, 92], lineStyle: { type: 'dashed', color: '#DC2626' }, itemStyle: { color: '#DC2626' }, symbolSize: 4 },
  ],
};

// 成本节约分布
const costDistOption = {
  tooltip: { trigger: 'item' },
  series: [{
    type: 'pie',
    radius: ['35%', '65%'],
    center: ['50%', '50%'],
    data: [
      { value: 15.6, name: '合规审查', itemStyle: { color: '#1677FF' } },
      { value: 12.5, name: 'KYC认证', itemStyle: { color: '#16A34A' } },
      { value: 10.2, name: '资金对账', itemStyle: { color: '#F59E0B' } },
      { value: 8.3, name: '提现审批', itemStyle: { color: '#7C3AED' } },
      { value: 6.8, name: '投诉处理', itemStyle: { color: '#EC4899' } },
    ],
    label: { formatter: '{b}\n¥{c}万 ({d}%)' },
  }],
};

// 优化建议列表（按影响程度排序）
const optimizationSuggestions = [
  { id: 'opt-001', targetProcess: 'NFT上架审批流程', suggestion: '引入AI自动初审，减少人工审核环节', impact: 'high', expectedImprovement: '-65% 耗时', difficulty: 'medium', status: 'planned', priority: 1, estimatedCost: '¥5万' },
  { id: 'opt-002', targetProcess: '异常交易处理流程', suggestion: '增加自动风控规则引擎，前置拦截', impact: 'high', expectedImprovement: '-48% 处理量', difficulty: 'high', status: 'reviewing', priority: 2, estimatedCost: '¥12万' },
  { id: 'opt-003', targetProcess: '用户提现审批流程', suggestion: '优化财务复核节点，并行化处理', impact: 'medium', expectedImprovement: '-32% 等待时间', difficulty: 'low', status: 'implementing', priority: 3, estimatedCost: '¥2万' },
  { id: 'opt-004', targetProcess: '项目入驻申请流程', suggestion: '拆分为预审+终审两阶段，减少单次审核复杂度', impact: 'medium', expectedImprovement: '-42% 返工率', difficulty: 'medium', status: 'planned', priority: 4, estimatedCost: '¥3万' },
  { id: 'opt-005', targetProcess: 'KYC认证流程', suggestion: '优化三方API调用策略，增加本地缓存层', impact: 'low', expectedImprovement: '-18% API调用', difficulty: 'low', status: 'completed', priority: 5, estimatedCost: '¥1万' },
  { id: 'opt-006', targetProcess: '用户投诉处理流程', suggestion: '增加智能客服分流，自动处理常见问题', impact: 'medium', expectedImprovement: '-38% 人工介入', difficulty: 'medium', status: 'reviewing', priority: 6, estimatedCost: '¥8万' },
  { id: 'opt-007', targetProcess: '代币发行审批流程', suggestion: '建立标准化检查清单，减少遗漏', impact: 'low', expectedImprovement: '-25% 审核错误', difficulty: 'low', status: 'planned', priority: 7, estimatedCost: '¥0.5万' },
  { id: 'opt-008', targetProcess: '合规审查工作流', suggestion: '引入合同比对AI工具，自动识别差异', impact: 'high', expectedImprovement: '-52% 法务工时', difficulty: 'high', status: 'researching', priority: 8, estimatedCost: '¥20万' },
];

export default function BPMAnalysisPage() {
  const [activeTab, setActiveTab] = useState('efficiency');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [impactFilter, setImpactFilter] = useState<string>('');

  // 影响程度颜色映射
  const getImpactConfig = (impact: string) => ({
    high: { color: 'red', text: '高影响', icon: <ThunderboltOutlined /> },
    medium: { color: 'orange', text: '中影响', icon: <RiseOutlined /> },
    low: { color: 'blue', text: '低影响', icon: <FallOutlined /> },
  }[impact] || { color: 'default', text: impact, icon: null });

  const getStatusTag = (s: string) => ({
    planned: { color: 'default', text: '计划中' },
    researching: { color: 'processing', text: '调研中' },
    reviewing: { color: 'warning', text: '评审中' },
    implementing: { color: 'processing', text: '实施中' },
    completed: { color: 'success', text: '已完成' },
  }[s] || { color: 'default', text: s });

  // 效率分析表格列
  const effColumns = [
    { title: '流程名称', dataIndex: 'processName', key: 'processName', render: (v: string) => <span className="font-semibold">{v}</span> },
    { title: '总实例数', dataIndex: 'totalInstances', key: 'totalInstances', width: 110, render: (v: number) => v.toLocaleString() },
    { title: '通过率', dataIndex: 'passRate', key: 'passRate', width: 100, render: (v: number) => (
      <Progress percent={v} size="small" status={v >= 95 ? 'success' : v >= 85 ? 'normal' : 'exception'} format={() => `${v}%`} />
    )},
    { title: '返工率', dataIndex: 'reworkRate', key: 'reworkRate', width: 90, render: (v: number) => <span className={v > 10 ? 'text-red-500 font-medium' : ''}>{v}%</span> },
    { title: '平均耗时', dataIndex: 'avgDuration', key: 'avgDuration', width: 100 },
    { title: '周环比', dataIndex: 'change', key: 'change', width: 90, render: (v: string) => (
      <span className={v.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{v.startsWith('+') ? <RiseOutlined /> : <FallOutlined />} {v}</span>
    )},
    { title: '成本节约', dataIndex: 'costSaving', key: 'costSaving', width: 110, render: (v: string) => <span className="font-medium text-green-600">{v}</span> },
    { title: '自动化率', dataIndex: 'autoRate', key: 'autoRate', width: 110, render: (v: number) => (
      <Progress percent={v} size="small" format={() => `${v}%`} />
    )},
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedReport(r); setDetailModalVisible(true); } },
    { key: 'export', label: '导出', icon: <DownloadOutlined />, onClick: () => message.success('报告已导出') },
  ];

  // 优化建议表格列
  const optColumns = [
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 70, render: (p: number) => (
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${p <= 2 ? 'bg-red-500' : p <= 4 ? 'bg-orange-400' : 'bg-blue-400'}`}>{p}</span>
    )},
    { title: '目标流程', dataIndex: 'targetProcess', key: 'targetProcess', render: (v: string) => <Tag>{v}</Tag> },
    { title: '优化建议', dataIndex: 'suggestion', key: 'suggestion', ellipsis: true, render: (v: string) => <span className="text-sm">{v}</span> },
    { title: '影响程度', dataIndex: 'impact', key: 'impact', width: 100, render: (i: string) => { const c = getImpactConfig(i); return <Tag color={c.color}>{c.text}</Tag>; }},
    { title: '预期效果', dataIndex: 'expectedImprovement', key: 'expectedImprovement', width: 130, render: (v: string) => <span className="text-green-600">{v}</span> },
    { title: '实施难度', dataIndex: 'difficulty', key: 'difficulty', width: 90, render: (d: string) => ({ high: '高', medium: '中', low: '低' }[d] || d) },
    { title: '预估成本', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 100 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => { const st = getStatusTag(s); return <Badge status={st.color as any} text={st.text} />; }},
  ];

  const optActions: any[] = [
    { key: 'approve', label: '批准', icon: <CheckCircleOutlined />, type: 'primary', onClick: () => message.success('已批准实施') },
  ];

  const filteredOpts = (impactFilter ? optimizationSuggestions.filter(o => o.impact === impactFilter) : optimizationSuggestions);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ExperimentOutlined className="text-purple-600" />
              流程效率分析中心
            </h1>
            <p className="text-gray-500 mt-1">流程效率深度分析、智能优化建议、对比报告与ROI评估</p>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => message.info('正在生成综合分析报告...')}>导出报告</Button>
          </Space>
        </div>

        {/* 核心统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="分析报告数" value={efficiencyReport.length} icon={<BarChartOutlined />} color="#1677FF" suffix="份" description="本月已生成" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="优化建议" value={optimizationSuggestions.length} icon={<BulbOutlined />} color="#F59E0B" trend="up" trendValue="+3 本月新增" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="平均效率提升" value={23.5} icon={<RiseOutlined />} color="#16A34A" suffix="%" trend="up" trendValue="+5.2%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="累计成本节约" value={'52.3'} icon={<DollarCircleOutlined />} color="#7C3AED" suffix="万元" description="近30日" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="整体自动化率" value={71.2} icon={<ThunderboltOutlined />} color="#DC2626" suffix="%" description="较上月 +3.5%" />
          </Col>
        </Row>

        {/* 主要内容区 */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'efficiency',
            label: <span><LineChartOutlined /> 效率分析</span>,
            children: (
              <DataTable
                columns={effColumns}
                dataSource={efficiencyReport}
                title="各流程效率指标一览"
                actions={actions}
                rowKey="processName"
                pagination={{ pageSize: 10 }}
                onRefresh={() => message.info('数据已刷新')}
              />
            ),
          },
          {
            key: 'optimization',
            label: <span><BulbOutlined /> 优化建议 ({optimizationSuggestions.length})</span>,
            children: (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Select placeholder="影响程度筛选" style={{ width: 140 }} allowClear value={impactFilter || undefined} onChange={setImpactFilter} options={[
                    { label: '高影响', value: 'high' }, { label: '中影响', value: 'medium' }, { label: '低影响', value: 'low' },
                  ]} />
                  <Tag color="red">高影响: {optimizationSuggestions.filter(o => o.impact === 'high').length}</Tag>
                  <Tag color="orange">中影响: {optimizationSuggestions.filter(o => o.impact === 'medium').length}</Tag>
                  <Tag color="blue">低影响: {optimizationSuggestions.filter(o => o.impact === 'low').length}</Tag>
                </div>
                <DataTable
                  columns={optColumns}
                  dataSource={filteredOpts}
                  title="智能优化建议列表"
                  actions={optActions}
                  rowKey="id"
                  pagination={{ pageSize: 8 }}
                />
              </div>
            ),
          },
          {
            key: 'comparison',
            label: <span><SwapOutlined /> 对比分析</span>,
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="各流程自动化率 vs 目标" className="shadow-sm" size="small">
                    <SafeECharts option={automationTrendOption} style={{ height: 360 }} title="自动化率对比" />
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card title="成本节约分布 TOP5" className="shadow-sm" size="small">
                    <SafeECharts option={costDistOption} style={{ height: 360 }} title="成本分布" />
                  </Card>
                </Col>
              </Row>
            ),
          },
        ]} />

        {/* 详情弹窗 */}
        <Modal
          title={`${selectedReport?.processName || ''} - 详细分析`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={720}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            <Button key="export" icon={<DownloadOutlined />} onClick={() => message.success('已导出详细报告')}>导出PDF</Button>,
          ]}
        >
          {selectedReport && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="流程名称" span={2}><span className="font-semibold">{selectedReport.processName}</span></Descriptions.Item>
                <Descriptions.Item label="总实例数">{selectedReport.totalInstances.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="完成数">{selectedReport.completed.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="通过率"><Progress percent={selectedReport.passRate} size="small" format={() => `${selectedReport.passRate}%`} /></Descriptions.Item>
                <Descriptions.Item label="返工率"><span className={selectedReport.reworkRate > 10 ? 'text-red-500' : ''}>{selectedReport.reworkRate}%</span></Descriptions.Item>
                <Descriptions.Item label="平均耗时">{selectedReport.avgDuration}</Descriptions.Item>
                <Descriptions.Item label="超时数">{selectedReport.timeout}</Descriptions.Item>
                <Descriptions.Item label="周环比"><span className={selectedReport.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}>{selectedReport.change}</span></Descriptions.Item>
                <Descriptions.Item label="成本节约"><span className="text-green-600 font-medium">{selectedReport.costSaving}</span></Descriptions.Item>
                <Descriptions.Item label="自动化率" span={2}><Progress percent={selectedReport.autoRate} format={() => `${selectedReport.autoRate}%`} /></Descriptions.Item>
              </Descriptions>
              <Divider className="my-2" />
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <h4 className="font-semibold mb-1"><BulbOutlined /> 关键洞察</h4>
                <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                  <li>该流程自动化率为 <strong>{selectedReport.autoRate}%</strong>，{selectedReport.autoRate >= 80 ? '表现优秀' : selectedReport.autoRate >= 50 ? '有提升空间' : '亟需优化'}</li>
                  <li>返工率 {selectedReport.reworkRate}%，{selectedReport.reworkRate > 10 ? '高于行业均值，需重点排查原因' : '处于健康水平'}</li>
                  <li>本周通过率较上周变化 {selectedReport.change}，趋势{selectedReport.change.startsWith('+') ? '向好' : '需关注'}</li>
                </ul>
              </div>
            </div>
          )}
        </Modal>

        {/* 业务特性说明 */}
        <Card className="shadow-sm bg-gradient-to-r from-purple-50 to-pink-50" size="small">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 text-lg mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">AI驱动的流程优化引擎</h4>
              <p className="text-sm text-gray-600">基于历史运行数据和机器学习算法，自动识别低效环节、预测瓶颈风险并提供可执行的优化方案。每项建议附带预期收益、实施难度和ROI预估，辅助决策者优先投入资源。</p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

// 需要补充的图标导入
import { DollarCircleOutlined } from '@ant-design/icons';
