'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Divider, Progress,
  Badge, Timeline, Modal, Descriptions, Avatar, List, Steps, Alert, Statistic,
} from 'antd';
import {
  ThunderboltOutlined,
  TeamOutlined,
  CarOutlined,
  PhoneOutlined,
  MessageOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
  ToolOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  AlertOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  AimOutlined,
  DashboardOutlined,
  ScheduleOutlined,
  FundOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface EmergencyEvent {
  id: string;
  title: string;
  type: string;
  level: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'contained' | 'resolved' | 'closed';
  commander: string;
  department: string;
  startedAt: string;
  updatedAt: string;
  progress: number;
  description: string;
  affectedSystems: string[];
  impactScope: string;
  participants: number;
  resourcesDispatched: number;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email?: string;
  isOnDuty: boolean;
}

const mockEvents: EmergencyEvent[] = [
  {
    id: 'EMG-20240608-001',
    title: 'DDoS攻击导致交易API不可用',
    type: 'ddos_attack',
    level: 'critical',
    status: 'active',
    commander: '张伟(总指挥)',
    department: '安全运营组',
    startedAt: '2024-06-08 14:20:00',
    updatedAt: '2024-06-08 15:30:00',
    progress: 45,
    description: '遭受大规模DDoS攻击，峰值8Gbps，交易API超时率85%，用户无法正常下单和查询。已启动CDN流量清洗，启用备用线路。',
    affectedSystems: ['api-gateway-01/02', 'load-balancer', 'cdn-edge'],
    impactScope: '全站用户交易功能',
    participants: 12,
    resourcesDispatched: 5,
  },
  {
    id: 'EMG-20240608-002',
    title: 'DeFi闪电贷款攻击预警',
    type: 'blockchain_incident',
    level: 'critical',
    status: 'active',
    commander: '李明(链上安全负责人)',
    department: '区块链安全组',
    startedAt: '2024-06-08 12:45:00',
    updatedAt: '2024-06-08 13:20:00',
    progress: 25,
    description: '检测到可疑大额闪电贷操作模式，与已知攻击手法相似度92%。已暂停相关合约交互，正在追踪攻击者地址。',
    affectedSystems: ['defi-contract-v2', 'liquidity-pool-a', 'price-oracle'],
    impactScope: 'DeFi协议资金安全',
    participants: 8,
    resourcesDispatched: 3,
  },
  {
    id: 'EMG-20240608-003',
    title: '数据库主从同步延迟异常',
    type: 'system_failure',
    level: 'high',
    status: 'contained',
    commander: '王芳(运维负责人)',
    department: '运维保障组',
    startedAt: '2024-06-08 10:15:00',
    updatedAt: '2024-06-08 11:45:00',
    progress: 75,
    description: 'MySQL主库到从库同步延迟超过30秒阈值，影响报表生成和查询性能。已完成主从切换，正在排查根因。',
    affectedSystems: ['mysql-master', 'mysql-slave-01', 'mysql-slave-02'],
    impactScope: '数据查询与分析功能',
    participants: 6,
    resourcesDispatched: 2,
  },
  {
    id: 'EMG-20240608-004',
    title: '第三方支付通道中断',
    type: 'third_party',
    level: 'medium',
    status: 'resolved',
    commander: '赵军(支付负责人)',
    department: '财务技术组',
    startedAt: '2024-06-07 18:30:00',
    updatedAt: '2024-06-07 20:15:00',
    progress: 100,
    description: '支付宝企业版接口调用失败率99%，充值提现功能受影响。已切换至备用支付通道，联系支付宝技术支持定位问题。',
    affectedSystems: ['payment-gateway', 'alipay-sdk'],
    impactScope: '法币充提功能',
    participants: 5,
    resourcesDispatched: 2,
  },
  {
    id: 'EMG-20240608-005',
    title: 'KOL推广链接被恶意刷量',
    type: 'fraud',
    level: 'medium',
    status: 'contained',
    commander: '刘洋(运营负责人)',
    department: '运营风控组',
    startedAt: '2024-06-07 09:00:00',
    updatedAt: '2024-06-07 14:30:00',
    progress: 60,
    description: '检测到某KOL推广链接在短时间内产生大量虚假注册，IP集中度异常高。已封禁可疑账号，启动反作弊机制升级。',
    affectedSystems: ['referral-system', 'user-registration', 'anti-fraud-engine'],
    impactScope: '用户增长数据准确性',
    participants: 4,
    resourcesDispatched: 2,
  },
  {
    id: 'EMG-20240608-006',
    title: 'SSL证书即将过期告警',
    type: 'security_warning',
    level: 'low',
    status: 'active',
    commander: '陈辉(安全工程师)',
    department: '网络安全组',
    startedAt: '2024-06-08 08:00:00',
    updatedAt: '2024-06-08 08:30:00',
    progress: 10,
    description: 'api.zs.exchange域名SSL证书将于3天后过期，需及时更新以避免服务中断。已提交证书更新工单。',
    affectedSystems: ['cdn-edge', 'api-gateway'],
    impactScope: 'HTTPS访问安全性',
    participants: 2,
    resourcesDispatched: 1,
  },
  {
    id: 'EMG-20240608-007',
    title: '跨链桥交易确认延迟',
    type: 'blockchain_issue',
    level: 'high',
    status: 'active',
    commander: '周杰(区块链工程师)',
    department: '区块链研发组',
    startedAt: '2024-06-08 16:00:00',
    updatedAt: '2024-06-08 16:45:00',
    progress: 20,
    description: 'ETH→BSC跨链桥交易确认时间超过正常值5倍（>30分钟），疑似目标链拥堵或验证节点异常。正在协调链上资源。',
    affectedSystems: ['cross-chain-bridge', 'eth-node', 'bsc-node'],
    impactScope: '跨链资产转移功能',
    participants: 5,
    resourcesDispatched: 2,
  },
  {
    id: 'EMG-20240608-008',
    title: '用户KYC审核积压超阈值',
    type: 'operation_alert',
    level: 'low',
    status: 'resolved',
    commander: '孙丽(合规专员)',
    department: '合规审核组',
    startedAt: '2024-06-06 14:00:00',
    updatedAt: '2024-06-06 17:30:00',
    progress: 100,
    description: '待审核KYC申请超过500件，平均等待时间超过24小时。已增派人手并优化审核流程，当前积压已清零。',
    affectedSystems: ['kyc-review-system', 'identity-verification'],
    impactScope: '新用户体验',
    participants: 8,
    resourcesDispatched: 4,
  },
  {
    id: 'EMG-20240608-009',
    title: '智能合约Gas价格飙升',
    type: 'blockchain_issue',
    level: 'medium',
    status: 'closed',
    commander: '吴强(DeFi负责人)',
    department: 'DeFi产品组',
    startedAt: '2024-06-05 20:00:00',
    updatedAt: '2024-06-05 23:00:00',
    progress: 100,
    description: '以太坊网络Gas价格飙升至200+ Gwei，导致DeFi协议交互成本激增。已自动调整Gas策略并通知用户暂缓非紧急操作。',
    affectedSystems: ['defi-contract-v2', 'gas-oracle', 'tx-relayer'],
    impactScope: 'DeFi协议使用成本',
    participants: 3,
    resourcesDispatched: 1,
  },
  {
    id: 'EMG-20240608-010',
    title: '监控告警系统误报频发',
    type: 'system_maintenance',
    level: 'low',
    status: 'resolved',
    commander: '郑凯(SRE工程师)',
    department: '可靠性工程组',
    startedAt: '2024-06-04 10:00:00',
    updatedAt: '2024-06-04 16:00:00',
    progress: 100,
    description: 'Prometheus告警规则配置不当导致CPU使用率误报频率达每小时50+次，严重影响值班人员判断。已修正阈值和静默规则。',
    affectedSystems: ['prometheus', 'alertmanager', 'grafana'],
    impactScope: '运维监控效率',
    participants: 3,
    resourcesDispatched: 1,
  },
];

const mockContacts: Contact[] = [
  { id: 'CT-001', name: '张伟', role: 'CEO/应急总指挥', department: '管理层', phone: '+86-138-0001-0001', email: 'zhangwei@zs.exchange', isOnDuty: true },
  { id: 'CT-002', name: '王芳', role: 'CTO/技术负责人', department: '技术部', phone: '+86-138-0002-0002', email: 'wangfang@zs.exchange', isOnDuty: true },
  { id: 'CT-003', name: '李明', role: '首席安全官', department: '安全部', phone: '+86-138-0003-0003', email: 'liming@zs.exchange', isOnDuty: true },
  { id: 'CT-004', name: '赵军', role: '法务总监', department: '法务合规部', phone: '+86-138-0004-0004', email: 'zhaojun@zs.exchange', isOnDuty: false },
  { id: 'CT-005', name: '陈辉', role: '运维总监', department: '运维部', phone: '+86-138-0005-0005', email: 'chenhui@zs.exchange', isOnDuty: true },
  { id: 'CT-006', name: '刘洋', role: '公关经理', department: '市场部', phone: '+86-138-0006-0006', email: 'liuyang@zs.exchange', isOnDuty: true },
  { id: 'CT-007', name: '云厂商对接人', role: '高级技术支持(Aliyun)', department: '外部', phone: '400-xxx-xxxx', isOnDuty: true },
  { id: 'CT-008', name: '慢雾科技', role: '应急响应顾问', department: '外部', phone: '+86-400-yyy-yyyy', isOnDuty: true },
];

const incidentSteps = [
  { title: '事件发现', icon: <AlertOutlined /> },
  { title: '评估定级', icon: <ExclamationCircleOutlined /> },
  { title: '启动响应', icon: <ThunderboltOutlined /> },
  { title: '遏制控制', icon: <ToolOutlined /> },
  { title: '根除修复', icon: <ToolOutlined /> },
  { title: '恢复验证', icon: <CheckCircleOutlined /> },
  { title: '总结归档', icon: <FileTextOutlined /> },
];

export default function EmergencyCommandPage() {
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  const activeCount = mockEvents.filter(e => e.status === 'active').length;
  const resolvedCount = mockEvents.filter(e => e.status === 'resolved' || e.status === 'closed').length;
  const avgResponseTime = '8.5';
  const totalParticipants = mockEvents.reduce((sum, e) => sum + e.participants, 0);
  const totalResources = mockEvents.reduce((sum, e) => sum + e.resourcesDispatched, 0);
  const resolutionRate = ((resolvedCount / mockEvents.length) * 100).toFixed(1);

  const getLevelTag = (level: string) => {
    const map: Record<string, { color: string; text: string }> = {
      critical: { color: 'red', text: '严重(I级)' },
      high: { color: 'orange', text: '高危(II级)' },
      medium: { color: 'gold', text: '中危(III级)' },
      low: { color: 'blue', text: '低危(IV级)' },
    };
    const config = map[level];
    return config ? <Tag color={config.color}>{config.text}</Tag> : level;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      active: { status: 'processing', text: '进行中' },
      contained: { status: 'warning', text: '已遏制' },
      resolved: { status: 'success', text: '已解决' },
      closed: { status: 'default', text: '已关闭' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      ddos_attack: 'DDoS攻击',
      blockchain_incident: '区块链事件',
      blockchain_issue: '链上问题',
      system_failure: '系统故障',
      third_party: '第三方故障',
      fraud: '欺诈行为',
      security_warning: '安全警告',
      operation_alert: '运营告警',
      system_maintenance: '系统维护',
    };
    return map[type] || type;
  };

  const handleView = (record: EmergencyEvent) => {
    setSelectedEvent(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '事件ID',
      dataIndex: 'id',
      key: 'id',
      width: 170,
      render: (id: string) => <Text code className="text-xs">{id}</Text>,
    },
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      render: (title: string, record: EmergencyEvent) => (
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-400 mt-1">{getTypeLabel(record.type)}</div>
        </div>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 110,
      render: (level: string) => getLevelTag(level),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: '负责人',
      dataIndex: 'commander',
      key: 'commander',
      width: 150,
      render: (cmd: string) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
          <span className="text-sm">{cmd}</span>
        </div>
      ),
    },
    {
      title: '参与人数',
      dataIndex: 'participants',
      key: 'participants',
      width: 90,
      render: (num: number) => <Tag color="blue">{num}人</Tag>,
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number, record: EmergencyEvent) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={progress}
            size="small"
            strokeColor={
              record.level === 'critical'
                ? { '0%': '#DC2626', '100%': '#16A34A' }
                : record.level === 'high'
                  ? { '0%': '#F59E0B', '100%': '#16A34A' }
                  : '#1677FF'
            }
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-10">{progress}%</span>
        </div>
      ),
    },
    {
      title: '开始时间',
      dataIndex: 'startedAt',
      key: 'startedAt',
      width: 160,
      render: (time: string) => <span className="text-sm text-gray-600">{time}</span>,
    },
  ];

  const actions = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView },
    { key: 'edit', label: '编辑', icon: <EditOutlined /> },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ThunderboltOutlined style={{ color: '#F59E0B' }} />
              紧急指挥中心
            </h1>
            <p className="text-gray-500 mt-1">应急事件管理 · 指挥调度 · 资源协调 · 实时响应</p>
          </div>
          <Space>
            <Badge count={activeCount} style={{ backgroundColor: '#DC2626' }}>
              <Button icon={<AlertOutlined />} danger>
                活跃事件 {activeCount}
              </Button>
            </Badge>
            <Button type="primary" icon={<PlusOutlined />}>
              创建应急事件
            </Button>
            <Button icon={<ReloadOutlined />}>刷新数据</Button>
          </Space>
        </div>

        {/* 告警横幅 */}
        {activeCount > 0 && (
          <Alert
            message={`当前有 ${activeCount} 个活跃应急事件需要处理`}
            description="请及时关注严重和高危级别的事件处置进度，确保SLA响应时效要求"
            type="error"
            showIcon
            icon={<WarningOutlined />}
            action={
              <Button size="small" type="primary" danger>
                查看全部
              </Button>
            }
            className="rounded-lg"
          />
        )}

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="活跃事件数"
              value={activeCount}
              suffix="件"
              icon={<AlertOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+2"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均响应时间"
              value={avgResponseTime}
              suffix="分钟"
              icon={<ClockCircleOutlined />}
              color="#1677FF"
              trend="down"
              trendValue="-1.2"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="参与人员总数"
              value={totalParticipants}
              suffix="人"
              icon={<TeamOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+8"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="资源调度次数"
              value={totalResources}
              suffix="次"
              icon={<CarOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+3"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="解决率"
              value={resolutionRate}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+5.2"
            />
          </Col>
        </Row>

        {/* 应急事件列表 */}
        <DataTable
          columns={columns}
          dataSource={mockEvents}
          rowKey="id"
          title="应急事件列表"
          searchPlaceholder="搜索事件ID、标题或负责人..."
          actions={actions}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条事件记录` }}
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '进行中', value: 'active' },
            { label: '已遏制', value: 'contained' },
            { label: '已解决', value: 'resolved' },
            { label: '已关闭', value: 'closed' },
          ]}
        />

        {/* 业务特性说明 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <SafetyCertificateOutlined style={{ color: '#1677FF' }} />
                  应急响应等级体系
                </span>
              }
              className="shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <Badge status="error" />
                  <div className="flex-1">
                    <div className="font-semibold text-red-700">I级 - 严重</div>
                    <div className="text-sm text-red-600">核心业务完全中断，需立即启动最高级别响应，5分钟内完成初步评估</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <Badge status="warning" />
                  <div className="flex-1">
                    <div className="font-semibold text-orange-700">II级 - 高危</div>
                    <div className="text-sm text-orange-600">重要功能受损，需15分钟内启动专项小组进行处置</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Badge status="processing" />
                  <div className="flex-1">
                    <div className="font-semibold text-yellow-700">III级 - 中危</div>
                    <div className="text-sm text-yellow-600">部分功能受限，需1小时内完成响应和处理方案制定</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Badge status="default" />
                  <div className="flex-1">
                    <div className="font-semibold text-blue-700">IV级 - 低危</div>
                    <div className="text-sm text-blue-600">轻微影响或潜在风险，需在工作时间内处理完毕</div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ScheduleOutlined style={{ color: '#7C3AED' }} />
                  快速通讯录
                </span>
              }
              extra={
                <Button
                  size="small"
                  onClick={() => setContactModalVisible(true)}
                >
                  查看全部
                </Button>
              }
              className="shadow-sm"
            >
              <List
                grid={{ gutter: 12, column: 2 }}
                dataSource={mockContacts.filter((c) => c.isOnDuty)}
                renderItem={(contact) => (
                  <List.Item>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                      <Avatar
                        size={40}
                        icon={<UserOutlined />}
                        className={
                          contact.isOnDuty
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{contact.name}</div>
                        <div className="text-xs text-gray-500 truncate">{contact.role}</div>
                      </div>
                      <Space size={4}>
                        <Button
                          type="text"
                          size="small"
                          icon={<PhoneOutlined />}
                          className="text-green-600"
                        />
                        <Button
                          type="text"
                          size="small"
                          icon={<MessageOutlined />}
                          className="text-blue-600"
                        />
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* 处置流程说明 */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <LineChartOutlined style={{ color: '#16A34A' }} />
              标准应急处置流程
            </span>
          }
          className="shadow-sm"
        >
          <Steps
            items={incidentSteps.map((step) => ({
              ...step,
              description:
                step.title === '事件发现'
                  ? '监控系统自动检测或人工上报'
                  : step.title === '评估定级'
                    ? '确定影响范围和威胁等级'
                    : step.title === '启动响应'
                      ? '激活应急预案，通知相关人员'
                      : step.title === '遏制控制'
                        ? '采取临时措施控制事态发展'
                        : step.title === '根除修复'
                          ? '消除根本原因，修复漏洞'
                          : step.title === '恢复验证'
                            ? '恢复业务并验证功能正常'
                            : '总结经验，更新知识库',
            }))}
          />
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`事件详情 - ${selectedEvent?.id}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={750}
          footer={
            <Space>
              <Button icon={<SendOutlined />}>发起资源调度</Button>
              <Button icon={<ReloadOutlined />}>更新进度</Button>
              <Button type="primary" icon={<EyeOutlined />}>
                查看完整时间线
              </Button>
            </Space>
          }
        >
          {selectedEvent && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="事件ID">
                  <Text strong className="text-blue-600">
                    {selectedEvent.id}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="事件类型">
                  <Tag color="blue">{getTypeLabel(selectedEvent.type)}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="威胁等级">
                  {getLevelTag(selectedEvent.level)}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {getStatusBadge(selectedEvent.status)}
                </Descriptions.Item>
                <Descriptions.Item label="指挥官">
                  {selectedEvent.commander}
                </Descriptions.Item>
                <Descriptions.Item label="责任部门">
                  {selectedEvent.department}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间" span={2}>
                  {selectedEvent.startedAt}
                </Descriptions.Item>
                <Descriptions.Item label="影响范围" span={2}>
                  {selectedEvent.impactScope}
                </Descriptions.Item>
                <Descriptions.Item label="受影响系统" span={2}>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedEvent.affectedSystems.map((sys) => (
                      <Tag key={sys} color="red">
                        {sys}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="事件描述" span={2}>
                  <Paragraph className="text-sm mb-0">
                    {selectedEvent.description}
                  </Paragraph>
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title="处置进度">
                <Progress
                  percent={selectedEvent.progress}
                  strokeColor={
                    selectedEvent.level === 'critical'
                      ? { '0%': '#DC2626', '100%': '#16A34A' }
                      : { '0%': '#F59E0B', '100%': '#16A34A' }
                  }
                />
                <Steps
                  size="small"
                  current={Math.floor(
                    selectedEvent.progress / (100 / (incidentSteps.length - 1))
                  )}
                  items={incidentSteps.map((s) => ({ ...s }))}
                  className="mt-4"
                />
              </Card>
            </div>
          )}
        </Modal>

        {/* 通讯录弹窗 */}
        <Modal
          title="应急通讯录"
          open={contactModalVisible}
          onCancel={() => setContactModalVisible(false)}
          width={700}
          footer={
            <Button onClick={() => setContactModalVisible(false)}>关闭</Button>
          }
        >
          <DataTable
            columns={[
              {
                title: '姓名',
                dataIndex: 'name',
                key: 'name',
                render: (name: string) => (
                  <div className="flex items-center gap-2">
                    <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
                    <span className="font-medium">{name}</span>
                  </div>
                ),
              },
              { title: '职位', dataIndex: 'role', key: 'role' },
              { title: '部门', dataIndex: 'department', key: 'department' },
              {
                title: '电话',
                dataIndex: 'phone',
                key: 'phone',
                render: (phone: string) => <Text code>{phone}</Text>,
              },
              { title: '邮箱', dataIndex: 'email', key: 'email', render: (email: string) => email || '-' },
              {
                title: '在岗状态',
                key: 'onDuty',
                width: 90,
                render: (_: any, record: Contact) => (
                  <Badge
                    status={record.isOnDuty ? 'success' : 'default'}
                    text={record.isOnDuty ? '在岗' : '休息'}
                  />
                ),
              },
            ]}
            dataSource={mockContacts}
            rowKey="id"
            pagination={false}
            showSearch={false}
            showAdd={false}
            title=""
          />
        </Modal>
      </div>
    </AdminLayout>
  );
}
