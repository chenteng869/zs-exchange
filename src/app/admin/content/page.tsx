'use client';

import React, { useState } from 'react';
import { Row, Col, Tag, Badge, Modal, message, Typography } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockContent = [
  { id: 'CT-001', title: '2026 Q2 数字资产市场报告', category: '研报', author: '研究团队', status: 'published', publishDate: '2026-06-20', views: 12580 },
  { id: 'CT-002', title: 'BTC减半后市场走势分析', category: '资讯', author: '张三', status: 'published', publishDate: '2026-06-19', views: 8920 },
  { id: 'CT-003', title: 'DeFi夏季新协议盘点', category: '文章', author: '李四', status: 'review', publishDate: '-', views: 0 },
  { id: 'CT-004', title: '平台升级维护公告 v2.5', category: '公告', author: '运营组', status: 'published', publishDate: '2026-06-18', views: 25600 },
  { id: 'CT-005', title: 'NFT铸造功能上线指南', category: '教程', author: '产品部', status: 'published', publishDate: '2026-06-17', views: 6540 },
  { id: 'CT-006', title: '安全提醒：防范钓鱼攻击', category: '公告', author: '安全团队', status: 'published', publishDate: '2026-06-16', views: 18200 },
  { id: 'CT-007', title: 'Layer2生态发展白皮书', category: '研报', author: '研究团队', status: 'draft', publishDate: '-', views: 0 },
  { id: 'CT-008', title: '本周交易大赛获奖名单', category: '活动', author: '运营组', status: 'review', publishDate: '-', views: 0 },
  { id: 'CT-009', title: 'Web3钱包使用入门教程', category: '教程', author: '王五', status: 'published', publishDate: '2026-06-15', views: 9800 },
  { id: 'CT-010', title: '监管政策动态追踪(六月)', category: '资讯', author: '法务部', status: 'review', publishDate: '-', views: 0 },
  { id: 'CT-011', title: 'AI驱动的量化交易策略分享', category: '文章', author: '赵六', status: 'draft', publishDate: '-', views: 0 },
  { id: 'CT-012', title: '社区治理提案投票通知', category: '公告', author: 'DAO委员会', status: 'published', publishDate: '2026-06-14', views: 5420 },
];

export default function ContentManagePage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);

  const handleViewDetail = (record: any) => {
    setSelectedContent(record);
    setDetailVisible(true);
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span className="font-semibold" style={{ maxWidth: 240, display: 'block' }}>{text}</span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: string) => {
        const colors: Record<string, string> = {
          研报: 'blue',
          资讯: 'green',
          文章: 'orange',
          公告: 'red',
          教程: 'purple',
          活动: 'gold',
        };
        return <Tag color={colors[cat] || 'default'}>{cat}</Tag>;
      },
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          published: { color: 'success', text: '已发布' },
          review: { color: 'processing', text: '待审核' },
          draft: { color: 'default', text: '草稿' },
        };
        const item = map[status];
        return item ? <Badge status={item.color as any} text={item.text} /> : status;
      },
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      render: (d: string) => d === '-' ? <Text type="secondary">-</Text> : d,
    },
    {
      title: '阅读量',
      dataIndex: 'views',
      key: 'views',
      render: (v: number) => v > 0 ? v.toLocaleString() : '-',
      sorter: (a: any, b: any) => a.views - b.views,
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: handleViewDetail,
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      type: 'link',
    },
    {
      key: 'delete',
      label: '删除',
      icon: <DeleteOutlined />,
      type: 'link',
      danger: true,
      confirm: {
        title: '确认删除该内容？',
        description: '删除后无法恢复',
        onConfirm: () => message.success('内容已删除'),
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#0F1B3D' }}>
            <FileTextOutlined style={{ color: '#F0B90B' }} />
            内容管理中心
          </h1>
          <p className="text-gray-500 mt-2">CMS · 文章 · 资讯 · 公告 · 版权内容管理</p>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="内容总数"
              value={486}
              icon={<FileTextOutlined />}
              color="#1677FF"
              suffix="篇"
              trend="up"
              trendValue="+8.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="待审核"
              value={23}
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              suffix="篇"
              description="需尽快处理"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="已发布"
              value={428}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              suffix="篇"
              trend="up"
              trendValue="+6.2%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日新增"
              value={8}
              icon={<PlusCircleOutlined />}
              color="#7C3AED"
              suffix="篇"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="阅读总量"
              value={128.5}
              suffix="W"
              icon={<EyeOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+22.3%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockContent}
          rowKey="id"
          title="内容列表"
          searchPlaceholder="搜索标题/作者..."
          showFilter
          filterOptions={[
            { label: '全部分类', value: '' },
            { label: '研报', value: '研报' },
            { label: '资讯', value: '资讯' },
            { label: '文章', value: '文章' },
            { label: '公告', value: '公告' },
            { label: '教程', value: '教程' },
            { label: '活动', value: '活动' },
          ]}
          actions={actions}
          onAdd={() => message.info('跳转至编辑器')}
          addButtonText="新建内容"
        />

        {/* 详情Modal */}
        <Modal
          title="内容详情"
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          footer={null}
          width={520}
        >
          {selectedContent && (
            <div className="space-y-4">
              <Row gutter={[16, 16]}>
                <Col span={12}><Text type="secondary">ID:</Text><br /><Text strong>{selectedContent.id}</Text></Col>
                <Col span={12}><Text type="secondary">分类:</Text><br /><Tag color="blue">{selectedContent.category}</Tag></Col>
                <Col span={24}><Text type="secondary">标题:</Text><br /><Text strong>{selectedContent.title}</Text></Col>
                <Col span={12}><Text type="secondary">作者:</Text><br /><Text strong>{selectedContent.author}</Text></Col>
                <Col span={12}><Text type="secondary">状态:</Text><br /><Badge status={selectedContent.status === 'published' ? 'success' : 'processing'} text={selectedContent.status === 'published' ? '已发布' : '待审核'} /></Col>
                <Col span={12}><Text type="secondary">发布日期:</Text><br /><Text strong>{selectedContent.publishDate}</Text></Col>
                <Col span={12}><Text type="secondary">阅读量:</Text><br /><Text strong>{selectedContent.views.toLocaleString()}</Text></Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
