'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert, Avatar, Rate, Tooltip,
} from 'antd';
import {
  FundOutlined,
  TrophyOutlined,
  FileTextOutlined,
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  StarOutlined,
  FireOutlined,
  ThunderboltOutlined,
  AimOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DashboardOutlined,
  BarChartOutlined,
  LineChartOutlined,
  UserOutlined,
  CrownOutlined,
  TrophyOutlined as MedalIcon,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface PerformanceRecord {
  id: string;
  department: string;
  manager: string;
  kpiScore: number;
  targetRate: number;
  rank: number;
  rankChange: number;
  status: 'excellent' | 'good' | 'normal' | 'warning';
  completedTasks: number;
  totalTasks: number;
  innovationScore: number;
  teamworkScore: number;
  efficiencyScore: number;
  month: string;
  highlights: string[];
  improvements: string[];
}

const mockPerformance: PerformanceRecord[] = [
  {
    id: 'PB-001',
    department: '技术研发中心',
    manager: '王芳(CTO)',
    kpiScore: 96.5,
    targetRate: 108.3,
    rank: 1,
    rankChange: 0,
    status: 'excellent',
    completedTasks: 48,
    totalTasks: 45,
    innovationScore: 98,
    teamworkScore: 95,
    efficiencyScore: 94,
    month: '2024年6月',
    highlights: ['核心交易系统延迟降低40%', '完成DeFi协议V2.0上线', '通过ISO27001复评'],
    improvements: ['技术文档覆盖率需提升', '代码评审时效待优化'],
  },
  {
    id: 'PB-002',
    department: '产品运营部',
    manager: '刘洋(COO)',
    kpiScore: 93.2,
    targetRate: 102.1,
    rank: 2,
    rankChange: 1,
    status: 'excellent',
    completedTasks: 42,
    totalTasks: 40,
    innovationScore: 92,
    teamworkScore: 96,
    efficiencyScore: 91,
    month: '2024年6月',
    highlights: ['DAU增长28%', 'KOL推广ROI提升35%', '用户满意度达92%'],
    improvements: ['新功能 adoption rate 偏低', '跨部门协作流程需优化'],
  },
  {
    id: 'PB-003',
    department: '安全合规部',
    manager: '李明(CSO)',
    kpiScore: 91.8,
    targetRate: 100.0,
    rank: 3,
    rankChange: -1,
    status: 'good',
    completedTasks: 36,
    totalTasks: 35,
    innovationScore: 88,
    teamworkScore: 93,
   efficiencyScore: 90,
   month: '2024年6月',
    highlights: ['零重大安全事故', '完成SOC2 Type II审计', '自动化渗透测试覆盖率达85%'],
    improvements: ['响应时间偶尔超标', '威胁情报更新频率不足'],
  },
  {
    id: 'PB-004',
    department: '区块链研发组',
    manager: '周杰(技术总监)',
    kpiScore: 89.6,
    targetRate: 96.5,
    rank: 4,
    rankChange: 0,
    status: 'good',
    completedTasks: 32,
    totalTasks: 30,
    innovationScore: 95,
    teamworkScore: 88,
    efficiencyScore: 86,
    month: '2024年6月',
    highlights: ['跨链桥TPS提升200%', '智能合约审计零漏洞', '节点同步优化完成'],
    improvements: ['文档输出滞后于开发进度', '新人培训体系待完善'],
  },
  {
    id: 'PB-005',
    department: '财务结算部',
    manager: '赵军(CFO)',
    kpiScore: 87.3,
    targetRate: 95.2,
    rank: 5,
    rankChange: 2,
    status: 'good',
    completedTasks: 38,
    totalTasks: 38,
    innovationScore: 82,
    teamworkScore: 91,
    efficiencyScore: 89,
    month: '2024年6月',
    highlights: ['对账准确率99.99%', '结算T+0达成率98%', '成本控制超额完成12%'],
    improvements: ['报表自动化程度不够', '多币种对账复杂度高'],
  },
  {
    id: 'PB-006',
    department: '市场品牌部',
    manager: '孙悦(CMO)',
    kpiScore: 84.7,
    targetRate: 89.3,
    rank: 6,
    rankChange: -1,
    status: 'normal',
    completedTasks: 28,
    totalTasks: 30,
    innovationScore: 90,
    teamworkScore: 85,
    efficiencyScore: 80,
    month: '2024年6月',
    highlights: ['社交媒体粉丝增长50%', 'PR稿件发布量创新高', '品牌曝光量增长120%'],
    improvements: ['转化漏斗数据不完整', '内容生产效率偏低'],
  },
  {
    id: 'PB-007',
    department: '客户服务部',
    manager: '陈辉(客服总监)',
    kpiScore: 82.1,
    targetRate: 86.5,
    rank: 7,
    rankChange: -2,
    status: 'normal',
    completedTasks: 52,
    totalTasks: 50,
    innovationScore: 78,
    teamworkScore: 92,
    efficiencyScore: 78,
    month: '2024年6月',
    highlights: ['工单解决率97%', 'CSAT评分4.5/5', '平均响应时间缩短至8分钟'],
    improvements: ['FAQ自助服务使用率低', '多语言支持覆盖不全'],
  },
  {
    id: 'PB-008',
    department: '人力资源部',
    manager: '吴婷(HRD)',
    kpiScore: 79.5,
    targetRate: 82.0,
    rank: 8,
    rankChange: 1,
    status: 'warning',
    completedTasks: 22,
    totalTasks: 25,
    innovationScore: 75,
    teamworkScore: 88,
    efficiencyScore: 76,
    month: '2024年6月',
    highlights: ['关键岗位招聘完成率100%', '员工满意度调查启动', '培训计划执行率90%'],
    improvements: ['高端人才引进困难', '绩效考核系统升级延期'],
  },
  {
    id: 'PB-009',
    department: '法务合规部',
    manager: '郑浩(法务总监)',
    kpiScore: 77.8,
    targetRate: 80.5,
    rank: 9,
    rankChange: 0,
    status: 'warning',
    completedTasks: 18,
    totalTasks: 20,
    innovationScore: 72,
    teamworkScore: 86,
    efficiencyScore: 75,
    month: '2024年6月',
    highlights: ['完成3个牌照续期申请', '合同审核零风险事件', '合规培训全员覆盖'],
    improvements: ['外部法律顾问费用超预算', '跨境法规研究深度不足'],
  },
  {
    id: 'PB-010',
    department: '基础设施运维部',
    manager: '凯文(SRE负责人)',
    kpiScore: 75.2,
    targetRate: 78.0,
    rank: 10,
    rankChange: 0,
    status: 'warning',
    completedTasks: 30,
    totalTasks: 32,
    innovationScore: 80,
    teamworkScore: 84,
    efficiencyScore: 72,
    month: '2024年6月',
    highlights: ['SLA达标率99.9%', '容器化迁移完成60%', '监控告警准确率提升至95%'],
    improvements: ['故障恢复时间MTTR偏长', '容量规划预测精度不足'],
  },
];

export default function PerformanceBoardPage() {
  const [selectedRecord, setSelectedRecord] = useState<PerformanceRecord | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const avgScore = (mockPerformance.reduce((sum, r) => sum + r.kpiScore, 0) / mockPerformance.length).toFixed(1);
  const excellentCount = mockPerformance.filter(r => r.status === 'excellent').length;
  const warningCount = mockPerformance.filter(r => r.status === 'warning').length;
  const avgTargetRate = (mockPerformance.reduce((sum, r) => sum + r.targetRate, 0) / mockPerformance.length).toFixed(1);
  const momChange = '+3.2';

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      excellent: { color: 'gold', text: '优秀', icon: <CrownOutlined /> },
      good: { color: 'green', text: '良好', icon: <MedalIcon /> },
      normal: { color: 'blue', text: '正常', icon: <CheckCircleOutlined /> },
      warning: { color: 'orange', text: '待改进', icon: <WarningOutlined /> },
    };
    const config = map[status];
    return config ? <Tag color={config.color} icon={config.icon}>{config.text}</Tag> : status;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge count={<CrownOutlined style={{ color: '#FFD700' }} />} style={{ backgroundColor: '#FFD700' }} />;
    if (rank === 2) return <Badge count="2" style={{ backgroundColor: '#C0C0C0' }} />;
    if (rank === 3) return <Badge count="3" style={{ backgroundColor: '#CD7F32' }} />;
    return <span className="font-semibold text-gray-600">#{rank}</span>;
  };

  const getRankChange = (change: number) => {
    if (change > 0) return <Text type="success" className="text-xs"><RiseOutlined /> +{change}</Text>;
    if (change < 0) return <Text type="danger" className="text-xs"><FallOutlined /> {change}</Text>;
    return <Text type="secondary" className="text-xs">-</Text>;
  };

  const handleView = (record: PerformanceRecord) => {
    setSelectedRecord(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: any, record: PerformanceRecord) => (
        <div className="flex flex-col items-center gap-1">
          {getRankBadge(record.rank)}
          {getRankChange(record.rankChange)}
        </div>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 160,
      render: (dept: string) => <span className="font-medium">{dept}</span>,
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
      width: 140,
      render: (mgr: string) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-blue-500" />
          <span className="text-sm">{mgr}</span>
        </div>
      ),
    },
    {
      title: 'KPI得分',
      dataIndex: 'kpiScore',
      key: 'kpiScore',
      width: 110,
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <Progress
            type="circle"
            percent={score}
            size={44}
            format={() => score.toFixed(1)}
            strokeColor={
              score >= 90 ? '#16A34A' :
                score >= 80 ? '#1677FF' :
                  score >= 70 ? '#F59E0B' : '#DC2626'
            }
          />
        </div>
      ),
    },
    {
      title: '目标达成率',
      dataIndex: 'targetRate',
      key: 'targetRate',
      width: 140,
      render: (rate: number) => (
        <div className="flex items-center gap-2 w-full">
          <Progress
            percent={Math.min(rate, 120)}
            size="small"
            strokeColor={
              rate >= 100 ? '#16A34A' :
                rate >= 90 ? '#1677FF' :
                  rate >= 80 ? '#F59E0B' : '#DC2626'
            }
            className="flex-1"
          />
          <span className={`text-xs font-bold ${rate >= 100 ? 'text-green-600' : 'text-gray-600'} w-12 text-right`}>
            {rate.toFixed(1)}%
          </span>
        </div>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      render: (_: any, record: PerformanceRecord) => getStatusTag(record.status),
    },
    {
      title: '任务完成',
      key: 'tasks',
      width: 100,
      render: (_: any, record: PerformanceRecord) => (
        <Tooltip title={`${record.completedTasks}/${record.totalTasks}`}>
          <Tag color={record.completedTasks >= record.totalTasks ? 'green' : 'blue'}>
            {record.completedTasks}/{record.totalTasks}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '综合评价',
      key: 'scores',
      width: 180,
      render: (_: any, record: PerformanceRecord) => (
        <Space direction="vertical" size={2}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">创新</span>
            <Rate disabled defaultValue={Math.round(record.innovationScore / 20)} count={5} className="text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">协作</span>
            <Rate disabled defaultValue={Math.round(record.teamworkScore / 20)} count={5} className="text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-14">效率</span>
            <Rate disabled defaultValue={Math.round(record.efficiencyScore / 20)} count={5} className="text-xs" />
          </div>
        </Space>
      ),
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
              <FundOutlined style={{ color: '#7C3AED' }} />
              绩效看板
            </h1>
            <p className="text-gray-500 mt-1">KPI监控 · 部门绩效 · 目标达成率 · 智能排名</p>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>新建考核</Button>
            <Button icon={<BarChartOutlined />}>导出报告</Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均绩效分"
              value={avgScore}
              suffix="分"
              icon={<DashboardOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+2.3"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="优秀部门"
              value={excellentCount}
              suffix="个"
              icon={<TrophyOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+1"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="待改进项"
              value={warningCount}
              suffix="个"
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-1"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="本月平均排名变化"
              value={momChange}
              suffix=""
              icon={<LineChartOutlined />}
              color="#16A34A"
              trend="up"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="平均目标达成率"
              value={avgTargetRate}
              suffix="%"
              icon={<AimOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+4.5"
            />
          </Col>
        </Row>

        {/* 绩效列表 */}
        <DataTable
          columns={columns}
          dataSource={mockPerformance}
          rowKey="id"
          title="部门绩效排行榜"
          searchPlaceholder="搜索部门名称或负责人..."
          actions={actions}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 个部门` }}
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '优秀', value: 'excellent' },
            { label: '良好', value: 'good' },
            { label: '正常', value: 'normal' },
            { label: '待改进', value: 'warning' },
          ]}
        />

        {/* 业务特性说明 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <FireOutlined style={{ color: '#F59E0B' }} />
                  本月TOP3亮点
                </span>
              }
              className="shadow-sm"
            >
              <List
                size="small"
                dataSource={mockPerformance.slice(0, 3).map((r, idx) => ({
                  ...r,
                  displayIdx: idx + 1,
                }))}
                renderItem={(item) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold flex items-center gap-2">
                          <Badge
                            count={item.displayIdx}
                            style={{
                              backgroundColor:
                                item.displayIdx === 1 ? '#FFD700' :
                                  item.displayIdx === 2 ? '#C0C0C0' : '#CD7F32',
                              fontSize: 12,
                            }}
                          />
                          {item.department}
                        </span>
                        <Tag color={item.kpiScore >= 90 ? 'gold' : 'green'}>
                          {item.kpiScore}分
                        </Tag>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {item.highlights.map((h) => (
                          <Tag key={h} color="cyan" className="text-xs">{h}</Tag>
                        ))}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ThunderboltOutlined style={{ color: '#1677FF' }} />
                  绩效分布概览
                </span>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>优秀 (≥90分)</span>
                    <span className="font-semibold text-yellow-600">
                      {mockPerformance.filter(r => r.kpiScore >= 90).length} 个部门
                    </span>
                  </div>
                  <Progress
                    percent={(mockPerformance.filter(r => r.kpiScore >= 90).length / mockPerformance.length) * 100}
                    strokeColor="#F59E0B"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>良好 (80-89分)</span>
                    <span className="font-semibold text-green-600">
                      {mockPerformance.filter(r => r.kpiScore >= 80 && r.kpiScore < 90).length} 个部门
                    </span>
                  </div>
                  <Progress
                    percent={(mockPerformance.filter(r => r.kpiScore >= 80 && r.kpiScore < 90).length / mockPerformance.length) * 100}
                    strokeColor="#16A34A"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>正常 (70-79分)</span>
                    <span className="font-semibold text-blue-600">
                      {mockPerformance.filter(r => r.kpiScore >= 70 && r.kpiScore < 80).length} 个部门
                    </span>
                  </div>
                  <Progress
                    percent={(mockPerformance.filter(r => r.kpiScore >= 70 && r.kpiScore < 80).length / mockPerformance.length) * 100}
                    strokeColor="#1677FF"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>待改进 (&lt;70分)</span>
                    <span className="font-semibold text-red-600">
                      {mockPerformance.filter(r => r.kpiScore < 70).length} 个部门
                    </span>
                  </div>
                  <Progress
                    percent={(mockPerformance.filter(r => r.kpiScore < 70).length / mockPerformance.length) * 100}
                    strokeColor="#DC2626"
                    showInfo={false}
                  />
                </div>

                <Divider />

                <Alert
                  message="绩效改进建议"
                  description={`本月有${warningCount}个部门处于待改进状态，建议重点关注基础设施运维部和法务合规部的目标达成情况，制定针对性改进计划`}
                  type="warning"
                  showIcon
                  icon={<AimOutlined />}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`绩效详情 - ${selectedRecord?.department}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={720}
          footer={
            <Space>
              <Button icon={<EditOutlined />}>编辑考核</Button>
              <Button icon={<BarChartOutlined />}>查看历史</Button>
              <Button type="primary" icon={<FileTextOutlined />}>
                导出报告
              </Button>
            </Space>
          }
        >
          {selectedRecord && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="部门">{selectedRecord.department}</Descriptions.Item>
                <Descriptions.Item label="负责人">{selectedRecord.manager}</Descriptions.Item>
                <Descriptions.Item label="综合排名">
                  <span className="flex items-center gap-2">
                    {getRankBadge(selectedRecord.rank)}
                    {getRankChange(selectedRecord.rankChange)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="绩效等级">{getStatusTag(selectedRecord.status)}</Descriptions.Item>
                <Descriptions.Item label="KPI总分">
                  <span className="text-xl font-bold" style={{
                    color: selectedRecord.kpiScore >= 90 ? '#16A34A' : selectedRecord.kpiScore >= 80 ? '#1677FF' : '#F59E0B'
                  }}>
                    {selectedRecord.kpiScore} 分
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="目标达成率">
                  <Progress
                    percent={Math.min(selectedRecord.targetRate, 120)}
                    size="small"
                    format={() => `${selectedRecord.targetRate}%`}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="任务完成情况" span={2}>
                  {selectedRecord.completedTasks}/{selectedRecord.totalTasks} 项 · 考核周期: {selectedRecord.month}
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title="三维能力评估">
                <Row gutter={24}>
                  <Col span={8} className="text-center">
                    <Progress type="dashboard" percent={selectedRecord.innovationScore} size={90}
                      format={() => <><div className="text-lg font-bold">{selectedRecord.innovationScore}</div><div className="text-xs">创新能力</div></>}
                      strokeColor="#7C3AED" />
                  </Col>
                  <Col span={8} className="text-center">
                    <Progress type="dashboard" percent={selectedRecord.teamworkScore} size={90}
                      format={() => <><div className="text-lg font-bold">{selectedRecord.teamworkScore}</div><div className="text-xs">团队协作</div></>}
                      strokeColor="#1677FF" />
                  </Col>
                  <Col span={8} className="text-center">
                    <Progress type="dashboard" percent={selectedRecord.efficiencyScore} size={90}
                      format={() => <><div className="text-lg font-bold">{selectedRecord.efficiencyScore}</div><div className="text-xs">执行效率</div></>}
                      strokeColor="#16A34A" />
                  </Col>
                </Row>
              </Card>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="亮点成果">
                    <List
                      size="small"
                      dataSource={selectedRecord.highlights}
                      renderItem={(item) => (
                        <List.Item>
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="改进方向">
                    <List
                      size="small"
                      dataSource={selectedRecord.improvements}
                      renderItem={(item) => (
                        <List.Item>
                          <WarningOutlined className="text-orange-500 mr-2" />
                          {item}
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
