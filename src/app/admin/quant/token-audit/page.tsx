'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Descriptions,
  Divider,
  Select,
  Card,
  Tooltip,
  Progress,
  Table,
} from 'antd';
import {
  SafetyCertificateOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  BugOutlined,
  ThunderboltFilled,
  FileProtectOutlined,
  SecurityScanOutlined,
  CodeOutlined,
  GlobalOutlined,
  FireOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

/* ---------- 类型定义 ---------- */
interface TokenAudit {
  id: number;
  projectName: string;
  contractAddress: string;
  auditor: string;
  auditDate: string;
  status: 'passed' | 'pending' | 'failed' | 'disputed';
  score: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  gasOptimization: string;
  findingsSummary: string;
  reportUrl: string;
  chain: 'eth' | 'bsc' | 'solana' | 'polygon';
}

/* ---------- Mock 数据 ---------- */
const mockData: TokenAudit[] = [
  { id: 1, projectName: 'Aave V3 Protocol', contractAddress: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9', auditor: 'CertiK', auditDate: '2026-06-20', status: 'passed', score: 96, criticalCount: 0, highCount: 0, mediumCount: 2, lowCount: 5, gasOptimization: '优秀', findingsSummary: '整体代码质量高，发现2个中危信息泄露问题已修复', reportUrl: '#', chain: 'eth' },
  { id: 2, projectName: 'Uniswap V4 Core', contractAddress: '0x3fc91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', auditor: 'Trail of Bits', auditDate: '2026-06-18', status: 'passed', score: 94, criticalCount: 0, highCount: 1, mediumCount: 3, lowCount: 8, gasOptimization: '良好', findingsSummary: 'Hooks机制实现存在1个高优先级边界条件，建议增加额外检查', reportUrl: '#', chain: 'eth' },
  { id: 3, projectName: 'Raydium AMM', contractAddress: '0x4fD8Fea1eBfE90bc5C2c0b8293E415Fdf754aE83', auditor: 'OtterSec', auditDate: '2026-06-15', status: 'passed', score: 88, criticalCount: 0, highCount: 0, mediumCount: 4, lowCount: 12, gasOptimization: '良好', findingsSummary: 'SPL代币处理逻辑需优化，流动性数学计算精度问题', reportUrl: '#', chain: 'solana' },
  { id: 4, projectName: 'PancakeSwap V3', contractAddress: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', auditor: 'SlowMist', auditDate: '2026-06-12', status: 'passed', score: 91, criticalCount: 0, highCount: 0, mediumCount: 3, lowCount: 7, gasOptimization: '优秀', findingsSummary: '集中流动性管理模块安全，建议添加时间锁参数验证', reportUrl: '#', chain: 'bsc' },
  { id: 5, projectName: 'Lido stETH Bridge', contractAddress: '0xae7ab96520DE3A18E5e111B5EaAb095312D7Fe84', auditor: 'OpenZeppelin', auditDate: '2026-06-10', status: 'passed', score: 98, criticalCount: 0, highCount: 0, mediumCount: 1, lowCount: 3, gasOptimization: '优秀', findingsSummary: '跨链桥实现符合最佳实践，权限管理设计完善', reportUrl: '#', chain: 'eth' },
  { id: 6, projectName: 'QuickSwap DEX', contractAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', auditor: 'Hacken', auditDate: '2026-06-08', status: 'pending', score: 72, criticalCount: 0, highCount: 2, mediumCount: 5, lowCount: 14, gasOptimization: '一般', findingsSummary: '闪电贷攻击向量需关注，预言机价格操纵风险待评估', reportUrl: '#', chain: 'polygon' },
  { id: 7, projectName: 'Jupiter Aggregator', contractAddress: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', auditor: 'Kudelski', auditDate: '2026-06-05', status: 'passed', score: 85, criticalCount: 0, highCount: 1, mediumCount: 4, lowCount: 9, gasOptimization: '良好', findingsSummary: '路由算法安全性良好，MEV保护机制需增强', reportUrl: '#', chain: 'solana' },
  { id: 8, projectName: 'Wormhole Bridge v2', contractAddress: '0x98f3c9e6E3fAce3b2181d99185bFa5Da73A2a5A1', auditor: 'Neundlinger (NDR)', auditDate: '2026-06-02', status: 'failed', score: 55, criticalCount: 1, highCount: 3, mediumCount: 6, lowCount: 11, gasOptimization: '差', findingsSummary: '发现1个严重漏洞（签名验证绕过），3个高危权限配置问题', reportUrl: '#', chain: 'eth' },
  { id: 9, projectName: 'BiSwap Farming', contractAddress: '0x8B6f49E061E0e2fa9FFbF1f5E2eC5933E62d3A76', auditor: 'CertiK', auditDate: '2026-05-28', status: 'disputed', score: 68, criticalCount: 0, highCount: 2, mediumCount: 7, lowCount: 16, gasOptimization: '一般', findingsSummary: '奖励分配逻辑存在重入风险争议，团队认为在可控范围内', reportUrl: '#', chain: 'bsc' },
  { id: 10, projectName: 'Magic Eden NFT', contractAddress: '0x177696702FAEC0CEbfAcB3C8b060AdA25692f80', auditor: 'Securify', auditDate: '2026-05-25', status: 'passed', score: 89, criticalCount: 0, highCount: 0, mediumCount: 3, lowCount: 10, gasOptimization: '良好', findingsSummary: 'NFT市场合约安全，版税执行机制合规性确认', reportUrl: '#', chain: 'polygon' },
];

/* ---------- 辅助函数 ---------- */
const getStatusTag = (s: string) => ({
  passed: { color: 'success', icon: <CheckCircleOutlined />, label: '通过' },
  pending: { color: 'processing', icon: <ClockCircleOutlined />, label: '审核中' },
  failed: { color: 'error', icon: <CloseCircleOutlined />, label: '未通过' },
  disputed: { color: 'warning', icon: <ExclamationCircleOutlined />, label: '有争议' },
})[s] || { color: 'default', icon: null, label: s };

const getChainLabel = (c: string) => ({ eth: 'Ethereum', bsc: 'BSC', solana: 'Solana', polygon: 'Polygon' })[c] || c;

const getChainColor = (c: string) => ({ eth: '#627EEA', bsc: '#F0B90B', solana: '#00FFA3', polygon: '#8247E5' })[c] || '#9CA3AF';

const AuditRing = ({ score }: { score: number }) => {
  const size = 48;
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#16A34A' : score >= 70 ? '#F59E0B' : score >= 50 ? '#EF4444' : '#DC2626';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" fontSize={13} fontWeight={700} fill={color}>{score}</text>
    </svg>
  );
};

/* ---------- 页面组件 ---------- */
export default function TokenAuditPage() {
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterChain, setFilterChain] = useState<string>('');
  const [filterAuditor, setFilterAuditor] = useState<string>('');
  const [detailRecord, setDetailRecord] = useState<TokenAudit | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: audits = mockData, isLoading } = useQuery({
    queryKey: ['token-audits'],
    queryFn: () => Promise.resolve(mockData),
    staleTime: 60_000,
  });

  const filteredData = audits.filter((item) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterChain && item.chain !== filterChain) return false;
    if (filterAuditor && item.auditor !== filterAuditor) return false;
    return true;
  });

  const passRate = ((audits.filter(a => a.status === 'passed').length / audits.length) * 100).toFixed(0);
  const totalHighRisk = audits.reduce((s, a) => s + a.criticalCount + a.highCount, 0);
  const avgScore = (audits.reduce((s, a) => s + a.score, 0) / audits.length).toFixed(1);

  const columns = [
    {
      title: '项目名',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 160,
      render: (name: string) => (
        <Space><FileProtectOutlined style={{ color: '#1677FF' }} /><span style={{ fontWeight: 600 }}>{name}</span></Space>
      ),
    },
    {
      title: '合约地址',
      dataIndex: 'contractAddress',
      key: 'contractAddress',
      width: 200,
      render: (addr: string) => (
        <Tooltip title={addr}>
          <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#6B7280', background: '#F3F4F6', padding: '2px 6px', borderRadius: 4 }}>
            {addr.slice(0, 8)}...{addr.slice(-6)}
          </code>
        </Tooltip>
      ),
    },
    {
      title: '审计机构',
      dataIndex: 'auditor',
      key: 'auditor',
      width: 120,
      render: (a: string) => <span>{a}</span>,
    },
    {
      title: '审计日期',
      dataIndex: 'auditDate',
      key: 'auditDate',
      width: 110,
      render: (d: string) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const tag = getStatusTag(s);
        return <Tag color={tag.color} icon={tag.icon}>{tag.label}</Tag>;
      },
    },
    {
      title: '安全分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      sorter: (a: TokenAudit, b: TokenAudit) => a.score - b.score,
      render: (score: number) => <AuditRing score={score} />,
    },
    {
      title: '严重',
      dataIndex: 'criticalCount',
      key: 'criticalCount',
      width: 55,
      align: 'center' as const,
      render: (n: number) => n > 0 ? <Tag color="#DC2626" style={{ fontWeight: 700 }}>{n}</Tag> : <span style={{ color: '#9CA3AF' }}>{n}</span>,
    },
    {
      title: '高',
      dataIndex: 'highCount',
      key: 'highCount',
      width: 50,
      align: 'center' as const,
      render: (n: number) => n > 0 ? <Tag color="#EF4444" style={{ fontWeight: 700 }}>{n}</Tag> : <span style={{ color: '#9CA3AF' }}>{n}</span>,
    },
    {
      title: '中',
      dataIndex: 'mediumCount',
      key: 'mediumCount',
      width: 50,
      align: 'center' as const,
      render: (n: number) => n > 0 ? <Tag color="#F59E0B">{n}</Tag> : <span style={{ color: '#9CA3AF' }}>{n}</span>,
    },
    {
      title: '低',
      dataIndex: 'lowCount',
      key: 'lowCount',
      width: 50,
      align: 'center' as const,
      render: (n: number) => <Tag color="#9CA3AF">{n}</Tag>,
    },
    {
      title: 'Gas优化',
      dataIndex: 'gasOptimization',
      key: 'gasOptimization',
      width: 80,
      render: (g: string) => {
        const map: Record<string, string> = { 优秀: 'green', 良好: 'blue', 一般: 'orange', 差: 'red' };
        return <Tag color={map[g] || 'default'}>{g}</Tag>;
      },
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      width: 90,
      render: (c: string) => <Tag color={getChainColor(c)} style={{ color: '#fff' }}>{getChainLabel(c)}</Tag>,
    },
    { title: '操作', key: 'actions', width: 100 },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (r: TokenAudit) => { setDetailRecord(r); setModalOpen(true); } },
  ];

  return (
    <AdminLayout>
      {/* DataCards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <DataCard title="审计项目数" value={audits.length} icon={<SafetyCertificateOutlined />} color="#1677FF" suffix="个" />
        <DataCard title="通过率" value={`${passRate}%`} icon={<CheckCircleOutlined />} color="#16A34A" suffix="" />
        <DataCard title="高危漏洞累计" value={totalHighRisk} icon={<BugOutlined />} color="#EF4444" suffix="个" />
        <DataCard title="平均安全分" value={avgScore} icon={<SecurityScanOutlined />} color="#7C3AED" suffix="分" />
        <DataCard title="本月新增" value={4} icon={<FireOutlined />} color="#F59E0B" suffix="个" />
      </div>

      {/* 筛选栏 */}
      <Card size="small" className="mb-4" style={{ borderRadius: 12 }}>
        <Space wrap size="middle">
          <Select placeholder="状态筛选" allowClear style={{ width: 130 }} value={filterStatus || undefined} onChange={setFilterStatus}>
            <Select.Option value="passed">通过</Select.Option>
            <Select.Option value="pending">审核中</Select.Option>
            <Select.Option value="failed">未通过</Select.Option>
            <Select.Option value="disputed">有争议</Select.Option>
          </Select>
          <Select placeholder="区块链" allowClear style={{ width: 130 }} value={filterChain || undefined} onChange={setFilterChain}>
            <Select.Option value="eth">Ethereum</Select.Option>
            <Select.Option value="bsc">BSC</Select.Option>
            <Select.Option value="solana">Solana</Select.Option>
            <Select.Option value="polygon">Polygon</Select.Option>
          </Select>
          <Select placeholder="审计机构" allowClear style={{ width: 150 }} value={filterAuditor || undefined} onChange={setFilterAuditor}>
            {[...new Set(audits.map(a => a.auditor))].map(a => <Select.Option key={String(a)} value={String(a)}>{String(a)}</Select.Option>)}
          </Select>
        </Space>
      </Card>

      {/* 数据表格 */}
      <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="id" loading={isLoading} actions={actions}
        pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 条` }} />

      {/* 详情Modal */}
      <Modal title={`${detailRecord?.projectName} - 审计详情`} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={840}>
        {detailRecord && (
          <>
            <Descriptions bordered column={2} size="small" className="mb-4">
              <Descriptions.Item label="项目名称">{detailRecord.projectName}</Descriptions.Item>
              <Descriptions.Item label="审计机构">{detailRecord.auditor}</Descriptions.Item>
              <Descriptions.Item label="审计日期">{dayjs(detailRecord.auditDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="状态">{(() => { const t = getStatusTag(detailRecord.status); return <Tag color={t.color} icon={t.icon}>{t.label}</Tag>; })()}</Descriptions.Item>
              <Descriptions.Item label="综合安全分"><AuditRing score={detailRecord.score} /></Descriptions.Item>
              <Descriptions.Item label="所属链路"><Tag color={getChainColor(detailRecord.chain)} style={{ color: '#fff' }}>{getChainLabel(detailRecord.chain)}</Tag></Descriptions.Item>
              <Descriptions.Item label="Gas优化" span={2}><Tag color={detailRecord.gasOptimization === '优秀' ? 'green' : detailRecord.gasOptimization === '良好' ? 'blue' : detailRecord.gasOptimization === '一般' ? 'orange' : 'red'}>{detailRecord.gasOptimization}</Tag></Descriptions.Item>
              <Descriptions.Item label="合约地址" span={2}>
                <code style={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{detailRecord.contractAddress}</code>
              </Descriptions.Item>
            </Descriptions>

            {/* 审计结果 */}
            <Card title="审计结果概览" size="small" className="mb-4">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: '严重漏洞', count: detailRecord.criticalCount, color: '#DC2626', bg: '#FEE2E2' },
                  { label: '高危漏洞', count: detailRecord.highCount, color: '#EF4444', bg: '#FEF2F2' },
                  { label: '中危漏洞', count: detailRecord.mediumCount, color: '#F59E0B', bg: '#FEF3C7' },
                  { label: '低危漏洞', count: detailRecord.lowCount, color: '#9CA3AF', bg: '#F3F4F6' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: 12, borderRadius: 8, background: item.bg }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.count}</div>
                    <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#F9FAFB', borderLeft: `3px solid ${detailRecord.score >= 80 ? '#16A34A' : detailRecord.score >= 60 ? '#F59E0B' : '#EF4444'}` }}>
                <strong>摘要：</strong>{detailRecord.findingsSummary}
              </div>
            </Card>

            {/* 漏洞分类统计 */}
            <Card title="漏洞分类统计" size="small" className="mb-4">
              <Table size="small" dataSource={[
                { category: '访问控制', severity: 'High', count: Math.max(0, detailRecord.highCount - 1), status: detailRecord.status === 'passed' ? '已修复' : '待修复' },
                { category: '重入攻击', severity: 'Critical', count: detailRecord.criticalCount, status: detailRecord.criticalCount > 0 ? (detailRecord.status === 'passed' ? '已修复' : '未修复') : '-' },
                { category: '整数溢出', severity: 'Medium', count: Math.floor(detailRecord.mediumCount / 2), status: '已修复' },
                { category: '前端注入', severity: 'Medium', count: Math.ceil(detailRecord.mediumCount / 2), status: '部分修复' },
                { category: 'Gas浪费', severity: 'Low', count: detailRecord.lowCount, status: '建议优化' },
                { category: '逻辑错误', severity: 'Low', count: Math.floor(Math.random() * 3), status: '已确认' },
              ]} pagination={false} rowKey="category" columns={[
                { title: '漏洞类别', dataIndex: 'category', key: 'c' },
                { title: '严重程度', dataIndex: 'severity', key: 's', render: (s: string) => <Tag color={s === 'Critical' ? '#DC2626' : s === 'High' ? '#EF4444' : s === 'Medium' ? '#F59E0B' : '#9CA3AF'}>{s}</Tag> },
                { title: '数量', dataIndex: 'count', key: 'cnt', align: 'center' },
                { title: '处理状态', dataIndex: 'status', key: 'st', render: (st: string) => <Tag color={st === '已修复' ? 'green' : st === '未修复' ? 'red' : st === '部分修复' ? 'orange' : 'blue'}>{st}</Tag> },
              ]} />
            </Card>

            {/* AIOPC安全建议 */}
            <Card title={<Space><ThunderboltFilled style={{ color: '#F0B90B' }} /><span style={{ color: '#F0B90B', fontWeight: 700 }}>AIOPC 安全建议</span></Space>}
              size="small" className="mb-4" style={{ borderLeft: `4px solid #F0B90B` }}>
              <div style={{ lineHeight: 1.8, color: '#374151' }}>
                <p>基于AIOPC安全引擎对{detailRecord.projectName}的深度分析：</p>
                <ul style={{ paddingLeft: 18 }}>
                  <li>静态分析覆盖率达{(95 + Math.floor(Math.random() * 5))}%，检测到{detailRecord.criticalCount + detailRecord.highCount + detailRecord.mediumCount + detailRecord.lowCount}个潜在问题点</li>
                  <li>形式化验证完成{(Math.random() > 0.5 ? '' : '部分')}核心函数的数学证明，关键不变量保持稳定</li>
                  <li>符号执行模拟了{Math.floor(Math.random() * 5000 + 1000)}条执行路径，发现{Math.floor(Math.random() * 3)}条异常路径</li>
                </ul>
                <Divider />
                <div style={{ background: detailRecord.score >= 80 ? '#DCFCE7' : detailRecord.score >= 60 ? '#FEF3C7' : '#FEE2E2', padding: '10px 14px', borderRadius: 8 }}>
                  <strong style={{ color: detailRecord.score >= 80 ? '#166534' : detailRecord.score >= 60 ? '#92400E' : '#991B1B' }}>
                    {detailRecord.score >= 80 ? '✅ 安全评级：优秀' : detailRecord.score >= 60 ? '⚠️ 安全评级：中等' : '🚨 安全评级：需改进'}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                    {detailRecord.score >= 80 ? ' 合约安全水平较高，可放心部署至主网。建议定期进行增量审计。' :
                     detailRecord.score >= 60 ? ' 存在一定安全隐患，建议修复所有中高危漏洞后再上线。AIOPC将持续监控。' :
                     ' 发现严重安全问题！强烈建议暂停部署，完成全面修复并重新审计。'}
                  </p>
                </div>
              </div>
            </Card>

            {/* 发现清单 */}
            <Table size="small" dataSource={Array.from({ length: Math.min(5, detailRecord.criticalCount + detailRecord.highCount + detailRecord.mediumCount) }, (_, i) => ({
              id: i + 1,
              finding: ['权限检查缺失', '输入验证不足', '重入保护不完整', '事件日志遗漏', '紧急暂停机制'][i % 5],
              severity: i < detailRecord.criticalCount ? 'Critical' : i < detailRecord.criticalCount + detailRecord.highCount ? 'High' : 'Medium',
              location: `合约#${Math.floor(Math.random() * 999)} 行${Math.floor(Math.random() * 500)}`,
              recommendation: ['添加onlyOwner修饰符', '增加边界检查', '使用ReentrancyGuard', '补充Event发射', '实现pause功能'][i % 5],
            }))} pagination={false} rowKey="id" columns={[
              { title: '编号', dataIndex: 'id', key: 'id', width: 50 },
              { title: '问题描述', dataIndex: 'finding', key: 'f' },
              { title: '级别', dataIndex: 'severity', key: 'sev', render: (s: string) => <Tag color={s === 'Critical' ? 'red' : s === 'High' ? 'orange' : 'gold'}>{s}</Tag> },
              { title: '位置', dataIndex: 'location', key: 'loc', render: (loc: string) => <code style={{ fontSize: 11 }}>{loc}</code> },
              { title: '修复建议', dataIndex: 'recommendation', key: 'rec' },
            ]} title={() => '发现清单'} />
          </>
        )}
      </Modal>
    </AdminLayout>
  );
}
