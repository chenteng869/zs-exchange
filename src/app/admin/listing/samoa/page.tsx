'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Steps,
  Table,
  Tooltip,
  Card,
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  UploadOutlined,
  HistoryOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BankOutlined,
  FormOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  DownloadOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  StarOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';

import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

// ==================== 类型定义 ====================

interface SamoaApplication {
  id: string;
  applicationNo: string;
  companyName: string;
  legalRepresentative: string;
  registrationCountry: string;
  tickerSymbol: string | null;
  listingType: 'ipo' | 'spac' | 'rto' | 'direct';
  status:
    | 'draft'
    | 'submitted'
    | 'ic_reviewing'
    | 'ic_approved'
    | 'ic_rejected'
    | 'prospectus_review'
    | 'listed'
    | 'rejected';
  prospectusStatus: 'pending' | 'submitted' | 'reviewing' | 'approved' | 'rejected';
  valuationLowUsd: number | null;
  valuationHighUsd: number | null;
  targetRaiseUsd: number | null;
  offerPriceMin: number | null;
  offerPriceMax: number | null;
  sharesOffered: number | null;
  underwriter: string | null;
  lawFirm: string | null;
  auditor: string | null;

  // AI / 量化字段
  aiScore: number | null; // IPO评估W43 100分制
  aiopcScore: number | null; // AIOPC超级合子值
  riskLevel: 'low' | 'medium' | 'high' | 'extreme' | null;
  dcfDiscountRate: number | null;
  dcfTerminalGrowth: number | null;
  monteCarloSimulations: number | null;
  monteCarloPct90: number | null;

  // 时间线
  submittedAt: string | null;
  icReviewedAt: string | null;
  listedAt: string | null;
  createdAt: string;

  // 人员
  createdBy: string;
  icReviewerId: string | null;
  icReviewerName: string | null;
  currentPhase: string;

  // 生态关联ID
  relatedIpoAssessmentId?: string;
  relatedTokenScoreId?: string;
  relatedEnterpriseId?: string;

  // 审计日志
  auditLogs?: AuditLogItem[];
}

interface AuditLogItem {
  id: string;
  createdAt: string;
  operatorName: string;
  actionType: string;
  detail: string;
}

// ==================== 状态映射常量 ====================

const STATUS_MAP: Record<
  SamoaApplication['status'],
  { color: string; text: string }
> = {
  draft: { color: 'default', text: '草稿' },
  submitted: { color: 'blue', text: '已提交' },
  ic_reviewing: { color: 'orange', text: 'IC审核中' },
  ic_approved: { color: 'green', text: 'IC通过' },
  ic_rejected: { color: 'red', text: 'IC驳回' },
  prospectus_review: { color: 'orange', text: '招股书审核' },
  listed: { color: 'geekblue', text: '已上市' },
  rejected: { color: 'red', text: '已终止' },
};

const PROSPECTUS_MAP: Record<
  SamoaApplication['prospectusStatus'],
  { color: string; text: string }
> = {
  pending: { color: 'default', text: '待提交' },
  submitted: { color: 'blue', text: '已提交' },
  reviewing: { color: 'orange', text: '审核中' },
  approved: { color: 'green', text: '已批准' },
  rejected: { color: 'red', text: '已驳回' },
};

const TYPE_MAP: Record<
  SamoaApplication['listingType'],
  { color: string; text: string }
> = {
  ipo: { color: 'blue', text: 'IPO' },
  spac: { color: 'purple', text: 'SPAC' },
  rto: { color: 'orange', text: 'RTO' },
  direct: { color: 'green', text: 'Direct' },
};

const RISK_LEVEL_MAP: Record<
  NonNullable<SamoaApplication['riskLevel']>,
  { color: string; text: string }
> = {
  low: { color: 'green', text: '低' },
  medium: { color: 'orange', text: '中' },
  high: { color: 'red', text: '高' },
  extreme: { color: 'magenta', text: '极端' },
};

// ==================== Mock 数据（15条）====================

const mockApplications: SamoaApplication[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567801',
    applicationNo: 'SAMOA-2026-001',
    companyName: '中萨数字科技集团有限公司',
    legalRepresentative: '张三',
    registrationCountry: 'WS',
    tickerSymbol: 'ZS.T',
    listingType: 'ipo',
    status: 'ic_reviewing',
    prospectusStatus: 'pending',
    valuationLowUsd: 10,
    valuationHighUsd: 50,
    targetRaiseUsd: 20,
    offerPriceMin: 1.0,
    offerPriceMax: 2.5,
    sharesOffered: 20000000,
    underwriter: '高盛(萨摩亚)有限公司',
    lawFirm: '金杜律师事务所',
    auditor: '普华永道',
    aiScore: 82,
    aiopcScore: 87.5,
    riskLevel: 'medium',
    dcfDiscountRate: 8.5,
    dcfTerminalGrowth: 2.0,
    monteCarloSimulations: 10000,
    monteCarloPct90: 45,
    submittedAt: '2026-03-15T10:30:00Z',
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-03-01T08:00:00Z',
    createdBy: 'admin-user-001',
    icReviewerId: 'reviewer-003',
    icReviewerName: '李四(IC委员会)',
    currentPhase: '第二阶段: IC审核',
    relatedIpoAssessmentId: 'ipo-assess-001',
    relatedTokenScoreId: 'token-score-005',
    relatedEnterpriseId: 'enterprise-zs-group',
    auditLogs: [
      { id: 'log-001', createdAt: '2026-03-01T08:00:00Z', operatorName: '系统管理员', actionType: 'samoa.create', detail: '创建上市申请' },
      { id: 'log-002', createdAt: '2026-03-15T10:30:00Z', operatorName: '张三', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-003', createdAt: '2026-03-16T09:00:00Z', operatorName: 'AI评分引擎', actionType: 'ai.score_update', detail: 'AI综合评分更新为82分' },
    ],
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678902',
    applicationNo: 'SAMOA-2026-002',
    companyName: 'AIOPC Protocol Foundation',
    legalRepresentative: 'Sarah Chen',
    registrationCountry: 'SG',
    tickerSymbol: 'AIOPC.S',
    listingType: 'spac',
    status: 'ic_reviewing',
    prospectusStatus: 'pending',
    valuationLowUsd: 20,
    valuationHighUsd: 80,
    targetRaiseUsd: 35,
    offerPriceMin: 5.0,
    offerPriceMax: 12.0,
    sharesOffered: 5000000,
    underwriter: '摩根士丹利(新加坡)',
    lawFirm: 'Allen & Overy',
    auditor: '德勤',
    aiScore: 91,
    aiopcScore: 94.2,
    riskLevel: 'low',
    dcfDiscountRate: 7.8,
    dcfTerminalGrowth: 3.0,
    monteCarloSimulations: 15000,
    monteCarloPct90: 72,
    submittedAt: '2026-04-01T14:00:00Z',
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-03-20T11:00:00Z',
    createdBy: 'admin-user-002',
    icReviewerId: 'reviewer-001',
    icReviewerName: '王五(IC主席)',
    currentPhase: '第二阶段: IC审核',
    relatedIpoAssessmentId: 'ipo-assess-007',
    relatedTokenScoreId: 'token-score-012',
    auditLogs: [
      { id: 'log-010', createdAt: '2026-03-20T11:00:00Z', operatorName: 'Sarah Chen', actionType: 'samoa.create', detail: '创建SPAC申请' },
      { id: 'log-011', createdAt: '2026-04-01T14:00:00Z', operatorName: 'Sarah Chen', actionType: 'samoa.submit', detail: '提交IC审核' },
    ],
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789ab03',
    applicationNo: 'SAMOA-2026-003',
    companyName: '太平洋链上资产管理有限公司',
    legalRepresentative: 'Michael Brown',
    registrationCountry: 'WS',
    tickerSymbol: 'PACIFIC.N',
    listingType: 'rto',
    status: 'ic_approved',
    prospectusStatus: 'pending',
    valuationLowUsd: 5,
    valuationHighUsd: 15,
    targetRaiseUsd: 8,
    offerPriceMin: 0.5,
    offerPriceMax: 1.2,
    sharesOffered: 80000000,
    underwriter: '花旗银行(萨摩亚)',
    lawFirm: 'MinterEllison',
    auditor: '安永',
    aiScore: 65,
    aiopcScore: 72.0,
    riskLevel: 'medium',
    dcfDiscountRate: 9.0,
    dcfTerminalGrowth: 1.5,
    monteCarloSimulations: 5000,
    monteCarloPct90: 18,
    submittedAt: '2026-02-10T09:15:00Z',
    icReviewedAt: '2026-03-05T16:00:00Z',
    listedAt: null,
    createdAt: '2026-02-01T07:30:00Z',
    createdBy: 'admin-user-001',
    icReviewerId: 'reviewer-003',
    icReviewerName: '李四(IC委员会)',
    currentPhase: '第三阶段: 招股书准备',
    relatedIpoAssessmentId: 'ipo-assess-003',
    auditLogs: [
      { id: 'log-020', createdAt: '2026-02-01T07:30:00Z', operatorName: 'Michael Brown', actionType: 'samoa.create', detail: '创建RTO申请' },
      { id: 'log-021', createdAt: '2026-02-10T09:15:00Z', operatorName: 'Michael Brown', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-022', createdAt: '2026-03-05T16:00:00Z', operatorName: '李四(IC委员会)', actionType: 'samoa.ic_approve', detail: 'IC审核通过，进入招股书阶段' },
    ],
  },
  {
    id: 'd4e5f6a7-b8c9-0123-defa-23456789abcd04',
    applicationNo: 'SAMOA-2026-004',
    companyName: '南太平洋数字银行控股公司',
    legalRepresentative: 'Emma Wilson',
    registrationCountry: 'HK',
    tickerSymbol: 'OCEAN.B',
    listingType: 'ipo',
    status: 'prospectus_review',
    prospectusStatus: 'submitted',
    valuationLowUsd: 30,
    valuationHighUsd: 100,
    targetRaiseUsd: 50,
    offerPriceMin: 2.0,
    offerPriceMax: 5.0,
    sharesOffered: 12000000,
    underwriter: '汇丰银行(香港)',
    lawFirm: 'Clifford Chance',
    auditor: '毕马威',
    aiScore: 73,
    aiopcScore: 78.5,
    riskLevel: 'medium',
    dcfDiscountRate: 8.0,
    dcfTerminalGrowth: 2.5,
    monteCarloSimulations: 8000,
    monteCarloPct90: 55,
    submittedAt: '2026-01-20T11:45:00Z',
    icReviewedAt: '2026-02-28T14:30:00Z',
    listedAt: null,
    createdAt: '2026-01-10T06:00:00Z',
    createdBy: 'admin-user-003',
    icReviewerId: 'reviewer-002',
    icReviewerName: '赵六(IC委员)',
    currentPhase: '第三阶段: 招股书审核',
    relatedIpoAssessmentId: 'ipo-assess-010',
    relatedEnterpriseId: 'enterprise-ocean-bank',
    auditLogs: [
      { id: 'log-030', createdAt: '2026-01-10T06:00:00Z', operatorName: 'Emma Wilson', actionType: 'samoa.create', detail: '创建IPO申请' },
      { id: 'log-031', createdAt: '2026-01-20T11:45:00Z', operatorName: 'Emma Wilson', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-032', createdAt: '2026-02-28T14:30:00Z', operatorName: '赵六(IC委员)', actionType: 'samoa.ic_approve', detail: 'IC通过审核' },
      { id: 'log-033', createdAt: '2026-03-10T10:00:00Z', operatorName: 'Emma Wilson', actionType: 'samoa.prospectus_upload', detail: '上传招股书草稿 v1.0' },
    ],
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-3456789abcde05',
    applicationNo: 'SAMOA-2026-005',
    companyName: 'ZS Exchange Holdings Limited',
    legalRepresentative: '刘强东',
    registrationCountry: 'HK',
    tickerSymbol: 'ZSX.HK',
    listingType: 'direct',
    status: 'listed',
    prospectusStatus: 'approved',
    valuationLowUsd: 50,
    valuationHighUsd: 200,
    targetRaiseUsd: 80,
    offerPriceMin: 8.0,
    offerPriceMax: 15.0,
    sharesOffered: 4000000,
    underwriter: '中金国际(香港)',
    lawFirm: '方达律师事务所',
    auditor: '普华永道',
    aiScore: 88,
    aiopcScore: 89.0,
    riskLevel: 'low',
    dcfDiscountRate: 7.5,
    dcfTerminalGrowth: 3.5,
    monteCarloSimulations: 20000,
    monteCarloPct90: 95,
    submittedAt: '2025-11-01T08:00:00Z',
    icReviewedAt: '2025-11-20T13:00:00Z',
    listedAt: '2026-02-01T09:00:00Z',
    createdAt: '2025-10-15T07:00:00Z',
    createdBy: 'admin-user-001',
    icReviewerId: 'reviewer-001',
    icReviewerName: '王五(IC主席)',
    currentPhase: '第五阶段: 正式挂牌',
    relatedIpoAssessmentId: 'ipo-assess-015',
    relatedEnterpriseId: 'enterprise-zsx-holdings',
    auditLogs: [
      { id: 'log-040', createdAt: '2025-10-15T07:00:00Z', operatorName: '刘强东', actionType: 'samoa.create', detail: '创建Direct Listing申请' },
      { id: 'log-041', createdAt: '2025-11-01T08:00:00Z', operatorName: '刘强东', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-042', createdAt: '2025-11-20T13:00:00Z', operatorName: '王五(IC主席)', actionType: 'samoa.ic_approve', detail: 'IC审核通过' },
      { id: 'log-043', createdAt: '2025-12-15T10:00:00Z', operatorName: '中金国际', actionType: 'samoa.prospectus_upload', detail: '提交最终招股书' },
      { id: 'log-044', createdAt: '2026-01-20T11:00:00Z', operatorName: '合规部', actionType: 'samoa.prospectus_approve', detail: '招股书审批通过' },
      { id: 'log-045', createdAt: '2026-02-01T09:00:00Z', operatorName: '交易所运营部', actionType: 'samoa.list', detail: '正式在萨摩亚证券交易所挂牌交易' },
    ],
  },
  {
    id: 'f6a7b8c9-d0e1-2345-fabc-456789abcdef06',
    applicationNo: 'SAMOA-2026-006',
    companyName: '萨摩亚海洋基金合伙企业',
    legalRepresentative: 'David Tauiliili',
    registrationCountry: 'WS',
    tickerSymbol: null,
    listingType: 'ipo',
    status: 'ic_rejected',
    prospectusStatus: 'pending',
    valuationLowUsd: 8,
    valuationHighUsd: 25,
    targetRaiseUsd: 12,
    offerPriceMin: null,
    offerPriceMax: null,
    sharesOffered: null,
    underwriter: null,
    lawFirm: null,
    auditor: null,
    aiScore: 42,
    aiopcScore: 55.0,
    riskLevel: 'high',
    dcfDiscountRate: null,
    dcfTerminalGrowth: null,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: '2026-04-10T16:20:00Z',
    icReviewedAt: '2026-04-25T11:00:00Z',
    listedAt: null,
    createdAt: '2026-04-05T09:00:00Z',
    createdBy: 'admin-user-004',
    icReviewerId: 'reviewer-003',
    icReviewerName: '李四(IC委员会)',
    currentPhase: '已终止',
    auditLogs: [
      { id: 'log-050', createdAt: '2026-04-05T09:00:00Z', operatorName: 'David Tauiliili', actionType: 'samoa.create', detail: '创建IPO申请' },
      { id: 'log-051', createdAt: '2026-04-10T16:20:00Z', operatorName: 'David Tauiliili', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-052', createdAt: '2026-04-25T11:00:00Z', operatorName: '李四(IC委员会)', actionType: 'samoa.ic_reject', detail: 'IC驳回：财务数据不满足披露要求，需补充三年审计报告' },
    ],
  },
  {
    id: 'a7b8c9d0-e1f2-3456-abcd-567890bcdef07',
    applicationNo: 'SAMOA-2026-007',
    companyName: '中萨绿色能源科技有限公司',
    legalRepresentative: '赵明远',
    registrationCountry: 'CN',
    tickerSymbol: null,
    listingType: 'spac',
    status: 'rejected',
    prospectusStatus: 'rejected',
    valuationLowUsd: null,
    valuationHighUsd: null,
    targetRaiseUsd: null,
    offerPriceMin: null,
    offerPriceMax: null,
    sharesOffered: null,
    underwriter: null,
    lawFirm: null,
    auditor: null,
    aiScore: null,
    aiopcScore: null,
    riskLevel: null,
    dcfDiscountRate: null,
    dcfTerminalGrowth: null,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: '2026-03-20T08:45:00Z',
    icReviewedAt: '2026-04-01T10:00:00Z',
    listedAt: null,
    createdAt: '2026-03-15T07:15:00Z',
    createdBy: 'admin-user-002',
    icReviewerId: 'reviewer-002',
    icReviewerName: '赵六(IC委员)',
    currentPhase: '已终止',
    auditLogs: [
      { id: 'log-060', createdAt: '2026-03-15T07:15:00Z', operatorName: '赵明远', actionType: 'samoa.create', detail: '创建SPAC申请' },
      { id: 'log-061', createdAt: '2026-03-20T08:45:00Z', operatorName: '赵明远', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-062', createdAt: '2026-04-01T10:00:00Z', operatorName: '赵六(IC委员)', actionType: 'samoa.ic_reject', detail: 'IC驳回：SPAC架构不符合萨摩亚SE要求' },
      { id: 'log-063', createdAt: '2026-04-05T14:00:00Z', operatorName: '申请人', actionType: 'samoa.reject', detail: '申请人主动撤回' },
    ],
  },
  {
    id: 'b8c9d0e1-f2a3-4567-bcde-678901cdefgh08',
    applicationNo: 'SAMOA-2026-008',
    companyName: 'Web3基础设施开发公司',
    legalRepresentative: 'Alex Kim',
    registrationCountry: 'US',
    tickerSymbol: 'WEB3.S',
    listingType: 'ipo',
    status: 'draft',
    prospectusStatus: 'pending',
    valuationLowUsd: 15,
    valuationHighUsd: 40,
    targetRaiseUsd: 22,
    offerPriceMin: null,
    offerPriceMax: null,
    sharesOffered: null,
    underwriter: null,
    lawFirm: null,
    auditor: null,
    aiScore: 58,
    aiopcScore: 63.0,
    riskLevel: 'medium',
    dcfDiscountRate: 9.5,
    dcfTerminalGrowth: 1.0,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: null,
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-05-01T10:00:00Z',
    createdBy: 'admin-user-005',
    icReviewerId: null,
    icReviewerName: null,
    currentPhase: '第一阶段: 草稿',
    auditLogs: [
      { id: 'log-070', createdAt: '2026-05-01T10:00:00Z', operatorName: 'Alex Kim', actionType: 'samoa.create', detail: '创建IPO申请(草稿)' },
    ],
  },
  {
    id: 'c9d0e1f2-a3b4-5678-cdef-789012defghi09',
    applicationNo: 'SAMOA-2026-009',
    companyName: '跨境支付解决方案有限公司',
    legalRepresentative: '林小明',
    registrationCountry: 'SG',
    tickerSymbol: 'PAY.T',
    listingType: 'rto',
    status: 'submitted',
    prospectusStatus: 'pending',
    valuationLowUsd: 3,
    valuationHighUsd: 10,
    targetRaiseUsd: 5,
    offerPriceMin: 0.3,
    offerPriceMax: 0.8,
    sharesOffered: 150000000,
    underwriter: '德意志银行(新加坡)',
    lawFirm: 'Latham & Watkins',
    auditor: '安永',
    aiScore: 70,
    aiopcScore: 74.5,
    riskLevel: 'low',
    dcfDiscountRate: 8.8,
    dcfTerminalGrowth: 2.0,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: '2026-05-10T15:30:00Z',
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-05-05T08:00:00Z',
    createdBy: 'admin-user-001',
    icReviewerId: null,
    icReviewerName: null,
    currentPhase: '第一等待: 已提交待分配',
    relatedIpoAssessmentId: 'ipo-assess-020',
    auditLogs: [
      { id: 'log-080', createdAt: '2026-05-05T08:00:00Z', operatorName: '林小明', actionType: 'samoa.create', detail: '创建RTO申请' },
      { id: 'log-081', createdAt: '2026-05-10T15:30:00Z', operatorName: '林小明', actionType: 'samoa.submit', detail: '提交IC审核' },
    ],
  },
  {
    id: 'd0e1f2a3-b4c5-6789-defa-890123efghij10',
    applicationNo: 'SAMOA-2026-010',
    companyName: '数字资产托管服务公司',
    legalRepresentative: '陈思远',
    registrationCountry: 'KY',
    tickerSymbol: 'CUST.F',
    listingType: 'ipo',
    status: 'ic_approved',
    prospectusStatus: 'submitted',
    valuationLowUsd: 25,
    valuationHighUsd: 60,
    targetRaiseUsd: 35,
    offerPriceMin: 1.5,
    offerPriceMax: 3.5,
    sharesOffered: 18000000,
    underwriter: '巴克莱银行(开曼)',
    lawFirm: 'Maples and Calder',
    auditor: '德勤',
    aiScore: 76,
    aiopcScore: 80.0,
    riskLevel: 'low',
    dcfDiscountRate: 8.2,
    dcfTerminalGrowth: 2.8,
    monteCarloSimulations: 6000,
    monteCarloPct90: 38,
    submittedAt: '2026-04-15T09:00:00Z',
    icReviewedAt: '2026-05-05T14:00:00Z',
    listedAt: null,
    createdAt: '2026-04-01T07:00:00Z',
    createdBy: 'admin-user-003',
    icReviewerId: 'reviewer-001',
    icReviewerName: '王五(IC主席)',
    currentPhase: '第三阶段: 招股书已提交',
    relatedIpoAssessmentId: 'ipo-assess-022',
    auditLogs: [
      { id: 'log-090', createdAt: '2026-04-01T07:00:00Z', operatorName: '陈思远', actionType: 'samoa.create', detail: '创建IPO申请' },
      { id: 'log-091', createdAt: '2026-04-15T09:00:00Z', operatorName: '陈思远', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-092', createdAt: '2026-05-05T14:00:00Z', operatorName: '王五(IC主席)', actionType: 'samoa.ic_approve', detail: 'IC通过审核' },
      { id: 'log-093', createdAt: '2026-05-12T10:00:00Z', operatorName: '陈思远', actionType: 'samoa.prospectus_upload', detail: '上传招股书草稿 v1.0' },
    ],
  },
  {
    id: 'e1f2a3b4-c5d6-7890-efab-901234fghijk11',
    applicationNo: 'SAMOA-2026-011',
    companyName: '区块链供应链金融平台',
    legalRepresentative: '孙大伟',
    registrationCountry: 'AE',
    tickerSymbol: 'SCF.T',
    listingType: 'direct',
    status: 'prospectus_review',
    prospectusStatus: 'reviewing',
    valuationLowUsd: 12,
    valuationHighUsd: 30,
    targetRaiseUsd: 18,
    offerPriceMin: 0.8,
    offerPriceMax: 2.0,
    sharesOffered: 60000000,
    underwriter: '工商银行(阿布扎比)',
    lawFirm: 'Freshfields Bruckhaus Deringer',
    auditor: '毕马威',
    aiScore: 69,
    aiopcScore: 71.0,
    riskLevel: 'medium-high' as any,
    dcfDiscountRate: 9.2,
    dcfTerminalGrowth: 1.8,
    monteCarloSimulations: 7000,
    monteCarloPct90: 32,
    submittedAt: '2026-03-25T11:00:00Z',
    icReviewedAt: '2026-04-10T15:30:00Z',
    listedAt: null,
    createdAt: '2026-03-15T09:00:00Z',
    createdBy: 'admin-user-002',
    icReviewerId: 'reviewer-002',
    icReviewerName: '赵六(IC委员)',
    currentPhase: '第三阶段: 招股书审核中',
    relatedIpoAssessmentId: 'ipo-assess-018',
    relatedEnterpriseId: 'enterprise-scf-platform',
    auditLogs: [
      { id: 'log-100', createdAt: '2026-03-15T09:00:00Z', operatorName: '孙大伟', actionType: 'samoa.create', detail: '创建Direct Listing申请' },
      { id: 'log-101', createdAt: '2026-03-25T11:00:00Z', operatorName: '孙大伟', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-102', createdAt: '2026-04-10T15:30:00Z', operatorName: '赵六(IC委员)', actionType: 'samoa.ic_approve', detail: 'IC通过审核' },
      { id: 'log-103', createdAt: '2026-04-20T09:00:00Z', operatorName: '孙大伟', actionType: 'samoa.prospectus_upload', detail: '上传招股书v1.0' },
      { id: 'log-104', createdAt: '2026-05-08T11:00:00Z', operatorName: '合规审查员', actionType: 'samoa.prospectus_review_start', detail: '招股书正式进入审核流程' },
    ],
  },
  {
    id: 'f2a3b4c5-d6e7-8901-fabc-d123456ghijkl12',
    applicationNo: 'SAMOA-2026-012',
    companyName: '智能合约审计服务公司',
    legalRepresentative: '黄雅琪',
    registrationCountry: 'CH',
    tickerSymbol: 'AUDIT.S',
    listingType: 'ipo',
    status: 'listed',
    prospectusStatus: 'approved',
    valuationLowUsd: 18,
    valuationHighUsd: 45,
    targetRaiseUsd: 25,
    offerPriceMin: 1.2,
    offerPriceMax: 3.0,
    sharesOffered: 9000000,
    underwriter: '瑞银集团(苏黎世)',
    lawFirm: 'Homburger',
    auditor: '普华永道',
    aiScore: 85,
    aiopcScore: 86.5,
    riskLevel: 'low',
    dcfDiscountRate: 7.2,
    dcfTerminalGrowth: 3.2,
    monteCarloSimulations: 18000,
    monteCarloPct90: 88,
    submittedAt: '2025-12-01T10:00:00Z',
    icReviewedAt: '2025-12-20T14:00:00Z',
    listedAt: '2026-03-15T09:30:00Z',
    createdAt: '2025-11-15T08:00:00Z',
    createdBy: 'admin-user-001',
    icReviewerId: 'reviewer-003',
    icReviewerName: '李四(IC委员会)',
    currentPhase: '第五阶段: 正式挂牌',
    relatedIpoAssessmentId: 'ipo-assess-012',
    auditLogs: [
      { id: 'log-110', createdAt: '2025-11-15T08:00:00Z', operatorName: '黄雅琪', actionType: 'samoa.create', detail: '创建IPO申请' },
      { id: 'log-111', createdAt: '2025-12-01T10:00:00Z', operatorName: '黄雅琪', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-112', createdAt: '2025-12-20T14:00:00Z', operatorName: '李四(IC委员会)', actionType: 'samoa.ic_approve', detail: 'IC通过审核' },
      { id: 'log-113', createdAt: '2026-01-15T09:00:00Z', operatorName: '瑞银集团', actionType: 'samoa.prospectus_upload', detail: '提交最终招股书' },
      { id: 'log-114', createdAt: '2026-02-20T11:00:00Z', operatorName: '合规部', actionType: 'samoa.prospectus_approve', detail: '招股书审批通过' },
      { id: 'log-115', createdAt: '2026-03-15T09:30:00Z', operatorName: '交易所运营部', actionType: 'samoa.list', detail: '正式挂牌交易' },
    ],
  },
  {
    id: 'a3b4c5d6-e7f8-9012-gabc-e123456hijklm13',
    applicationNo: 'SAMOA-2026-013',
    companyName: '元宇宙地产投资信托(REIT)',
    legalRepresentative: 'Mark Zuckerberg',
    registrationCountry: 'US',
    tickerSymbol: 'META.R',
    listingType: 'spac',
    status: 'ic_rejected',
    prospectusStatus: 'pending',
    valuationLowUsd: 100,
    valuationHighUsd: 300,
    targetRaiseUsd: 150,
    offerPriceMin: null,
    offerPriceMax: null,
    sharesOffered: null,
    underwriter: null,
    lawFirm: null,
    auditor: null,
    aiScore: 35,
    aiopcScore: 48.0,
    riskLevel: 'extreme',
    dcfDiscountRate: null,
    dcfTerminalGrowth: null,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: '2026-04-20T13:00:00Z',
    icReviewedAt: '2026-05-10T10:00:00Z',
    listedAt: null,
    createdAt: '2026-04-10T08:00:00Z',
    createdBy: 'admin-user-004',
    icReviewerId: 'reviewer-001',
    icReviewerName: '王五(IC主席)',
    currentPhase: '已终止',
    auditLogs: [
      { id: 'log-120', createdAt: '2026-04-10T08:00:00Z', operatorName: 'Mark Z', actionType: 'samoa.create', detail: '创建SPAC申请' },
      { id: 'log-121', createdAt: '2026-04-20T13:00:00Z', operatorName: 'Mark Z', actionType: 'samoa.submit', detail: '提交IC审核' },
      { id: 'log-122', createdAt: '2026-05-10T10:00:00Z', operatorName: '王五(IC主席)', actionType: 'samoa.ic_reject', detail: 'IC驳回：估值过高且业务模式不确定性极大，风险等级extreme' },
    ],
  },
  {
    id: 'b4c5d6e7-f8g9-0123-habd-f234567ijklmn14',
    applicationNo: 'SAMOA-2026-014',
    companyName: '去中心化身份认证系统(DID)',
    legalRepresentative: 'Vitalik Buterin',
    registrationCountry: 'CH',
    tickerSymbol: 'DID.I',
    listingType: 'rto',
    status: 'draft',
    prospectusStatus: 'pending',
    valuationLowUsd: 2,
    valuationHighUsd: 8,
    targetRaiseUsd: 4,
    offerPriceMin: null,
    offerPriceMax: null,
    sharesOffered: null,
    underwriter: null,
    lawFirm: null,
    auditor: null,
    aiScore: null,
    aiopcScore: null,
    riskLevel: null,
    dcfDiscountRate: null,
    dcfTerminalGrowth: null,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: null,
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-05-15T14:00:00Z',
    createdBy: 'admin-user-005',
    icReviewerId: null,
    icReviewerName: null,
    currentPhase: '第一阶段: 草稿',
    auditLogs: [
      { id: 'log-130', createdAt: '2026-05-15T14:00:00Z', operatorName: 'Vitalik B', actionType: 'samoa.create', detail: '创建RTO申请(草稿)' },
    ],
  },
  {
    id: 'c5d6e7f8-g9h0-1234-iabc-345678jklmno15',
    applicationNo: 'SAMOA-2026-015',
    companyName: '海洋碳信用交易平台',
    legalRepresentative: 'Greta Thunberg',
    registrationCountry: 'NO',
    tickerSymbol: 'CARBON.O',
    listingType: 'ipo',
    status: 'submitted',
    prospectusStatus: 'pending',
    valuationLowUsd: 6,
    valuationHighUsd: 18,
    targetRaiseUsd: 10,
    offerPriceMin: 0.5,
    offerPriceMax: 1.5,
    sharesOffered: 25000000,
    underwriter: '联合气候基金',
    lawFirm: 'ClientEarth Legal',
    auditor: '安永',
    aiScore: 61,
    aiopcScore: 67.0,
    riskLevel: 'medium',
    dcfDiscountRate: 9.0,
    dcfTerminalGrowth: 1.5,
    monteCarloSimulations: null,
    monteCarloPct90: null,
    submittedAt: '2026-05-18T09:30:00Z',
    icReviewedAt: null,
    listedAt: null,
    createdAt: '2026-05-12T07:00:00Z',
    createdBy: 'admin-user-003',
    icReviewerId: null,
    icReviewerName: null,
    currentPhase: '第一等待: 已提交待分配',
    relatedIpoAssessmentId: 'ipo-assess-028',
    auditLogs: [
      { id: 'log-140', createdAt: '2026-05-12T07:00:00Z', operatorName: 'Greta T', actionType: 'samoa.create', detail: '创建ESG-IPO申请' },
      { id: 'log-141', createdAt: '2026-05-18T09:30:00Z', operatorName: 'Greta T', actionType: 'samoa.submit', detail: '提交IC审核' },
    ],
  },
];

// ==================== 材料清单 Mock ====================

const mockDocuments = [
  { name: '商业计划书 v2.1', type: 'business_plan', status: 'approved', uploadedAt: '2026-03-10', size: '3.2MB' },
  { name: '近三年财务审计报告', type: 'financial_report_3y', status: 'approved', uploadedAt: '2026-03-10', size: '8.7MB' },
  { name: '招股说明书草稿 v1.0', type: 'prospectus_draft', status: 'reviewing', uploadedAt: '2026-04-20', size: '15.4MB' },
  { name: '尽职调查报告', type: 'due_diligence', status: 'pending', uploadedAt: null, size: '--' },
  { name: '公司治理结构说明', type: 'corporate_governance', status: 'approved', uploadedAt: '2026-03-15', size: '1.1MB' },
  { name: '法律意见书', type: 'legal_opinion', status: 'pending', uploadedAt: null, size: '--' },
];

// ==================== 主组件 ====================

export default function SamoaListingPage() {
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<SamoaApplication | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [prospectusFilter, setProspectusFilter] = useState('');

  // ====== useQuery 数据获取 ======
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'samoa-listing', searchKeyword, typeFilter, statusFilter],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 500));
      let filtered = [...mockApplications];

      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        filtered = filtered.filter(
          (app) =>
            app.applicationNo.toLowerCase().includes(kw) ||
            app.companyName.toLowerCase().includes(kw) ||
            (app.tickerSymbol || '').toLowerCase().includes(kw),
        );
      }

      if (typeFilter) {
        filtered = filtered.filter((app) => app.listingType === typeFilter);
      }

      if (statusFilter) {
        filtered = filtered.filter((app) => app.status === statusFilter);
      }

      return { items: filtered, total: filtered.length };
    },
  });

  // ====== useMutation 状态变更 ======
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await new Promise((r) => setTimeout(r, 300));
      return { id, newStatus };
    },
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['admin', 'samoa-listing'] });
    },
    onError: () => {
      message.error('操作失败');
    },
  });

  // ====== 计算统计值 ======
  const total = data?.total ?? 0;
  const inReviewCount =
    data?.items?.filter(
      (app) => app.status === 'ic_reviewing' || app.status === 'prospectus_review',
    ).length ?? 0;
  const listedCount = data?.items?.filter((app) => app.status === 'listed').length ?? 0;
  const avgAiopcScore =
    data?.items && data.items.length > 0
      ? data.items.reduce((sum, app) => sum + (app.aiopcScore || 0), 0) /
        data.items.filter((app) => app.aiopcScore != null).length
      : null;

  // ====== columns 15列定义 ======
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs font-semibold">{text}</span>
      ),
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '证券代码',
      dataIndex: 'tickerSymbol',
      width: 95,
      align: 'center' as const,
      render: (text: string | null) => (text ? <Tag color="geekblue">{text}</Tag> : <span className="text-gray-400">--</span>),
    },
    {
      title: '申请类型',
      dataIndex: 'listingType',
      width: 95,
      align: 'center' as const,
      render: (val: SamoaApplication['listingType']) => {
        const t = TYPE_MAP[val];
        return t ? <Tag color={t.color}>{t.text}</Tag> : val;
      },
    },
    {
      title: 'AI评分',
      dataIndex: 'aiScore',
      width: 100,
      align: 'center' as const,
      render: (score: number | null) => {
        if (score == null || score === undefined) return <span className="text-gray-400">--</span>;
        const color = score >= 80 ? '#16A34A' : score >= 60 ? '#F59E0B' : '#DC2626';
        return (
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ border: `2px solid ${color}`, color }}
            >
              {score}
            </div>
            <span className="text-[10px]" style={{ color }}>分</span>
          </div>
        );
      },
    },
    {
      title: 'IC状态',
      dataIndex: 'status',
      width: 115,
      align: 'center' as const,
      render: (val: SamoaApplication['status']) => {
        const s = STATUS_MAP[val];
        return s ? <Tag color={s.color}>{s.text}</Tag> : val;
      },
    },
    {
      title: '招股书',
      dataIndex: 'prospectusStatus',
      width: 105,
      align: 'center' as const,
      render: (val: SamoaApplication['prospectusStatus']) => {
        const p = PROSPECTUS_MAP[val];
        return p ? <Tag color={p.color}>{p.text}</Tag> : val;
      },
    },
    {
      title: 'DCF估值',
      dataIndex: 'valuationRange' as keyof never,
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: SamoaApplication) => {
        if (!record.valuationLowUsd || !record.valuationHighUsd)
          return <span className="text-gray-400">--</span>;
        return (
          <Tooltip title={`三阶段DCF估值模型 · 折现率${record.dcfDiscountRate}% · 永续增长率${record.dcfTerminalGrowth}%`}>
            <span className="font-mono text-sm font-semibold" style={{ color: '#1677FF' }}>
              ${record.valuationLowUsd}M - ${record.valuationHighUsd}M
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: '风险',
      dataIndex: 'riskLevel',
      width: 90,
      align: 'center' as const,
      render: (level: SamoaApplication['riskLevel']) => {
        if (!level) return <span className="text-gray-400">--</span>;
        const r = RISK_LEVEL_MAP[level];
        if (!r) return level;
        const iconMap: Record<string, React.ReactNode> = {
          low: <CheckCircleOutlined />,
          medium: <ExclamationCircleOutlined />,
          high: <WarningOutlined />,
          extreme: <CloseCircleOutlined />,
        };
        return <Tag color={r.color} icon={iconMap[level]}>{r.text}</Tag>;
      },
    },
    {
      title: '承销商',
      dataIndex: 'underwriter',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || <span className="text-gray-400">--</span>,
    },
    {
      title: '提交日期',
      dataIndex: 'submittedAt',
      width: 110,
      align: 'center' as const,
      render: (text: string | null) =>
        text ? dayjs(text).format('YYYY-MM-DD') : <span className="text-gray-400">--</span>,
    },
    {
      title: '当前阶段',
      dataIndex: 'currentPhase',
      width: 105,
      align: 'center' as const,
      render: (text: string) => (
        <Tooltip title={text}>
          <Tag color={selectedApp?.status === 'listed' ? 'geekblue' : 'processing'}>
            {text.split(':')[0]}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'AIOPC',
      dataIndex: 'aiopcScore',
      width: 85,
      align: 'center' as const,
      render: (val: number | null) => {
        if (!val) return <span className="text-gray-400">--</span>;
        return (
          <span className="font-semibold" style={{ color: '#F0B90B' }}>
            {val}
          </span>
        );
      },
    },
    {
      title: '负责人',
      dataIndex: 'icReviewerName',
      width: 90,
      ellipsis: true,
      render: (text: string | null) => text || <span className="text-gray-400">--</span>,
    },
  ];

  // ====== actions 操作按钮 ======
  const actions = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link' as const,
      onClick: (record: SamoaApplication) => {
        setSelectedApp(record);
        setDetailVisible(true);
      },
    },
    {
      key: 'ic-review',
      label: 'IC审核',
      icon: <FormOutlined />,
      type: 'primary' as const,
      hidden: (record: SamoaApplication) => record.status !== 'ic_reviewing',
      confirm: {
        title: '确认执行IC审核？',
        description: '审核通过后进入招股书阶段，驳回则退回申请人修改。',
        onConfirm: (record: SamoaApplication) => {
          statusMutation.mutate({ id: record.id, newStatus: 'ic_approved' });
        },
      },
    },
    {
      key: 'prospectus',
      label: '招股书',
      icon: <UploadOutlined />,
      type: 'default' as const,
      hidden: (record: SamoaApplication) =>
        !['ic_approved', 'prospectus_review'].includes(record.status),
      onClick: (record: SamoaApplication) => {
        message.info(`[${record.applicationNo}] 招股书功能开发中`);
      },
    },
    {
      key: 'log',
      label: '日志',
      icon: <HistoryOutlined />,
      type: 'default' as const,
      onClick: (record: SamoaApplication) => {
        message.info(`[${record.applicationNo}] 操作日志功能开发中`);
      },
    },
  ];

  // ====== 获取Steps当前步骤 ======
  const getStepCurrent = (app: SamoaApplication): number => {
    const stepMap: Record<string, number> = {
      draft: 0,
      submitted: 1,
      ic_reviewing: 2,
      ic_approved: 3,
      ic_rejected: -1,
      prospectus_review: 4,
      listed: 5,
      rejected: -1,
    };
    return stepMap[app.status] ?? 0;
  };

  // ====== 获取Step items ======
  const getStepItems = (app: SamoaApplication) => {
    const current = getStepCurrent(app);
    return [
      { title: '提交申请', status: current >= 0 ? ('finish' as const) : ('wait' as const) },
      { title: 'IC审核', status: current >= 2 ? ('finish' as const) : current === 1 ? ('process' as const) : ('wait' as const) },
      { title: '招股书审核', status: current >= 4 ? ('finish' as const) : current >= 3 ? ('process' as const) : ('wait' as const) },
      { title: '合规审查', status: current >= 5 ? ('finish' as const) : ('wait' as const) },
      { title: '正式挂牌', status: current >= 5 ? ('finish' as const) : ('wait' as const) },
    ];
  };

  // ====== 材料清单表格列 ======
  const documentColumns = [
    { title: '材料名称', dataIndex: 'name', width: 200 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (t: string) => {
        const map: Record<string, string> = {
          business_plan: '商业计划书',
          financial_report_3y: '财务审计报告',
          prospectus_draft: '招股书草稿',
          due_diligence: '尽职调查报告',
          corporate_governance: '公司治理',
          legal_opinion: '法律意见书',
        };
        return <Tag>{map[t] || t}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center' as const,
      render: (s: string) => {
        const m: Record<string, { color: string; text: string }> = {
          approved: { color: 'green', text: '已批准' },
          reviewing: { color: 'orange', text: '审核中' },
          pending: { color: 'default', text: '待提交' },
          rejected: { color: 'red', text: '已驳回' },
        };
        const item = m[s];
        return item ? <Tag color={item.color}>{item.text}</Tag> : s;
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      width: 80,
      align: 'right' as const,
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      width: 110,
      align: 'center' as const,
      render: (t: string | null) => (t ? dayjs(t).format('YYYY-MM-DD') : '--'),
    },
  ];

  // ====== 审计日志列定义 ======
  const auditLogColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 165,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    { title: '操作人', dataIndex: 'operatorName', width: 130 },
    {
      title: '操作类型',
      dataIndex: 'actionType',
      width: 160,
      render: (action: string) => {
        const map: Record<string, { color: string; text: string }> = {
          'samoa.create': { color: 'blue', text: '创建申请' },
          'samoa.submit': { color: 'cyan', text: '提交审核' },
          'samoa.ic_approve': { color: 'green', text: 'IC通过' },
          'samoa.ic_reject': { color: 'red', text: 'IC驳回' },
          'samoa.prospectus_upload': { color: 'orange', text: '上传招股书' },
          'samoa.prospectus_approve': { color: 'purple', text: '招股书审批' },
          'samoa.prospectus_review_start': { color: 'gold', text: '开始审核' },
          'samoa.list': { color: 'geekblue', text: '正式挂牌' },
          'samoa.reject': { color: 'magenta', text: '终止申请' },
          'ai.score_update': { color: 'gold', text: 'AI评分更新' },
        };
        const m = map[action];
        return m ? <Tag color={m.color}>{m.text}</Tag> : action;
      },
    },
    {
      title: '详情',
      dataIndex: 'detail',
      ellipsis: true,
      render: (detail: string) => (
        <Tooltip title={detail}>
          <span>{detail}</span>
        </Tooltip>
      ),
    },
  ];

  // ====== 渲染 ======
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* ========== 标题区（品牌增强）========== */}
        <div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* 萨摩亚国旗色点缀 */}
              <div className="w-1 h-8 rounded bg-gradient-to-b from-blue-600 to-red-500" />
              <h1 className="text-2xl font-bold m-0">萨摩亚证券交易所</h1>
              <Tag color="blue" className="ml-1">v2.0 新增</Tag>
              {/* 牌照信息 */}
              <Tooltip title="萨摩亚国际商业注册号 · MSF-2024-00047">
                <Tag icon={<SafetyCertificateOutlined />} color="cyan">
                  牌照认证
                </Tag>
              </Tooltip>
            </div>
            <Space>
              {/* AI批量评估按钮 */}
              <Button icon={<ThunderboltOutlined />} className="border-yellow-400 text-yellow-600 hover:bg-yellow-50">
                AI批量评估
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>新建申请</Button>
              <Button icon={<DownloadOutlined />}>导出报告</Button>
            </Space>
          </div>
          {/* 品牌副标题 */}
          <p className="text-gray-500 text-sm mt-1 ml-5">
            萨摩亚SE上市申请管理 · IC Investment Committee 审核 · 招股说明书审批 ·{' '}
            <span className="text-blue-600">Powered by AIOPC Super-Engine</span>
          </p>
        </div>

        {/* ========== 统计卡片区 ========== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <DataCard title="申请总数" value={total} icon={<GlobalOutlined />} color="#1677FF" />
          <DataCard
            title="本月新增"
            value={12}
            icon={<PlusOutlined />}
            color="#16A34A"
            trend="up"
            trendValue="+3"
          />
          <DataCard title="处理中" value={inReviewCount} icon={<ClockCircleOutlined />} color="#F59E0B" />
          <DataCard title="已完成" value={listedCount} icon={<CheckCircleOutlined />} color="#7C3AED" />
          {/* AIOPC平均分卡片 */}
          <DataCard
            title="AIOPC均分"
            value={avgAiopcScore != null ? avgAiopcScore.toFixed(1) : '--'}
            icon={<ThunderboltOutlined />}
            color="#F0B90B"
            suffix="/100"
            description="AIOPC超级合子综合评分"
          />
        </div>

        {/* ========== 筛选区 ========== */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select
            placeholder="申请类型"
            allowClear
            style={{ width: 140 }}
            onChange={(value: string) => setTypeFilter(value || '')}
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="ipo">IPO</Select.Option>
            <Select.Option value="spac">SPAC</Select.Option>
            <Select.Option value="rto">RTO</Select.Option>
            <Select.Option value="direct">Direct Listing</Select.Option>
          </Select>

          <Select
            placeholder="IC审核状态"
            allowClear
            style={{ width: 155 }}
            onChange={(value: string) => setStatusFilter(value || '')}
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
            <Select.Option value="submitted">已提交</Select.Option>
            <Select.Option value="ic_reviewing">IC审核中</Select.Option>
            <Select.Option value="ic_approved">IC通过</Select.Option>
            <Select.Option value="ic_rejected">IC驳回</Select.Option>
            <Select.Option value="prospectus_review">招股书审核</Select.Option>
            <Select.Option value="listed">已上市</Select.Option>
            <Select.Option value="rejected">已终止</Select.Option>
          </Select>

          <Select
            placeholder="招股书状态"
            allowClear
            style={{ width: 145 }}
            onChange={(value: string) => setProspectusFilter(value || '')}
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="pending">待提交</Select.Option>
            <Select.Option value="submitted">已提交</Select.Option>
            <Select.Option value="reviewing">审核中</Select.Option>
            <Select.Option value="approved">已批准</Select.Option>
            <Select.Option value="rejected">已驳回</Select.Option>
          </Select>
        </div>

        {/* ========== 数据表格 ========== */}
        <DataTable
          columns={columns}
          dataSource={data?.items || []}
          loading={isLoading}
          showSearch
          searchPlaceholder="搜索编号、公司名或证券代码"
          onSearch={setSearchKeyword}
          actions={actions}
          rowKey="id"
          onRefresh={refetch}
          pagination={{
            total: data?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t: number) => `共 ${t} 条记录`,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />

        {/* ========== 生态关联导航 ========== */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Space size="middle" wrap>
            <span className="text-xs text-gray-500 mr-2">关联模块:</span>
            <Tooltip title="跳转到 IPO 评估看板 (W36-W40)">
              <Button size="small" type="link" icon={<LineChartOutlined />}>
                IPO评估
              </Button>
            </Tooltip>
            <Tooltip title="跳转到代币评分仪表板 (W23-W25)">
              <Button size="small" type="link" icon={<StarOutlined />}>
                代币评分
              </Button>
            </Tooltip>
            <Tooltip title="跳转到企业投研中心 (W28-W31)">
              <Button size="small" type="link" icon={<BankOutlined />}>
                企业投研
              </Button>
            </Tooltip>
            <Tooltip title="跳转到策略分销网络 (W32-W35)">
              <Button size="small" type="link" icon={<ApartmentOutlined />}>
                策略分销
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* ========== 详情弹窗 ========== */}
        <Modal
          title={
            selectedApp
              ? `上市申请详情 - ${selectedApp.applicationNo}`
              : '上市申请详情'
          }
          open={detailVisible}
          onCancel={() => setDetailVisible(false)}
          width={860}
          destroyOnClose
          footer={[
            <Button key="close" onClick={() => setDetailVisible(false)}>
              关闭
            </Button>,
            ...(selectedApp?.status === 'draft'
              ? [
                  <Button
                    key="edit"
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => message.info('编辑功能开发中')}
                  >
                    编辑申请
                  </Button>,
                ]
              : []),
          ]}
        >
          {selectedApp && (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
              {/* 基本信息 */}
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="申请编号">{selectedApp.applicationNo}</Descriptions.Item>
                <Descriptions.Item label="公司全称">{selectedApp.companyName}</Descriptions.Item>
                <Descriptions.Item label="法人代表">{selectedApp.legalRepresentative}</Descriptions.Item>
                <Descriptions.Item label="注册地">
                  <Tag>{selectedApp.registrationCountry}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="证券代码">
                  {selectedApp.tickerSymbol ? (
                    <Tag color="geekblue">{selectedApp.tickerSymbol}</Tag>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="申请类型">
                  <Tag color={TYPE_MAP[selectedApp.listingType]?.color}>
                    {TYPE_MAP[selectedApp.listingType]?.text}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="提交时间">
                  {selectedApp.submittedAt
                    ? dayjs(selectedApp.submittedAt).format('YYYY-MM-DD HH:mm')
                    : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(selectedApp.createdAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="创建人" span={2}>
                  {selectedApp.createdBy}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              {/* 估值融资 */}
              <Descriptions bordered column={2} size="small" title="估值与融资信息">
                <Descriptions.Item label="估值下限">
                  {selectedApp.valuationLowUsd != null ? `$${selectedApp.valuationLowUsd}M` : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="估值上限">
                  {selectedApp.valuationHighUsd != null ? `$${selectedApp.valuationHighUsd}M` : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="目标募资额">
                  {selectedApp.targetRaiseUsd != null ? `$${selectedApp.targetRaiseUsd}M` : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="发行价区间">
                  {selectedApp.offerPriceMin != null && selectedApp.offerPriceMax != null
                    ? `$${selectedApp.offerPriceMin} - $${selectedApp.offerPriceMax}`
                    : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="发行股数">
                  {selectedApp.sharesOffered != null
                    ? selectedApp.sharesOffered.toLocaleString()
                    : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="承销商">{selectedApp.underwriter || '--'}</Descriptions.Item>
                <Descriptions.Item label="律师事务所">{selectedApp.lawFirm || '--'}</Descriptions.Item>
                <Descriptions.Item label="会计师事务所">{selectedApp.auditor || '--'}</Descriptions.Item>
              </Descriptions>

              {/* ★ AI智能评估卡片 */}
              {selectedApp.aiScore != null && (
                <>
                  <Divider />
                  <Card
                    size="small"
                    className="border-l-4"
                    style={{ borderLeftColor: '#F0B90B', background: '#FFFBEB' }}
                    title={
                      <Space>
                        <ThunderboltOutlined style={{ color: '#F0B90B' }} />
                        <span className="font-semibold">AIOPC 综合评估</span>
                        <Tag color="gold" className="ml-2">AI驱动</Tag>
                      </Space>
                    }
                  >
                    <div className="space-y-2 mb-3">
                      {[
                        { label: '经济模型', value: 78, weight: '25%', max: 100, color: '#1677FF' },
                        { label: '增长潜力', value: 85, weight: '25%', max: 100, color: '#16A34A' },
                        { label: '风控能力', value: 68, weight: '25%', max: 100, color: '#F59E0B' },
                        { label: 'AIOPC协同', value: 92, weight: '15%', max: 100, color: '#7C3AED' },
                        { label: '社区共识', value: 70, weight: '10%', max: 100, color: '#06B6D4' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-xs w-20 text-gray-600">{item.label}</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${item.value}%`, backgroundColor: item.color }}
                            />
                          </div>
                          <span className="text-xs font-mono w-16 text-right" style={{ color: item.color }}>
                            {item.value}分
                            <span className="text-gray-400 text-[10px] ml-1">{item.weight}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <Divider className="my-2" />
                    <div className="flex gap-4 text-xs">
                      <div className="flex-1 p-2 bg-green-50 rounded border border-green-200">
                        <div className="font-medium text-green-700 mb-1">AI 建议</div>
                        <div className="text-green-600">
                          {selectedApp.status === 'ic_reviewing' &&
                            '建议通过IC审核后进入招股书阶段'}
                          {selectedApp.status === 'ic_approved' &&
                            '建议尽快提交招股书草稿，当前排队位置 #3'}
                          {selectedApp.status === 'listed' && '已成功挂牌，建议持续监控首月流动性'}
                          {!['ic_reviewing', 'ic_approved', 'listed'].includes(selectedApp.status) &&
                            '等待进入审核流程'}
                        </div>
                      </div>
                      <div className="flex-1 p-2 bg-orange-50 rounded border border-orange-200">
                        <div className="font-medium text-orange-700 mb-1">风险提示</div>
                        <div className="text-orange-600">
                          {selectedApp.underwriter
                            ? '承销商集中度较高，建议引入联合承销团分散风险'
                            : '尚未指定承销机构'}
                          {' · '}
                          {selectedApp.valuationLowUsd && selectedApp.valuationLowUsd > 30
                            ? '估值偏高，需充分披露定价依据'
                            : '估值区间合理'}
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}

              <Divider />

              {/* 审核进度 Steps */}
              <h3 className="font-semibold text-base mb-3">审核进度</h3>
              <Steps
                current={getStepCurrent(selectedApp)}
                items={getStepItems(selectedApp)}
                size="small"
              />

              <Divider />

              {/* 申请材料清单 */}
              <h3 className="font-semibold text-base mb-3">申请材料清单</h3>
              <Table
                size="small"
                dataSource={mockDocuments}
                pagination={false}
                rowKey="name"
                columns={documentColumns}
                locale={{ emptyText: '暂无材料记录' }}
              />

              <Divider />

              {/* 操作日志 */}
              <h3 className="font-semibold text-base mb-3">操作日志</h3>
              <Table
                size="small"
                dataSource={selectedApp.auditLogs || []}
                pagination={false}
                rowKey="id"
                columns={auditLogColumns}
                locale={{ emptyText: '暂无操作记录' }}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
