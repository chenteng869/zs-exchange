/**
 * 管理员操作审计日志页面
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  DatePicker,
  Select,
  Input,
  Button,
  Space,
  Tag,
  Modal,
  Descriptions,
  Badge,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  ExportOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  queryAuditLogs,
  getAuditStatistics,
  exportAuditLogs,
  type AuditLogEntry,
  type AuditLogModule,
  type AuditLogAction,
  type AuditLogStatus,
} from '@/lib/admin/audit-log';

const { RangePicker } = DatePicker;
const { Option } = Select;

const moduleLabels: Record<AuditLogModule, string> = {
  users: '用户管理',
  transactions: '交易管理',
  content: '内容管理',
  finance: '财务管理',
  system: '系统管理',
  risk: '风控管理',
  cex: 'CEX交易',
  dex: 'DEX交易',
  defi: 'DeFi理财',
  wallet: '钱包管理',
  staking: '质押挖矿',
  ido: 'IDO/IEO',
  quant: '量化交易',
  nft: 'NFT市场',
  entertainment: '娱乐竞猜',
  ecommerce: '电商购物',
  enterprise: '企业服务',
  token: '通证管理',
  listing: '上币管理',
  security: '安全管理',
  command: '指令中心',
  blockchain: '区块链',
  bpm: 'BPM流程',
  iot: '物联网',
  i18n: '多语言',
  analytics: '数据分析',
};

const actionLabels: Record<AuditLogAction, string> = {
  view: '查看',
  create: '创建',
  edit: '编辑',
  delete: '删除',
  freeze: '冻结',
  unfreeze: '解冻',
  approve: '审批通过',
  reject: '审批驳回',
  login: '登录',
  logout: '登出',
  export: '导出',
  import: '导入',
  config_change: '配置变更',
  permission_change: '权限变更',
  password_change: '密码变更',
  role_create: '创建角色',
  role_update: '更新角色',
  role_delete: '删除角色',
  admin_create: '创建管理员',
  admin_update: '更新管理员',
  admin_delete: '删除管理员',
};

const statusColors: Record<AuditLogStatus, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'processing',
};

const statusLabels: Record<AuditLogStatus, string> = {
  success: '成功',
  warning: '警告',
  error: '失败',
  info: '信息',
};

export default function AuditLogsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [module, setModule] = useState<AuditLogModule | undefined>();
  const [action, setAction] = useState<AuditLogAction | undefined>();
  const [status, setStatus] = useState<AuditLogStatus | undefined>();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const statistics = useMemo(() => getAuditStatistics(7), []);

  const queryResult = useMemo(() => {
    return queryAuditLogs({
      startTime: dateRange[0]?.toISOString(),
      endTime: dateRange[1]?.toISOString(),
      module,
      action,
      status,
      keyword,
      page,
      pageSize,
    });
  }, [dateRange, module, action, status, keyword, page, pageSize]);

  const handleViewDetail = (record: AuditLogEntry) => {
    setSelectedLog(record);
    setDetailModal(true);
  };

  const handleExport = () => {
    const data = exportAuditLogs(
      {
        startTime: dateRange[0]?.toISOString(),
        endTime: dateRange[1]?.toISOString(),
        module,
        action,
        status,
        keyword,
      },
      'csv'
    );

    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${dayjs().format('YYYYMMDD-HHmmss')}.csv`;
    link.click();
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'operatorRole',
      key: 'operatorRole',
      width: 120,
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (val: AuditLogModule) => moduleLabels[val] || val,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (val: AuditLogAction) => (
        <Tag color="geekblue">{actionLabels[val] || val}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: AuditLogStatus) => (
        <Badge status={statusColors[val] as any} text={statusLabels[val]} />
      ),
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: AuditLogEntry) => (
        <Button
          type="link"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="近7日操作总数"
              value={statistics.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={statistics.statusStats.success || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={statistics.statusStats.error || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃管理员"
              value={Object.keys(statistics.operatorStats).length}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <RangePicker
              value={dateRange as any}
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: 280 }}
            />
            <Select
              placeholder="选择模块"
              allowClear
              style={{ width: 140 }}
              value={module}
              onChange={setModule}
            >
              {Object.entries(moduleLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="选择操作"
              allowClear
              style={{ width: 140 }}
              value={action}
              onChange={setAction}
            >
              {Object.entries(actionLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              value={status}
              onChange={setStatus}
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <Option key={key} value={key}>
                  {label}
                </Option>
              ))}
            </Select>
            <Input
              placeholder="搜索关键词"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
                setModule(undefined);
                setAction(undefined);
                setStatus(undefined);
                setKeyword('');
                setPage(1);
              }}
            >
              重置
            </Button>
            <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={queryResult.list}
            rowKey="id"
            pagination={{
              current: page,
              pageSize,
              total: queryResult.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        </Space>
      </Card>

      <Modal
        title="操作详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="操作时间" span={2}>
              {dayjs(selectedLog.timestamp).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="操作人">
              {selectedLog.operatorName}
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color="blue">{selectedLog.operatorRole}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="模块">
              {moduleLabels[selectedLog.module] || selectedLog.module}
            </Descriptions.Item>
            <Descriptions.Item label="操作">
              {actionLabels[selectedLog.action] || selectedLog.action}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={statusColors[selectedLog.status] as any}
                text={statusLabels[selectedLog.status]}
              />
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">
              {selectedLog.ipAddress}
            </Descriptions.Item>
            <Descriptions.Item label="请求ID" span={2}>
              <code>{selectedLog.requestId}</code>
            </Descriptions.Item>
            {selectedLog.targetId && (
              <Descriptions.Item label="目标ID" span={2}>
                {selectedLog.targetId}
              </Descriptions.Item>
            )}
            {selectedLog.approvalId && (
              <Descriptions.Item label="审批ID" span={2}>
                {selectedLog.approvalId}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="详情" span={2}>
              {selectedLog.details}
            </Descriptions.Item>
            {selectedLog.beforeData && (
              <Descriptions.Item label="操作前数据" span={2}>
                <pre style={{ fontSize: 12, maxHeight: 100, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.beforeData, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
            {selectedLog.afterData && (
              <Descriptions.Item label="操作后数据" span={2}>
                <pre style={{ fontSize: 12, maxHeight: 100, overflow: 'auto' }}>
                  {JSON.stringify(selectedLog.afterData, null, 2)}
                </pre>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
