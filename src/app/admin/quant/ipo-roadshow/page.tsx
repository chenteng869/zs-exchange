'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  VideoCameraOutlined, EyeOutlined, EditOutlined, SendOutlined, FileTextOutlined,
  CalendarOutlined, TeamOutlined, QuestionCircleOutlined, SmileOutlined,
  ThunderboltOutlined, ClockCircleOutlined, UserOutlined, EnvironmentOutlined,
  LaptopOutlined, GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, DashboardOutlined, BulbOutlined, HistoryOutlined, BellOutlined,
  FileProtectOutlined, ScheduleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface RoadshowEvent {
  id: number;
  companyName: string;
  eventType: '1v1' | 'group' | 'roadshow-day' | 'investor-forum';
  date: string;
  time: string;
  durationMin: number;
  location: 'virtual' | 'physical' | 'hybrid';
  hostTeam: string;
  investorCount: number;
  questionsReceived: number;
  questionsAnswered: number;
  sentimentScore: number;
  materialsShared: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'postponed';
  notes: string;
}

const mockRoadshows: RoadshowEvent[] = [
  { id: 1, companyName: '星云智能科技', eventType: 'investor-forum', date: '2025-06-25', time: '14:00', durationMin: 180, location: 'hybrid', hostTeam: 'CEO张总+CFO李总', investorCount: 85, questionsReceived: 42, questionsAnswered: 38, sentimentScore: 88, materialsShared: ['IPO招股书v2.0', '财务模型Excel', '产品Demo视频'], status: 'scheduled', notes: '重点关注AI商业化进展' },
  { id: 2, companyName: '绿源新能源', eventType: 'roadshow-day', date: '2025-06-22', time: '09:30', durationMin: 360, location: 'physical', hostTeam: 'IR团队全员', investorCount: 120, questionsReceived: 68, questionsAnswered: 65, sentimentScore: 92, materialsShared: ['ESG报告', '产能规划PPT', '供应链分析'], status: 'completed', notes: '投资者反馈积极，关注补贴政策' },
  { id: 3, companyName: '量子计算实验室', eventType: '1v1', date: '2025-06-20', time: '10:00', durationMin: 60, location: 'virtual', hostTeam: 'CTO王博士', investorCount: 3, questionsReceived: 15, questionsAnswered: 12, sentimentScore: 75, materialsShared: ['技术白皮书', '专利清单'], status: 'completed', notes: '机构投资者对商业化路径存疑' },
  { id: 4, companyName: '医联健康平台', eventType: 'group', date: '2025-06-18', time: '15:30', durationMin: 90, location: 'hybrid', hostTeam: 'CEO刘总+COO陈总', investorCount: 25, questionsReceived: 30, questionsAnswered: 28, sentimentScore: 85, materialsShared: ['用户增长数据', '合规说明函', '竞品分析'], status: 'completed', notes: '数据合规问题是焦点' },
  { id: 5, companyName: '深空航天科技', eventType: '1v1', date: '2025-06-26', time: '11:00', durationMin: 45, location: 'physical', hostTeam: 'CEO赵总', investorCount: 2, questionsReceived: 8, questionsAnswered: 8, sentimentScore: 80, materialsShared: ['卫星发射计划', '政府合同明细'], status: 'scheduled', notes: '主权基金感兴趣' },
  { id: 6, companyName: '链上金融科技', eventType: 'investor-forum', date: '2025-06-15', time: '16:00', durationMin: 120, location: 'virtual', hostTeam: 'CEO兼CTO林总', investorCount: 55, questionsReceived: 35, questionsAnswered: 30, sentimentScore: 62, materialsShared: ['DeFi协议审计报告', '代币经济学设计'], status: 'cancelled', notes: '监管政策不确定性导致取消' },
  { id: 7, companyName: '智造机器人', eventType: 'roadshow-day', date: '2025-06-28', time: '09:00', durationMin: 420, location: 'physical', hostTeam: '管理层+技术团队', investorCount: 150, questionsReceived: 0, questionsAnswered: 0, sentimentScore: 0, materialsShared: ['工厂参观手册', '自动化产线视频', '客户案例集'], status: 'scheduled', notes: '安排工厂实地考察' },
  { id: 8, companyName: '自动驾驶出行', eventType: 'group', date: '2025-06-10', time: '14:00', durationMin: 90, location: 'virtual', hostTeam: '首席安全官+产品VP', investorCount: 40, questionsReceived: 48, questionsAnswered: 45, sentimentScore: 78, materialsShared: ['L4测试报告', '事故分析文档', '法规解读'], status: 'completed', notes: '安全事故记录被反复追问' },
  { id: 9, companyName: '碳捕集环保', eventType: '1v1', date: '2025-06-24', time: '09:30', durationMin: 60, location: 'virtual', hostTeam: 'CSO周总', investorCount: 1, questionsReceived: 10, questionsAnswered: 9, sentimentScore: 86, materialsShared: ['碳信用方法论', '项目ROI测算'], status: 'postponed', notes: '投资者临时调整日程' },
  { id: 10, companyName: '生物基因编辑', eventType: 'group', date: '2025-07-02', time: '10:30', durationMin: 75, location: 'hybrid', hostTeam: '首席科学家团队', investorCount: 20, questionsReceived: 0, questionsAnswered: 0, sentimentScore: 0, materialsShared: ['临床前数据', '伦理审查批件'], status: 'scheduled', notes: '需准备充分的科学解释材料' },
];

const eventTypeConfig: Record<string, { color: string; label: string }> = {
  '1v1': { color: 'blue', label: '一对一会议' },
  group: { color: 'cyan', label: '小组会议' },
  'roadshow-day': { color: 'purple', label: '路演日' },
  'investor-forum': { color: 'gold', label: '投资者论坛' },
};

const locationConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  virtual: { color: 'green', label: '线上', icon: <LaptopOutlined /> },
  physical: { color: 'orange', label: '线下', icon: <EnvironmentOutlined /> },
  hybrid: { color: 'purple', label: '混合', icon: <GlobalOutlined /> },
};

const statusConfig: Record<string, { color: string; label: string }> = {
  scheduled: { color: 'processing', label: '已安排' },
  completed: { color: 'success', label: '已完成' },
  cancelled: { color: 'error', label: '已取消' },
  postponed: { color: 'warning', label: '已延期' },
};

export default function IpoRoadshowPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RoadshowEvent | null>(null);
  const [filterEventType, setFilterEventType] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  const filteredData = mockRoadshows.filter((item) => {
    if (filterEventType && item.eventType !== filterEventType) return false;
    if (filterStatus && item.status !== filterStatus) return false;
    return true;
  });

  const totalEvents = filteredData.length;
  const thisMonthEvents = filteredData.filter((i) => dayjs(i.date).month() === dayjs().month()).length;
  const totalInvestors = filteredData.reduce((sum, i) => sum + i.investorCount, 0);
  const avgSentiment = filteredData.filter((i) => i.sentimentScore > 0).length > 0
    ? Math.round(filteredData.filter((i) => i.sentimentScore > 0).reduce((sum, i) => sum + i.sentimentScore, 0) / filteredData.filter((i) => i.sentimentScore > 0).length)
    : 0;
  const pendingQa = filteredData.filter((i) => i.questionsReceived > i.questionsAnswered && i.status !== 'cancelled').reduce((sum, i) => sum + (i.questionsReceived - i.questionsAnswered), 0);

  const handleViewDetail = (record: RoadshowEvent) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleEdit = (record: RoadshowEvent) => {
    message.info(`正在编辑路演活动: ${record.companyName}`);
  };

  const handleSendReminder = (record: RoadshowEvent) => {
    message.success(`已向 ${record.investorCount} 位投资者发送提醒通知`);
  };

  const handleGenerateReport = (record: RoadshowEvent) => {
    message.loading(`正在生成 ${record.companyName} 的路演报告...`, 2);
  };

  const columns = [
    { title: '企业名', dataIndex: 'companyName', key: 'companyName', width: 130, fixed: 'left' as const, render: (t: string) => <a style={{ fontWeight: 600 }}>{t}</a> },
    { title: '活动类型', dataIndex: 'eventType', key: 'eventType', width: 105, render: (e: string) => <Tag color={eventTypeConfig[e]?.color}>{eventTypeConfig[e]?.label}</Tag> },
    { title: '日期', dataIndex: 'date', key: 'date', width: 100, render: (d: string) => <span>{dayjs(d).format('MM-DD')} <small style={{ color: '#9CA3AF' }}>{mockRoadshows.find(m => m.date === d)?.time}</small></span> },
    { title: '时长(分)', dataIndex: 'durationMin', key: 'durationMin', width: 85, render: (v: number) => `${v}min` },
    { title: '形式', dataIndex: 'location', key: 'location', width: 75, render: (l: string) => <Tag icon={locationConfig[l]?.icon} color={locationConfig[l]?.color}>{locationConfig[l]?.label}</Tag> },
    { title: '主讲团队', dataIndex: 'hostTeam', key: 'hostTeam', width: 150, ellipsis: true },
    { title: '投资者数', dataIndex: 'investorCount', key: 'investorCount', width: 85, render: (v: number) => <><UserOutlined style={{ marginRight: 4 }} /><strong>{v}</strong></> },
    { title: 'Q&A总数', dataIndex: 'questionsReceived', key: 'questionsReceived', width: 75, render: (v: number) => <><QuestionCircleOutlined style={{ marginRight: 4 }} />{v}</> },
    { title: '已回答', dataIndex: 'questionsAnswered', key: 'questionsAnswered', width: 75, render: (v: number, r: any) => (
      <span style={{ color: v >= r.questionsReceived ? '#16A34A' : v >= r.questionsReceived * 0.8 ? '#F59E0B' : '#DC2626' }}>{v}</span>
    )},
    { title: '情绪分', dataIndex: 'sentimentScore', key: 'sentimentScore', width: 95, render: (v: number) => v > 0 ? (
      <Progress percent={v} size="small" format={(p) => p} strokeColor={v >= 85 ? '#16A34A' : v >= 70 ? '#1677FF' : '#F59E0B'} />
    ) : '-' },
    { title: '材料数', dataIndex: 'materialsShared', key: 'materialsShared', width: 70, render: (m: string[]) => m.length },
    { title: '状态', dataIndex: 'status', key: 'status', width: 82, render: (s: string) => <Tag color={statusConfig[s]?.color}>{statusConfig[s]?.label}</Tag> },
    { title: '备注', dataIndex: 'notes', key: 'notes', width: 160, ellipsis: true, render: (n: string) => <Tooltip title={n}><span style={{ color: '#6B7280' }}>{n}</span></Tooltip> },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
    { key: 'edit', label: '编辑', icon: <EditOutlined />, type: 'link' as const, hidden: () => false, onClick: handleEdit },
    { key: 'reminder', label: '发送提醒', icon: <BellOutlined />, type: 'link' as const, hidden: (r: any) => r.status !== 'scheduled', onClick: handleSendReminder },
    { key: 'report', label: '生成报告', icon: <FileTextOutlined />, type: 'link' as const, hidden: (r: any) => r.status !== 'completed', onClick: handleGenerateReport },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <VideoCameraOutlined style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>投资者路演管理</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              数字化路演全流程 · 投资者邀约/会议管理/Q&A跟踪 · AIOPC智能匹配
            </p>
          </div>
        </div>

        {/* DataCard x5 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="路演活动总数" value={totalEvents} icon={<CalendarOutlined />} color="#1677FF" suffix="场" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="本月场次" value={thisMonthEvents} icon={<ScheduleOutlined />} color="#16A34A" suffix="场" trend="up" trendValue="+3 本月" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="参与投资者" value={totalInvestors} icon={<TeamOutlined />} color="#7C3AED" suffix="位" description={`覆盖${[...new Set(mockRoadshows.map(r => r.companyName))].length}家企业`} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均满意度" value={`${avgSentiment}`} icon={<SmileOutlined />} color="#F0B90B" suffix="/100" description="投资者情绪指数" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="待跟进Q&A" value={pendingQa} icon={<WarningOutlined />} color="#DC2626" suffix="条" description="未回复问题" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="活动类型" allowClear style={{ width: 140 }} value={filterEventType} onChange={setFilterEventType}>
              <Select.Option value="1v1">一对一会议</Select.Option>
              <Select.Option value="group">小组会议</Select.Option>
              <Select.Option value="roadshow-day">路演日</Select.Option>
              <Select.Option value="investor-forum">投资者论坛</Select.Option>
            </Select>
            <Select placeholder="状态筛选" allowClear style={{ width: 120 }} value={filterStatus} onChange={setFilterStatus}>
              <Select.Option value="scheduled">已安排</Select.Option>
              <Select.Option value="completed">已完成</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="postponed">已延期</Select.Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions as any[]}
          showSearch={false}
          showAdd={false}
          onRefresh={() => message.info('数据已刷新')}
        />

        {/* 详情 Modal */}
        <Modal
          title={`${selectedRecord?.companyName || ''} - 路演活动详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={850}
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* 活动信息 */}
              <Card size="small" title={<><CalendarOutlined /> 活动基本信息</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="企业名称"><strong>{selectedRecord.companyName}</strong></Descriptions.Item>
                  <Descriptions.Item label="活动类型"><Tag color={eventTypeConfig[selectedRecord.eventType]?.color}>{eventTypeConfig[selectedRecord.eventType]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="日期时间">{dayjs(selectedRecord.date).format('YYYY-MM-DD')} {selectedRecord.time}</Descriptions.Item>
                  <Descriptions.Item label="持续时间">{selectedRecord.durationMin}分钟 ({(selectedRecord.durationMin / 60).toFixed(1)}小时)</Descriptions.Item>
                  <Descriptions.Item label="举办形式"><Tag icon={locationConfig[selectedRecord.location]?.icon} color={locationConfig[selectedRecord.location]?.color}>{locationConfig[selectedRecord.location]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="主讲团队">{selectedRecord.hostTeam}</Descriptions.Item>
                  <Descriptions.Item label="参与投资者">{selectedRecord.investorCount} 位</Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusConfig[selectedRecord.status]?.color}>{statusConfig[selectedRecord.status]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="备注" span={2}>{selectedRecord.notes || '-'}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 参与投资者列表 */}
              <Card size="small" title={<><TeamOutlined /> 参与投资者列表</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={Array.from({ length: selectedRecord.investorCount }, (_, i) => ({
                    name: `投资者${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
                    type: i % 3 === 0 ? '主权基金' : i % 3 === 1 ? '机构投资者' : '高净值个人',
                    interest: i % 4 === 0 ? '高度兴趣' : i % 4 === 1 ? '一般兴趣' : '观察中',
                    followUp: i % 5 === 0 ? '需要跟进' : '-',
                  })).slice(0, 10)}
                  columns={[
                    { title: '姓名/代号', dataIndex: 'name', key: 'name' },
                    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
                    { title: '投资意向', dataIndex: 'interest', key: 'interest', render: (t: string) => {
                      const color = t === '高度兴趣' ? 'success' : t === '一般兴趣' ? 'warning' : 'default';
                      return <Tag color={color}>{t}</Tag>;
                    }},
                    { title: '跟进状态', dataIndex: 'followUp', key: 'followUp', render: (t: string) => t === '需要跟进' ? <Tag color="warning">{t}</Tag> : t },
                  ]}
                  rowKey="name"
                />
                {selectedRecord.investorCount > 10 && <div style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 8 }}>还有 {selectedRecord.investorCount - 10} 位参与者...</div>}
              </Card>

              {/* Q&A记录表 */}
              <Card size="small" title={<><QuestionCircleOutlined /> Q&A跟踪记录</>} style={{ borderRadius: 8 }}>
                <Row gutter={[16, 8]} style={{ marginBottom: 12 }}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '8px', background: '#EFF6FF', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>收到问题</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#1677FF' }}>{selectedRecord.questionsReceived}</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '8px', background: '#F0FDF4', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>已回答</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A' }}>{selectedRecord.questionsAnswered}</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', padding: '8px', background: selectedRecord.questionsReceived <= selectedRecord.questionsAnswered ? '#F0FDF4' : '#FEF2F2', borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>待回复</div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: selectedRecord.questionsReceived <= selectedRecord.questionsAnswered ? '#16A34A' : '#DC2626' }}>
                        {Math.max(0, selectedRecord.questionsReceived - selectedRecord.questionsAnswered)}
                      </div>
                    </div>
                  </Col>
                </Row>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={Array.from({ length: Math.min(selectedRecord.questionsReceived, 8) }, (_, i) => ({
                    id: i + 1,
                    question: i === 0 ? `${selectedRecord.companyName}的核心竞争优势是什么？` :
                              i === 1 ? '未来3年的收入增长预期？' :
                              i === 2 ? '主要风险因素有哪些？' :
                              i === 3 ? '估值合理性如何判断？' :
                              i === 4 ? '竞争对手格局变化？' :
                              i === 5 ? '现金流何时转正？' :
                              i === 6 ? '团队稳定性如何保障？' :
                              '股权结构及投票权安排？',
                    answer: i < selectedRecord.questionsAnswered ? '已在会后补充材料中详细回复' : '待回复',
                    priority: i < 3 ? '高' : i < 6 ? '中' : '低',
                  }))}
                  columns={[
                    { title: '#', dataIndex: 'id', key: 'id', width: 40 },
                    { title: '问题内容', dataIndex: 'question', key: 'question', ellipsis: true },
                    { title: '回复状态', dataIndex: 'answer', key: 'answer', render: (a: string) => (
                      a === '待回复' ? <Tag color="warning">待回复</Tag> : <Tag color="success" icon={<CheckCircleOutlined />}>已回复</Tag>
                    )},
                    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (p: string) => (
                      <Tag color={p === '高' ? 'red' : p === '中' ? 'orange' : 'default'}>{p}</Tag>
                    )},
                  ]}
                  rowKey="id"
                />
              </Card>

              {/* AIOPC投资者画像 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> AIOPC投资者画像分析</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div style={{ background: '#FFFBE6', padding: 16, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                  <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                  <span className="font-semibold" style={{ color: '#F0B90B' }}>AIOPC智能洞察：</span>
                  <ul style={{ marginTop: 8, paddingLeft: 20, marginBottom: 0 }}>
                    <li><strong>投资者构成：</strong>{selectedRecord.eventType === '1v1' ? '深度交流型投资者，关注细节和风险。' : selectedRecord.eventType === 'investor-forum' ? '多元化投资者群体，话题广泛但深度有限。' : '中等规模专业投资者，注重财务数据和商业模式。'}</li>
                    <li><strong>情绪分析：</strong>当前情绪得分{selectedRecord.sentimentScore || 'N/A'}，{selectedRecord.sentimentScore >= 85 ? '投资者整体态度积极，建议加速推进后续流程。' : selectedRecord.sentimentScore >= 70 ? '投资者持谨慎乐观态度，建议针对性补充关键信息。' : '存在一定顾虑，需重点回应核心关切。'}</li>
                    <li><strong>匹配建议：</strong>基于本次互动特征，AIOPC推荐优先对接{['红杉资本', '高瓴资本', 'IDG资本', '经纬中国'][selectedRecord.id % 4]}等风格匹配的机构。</li>
                  </ul>
                </div>
              </Card>

              {/* 材料清单 */}
              <Card size="small" title={<><FileProtectOutlined /> 共享材料清单</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={selectedRecord.materialsShared.map((m, i) => ({
                    name: m,
                    type: i === 0 ? 'PDF' : i === 1 ? 'Excel' : i === 2 ? 'Video' : 'PPT',
                    size: `${(Math.random() * 15 + 2).toFixed(1)}MB`,
                    sharedAt: dayjs(selectedRecord.date).subtract(i, 'hour').format('HH:mm'),
                  }))}
                  columns={[
                    { title: '文件名', dataIndex: 'name', key: 'name', render: (t: string) => <a>{t}</a> },
                    { title: '格式', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
                    { title: '大小', dataIndex: 'size', key: 'size' },
                    { title: '分享时间', dataIndex: 'sharedAt', key: 'sharedAt' },
                  ]}
                  rowKey="name"
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
