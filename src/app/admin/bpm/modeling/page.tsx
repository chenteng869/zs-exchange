'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Modal, Form, Input, Select, InputNumber,
  Space, Row, Col, Statistic, Tabs, message, Tooltip, Descriptions,
  Timeline, Progress, Divider,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  BranchesOutlined, PlayCircleOutlined, RocketOutlined, SaveOutlined,
  SettingOutlined, FileTextOutlined, ApiOutlined, SearchOutlined,
  CopyOutlined, HistoryOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 模拟流程模型数据（10条）
const mockProcessModels = [
  { id: 'proc-001', name: 'NFT上架审批流程', version: 'v3.2', status: 'published', nodeCount: 8, creator: '李娜', updatedAt: '2024-06-07 16:30', instanceCount: 2850, avgDuration: '2h15m', complexity: 'high' },
  { id: 'proc-002', name: '用户提现审批流程', version: 'v2.8', status: 'published', nodeCount: 10, creator: '王强', updatedAt: '2024-06-06 10:20', instanceCount: 15200, avgDuration: '45m', complexity: 'high' },
  { id: 'proc-003', name: 'KYC认证流程', version: 'v4.1', status: 'published', nodeCount: 12, creator: '张伟', updatedAt: '2024-06-05 14:00', instanceCount: 35600, avgDuration: '18m', complexity: 'medium' },
  { id: 'proc-004', name: '异常交易处理流程', version: 'v1.5', status: 'draft', nodeCount: 7, creator: '赵敏', updatedAt: '2024-06-04 09:15', instanceCount: 0, avgDuration: '-', complexity: 'low' },
  { id: 'proc-005', name: '项目入驻申请流程', version: 'v2.0', status: 'archived', nodeCount: 9, creator: '陈浩', updatedAt: '2024-05-28 17:30', instanceCount: 420, avgDuration: '5d', complexity: 'medium' },
  { id: 'proc-006', name: '代币发行审批流程', version: 'v1.2', status: 'draft', nodeCount: 6, creator: '刘洋', updatedAt: '2024-06-03 11:00', instanceCount: 0, avgDuration: '-', complexity: 'low' },
  { id: 'proc-007', name: '合规审查工作流', version: 'v3.0', status: 'published', nodeCount: 14, creator: '孙丽', updatedAt: '2024-06-02 09:45', instanceCount: 8920, avgDuration: '3h30m', complexity: 'high' },
  { id: 'proc-008', name: '用户投诉处理流程', version: 'v2.1', status: 'published', nodeCount: 9, creator: '周杰', updatedAt: '2024-06-01 16:00', instanceCount: 12500, avgDuration: '1h20m', complexity: 'medium' },
  { id: 'proc-009', name: '资金清算对账流程', version: 'v1.8', status: 'published', nodeCount: 11, creator: '吴芳', updatedAt: '2024-05-30 10:30', instanceCount: 7680, avgDuration: '55m', complexity: 'high' },
  { id: 'proc-010', name: 'API密钥轮换流程', version: 'v1.0', status: 'draft', nodeCount: 5, creator: '郑凯', updatedAt: '2024-05-29 14:20', instanceCount: 0, avgDuration: '-', complexity: 'low' },
];

// 流程类型分布图表配置
const processTypeOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [{
    name: '流程分类',
    type: 'pie',
    radius: ['40%', '70%'],
    data: [
      { value: 4, name: '审批类', itemStyle: { color: '#1677FF' } },
      { value: 3, name: '风控类', itemStyle: { color: '#DC2626' } },
      { value: 2, name: '运营类', itemStyle: { color: '#F59E0B' } },
      { value: 1, name: '结算类', itemStyle: { color: '#7C3AED' } },
    ],
    label: { formatter: '{b}\n{d}%' },
  }],
};

export default function BPMModelingPage() {
  const [form] = Form.useForm();
  const [designerModalVisible, setDesignerModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: models, isLoading } = useQuery({
    queryKey: ['bpm-models'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockProcessModels;
    },
  });

  const filtered = (models || []).filter((m: any) => {
    const matchSearch = !searchText || m.name.includes(searchText);
    const matchStatus = !statusFilter || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // 状态渲染
  const renderStatus = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      published: { color: 'success', text: '已发布' },
      draft: { color: 'default', text: '草稿' },
      archived: { color: 'warning', text: '已归档' },
    };
    const s = map[status] || { color: 'default', text: '未知' };
    return <Badge status={s.color as any} text={s.text} />;
  };

  // 复杂度渲染
  const getComplexityConfig = (c: string) => ({
    high: { color: 'red', text: '高', icon: <BranchesOutlined /> },
    medium: { color: 'orange', text: '中', icon: <SettingOutlined /> },
    low: { color: 'green', text: '低', icon: <FileTextOutlined /> },
  }[c] || { color: 'default', text: c, icon: null });

  const columns = [
    {
      title: '模型ID',
      dataIndex: 'id',
      key: 'id',
      width: 110,
      render: (v: string) => <code className="text-xs">{v}</code>,
    },
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => renderStatus(s),
    },
    {
      title: '节点数',
      dataIndex: 'nodeCount',
      key: 'nodeCount',
      width: 90,
      render: (v: number) => `${v} 个`,
    },
    {
      title: '复杂度',
      dataIndex: 'complexity',
      key: 'complexity',
      width: 90,
      render: (c: string) => {
        const cfg = getComplexityConfig(c);
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 80 },
    {
      title: '运行实例',
      dataIndex: 'instanceCount',
      key: 'instanceCount',
      width: 100,
      render: (v: number) => v.toLocaleString(),
    },
    { title: '平均耗时', dataIndex: 'avgDuration', key: 'avgDuration', width: 100 },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (r: any) => { setSelectedModel(r); setDetailModalVisible(true); } },
    { key: 'edit', label: '设计', icon: <EditOutlined />, type: 'primary', onClick: (r: any) => { setSelectedModel(r); setDesignerModalVisible(true); } },
    { key: 'publish', label: '发布', icon: <RocketOutlined />, onClick: (r: any) => message.success(`流程「${r.name}」已发布`) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页面标题区 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BranchesOutlined className="text-blue-600" />
              流程建模
            </h1>
            <p className="text-gray-500 mt-1">可视化流程设计、流程模板管理、BPMN编辑与版本控制</p>
          </div>
          <Space>
            <Button icon={<CopyOutlined />} onClick={() => message.info('导入BPMN文件')}>导入</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setSelectedModel(null); setDesignerModalVisible(true); }}>新建流程</Button>
          </Space>
        </div>

        {/* 数据统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="流程模型数" value={models?.length || 0} icon={<BranchesOutlined />} color="#1677FF" suffix="个" description="全部已注册流程模板" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="已发布" value={models?.filter((m: any) => m.status === 'published').length || 0} icon={<RocketOutlined />} color="#16A34A" trend="up" trendValue="+2 本周" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="草稿数" value={models?.filter((m: any) => m.status === 'draft').length || 0} icon={<FileTextOutlined />} color="#F59E0B" description="待审核发布" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="平均节点数" value={models ? Math.round(models.reduce((s: number, m: any) => s + m.nodeCount, 0) / models.length) : 0} icon={<ApiOutlined />} color="#7C3AED" suffix="个" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="总实例数" value={models?.reduce((s: number, m: any) => s + m.instanceCount, 0).toLocaleString() || '0'} icon={<PlayCircleOutlined />} color="#DC2626" description="历史累计运行" />
          </Col>
        </Row>

        {/* 主内容区：数据表格 + 图表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <DataTable
              columns={columns}
              dataSource={filtered}
              loading={isLoading}
              title="流程模型列表"
              actions={actions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              searchPlaceholder="搜索流程名称或ID"
              onRefresh={() => message.info('刷新成功')}
            />
          </Col>
          <Col xs={24} lg={8}>
            <Card title="流程分类分布" className="shadow-sm" size="small">
              <SafeECharts option={processTypeOption} style={{ height: 320 }} title="分类分布" />
              <Divider className="my-3" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm"><span>高复杂度流程</span><Tag color="red">{models?.filter((m: any) => m.complexity === 'high').length || 0}</Tag></div>
                <div className="flex items-center justify-between text-sm"><span>中复杂度流程</span><Tag color="orange">{models?.filter((m: any) => m.complexity === 'medium').length || 0}</Tag></div>
                <div className="flex items-center justify-between text-sm"><span>低复杂度流程</span><Tag color="green">{models?.filter((m: any) => m.complexity === 'low').length || 0}</Tag></div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 业务特性说明 */}
        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50" size="small">
          <div className="flex items-start gap-3">
            <CheckCircleOutlined className="text-green-500 text-lg mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">BPMN 2.0 标准支持</h4>
              <p className="text-sm text-gray-600">完整支持 BPMN 2.0 规范，包括开始/结束事件、用户任务、服务任务、排他网关、并行网关、子流程等核心元素。所有流程模型支持版本管理、差异对比和一键回滚。</p>
            </div>
          </div>
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`流程详情: ${selectedModel?.name || ''}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={700}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            <Button key="design" type="primary" icon={<EditOutlined />} onClick={() => { setDetailModalVisible(false); setDesignerModalVisible(true); }}>进入设计器</Button>,
          ]}
        >
          {selectedModel && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="流程ID" span={2}>{selectedModel.id}</Descriptions.Item>
                <Descriptions.Item label="流程名称" span={2}><span className="font-semibold">{selectedModel.name}</span></Descriptions.Item>
                <Descriptions.Item label="版本"><Tag color="blue">{selectedModel.version}</Tag></Descriptions.Item>
                <Descriptions.Item label="状态">{renderStatus(selectedModel.status)}</Descriptions.Item>
                <Descriptions.Item label="节点数量">{selectedModel.nodeCount} 个</Descriptions.Item>
                <Descriptions.Item label="复杂度">{(() => { const c = getComplexityConfig(selectedModel.complexity); return <Tag color={c.color}>{c.text}</Tag>; })()}</Descriptions.Item>
                <Descriptions.Item label="运行实例">{selectedModel.instanceCount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="平均耗时">{selectedModel.avgDuration}</Descriptions.Item>
                <Descriptions.Item label="创建者">{selectedModel.creator}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{selectedModel.updatedAt}</Descriptions.Item>
              </Descriptions>
              <div>
                <label className="block font-medium mb-2">版本历史</label>
                <Timeline
                  items={[
                    { color: 'green', children: <div><strong>{selectedModel.version}</strong> · 当前版本 · {selectedModel.updatedAt}</div> },
                    { color: 'gray', children: <div>v{(parseFloat(selectedModel.version.slice(1)) - 0.1).toFixed(1)} · 上一个版本</div> },
                    { color: 'gray', children: <div>v{(parseFloat(selectedModel.version.slice(1)) - 0.2).toFixed(1)} · 初始版本</div> },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>

        {/* 设计器弹窗 */}
        <Modal
          title={`流程设计器 - ${selectedModel?.name || '新建流程'}`}
          open={designerModalVisible}
          onCancel={() => setDesignerModalVisible(false)}
          width={1100}
          footer={
            <div className="flex justify-between">
              <Space><Button icon={<SaveOutlined />}>保存草稿</Button><Button icon={<HistoryOutlined />}>版本历史</Button></Space>
              <Space>
                <Button onClick={() => setDesignerModalVisible(false)}>关闭</Button>
                <Button type="primary" ghost icon={<SettingOutlined />}>属性配置</Button>
                <Button type="primary" icon={<RocketOutlined />} onClick={() => { message.success('流程已保存并发布'); setDesignerModalVisible(false); }}>发布</Button>
              </Space>
            </div>
          }
        >
          <div className="flex gap-4" style={{ height: 500 }}>
            {/* 左侧节点面板 */}
            <div className="w-48 border-r pr-3 overflow-y-auto bg-gray-50 rounded p-3">
              <h4 className="font-semibold text-sm mb-3">节点工具箱</h4>
              {[
                { cat: '基础节点', items: [{ n: '开始事件', t: 'start' }, { n: '结束事件', t: 'end' }] },
                { cat: '任务节点', items: [{ n: '用户任务', t: 'userTask' }, { n: '服务任务', t: 'serviceTask' }] },
                { cat: '网关节点', items: [{ n: '排他网关', t: 'exclusiveGateway' }, { n: '并行网关', t: 'parallelGateway' }] },
              ].map(group => (
                <div key={group.cat} className="mb-4">
                  <div className="text-xs font-medium text-gray-500 mb-2">{group.cat}</div>
                  <div className="space-y-1.5">
                    {group.items.map(item => (
                      <div key={item.n} draggable className="p-2 border rounded cursor-move hover:border-blue-400 hover:bg-blue-50 text-sm transition-all bg-white">{item.n}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {/* 中间画布 */}
            <div className="flex-1 bg-gray-50 rounded-lg p-6 relative overflow-auto" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-12 bg-green-100 border-2 border-green-500 rounded-full flex items-center justify-center font-medium text-green-700 shadow-md">开始</div>
              <div className="absolute top-24 left-1/2 w-0.5 h-8 bg-gray-400 left-[calc(50%-2px)]"></div>
              <div className="absolute top-32 left-1/2 -translate-x-1/2 px-4 py-2 bg-blue-100 border-2 border-blue-500 rounded-lg shadow-md text-sm font-medium">提交申请</div>
              <div className="absolute top-48 left-1/2 w-0.5 h-8 bg-gray-400 left-[calc(50%-2px)]"></div>
              <div className="absolute top-56 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-yellow-100 border-2 border-yellow-500 rounded shadow-md text-sm font-medium">◇ 条件判断</div>
              <div className="absolute bottom-16 left-1/2 w-0.5 h-8 bg-gray-400 left-[calc(50%-2px)]"></div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-12 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center font-medium text-red-700 shadow-md">结束</div>
              <div className="absolute bottom-2 right-4 text-xs text-gray-400">从左侧拖拽节点到画布构建流程</div>
            </div>
            {/* 右侧属性面板 */}
            <div className="w-52 border-l pl-3 overflow-y-auto bg-gray-50 rounded p-3">
              <h4 className="font-semibold text-sm mb-3">属性配置</h4>
              <Form form={form} layout="vertical" size="small">
                <Form.Item label="流程名称"><Input defaultValue={selectedModel?.name || '新流程'} /></Form.Item>
                <Form.Item label="流程描述"><Input.TextArea rows={3} placeholder="输入流程描述..." /></Form.Item>
                <Form.Item label="负责人"><Select defaultValue="李娜" options={[{ label: '李娜', value: '李娜' }, { label: '王强', value: '王强' }]} /></Form.Item>
                <Form.Item label="超时设置"><InputNumber addonAfter="分钟" defaultValue={30} className="w-full" /></Form.Item>
              </Form>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
