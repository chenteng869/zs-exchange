'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Input, Row, Col, Switch } from 'antd';
import {
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  UndoOutlined,
  HistoryOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  LockOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CodeOutlined,
  BellOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface SystemSetting {
  id: string;
  settingGroup: 'risk' | 'execution' | 'api' | 'notification' | 'aiopc';
  settingKey: string;
  settingValue: string | number | boolean;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  isSensitive: boolean;
  lastModifiedBy: string;
  lastModifiedAt: string;
  isDefault: boolean;
  validationRule: string;
}

const mockData: SystemSetting[] = [
  { id: '1', settingGroup: 'risk', settingKey: 'max_position_size', settingValue: '1000000', valueType: 'number', description: '单策略最大持仓金额限制', isSensitive: false, lastModifiedBy: 'admin_01', lastModifiedAt: '2024-05-15 10:30', isDefault: true, validationRule: 'min:10000,max:100000000' },
  { id: '2', settingGroup: 'risk', settingKey: 'max_drawdown_limit', settingValue: '0.25', valueType: 'number', description: '最大回撤阈值，超过则自动减仓', isSensitive: false, lastModifiedBy: 'risk_manager', lastModifiedAt: '2024-06-01 14:20', isDefault: false, validationRule: 'min:0.1,max:0.5' },
  { id: '3', settingGroup: 'risk', settingKey: 'leverage_ratio_cap', settingValue: '3', valueType: 'number', description: '最大杠杆倍数上限', isSensitive: true, lastModifiedBy: 'admin_01', lastModifiedAt: '2024-04-10 09:00', isDefault: true, validationRule: 'min:1,max:10,integer' },
  { id: '4', settingGroup: 'execution', settingKey: 'order_type_default', settingValue: 'limit', valueType: 'string', description: '默认订单类型 (market/limit/stop)', isSensitive: false, lastModifiedBy: 'system', lastModifiedAt: '2024-01-01 00:00', isDefault: true, validationRule: 'enum:market,limit,stop' },
  { id: '5', settingGroup: 'execution', settingKey: 'slippage_tolerance_bps', settingValue: '50', valueType: 'number', description: '滑点容忍度（基点）', isSensitive: false, lastModifiedBy: 'trader_02', lastModifiedAt: '2024-05-28 16:45', isDefault: false, validationRule: 'min:1,max:500' },
  { id: '6', settingGroup: 'execution', settingKey: 'enable_smart_routing', settingValue: true, valueType: 'boolean', description: '启用智能订单路由', isSensitive: false, lastModifiedBy: 'tech_lead', lastModifiedAt: '2024-03-15 11:30', isDefault: true, validationRule: '' },
  { id: '7', settingGroup: 'api', settingKey: 'binance_api_key', settingValue: '**********', valueType: 'string', description: 'Binance API密钥', isSensitive: true, lastModifiedBy: 'dev_admin', lastModifiedAt: '2024-02-20 08:00', isDefault: false, validationRule: 'regex:^.{32,64}$' },
  { id: '8', settingGroup: 'api', settingKey: 'rate_limit_rpm', settingValue: '1200', valueType: 'number', description: 'API请求频率限制（每分钟）', isSensitive: false, lastModifiedBy: 'api_team', lastModifiedAt: '2024-06-10 09:15', isDefault: false, validationRule: 'min:60,max:10000' },
  { id: '9', settingGroup: 'api', settingKey: 'websocket_reconnect_interval', settingValue: '5000', valueType: 'number', description: 'WebSocket重连间隔(毫秒)', isSensitive: false, lastModifiedBy: 'system', lastModifiedAt: '2024-01-01 00:00', isDefault: true, validationRule: 'min:1000,max:30000' },
  { id: '10', settingGroup: 'notification', settingKey: 'alert_email_recipients', settingValue: '["ops@aiopc.com","risk@aiopc.com"]', valueType: 'json', description: '告警邮件接收人列表', isSensitive: false, lastModifiedBy: 'admin_01', lastModifiedAt: '2024-05-22 13:00', isDefault: false, validationRule: 'jsonArray,email' },
  { id: '11', settingGroup: 'notification', settingKey: 'enable_telegram_alerts', settingValue: true, valueType: 'boolean', description: '启用Telegram实时推送', isSensitive: false, lastModifiedBy: 'ops_team', lastModifiedAt: '2024-04-18 17:30', isDefault: true, validationRule: '' },
  { id: '12', settingGroup: 'notification', settingKey: 'alert_cooldown_minutes', settingValue: '15', valueType: 'number', description: '同类告警冷却时间(分钟)', isSensitive: false, lastModifiedBy: 'monitoring', lastModifiedAt: '2024-06-05 10:00', isDefault: false, validationRule: 'min:1,max:1440' },
  { id: '13', settingGroup: 'aiopc', settingKey: 'model_version', settingValue: 'v5.2.0-prod', valueType: 'string', description: 'AIOPC核心模型版本', isSensitive: false, lastModifiedBy: 'ml_engineer', lastModifiedAt: '2024-06-12 08:45', isDefault: false, validationRule: 'semver' },
  { id: '14', settingGroup: 'aiopc', settingKey: 'auto_optimization_enabled', settingValue: true, valueType: 'boolean', description: '启用AIOPC自动参数优化', isSensitive: false, lastModifiedBy: 'ai_team', lastModifiedAt: '2024-05-30 14:00', isDefault: true, validationRule: '' },
  { id: '15', settingGroup: 'aiopc', settingKey: 'confidence_threshold', settingValue: '0.75', valueType: 'number', description: 'AI决策置信度阈值', isSensitive: true, lastModifiedBy: 'chief_scientist', lastModifiedAt: '2024-06-08 16:20', isDefault: false, validationRule: 'min:0.5,max:1.0' },
];

const groupMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  risk: { label: '风控组', color: '#DC2626', icon: <SafetyCertificateOutlined /> },
  execution: { label: '执行组', color: '#1677FF', icon: <ThunderboltOutlined /> },
  api: { label: 'API组', color: '#7C3AED', icon: <ApiOutlined /> },
  notification: { label: '通知组', color: '#F59E0B', icon: <BellOutlined /> },
  aiopc: { label: 'AIOPC组', color: '#F0B90B', icon: <CodeOutlined /> },
};

const typeColorMap: Record<string, string> = {
  string: 'blue',
  number: 'green',
  boolean: 'purple',
  json: 'orange',
};

export default function SettingsPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<SystemSetting | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [sensitiveFilter, setSensitiveFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (groupFilter && item.settingGroup !== groupFilter) return false;
    if (typeFilter && item.valueType !== typeFilter) return false;
    if (sensitiveFilter === 'sensitive' && !item.isSensitive) return false;
    if (sensitiveFilter === 'normal' && item.isSensitive) return false;
    return true;
  });

  const totalSettings = mockData.length;
  const riskCount = mockData.filter(i => i.settingGroup === 'risk').length;
  const execCount = mockData.filter(i => i.settingGroup === 'execution').length;
  const aiopcCount = mockData.filter(i => i.settingGroup === 'aiopc').length;
  const modifiedThisMonth = mockData.filter(i => dayjs(i.lastModifiedAt).isAfter(dayjs().subtract(30, 'day'))).length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: SystemSetting) => {
        setSelectedSetting(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: SystemSetting) => {
        message.info(`编辑参数 "${record.settingKey}"`);
      },
    },
    {
      key: 'reset',
      label: '重置默认',
      icon: <UndoOutlined />,
      hidden: (record: SystemSetting) => record.isDefault,
      onClick: (record: SystemSetting) => {
        message.success(`参数 "${record.settingKey}" 已重置为默认值`);
      },
    },
    {
      key: 'history',
      label: '修改历史',
      icon: <HistoryOutlined />,
      onClick: (record: SystemSetting) => {
        message.info(`查看 "${record.settingKey}" 的修改历史`);
      },
    },
  ];

  const columns = [
    {
      title: '设置组',
      dataIndex: 'settingGroup',
      key: 'settingGroup',
      width: 100,
      render: (group: string) => {
        const config = groupMap[group];
        return (
          <Tag color={config?.color as any} icon={config?.icon}>
            {config?.label}
          </Tag>
        );
      },
    },
    {
      title: '参数Key',
      dataIndex: 'settingKey',
      key: 'settingKey',
      width: 220,
      render: (key: string) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{key}</code>,
    },
    {
      title: '当前值',
      dataIndex: 'settingValue',
      key: 'settingValue',
      width: 180,
      render: (val: string | number | boolean, record: SystemSetting) => {
        if (record.isSensitive && typeof val === 'string') {
          return <span className="text-gray-400">••••••••••</span>;
        }
        if (typeof val === 'boolean') {
          return <Switch size="small" checked={val} disabled />;
        }
        if (typeof val === 'string' && val.startsWith('[')) {
          return <Tooltip title={val}><span className="truncate block max-w-[150px]">[{JSON.parse(val).length} items]</span></Tooltip>;
        }
        return (
          <Tooltip title={String(val)}>
            <span className="truncate block max-w-[160px]">{String(val)}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'valueType',
      key: 'valueType',
      width: 80,
      render: (type: string) => <Tag color={typeColorMap[type] as any}>{type}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      ellipsis: true,
      render: (desc: string) => <span className="text-sm text-gray-600">{desc}</span>,
    },
    {
      title: '敏感?',
      dataIndex: 'isSensitive',
      key: 'isSensitive',
      width: 70,
      render: (sensitive: boolean) => sensitive
        ? <LockOutlined style={{ color: '#DC2626' }} />
        : <CheckCircleOutlined style={{ color: '#16A34A' }} />,
    },
    {
      title: '默认值?',
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 80,
      render: (isDef: boolean) => isDef ? <Tag color="default">是</Tag> : '-',
    },
    {
      title: '校验规则',
      dataIndex: 'validationRule',
      key: 'validationRule',
      width: 150,
      render: (rule: string) => rule ? <code className="text-xs text-blue-600">{rule}</code> : '-',
    },
    {
      title: '修改人',
      dataIndex: 'lastModifiedBy',
      key: 'lastModifiedBy',
      width: 110,
    },
    {
      title: '修改时间',
      dataIndex: 'lastModifiedAt',
      key: 'lastModifiedAt',
      width: 150,
      render: (time: string) => time,
    },
  ];

  const mockHistory = [
    { id: 1, oldValue: '0.3', newValue: '0.25', operator: 'risk_manager', time: '2024-06-01 14:20', reason: '降低风险敞口' },
    { id: 2, oldValue: '0.25', newValue: '0.28', operator: 'admin_01', time: '2024-05-20 10:15', reason: '临时调整' },
    { id: 3, oldValue: '0.28', newValue: '0.25', operator: 'risk_manager', time: '2024-06-01 14:20', reason: '恢复标准值' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <SettingOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">全局策略设置</h1>
            <p className="text-gray-500 text-sm mt-1">
              量化系统参数配置中心 · 风控参数/执行设置/API管理 · AIOPC参数优化
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="设置参数总数"
              value={totalSettings}
              suffix="个"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="风控组"
              value={riskCount}
              suffix="项"
              icon={<SafetyCertificateOutlined />}
              color="#DC2626"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="执行组"
              value={execCount}
              suffix="项"
              icon={<ThunderboltOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="AIOPC组"
              value={aiopcCount}
              suffix="项"
              icon={<CodeOutlined />}
              color="#F0B90B"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="设置组"
              allowClear
              style={{ width: 130 }}
              value={groupFilter || undefined}
              onChange={setGroupFilter}
            >
              {Object.entries(groupMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="数据类型"
              allowClear
              style={{ width: 120 }}
              value={typeFilter || undefined}
              onChange={setTypeFilter}
            >
              <Select.Option value="string">字符串</Select.Option>
              <Select.Option value="number">数字</Select.Option>
              <Select.Option value="boolean">布尔</Select.Option>
              <Select.Option value="json">JSON</Select.Option>
            </Select>
            <Select
              placeholder="敏感度"
              allowClear
              style={{ width: 120 }}
              value={sensitiveFilter || undefined}
              onChange={setSensitiveFilter}
            >
              <Select.Option value="sensitive">敏感参数</Select.Option>
              <Select.Option value="normal">普通参数</Select.Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情 Modal */}
        <Modal
          title={`参数详情 - ${selectedSetting?.settingKey || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={800}
        >
          {selectedSetting && (
            <div className="space-y-6">
              {/* 参数基本信息 */}
              <Descriptions title="参数详情" bordered column={2} size="small">
                <Descriptions.Item label="参数Key" span={2}>
                  <code className="text-base bg-gray-100 px-3 py-1 rounded">{selectedSetting.settingKey}</code>
                </Descriptions.Item>
                <Descriptions.Item label="所属组">
                  <Tag color={groupMap[selectedSetting.settingGroup]?.color as any} icon={groupMap[selectedSetting.settingGroup]?.icon}>
                    {groupMap[selectedSetting.settingGroup]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="数据类型">
                  <Tag color={typeColorMap[selectedSetting.valueType] as any}>{selectedSetting.valueType}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否敏感">
                  {selectedSetting.isSensitive ? (
                    <Tag color="error" icon={<LockOutlined />}>敏感参数</Tag>
                  ) : (
                    <Tag color="success">普通参数</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="是否默认值">
                  {selectedSetting.isDefault ? <Tag>是</Tag> : <span>否 - 已自定义</span>}
                </Descriptions.Item>
                <Descriptions.Item label="校验规则" span={2}>
                  {selectedSetting.validationRule ? (
                    <code className="text-xs bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                      {selectedSetting.validationRule}
                    </code>
                  ) : '无'}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{selectedSetting.description}</Descriptions.Item>
                <Descriptions.Item label="最后修改人">{selectedSetting.lastModifiedBy}</Descriptions.Item>
                <Descriptions.Item label="修改时间">{selectedSetting.lastModifiedAt}</Descriptions.Item>
              </Descriptions>

              {/* 当前值编辑区 */}
              <Card
                title="当前值"
                size="small"
                extra={
                  selectedSetting.valueType === 'boolean' ? (
                    <Switch checked={selectedSetting.settingValue as boolean} />
                  ) : (
                    <Button type="primary" size="small" icon={<EditOutlined />}>修改</Button>
                  )
                }
              >
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-lg break-all">
                  {selectedSetting.isSensitive && typeof selectedSetting.settingValue === 'string'
                    ? '•••••••••• (已隐藏)'
                    : String(selectedSetting.settingValue)}
                </div>
              </Card>

              {/* AIOPC优化建议 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC优化建议
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B', backgroundColor: '#FFFBEB' }}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <WarningOutlined style={{ color: '#F59E0B', marginTop: 4 }} />
                    <div>
                      <div className="font-medium">当前值评估</div>
                      <div className="text-sm text-gray-600 mt-1">
                        参数 &quot;{selectedSetting.settingKey}&quot; 的当前设置处于{' '}
                        <span className="font-semibold text-green-600">合理范围</span>，
                        建议保持现状或根据市场波动微调。
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircleOutlined style={{ color: '#16A34A', marginTop: 4 }} />
                    <div>
                      <div className="font-medium">AI推荐值</div>
                      <div className="text-sm text-gray-600 mt-1">
                        基于近期市场数据分析，AIOPC推荐将此参数调整为：
                        <code className="mx-1 px-2 py-0.5 bg-white rounded border">
                          {typeof selectedSetting.settingValue === 'number'
                            ? (selectedSetting.settingValue * 1.05).toFixed(2)
                            : selectedSetting.settingValue}
                        </code>
                        （预计提升系统效率约 3.2%）
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 修改历史 */}
              <Table
                dataSource={mockHistory}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><HistoryOutlined /> 最近修改记录 (最近10条)</span>}
                columns={[
                  { title: '旧值', dataIndex: 'oldValue', render: (v: string) => <code>{v}</code>, width: 80 },
                  { title: '新值', dataIndex: 'newValue', render: (v: string) => <code className="text-green-600">{v}</code>, width: 80 },
                  { title: '操作人', dataIndex: 'operator', width: 110 },
                  { title: '修改时间', dataIndex: 'time', width: 150 },
                  { title: '修改原因', dataIndex: 'reason' },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
