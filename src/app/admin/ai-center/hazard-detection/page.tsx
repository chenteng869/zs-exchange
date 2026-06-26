'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  SafetyCertificateOutlined, BugOutlined, WarningOutlined, CheckCircleOutlined, ScanOutlined,
  ToolOutlined, EyeOutlined, ThunderboltOutlined, FileSearchOutlined, ExclamationCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 隐患清单
const mockHazards = [
  { id: 'HZ-2024062301', type: '智能合约漏洞', level: 'critical', location: 'ETH-USDT Swap合约 #L245', status: 'fixed', discoveredAt: '2024-06-23 09:15', fixSuggestion: '添加重入保护机制，使用OpenZeppelin ReentrancyGuard' },
  { id: 'HZ-2024062302', type: '权限配置异常', level: 'high', location: 'Admin权限模块 /api/admin/users', status: 'pending', discoveredAt: '2024-06-23 08:42', fixSuggestion: '收紧管理员权限范围，实施最小权限原则' },
  { id: 'HZ-2024062303', type: '数据泄露风险', level: 'high', location: '用户KYC数据存储层', status: 'processing', discoveredAt: '2024-06-23 08:10', fixSuggestion: '启用字段级加密，加强访问审计日志' },
  { id: 'HZ-2024062304', type: 'API接口未授权', level: 'medium', location: '/api/v2/trade/order', status: 'fixed', discoveredAt: '2024-06-23 07:35', fixSuggestion: '添加JWT Token验证中间件' },
  { id: 'HZ-2024062305', type: 'SQL注入隐患', level: 'critical', location: '报表查询接口 /api/reports', status: 'pending', discoveredAt: '2024-06-23 07:00', fixSuggestion: '使用参数化查询，禁用字符串拼接' },
  { id: 'HZ-2024062306', type: 'XSS攻击向量', level: 'medium', location: '用户反馈模块 textarea', status: 'fixed', discoveredAt: '2024-06-23 06:25', fixSuggestion: '对用户输入进行HTML实体转义' },
  { id: 'HZ-2024062307', type: '依赖库漏洞', level: 'low', location: 'lodash@4.17.15', status: 'ignored', discoveredAt: '2024-06-23 05:50', fixSuggestion: '升级至lodash@4.17.21或更高版本' },
  { id: 'HZ-2024062308', type: '配置文件暴露', level: 'medium', location: '.env.backup 文件', status: 'fixed', discoveredAt: '2024-06-23 05:10', fixSuggestion: '删除备份文件，添加.gitignore规则' },
  { id: 'HZ-2024062309', type: '日志信息泄露', level: 'low', location: '应用错误日志', status: 'pending', discoveredAt: '2024-06-23 04:30', fixSuggestion: '过滤敏感字段（密码、Token）后再输出' },
  { id: 'HZ-2024062310', type: 'CSRF防护缺失', level: 'high', location: '资金转账接口', status: 'processing', discoveredAt: '2024-06-23 03:45', fixSuggestion: '实现CSRF Token验证机制' },
];

export default function HazardDetectionPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const { data: hazards, isLoading } = useQuery({
    queryKey: ['ai-hazards'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockHazards;
    },
  });

  // 隐患等级颜色映射 - 红/橙/黄/蓝
  const getLevelConfig = (level: string) => {
    const map: Record<string, { color: string; bgColor: string; text: string; icon: React.ReactNode }> = {
      critical: { color: '#DC2626', bgColor: '#FEE2E2', text: '严重', icon: <CloseCircleOutlined /> },
      high: { color: '#F59E0B', bgColor: '#FEF3C7', text: '高危', icon: <WarningOutlined /> },
      medium: { color: '#1677FF', bgColor: '#DBEAFE', text: '中危', icon: <ExclamationCircleOutlined /> },
      low: { color: '#06B6D4', bgColor: '#ECFEFF', text: '低危', icon: <ClockCircleOutlined /> },
    };
    return map[level] || map.low;
  };

  // 状态Badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      fixed: { status: 'success', text: '已修复' },
      processing: { status: 'processing', text: '修复中' },
      pending: { status: 'warning', text: '待处理' },
      ignored: { status: 'default', text: '已忽略' },
    };
    const item = map[status] || { status: 'default', text: status };
    return <Badge status={item.status as any} text={item.text} />;
  };

  // 类型Tag颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '智能合约漏洞': 'red',
      '权限配置异常': 'orange',
      '数据泄露风险': 'volcano',
      'API接口未授权': 'magenta',
      'SQL注入隐患': 'red',
      'XSS攻击向量': 'purple',
      '依赖库漏洞': 'geekblue',
      '配置文件暴露': 'gold',
      '日志信息泄露': 'cyan',
      'CSRF防护缺失': 'orange',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '隐患ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => <Text code className="text-xs">{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: string) => {
        const config = getLevelConfig(level);
        return (
          <Tag
            color={config.color}
            style={{ color: '#fff', fontWeight: 600 }}
            icon={config.icon}
          >
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
      ellipsis: true,
      render: (loc: string) => (
        <Tooltip title={loc}>
          <Text className="cursor-pointer" style={{ maxWidth: 200 }}>{loc}</Text>
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
      title: '发现时间',
      dataIndex: 'discoveredAt',
      key: 'discoveredAt',
      width: 150,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedRecord(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'fix',
      label: '标记修复',
      icon: <ToolOutlined />,
      type: 'primary',
      hidden: (record: any) => record.status === 'fixed',
      onClick: (record: any) => {
        message.success(`隐患 ${record.id} 已标记为修复中`);
      },
    },
  ];

  // 统计数据
  const criticalCount = hazards?.filter((h: any) => h.level === 'critical').length || 0;
  const highCount = hazards?.filter((h: any) => h.level === 'high').length || 0;
  const fixedCount = hazards?.filter((h: any) => h.status === 'fixed').length || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SafetyCertificateOutlined className="text-3xl text-orange-500" />
            <div>
              <Title level={3} className="!mb-0">AI 隐患识别中心</Title>
              <Text type="secondary">智能安全扫描 · 自动分类 · 修复建议</Text>
            </div>
          </div>
          <Space>
            <Button icon={<ThunderboltOutlined />}>立即扫描</Button>
            <Button type="primary" icon={<ScanOutlined />}>全量扫描</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="扫描任务"
              value={386}
              icon={<ScanOutlined />}
              color="#1677FF"
              suffix="次"
              trend="up"
              trendValue="+8.3%"
              description="累计执行扫描任务"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="发现隐患"
              value={hazards?.length || 0}
              icon={<BugOutlined />}
              color="#DC2626"
              suffix="个"
              description="当前系统检测到的隐患"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="高危数量"
              value={criticalCount + highCount}
              icon={<WarningOutlined />}
              color="#F59E0B"
              suffix="个"
              trend="down"
              trendValue="-12.1%"
              description={`严重${criticalCount} 高危${highCount}`}
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="已修复"
              value={fixedCount}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="个"
              trend="up"
              trendValue="+15.6%"
              description="修复率 {(fixedCount / (hazards?.length || 1) * 100).toFixed(1)}%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="覆盖率"
              value={94.8}
              icon={<FileSearchOutlined />}
              color="#7C3AED"
              suffix="%"
              description="代码扫描覆盖面"
            />
          </Col>
        </Row>

        {/* DataTable - 隐患清单 */}
        <Card title="隐患清单" className="shadow-sm" extra={
          <Space>
            <Badge count={criticalCount} style={{ backgroundColor: '#DC2626' }}>
              <Tag color="red">严重</Tag>
            </Badge>
            <Badge count={highCount} style={{ backgroundColor: '#F59E0B' }}>
              <Tag color="orange">高危</Tag>
            </Badge>
            <Tag color="blue">共 {hazards?.length || 0} 条</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={hazards || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索隐患ID或位置"
            showFilter
            filterOptions={[
              { label: '全部等级', value: '' },
              { label: '严重', value: 'critical' },
              { label: '高危', value: 'high' },
              { label: '中危', value: 'medium' },
              { label: '低危', value: 'low' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条隐患记录`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><WarningOutlined /><span>隐患等级分布</span></Space>} className="shadow-sm">
              <div className="space-y-4">
                {[
                  { level: 'critical', label: '严重 (Critical)', count: criticalCount, percent: (criticalCount / (hazards?.length || 1)) * 100, color: '#DC2626' },
                  { level: 'high', label: '高危 (High)', count: highCount, percent: (highCount / (hazards?.length || 1)) * 100, color: '#F59E0B' },
                  { level: 'medium', label: '中危 (Medium)', count: hazards?.filter((h: any) => h.level === 'medium').length || 0, percent: ((hazards?.filter((h: any) => h.level === 'medium').length || 0) / (hazards?.length || 1)) * 100, color: '#1677FF' },
                  { level: 'low', label: '低危 (Low)', count: hazards?.filter((h: any) => h.level === 'low').length || 0, percent: ((hazards?.filter((h: any) => h.level === 'low').length || 0) / (hazards?.length || 1)) * 100, color: '#06B6D4' },
                ].map(item => (
                  <div key={item.level}>
                    <div className="flex justify-between mb-1">
                      <Space>
                        {getLevelConfig(item.level).icon}
                        <Text>{item.label}</Text>
                      </Space>
                      <Text strong>{item.count} 个 ({item.percent.toFixed(1)}%)</Text>
                    </div>
                    <Progress
                      percent={item.percent}
                      strokeColor={item.color}
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))}
                <Divider />
                <Alert
                  type="info"
                  showIcon
                  message="扫描引擎状态"
                  description={
                    <Space>
                      <Badge status="success" text="AI引擎运行正常" />
                      <Badge status="processing" text="规则库版本 v2.8.3" />
                      <Badge status="warning" text="下次全量扫描: 02:00" />
                    </Space>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><ToolOutlined /><span>修复建议与能力</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="error"
                  showIcon
                  banner
                  message="严重隐患需立即处理"
                  description="当前有 {criticalCount} 个严重级别隐患，建议优先安排安全团队处理，避免潜在损失"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心检测能力：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><BugOutlined className="mr-2 text-red-500" /> 智能合约静态分析：支持Solidity/Vyper多语言</li>
                    <li><SafetyCertificateOutlined className="mr-2 text-orange-500" /> 权限与访问控制检测：RBAC/ABAC模型审计</li>
                    <li><FileSearchOutlined className="mr-2 text-blue-500" /> 数据安全扫描：PII识别与加密验证</li>
                    <li><WarningOutlined className="mr-2 text-purple-500" /> OWASP Top 10全覆盖：注入/XSS/CSRF等</li>
                    <li><ThunderboltOutlined className="mr-2 text-green-500" /> 依赖漏洞检测：集成NVD与GitHub Advisory</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <CheckCircleOutlined className="mr-1 text-blue-500" />
                    平均扫描耗时 &lt; 3分钟 | 误报率 &lt; 5% | 支持 CI/CD 集成
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`隐患详情 - ${selectedRecord?.id || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="fix" type="primary" icon={<ToolOutlined />} onClick={() => {
              message.success('已提交修复任务');
              setDetailModalOpen(false);
            }}>开始修复</Button>,
          ]}
          width={700}
        >
          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic title="隐患类型" value={selectedRecord.type} valueStyle={{ fontSize: 14 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="危险等级" value="" valueStyle={{ fontSize: 14 }} prefix={
                    <Tag color={getLevelConfig(selectedRecord.level).color} style={{ color: '#fff' }}>
                      {getLevelConfig(selectedRecord.level).text}
                    </Tag>
                  } />
                </Col>
                <Col span={8}>
                  <Statistic title="当前状态" value="" valueStyle={{ fontSize: 14 }} prefix={getStatusBadge(selectedRecord.status)} />
                </Col>
              </Row>
              <Divider />
              <div>
                <Text strong>隐患位置：</Text>
                <div className="mt-1 p-3 bg-red-50 rounded font-mono text-sm">{selectedRecord.location}</div>
              </div>
              <div className="mt-3">
                <Text strong>修复建议：</Text>
                <Alert type="warning" showIcon className="mt-2" message={selectedRecord.fixSuggestion} />
              </div>
              <Text type="secondary">发现时间：{selectedRecord.discoveredAt}</Text>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
