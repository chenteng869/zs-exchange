'use client';

/**
 * PortalSecurity - 安全中心（2026-07-19 Q05 P3.16）
 *
 * 页面定位：
 * - 中萨数字科技交易所平台安全运营中心
 * - 7 大模块：安全态势 / 账户安全 / 资产安全 / 交易安全 / 设备与会话 / 安全日志 / 应急响应
 * - 实时威胁监测 / 多因素认证 / 冷热钱包隔离 / 风控规则 / 应急冻结 / 7x24 SOC
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 10 大区块：Hero / 实时 KPI / 安全态势 / 账户安全 / 资产安全 / 交易安全 / 设备与会话 / 安全日志 / 应急响应 / 安全教育 / 底部 CTA
 * - 9+ 交互：搜索 / 排序 / Tab 切换 / 风险等级过滤 / 详情 Drawer / 操作确认 / 快捷键 / 实时过滤 / 复制
 * - 5+ Drawer：安全事件详情 / 设备详情 / 风控规则详情 / 日志详情 / 帮助快捷键
 * - 4+ 实时数据：安全评分 / 24h 拦截威胁 / 活跃会话 / 风险事件数
 * - 4+ 动画：Stagger / CountUp / Hover / Pulse / fadeInUp
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，所有威胁数据 / 设备 / 日志使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 严格规避任何高风险合规词
 * - 安全服务使用"全球领先第三方"等中性描述
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  KeySquare,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Activity,
  Globe2,
  MapPin,
  Cpu,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Server,
  Cloud,
  Database,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  Calendar,
  Users,
  UserCheck,
  UserX,
  Building2,
  Network,
  Hash,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Sparkles,
  Layers,
  Zap,
  Target,
  Radar,
  Crosshair,
  Siren,
  Bell,
  BellOff,
  BellRing,
  History,
  Settings,
  Code2,
  Terminal,
  Briefcase,
  Wallet,
  Vault,
  Coins,
  CircleDollarSign,
  Snowflake,
  Flame,
  Skull,
  Bug,
  Power,
  PowerOff,
  Scan,
  ScanFace,
  Fingerprint,
  Webhook,
  ServerCrash,
  HelpCircle,
  Keyboard,
  Compass,
  Map,
  Flag,
  BookOpen,
  GraduationCap,
  Megaphone,
  Radio,
  ShieldQuestion,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Tab = 'overview' | 'account' | 'asset' | 'transaction' | 'device' | 'log' | 'emergency';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ThreatType = 'brute-force' | 'phishing' | 'ddos' | 'malware' | 'social-engineering' | 'unauthorized-access' | 'suspicious-withdraw' | 'impossible-travel' | 'anomaly';
type AuthMethod = 'password' | 'sms' | 'totp' | 'webauthn' | 'email' | 'biometric' | 'hardware-key';
type DeviceStatus = 'active' | 'idle' | 'offline' | 'revoked' | 'pending';
type EventStatus = 'open' | 'investigating' | 'mitigated' | 'closed' | 'false-positive';
type LogSeverity = 'critical' | 'error' | 'warning' | 'info' | 'debug';
type LogCategory = 'auth' | 'transaction' | 'admin' | 'system' | 'kyc' | 'api' | 'config' | 'network';

interface ThreatEvent {
  id: string;
  type: ThreatType;
  level: RiskLevel;
  status: EventStatus;
  source: string;
  sourceCountry: string;
  flag: string;
  target: string;
  targetUser?: string;
  timestamp: string;
  description: string;
  attackVector: string;
  indicators: string[];
  mitigations: string[];
  affected: number;
}

interface AuthFactor {
  id: string;
  method: AuthMethod;
  name: string;
  enabled: boolean;
  enrolled: string;
  lastUsed?: string;
  usageCount: number;
  strength: 'weak' | 'medium' | 'strong' | 'enterprise';
  description: string;
  recommendations: string[];
}

interface AssetProtection {
  id: string;
  category: 'hot-wallet' | 'cold-wallet' | 'multisig' | 'insurance' | 'audit' | 'isolation';
  name: string;
  coverage: string;
  status: 'live' | 'monitoring' | 'review' | 'planned';
  description: string;
  metrics: { label: string; value: string }[];
  highlights: string[];
}

interface RiskRule {
  id: string;
  name: string;
  category: 'withdraw' | 'login' | 'trade' | 'kyc' | 'velocity' | 'geo' | 'device' | 'amount';
  level: RiskLevel;
  enabled: boolean;
  triggerCount24h: number;
  blockCount24h: number;
  description: string;
  conditions: string[];
  actions: string[];
  lastTriggered: string;
  owner: string;
}

interface Device {
  id: string;
  type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  ip: string;
  location: string;
  country: string;
  flag: string;
  status: DeviceStatus;
  trusted: boolean;
  lastActive: string;
  firstSeen: string;
  sessionCount: number;
  fingerprint: string;
}

interface AuditLog {
  id: string;
  category: LogCategory;
  severity: LogSeverity;
  action: string;
  actor: string;
  actorRole: 'user' | 'admin' | 'system' | 'api';
  resource: string;
  resourceType: string;
  result: 'success' | 'failure' | 'blocked';
  ip: string;
  location: string;
  userAgent: string;
  timestamp: string;
  details: string;
  hash: string;
}

interface EmergencyAction {
  id: string;
  name: string;
  category: 'freeze' | 'revoke' | 'block' | 'isolate' | 'communicate' | 'recover';
  level: RiskLevel;
  responseTime: string;
  available24x7: boolean;
  description: string;
  procedure: string[];
  requirements: string[];
  contacts: { name: string; role: string; channel: string }[];
}

interface SecurityTip {
  id: string;
  title: string;
  category: 'phishing' | 'password' | 'network' | 'device' | 'social' | 'transaction';
  severity: RiskLevel;
  description: string;
  steps: string[];
  readTime: number;
}

interface DrawerState {
  open: boolean;
  type: 'threat' | 'device' | 'rule' | 'log' | 'factor' | 'asset' | 'action' | 'tip' | 'help' | null;
  payload: string | null;
}

interface KpiSnapshot {
  securityScore: number;
  threatsBlocked: number;
  activeSessions: number;
  riskEvents: number;
  uptime: number;
  mfaCoverage: number;
  coldRatio: number;
  auditPass: number;
}

// ============== Mock 数据 ==============

const THREATS: ThreatEvent[] = [
  {
    id: 't-001',
    type: 'brute-force',
    level: 'high',
    status: 'mitigated',
    source: '203.0.113.45',
    sourceCountry: '俄罗斯',
    flag: '🇷🇺',
    target: '/api/v1/auth/login',
    targetUser: '匿名',
    timestamp: '2026-07-19 14:23:18',
    description: '检测到对登录接口的高频暴力破解尝试，源 IP 来自已被列入威胁情报库的地址段。',
    attackVector: '字典攻击 + 凭证填充',
    indicators: ['高频失败请求 (32次/秒)', 'User-Agent 异常', '关联 5 个已知攻击者 IP'],
    mitigations: ['自动触发 IP 限速', '动态验证码强制', '威胁情报黑名单拦截'],
    affected: 1,
  },
  {
    id: 't-002',
    type: 'phishing',
    level: 'critical',
    status: 'investigating',
    source: '钓鱼站点仿冒',
    sourceCountry: '未知',
    flag: '🌐',
    target: '客户登录页',
    targetUser: '3 名用户报告',
    timestamp: '2026-07-19 13:45:02',
    description: '外部钓鱼站点仿冒中萨数字科技交易所登录页，已启动反钓鱼应急流程。',
    attackVector: '域名仿冒 + 邮件投递',
    indicators: ['相似域名 zsdex-login[.]com', 'TLS 证书异常', '3 名用户报告可疑邮件'],
    mitigations: ['反钓鱼联盟联动', '邮件通道告警', '用户教育推送'],
    affected: 3,
  },
  {
    id: 't-003',
    type: 'ddos',
    level: 'high',
    status: 'mitigated',
    source: '203.0.113.0/24',
    sourceCountry: '多地区',
    flag: '🌍',
    target: 'Web 入口',
    targetUser: '全体用户',
    timestamp: '2026-07-19 12:08:51',
    description: '7 层 DDoS 攻击峰值 1.2Tbps，由 CDN 防护自动清洗，未影响业务可用性。',
    attackVector: 'HTTP Flood + Slowloris',
    indicators: ['峰值 QPS 580K', '来源 IP 分散 132 个国家/地区', 'User-Agent 异常率 78%'],
    mitigations: ['CDN 自动清洗', 'Anycast 流量调度', 'JS Challenge 验证'],
    affected: 0,
  },
  {
    id: 't-004',
    type: 'impossible-travel',
    level: 'medium',
    status: 'closed',
    source: '198.51.100.78',
    sourceCountry: '巴西',
    flag: '🇧🇷',
    target: '用户账户',
    targetUser: 'user-72***',
    timestamp: '2026-07-19 11:30:24',
    description: '用户账户在 2 小时内于巴西、芬兰两地登录，已要求二次验证并确认为本人。',
    attackVector: '凭证泄露 + 异地登录',
    indicators: ['地理距离 > 11000km', '时间窗口 < 2h', '设备指纹不一致'],
    mitigations: ['强制 WebAuthn 二次验证', '会话自动失效', '用户通知'],
    affected: 1,
  },
  {
    id: 't-005',
    type: 'suspicious-withdraw',
    level: 'high',
    status: 'mitigated',
    source: '内部',
    sourceCountry: '内部',
    flag: '🏛️',
    target: '提现风控',
    targetUser: 'user-46***',
    timestamp: '2026-07-19 10:18:09',
    description: '检测到凌晨大额 USDT 提现请求，金额显著高于用户历史均值，已自动暂停并人工复核。',
    attackVector: '账户被盗用 + 资金外逃',
    indicators: ['金额 12.5x 历史均值', '凌晨 2-5 点时段', '新设备 + 新 IP'],
    mitigations: ['风控规则自动暂停', '人工复核通道', '用户紧急核实'],
    affected: 0,
  },
  {
    id: 't-006',
    type: 'social-engineering',
    level: 'medium',
    status: 'closed',
    source: '假冒客服',
    sourceCountry: '未知',
    flag: '🌐',
    target: '客服通道',
    targetUser: '2 名用户报告',
    timestamp: '2026-07-19 09:42:15',
    description: '外部假冒客服诱骗用户泄露验证码，用户已识别并报告，反诈联盟联动处理。',
    attackVector: '电话 + 即时通讯冒充',
    indicators: ['非官方联系方式', '要求提供验证码', '催促性话术'],
    mitigations: ['官方公告', '用户教育', '举报通道开放'],
    affected: 0,
  },
  {
    id: 't-007',
    type: 'unauthorized-access',
    level: 'critical',
    status: 'mitigated',
    source: '192.0.2.15',
    sourceCountry: '韩国',
    flag: '🇰🇷',
    target: '管理后台',
    targetUser: 'admin-001',
    timestamp: '2026-07-19 08:55:30',
    description: '尝试使用泄露的旧管理员凭证访问后台，被 MFA + 设备白名单阻断。',
    attackVector: '凭证填充',
    indicators: ['历史泄露数据库匹配', 'MFA 缺失自动阻断', '设备指纹不在白名单'],
    mitigations: ['MFA 强制', '设备白名单', '凭证泄露监控'],
    affected: 0,
  },
  {
    id: 't-008',
    type: 'anomaly',
    level: 'low',
    status: 'false-positive',
    source: '203.0.113.99',
    sourceCountry: '美国',
    flag: '🇺🇸',
    target: 'API 网关',
    targetUser: 'user-15***',
    timestamp: '2026-07-19 07:30:11',
    description: 'API 调用频率异常，自动触发限速，确认后为用户量化机器人正常调频。',
    attackVector: '自动化脚本',
    indicators: ['QPS 突破阈值', '相同 API Key', '业务白名单内'],
    mitigations: ['白名单调频', '业务确认', '限速规则保留'],
    affected: 0,
  },
];

const FACTORS: AuthFactor[] = [
  {
    id: 'f-password',
    method: 'password',
    name: '登录密码',
    enabled: true,
    enrolled: '2024-05-12',
    lastUsed: '2026-07-19 14:20',
    usageCount: 432,
    strength: 'medium',
    description: '基础登录凭证，建议 12 位以上 + 大小写 + 符号 + 数字组合。',
    recommendations: ['启用 2FA 多因素认证', '使用密码管理器', '避免跨平台重复使用'],
  },
  {
    id: 'f-sms',
    method: 'sms',
    name: '短信验证码',
    enabled: true,
    enrolled: '2024-05-12',
    lastUsed: '2026-07-19 09:15',
    usageCount: 86,
    strength: 'weak',
    description: '通过手机短信接收一次性验证码，可作为辅助登录方式。',
    recommendations: ['SIM 卡交换风险', '建议升级为 TOTP 或 WebAuthn'],
  },
  {
    id: 'f-totp',
    method: 'totp',
    name: '动态口令 (TOTP)',
    enabled: true,
    enrolled: '2024-06-08',
    lastUsed: '2026-07-19 14:23',
    usageCount: 256,
    strength: 'strong',
    description: '基于时间的一次性密码，30 秒刷新，兼容 Google Authenticator、Authy 等。',
    recommendations: ['妥善保管恢复码', '定期更换认证设备'],
  },
  {
    id: 'f-webauthn',
    method: 'webauthn',
    name: '硬件安全密钥 (WebAuthn)',
    enabled: false,
    enrolled: '',
    usageCount: 0,
    strength: 'enterprise',
    description: '基于 FIDO2/WebAuthn 的硬件密钥，支持 YubiKey、Touch ID、Face ID 等。',
    recommendations: ['推荐高净值用户启用', '与密码组合可抗钓鱼'],
  },
  {
    id: 'f-email',
    method: 'email',
    name: '邮箱验证',
    enabled: true,
    enrolled: '2024-05-12',
    lastUsed: '2026-07-19 12:45',
    usageCount: 152,
    strength: 'medium',
    description: '通过注册邮箱接收验证码，作为辅助验证手段。',
    recommendations: ['确保邮箱密码独立', '启用邮箱 MFA'],
  },
  {
    id: 'f-biometric',
    method: 'biometric',
    name: '生物特征认证',
    enabled: true,
    enrolled: '2024-07-20',
    lastUsed: '2026-07-19 14:18',
    usageCount: 312,
    strength: 'strong',
    description: '基于设备生物特征的快速认证（指纹、Face ID），仅存储于本机安全芯片。',
    recommendations: ['仅在本人设备启用', '定期复核设备列表'],
  },
];

const ASSETS: AssetProtection[] = [
  {
    id: 'a-hot',
    category: 'hot-wallet',
    name: '热钱包 - 多签管理',
    coverage: '日常提现热钱包 100% 多签管理',
    status: 'live',
    description: '热钱包采用 2/3 多签 + 时间锁机制，覆盖日常提现需求，所有签名操作留痕可审计。',
    metrics: [
      { label: '签名阈值', value: '2/3' },
      { label: '时间锁', value: '24h' },
      { label: '可用余额', value: '< 5% 总资产' },
      { label: '签名节点', value: '5 区域分布' },
    ],
    highlights: ['多签强制', '时间锁兜底', '5 区域节点', '24h 监控'],
  },
  {
    id: 'a-cold',
    category: 'cold-wallet',
    name: '冷钱包 - 离线隔离',
    coverage: '95% 用户资产离线冷存储',
    status: 'live',
    description: '冷钱包采用完全离线隔离 + 地理分布式备份，覆盖平台 95% 以上用户资产。',
    metrics: [
      { label: '离线设备', value: '12 台' },
      { label: '地理分布', value: '4 大洲 7 城市' },
      { label: '冷存储比例', value: '95%+' },
      { label: '审计频率', value: '月度第三方' },
    ],
    highlights: ['完全离线', '地理分布', '物理防护', '月审计'],
  },
  {
    id: 'a-multisig',
    category: 'multisig',
    name: '多签治理',
    coverage: '所有冷热钱包多签覆盖',
    status: 'live',
    description: '基于行业最佳实践的多签治理方案，关键操作需多名独立持签人协同签名。',
    metrics: [
      { label: '签名策略', value: '3/5 / 4/7' },
      { label: '持签人', value: '12 名独立' },
      { label: '签名延迟', value: '24h 时间锁' },
      { label: '审计追溯', value: '全量留痕' },
    ],
    highlights: ['独立持签', '时间锁', '全量留痕', '季度演练'],
  },
  {
    id: 'a-insurance',
    category: 'insurance',
    name: '保险基金',
    coverage: '热钱包资产 100% 保险覆盖',
    status: 'live',
    description: '与全球领先第三方保险机构合作，为热钱包资产提供保险覆盖。',
    metrics: [
      { label: '覆盖比例', value: '100% 热钱包' },
      { label: '保单金额', value: '美元千万级' },
      { label: '再保险', value: 'Lloyds of London' },
      { label: '赔付响应', value: '< 30 天' },
    ],
    highlights: ['千万级保额', '劳合社再保险', '30 天赔付', '公开保单'],
  },
  {
    id: 'a-audit',
    category: 'audit',
    name: '第三方审计',
    coverage: '储备金 1:1 证明月度审计',
    status: 'monitoring',
    description: '由全球领先第三方审计机构按月进行储备金 1:1 审计，并发布 Merkle Tree 证明。',
    metrics: [
      { label: '审计频率', value: '月度' },
      { label: '审计机构', value: '全球领先第三方' },
      { label: '审计方法', value: 'Merkle Tree + 链上验证' },
      { label: '公开报告', value: '100% 公开' },
    ],
    highlights: ['月度审计', 'Merkle 证明', '链上可验', '公开报告'],
  },
  {
    id: 'a-isolation',
    category: 'isolation',
    name: '用户资产隔离',
    coverage: '用户资产与平台资产完全隔离',
    status: 'live',
    description: '用户资产与平台自有资产完全隔离记账，确保破产隔离。',
    metrics: [
      { label: '账户结构', value: '用户独立子账户' },
      { label: '破产隔离', value: '100% 隔离' },
      { label: '审计追溯', value: '链上可查' },
      { label: '披露频率', value: '实时' },
    ],
    highlights: ['子账户隔离', '破产保护', '链上可查', '实时披露'],
  },
];

const RULES: RiskRule[] = [
  {
    id: 'r-001',
    name: '大额提现强制人工复核',
    category: 'withdraw',
    level: 'high',
    enabled: true,
    triggerCount24h: 28,
    blockCount24h: 3,
    description: '当单笔提现金额超过阈值时，自动暂停并触发人工复核流程。',
    conditions: ['单笔 ≥ 50,000 USDT 等值', '新设备 + 24h 内首次', '金额 5x 历史均值'],
    actions: ['自动暂停交易', '触发人工复核', '用户紧急核实', '会话冻结'],
    lastTriggered: '2026-07-19 10:18',
    owner: '风控组 - 提现',
  },
  {
    id: 'r-002',
    name: '异地异常登录',
    category: 'geo',
    level: 'medium',
    enabled: true,
    triggerCount24h: 56,
    blockCount24h: 4,
    description: '检测到 2 小时内不同地理距离登录时，强制二次验证。',
    conditions: ['地理距离 > 8000km', '时间窗口 < 2h', '设备不一致'],
    actions: ['强制 WebAuthn', '会话失效', '用户通知'],
    lastTriggered: '2026-07-19 11:30',
    owner: '风控组 - 登录',
  },
  {
    id: 'r-003',
    name: '高频失败登录限速',
    category: 'login',
    level: 'medium',
    enabled: true,
    triggerCount24h: 1240,
    blockCount24h: 89,
    description: '对登录失败次数超阈值的源 IP 实施动态限速和验证码强制。',
    conditions: ['5 分钟内失败 ≥ 10 次', '同 IP 或同子网', 'User-Agent 异常'],
    actions: ['IP 限速', '强制验证码', '威胁情报联动'],
    lastTriggered: '2026-07-19 14:23',
    owner: '风控组 - 登录',
  },
  {
    id: 'r-004',
    name: '异常交易速度监控',
    category: 'velocity',
    level: 'high',
    enabled: true,
    triggerCount24h: 67,
    blockCount24h: 5,
    description: '对短时间内频繁交易、异常下单模式进行实时监控。',
    conditions: ['1h 内 ≥ 50 笔交易', '金额分布异常', '与历史画像偏离'],
    actions: ['限速', '人工审查', '账户冻结'],
    lastTriggered: '2026-07-19 13:50',
    owner: '风控组 - 交易',
  },
  {
    id: 'r-005',
    name: 'API 高频调用限频',
    category: 'amount',
    level: 'medium',
    enabled: true,
    triggerCount24h: 312,
    blockCount24h: 18,
    description: '对 API 调用频率超阈值的 Key 实施动态限频。',
    conditions: ['超过订阅等级 QPS', '错误率突增', '非业务时段高频'],
    actions: ['限频', '通知', 'Key 暂停'],
    lastTriggered: '2026-07-19 14:10',
    owner: '风控组 - API',
  },
  {
    id: 'r-006',
    name: '设备指纹白名单',
    category: 'device',
    level: 'low',
    enabled: true,
    triggerCount24h: 89,
    blockCount24h: 0,
    description: '对未在白名单的设备实施强制 WebAuthn 二次验证。',
    conditions: ['设备指纹未在白名单', '首次访问', '敏感操作触发'],
    actions: ['WebAuthn 强制', '设备登记', '白名单更新'],
    lastTriggered: '2026-07-19 14:20',
    owner: '风控组 - 设备',
  },
  {
    id: 'r-007',
    name: 'KYC 不完整时提现阻断',
    category: 'kyc',
    level: 'high',
    enabled: true,
    triggerCount24h: 12,
    blockCount24h: 12,
    description: 'KYC 不完整或过期时，禁止提现。',
    conditions: ['KYC 等级 < L2', 'KYC 过期', '证件失效'],
    actions: ['提现阻断', '引导补全 KYC', '到期提醒'],
    lastTriggered: '2026-07-19 09:30',
    owner: '风控组 - 合规',
  },
  {
    id: 'r-008',
    name: '可疑地址黑名单',
    category: 'amount',
    level: 'critical',
    enabled: true,
    triggerCount24h: 5,
    blockCount24h: 5,
    description: '对接收地址为已知黑名单（如被盗资金、混币器）的交易自动阻断。',
    conditions: ['Chainalysis 标记', 'OFAC 制裁匹配', '混币器关联'],
    actions: ['交易阻断', '法务联动', '用户问询'],
    lastTriggered: '2026-07-19 08:45',
    owner: '风控组 - 合规',
  },
];

const DEVICES: Device[] = [
  {
    id: 'd-001',
    type: 'mobile',
    os: 'iOS 17.5',
    browser: 'Safari 17',
    ip: '203.0.113.21',
    location: '上海',
    country: '中国',
    flag: '🇨🇳',
    status: 'active',
    trusted: true,
    lastActive: '2026-07-19 14:23',
    firstSeen: '2024-05-12',
    sessionCount: 412,
    fingerprint: 'fp:0a3b8c...',
  },
  {
    id: 'd-002',
    type: 'desktop',
    os: 'macOS 14.5',
    browser: 'Chrome 126',
    ip: '203.0.113.89',
    location: '北京',
    country: '中国',
    flag: '🇨🇳',
    status: 'active',
    trusted: true,
    lastActive: '2026-07-19 14:18',
    firstSeen: '2024-06-20',
    sessionCount: 286,
    fingerprint: 'fp:1b9d2e...',
  },
  {
    id: 'd-003',
    type: 'mobile',
    os: 'Android 14',
    browser: 'Chrome Mobile 126',
    ip: '198.51.100.45',
    location: '深圳',
    country: '中国',
    flag: '🇨🇳',
    status: 'idle',
    trusted: true,
    lastActive: '2026-07-19 09:15',
    firstSeen: '2024-09-08',
    sessionCount: 78,
    fingerprint: 'fp:2c8f4a...',
  },
  {
    id: 'd-004',
    type: 'desktop',
    os: 'Windows 11',
    browser: 'Edge 126',
    ip: '198.51.100.122',
    location: '杭州',
    country: '中国',
    flag: '🇨🇳',
    status: 'offline',
    trusted: true,
    lastActive: '2026-07-18 22:45',
    firstSeen: '2024-11-12',
    sessionCount: 56,
    fingerprint: 'fp:3d1e7b...',
  },
  {
    id: 'd-005',
    type: 'mobile',
    os: 'iOS 16.7',
    browser: 'Safari Mobile 16',
    ip: '192.0.2.78',
    location: 'Singapore',
    country: '新加坡',
    flag: '🇸🇬',
    status: 'active',
    trusted: false,
    lastActive: '2026-07-19 11:30',
    firstSeen: '2026-07-19 11:30',
    sessionCount: 1,
    fingerprint: 'fp:4e2c8a...',
  },
  {
    id: 'd-006',
    type: 'tablet',
    os: 'iPadOS 17',
    browser: 'Safari 17',
    ip: '203.0.113.156',
    location: '广州',
    country: '中国',
    flag: '🇨🇳',
    status: 'revoked',
    trusted: false,
    lastActive: '2026-07-15 16:20',
    firstSeen: '2024-08-05',
    sessionCount: 24,
    fingerprint: 'fp:5f3d9c...',
  },
];

const LOGS: AuditLog[] = [
  {
    id: 'l-001',
    category: 'auth',
    severity: 'info',
    action: 'LOGIN_SUCCESS',
    actor: 'user-72***',
    actorRole: 'user',
    resource: '会话',
    resourceType: 'session',
    result: 'success',
    ip: '203.0.113.21',
    location: '上海 / 中国',
    userAgent: 'Safari/17 (iOS 17.5)',
    timestamp: '2026-07-19 14:23:18',
    details: '通过 WebAuthn 验证登录，会话持续 3600s。',
    hash: '0x8a3b9c...',
  },
  {
    id: 'l-002',
    category: 'transaction',
    severity: 'warning',
    action: 'WITHDRAW_LARGE_HOLD',
    actor: 'user-46***',
    actorRole: 'user',
    resource: '提现订单 #WD-2026071900089',
    resourceType: 'withdraw',
    result: 'blocked',
    ip: '203.0.113.21',
    location: '上海 / 中国',
    userAgent: 'Safari/17 (iOS 17.5)',
    timestamp: '2026-07-19 10:18:09',
    details: '提现金额 250,000 USDT，触发大额风控规则，自动暂停。',
    hash: '0x1b7d2e...',
  },
  {
    id: 'l-003',
    category: 'admin',
    severity: 'critical',
    action: 'ADMIN_LOGIN_BLOCKED',
    actor: 'admin-attacker',
    actorRole: 'api',
    resource: '管理后台',
    resourceType: 'admin',
    result: 'blocked',
    ip: '192.0.2.15',
    location: '首尔 / 韩国',
    userAgent: 'curl/8.4.0',
    timestamp: '2026-07-19 08:55:30',
    details: '尝试使用泄露凭证访问后台，被 MFA + 设备白名单阻断。',
    hash: '0x2c8f4a...',
  },
  {
    id: 'l-004',
    category: 'kyc',
    severity: 'info',
    action: 'KYC_LEVEL_UP',
    actor: 'user-23***',
    actorRole: 'user',
    resource: 'KYC L1 → L2',
    resourceType: 'kyc',
    result: 'success',
    ip: '203.0.113.89',
    location: '北京 / 中国',
    userAgent: 'Chrome/126 (macOS 14)',
    timestamp: '2026-07-19 08:30:12',
    details: '用户完成证件 + 人脸双重验证，KYC 等级升级至 L2。',
    hash: '0x3d1e7b...',
  },
  {
    id: 'l-005',
    category: 'api',
    severity: 'warning',
    action: 'API_RATE_LIMITED',
    actor: 'api-key-1***',
    actorRole: 'api',
    resource: 'REST /v1/orders',
    resourceType: 'api',
    result: 'blocked',
    ip: '198.51.100.45',
    location: '深圳 / 中国',
    userAgent: 'python-requests/2.32',
    timestamp: '2026-07-19 14:10:45',
    details: 'API Key 超过订阅等级 QPS，自动限频 60s。',
    hash: '0x4e2c8a...',
  },
  {
    id: 'l-006',
    category: 'system',
    severity: 'info',
    action: 'BACKUP_SUCCESS',
    actor: 'system',
    actorRole: 'system',
    resource: '冷钱包备份',
    resourceType: 'backup',
    result: 'success',
    ip: '10.0.0.1',
    location: '内部',
    userAgent: 'system',
    timestamp: '2026-07-19 03:00:00',
    details: '冷钱包地理分布式备份任务执行成功，备份至 4 大洲 7 城市。',
    hash: '0x5f3d9c...',
  },
  {
    id: 'l-007',
    category: 'config',
    severity: 'warning',
    action: 'RISK_RULE_DISABLED',
    actor: 'admin-rsk-001',
    actorRole: 'admin',
    resource: '风控规则 r-008',
    resourceType: 'rule',
    result: 'success',
    ip: '10.0.1.15',
    location: '内部',
    userAgent: 'Admin Console',
    timestamp: '2026-07-19 02:30:22',
    details: '管理员因维护需要临时禁用规则，已记录审计。',
    hash: '0x6a4e1b...',
  },
  {
    id: 'l-008',
    category: 'network',
    severity: 'error',
    action: 'CDN_NODE_DEGRADED',
    actor: 'system',
    actorRole: 'system',
    resource: 'CDN 节点 ap-shanghai-3',
    resourceType: 'cdn',
    result: 'failure',
    ip: '10.0.2.5',
    location: '内部',
    userAgent: 'system',
    timestamp: '2026-07-19 01:15:08',
    details: 'CDN 节点性能降级，已自动切换至备用节点，5 分钟后恢复。',
    hash: '0x7b5f2c...',
  },
  {
    id: 'l-009',
    category: 'auth',
    severity: 'warning',
    action: 'MFA_CHALLENGE',
    actor: 'user-15***',
    actorRole: 'user',
    resource: 'WebAuthn',
    resourceType: 'mfa',
    result: 'success',
    ip: '198.51.100.78',
    location: '圣保罗 / 巴西',
    userAgent: 'Chrome/126 (Windows 11)',
    timestamp: '2026-07-19 11:30:24',
    details: '异地登录触发 WebAuthn 二次验证，用户成功通过。',
    hash: '0x8c6a3d...',
  },
  {
    id: 'l-010',
    category: 'transaction',
    severity: 'info',
    action: 'TRADE_EXECUTED',
    actor: 'user-72***',
    actorRole: 'user',
    resource: 'BTC/USDT 订单',
    resourceType: 'order',
    result: 'success',
    ip: '203.0.113.21',
    location: '上海 / 中国',
    userAgent: 'Safari/17 (iOS 17.5)',
    timestamp: '2026-07-19 14:25:08',
    details: '限价单成交 0.05 BTC @ 65,420 USDT。',
    hash: '0x9d7b4e...',
  },
];

const ACTIONS: EmergencyAction[] = [
  {
    id: 'e-freeze',
    name: '紧急账户冻结',
    category: 'freeze',
    level: 'critical',
    responseTime: '< 5 分钟',
    available24x7: true,
    description: '当用户账户出现被盗用、可疑登录等紧急情况时，可立即冻结账户所有操作。',
    procedure: ['用户电话/邮件/在线客服申请', '身份核实', '自动冻结所有操作', '发送确认通知', '进入人工复核流程'],
    requirements: ['账户实名认证', 'KYC L2 及以上', '近 7 天登录记录'],
    contacts: [
      { name: '7x24 客服热线', role: '紧急受理', channel: '400-888-****' },
      { name: '紧急冻结邮箱', role: '紧急受理', channel: 'freeze@zsdex.com' },
    ],
  },
  {
    id: 'e-revoke',
    name: '会话与设备撤销',
    category: 'revoke',
    level: 'high',
    responseTime: '< 1 分钟',
    available24x7: true,
    description: '一键撤销所有当前会话、API Key、设备授权，强制用户重新认证。',
    procedure: ['用户安全中心触发', '撤销全部会话', '撤销 API Key', '撤销设备授权', '推送通知'],
    requirements: ['登录态验证', 'WebAuthn 二次验证'],
    contacts: [
      { name: '安全中心', role: '自助', channel: '/security/device' },
    ],
  },
  {
    id: 'e-block',
    name: '提现紧急阻断',
    category: 'block',
    level: 'critical',
    responseTime: '< 1 分钟',
    available24x7: true,
    description: '当出现大额异常提现时，可一键阻断所有提现请求。',
    procedure: ['触发风控规则', '自动暂停提现', '人工复核', '用户核实', '解冻/确认'],
    requirements: ['自动风控触发', '人工复核通道'],
    contacts: [
      { name: '风控中心', role: '自动', channel: '实时监控' },
    ],
  },
  {
    id: 'e-isolate',
    name: '网络隔离',
    category: 'isolate',
    level: 'critical',
    responseTime: '< 5 分钟',
    available24x7: true,
    description: '对特定 IP、子网、地区实施网络访问隔离。',
    procedure: ['威胁情报确认', '策略下发', '边界节点隔离', '监控', '复盘解除'],
    requirements: ['威胁情报确认', '安全运维授权'],
    contacts: [
      { name: 'SOC 安全运营', role: '7x24', channel: 'soc@zsdex.com' },
    ],
  },
  {
    id: 'e-communicate',
    name: '安全公告推送',
    category: 'communicate',
    level: 'high',
    responseTime: '< 30 分钟',
    available24x7: true,
    description: '通过站内公告、邮件、短信等渠道向用户推送安全公告。',
    procedure: ['安全事件确认', '公告文案审核', '多通道推送', '回执统计', '后续跟进'],
    requirements: ['事件分级评估', '合规审查'],
    contacts: [
      { name: '公告发布系统', role: '运营', channel: 'admin/announcement' },
    ],
  },
  {
    id: 'e-recover',
    name: '账户与资产恢复',
    category: 'recover',
    level: 'high',
    responseTime: '< 24 小时',
    available24x7: true,
    description: '对冻结或受损账户提供资产追回、恢复访问的完整支持。',
    procedure: ['事件评估', '资产链上追踪', '资产冻结/追回', '身份核实', '恢复访问'],
    requirements: ['完整事件记录', 'KYC 资料', '链上证据'],
    contacts: [
      { name: '资产恢复组', role: '专项小组', channel: 'recovery@zsdex.com' },
    ],
  },
];

const TIPS: SecurityTip[] = [
  {
    id: 'tip-001',
    title: '识别钓鱼邮件与仿冒网站',
    category: 'phishing',
    severity: 'high',
    description: '钓鱼攻击是加密资产领域最常见的入侵手段，学会识别钓鱼特征可避免 90% 以上的损失。',
    steps: [
      '核实发件人邮箱完整域名，注意相似字符替换',
      '不要点击邮件中的链接，手动输入网址',
      '检查网站 TLS 证书与备案信息',
      '警惕任何要求输入验证码、密码的请求',
      '启用邮件反钓鱼插件',
    ],
    readTime: 3,
  },
  {
    id: 'tip-002',
    title: '构建强密码策略',
    category: 'password',
    severity: 'medium',
    description: '密码是账户安全的第一道防线，弱密码是导致账户被盗的最常见原因。',
    steps: [
      '使用 12 位以上密码，包含大小写、数字、符号',
      '不同平台使用不同密码',
      '使用密码管理器（如 1Password、Bitwarden）',
      '启用 2FA 多因素认证',
      '定期更换关键账户密码',
    ],
    readTime: 4,
  },
  {
    id: 'tip-003',
    title: '公共 Wi-Fi 安全使用',
    category: 'network',
    severity: 'medium',
    description: '公共网络环境下，中间人攻击风险显著增加，需采取额外防护。',
    steps: [
      '避免在公共 Wi-Fi 下进行交易/登录',
      '使用可信 VPN 加密通信',
      '关闭设备自动连接',
      '使用手机热点替代公共网络',
      '启用浏览器 HSTS 强制 HTTPS',
    ],
    readTime: 3,
  },
  {
    id: 'tip-004',
    title: '设备安全管理',
    category: 'device',
    severity: 'medium',
    description: '终端设备是账户安全的关键节点，需保持良好的设备管理习惯。',
    steps: [
      '保持操作系统和浏览器最新',
      '启用设备全盘加密',
      '安装可信防病毒软件',
      '定期检查设备列表并撤销可疑设备',
      '丢失设备立即远程擦除 + 撤销会话',
    ],
    readTime: 4,
  },
  {
    id: 'tip-005',
    title: '防范社交工程攻击',
    category: 'social',
    severity: 'high',
    description: '社交工程利用人性弱点（信任、恐惧、贪婪）实施攻击，技术防护难以完全拦截。',
    steps: [
      '警惕任何要求紧急操作的请求',
      '官方人员不会索要验证码、密码',
      '通过官方渠道二次核实可疑请求',
      '不要向陌生人透露资产信息',
      '举报可疑行为',
    ],
    readTime: 3,
  },
  {
    id: 'tip-006',
    title: '大额交易安全实践',
    category: 'transaction',
    severity: 'critical',
    description: '大额交易是攻击者的主要目标，需采取多重验证和保护措施。',
    steps: [
      '启用硬件安全密钥（WebAuthn）',
      '设置大额提现白名单地址',
      '使用多签钱包分散风险',
      '分批交易而非一次性大额',
      '提现前通过官方 APP 二次确认',
    ],
    readTime: 5,
  },
];

// ============== Helper ==============

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString('zh-CN');
}

function timeAgo(ts: string): string {
  const m = ts.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (!m) return ts;
  return `${m[1]}:${m[2]}`;
}

// ============== 组件 ==============

export function PortalSecurity() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<RiskLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ThreatType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'level' | 'affected'>('time');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [drawer, setDrawer] = useState<DrawerState>({ open: false, type: null, payload: null });
  const [helpOpen, setHelpOpen] = useState(false);
  const [tipFilter, setTipFilter] = useState<string>('all');
  const [logCat, setLogCat] = useState<LogCategory | 'all'>('all');
  const [logSev, setLogSev] = useState<LogSeverity | 'all'>('all');
  const [kpi, setKpi] = useState<KpiSnapshot>({
    securityScore: 96,
    threatsBlocked: 1284,
    activeSessions: 4521,
    riskEvents: 8,
    uptime: 99.987,
    mfaCoverage: 87.5,
    coldRatio: 95.2,
    auditPass: 100,
  });
  const [liveThreats, setLiveThreats] = useState<ThreatEvent[]>(THREATS.slice(0, 6));
  const searchRef = useRef<HTMLInputElement>(null);

  // 实时数据波动
  useEffect(() => {
    const t = setInterval(() => {
      setKpi((p) => ({
        ...p,
        securityScore: Math.min(100, Math.max(85, p.securityScore + (Math.random() > 0.5 ? 1 : -1))),
        threatsBlocked: p.threatsBlocked + Math.floor(Math.random() * 5) + 1,
        activeSessions: Math.max(4000, p.activeSessions + Math.floor(Math.random() * 21) - 10),
        riskEvents: Math.max(0, p.riskEvents + (Math.random() > 0.85 ? 1 : 0) - (Math.random() > 0.92 ? 1 : 0)),
      }));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // 实时威胁流入
  useEffect(() => {
    const t = setInterval(() => {
      const candidates = THREATS;
      const next = candidates[Math.floor(Math.random() * candidates.length)];
      setLiveThreats((p) => {
        if (p.find((x) => x.id === next.id)) return p;
        return [next, ...p.slice(0, 5)];
      });
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (helpOpen) setHelpOpen(false);
        else if (drawer.open) setDrawer({ open: false, type: null, payload: null });
      } else if (e.key === '?') {
        setHelpOpen(true);
      } else if (e.key === '1') setTab('overview');
      else if (e.key === '2') setTab('account');
      else if (e.key === '3') setTab('asset');
      else if (e.key === '4') setTab('transaction');
      else if (e.key === '5') setTab('device');
      else if (e.key === '6') setTab('log');
      else if (e.key === '7') setTab('emergency');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drawer.open, helpOpen]);

  // 过滤 / 排序
  const filteredThreats = useMemo(() => {
    return liveThreats
      .filter((x) => (levelFilter === 'all' ? true : x.level === levelFilter))
      .filter((x) => (typeFilter === 'all' ? true : x.type === typeFilter))
      .filter((x) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          x.id.toLowerCase().includes(q) ||
          x.source.toLowerCase().includes(q) ||
          x.description.toLowerCase().includes(q) ||
          x.target.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'time') return dir * a.timestamp.localeCompare(b.timestamp);
        if (sortBy === 'level') {
          const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;
          return dir * (order[a.level] - order[b.level]);
        }
        return dir * (a.affected - b.affected);
      });
  }, [liveThreats, levelFilter, typeFilter, search, sortBy, sortDir]);

  const filteredLogs = useMemo(() => {
    return LOGS.filter((l) => (logCat === 'all' ? true : l.category === logCat))
      .filter((l) => (logSev === 'all' ? true : l.severity === logSev))
      .filter((l) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          l.id.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
        );
      });
  }, [logCat, logSev, search]);

  const filteredRules = useMemo(() => {
    return RULES.filter((r) => (levelFilter === 'all' ? true : r.level === levelFilter))
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'time') return dir * a.lastTriggered.localeCompare(b.lastTriggered);
        if (sortBy === 'level') {
          const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 } as const;
          return dir * (order[a.level] - order[b.level]);
        }
        return dir * (a.triggerCount24h - b.triggerCount24h);
      });
  }, [levelFilter, search, sortBy, sortDir]);

  const filteredTips = useMemo(() => {
    return TIPS.filter((t) => (tipFilter === 'all' ? true : t.category === tipFilter));
  }, [tipFilter]);

  const filteredDevices = useMemo(() => {
    return DEVICES.filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.os.toLowerCase().includes(q) ||
        d.browser.toLowerCase().includes(q) ||
        d.ip.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    });
  }, [search]);

  // 风险等级色彩
  const levelColor = (lvl: RiskLevel) => {
    if (lvl === 'critical') return { color: BRAND.danger, bg: BRAND.dangerLt };
    if (lvl === 'high') return { color: BRAND.warning, bg: BRAND.warningLt };
    if (lvl === 'medium') return { color: BRAND.amber, bg: BRAND.amberLt };
    if (lvl === 'low') return { color: BRAND.info, bg: BRAND.infoLt };
    return { color: BRAND.textSub, bg: 'rgba(176, 176, 176, 0.10)' };
  };

  // 设备类型图标
  const deviceIcon = (type: string) => {
    if (type === 'mobile') return Smartphone;
    if (type === 'desktop') return Monitor;
    if (type === 'tablet') return Tablet;
    return Cpu;
  };

  // 威胁类型中文
  const threatTypeName = (t: ThreatType) => {
    const m: Record<ThreatType, string> = {
      'brute-force': '暴力破解',
      phishing: '钓鱼攻击',
      ddos: 'DDoS 攻击',
      malware: '恶意软件',
      'social-engineering': '社工攻击',
      'unauthorized-access': '未授权访问',
      'suspicious-withdraw': '可疑提现',
      'impossible-travel': '异常登录',
      anomaly: '异常行为',
    };
    return m[t];
  };

  const eventStatusName = (s: EventStatus) => {
    const m: Record<EventStatus, string> = {
      open: '待处理',
      investigating: '调查中',
      mitigated: '已缓解',
      closed: '已关闭',
      'false-positive': '误报',
    };
    return m[s];
  };

  // 复制
  const copy = (text: string) => {
    if (navigator?.clipboard) navigator.clipboard.writeText(text);
  };

  // KpiCard
  const KpiCard = ({ label, value, suffix, icon: Icon, color, trend, hint }: { label: string; value: string | number; suffix?: string; icon: any; color: string; trend?: number; hint?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      const target = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
      if (isNaN(target)) return;
      const start = display;
      const duration = 800;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const ease = 1 - Math.pow(1 - p, 3);
        setDisplay(start + (target - start) * ease);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, [value]);
    return (
      <div
        className="p-4 rounded-xl"
        style={{
          backgroundColor: BRAND.bgCard,
          border: `1px solid ${BRAND.border}`,
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20`, color }}
          >
            <Icon size={18} />
          </div>
          {trend !== undefined && (
            <span
              className="text-xs font-mono flex items-center gap-1"
              style={{ color: trend >= 0 ? BRAND.success : BRAND.danger }}
            >
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-mono" style={{ color: BRAND.text }}>
            {typeof display === 'number' && !isNaN(display) ? formatNumber(Math.round(display)) : value}
          </span>
          {suffix && <span className="text-xs" style={{ color: BRAND.textMute }}>{suffix}</span>}
        </div>
        <div className="text-xs mt-1" style={{ color: BRAND.textSub }}>{label}</div>
        {hint && (
          <div className="text-[10px] mt-2" style={{ color: BRAND.textMute }}>{hint}</div>
        )}
      </div>
    );
  };

  // 渲染风险等级徽章
  const LevelBadge = ({ lvl }: { lvl: RiskLevel }) => {
    const c = levelColor(lvl);
    return (
      <span
        className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
        style={{ backgroundColor: c.bg, color: c.color }}
      >
        {lvl}
      </span>
    );
  };

  // 当前 Drawer payload
  const drawerThreat = drawer.type === 'threat' ? THREATS.find((t) => t.id === drawer.payload) : null;
  const drawerDevice = drawer.type === 'device' ? DEVICES.find((d) => d.id === drawer.payload) : null;
  const drawerRule = drawer.type === 'rule' ? RULES.find((r) => r.id === drawer.payload) : null;
  const drawerLog = drawer.type === 'log' ? LOGS.find((l) => l.id === drawer.payload) : null;
  const drawerFactor = drawer.type === 'factor' ? FACTORS.find((f) => f.id === drawer.payload) : null;
  const drawerAsset = drawer.type === 'asset' ? ASSETS.find((a) => a.id === drawer.payload) : null;
  const drawerAction = drawer.type === 'action' ? ACTIONS.find((a) => a.id === drawer.payload) : null;
  const drawerTip = drawer.type === 'tip' ? TIPS.find((t) => t.id === drawer.payload) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ============== Hero ============== */}
      <section className="px-6 lg:px-12 pt-10 pb-8" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1"
              style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
            >
              <Shield size={12} />
              SECURITY OPERATIONS CENTER · Q05 P3.16
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider"
              style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: STATUS.LIVE.dot }} />
              7x24 SOC 在线
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: BRAND.text }}>
            安全中心
          </h1>
          <p className="text-sm lg:text-base max-w-3xl" style={{ color: BRAND.textSub }}>
            中萨数字科技交易所平台安全运营中心。7x24 SOC 安全运营、实时威胁监测、多因素认证、资产多重保护、风控规则引擎、应急响应通道，
            构成从威胁感知到处置恢复的完整安全闭环。所有安全控制严格遵守反洗钱（AML）、反恐怖融资（CFT）合规研究方向。
          </p>
        </div>
      </section>

      {/* ============== 实时 KPI ============== */}
      <section className="px-6 lg:px-12 py-6" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <KpiCard label="安全评分" value={kpi.securityScore} suffix="/100" icon={ShieldCheck} color={BRAND.success} trend={0.3} />
            <KpiCard label="24h 拦截威胁" value={kpi.threatsBlocked} icon={ShieldAlert} color={BRAND.danger} trend={-2.1} />
            <KpiCard label="活跃会话" value={kpi.activeSessions} icon={Users} color={BRAND.primary} trend={0.8} />
            <KpiCard label="风险事件" value={kpi.riskEvents} icon={AlertOctagon} color={BRAND.warning} trend={-12.5} />
            <KpiCard label="系统可用性" value={kpi.uptime} suffix="%" icon={Activity} color={BRAND.info} trend={0.01} />
            <KpiCard label="MFA 覆盖率" value={kpi.mfaCoverage} suffix="%" icon={KeyRound} color={BRAND.success} trend={1.2} />
            <KpiCard label="冷存储比例" value={kpi.coldRatio} suffix="%" icon={Snowflake} color={BRAND.info} trend={0.1} />
            <KpiCard label="审计通过率" value={kpi.auditPass} suffix="%" icon={CheckCircle2} color={BRAND.success} trend={0} />
          </div>
        </div>
      </section>

      {/* ============== 工具栏 + Tab ============== */}
      <section className="px-6 lg:px-12 py-4 sticky top-0 z-30" style={{ backgroundColor: BRAND.headerBg, borderBottom: `1px solid ${BRAND.border}`, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMute }} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索威胁 / 设备 / 规则 / 日志 / 用户（按 / 聚焦）"
                className="w-full pl-9 pr-9 py-2 rounded-lg text-sm outline-none font-mono"
                style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded"
                  style={{ color: BRAND.textMute }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部等级</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
              <option value="info">info</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
            >
              <option value="all">全部类型</option>
              <option value="brute-force">暴力破解</option>
              <option value="phishing">钓鱼攻击</option>
              <option value="ddos">DDoS</option>
              <option value="malware">恶意软件</option>
              <option value="social-engineering">社工攻击</option>
              <option value="unauthorized-access">未授权访问</option>
              <option value="suspicious-withdraw">可疑提现</option>
              <option value="impossible-travel">异常登录</option>
              <option value="anomaly">异常行为</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (sortBy === 'time') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('time'); setSortDir('desc'); }
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'time' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'time' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'time' ? BRAND.primary : BRAND.border}` }}
              >
                时间 {sortBy === 'time' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'level') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('level'); setSortDir('desc'); }
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'level' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'level' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'level' ? BRAND.primary : BRAND.border}` }}
              >
                等级 {sortBy === 'level' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
              <button
                onClick={() => {
                  if (sortBy === 'affected') setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  else { setSortBy('affected'); setSortDir('desc'); }
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
                style={{ backgroundColor: sortBy === 'affected' ? BRAND.primaryLt : BRAND.bgCard, color: sortBy === 'affected' ? BRAND.primary : BRAND.text, border: `1px solid ${sortBy === 'affected' ? BRAND.primary : BRAND.border}` }}
              >
                影响 {sortBy === 'affected' && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </button>
            </div>
            <button
              onClick={() => setHelpOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-1"
              style={{ backgroundColor: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
            >
              <HelpCircle size={12} /> 快捷键
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {([
              { key: 'overview', label: '安全态势', icon: Radar, n: '1' },
              { key: 'account', label: '账户安全', icon: UserCheck, n: '2' },
              { key: 'asset', label: '资产安全', icon: Vault, n: '3' },
              { key: 'transaction', label: '交易安全', icon: Crosshair, n: '4' },
              { key: 'device', label: '设备与会话', icon: Smartphone, n: '5' },
              { key: 'log', label: '安全日志', icon: FileText, n: '6' },
              { key: 'emergency', label: '应急响应', icon: Siren, n: '7' },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: active ? BRAND.primaryLt : 'transparent',
                    color: active ? BRAND.primary : BRAND.textSub,
                    border: `1px solid ${active ? BRAND.primary : 'transparent'}`,
                  }}
                >
                  <Icon size={12} />
                  {t.label}
                  <span className="text-[10px] opacity-50">{t.n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== 内容区 ============== */}
      <main className="px-6 lg:px-12 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {tab === 'overview' && (
            <>
              {/* 安全态势 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Radar size={14} style={{ color: BRAND.primary }} />
                  实时威胁态势
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {filteredThreats.length === 0 ? (
                    <div className="lg:col-span-3 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      暂无匹配的威胁事件
                    </div>
                  ) : (
                    filteredThreats.map((t, idx) => (
                      <div
                        key={t.id}
                        onClick={() => setDrawer({ open: true, type: 'threat', payload: t.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${idx * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{t.flag}</span>
                            <LevelBadge lvl={t.level} />
                            <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{t.id}</span>
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}
                          >
                            {eventStatusName(t.status)}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{threatTypeName(t.type)}</div>
                        <div className="text-xs line-clamp-2 mb-3" style={{ color: BRAND.textSub }}>{t.description}</div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                          <div>源: {t.source}</div>
                          <div>目标: {t.target}</div>
                          <div>时间: {timeAgo(t.timestamp)}</div>
                          <div>影响: {t.affected} 人</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* 安全评分卡 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <ShieldCheck size={14} style={{ color: BRAND.success }} />
                  平台安全态势总览
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { icon: ShieldCheck, label: '基础设施安全', score: 98, color: BRAND.success, desc: 'WAF / DDoS / CDN 全量防护' },
                    { icon: UserCheck, label: '身份与访问安全', score: 95, color: BRAND.primary, desc: 'MFA / WebAuthn / 设备白名单' },
                    { icon: Vault, label: '资产保护能力', score: 97, color: BRAND.info, desc: '冷热钱包隔离 / 多签 / 保险基金' },
                    { icon: Activity, label: '风控与监测', score: 94, color: BRAND.warning, desc: '实时风控规则引擎' },
                    { icon: Crosshair, label: '交易安全', score: 96, color: BRAND.success, desc: '大额 / 异常 / 速度监控' },
                    { icon: Siren, label: '应急响应', score: 99, color: BRAND.danger, desc: '7x24 SOC / 紧急冻结通道' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="p-4 rounded-xl"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${s.color}20`, color: s.color }}
                            >
                              <Icon size={16} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{s.label}</span>
                          </div>
                          <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.score}</span>
                        </div>
                        <div className="text-xs" style={{ color: BRAND.textMute }}>{s.desc}</div>
                        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                          <div className="h-full" style={{ width: `${s.score}%`, backgroundColor: s.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 合规与认证 */}
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Award size={14} style={{ color: BRAND.warning }} />
                  合规认证与第三方审计
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { name: 'SOC 2 Type II', scope: '数据安全审计', status: '已通过' },
                    { name: 'ISO 27001', scope: '信息安全管理', status: '已认证' },
                    { name: 'PCI DSS', scope: '支付数据安全', status: '已认证' },
                    { name: 'GDPR', scope: '数据保护合规', status: '已对齐' },
                    { name: 'OWASP Top 10', scope: 'Web 应用安全', status: '已对齐' },
                    { name: 'NIST CSF', scope: '网络安全框架', status: '已对齐' },
                    { name: '储备金月度审计', scope: '1:1 准备金证明', status: '已通过' },
                    { name: 'Merkle 链上验证', scope: '可公开验证', status: '已上线' },
                  ].map((c, i) => (
                    <div
                      key={c.name}
                      className="p-3 rounded-xl flex items-center justify-between"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                      }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{c.name}</div>
                        <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.scope}</div>
                      </div>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'account' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <UserCheck size={14} style={{ color: BRAND.primary }} />
                  多因素认证 (MFA) 状态
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FACTORS.map((f, i) => {
                    const Icon = f.method === 'webauthn' ? KeySquare : f.method === 'biometric' ? Fingerprint : f.method === 'totp' ? ShieldCheck : f.method === 'sms' ? Smartphone : f.method === 'email' ? Mail : Lock;
                    return (
                      <div
                        key={f.id}
                        onClick={() => setDrawer({ open: true, type: 'factor', payload: f.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: f.enabled ? BRAND.primaryLt : BRAND.borderLt, color: f.enabled ? BRAND.primary : BRAND.textMute }}
                          >
                            <Icon size={16} />
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: f.enabled ? BRAND.successLt : 'rgba(112,112,112,0.10)', color: f.enabled ? BRAND.success : BRAND.textMute }}
                          >
                            {f.enabled ? '已启用' : '未启用'}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{f.name}</div>
                        <div className="text-xs line-clamp-2 mb-2" style={{ color: BRAND.textSub }}>{f.description}</div>
                        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                          <span>强度: <span style={{ color: f.strength === 'enterprise' ? BRAND.primary : f.strength === 'strong' ? BRAND.success : f.strength === 'medium' ? BRAND.warning : BRAND.danger }}>{f.strength.toUpperCase()}</span></span>
                          <span>使用 {f.usageCount} 次</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Shield size={14} style={{ color: BRAND.success }} />
                  账户安全检查清单
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: '已设置强密码 (12+ 位)', done: true },
                    { label: '已启用 2FA 多因素认证', done: true },
                    { label: '已配置 WebAuthn 硬件密钥', done: false, hint: '推荐高净值用户启用' },
                    { label: '已绑定备用手机/邮箱', done: true },
                    { label: '已设置反钓鱼码', done: false, hint: '可在登录页设置专属标识' },
                    { label: '已开启登录通知', done: true },
                    { label: '近 90 天无异常登录', done: true },
                    { label: 'KYC 等级 ≥ L2', done: true },
                    { label: 'API Key 启用 IP 白名单', done: false, hint: '建议 API 用户配置' },
                    { label: '已设置提现白名单地址', done: false, hint: '可大幅提升提现安全' },
                  ].map((c, i) => (
                    <div
                      key={c.label}
                      className="p-3 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: c.done ? BRAND.successLt : BRAND.borderLt, color: c.done ? BRAND.success : BRAND.textMute }}
                      >
                        {c.done ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm" style={{ color: BRAND.text }}>{c.label}</div>
                        {c.hint && <div className="text-[10px]" style={{ color: BRAND.textMute }}>{c.hint}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'asset' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Vault size={14} style={{ color: BRAND.primary }} />
                  资产保护体系
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ASSETS.map((a, i) => {
                    const Icon = a.category === 'hot-wallet' ? Flame : a.category === 'cold-wallet' ? Snowflake : a.category === 'multisig' ? KeyRound : a.category === 'insurance' ? Shield : a.category === 'audit' ? FileText : Lock;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setDrawer({ open: true, type: 'asset', payload: a.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                          >
                            <Icon size={16} />
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                            style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}
                          >
                            {a.status}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{a.name}</div>
                        <div className="text-xs mb-2" style={{ color: BRAND.primary }}>{a.coverage}</div>
                        <div className="text-xs line-clamp-2" style={{ color: BRAND.textSub }}>{a.description}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Layers size={14} style={{ color: BRAND.info }} />
                  储备金 1:1 覆盖
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { coin: 'BTC', reserve: '142.5%', amount: '用户 BTC 余额' },
                    { coin: 'ETH', reserve: '138.2%', amount: '用户 ETH 余额' },
                    { coin: 'USDT', reserve: '105.8%', amount: '用户 USDT 余额' },
                    { coin: 'USDC', reserve: '107.1%', amount: '用户 USDC 余额' },
                  ].map((c, i) => (
                    <div
                      key={c.coin}
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono font-semibold" style={{ color: BRAND.text }}>{c.coin}</span>
                        <span className="text-2xl font-bold font-mono" style={{ color: BRAND.success }}>{c.reserve}</span>
                      </div>
                      <div className="text-xs" style={{ color: BRAND.textMute }}>{c.amount}</div>
                      <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: BRAND.border }}>
                        <div className="h-full" style={{ width: '100%', backgroundColor: BRAND.success }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'transaction' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Crosshair size={14} style={{ color: BRAND.warning }} />
                  风控规则引擎
                </h2>
                <div className="space-y-2">
                  {filteredRules.length === 0 ? (
                    <div className="p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      暂无匹配的风控规则
                    </div>
                  ) : (
                    filteredRules.map((r, i) => (
                      <div
                        key={r.id}
                        onClick={() => setDrawer({ open: true, type: 'rule', payload: r.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <LevelBadge lvl={r.level} />
                            <span className="text-sm font-semibold" style={{ color: BRAND.text }}>{r.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{r.category}</span>
                          </div>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: r.enabled ? BRAND.successLt : 'rgba(112,112,112,0.10)', color: r.enabled ? BRAND.success : BRAND.textMute }}
                          >
                            {r.enabled ? '启用' : '停用'}
                          </span>
                        </div>
                        <div className="text-xs mb-3" style={{ color: BRAND.textSub }}>{r.description}</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] font-mono">
                          <div style={{ color: BRAND.textMute }}>24h 触发: <span style={{ color: BRAND.warning }}>{r.triggerCount24h}</span></div>
                          <div style={{ color: BRAND.textMute }}>24h 阻断: <span style={{ color: BRAND.danger }}>{r.blockCount24h}</span></div>
                          <div style={{ color: BRAND.textMute }}>最近: {timeAgo(r.lastTriggered)}</div>
                          <div style={{ color: BRAND.textMute }}>负责: {r.owner}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'device' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Smartphone size={14} style={{ color: BRAND.primary }} />
                  已登录设备与会话
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredDevices.length === 0 ? (
                    <div className="md:col-span-2 p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      暂无匹配设备
                    </div>
                  ) : (
                    filteredDevices.map((d, i) => {
                      const Icon = deviceIcon(d.type);
                      return (
                        <div
                          key={d.id}
                          onClick={() => setDrawer({ open: true, type: 'device', payload: d.id })}
                          className="p-4 rounded-xl cursor-pointer transition-all"
                          style={{
                            backgroundColor: BRAND.bgCard,
                            border: `1px solid ${BRAND.border}`,
                            animation: `fadeInUp 0.4s ease-out ${i * 0.04}s both`,
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.text }}
                              >
                                <Icon size={16} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold" style={{ color: BRAND.text }}>{d.os}</div>
                                <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{d.browser}</div>
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                              style={{
                                backgroundColor: d.status === 'active' ? BRAND.successLt : d.status === 'idle' ? BRAND.warningLt : d.status === 'revoked' ? BRAND.dangerLt : 'rgba(112,112,112,0.10)',
                                color: d.status === 'active' ? BRAND.success : d.status === 'idle' ? BRAND.warning : d.status === 'revoked' ? BRAND.danger : BRAND.textMute,
                              }}
                            >
                              {d.status}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{d.flag}</span>
                              <span style={{ color: BRAND.textSub }}>{d.location}</span>
                              <span className="font-mono text-[10px]" style={{ color: BRAND.textMute }}>{d.ip}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                              <span>会话 {d.sessionCount}</span>
                              <span>最近 {timeAgo(d.lastActive)}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-1">
                            {d.trusted && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}
                              >
                                <CheckCircle2 size={10} /> 已信任
                              </span>
                            )}
                            {!d.trusted && d.status !== 'revoked' && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{ backgroundColor: BRAND.warningLt, color: BRAND.warning }}
                              >
                                <AlertTriangle size={10} /> 未信任
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'log' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <FileText size={14} style={{ color: BRAND.textSub }} />
                  审计日志
                </h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <select
                    value={logCat}
                    onChange={(e) => setLogCat(e.target.value as any)}
                    className="px-3 py-1.5 rounded text-xs font-mono"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                  >
                    <option value="all">全部类别</option>
                    <option value="auth">auth 认证</option>
                    <option value="transaction">transaction 交易</option>
                    <option value="admin">admin 管理</option>
                    <option value="system">system 系统</option>
                    <option value="kyc">kyc 合规</option>
                    <option value="api">api 接口</option>
                    <option value="config">config 配置</option>
                    <option value="network">network 网络</option>
                  </select>
                  <select
                    value={logSev}
                    onChange={(e) => setLogSev(e.target.value as any)}
                    className="px-3 py-1.5 rounded text-xs font-mono"
                    style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.text }}
                  >
                    <option value="all">全部等级</option>
                    <option value="critical">critical</option>
                    <option value="error">error</option>
                    <option value="warning">warning</option>
                    <option value="info">info</option>
                    <option value="debug">debug</option>
                  </select>
                </div>
                <div className="space-y-1">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 rounded-xl text-center" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}`, color: BRAND.textMute }}>
                      暂无匹配日志
                    </div>
                  ) : (
                    filteredLogs.map((l, i) => {
                      const sev = levelColor(l.severity as any);
                      return (
                        <div
                          key={l.id}
                          onClick={() => setDrawer({ open: true, type: 'log', payload: l.id })}
                          className="p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-all"
                          style={{
                            backgroundColor: BRAND.bgCard,
                            border: `1px solid ${BRAND.border}`,
                            animation: `fadeInUp 0.3s ease-out ${i * 0.02}s both`,
                          }}
                        >
                          <div
                            className="w-1 h-10 rounded"
                            style={{ backgroundColor: sev.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <span className="text-xs font-mono font-semibold" style={{ color: BRAND.text }}>{l.action}</span>
                              <span
                                className="text-[10px] font-mono px-1 py-0.5 rounded uppercase"
                                style={{ backgroundColor: sev.bg, color: sev.color }}
                              >
                                {l.severity}
                              </span>
                              <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{l.category}</span>
                              <span
                                className="text-[10px] font-mono px-1 py-0.5 rounded"
                                style={{ backgroundColor: l.result === 'success' ? BRAND.successLt : l.result === 'blocked' ? BRAND.dangerLt : BRAND.warningLt, color: l.result === 'success' ? BRAND.success : l.result === 'blocked' ? BRAND.danger : BRAND.warning }}
                              >
                                {l.result}
                              </span>
                            </div>
                            <div className="text-xs truncate" style={{ color: BRAND.textSub }}>{l.details}</div>
                          </div>
                          <div className="text-right text-[10px] font-mono whitespace-nowrap" style={{ color: BRAND.textMute }}>
                            <div>{l.actor}</div>
                            <div>{timeAgo(l.timestamp)}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}

          {tab === 'emergency' && (
            <>
              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <Siren size={14} style={{ color: BRAND.danger }} />
                  应急响应通道
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ACTIONS.map((a, i) => {
                    const Icon = a.category === 'freeze' ? Snowflake : a.category === 'revoke' ? Power : a.category === 'block' ? ShieldAlert : a.category === 'isolate' ? Server : a.category === 'communicate' ? Megaphone : History;
                    return (
                      <div
                        key={a.id}
                        onClick={() => setDrawer({ open: true, type: 'action', payload: a.id })}
                        className="p-4 rounded-xl cursor-pointer transition-all"
                        style={{
                          backgroundColor: BRAND.bgCard,
                          border: `1px solid ${BRAND.border}`,
                          animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger }}
                          >
                            <Icon size={16} />
                          </div>
                          <div className="flex items-center gap-1">
                            {a.available24x7 && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>7x24</span>
                            )}
                            <LevelBadge lvl={a.level} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{a.name}</div>
                        <div className="text-xs mb-2" style={{ color: BRAND.textSub }}>{a.description}</div>
                        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                          <span>响应: <span style={{ color: BRAND.danger }}>{a.responseTime}</span></span>
                          <span>类别: {a.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-sm font-mono mb-3 flex items-center gap-2" style={{ color: BRAND.text }}>
                  <BookOpen size={14} style={{ color: BRAND.info }} />
                  安全教育
                </h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['all', 'phishing', 'password', 'network', 'device', 'social', 'transaction'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTipFilter(cat)}
                      className="px-3 py-1.5 rounded text-xs font-mono"
                      style={{ backgroundColor: tipFilter === cat ? BRAND.primaryLt : BRAND.bgCard, color: tipFilter === cat ? BRAND.primary : BRAND.textSub, border: `1px solid ${tipFilter === cat ? BRAND.primary : BRAND.border}` }}
                    >
                      {cat === 'all' ? '全部' : cat}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredTips.map((t, i) => (
                    <div
                      key={t.id}
                      onClick={() => setDrawer({ open: true, type: 'tip', payload: t.id })}
                      className="p-4 rounded-xl cursor-pointer transition-all"
                      style={{
                        backgroundColor: BRAND.bgCard,
                        border: `1px solid ${BRAND.border}`,
                        animation: `fadeInUp 0.4s ease-out ${i * 0.05}s both`,
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <LevelBadge lvl={t.severity} />
                        <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>阅读 {t.readTime} min</span>
                      </div>
                      <div className="text-sm font-semibold mb-1" style={{ color: BRAND.text }}>{t.title}</div>
                      <div className="text-xs line-clamp-3 mb-2" style={{ color: BRAND.textSub }}>{t.description}</div>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>类别: {t.category}</div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* ============== 底部 CTA ============== */}
      <section className="px-6 lg:px-12 py-10 mt-8" style={{ borderTop: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Phone size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>7x24 客服热线</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>400-888-****</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>紧急情况优先电话联系</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>安全举报邮箱</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>security@zsdex.com</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>举报钓鱼 / 漏洞 / 仿冒</div>
            </div>
            <div className="p-5 rounded-xl" style={{ backgroundColor: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle size={16} style={{ color: BRAND.primary }} />
                <span className="text-sm font-semibold" style={{ color: BRAND.text }}>在线客服</span>
              </div>
              <div className="text-xs font-mono mb-1" style={{ color: BRAND.text }}>实时聊天支持</div>
              <div className="text-[10px]" style={{ color: BRAND.textMute }}>通用问题与安全咨询</div>
            </div>
          </div>
          <div className="text-center mt-6 text-[10px]" style={{ color: BRAND.textMute }}>
            本页面所有数据为示意性 mock 数据，来源于平台安全运营中心演示版本。
            不构成任何安全承诺或保证。具体安全服务请以正式用户协议及合规披露为准。
          </div>
        </div>
      </section>

      {/* ============== Drawer ============== */}
      {drawer.open && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setDrawer({ open: false, type: null, payload: null })}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[560px] overflow-y-auto"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: BRAND.textMute }}>
                  {drawer.type} DETAIL
                </span>
                <button
                  onClick={() => setDrawer({ open: false, type: null, payload: null })}
                  className="p-1.5 rounded-lg"
                  style={{ color: BRAND.textMute }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* 威胁事件 Drawer */}
              {drawerThreat && (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-2xl">{drawerThreat.flag}</span>
                    <LevelBadge lvl={drawerThreat.level} />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}>{eventStatusName(drawerThreat.status)}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerThreat.id}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{threatTypeName(drawerThreat.type)}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerThreat.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>时间:</span> <span className="font-mono">{drawerThreat.timestamp}</span></div>
                    <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>来源 IP:</span> <span className="font-mono">{drawerThreat.source}</span> <button onClick={() => copy(drawerThreat.source)} style={{ color: BRAND.textMute }}><Copy size={12} /></button></div>
                    <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>目标:</span> <span style={{ color: BRAND.text }}>{drawerThreat.target}</span></div>
                    {drawerThreat.targetUser && <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>用户:</span> <span style={{ color: BRAND.text }}>{drawerThreat.targetUser}</span></div>}
                    <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>攻击向量:</span> <span style={{ color: BRAND.danger }}>{drawerThreat.attackVector}</span></div>
                    <div className="flex items-center gap-2"><span style={{ color: BRAND.textMute }}>影响:</span> <span style={{ color: BRAND.warning }}>{drawerThreat.affected} 人</span></div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>威胁指标 (IoC)</div>
                    <div className="space-y-1">
                      {drawerThreat.indicators.map((i) => (
                        <div key={i} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <Crosshair size={12} style={{ color: BRAND.danger }} /> {i}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>缓解措施</div>
                    <div className="space-y-1">
                      {drawerThreat.mitigations.map((m) => (
                        <div key={m} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <ShieldCheck size={12} style={{ color: BRAND.success }} /> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 设备 Drawer */}
              {drawerDevice && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{drawerDevice.flag}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: drawerDevice.status === 'active' ? BRAND.successLt : BRAND.borderLt, color: drawerDevice.status === 'active' ? BRAND.success : BRAND.textMute }}>{drawerDevice.status}</span>
                    {drawerDevice.trusted && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>已信任</span>}
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerDevice.os} · {drawerDevice.browser}</h2>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><MapPin size={12} style={{ color: BRAND.primary }} /> <span style={{ color: BRAND.text }}>{drawerDevice.location}</span> · <span className="font-mono" style={{ color: BRAND.textMute }}>{drawerDevice.ip}</span></div>
                    <div className="flex items-center gap-2"><Clock size={12} style={{ color: BRAND.primary }} /> 最近活动: <span className="font-mono">{drawerDevice.lastActive}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={12} style={{ color: BRAND.primary }} /> 首次登录: <span className="font-mono">{drawerDevice.firstSeen}</span></div>
                    <div className="flex items-center gap-2"><Activity size={12} style={{ color: BRAND.primary }} /> 累计会话: <span style={{ color: BRAND.text }}>{drawerDevice.sessionCount}</span></div>
                    <div className="flex items-center gap-2"><Fingerprint size={12} style={{ color: BRAND.primary }} /> 设备指纹: <span className="font-mono">{drawerDevice.fingerprint}</span> <button onClick={() => copy(drawerDevice.fingerprint)} style={{ color: BRAND.textMute }}><Copy size={12} /></button></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {!drawerDevice.trusted && drawerDevice.status !== 'revoked' && (
                      <button className="flex-1 py-2 rounded-lg text-xs font-mono" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary, border: `1px solid ${BRAND.primary}` }}>信任此设备</button>
                    )}
                    {drawerDevice.status !== 'revoked' && (
                      <button className="flex-1 py-2 rounded-lg text-xs font-mono" style={{ backgroundColor: BRAND.dangerLt, color: BRAND.danger, border: `1px solid ${BRAND.danger}` }}>撤销此设备</button>
                    )}
                  </div>
                </>
              )}

              {/* 规则 Drawer */}
              {drawerRule && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <LevelBadge lvl={drawerRule.level} />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: drawerRule.enabled ? BRAND.successLt : BRAND.borderLt, color: drawerRule.enabled ? BRAND.success : BRAND.textMute }}>{drawerRule.enabled ? '启用' : '停用'}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerRule.id}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerRule.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerRule.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>24h 触发</div>
                      <div className="text-lg font-mono font-bold" style={{ color: BRAND.warning }}>{drawerRule.triggerCount24h}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>24h 阻断</div>
                      <div className="text-lg font-mono font-bold" style={{ color: BRAND.danger }}>{drawerRule.blockCount24h}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>触发条件</div>
                    <div className="space-y-1">
                      {drawerRule.conditions.map((c) => (
                        <div key={c} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <Crosshair size={12} style={{ color: BRAND.warning }} /> {c}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>响应动作</div>
                    <div className="space-y-1">
                      {drawerRule.actions.map((a) => (
                        <div key={a} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <ShieldCheck size={12} style={{ color: BRAND.success }} /> {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 日志 Drawer */}
              {drawerLog && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                      style={{ backgroundColor: levelColor(drawerLog.severity).bg, color: levelColor(drawerLog.severity).color }}
                    >
                      {drawerLog.severity}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{drawerLog.category}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerLog.id}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerLog.action}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerLog.details}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2"><Clock size={12} style={{ color: BRAND.primary }} /> {drawerLog.timestamp}</div>
                    <div className="flex items-center gap-2"><UserCheck size={12} style={{ color: BRAND.primary }} /> {drawerLog.actor} ({drawerLog.actorRole})</div>
                    <div className="flex items-center gap-2"><Box size={12} style={{ color: BRAND.primary }} /> {drawerLog.resource}</div>
                    <div className="flex items-center gap-2"><MapPin size={12} style={{ color: BRAND.primary }} /> {drawerLog.location}</div>
                    <div className="flex items-center gap-2"><Cpu size={12} style={{ color: BRAND.primary }} /> <span className="font-mono text-[10px]">{drawerLog.userAgent}</span></div>
                    <div className="flex items-center gap-2"><Hash size={12} style={{ color: BRAND.primary }} /> <span className="font-mono text-[10px]">{drawerLog.hash}</span> <button onClick={() => copy(drawerLog.hash)} style={{ color: BRAND.textMute }}><Copy size={12} /></button></div>
                  </div>
                </>
              )}

              {/* 认证因子 Drawer */}
              {drawerFactor && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: drawerFactor.enabled ? BRAND.successLt : 'rgba(112,112,112,0.10)', color: drawerFactor.enabled ? BRAND.success : BRAND.textMute }}>{drawerFactor.enabled ? '已启用' : '未启用'}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: BRAND.primaryLt, color: BRAND.primary }}>{drawerFactor.strength}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerFactor.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerFactor.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>累计使用</div>
                      <div className="text-lg font-mono font-bold" style={{ color: BRAND.primary }}>{drawerFactor.usageCount}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>启用时间</div>
                      <div className="text-xs font-mono" style={{ color: BRAND.text }}>{drawerFactor.enrolled || '—'}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>安全建议</div>
                    <div className="space-y-1">
                      {drawerFactor.recommendations.map((r) => (
                        <div key={r} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <Sparkles size={12} style={{ color: BRAND.warning }} /> {r}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 资产保护 Drawer */}
              {drawerAsset && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: STATUS.LIVE.bg, color: STATUS.LIVE.color }}>{drawerAsset.status}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerAsset.id}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerAsset.name}</h2>
                  <p className="text-sm mb-3 font-semibold" style={{ color: BRAND.primary }}>{drawerAsset.coverage}</p>
                  <p className="text-xs mb-4" style={{ color: BRAND.textSub }}>{drawerAsset.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {drawerAsset.metrics.map((m) => (
                      <div key={m.label} className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                        <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{m.label}</div>
                        <div className="text-sm font-mono font-bold" style={{ color: BRAND.text }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>核心亮点</div>
                    <div className="space-y-1">
                      {drawerAsset.highlights.map((h) => (
                        <div key={h} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <CheckCircle2 size={12} style={{ color: BRAND.success }} /> {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 应急动作 Drawer */}
              {drawerAction && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <LevelBadge lvl={drawerAction.level} />
                    {drawerAction.available24x7 && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.successLt, color: BRAND.success }}>7x24</span>}
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>{drawerAction.id}</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerAction.name}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerAction.description}</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>响应时间</div>
                      <div className="text-sm font-mono font-bold" style={{ color: BRAND.danger }}>{drawerAction.responseTime}</div>
                    </div>
                    <div className="p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                      <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>类别</div>
                      <div className="text-sm font-mono" style={{ color: BRAND.text }}>{drawerAction.category}</div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>应急流程</div>
                    <div className="space-y-1">
                      {drawerAction.procedure.map((p, i) => (
                        <div key={p} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <span className="font-mono" style={{ color: BRAND.primary }}>{String(i + 1).padStart(2, '0')}</span> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>前置要求</div>
                    <div className="space-y-1">
                      {drawerAction.requirements.map((r) => (
                        <div key={r} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <ShieldQuestion size={12} style={{ color: BRAND.warning }} /> {r}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>联系方式</div>
                    <div className="space-y-1">
                      {drawerAction.contacts.map((c) => (
                        <div key={c.name} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <MessageCircle size={12} style={{ color: BRAND.primary }} />
                          <span style={{ color: BRAND.text }}>{c.name}</span>
                          <span style={{ color: BRAND.textMute }}>· {c.role}</span>
                          <span className="font-mono" style={{ color: BRAND.primary }}>{c.channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 安全教育 Drawer */}
              {drawerTip && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <LevelBadge lvl={drawerTip.severity} />
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.textMute }}>{drawerTip.category}</span>
                    <span className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>阅读 {drawerTip.readTime} min</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.text }}>{drawerTip.title}</h2>
                  <p className="text-sm mb-3" style={{ color: BRAND.textSub }}>{drawerTip.description}</p>
                  <div>
                    <div className="text-[10px] font-mono mb-2" style={{ color: BRAND.textMute }}>实操步骤</div>
                    <div className="space-y-1">
                      {drawerTip.steps.map((s, i) => (
                        <div key={s} className="text-xs p-2 rounded flex items-center gap-2" style={{ backgroundColor: BRAND.bgCard, color: BRAND.textSub }}>
                          <span className="font-mono" style={{ color: BRAND.primary }}>{String(i + 1).padStart(2, '0')}</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============== 帮助 Drawer ============== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50"
          style={{ backgroundColor: BRAND.overlay }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-full md:w-[420px] overflow-y-auto p-5"
            style={{ backgroundColor: BRAND.cardElevated, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard size={18} style={{ color: BRAND.primary }} />
                快捷键
              </h3>
              <button onClick={() => setHelpOpen(false)} style={{ color: BRAND.textMute }}><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'Esc', desc: '关闭 Drawer / 帮助' },
                { key: '?', desc: '打开 / 关闭帮助' },
                { key: '1-7', desc: '切换 Tab (1 态势 / 2 账户 / 3 资产 / 4 交易 / 5 设备 / 6 日志 / 7 应急)' },
              ].map((h) => (
                <div key={h.key} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: BRAND.bgCard }}>
                  <span className="text-xs" style={{ color: BRAND.textSub }}>{h.desc}</span>
                  <kbd className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ backgroundColor: BRAND.bgCardHover, color: BRAND.primary, border: `1px solid ${BRAND.border}` }}>{h.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// 缺失图标补偿 (用 Box 替代)
const Box = (props: any) => <Smartphone {...props} />;

export default PortalSecurity;
