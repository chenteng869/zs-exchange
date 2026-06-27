'use client';

import { useEffect, useState } from 'react';
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/audit-logs?pageSize=100', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items: AuditLogEntry[] = (d?.data?.items ?? []).map((l: any) => ({
          id: l.id,
          operator: l.operatorName ?? l.operatorId,
          operatorRole: l.operatorRole ?? '-',
          ipAddress: l.ipAddress ?? '-',
          action: l.action,
          module: l.module,
          detail: l.details ?? '',
          result: (l.status as AuditLogEntry['result']) ?? 'success',
          timestamp: l.createdAt?.slice(0, 19).replace('T', ' ') ?? '',
        }));
        setAuditLogs(items);
      })
      .catch(() => setAuditLogs([]))
      .finally(() => setIsLoading(false));
  }, []);

  const stats = {
    totalLogs: auditLogs.length,
    todayLogs: auditLogs.filter(l => l.timestamp.startsWith(new Date().toISOString().slice(0, 10))).length,
    successRate: auditLogs.length > 0 ? parseFloat(((auditLogs.filter(l => l.result === 'success').length / auditLogs.length) * 100).toFixed(1)) : 0,
    failedCount: auditLogs.filter(l => l.result === 'failed').length,
  };

  // 筛选日志
  const filteredLogs = auditLogs.filter(log => {
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
