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
  LineChartOutlined,
  StarOutlined,
  ApartmentOutlined,
  TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons';

import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

// ==================== 类型定义 ====================

interface HkApplication {
  id: string;
  applicationNo: string;
  companyName: string;
  legalRepresentative: string;
  stockCode: string | null; // e.g., "01234.HK"
  boardType: 'main' | 'gem'; // 主板 / GEM
  listingType: 'ipo' | 'spac' | 'rto' | 'backlist'; // IPO/SPAC/RTO/借壳上市
  status:
    | 'draft'
    | 'sponsor_review'
    | 'a1_submitted'
    | 'hkex_review'
    | 'hearing'
    | 'listed'
    | 'withdrawn'
    | 'rejected';
  sponsorName: string | null; // 保荐人名称
  a1SubmitDate: string | null; // A1递交日期
  hearingDate: string | null; // 聆讯日期
  listingDate: string | null; // 挂牌日期
  prospectusStatus: 'pending' | 'red_ink' | 'electronic' | 'approved' | 'withdrawn';
  valuationHkd: number | null; // 估值(港币)
  targetRaiseHkd: number | null; // 募资额(港币)
  offerPriceMin: number | null; // 发售价下限
  offerPriceMax: number | null; // 发售价上限
  sharesOffered: number | null; // 发行股数(百万)
  sponsorFees: number | null; // 保荐费用
  coSponsors: string[]; // 联席保荐人列表
  lawFirm: string | null; // 法律顾问
  auditor: string | null; // 核数师
  industry: string | null; // 行业分类
  aiScore: number | null; // AI综合评分(0-100)
  aiopcScore: number | null; // AIOPC超级合子评分
  dcfValuation: number | null; // DCF估值
  riskLevel: 'low' | 'medium' | 'high' | 'extreme' | null;
  sfcComments: string | null; // 证监会意见
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLogItem[];
}

interface AuditLogItem {
  id: string;
  actionType: string;
  actionLabel: string;
  operator: string;
  detail: string;
  timestamp: string;
  aiGenerated?: boolean;
}

// ==================== 状态映射常量 ====================

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  sponsor_review: { color: 'processing', text: '保荐人审核中' },
  a1_submitted: { color: 'blue', text: 'A1已递交' },
  hkex_review: { color: 'cyan', text: '港交所审核' },
  hearing: { color: 'orange', text: '聆讯阶段' },
  listed: { color: 'geekblue', text: '已挂牌' },
  withdrawn: { color: 'warning', text: '已撤回' },
  rejected: { color: 'error', text: '已拒绝' },
};

const PROSPECTUS_MAP: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '待提交' },
  red_ink: { color: 'red', text: '红印招股书' },
  electronic: { color: 'blue', text: '电子招股书' },
  approved: { color: 'success', text: '已核准' },
  withdrawn: { color: 'warning', text: '已撤回' },
};

const BOARD_TYPE_MAP: Record<string, { color: string; text: string }> = {
  main: { color: 'geekblue', text: '主板' },
  gem: { color: 'green', text: 'GEM' },
};

const TYPE_MAP: Record<string, { color: string; text: string }> = {
  ipo: { color: 'blue', text: 'IPO' },
  spac: { color: 'purple', text: 'SPAC' },
  rto: { color: 'orange', text: 'RTO' },
  backlist: { color: 'magenta', text: '借壳上市' },
};

const RISK_LEVEL_MAP: Record<string, { color: string; text: string }> = {
  low: { color: 'green', text: '低风险' },
  medium: { color: 'orange', text: '中风险' },
  high: { color: 'red', text: '高风险' },
  extreme: { color: 'magenta', text: '极高风险' },
};

// ==================== Mock 数据 ====================

const mockApplications: HkApplication[] = [
  {
    id: 'hk001',
    applicationNo: 'HK-IPO-2026-0001',
    companyName: '中萨数字科技集团有限公司',
    legalRepresentative: '张明远',
    stockCode: '1683.HK',
    boardType: 'main',
    listingType: 'ipo',
    status: 'listed',
    sponsorName: '中国国际金融股份有限公司（CICC）',
    a1SubmitDate: '2025-08-15',
    hearingDate: '2025-11-20',
    listingDate: '2026-01-15',
    prospectusStatus: 'approved',
    valuationHkd: 12500000000,
    targetRaiseHkd: 3500000000,
    offerPriceMin: 18.50,
    offerPriceMax: 22.00,
    sharesOffered: 180,
    sponsorFees: 105000000,
    coSponsors: ['摩根士丹利', '高盛（亚洲）'],
    lawFirm: '金杜律师事务所',
    auditor: '罗兵咸永道会计师事务所',
    industry: '金融科技 / 数字资产交易',
    aiScore: 92,
    aiopcScore: 88.5,
    dcfValuation: 13200000000,
    riskLevel: 'low',
    sfcComments: '符合主板上市规则第8章要求，AIOPC技术壁垒获认可',
    createdAt: '2025-07-20T09:00:00Z',
    updatedAt: '2026-01-15T14:30:00Z',
    auditLogs: [
      { id: 'log1', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建HK IPO申请', timestamp: '2025-07-20T09:00:00Z' },
      { id: 'log2', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: 'CICC系统', detail: '保荐人完成尽职调查并批准A1', timestamp: '2025-08-14T16:00:00Z' },
      { id: 'log3', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: '向港交所正式递交A1表格', timestamp: '2025-08-15T10:30:00Z' },
      { id: 'log4', actionType: 'ai.score_update', actionLabel: 'AI评分更新', operator: 'AIOPC引擎', detail: 'AI综合评分提升至92分（+3），DCF估值上调8%', timestamp: '2025-10-15T03:00:00Z', aiGenerated: true },
      { id: 'log5', actionType: 'hearing_pass', actionLabel: '聆讯通过', operator: 'HKEX系统', detail: '上市委员会聆讯通过，批准挂牌', timestamp: '2025-11-21T15:00:00Z' },
      { id: 'log6', actionType: 'listing_complete', actionLabel: '成功挂牌', operator: 'HKEX系统', detail: '1683.HK于联交所主板成功挂牌交易', timestamp: '2026-01-15T09:30:00Z' },
    ],
  },
  {
    id: 'hk002',
    applicationNo: 'HK-SPAC-2026-0001',
    companyName: '太平洋科技并购SPAC有限公司',
    legalRepresentative: '李建国',
    stockCode: null,
    boardType: 'main',
    listingType: 'spac',
    status: 'hearing',
    sponsorName: 'UBS Securities Hong Kong',
    a1SubmitDate: '2025-12-01',
    hearingDate: '2026-06-25',
    listingDate: null,
    prospectusStatus: 'electronic',
    valuationHkd: 2000000000,
    targetRaiseHkd: 300000000,
    offerPriceMin: 10.00,
    offerPriceMax: 10.00,
    sharesOffered: 30,
    sponsorFees: 22500000,
    coSponsors: ['中信证券（国际）'],
    lawFirm: '史密夫斐尔律师事务所',
    auditor: '安永会计师事务所',
    industry: 'SPAC / 科技并购',
    aiScore: 78,
    aiopcScore: 72.0,
    dcfValuation: 1850000000,
    riskLevel: 'medium',
    sfcComments: '需补充目标公司信息及de-SPAC时间表',
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: '2026-05-20T11:00:00Z',
    auditLogs: [
      { id: 'log7', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建SPAC申请', timestamp: '2025-11-15T10:00:00Z' },
      { id: 'log8', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: 'UBS系统', detail: 'UBS完成SPAC保荐审核', timestamp: '2025-11-28T17:00:00Z' },
      { id: 'log9', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: 'A1递交至港交所', timestamp: '2025-12-01T09:00:00Z' },
      { id: 'log10', actionType: 'ai.risk_alert', actionLabel: 'AI风险预警', operator: 'AIOPC引擎', detail: '检测到目标公司估值波动风险(+/-15%)', timestamp: '2026-04-10T02:00:00Z', aiGenerated: true },
    ],
  },
  {
    id: 'hk003',
    applicationNo: 'HK-RTO-2026-0001',
    companyName: '星辰新能源控股有限公司',
    legalRepresentative: '王海涛',
    stockCode: '0892.HK',
    boardType: 'gem',
    listingType: 'rto',
    status: 'hkex_review',
    sponsorName: '华兴资本（香港）',
    a1SubmitDate: '2026-02-10',
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'red_ink',
    valuationHkd: 850000000,
    targetRaiseHkd: 150000000,
    offerPriceMin: 2.50,
    offerPriceMax: 3.20,
    sharesOffered: 60,
    sponsorFees: 11250000,
    coSponsors: [],
    lawFirm: '竞天公诚律师事务所',
    auditor: '德勤·关黄陈方会计师行',
    industry: '新能源 / 储能技术',
    aiScore: 71,
    aiopcScore: 65.8,
    dcfValuation: 780000000,
    riskLevel: 'medium',
    sfcComments: 'GEM上市规则符合性审查进行中',
    createdAt: '2026-01-05T08:00:00Z',
    updatedAt: '2026-05-28T16:45:00Z',
    auditLogs: [
      { id: 'log11', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建RTO申请', timestamp: '2026-01-05T08:00:00Z' },
      { id: 'log12', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: '华兴资本系统', detail: '华兴资本完成RTO保荐审核', timestamp: '2026-02-09T15:00:00Z' },
      { id: 'log13', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: 'RTO相关文件递交港交所', timestamp: '2026-02-10T10:00:00Z' },
    ],
  },
  {
    id: 'hk004',
    applicationNo: 'HK-IPO-2026-0002',
    companyName: '智链医疗科技股份公司',
    legalRepresentative: '陈思雨',
    stockCode: null,
    boardType: 'main',
    listingType: 'ipo',
    status: 'a1_submitted',
    sponsorName: '中信里昂证券',
    a1SubmitDate: '2026-04-18',
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'pending',
    valuationHkd: 5200000000,
    targetRaiseHkd: 1200000000,
    offerPriceMin: 8.80,
    offerPriceMax: 11.50,
    sharesOffered: 130,
    sponsorFees: 36000000,
    coSponsors: ['花旗环球金融亚洲'],
    lawFirm: '方达律师事务所',
    auditor: '普华永道会计师事务所',
    industry: '医疗健康 / AI诊断',
    aiScore: 85,
    aiopcScore: 81.2,
    dcfValuation: 5500000000,
    riskLevel: 'low',
    sfcComments: 'AI医疗赛道受SFC关注，需补充临床数据',
    createdAt: '2026-03-10T09:30:00Z',
    updatedAt: '2026-04-18T14:00:00Z',
    auditLogs: [
      { id: 'log14', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建IPO申请', timestamp: '2026-03-10T09:30:00Z' },
      { id: 'log15', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: 'CLSA系统', detail: '中信里昂完成保荐审核', timestamp: '2026-04-17T16:30:00Z' },
      { id: 'log16', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: 'A1表格正式递交', timestamp: '2026-04-18T11:00:00Z' },
    ],
  },
  {
    id: 'hk005',
    applicationNo: 'HK-BL-2026-0001',
    companyName: '盛世文化传媒集团',
    legalRepresentative: '赵文博',
    stockCode: '2341.HK',
    boardType: 'gem',
    listingType: 'backlist',
    status: 'sponsor_review',
    sponsorName: '招商证券（香港）',
    a1SubmitDate: null,
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'pending',
    valuationHkd: 380000000,
    targetRaiseHkd: 80000000,
    offerPriceMin: 1.20,
    offerPriceMax: 1.60,
    sharesOffered: 65,
    sponsorFees: 6000000,
    coSponsors: [],
    lawFirm: '中伦律师事务所',
    auditor: '毕马威会计师事务所',
    industry: '文化传媒 / 数字内容',
    aiScore: 58,
    aiopcScore: 52.3,
    dcfValuation: 320000000,
    riskLevel: 'high',
    sfcComments: '借壳方案需进一步论证业务协同性',
    createdAt: '2026-04-25T13:00:00Z',
    updatedAt: '2026-05-30T10:20:00Z',
    auditLogs: [
      { id: 'log17', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建借壳上市申请', timestamp: '2026-04-25T13:00:00Z' },
      { id: 'log18', actionType: 'ai.risk_alert', actionLabel: 'AI风险预警', operator: 'AIOPC引擎', detail: '借壳标的估值溢价率偏高(>40%)，建议审慎评估', timestamp: '2026-05-02T06:00:00Z', aiGenerated: true },
    ],
  },
  {
    id: 'hk006',
    applicationNo: 'HK-IPO-2026-0003',
    companyName: '量子计算研究院有限公司',
    legalRepresentative: '林子墨',
    stockCode: null,
    boardType: 'main',
    listingType: 'ipo',
    status: 'draft',
    sponsorName: null,
    a1SubmitDate: null,
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'pending',
    valuationHkd: 8000000000,
    targetRaiseHkd: 2500000000,
    offerPriceMin: 15.00,
    offerPriceMax: 20.00,
    sharesOffered: 150,
    sponsorFees: null,
    coSponsors: [],
    lawFirm: null,
    auditor: null,
    industry: '量子计算 / 硬科技',
    aiScore: 95,
    aiopcScore: 91.0,
    dcfValuation: 9000000000,
    riskLevel: 'low',
    sfcComments: null,
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-06-01T08:00:00Z',
    auditLogs: [
      { id: 'log19', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建量子计算IPO申请草稿', timestamp: '2026-06-01T08:00:00Z' },
      { id: 'log20', actionType: 'ai.score_update', actionLabel: 'AI初评', operator: 'AIOPC引擎', detail: 'AIOPC初评91.0分，量子计算赛道评级S级', timestamp: '2026-06-01T08:05:00Z', aiGenerated: true },
    ],
  },
  {
    id: 'hk007',
    applicationNo: 'HK-SPAC-2026-0002',
    companyName: '亚洲基础设施并购SPAC II',
    legalRepresentative: '黄志强',
    stockCode: null,
    boardType: 'main',
    listingType: 'spac',
    status: 'draft',
    sponsorName: null,
    a1SubmitDate: null,
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'pending',
    valuationHkd: 3500000000,
    targetRaiseHkd: 400000000,
    offerPriceMin: 10.00,
    offerPriceMax: 10.00,
    sharesOffered: 40,
    sponsorFees: null,
    coSponsors: [],
    lawFirm: null,
    auditor: null,
    industry: '基建投资 / SPAC',
    aiScore: 69,
    aiopcScore: 63.5,
    dcfValuation: 3100000000,
    riskLevel: 'medium',
    sfcComments: null,
    createdAt: '2026-06-05T14:00:00Z',
    updatedAt: '2026-06-05T14:00:00Z',
    auditLogs: [
      { id: 'log21', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建基建SPAC-II申请', timestamp: '2026-06-05T14:00:00Z' },
    ],
  },
  {
    id: 'hk008',
    applicationNo: 'HK-RTO-2026-0002',
    companyName: '绿能环保科技股份有限公司',
    legalRepresentative: '周明辉',
    stockCode: '1567.HK',
    boardType: 'gem',
    listingType: 'rto',
    status: 'rejected',
    sponsorName: '国泰君安国际',
    a1SubmitDate: '2025-10-20',
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'withdrawn',
    valuationHkd: 420000000,
    targetRaiseHkd: 95000000,
    offerPriceMin: 1.80,
    offerPriceMax: 2.30,
    sharesOffered: 48,
    sponsorFees: 7125000,
    coSponsors: [],
    lawFirm: '君合律师事务所',
    auditor: '致同会计师事务所',
    industry: '环保科技 / 碳中和',
    aiScore: 45,
    aiopcScore: 38.7,
    dcfValuation: 280000000,
    riskLevel: 'extreme',
    sfcComments: 'RTO方案被港交所否决：标的资产盈利能力不达标',
    createdAt: '2025-09-15T10:00:00Z',
    updatedAt: '2026-01-08T11:00:00Z',
    auditLogs: [
      { id: 'log22', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建RTO申请', timestamp: '2025-09-15T10:00:00Z' },
      { id: 'log23', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: '国泰君安系统', detail: '国君完成RTO保荐审核', timestamp: '2025-10-19T14:00:00Z' },
      { id: 'log24', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: 'RTO文件递交', timestamp: '2025-10-20T09:30:00Z' },
      { id: 'log25', actionType: 'reject', actionLabel: '港交所否决', operator: 'HKEX系统', detail: '港交所否决RTO申请：标的资产近三年累计亏损', timestamp: '2026-01-08T10:00:00Z' },
    ],
  },
  {
    id: 'hk009',
    applicationNo: 'HK-IPO-2026-0004',
    companyName: '海洋生物制药股份公司',
    legalRepresentative: '吴雅琪',
    stockCode: null,
    boardType: 'main',
    listingType: 'ipo',
    status: 'sponsor_review',
    sponsorName: '汇丰银行（亚洲）',
    a1SubmitDate: null,
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'pending',
    valuationHkd: 6500000000,
    targetRaiseHkd: 1800000000,
    offerPriceMin: 12.00,
    offerPriceMax: 16.00,
    sharesOffered: 140,
    sponsorFees: 54000000,
    coSponsors: ['中金公司（国际）'],
    lawFirm: '达维律师事务所',
    auditor: '安永会计师事务所',
    industry: '生物医药 / 海洋提取',
    aiScore: 82,
    aiopcScore: 77.8,
    dcfValuation: 6900000000,
    riskLevel: 'low',
    sfcComments: '创新药管线价值获认可，待补充III期数据',
    createdAt: '2026-05-10T09:00:00Z',
    updatedAt: '2026-06-02T15:30:00Z',
    auditLogs: [
      { id: 'log26', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建海洋生物IPO申请', timestamp: '2026-05-10T09:00:00Z' },
      { id: 'log27', actionType: 'sponsor_approve', actionLabel: '保荐受理', operator: 'HSBC系统', detail: '汇丰银行受理保荐申请', timestamp: '2026-05-28T11:00:00Z' },
      { id: 'log28', actionType: 'ai.score_update', actionLabel: 'AI评分更新', operator: 'AIOPC引擎', detail: '新药管线数据更新，AI评分+4至82', timestamp: '2026-06-01T03:00:00Z', aiGenerated: true },
    ],
  },
  {
    id: 'hk010',
    applicationNo: 'HK-IPO-2026-0005',
    companyName: '星途航天科技有限公司',
    legalRepresentative: '郑宇航',
    stockCode: null,
    boardType: 'main',
    listingType: 'ipo',
    status: 'withdrawn',
    sponsorName: '高盛（亚洲）',
    a1SubmitDate: '2025-12-05',
    hearingDate: null,
    listingDate: null,
    prospectusStatus: 'withdrawn',
    valuationHkd: 15000000000,
    targetRaiseHkd: 4000000000,
    offerPriceMax: 26.80,
    offerPriceMin: 22.00,
    sharesOffered: 170,
    sponsorFees: 120000000,
    coSponsors: ['摩根士丹利'],
    lawFirm: '世达国际律师事务所',
    auditor: '罗兵咸永道会计师事务所',
    industry: '商业航天 / 卫星互联网',
    aiScore: 88,
    aiopcScore: 84.6,
    dcfValuation: 16000000000,
    riskLevel: 'low',
    sfcComments: '公司主动撤回：拟调整发行规模后重新申报',
    createdAt: '2025-10-20T08:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
    auditLogs: [
      { id: 'log29', actionType: 'create', actionLabel: '创建申请', operator: 'admin', detail: '创建星途航天IPO申请', timestamp: '2025-10-20T08:00:00Z' },
      { id: 'log30', actionType: 'sponsor_approve', actionLabel: '保荐通过', operator: 'Goldman系统', detail: '高盛完成保荐审核', timestamp: '2025-12-04T16:00:00Z' },
      { id: 'log31', actionType: 'a1_submit', actionLabel: 'A1递交', operator: 'admin', detail: 'A1递交港交所', timestamp: '2025-12-05T10:00:00Z' },
      { id: 'log32', actionType: 'withdraw', actionLabel: '主动撤回', operator: 'admin', detail: '公司决定调整发行规模后重新递表', timestamp: '2026-03-15T09:00:00Z' },
    ],
  },
];

// 材料清单 Mock
const mockDocuments = [
  { name: 'BIM 表格（上市文件核对表）', status: 'approved', uploader: 'CICC', uploadTime: '2025-08-10' },
  { name: '招股章程草案', status: 'approved', uploader: '金杜律所', uploadTime: '2025-09-15' },
  { name: '会计师报告', status: 'approved', uploader: 'PwC', uploadTime: '2025-09-28' },
  { name: 'SFC合规确认函', status: 'pending', uploader: '--', uploadTime: '--' },
  { name: 'HKEX问询回复', status: 'reviewing', uploader: 'CICC', uploadTime: '2025-10-20' },
  { name: '包销协议', status: 'approved', uploader: 'CICC/MS/GS', uploadTime: '2025-11-01' },
];

// ==================== 主组件 ====================

export default function HkListingPage() {
  const [selectedApp, setSelectedApp] = useState<HkApplication | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');

  const queryClient = useQueryClient();

  // 模拟数据查询
  const { data: applications = mockApplications, isLoading } = useQuery({
    queryKey: ['admin', 'hk-applications'],
    queryFn: () => Promise.resolve(mockApplications),
  });

  // 前端过滤
  const filteredData = applications.filter((app) => {
    const matchSearch =
      !searchKeyword ||
      app.applicationNo.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      app.companyName.includes(searchKeyword) ||
      (app.stockCode && app.stockCode.toLowerCase().includes(searchKeyword.toLowerCase()));
    const matchType = typeFilter === 'all' || app.listingType === typeFilter;
    const matchStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchBoard = boardFilter === 'all' || app.boardType === boardFilter;
    return matchSearch && matchType && matchStatus && matchBoard;
  });

  // 状态变更 mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      Promise.resolve({ success: true }),
    onSuccess: () => {
      message.success('状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin', 'hk-applications'] });
    },
    onError: () => {
      message.error('状态更新失败，请重试');
    },
  });

  // 统计值
  const total = applications.length;
  const thisMonthNew = applications.filter(
    (a) => dayjs(a.createdAt).isAfter(dayjs().subtract(1, 'month'))
  ).length;
  const inReviewCount = applications.filter((a) =>
    ['sponsor_review', 'a1_submitted', 'hkex_review', 'hearing'].includes(a.status)
  ).length;
  const listedCount = applications.filter((a) => a.status === 'listed').length;
  const avgAiopcScore =
    applications.filter((a) => a.aiopcScore != null).reduce((sum, a) => sum + (a.aiopcScore ?? 0), 0) /
    Math.max(applications.filter((a) => a.aiopcScore != null).length, 1);

  // ========== 表格列定义 ==========
  const columns = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 170,
      fixed: 'left' as const,
      render: (text: string) => (
        <span className="font-mono text-xs">{text}</span>
      ),
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 220,
      ellipsis: true,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 110,
      align: 'center' as const,
      render: (code: string | null) =>
        code ? (
          <Tag color="geekblue" className="font-mono font-bold">{code}</Tag>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      title: '板块',
      dataIndex: 'boardType',
      key: 'boardType',
      width: 80,
      align: 'center' as const,
      render: (val: HkApplication['boardType']) => {
        if (!val) return <span className="text-gray-400">--</span>;
        const b = BOARD_TYPE_MAP[val];
        return b ? <Tag color={b.color}>{b.text}</Tag> : val;
      },
    },
    {
      title: '上市方式',
      dataIndex: 'listingType',
      key: 'listingType',
      width: 100,
      align: 'center' as const,
      render: (val: HkApplication['listingType']) => {
        if (!val) return <span className="text-gray-400">--</span>;
        const t = TYPE_MAP[val];
        return t ? <Tag color={t.color}>{t.text}</Tag> : val;
      },
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center' as const,
      render: (val: HkApplication['status']) => {
        if (!val) return <span className="text-gray-400">--</span>;
        const s = STATUS_MAP[val];
        return s ? <Tag color={s.color}>{s.text}</Tag> : val;
      },
    },
    {
      title: '保荐人',
      dataIndex: 'sponsorName',
      key: 'sponsorName',
      width: 200,
      ellipsis: true,
      render: (text: string | null) => text || <span className="text-gray-400">--</span>,
    },
    {
      title: '募资额(HKD)',
      dataIndex: 'targetRaiseHkd',
      key: 'targetRaiseHkd',
      width: 130,
      align: 'right' as const,
      render: (val: number | null) =>
        val != null ? (
          <span className="font-mono">
            HK${(val / 100000000).toFixed(2)}亿
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      title: '发价区间',
      key: 'priceRange',
      width: 110,
      align: 'center' as const,
      render: (_: unknown, record: HkApplication) =>
        record.offerPriceMin != null && record.offerPriceMax != null ? (
          <span className="font-mono text-sm">
            ${record.offerPriceMin.toFixed(2)}-${record.offerPriceMax.toFixed(2)}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      title: 'AI评分',
      dataIndex: 'aiScore',
      key: 'aiScore',
      width: 80,
      align: 'center' as const,
      sorter: (a: HkApplication, b: HkApplication) => (a.aiScore ?? 0) - (b.aiScore ?? 0),
      render: (score: number | null) => {
        if (score == null) return <span className="text-gray-400">--</span>;
        const color = score >= 85 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f';
        return (
          <Tooltip title={`AI综合评分: ${score}/100`}>
            <div className="flex items-center justify-center gap-1">
              <svg width="32" height="32" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeDasharray={`${score}, 100`}
                  strokeLinecap="round"
                />
                <text x="18" y="20.5" textAnchor="middle" fontSize="9" fill="#333" fontWeight="bold">
                  {score}
                </text>
              </svg>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: 'DCF估值',
      dataIndex: 'dcfValuation',
      key: 'dcfValuation',
      width: 120,
      align: 'right' as const,
      render: (val: number | null) =>
        val != null ? (
          <Tooltip title={`DCF模型估值 · Powered by AIOPC`}>
            <span className="font-mono text-blue-600">
              HK${(val / 100000000).toFixed(1)}亿
            </span>
          </Tooltip>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 95,
      align: 'center' as const,
      render: (level: HkApplication['riskLevel']) => {
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
      title: 'AIOPC',
      dataIndex: 'aiopcScore',
      key: 'aiopcScore',
      width: 75,
      align: 'center' as const,
      sorter: (a: HkApplication, b: HkApplication) => (a.aiopcScore ?? 0) - (b.aiopcScore ?? 0),
      render: (score: number | null) =>
        score != null ? (
          <span className="font-bold" style={{ color: '#F0B90B' }}>
            {score.toFixed(1)}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 150,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  // ========== 操作按钮定义 ==========
  const actions: any[] = [
    {
      key: 'view',
      label: '查看',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedApp(record);
        setDetailVisible(true);
      },
    },
    ...(selectedApp?.status === 'sponsor_review' || selectedApp?.status === 'hkex_review'
      ? [
          {
            key: 'approve',
            label: '审核操作',
            icon: <AuditOutlined />,
            onClick: (record: any) => {
              Modal.confirm({
                title: '确认审核操作',
                content: `是否对 ${record.companyName} 执行审核操作？`,
                onOk: () =>
                  statusMutation.mutate({ id: record.id, newStatus: 'a1_submitted' }),
              });
            },
          },
        ]
      : []),
    {
      key: 'prospectus',
      label: '招股书',
      icon: <FileTextOutlined />,
      hidden: () => !(selectedApp?.status === 'a1_submitted' || selectedApp?.status === 'hkex_review'),
      onClick: (record: any) => {
        message.info(`查看 ${record.companyName} 的招股书管理`);
      },
    },
    {
      key: 'logs',
      label: '日志',
      icon: <HistoryOutlined />,
      onClick: (record: any) => {
        setSelectedApp(record);
        setDetailVisible(true);
      },
    },
  ];

  // ========== Steps 审核进度 ==========
  const getStepCurrent = (app: HkApplication): number => {
    const map: Record<string, number> = {
      draft: 0,
      sponsor_review: 1,
      a1_submitted: 2,
      hkex_review: 3,
      hearing: 4,
      listed: 5,
      withdrawn: -1,
      rejected: -1,
    };
    return map[app.status] ?? 0;
  };

  const getStepItems = (app: HkApplication) => [
    { title: '准备材料', description: '起草上市文件' },
    { title: '保荐审核', description: app.sponsorName || '待指定保荐人' },
    { title: 'A1递交', description: app.a1SubmitDate ? dayjs(app.a1SubmitDate).format('YYYY-MM-DD') : '待递交' },
    { title: '港交所审核', description: 'HKEX & SFC联合审查' },
    { title: '聆讯', description: app.hearingDate ? dayjs(app.hearingDate).format('YYYY-MM-DD') : '待安排' },
    { title: '挂牌', description: app.listingDate ? dayjs(app.listingDate).format('YYYY-MM-DD') : '待定' },
  ];

  // ========== 材料清单列 ==========
  const documentColumns = [
    { title: '文件名', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const map: Record<string, { color: string; text: string }> = {
          approved: { color: 'success', text: '已核准' },
          pending: { color: 'default', text: '待上传' },
          reviewing: { color: 'processing', text: '审核中' },
          rejected: { color: 'error', text: '退回' },
        };
        const item = map[s];
        return item ? <Tag color={item.color}>{item.text}</Tag> : s;
      },
    },
    { title: '上传方', dataIndex: 'uploader', key: 'uploader', width: 140 },
    { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime', width: 120 },
  ];

  // ========== 操作日志列 ==========
  const auditLogColumns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 160, render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    {
      title: '操作类型',
      dataIndex: 'actionType',
      key: 'actionType',
      width: 130,
      render: (action: string) => {
        const colorMap: Record<string, string> = {
          create: 'blue',
          sponsor_approve: 'green',
          a1_submit: 'cyan',
          hkex_query: 'orange',
          hearing_pass: 'purple',
          listing_complete: 'geekblue',
          reject: 'red',
          withdraw: 'warning',
          'ai.score_update': 'gold',
          'ai.risk_alert': 'magenta',
        };
        const labelMap: Record<string, string> = {
          create: '创建申请',
          sponsor_approve: '保荐通过',
          a1_submit: 'A1递交',
          hkex_query: '港交所问询',
          hearing_pass: '聆讯通过',
          listing_complete: '成功挂牌',
          reject: '被否决',
          withdraw: '已撤回',
          'ai.score_update': 'AI评分更新',
          'ai.risk_alert': 'AI风险预警',
        };
        return (
          <Tag color={colorMap[action] || 'default'} icon={action.startsWith('ai.') ? <ThunderboltOutlined /> : undefined}>
            {labelMap[action] || action}
          </Tag>
        );
      },
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 120 },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
  ];

  // ========== 渲染 ==========
  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* ===== 页面标题区 ===== */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-red-600 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
                香港 HK1683 交易所
                <Tag color="blue" className="text-xs">v2.0 新增</Tag>
                <Tag color="red" className="border-red-300 text-red-600" icon={<SafetyCertificateOutlined />}>
                  HK1683 上市公司
                </Tag>
              </h1>
              <p className="text-sm text-gray-500 mt-1 m-0">
                香港上市通道(IPO/SPAC/RTO/借壳) · SFC证监会监管 · HKEX港交所聆讯 · 保荐人制度 · Powered by AIOPC Super-Engine
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<ThunderboltOutlined />} className="border-yellow-400 text-yellow-600 hover:bg-yellow-50">
              AI批量评估
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              新建申请
            </Button>
            <Button icon={<DownloadOutlined />}>
              导出报告
            </Button>
          </Space>
        </div>

        {/* ===== 统计卡片 ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="申请总数" value={total} icon={<GlobalOutlined />} color="#1677FF" />
          <DataCard
            title="本月新增"
            value={thisMonthNew}
            icon={<PlusOutlined />}
            color="#52C41A"
            suffix={thisMonthNew > 0 ? `+${thisMonthNew - Math.max(0, thisMonthNew - 3)} 较上期` : undefined}
          />
          <DataCard title="处理中" value={inReviewCount} icon={<ClockCircleOutlined />} color="#F59E0B" />
          <DataCard title="已挂牌" value={listedCount} icon={<CheckCircleOutlined />} color="#7C3AED" />
          <DataCard
            title="AIOPC均分"
            value={`${avgAiopcScore.toFixed(1)}/100`}
            icon={<ThunderboltOutlined />}
            color="#F0B90B"
          />
        </div>

        {/* ===== 筛选区 ===== */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            placeholder="上市方式"
            allowClear
            style={{ width: 130 }}
            value={typeFilter === 'all' ? undefined : typeFilter}
            onChange={(v) => setTypeFilter(v || 'all')}
            options={[
              { value: 'ipo', label: 'IPO' },
              { value: 'spac', label: 'SPAC' },
              { value: 'rto', label: 'RTO' },
              { value: 'backlist', label: '借壳上市' },
            ]}
          />
          <Select
            placeholder="当前状态"
            allowClear
            style={{ width: 140 }}
            value={statusFilter === 'all' ? undefined : statusFilter}
            onChange={(v) => setStatusFilter(v || 'all')}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <Select
            placeholder="上市板块"
            allowClear
            style={{ width: 110 }}
            value={boardFilter === 'all' ? undefined : boardFilter}
            onChange={(v) => setBoardFilter(v || 'all')}
            options={[
              { value: 'main', label: '主板' },
              { value: 'gem', label: 'GEM' },
            ]}
          />
          <input
            type="text"
            placeholder="搜索编号、公司名或股票代码..."
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm w-64 focus:border-blue-500 focus:outline-none"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <Button icon={<SearchOutlined />}>搜索</Button>
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'hk-applications'] })}>
            刷新
          </Button>
        </div>

        {/* ===== 数据表格 ===== */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          loading={isLoading}
          actions={actions}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条记录` }}
        />

        {/* ===== 生态关联导航 ===== */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button size="small" type="link" icon={<LineChartOutlined />} href="/admin/quant/ipo-assessment">
            IPO综合评估
          </Button>
          <Button size="small" type="link" icon={<StarOutlined />} href="/admin/quant/token-score">
            代币评分系统
          </Button>
          <Button size="small" type="link" icon={<BankOutlined />} href="/admin/quant/enterprise-report">
            企业投研中心
          </Button>
          <Button size="small" type="link" icon={<ApartmentOutlined />} href="/admin/quant/distribution/products">
            策略分销网络
          </Button>
        </div>

        {/* ===== 详情弹窗 ===== */}
        <Modal
          title={
            selectedApp
              ? `HK上市申请详情 - ${selectedApp.applicationNo}`
              : 'HK上市申请详情'
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
            <div className="space-y-4">
              {/* 基本信息 */}
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="申请编号">{selectedApp.applicationNo}</Descriptions.Item>
                <Descriptions.Item label="公司全称">{selectedApp.companyName}</Descriptions.Item>
                <Descriptions.Item label="法定代表人">{selectedApp.legalRepresentative}</Descriptions.Item>
                <Descriptions.Item label="股票代码">
                  {selectedApp.stockCode ? (
                    <Tag color="geekblue" className="font-mono font-bold">{selectedApp.stockCode}</Tag>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="上市板块">
                  {BOARD_TYPE_MAP[selectedApp.boardType] ? (
                    <Tag color={BOARD_TYPE_MAP[selectedApp.boardType].color}>
                      {BOARD_TYPE_MAP[selectedApp.boardType].text}
                    </Tag>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="上市方式">
                  {TYPE_MAP[selectedApp.listingType] ? (
                    <Tag color={TYPE_MAP[selectedApp.listingType].color}>
                      {TYPE_MAP[selectedApp.listingType].text}
                    </Tag>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  {STATUS_MAP[selectedApp.status] ? (
                    <Tag color={STATUS_MAP[selectedApp.status].color}>
                      {STATUS_MAP[selectedApp.status].text}
                    </Tag>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="行业分类">{selectedApp.industry || '--'}</Descriptions.Item>
                <Descriptions.Item label="主保荐人">{selectedApp.sponsorName || '--'}</Descriptions.Item>
                <Descriptions.Item label="联席保荐人">
                  {selectedApp.coSponsors.length > 0 ? (
                    selectedApp.coSponsors.map((s) => <Tag key={s}>{s}</Tag>)
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="法律顾问">{selectedApp.lawFirm || '--'}</Descriptions.Item>
                <Descriptions.Item label="核数师">{selectedApp.auditor || '--'}</Descriptions.Item>
              </Descriptions>

              {/* 估值融资 */}
              <Divider orientation="left" plain>
                <BankOutlined className="mr-2" />
                估值与融资
              </Divider>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="估值(HKD)">
                  {selectedApp.valuationHkd != null ? `HK$${(selectedApp.valuationHkd / 100000000).toFixed(2)}亿` : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="DCF估值">
                  {selectedApp.dcfValuation != null ? (
                    <span className="text-blue-600 font-mono">HK${(selectedApp.dcfValuation / 100000000).toFixed(1)}亿</span>
                  ) : (
                    '--'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="目标募资额">
                  {selectedApp.targetRaiseHkd != null ? `HK$${(selectedApp.targetRaiseHkd / 100000000).toFixed(2)}亿` : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="发价区间">
                  {selectedApp.offerPriceMin != null && selectedApp.offerPriceMax != null
                    ? `$${selectedApp.offerPriceMin.toFixed(2)} - $${selectedApp.offerPriceMax.toFixed(2)}`
                    : '--'}
                </Descriptions.Item>
                <Descriptions.Item label="发行股数(百万股)">
                  {selectedApp.sharesOffered ?? '--'}
                </Descriptions.Item>
                <Descriptions.Item label="保荐费用">
                  {selectedApp.sponsorFees != null ? `HK$${(selectedApp.sponsorFees / 10000).toFixed(0)}万` : '--'}
                </Descriptions.Item>
              </Descriptions>

              {/* ★ AIOPC 综合评估 */}
              <Card
                size="small"
                title={
                  <span>
                    <ThunderboltOutlined className="mr-2 text-yellow-500" />
                    AIOPC 综合评估
                    {selectedApp.aiopcScore != null && (
                      <span className="ml-2 font-bold" style={{ color: '#F0B90B' }}>
                        {selectedApp.aiopcScore.toFixed(1)}分
                      </span>
                    )}
                  </span>
                }
                className="mt-2"
              >
                <div className="space-y-3">
                  {[
                    { label: '财务健康度', value: 78, color: '#1677FF' },
                    { label: '市场竞争力', value: selectedApp.aiScore ? selectedApp.aiScore * 0.9 : 0, color: '#52C41A' },
                    { label: '合规风险', value: selectedApp.riskLevel === 'low' ? 90 : selectedApp.riskLevel === 'medium' ? 65 : 35, color: '#F59E0B' },
                    { label: '行业前景', value: 82, color: '#7C3AED' },
                    { label: 'AIOPC技术融合度', value: selectedApp.aiopcScore ?? 0, color: '#F0B90B' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span>{item.label}</span>
                        <span className="font-mono">{item.value.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(item.value, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Divider className="my-2" />
                <div className="flex gap-4 text-xs">
                  <div className="flex-1 p-2 bg-green-50 rounded border border-green-200">
                    <div className="font-medium text-green-700 mb-1">AI 建议</div>
                    <div className="text-green-600">
                      {selectedApp.status === 'sponsor_review' &&
                        '建议保荐人尽快完成尽职调查并递交A1'}
                      {selectedApp.status === 'hkex_review' &&
                        '港交所问询回复质量良好，预计可顺利进入聆讯'}
                      {selectedApp.status === 'listed' && '已成功挂牌！建议持续监控首月流动性及股价表现'}
                      {!['sponsor_review', 'hkex_review', 'listed'].includes(selectedApp.status) &&
                        '等待进入审核流程'}
                    </div>
                  </div>
                  <div className="flex-1 p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="font-medium text-orange-700 mb-1">SFC/HKEX 关注点</div>
                    <div className="text-orange-600">
                      {selectedApp.sfcComments
                        ? selectedApp.sfcComments
                        : '暂无特殊关注事项'}
                    </div>
                  </div>
                </div>
              </Card>

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
