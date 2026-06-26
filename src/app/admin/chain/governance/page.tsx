'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Statistic, Progress, Badge, Tabs } from 'antd';
import { TrophyOutlined, PlusOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockProposals = [
  { id: '1', title: '升级智能合约v2.0', description: '提议将核心智能合约升级至v2.0版本，包含性能优化和安全增强', type: 'upgrade', status: 'voting', votesFor: 85600, votesAgainst: 23400, totalVoters: 1568, endTime: '2024-05-20 18:00:00', proposer: '0x1234...5678' },
  { id: '2', title: '新增NFT市场功能', description: '提议在平台上新增NFT交易市场功能，支持NFT铸造和交易', type: 'feature', status: 'voting', votesFor: 45200, votesAgainst: 18900, totalVoters: 986, endTime: '2024-05-18 12:00:00', proposer: '0x9abc...def0' },
  { id: '3', title: '调整交易手续费', description: '提议将DEX交易手续费从0.3%调整至0.25%', type: 'parameter', status: 'passed', votesFor: 125000, votesAgainst: 32000, totalVoters: 2156, endTime: '2024-05-10 18:00:00', proposer: '0x5678...1234' },
  { id: '4', title: '社区奖励计划', description: '提议启动社区奖励计划，每月发放10万GXT代币给活跃用户', type: 'treasury', status: 'failed', votesFor: 28000, votesAgainst: 75000, totalVoters: 1245, endTime: '2024-05-08 12:00:00', proposer: '0xdef0...9abc' },
  { id: '5', title: '跨链桥扩展', description: '提议扩展跨链桥支持，新增对Polygon和Avalanche网络的支持', type: 'feature', status: 'pending', votesFor: 0, votesAgainst: 0, totalVoters: 0, endTime: '2024-05-25 18:00:00', proposer: '0x7890...abcd' },
];

const mockVoters = [
  { id: '1', address: '0x1234...5678', votingPower: 50000, delegated: false, lastVote: '2024-05-13 14:30:00', proposalsVoted: 12 },
  { id: '2', address: '0x9abc...def0', votingPower: 35000, delegated: true, delegatee: '0x1234...5678', lastVote: '2024-05-12 10:15:00', proposalsVoted: 8 },
  { id: '3', address: '0x5678...1234', votingPower: 28000, delegated: false, lastVote: '2024-05-13 11:20:00', proposalsVoted: 15 },
  { id: '4', address: '0xdef0...9abc', votingPower: 45000, delegated: false, lastVote: '2024-05-13 09:45:00', proposalsVoted: 10 },
];

export default function ChainGovernancePage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [form] = Form.useForm();

  const proposalColumns = [
    { 
      title: '提案标题', 
      dataIndex: 'title', 
      key: 'title', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const types = { upgrade: '合约升级', feature: '新功能', parameter: '参数调整', treasury: '资金管理' };
        const colors = { upgrade: 'purple', feature: 'green', parameter: 'blue', treasury: 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{types[type as keyof typeof types]}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const statusConfig: Record<string, { color: 'default' | 'processing' | 'success' | 'error'; label: string }> = {
          pending: { color: 'default', label: '待开始' },
          voting: { color: 'processing', label: '投票中' },
          passed: { color: 'success', label: '已通过' },
          failed: { color: 'error', label: '已否决' },
        };
        const config = statusConfig[status];
        return <Badge status={config?.color} text={config?.label} />;
      },
    },
    { 
      title: '支持票数', 
      dataIndex: 'votesFor', 
      key: 'votesFor', 
      render: (val: number) => <span className="text-green-600 font-semibold">{(val / 1000).toFixed(1)}K</span>,
    },
    { 
      title: '反对票数', 
      dataIndex: 'votesAgainst', 
      key: 'votesAgainst', 
      render: (val: number) => <span className="text-red-600 font-semibold">{(val / 1000).toFixed(1)}K</span>,
    },
    { 
      title: '投票率', 
      key: 'voteRate', 
      render: (_: any, record: any) => {
        const total = record.votesFor + record.votesAgainst;
        const rate = total > 0 ? Math.round((record.votesFor / total) * 100) : 0;
        return (
          <div className="flex items-center gap-2">
            <Progress percent={rate} strokeColor={rate >= 50 ? '#16A34A' : '#DC2626'} size="small" showInfo={false} />
            <span className="text-sm">{rate}%</span>
          </div>
        );
      },
    },
    { 
      title: '投票人数', 
      dataIndex: 'totalVoters', 
      key: 'totalVoters', 
      render: (val: number) => val.toLocaleString(),
    },
    { 
      title: '结束时间', 
      dataIndex: 'endTime', 
      key: 'endTime', 
      render: (val: string) => <span className="text-gray-500 text-sm">{val}</span>,
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setSelectedProposal(record)}>详情</Button>
          {record.status === 'voting' && (
            <>
              <Button type="link" size="small" icon={<ArrowUpOutlined />} className="text-green-600">支持</Button>
              <Button type="link" size="small" icon={<ArrowDownOutlined />} className="text-red-600">反对</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const voterColumns = [
    { title: '投票地址', dataIndex: 'address', key: 'address', render: (val: string) => <code className="text-sm">{val}</code> },
    { title: '投票权', dataIndex: 'votingPower', key: 'votingPower', render: (val: number) => `${(val / 1000).toFixed(1)}K` },
    { 
      title: '委托状态', 
      dataIndex: 'delegated', 
      key: 'delegated', 
      render: (val: boolean, record: any) => {
        if (val) {
          return <span className="text-blue-600">已委托给 {record.delegatee}</span>;
        }
        return <span className="text-green-600">自主投票</span>;
      },
    },
    { title: '最近投票', dataIndex: 'lastVote', key: 'lastVote' },
    { title: '参与提案数', dataIndex: 'proposalsVoted', key: 'proposalsVoted' },
  ];

  const handleAddProposal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const totalProposals = mockProposals.length;
  const activeProposals = mockProposals.filter(p => p.status === 'voting').length;
  const passedProposals = mockProposals.filter(p => p.status === 'passed').length;
  const totalVotingPower = mockVoters.reduce((sum, v) => sum + v.votingPower, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-orange-600" />
            <h1 className="text-2xl font-bold m-0">链上治理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProposal}>
            创建提案
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="提案总数" value={totalProposals} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">包含所有状态提案</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="投票中" value={activeProposals} valueStyle={{ color: '#10b981' }} />
              <div className="text-gray-400 text-sm mt-1">进行中的提案</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已通过" value={passedProposals} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">获得通过的提案</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总投票权" value={(totalVotingPower / 1000).toFixed(1)} suffix="K" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">GXT代币质押量</div>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="proposals" items={[
          { 
            key: 'proposals', 
            label: '提案列表',
            children: (
              <Card title="提案列表">
                <Table
                  dataSource={mockProposals}
                  columns={proposalColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                />
              </Card>
            )
          },
          { 
            key: 'voters', 
            label: '投票者列表',
            children: (
              <Card title="投票者列表">
                <Table
                  dataSource={mockVoters}
                  columns={voterColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                />
              </Card>
            )
          },
        ]} />

        <Modal
          title={selectedProposal ? '提案详情' : '创建新提案'}
          open={isModalVisible || !!selectedProposal}
          onOk={() => {
            if (!selectedProposal) {
              form.validateFields().then(() => {
                Modal.success({ title: '提案创建成功', content: '提案已提交，等待社区投票' });
                setIsModalVisible(false);
              });
            } else {
              setSelectedProposal(null);
            }
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedProposal(null);
          }}
          width={700}
        >
          {selectedProposal ? (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-blue-600">{selectedProposal.title}</h3>
              <p className="text-gray-600">{selectedProposal.description}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-sm">提案类型</label>
                  <p>{selectedProposal.type === 'upgrade' ? '合约升级' : selectedProposal.type === 'feature' ? '新功能' : selectedProposal.type === 'parameter' ? '参数调整' : '资金管理'}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">发起者</label>
                  <p className="font-mono text-sm">{selectedProposal.proposer}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">支持票数</label>
                  <p className="text-green-600 font-bold">{selectedProposal.votesFor.toLocaleString()} GXT</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">反对票数</label>
                  <p className="text-red-600 font-bold">{selectedProposal.votesAgainst.toLocaleString()} GXT</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">投票人数</label>
                  <p>{selectedProposal.totalVoters} 人</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">结束时间</label>
                  <p>{selectedProposal.endTime}</p>
                </div>
              </div>
              {selectedProposal.status === 'voting' && (
                <div className="flex gap-4 mt-4">
                  <Button type="primary" icon={<ArrowUpOutlined />}>支持</Button>
                  <Button danger icon={<ArrowDownOutlined />}>反对</Button>
                </div>
              )}
            </div>
          ) : (
            <Form form={form} layout="vertical">
              <Form.Item label="提案标题" name="title" rules={[{ required: true, message: '请输入提案标题' }]}>
                <Input placeholder="简洁描述您的提案" />
              </Form.Item>
              <Form.Item label="提案类型" name="type" rules={[{ required: true, message: '请选择提案类型' }]}>
                <Select placeholder="选择提案类型">
                  <Option value="upgrade">合约升级</Option>
                  <Option value="feature">新功能</Option>
                  <Option value="parameter">参数调整</Option>
                  <Option value="treasury">资金管理</Option>
                </Select>
              </Form.Item>
              <Form.Item label="提案描述" name="description" rules={[{ required: true, message: '请输入提案描述' }]}>
                <Input.TextArea rows={4} placeholder="详细描述提案内容、目的和预期效果" />
              </Form.Item>
              <Form.Item label="投票截止时间" name="endTime">
                <Input placeholder="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}