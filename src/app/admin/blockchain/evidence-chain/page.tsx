﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';
import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Row, Col, Card, Table, Tag, Button, Space, Modal, Form, Input, Select, Upload, Descriptions, Statistic, Badge, Progress, message, Tooltip, Typography, Alert, Steps, Divider, Popconfirm,
} from 'antd';
import {
  LinkOutlined, CloudUploadOutlined, EyeOutlined, DeleteOutlined, SearchOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined, SyncOutlined, FileTextOutlined, SafetyCertificateOutlined, BlockOutlined, CopyOutlined, DownloadOutlined, QrcodeOutlined, InboxOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 存证记录模拟数据
const mockEvidenceRecords = [
  {
    id: 'EV-2024060801', hash: '0x7f9e3d2a1b8c4f6e5d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7',
    dataType: '交易记录', txHash: '0xabc123...def456', blockHeight: 18954210, chainStatus: 'confirmed', timestamp: '2024-06-08 09:30:15',
    dataSize: '2.4KB', submitter: '系统自动', originalData: '{"txId":"TX-001","amount":1500,"currency":"USDT","from":"0xUserA","to":"0xPool"}',
  },
  {
    id: 'EV-2024060802', hash: '0xa1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890',
    dataType: 'KYC文档', txHash: '0xghi789...jkl012', blockHeight: 18954205, chainStatus: 'confirmed', timestamp: '2024-06-08 08:15:42',
    dataSize: '156KB', submitter: '合规部门', originalData: '{"docType":"passport","userId":"U-12345","hash":"sha256:abc...","verified":true}',
  },
  {
    id: 'EV-2024060803', hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    dataType: '审计日志', txHash: '0xmno345...pqr678', blockHeight: 18954198, chainStatus: 'pending', timestamp: '2024-06-08 07:00:00',
    dataSize: '8.7KB', submitter: '审计系统', originalData: '{"auditId":"AUD-2024-0608","actions":["login","trade","withdraw"],"adminId":"admin@zsdt.com"}',
  },
  {
    id: 'EV-2024060804', hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    dataType: '智能合约代码', txHash: '0xstu901...vwx234', blockHeight: 18954190, chainStatus: 'confirmed', timestamp: '2024-06-07 22:30:10',
    dataSize: '45KB', submitter: '开发团队', originalData: '{"contractName":"TokenSwapDEX","version":"v2.3.1","compiler":"solc0.8.19"}',
  },
  {
    id: 'EV-2024060805', hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    dataType: 'NFT元数据', txHash: '0xyz567...abc890', blockHeight: 18954182, chainStatus: 'confirmed', timestamp: '2024-06-07 18:45:33',
    dataSize: '12KB', submitter: 'NFT平台', originalData: '{"tokenId":"#12847","name":"山水国画·春晓","creator":"艺术家张三","royalty":"5%"}',
  },
  {
    id: 'EV-2024060806', hash: '0xaa11bb22cc33dd44ee55ff66aa11bb22cc33dd44ee55ff66aa11bb22cc33dd',
    dataType: '用户协议', txHash: '0xdef111...ghi222', blockHeight: 18954170, chainStatus: 'confirmed', timestamp: '2024-06-07 14:20:00',
    dataSize: '3.2KB', submitter: '法务部', originalData: '{"agreementType":"服务条款","version":"v5.2","effectiveDate":"2024-06-01"}',
  },
  {
    id: 'EV-2024060807', hash: '0xbb33cc44dd55ee66ff77aa88bb33cc44dd55ee66ff77aa88bb33cc44dd55ee',
    dataType: '风控报告', txHash: '-', blockHeight: '-', chainStatus: 'processing', timestamp: '2024-06-08 10:05:22',
    dataSize: '28KB', submitter: 'AI风控引擎', originalData: '{"reportId":"RISK-0608","riskLevel":"medium","score":68,"recommendations":["increase_liquidity"]}',
  },
  {
    id: 'EV-2024060808', hash: '0xcc44dd55ee66ff77aa88bb99cc44dd55ee66ff77aa88bb99cc44dd55ee66ff',
    dataType: '财务报表', txHash: '0xjkl333...mno444', blockHeight: 18954155, chainStatus: 'confirmed', timestamp: '2024-06-07 10:00:00',
    dataSize: '95KB', submitter: '财务部', originalData: '{"period":"Q2-2024","revenue":"$12.5M","profit":"$2.1M","assets":"$56.8M"}',
  },
];

// 存证统计数据
const evidenceStatsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['交易记录', 'KYC文档', '审计日志', '合约代码', '其他'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '存证数量' },
  series: [
    { name: '交易记录', type: 'bar', stack: 'total', data: [45, 52, 48, 61, 55, 38, 42], itemStyle: { color: '#1677FF' } },
    { name: 'KYC文档', type: 'bar', stack: 'total', data: [12, 15, 18, 14, 20, 8, 10], itemStyle: { color: '#16A34A' } },
    { name: '审计日志', type: 'bar', stack: 'total', data: [25, 22, 28, 30, 26, 15, 20], itemStyle: { color: '#F59E0B' } },
    { name: '合约代码', type: 'bar', stack: 'total', data: [3, 1, 2, 4, 2, 0, 1], itemStyle: { color: '#7C3AED' } },
    { name: '其他', type: 'bar', stack: 'total', data: [8, 10, 6, 9, 12, 5, 7], itemStyle: { color: '#06B6D4' } },
  ],
};

export default function EvidenceChainPage() {
  const queryClient = useQueryClient();
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { data: records, isLoading } = useQuery({
    queryKey: ['evidence-chain-records'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockEvidenceRecords;
    },
  });

  // 删除存证
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await new Promise(r => setTimeout(r, 400)); return id; },
    onSuccess: () => { message.success('存证记录已删除'); queryClient.invalidateQueries({ queryKey: ['evidence-chain-records'] }); },
  });

  // 数据类型颜色映射
  const getDataTypeTag = (type: string) => {
    const map: Record<string, string> = { '交易记录': 'blue', 'KYC文档': 'green', '审计日志': 'gold', '智能合约代码': 'purple', 'NFT元数据': 'magenta', '用户协议': 'cyan', '风控报告': 'orange', '财务报表': 'geekblue' };
    return <Tag color={map[type] || 'default'}>{type}</Tag>;
  };

  // 链上状态映射
  const getChainStatus = (status: string) => {
    const map: Record<string, { color: string; text: string }> = { confirmed: { color: 'success', text: '已确认' }, pending: { color: 'warning', text: '待确认' }, processing: { color: 'processing', text: '上链中' }, failed: { color: 'error', text: '失败' } };
    const s = map[status]; return s ? <Badge status={s.color as any} text={s.text} /> : status;
  };

  const columns = [
    {
      title: '存证ID',
      dataIndex: 'id',
      key: 'id',
      width: 160,
      render: (text: string) => <span className="font-mono text-blue-600 font-medium text-sm">{text}</span>,
    },
    {
      title: '数据哈希',
      dataIndex: 'hash',
      key: 'hash',
      width: 200,
      render: (hash: string) => (
        <Tooltip title={hash}>
          <code className="text-xs bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-gray-200" onClick={() => { navigator.clipboard?.writeText(hash); message.success('哈希已复制'); }}>
            {hash.slice(0, 10)}...{hash.slice(-8)}
          </code>
        </Tooltip>
      ),
    },
    { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 120, render: (type: string) => getDataTypeTag(type) },
    { title: '区块高度', dataIndex: 'blockHeight', key: 'blockHeight', width: 110, render: (h: string) => h !== '-' ? <span className="font-mono">{Number(h).toLocaleString()}</span> : <span className="text-gray-300">-</span> },
    { title: '链上状态', dataIndex: 'chainStatus', key: 'chainStatus', width: 100, render: (status: string) => getChainStatus(status) },
    { title: '提交人', dataIndex: 'submitter', key: 'submitter', width: 100 },
    { title: '存证时间', dataIndex: 'timestamp', key: 'timestamp', width: 170 },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedEvidence(record); setDetailModalVisible(true); } },
    { key: 'verify', label: '链上验证', icon: <SafetyCertificateOutlined />, onClick: (_: any, record: any) => { if (record.chainStatus === 'confirmed') message.success(`✅ 哈希验证通过！数据完整可信`); else message.info('该记录尚未完成上链确认'); } },
    {
      key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true,
      confirm: { title: '确定删除此存证记录吗？', description: '链上数据不可删除，仅移除本地索引记录', onConfirm: (record: any) => deleteMutation.mutate(record.id) },
    },
  ];

  const handleCreateEvidence = async () => {
    try {
      await form.validateFields();
      message.success('数据已提交存证，预计30秒内完成上链');
      setCreateModalVisible(false);
      form.resetFields();
    } catch (e) { logger.error(e); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <LinkOutlined className="text-2xl text-cyan-600" />
          <h1 className="text-2xl font-bold m-0">存证链管理</h1>
          <Badge count="PoA共识" style={{ backgroundColor: '#06B6D4' }} />
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm"><Statistic title="总存证数" value={15842} prefix={<BlockOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm"><Statistic title="今日新增" value={28} prefix={<CloudUploadOutlined />} valueStyle={{ color: '#16A34A' }} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm"><Statistic title="待确认" value={mockEvidenceRecords.filter(r => r.chainStatus !== 'confirmed').length} valueStyle={{ color: '#F59E0B' }} prefix={<ClockCircleOutlined />} /></Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm"><Statistic title="最新区块" value={18954210} prefix={<QrcodeOutlined />} valueStyle={{ color: '#1677FF' }} /></Card>
          </Col>
        </Row>

        {/* 存证趋势图 */}
        <Card title="存证统计（按类型/按日期）" className="shadow-sm">
          <SafeECharts option={evidenceStatsOption} style={{ height: 340 }} title="存证统计图表" />
        </Card>

        {/* 存证记录列表 */}
        <DataTable
          columns={columns}
          dataSource={records || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索存证ID或哈希"
          showFilter
          filterOptions={[
            { label: '全部类型', value: '' },
            { label: '交易记录', value: '交易记录' },
            { label: 'KYC文档', value: 'KYC文档' },
            { label: '审计日志', value: '审计日志' },
            { label: '合约代码', value: '智能合约代码' },
            { label: '其他', value: 'other' },
          ]}
          actions={actions as any[]}
          showAdd
          addButtonText="新增存证"
          onAdd={() => setCreateModalVisible(true)}
          rowKey="id"
          pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 条存证记录` }}
        />

        {/* 存证明细弹窗 */}
        <Modal title={`存证明细 - ${selectedEvidence?.id}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={750} footer={
          <Space>
            <Button icon={<CopyOutlined />} onClick={() => { navigator.clipboard?.writeText(selectedEvidence?.hash || ''); message.success('哈希已复制到剪贴板'); }}>复制哈希</Button>
            <Button icon={<DownloadOutlined />}>导出证书</Button>
            <Button type="primary" icon={<SafetyCertificateOutlined />}>链上验证</Button>
          </Space>
        }>
          {selectedEvidence && (
            <div className="space-y-4">
              <Alert type="info" showIcon message="存证信息" description="以下数据已在区块链上永久存证，具有不可篡改的法律效力。" />

              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="存证ID"><Text strong className="text-blue-600">{selectedEvidence.id}</Text></Descriptions.Item>
                <Descriptions.Item label="数据类型">{getDataTypeTag(selectedEvidence.dataType)}</Descriptions.Item>
                <Descriptions.Item label="链上状态">{getChainStatus(selectedEvidence.chainStatus)}</Descriptions.Item>
                <Descriptions.Item label="区块高度">{selectedEvidence.blockHeight !== '-' ? Number(selectedEvidence.blockHeight).toLocaleString() : '-'}</Descriptions.Item>
                <Descriptions.Item label="交易哈希">
                  {selectedEvidence.txHash !== '-' ? (
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedEvidence.txHash}</code>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="数据大小">{selectedEvidence.dataSize}</Descriptions.Item>
                <Descriptions.Item label="提交人">{selectedEvidence.submitter}</Descriptions.Item>
                <Descriptions.Item label="存证时间">{selectedEvidence.timestamp}</Descriptions.Item>
                <Descriptions.Item label="数据哈希" span={2}>
                  <div className="flex items-center gap-2">
                    <code className="text-xs break-all bg-gray-50 p-2 rounded flex-1 font-mono">{selectedEvidence.hash}</code>
                    <Button size="small" icon={<CopyOutlined />} onClick={() => { navigator.clipboard?.writeText(selectedEvidence.hash); message.success('已复制'); }} />
                  </div>
                </Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">原始数据预览</Divider>
              <Card size="small">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto m-0">{JSON.stringify(JSON.parse(selectedEvidence.originalData), null, 2)}</pre>
              </Card>

              <Card size="small" title="上链确认流程">
                <Steps
                  current={selectedEvidence.chainStatus === 'confirmed' ? 3 : selectedEvidence.chainStatus === 'pending' ? 2 : selectedEvidence.chainStatus === 'processing' ? 1 : 0}
                  size="small"
                  items={[
                    { title: '数据接收', description: selectedEvidence.timestamp },
                    { title: '哈希计算', description: 'SHA-256' },
                    { title: '等待打包', description: selectedEvidence.blockHeight !== '-' ? `目标区块 ${Number(selectedEvidence.blockHeight).toLocaleString()}` : '排队中' },
                    { title: '链上确认', description: selectedEvidence.chainStatus === 'confirmed' ? '已确认 ✅' : '待确认' },
                  ]}
                />
              </Card>
            </div>
          )}
        </Modal>

        {/* 新增存证弹窗 */}
        <Modal title="新增数据存证" open={createModalVisible} onOk={handleCreateEvidence} onCancel={() => setCreateModalVisible(false)} okText="提交存证" cancelText="取消" width={650}>
          <Alert type="info" showIcon className="mb-4" message="存证说明" description="提交的数据将计算SHA-256哈希并写入区块链存证合约，确保数据的不可篡改性。" />
          <Form form={form} layout="vertical" className="mt-2">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="数据类型" name="dataType" rules={[{ required: true }]}>
                  <Select options={[
                    { label: '交易记录', value: '交易记录' }, { label: 'KYC文档', value: 'KYC文档' }, { label: '审计日志', value: '审计日志' },
                    { label: '智能合约代码', value: '智能合约代码' }, { label: 'NFT元数据', value: 'NFT元数据' },
                    { label: '风控报告', value: '风控报告' }, { label: '财务报表', value: '财务报表' }, { label: '其他', value: '其他' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="提交人标识" name="submitter" initialValue="管理员">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="上传数据文件" name="file">
              <Upload.Dragger maxCount={1} accept=".json,.txt,.pdf,.csv">
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">点击或拖拽上传数据文件</p>
                <p className="ant-upload-hint">支持 JSON/TXT/PDF/CSV 格式，最大 10MB</p>
              </Upload.Dragger>
            </Form.Item>
            <Form.Item label="或直接粘贴数据内容（JSON格式）" name="rawData">
              <Input.TextArea rows={5} placeholder='{"key": "value", ...}' />
            </Form.Item>
            <Form.Item label="备注说明" name="remark">
              <Input.TextArea rows={2} placeholder="可选：描述此次存证的用途和背景" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
