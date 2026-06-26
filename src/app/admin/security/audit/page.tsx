'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Input, Select, Space, message, DatePicker, Badge, Statistic, Tooltip } from 'antd';
import {
  FileSearchOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  DesktopOutlined,
  FileTextOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import type { Dayjs } from 'dayjs';

// 审计日志接口
interface AuditLogEntry {
  id: string;
  operator: string;
  operatorRole: string;
  ipAddress: string;
  action: string;
  module: string;
  detail: string;
  result: 'success' | 'failed' | 'warning';
  timestamp: string;
  userAgent?: string;
}

// 模拟审计日志数据
const mockAuditLogs: AuditLogEntry[] = [
  { id: 'LOG-20240608-001', operator: 'admin', operatorRole: '超级管理员', ipAddress: '192.168.1.100', action: '用户封禁', module: '用户管理', detail: '封禁用户 suspicious_user_007 (原因: 多次异常交易)', result: 'success', timestamp: '2024-06-08 14:35:22', userAgent: 'Chrome/125.0' },
  { id: 'LOG-20240608-002', operator: 'zhang_wei', operatorRole: '安全管理员', ipAddress: '192.168.1.105', action: '防火墙规则修改', module: '防火墙管理', detail: '更新规则 FW-003: 将动作从 deny 改为 reject', result: 'success', timestamp: '2024-06-08 14:28:15', userAgent: 'Firefox/126.0' },
  { id: 'LOG-20240608-003', operator: 'li_ming', operatorRole: '安全分析师', ipAddress: '192.168.1.110', action: '查看漏洞报告', module: '漏洞扫描', detail: '下载扫描任务 STK-001 的完整报告 (PDF)', result: 'success', timestamp: '2024-06-08 14:15:43', userAgent: 'Safari/17.4' },
  { id: 'LOG-20240608-004', operator: 'wang_fang', operatorRole: '应急响应专员', ipAddress: '10.0.0.55', action: '处理安全事件', module: '入侵检测', detail: '确认并处理入侵事件 INC-20240608-003 (DDoS攻击)', result: 'success', timestamp: '2024-06-08 13:58:30', userAgent: 'Edge/124.0' },
  { id: 'LOG-20240608-005', operator: 'unknown_user', operatorRole: '-', ipAddress: '203.0.113.50', action: '登录失败', module: '认证系统', detail: '管理员登录失败 - 密码错误 (尝试次数: 15)', result: 'failed', timestamp: '2024-06-08 13:45:18', userAgent: 'Python-requests/2.31' },
  { id: 'LOG-20240608-006', operator: 'zhao_jun', operatorRole: '合规审计员', ipAddress: '172.16.0.88', action: '导出审计日志', module: '审计管理', detail: '导出 2024-06-01 至 2024-06-07 的操作日志 (CSV格式)', result: 'success', timestamp: '2024-06-08 13:30:05', userAgent: 'Chrome/125.0' },
  { id: 'LOG-20240608-007', operator: 'chen_hui', operatorRole: '运维工程师', ipAddress: '192.168.1.120', action: '密钥轮换', module: '加密管理', detail: '执行数据库加密密钥定期轮换 (密钥ID: key-db-202406)', result: 'success', timestamp: '2024-06-08 13:15:22', userAgent: 'curl/8.5' },
  { id: 'LOG-20240608-008', operator: 'zhang_wei', operatorRole: '安全管理员', ipAddress: '192.168.1.105', action: '策略配置变更', module: '安全策略', detail: '更新WAF防护策略 v2.3 → v2.4 (新增SQL注入规则集)', result: 'warning', timestamp: '2024-06-08 12:58:47', userAgent: 'Firefox/126.0' },
  { id: 'LOG-20240608-009', operator: 'li_ming', operatorRole: '安全分析师', ipAddress: '192.168.1.110', action: '威胁情报查询', module: '威胁情报', detail: '查询IOC指标: IP 185.220.101.50, Hash abc123def456', result: 'success', timestamp: '2024-06-08 12:42:33', userAgent: 'Chrome/125.0' },
  { id: 'LOG-20240608-010', operator: 'sun_lei', operatorRole: '安全管理员(停用)', ipAddress: '10.0.0.99', action: '访问被拒绝', module: 'RBAC权限', detail: '尝试访问防火墙管理模块 - 权限不足', result: 'failed', timestamp: '2024-06-08 12:28:19', userAgent: 'Chrome/124.0' },
  { id: 'LOG-20240608-011', operator: 'admin', operatorRole: '超级管理员', ipAddress: '192.168.1.100', action: '角色权限变更', module: 'RBAC管理', detail: '为用户 sun_lei 移除"安全管理员"角色', result: 'success', timestamp: '2024-06-08 12:15:55', userAgent: 'Edge/124.0' },
  { id: 'LOG-20240608-012', operator: 'wang_fang', operatorRole: '应急响应专员', ipAddress: '10.0.0.55', action: '应急预案启动', module: '应急响应', detail: '启动应急预案 P-003 (DDoS攻击应急响应流程)', result: 'success', timestamp: '2024-06-08 11:58:40', userAgent: 'Firefox/126.0' },
];

// 操作类型分布图
const actionTypeOption = {
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 35, name: '配置变更', itemStyle: { color: '#1677FF' } },
      { value: 25, name: '数据查询', itemStyle: { color: '#16A34A' } },
      { value: 20, name: '安全事件处理', itemStyle: { color: '#DC2626' } },
      { value: 12, name: '登录认证', itemStyle: { color: '#F59E0B' } },
      { value: 8, name: '数据导出', itemStyle: { color: '#7C3AED' } },
    ],
    label: { formatter: '{b}\n{c}次' },
  }],
};

// 高频操作TOP10
const topActionsOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: {
    type: 'category',
    data: ['防火墙规则修改', '用户管理操作', '登录认证', '漏洞报告查看', '安全事件处理', '策略配置变更', '日志导出', '密钥管理', '角色权限变更', '威胁情报查询'],
  },
  series: [{
    type: 'bar',
    data: [156, 142, 128, 98, 87, 76, 65, 54, 43, 32].map((v, i) => ({
      value: v,
      itemStyle: { color: i < 3 ? '#DC2626' : i < 6 ? '#F59E0B' : '#1677FF' },
    })),
    label: { show: true, position: 'right', fontSize: 11 },
  }],
};

export default function SecurityAuditPage() {
  const [searchText, setSearchText] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return { totalLogs: 15840, todayLogs: 234, successRate: 96.8, failedCount: 75 };
    },
  });

  // 筛选日志
  const filteredLogs = mockAuditLogs.filter(log => {
    const matchSearch = !searchText ||
      log.operator.toLowerCase().includes(searchText.toLowerCase()) ||
      log.action.includes(searchText) ||
      log.id.toLowerCase().includes(searchText.toLowerCase()) ||
      log.ipAddress.includes(searchText);
    const matchModule = !moduleFilter || log.module === moduleFilter;
    const matchResult = !resultFilter || log.result === resultFilter;
    return matchSearch && matchModule && matchResult;
  });

  // 导出日志
  const handleExport = () => {
    message.success('正在导出审计日志，请稍候...');
    setTimeout(() => message.info('导出完成：audit_logs_20240608.csv'), 1500);
  };

  // 表格列定义
  const columns = [
    { title: '日志ID', dataIndex: 'id', key: 'id', width: 170, render: (id: string) => <span className="font-mono text-xs">{id}</span> },
    {
      title: '操作人',
      key: 'operator',
      width: 130,
      render: (_: any, record: AuditLogEntry) => (
        <div>
          <div className="font-medium text-sm flex items-center gap-1"><UserOutlined />{record.operator}</div>
          <div className="text-xs text-gray-400">{record.operatorRole}</div>
        </div>
      ),
    },
    { title: 'IP地址', dataIndex: 'ipAddress', key: 'ipAddress', width: 140, render: (ip: string) => <span className="font-mono text-xs">{ip}</span> },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
      render: (mod: string) => <Tag>{mod}</Tag>,
    },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (result: string) => {
        const configs: Record<string, { status: string; text: string; color: string }> = {
          success: { status: 'success', text: '成功', color: 'green' },
          failed: { status: 'error', text: '失败', color: 'red' },
          warning: { status: 'warning', text: '警告', color: 'orange' },
        };
        const c = configs[result];
        return <Badge status={c.status as any} text={<span className={`text-${c.color}-600`}>{c.text}</span>} />;
      },
    },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 165 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <FileSearchOutlined className="text-2xl text-green-600" />
          <h1 className="text-2xl font-bold m-0">安全审计中心</h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="日志总量" value={stats?.totalLogs || 0} prefix={<FileTextOutlined />} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="今日日志" value={stats?.todayLogs || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#1677FF' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="成功率" value={stats?.successRate || 0} suffix="%" precision={1} valueStyle={{ color: '#16A34A' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="异常日志" value={stats?.failedCount || 0} prefix={<WarningOutlined style={{ display: 'none' }} />} valueStyle={{ color: '#DC2626' }} /></Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="操作类型分布" className="shadow-sm">
              <SafeECharts option={actionTypeOption} style={{ height: 300 }} title="操作类型分布" />
            </Card>
          </Col>
          <Col xs={24} lg={14}>
            <Card title="高频操作 TOP10" className="shadow-sm">
              <SafeECharts option={topActionsOption} style={{ height: 300 }} title="高频操作" />
            </Card>
          </Col>
        </Row>

        {/* 日志列表 */}
        <Card
          title="操作日志列表"
          className="shadow-sm"
          extra={
            <Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>导出日志</Button>
              <Button icon={<DownloadOutlined />}>批量导出</Button>
            </Space>
          }
        >
          {/* 筛选工具栏 */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Input.Search
              placeholder="搜索操作人/IP/操作类型"
              allowClear
              style={{ width: 260 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={<SearchOutlined />}
            />
            <Select
              placeholder="模块筛选"
              style={{ width: 140 }}
              allowClear
              value={moduleFilter || undefined}
              onChange={setModuleFilter}
              options={[
                { label: '用户管理', value: '用户管理' },
                { label: '防火墙管理', value: '防火墙管理' },
                { label: '漏洞扫描', value: '漏洞扫描' },
                { label: '入侵检测', value: '入侵检测' },
                { label: '审计管理', value: '审计管理' },
                { label: '加密管理', value: '加密管理' },
                { label: '安全策略', value: '安全策略' },
                { label: 'RBAC管理', value: 'RBAC管理' },
                { label: '威胁情报', value: '威胁情报' },
                { label: '应急响应', value: '应急响应' },
              ]}
            />
            <Select
              placeholder="结果筛选"
              style={{ width: 120 }}
              allowClear
              value={resultFilter || undefined}
              onChange={setResultFilter}
              options={[
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
                { label: '警告', value: 'warning' },
              ]}
            />
            <DatePicker.RangePicker style={{ width: 260 }} value={dateRange} onChange={(dates) => setDateRange(dates as any)} />
            <span className="text-sm text-gray-500 ml-auto">共 {filteredLogs.length} 条记录</span>
          </div>

          <Table
            dataSource={filteredLogs}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条日志`,
            }}
            size="middle"
            loading={isLoading}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-green-500 mt-1" />
            <div>
              <h4 className="font-bold text-green-700 m-0 mb-1">审计日志合规说明</h4>
              <p className="text-sm text-green-600 m-0">
                中萨数字科技交易所的审计日志满足金融行业合规要求(等保三级)，所有操作均完整记录并保留至少180天。
                日志包含操作人、时间、IP、操作内容、结果等完整信息链，支持追溯和取证。
                建议每日审查异常日志，每周进行操作趋势分析。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
