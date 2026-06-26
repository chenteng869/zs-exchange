'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Statistic, Alert, Tooltip, Progress, Modal, message, Switch,
} from 'antd';
import {
  SettingOutlined, CheckCircleOutlined, ClockCircleOutlined, ThunderboltOutlined, ApiOutlined,
  EyeOutlined, EditOutlined, FormOutlined, FilterOutlined, SafetyCertificateOutlined, BellOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 配置参数列表
const mockConfigs = [
  { id: 'CFG-001', name: 'risk_threshold_high', currentValue: '0.75', type: 'float', description: '高风险判定阈值（概率≥此值触发红色预警）', status: 'enabled', lastModified: '2024-06-23 08:00', modifier: 'Admin' },
  { id: 'CFG-002', name: 'risk_threshold_medium', currentValue: '0.50', type: 'float', description: '中风险判定阈值（概率≥此值触发橙色预警）', status: 'enabled', lastModified: '2024-06-22 15:30', modifier: 'RiskTeam' },
  { id: 'CFG-003', name: 'model_prediction_window', currentValue: '24', type: 'int', description: '预测窗口期长度（单位：小时）', status: 'enabled', lastModified: '2024-06-21 10:00', modifier: 'MLTeam' },
  { id: 'CFG-004', name: 'confidence_min_threshold', currentValue: '0.80', type: 'float', description: '最低置信度要求，低于此值的预测不输出', status: 'enabled', lastModified: '2024-06-20 14:20', modifier: 'Admin' },
  { id: 'CFG-005', name: 'enable_auto_retrain', currentValue: 'true', type: 'bool', description: '是否启用模型自动重训练功能', status: 'enabled', lastModified: '2024-06-19 09:15', modifier: 'DevOps' },
  { id: 'CFG-006', name: 'notification_channels', currentValue: '["email","webhook"]', type: 'json', description: '告警通知通道配置（支持email/webhook/sms）', status: 'enabled', lastModified: '2024-06-18 16:45', modifier: 'OpsTeam' },
  { id: 'CFG-007', name: 'feature_market_volatility', currentValue: 'true', type: 'bool', description: '市场波动特征开关（开启后纳入波动率因子）', status: 'enabled', lastModified: '2024-06-17 11:30', modifier: 'DataTeam' },
  { id: 'CFG-008', name: 'feature_social_sentiment', currentValue: 'false', type: 'bool', description: '社交媒体情绪特征开关（实验性功能）', status: 'disabled', lastModified: '2024-06-15 08:00', modifier: 'Research' },
  { id: 'CFG-009', name: 'max_concurrent_predictions', currentValue: '100', type: 'int', description: '最大并发预测任务数限制', status: 'pending_review', lastModified: '2024-06-23 07:20', modifier: 'Admin' },
  { id: 'CFG-010', name: 'log_retention_days', currentValue: '30', type: 'int', description: '预测日志保留天数', status: 'enabled', lastModified: '2024-06-14 13:55', modifier: 'SysAdmin' },
];

export default function AIConfigPage() {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const { data: configs, isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockConfigs;
    },
  });

  // 配置类型Tag颜色
  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      float: { color: 'blue', text: '浮点数' },
      int: { color: 'green', text: '整数' },
      bool: { color: 'orange', text: '布尔值' },
      string: { color: 'purple', text: '字符串' },
      json: { color: 'geekblue', text: 'JSON' },
      array: { color: 'cyan', text: '数组' },
    };
    return map[type] || { color: 'default', text: type };
  };

  // 状态Badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      enabled: { status: 'success', text: '已启用' },
      disabled: { status: 'default', text: '已禁用' },
      pending_review: { status: 'processing', text: '待审核' },
    };
    const item = map[status] || { status: 'default', text: status };
    return <Badge status={item.status as any} text={item.text} />;
  };

  const columns = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      render: (name: string) => <Text code className="font-mono text-sm">{name}</Text>,
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      width: 180,
      render: (val: string) => (
        <Tag color="blue" className="font-mono">{val.length > 20 ? `${val.substring(0, 20)}...` : val}</Tag>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const tag = getTypeTag(type);
        return <Tag color={tag.color}>{tag.text}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <Text type="secondary" className="cursor-pointer" style={{ maxWidth: 250 }}>{desc}</Text>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: '最后修改',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 140,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedConfig(record);
        setEditModalOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'primary',
      hidden: (record: any) => record.status === 'pending_review',
      onClick: (record: any) => {
        setSelectedConfig(record);
        setEditModalOpen(true);
        message.info(`编辑配置: ${record.name}`);
      },
    },
  ];

  // 统计数据
  const enabledCount = configs?.filter((c: any) => c.status === 'enabled').length || 0;
  const pendingCount = configs?.filter((c: any) => c.status === 'pending_review').length || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingOutlined className="text-3xl text-amber-500" />
            <div>
              <Title level={3} className="!mb-0">AI 配置中心</Title>
              <Text type="secondary">参数配置 · 阈值管理 · 特征开关</Text>
            </div>
          </div>
          <Space>
            <Button icon={<BellOutlined />}>配置变更日志</Button>
            <Button type="primary" icon={<FormOutlined />}>新增配置项</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="配置项数"
              value={configs?.length || 0}
              icon={<ApiOutlined />}
              color="#1677FF"
              suffix="项"
              description="全部配置参数"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="已启用"
              value={enabledCount}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="项"
              description="生效中的配置"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="最近修改"
              value="2小时前"
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              description="最新变更时间"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="生效中"
              value={enabledCount - pendingCount}
              icon={<ThunderboltOutlined />}
              color="#7C3AED"
              suffix="项"
              description="无需审核的配置"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="待审核"
              value={pendingCount}
              icon={<FilterOutlined />}
              color="#06B6D4"
              suffix="项"
              description="等待审批的变更"
            />
          </Col>
        </Row>

        {/* DataTable - 配置参数列表 */}
        <Card title="配置参数列表" className="shadow-sm" extra={
          <Space>
            {pendingCount > 0 && <Badge count={pendingCount} style={{ backgroundColor: '#1677FF' }}><Tag color="blue">待审核</Tag></Badge>}
            <Tag color="default">共 {configs?.length || 0} 项</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={configs || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索参数名或描述"
            showFilter
            filterOptions={[
              { label: '全部状态', value: '' },
              { label: '已启用', value: 'enabled' },
              { label: '已禁用', value: 'disabled' },
              { label: '待审核', value: 'pending_review' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条配置`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><FormOutlined /><span>配置类型分布</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                {['float', 'int', 'bool', 'json'].map(type => {
                  const count = configs?.filter((c: any) => c.type === type).length || 0;
                  const percent = (count / (configs?.length || 1)) * 100;
                  const tag = getTypeTag(type);
                  return (
                    <div key={type}>
                      <div className="flex justify-between mb-1">
                        <Tag color={tag.color}>{tag.text}</Tag>
                        <Text strong>{count} 项 ({percent.toFixed(0)}%)</Text>
                      </div>
                      <Progress percent={percent} strokeColor={tag.color} size="small" showInfo={false} />
                    </div>
                  );
                })}
                <Divider />
                <Alert
                  type="success"
                  showIcon
                  message="配置一致性检查通过"
                  description="所有配置项格式合法，无冲突依赖"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><SafetyCertificateOutlined /><span>配置安全规范</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="warning"
                  showIcon
                  banner
                  message="配置变更需遵循审批流程"
                  description="敏感参数修改需要二级审批，变更自动记录审计日志"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>配置管理规范：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><SettingOutlined className="mr-2 text-blue-500" /> 分级管理：普通/敏感/核心三级权限控制</li>
                    <li><ClockCircleOutlined className="mr-2 text-green-500" /> 变更追踪：完整的操作审计链路与快照</li>
                    <li><ThunderboltOutlined className="mr-2 text-orange-500" /> 热更新：非破坏性变更即时生效，无需重启</li>
                    <li><FilterOutlined className="mr-2 text-purple-500" /> 版本对比：支持配置版本Diff与一键回滚</li>
                    <li><BellOutlined className="mr-2 text-red-500" /> 告警联动：关键参数变更自动通知相关人员</li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <SafetyCertificateOutlined className="mr-1 text-amber-500" />
                    当前有 {pendingCount} 项配置待审核 | 最近24h变更 5 次
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 编辑弹窗 */}
        <Modal
          title={`编辑配置 - ${selectedConfig?.name || ''}`}
          open={editModalOpen}
          onCancel={() => setEditModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setEditModalOpen(false)}>取消</Button>,
            <Button key="save" type="primary" onClick={() => {
              message.success('配置已保存');
              setEditModalOpen(false);
            }}>保存更改</Button>,
          ]}
          width={650}
        >
          {selectedConfig && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="参数名" value={selectedConfig.name} valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="类型" value="" prefix={<Tag color={getTypeTag(selectedConfig.type).color}>{getTypeTag(selectedConfig.type).text}</Tag>} />
                </Col>
              </Row>
              <Divider />
              <div>
                <Text strong>当前值：</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded font-mono">{selectedConfig.currentValue}</div>
              </div>
              <div className="mt-3">
                <Text strong>新值：</Text>
                <input
                  className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md font-mono focus:border-blue-500 focus:outline-none"
                  defaultValue={selectedConfig.currentValue}
                  placeholder="输入新的配置值"
                />
              </div>
              <div className="mt-3">
                <Text strong>描述：</Text>
                <Text type="secondary" className="ml-2">{selectedConfig.description}</Text>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Text strong>立即生效：</Text>
                <Switch defaultChecked />
                <Text type="secondary" className="text-sm">关闭后将进入审核队列</Text>
              </div>
              <Text type="secondary" className="text-xs">最后修改：{selectedConfig.lastModified} by {selectedConfig.modifier}</Text>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
