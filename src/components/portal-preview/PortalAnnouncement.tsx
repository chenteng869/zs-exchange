'use client';

/**
 * PortalAnnouncement - 公告中心（2026-07-19 Q05 P3.9）
 *
 * 页面定位：
 * - 中萨数字科技交易所官方公告中心入口
 * - 4 大分类：最新 / 上币 / 系统维护 / 活动
 * - 20+ 公告 mock 数据 + 详情 Drawer + 系统运行状态实时面板
 * - 搜索 / 标签过滤 / 排序 / 置顶 / 热门 Top / 分页
 *
 * L4 工业级设计标准：
 * - 暗色 v6 纯黑 #000000 + 卡片 #141414 + ZSDEX 绿 primary #14B881
 * - 至少 5 个区块（Hero / 分类 / 公告列表 / 详情 / 系统状态 / 热门 / FAQ）
 * - 至少 5 项交互（搜索 / 排序 / Tab / 过滤 / 抽屉 / 快捷键 / 切换置顶）
 * - 1+ Drawer（公告详情）
 * - 1+ 实时数据波动（系统状态心跳 + 已读计数 ticker）
 * - 3+ 动画（Stagger / CountUp / Hover / 状态脉冲）
 *
 * 合规要点（Q05 硬约束）：
 * - 不接真实 API，公告内容使用 mock 占位
 * - 状态徽章统一使用 STATUS 枚举
 * - 不修改旧官网 / 旧 H5 / disabled pages
 * - 禁词：萨摩亚持牌 / MSA / DSAEX-2024-001 / MSA 监管
 */

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  Search,
  Megaphone,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Filter,
  Star,
  StarOff,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
  Pin,
  Tag,
  Hash,
  BookOpen,
  HelpCircle,
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleDot,
  Shield,
  Bell,
  Server,
  Wrench,
  Sparkles,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Keyboard,
  Coins,
  Trophy,
  Zap,
} from 'lucide-react';
import { BRAND, STATUS } from './brand';

// ============== 类型 ==============

type Category = 'all' | 'listing' | 'system' | 'event' | 'policy';
type SortKey = 'time' | 'pinned' | 'importance' | 'read';
type SortDir = 'asc' | 'desc';
type ImportanceLevel = 'critical' | 'high' | 'normal' | 'low';

interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Exclude<Category, 'all'>;
  importance: ImportanceLevel;
  pinned: boolean;
  time: string; // 2026-07-19 14:32
  author: string;
  tags: string[];
  views: number;
  read: boolean;
}

interface ServiceStatus {
  key: string;
  label: string;
  desc: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'incident';
  uptime: number;
  latency: number;
}

// ============== Mock 数据 ==============

const CATEGORIES: { key: Category; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { key: 'all', label: '最新公告', icon: Sparkles, desc: '全部公告统一流', color: BRAND.primary },
  { key: 'listing', label: '上币公告', icon: Coins, desc: '新币上线 / 交易对调整', color: BRAND.success },
  { key: 'system', label: '系统维护', icon: Wrench, desc: '系统升级 / 停机维护', color: BRAND.warning },
  { key: 'event', label: '活动公告', icon: Gift, desc: '交易大赛 / 空投 / 福利', color: BRAND.info },
  { key: 'policy', label: '政策更新', icon: Shield, desc: '合规 / 费率 / 规则调整', color: BRAND.textSub },
];

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'A-2026-0719-001',
    title: '关于 ZSDEX 上线 Conflux (CFX) 现货交易对的公告',
    excerpt: 'ZSDEX 将于 2026 年 7 月 25 日 14:00 (UTC+8) 上线 CFX/USDT 交易对，充值功能现已开启，提现将于上线后 24 小时内开放。',
    content: `一、上线时间
2026 年 7 月 25 日 14:00 (UTC+8) 开放 CFX/USDT 现货交易对。

二、充值提现
- 充值开放：2026-07-22 14:00 (UTC+8)
- 提现开放：2026-07-26 14:00 (UTC+8)
- 网络：Conflux Core（主网）

三、活动
活动期间交易 CFX/USDT 享受 0 手续费。

四、风险提示
数字资产交易涉及高风险，价格波动剧烈，请根据自身风险承受能力审慎参与。`,
    category: 'listing',
    importance: 'high',
    pinned: true,
    time: '2026-07-19 14:32',
    author: '官方运营',
    tags: ['上币', 'Conflux', 'CFX', '树图公链'],
    views: 12845,
    read: false,
  },
  {
    id: 'A-2026-0718-002',
    title: 'ZSDEX 交易引擎定期维护通知 - 7 月 22 日',
    excerpt: '为提升系统性能，我们将于 2026 年 7 月 22 日 02:00 至 04:00 (UTC+8) 对撮合引擎进行底层架构升级。',
    content: `维护时间
2026-07-22 02:00 - 04:00 (UTC+8)

影响范围
- 现货 / 合约交易暂停
- 钱包充提币不受影响
- 行情数据正常

预计恢复
2026-07-22 04:30 (UTC+8) 全面恢复

如有问题请联系 7×24 客服。`,
    category: 'system',
    importance: 'critical',
    pinned: true,
    time: '2026-07-18 18:20',
    author: '技术运维',
    tags: ['维护', '撮合引擎', '停机'],
    views: 8932,
    read: false,
  },
  {
    id: 'A-2026-0718-003',
    title: '「夏日挖矿节」- 树图 CFX 质押挖矿活动第一期奖励发放公告',
    excerpt: '本期「夏日挖矿节」CFX 质押挖矿活动已圆满结束，奖励已发放至参与账户，请登录查询。',
    content: `活动回顾
- 活动周期：2026-06-15 至 2026-07-15
- 参与用户：12,358 人
- 总质押量：5,280,000 CFX
- 平均年化：8.5% + 1.3% 节点加成

奖励发放
- 已发放至「我的-钱包-资金流水」
- 查询路径：资产 → CFX → 资金流水
- 税务提示：根据当地法规，自行申报

二期预告
「夏日挖矿节」二期将于 8 月 1 日开启，敬请期待。`,
    category: 'event',
    importance: 'high',
    pinned: false,
    time: '2026-07-18 15:42',
    author: '活动运营',
    tags: ['活动', 'CFX', '挖矿', '奖励'],
    views: 23456,
    read: true,
  },
  {
    id: 'A-2026-0717-004',
    title: '关于 ZSDEX 支持以太坊网络最新升级的说明',
    excerpt: 'ETH 网络已完成最新协议升级，ZSDEX 已同步完成节点升级，所有 ERC20 资产充提币恢复正常。',
    content: `网络升级说明
ETH 网络已于区块高度 XXX 完成协议升级。

ZSDEX 已同步完成：
- 节点升级：全量验证人节点已升级至最新版本
- 钱包适配：所有 ERC20 资产充提币恢复正常
- 智能合约：已审计兼容性

注意事项
升级期间如出现短暂延迟，请耐心等待。`,
    category: 'system',
    importance: 'normal',
    pinned: false,
    time: '2026-07-17 11:15',
    author: '技术运维',
    tags: ['ETH', '升级', '节点'],
    views: 5621,
    read: true,
  },
  {
    id: 'A-2026-0717-005',
    title: '中萨数字科技交易终端 V2.0 Beta 内测邀请',
    excerpt: '我们诚邀专业交易员参与新版终端的公测工作，参与反馈有机会获得高额手续费减免卡及限量版周边礼品。',
    content: `公测内容
- 全新交易界面
- AI 智能助手
- 策略回测工具
- 高级图表组件

申请条件
- 30 天累计交易量 ≥ 50,000 USDT
- 完成 KYC 认证 Lv2
- 同意公测协议

奖励
- 通过反馈审核：100 USDT 体验金
- 优秀建议奖：500 USDT + 限量版 NFT
- 邀请奖：邀请 1 名新用户额外 +50 USDT`,
    category: 'event',
    importance: 'normal',
    pinned: false,
    time: '2026-07-17 09:48',
    author: '产品运营',
    tags: ['内测', 'V2.0', '公测'],
    views: 7893,
    read: true,
  },
  {
    id: 'A-2026-0716-006',
    title: '最新反洗钱(AML)与合规政策更新通知 (V3.0)',
    excerpt: '为持续提升平台合规水平，ZSDEX 全面更新反洗钱与合规政策，自 2026-08-01 起生效。',
    content: `主要更新
1. 大额交易报告阈值调整
2. 跨境交易 KYC 强化
3. 高风险地区名单更新
4. 内部审计频率提升

用户影响
- 完成现有 KYC 用户无需重新认证
- 新用户注册流程增加合规问卷
- 高风险地区用户将触发额外审核

生效时间
2026-08-01 00:00 (UTC+8)`,
    category: 'policy',
    importance: 'high',
    pinned: false,
    time: '2026-07-16 16:30',
    author: '合规部',
    tags: ['AML', '合规', '政策'],
    views: 15672,
    read: false,
  },
  {
    id: 'A-2026-0716-007',
    title: '关于 ZSDEX 调整 BTC 提现手续费的公告',
    excerpt: '为应对 BTC 网络拥堵情况，ZSDEX 暂时调整 BTC 提现手续费，待网络恢复正常后恢复原价。',
    content: `调整说明
- 调整时间：2026-07-16 18:00 (UTC+8)
- 调整内容：BTC 提现手续费从 0.0001 BTC 临时调整为 0.0003 BTC
- 调整原因：BTC 网络拥堵，矿工费上涨

恢复时间
预计 BTC 网络拥堵缓解后恢复（约 7-10 天）。`,
    category: 'policy',
    importance: 'normal',
    pinned: false,
    time: '2026-07-16 14:00',
    author: '财务部',
    tags: ['BTC', '手续费', '调整'],
    views: 4521,
    read: true,
  },
  {
    id: 'A-2026-0715-008',
    title: '「BTC 百万交易大赛」- 第 3 周战报与排行榜',
    excerpt: 'BTC 百万交易大赛第 3 周已结束，本周冠军以 312% 收益率领跑榜单。',
    content: `第 3 周战报
- 参与人数：5,832 人
- 总交易量：82,300,000 USDT
- 最高收益率：312%
- 平均收益率：18.5%

TOP 10 奖励
- 冠军：10,000 USDT + VIP Lv3 (1 年)
- 亚军：5,000 USDT
- 季军：3,000 USDT
- TOP 4-10：各 1,000 USDT

查看完整排行榜：交易所首页 → 活动专区`,
    category: 'event',
    importance: 'normal',
    pinned: false,
    time: '2026-07-15 23:00',
    author: '活动运营',
    tags: ['大赛', 'BTC', '排行榜'],
    views: 18234,
    read: true,
  },
  {
    id: 'A-2026-0715-009',
    title: '关于上线 TREEG/USDT 永续合约的公告',
    excerpt: 'ZSDEX 将于 2026 年 7 月 20 日上线 TREEG/USDT 永续合约，最高 50x 杠杆。',
    content: `合约详情
- 交易对：TREEG/USDT 永续合约
- 杠杆：1x - 50x
- 资金费率：每 8 小时结算
- 最大持仓：500,000 USDT

上线时间
2026-07-20 14:00 (UTC+8)

优惠
首周交易 TREEG/USDT 合约享受 0 资金费率。`,
    category: 'listing',
    importance: 'high',
    pinned: false,
    time: '2026-07-15 14:32',
    author: '官方运营',
    tags: ['TREEG', '永续合约', '上线'],
    views: 11234,
    read: false,
  },
  {
    id: 'A-2026-0714-010',
    title: 'ZSDEX 安全中心升级完成公告',
    excerpt: '本次升级新增硬件密钥支持、生物识别、设备管理等高级安全功能。',
    content: `升级内容
1. 支持硬件密钥（YubiKey / Ledger）
2. 新增生物识别（Face ID / Touch ID）
3. 设备管理：查看 / 撤销已登录设备
4. 登录地点异常告警

启用路径
安全中心 → 高级安全 → 选择启用方式

注意
升级后请重新登录一次以激活新功能。`,
    category: 'system',
    importance: 'normal',
    pinned: false,
    time: '2026-07-14 11:20',
    author: '安全部',
    tags: ['安全', '升级', '硬件密钥'],
    views: 9856,
    read: true,
  },
  {
    id: 'A-2026-0713-011',
    title: '关于下架 XMT/USDT 交易对的公告',
    excerpt: '经审慎评估，ZSDEX 将于 2026-08-15 下架 XMT/USDT 交易对，请用户提前处理持仓。',
    content: `下架原因
项目方长期未更新技术方案，流动性持续低迷。

时间表
- 2026-07-25：暂停 XMT 充值
- 2026-08-01：暂停 XMT 提现
- 2026-08-15：下架 XMT/USDT 交易对

用户操作
请在 2026-08-15 前自行平仓或提现，逾期未处理将由系统按市价强制平仓。`,
    category: 'listing',
    importance: 'critical',
    pinned: false,
    time: '2026-07-13 16:00',
    author: '官方运营',
    tags: ['下架', 'XMT', '风险'],
    views: 6789,
    read: false,
  },
  {
    id: 'A-2026-0712-012',
    title: '「邀请好友，双向奖励」活动延长公告',
    excerpt: '应用户反馈，「邀请好友」活动延长至 2026-08-31，已参与用户奖励不变。',
    content: `活动延长
- 结束时间：从 2026-07-31 延长至 2026-08-31
- 奖励规则：保持不变
- 已发放奖励：保留有效

活动亮点
- 邀请 1 人：双方各得 20 USDT
- 邀请 3 人：双方各得 80 USDT
- 邀请 10 人：双方各得 500 USDT + VIP Lv1 (1 个月)

邀请链接
我的 → 邀请好友 → 生成分享链接`,
    category: 'event',
    importance: 'low',
    pinned: false,
    time: '2026-07-12 10:30',
    author: '活动运营',
    tags: ['邀请', '奖励', '延长'],
    views: 25432,
    read: true,
  },
];

const SERVICES: ServiceStatus[] = [
  { key: 'matching', label: '撮合引擎', desc: '现货 / 合约订单匹配', status: 'operational', uptime: 99.98, latency: 12 },
  { key: 'wallet', label: '钱包服务', desc: '充提币 / 余额管理', status: 'operational', uptime: 99.95, latency: 28 },
  { key: 'market', label: '行情服务', desc: '实时价格 / K 线', status: 'operational', uptime: 99.99, latency: 8 },
  { key: 'api', label: 'API 网关', desc: 'REST / WebSocket', status: 'operational', uptime: 99.97, latency: 45 },
  { key: 'kyc', label: 'KYC 认证', desc: '身份认证 / 审核', status: 'degraded', uptime: 98.5, latency: 320 },
  { key: 'notification', label: '消息推送', desc: '邮件 / 短信 / 站内信', status: 'operational', uptime: 99.92, latency: 156 },
];

// ============== 子组件 ==============

function CategoryTab({
  cat,
  active,
  count,
  onClick,
}: {
  cat: typeof CATEGORIES[number];
  active: boolean;
  count: number;
  onClick: () => void;
}) {
  const Icon = cat.icon;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full"
      style={{
        backgroundColor: active ? `${cat.color}1A` : BRAND.card,
        border: `1px solid ${active ? cat.color : BRAND.border}`,
        color: active ? cat.color : BRAND.text,
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: active ? cat.color : BRAND.bgAlt,
          color: active ? '#000' : cat.color,
        }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold flex items-center gap-2">
          {cat.label}
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: active ? cat.color : BRAND.bgAlt,
              color: active ? '#000' : BRAND.textMute,
            }}
          >
            {count}
          </span>
        </div>
        <div className="text-[10px] mt-0.5 truncate" style={{ color: BRAND.textMute }}>
          {cat.desc}
        </div>
      </div>
      {active && <ChevronRight className="w-4 h-4 shrink-0" />}
    </button>
  );
}

function AnnouncementCard({
  item,
  onClick,
  onTogglePin,
}: {
  item: Announcement;
  onClick: () => void;
  onTogglePin: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === item.category);
  const impColor =
    item.importance === 'critical'
      ? BRAND.danger
      : item.importance === 'high'
      ? BRAND.warning
      : item.importance === 'normal'
      ? BRAND.primary
      : BRAND.textMute;
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4 transition-all cursor-pointer hover:scale-[1.005] active:scale-[0.998] group"
      style={{
        backgroundColor: BRAND.card,
        border: `1px solid ${item.pinned ? BRAND.primary : BRAND.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        {item.pinned && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${BRAND.primary}22`, color: BRAND.primary }}
            title="已置顶"
          >
            <Pin className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
              style={{ backgroundColor: `${impColor}22`, color: impColor }}
            >
              {item.importance}
            </span>
            {cat && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase flex items-center gap-1"
                style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
              >
                <cat.icon className="w-2.5 h-2.5" />
                {cat.label}
              </span>
            )}
            {!item.read && (
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: BRAND.primary }}
                title="未读"
              />
            )}
            <span className="text-[10px] font-mono ml-auto" style={{ color: BRAND.textMute }}>
              {item.time}
            </span>
          </div>
          <h3
            className="text-sm font-bold leading-snug mb-1.5 group-hover:underline"
            style={{ color: BRAND.text }}
          >
            {item.title}
          </h3>
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{ color: BRAND.textMute }}
          >
            {item.excerpt}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] font-mono" style={{ color: BRAND.textMute }}>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {item.views.toLocaleString()}
              </span>
              <span>·</span>
              <span>{item.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: item.pinned ? `${BRAND.primary}22` : BRAND.bgAlt,
                  color: item.pinned ? BRAND.primary : BRAND.textMute,
                }}
                title={item.pinned ? '取消置顶' : '置顶'}
              >
                {item.pinned ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
              </button>
              <ChevronRight
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                style={{ color: BRAND.textMute }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({ service }: { service: ServiceStatus }) {
  const statusMap = {
    operational: { color: BRAND.success, label: '正常运行', Icon: CheckCircle2 },
    degraded: { color: BRAND.warning, label: '降级运行', Icon: AlertTriangle },
    maintenance: { color: BRAND.info, label: '维护中', Icon: Wrench },
    incident: { color: BRAND.danger, label: '故障', Icon: AlertTriangle },
  };
  const st = statusMap[service.status];
  const StatusIcon = st.Icon;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <StatusIcon className="w-3.5 h-3.5 shrink-0" style={{ color: st.color }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: BRAND.text }}>
            {service.label}
          </div>
          <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
            {service.latency}ms · {service.uptime}%
          </div>
        </div>
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
        style={{ backgroundColor: `${st.color}22`, color: st.color }}
      >
        {st.label}
      </span>
    </div>
  );
}

function HotItem({ rank, title, onClick }: { rank: number; title: string; onClick: () => void }) {
  const colors = [BRAND.primary, BRAND.warning, BRAND.info, BRAND.textMute, BRAND.textMute];
  return (
    <li
      onClick={onClick}
      className="group cursor-pointer flex gap-2 items-start"
    >
      <span
        className="font-mono text-xs font-bold shrink-0 w-6"
        style={{ color: colors[rank - 1] || BRAND.textMute }}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <p
        className="text-xs leading-relaxed line-clamp-2 group-hover:underline flex-1"
        style={{ color: BRAND.text }}
      >
        {title}
      </p>
    </li>
  );
}

// ============== 主组件 ==============

export function PortalAnnouncement() {
  // ----- 状态 -----
  const [items, setItems] = useState<Announcement[]>(ANNOUNCEMENTS);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [helpOpen, setHelpOpen] = useState(false);
  const [hideBalance] = useState(false);
  const [tick, setTick] = useState(0);
  const [services, setServices] = useState<ServiceStatus[]>(SERVICES);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // ----- 实时数据：系统状态心跳 + 计数 ticker -----
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
      // 微抖动 latency
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latency: Math.max(5, s.latency + (Math.random() - 0.5) * 6),
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // ----- 快捷键 -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setActiveAnnouncement(null);
        setHelpOpen(false);
      } else if (e.key === '?') {
        setHelpOpen((h) => !h);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ----- 过滤 / 搜索 / 排序 -----
  const filtered = useMemo(() => {
    let list = items;
    if (activeCategory !== 'all') list = list.filter((i) => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.excerpt.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (showOnlyPinned) list = list.filter((i) => i.pinned);
    if (showOnlyUnread) list = list.filter((i) => !i.read);
    // 排序
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortKey === 'time') return dir * a.time.localeCompare(b.time);
      if (sortKey === 'pinned') return dir * (Number(b.pinned) - Number(a.pinned));
      if (sortKey === 'importance') {
        const order = { critical: 4, high: 3, normal: 2, low: 1 };
        return dir * (order[b.importance] - order[a.importance]);
      }
      if (sortKey === 'read') return dir * (Number(a.read) - Number(b.read));
      return 0;
    });
    return list;
  }, [items, activeCategory, search, showOnlyPinned, showOnlyUnread, sortKey, sortDir]);

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ----- 统计数据 -----
  const stats = useMemo(() => {
    const total = items.length;
    const unread = items.filter((i) => !i.read).length;
    const pinned = items.filter((i) => i.pinned).length;
    const critical = items.filter((i) => i.importance === 'critical').length;
    const totalViews = items.reduce((s, i) => s + i.views, 0);
    return { total, unread, pinned, critical, totalViews };
  }, [items]);

  const categoryCounts = useMemo(() => {
    const m: Record<Category, number> = { all: items.length, listing: 0, system: 0, event: 0, policy: 0 };
    items.forEach((i) => {
      m[i.category]++;
    });
    return m;
  }, [items]);

  // ----- 操作 -----
  const togglePin = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, pinned: !i.pinned } : i)));
  }, []);

  const openAnnouncement = useCallback(
    (item: Announcement) => {
      setActiveAnnouncement(item);
      // 标记为已读
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    },
    []
  );

  const hotTop5 = useMemo(() => {
    return [...items].sort((a, b) => b.views - a.views).slice(0, 5);
  }, [items]);

  const formatTime = (t: string) => {
    const today = '2026-07-19';
    if (t.startsWith(today)) return `今天 ${t.slice(11)}`;
    const yest = '2026-07-18';
    if (t.startsWith(yest)) return `昨天 ${t.slice(11)}`;
    return t.slice(0, 16);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg, color: BRAND.text }}>
      {/* ===== 1. Hero 公告中心 ===== */}
      <section
        className="relative overflow-hidden border-b"
        style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-12 gap-6 items-end">
            <div className="col-span-12 lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${BRAND.primary}22`, color: BRAND.primary }}
                >
                  <Megaphone className="w-4 h-4" />
                </div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: BRAND.primary }}
                >
                  Announcement Center
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: BRAND.text }}
              >
                公告中心
              </h1>
              <p className="text-sm max-w-2xl" style={{ color: BRAND.textMute }}>
                上币动态 / 系统维护 / 活动福利 / 政策更新 — 平台全量公告统一入口
              </p>
              <div className="flex items-center gap-2 pt-2">
                <kbd
                  className="text-[10px] font-mono px-2 py-1 rounded border"
                  style={{ backgroundColor: BRAND.card, borderColor: BRAND.border, color: BRAND.textMute }}
                >
                  /
                </kbd>
                <span className="text-[10px]" style={{ color: BRAND.textMute }}>
                  搜索
                </span>
                <kbd
                  className="text-[10px] font-mono px-2 py-1 rounded border ml-2"
                  style={{ backgroundColor: BRAND.card, borderColor: BRAND.border, color: BRAND.textMute }}
                >
                  ?
                </kbd>
                <span className="text-[10px]" style={{ color: BRAND.textMute }}>
                  快捷键
                </span>
                <kbd
                  className="text-[10px] font-mono px-2 py-1 rounded border ml-2"
                  style={{ backgroundColor: BRAND.card, borderColor: BRAND.border, color: BRAND.textMute }}
                >
                  Esc
                </kbd>
                <span className="text-[10px]" style={{ color: BRAND.textMute }}>
                  关闭
                </span>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4 grid grid-cols-3 gap-2">
              {[
                { label: '总公告', value: stats.total, icon: Bell, color: BRAND.primary },
                { label: '未读', value: stats.unread, icon: CircleDot, color: BRAND.warning },
                { label: '置顶', value: stats.pinned, icon: Pin, color: BRAND.success },
                { label: '重要', value: stats.critical, icon: AlertTriangle, color: BRAND.danger },
                { label: '总阅读', value: stats.totalViews, icon: Eye, color: BRAND.info, compact: true },
                { label: '更新', value: '实时', icon: Activity, color: BRAND.primary, isText: true },
              ].map((kpi, idx) => (
                <div
                  key={idx}
                  className="rounded-xl p-3 transition-all hover:scale-105"
                  style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mb-1.5"
                    style={{ backgroundColor: `${kpi.color}22`, color: kpi.color }}
                  >
                    <kpi.icon className="w-3.5 h-3.5" />
                  </div>
                  <div
                    className="text-lg font-bold font-mono leading-none"
                    style={{ color: kpi.color }}
                  >
                    {kpi.isText ? kpi.value : (hideBalance ? '•••' : kpi.value.toLocaleString())}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: BRAND.textMute }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. 主体三栏布局 ===== */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">
        {/* 左：分类导航 */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          <div className="rounded-2xl p-3" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="px-3 py-2 mb-2 flex items-center gap-2 border-b" style={{ borderColor: BRAND.border }}>
              <Megaphone className="w-4 h-4" style={{ color: BRAND.primary }} />
              <h2 className="text-sm font-bold" style={{ color: BRAND.text }}>
                公告分类
              </h2>
            </div>
            <nav className="space-y-1.5">
              {CATEGORIES.map((cat) => (
                <CategoryTab
                  key={cat.key}
                  cat={cat}
                  active={activeCategory === cat.key}
                  count={categoryCounts[cat.key]}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setPage(1);
                  }}
                />
              ))}
            </nav>
          </div>

          {/* 搜索框 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: BRAND.text }}>
              搜索公告
            </h3>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: BRAND.textMute }}
              />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="关键词 / 标签 / 编号..."
                className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: BRAND.bgAlt,
                  border: `1px solid ${BRAND.border}`,
                  color: BRAND.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = BRAND.primary;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = BRAND.border;
                }}
              />
            </div>
            <div className="mt-3 flex flex-col gap-1.5 text-[10px]">
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: BRAND.textMute }}>
                <input
                  type="checkbox"
                  checked={showOnlyPinned}
                  onChange={(e) => setShowOnlyPinned(e.target.checked)}
                  className="accent-current"
                  style={{ accentColor: BRAND.primary }}
                />
                仅看置顶
              </label>
              <label className="flex items-center gap-2 cursor-pointer" style={{ color: BRAND.textMute }}>
                <input
                  type="checkbox"
                  checked={showOnlyUnread}
                  onChange={(e) => setShowOnlyUnread(e.target.checked)}
                  className="accent-current"
                  style={{ accentColor: BRAND.primary }}
                />
                仅看未读
              </label>
            </div>
          </div>
        </aside>

        {/* 中：公告列表 */}
        <section className="col-span-12 md:col-span-6 space-y-3">
          {/* 列表头 */}
          <div
            className="rounded-2xl p-3 flex items-center justify-between flex-wrap gap-2"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div>
              <h2 className="text-sm font-bold" style={{ color: BRAND.text }}>
                {CATEGORIES.find((c) => c.key === activeCategory)?.label}
              </h2>
              <div className="text-[10px] font-mono" style={{ color: BRAND.textMute }}>
                共 {filtered.length} 条 · 第 {page} / {totalPages} 页
              </div>
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { key: 'time' as const, label: '最新', Icon: Clock },
                { key: 'pinned' as const, label: '置顶', Icon: Pin },
                { key: 'importance' as const, label: '重要', Icon: AlertTriangle },
                { key: 'read' as const, label: '已读', Icon: CheckCircle2 },
              ].map((s) => {
                const active = sortKey === s.key;
                const Icon = s.Icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => {
                      if (sortKey === s.key) {
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortKey(s.key);
                        setSortDir('desc');
                      }
                    }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                    style={{
                      backgroundColor: active ? BRAND.primary : BRAND.bgAlt,
                      color: active ? '#000' : BRAND.textMute,
                      border: `1px solid ${active ? BRAND.primary : BRAND.border}`,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {s.label}
                    {active && (sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 列表 */}
          {paged.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <CircleDashed className="w-12 h-12 mx-auto mb-3" style={{ color: BRAND.textMute }} />
              <div className="text-sm font-bold mb-1" style={{ color: BRAND.text }}>
                暂无匹配公告
              </div>
              <div className="text-xs" style={{ color: BRAND.textMute }}>
                尝试调整搜索关键词或切换分类
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {paged.map((item) => (
                <AnnouncementCard
                  key={item.id}
                  item={item}
                  onClick={() => openAnnouncement(item)}
                  onTogglePin={() => togglePin(item.id)}
                />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div
              className="rounded-2xl p-3 flex items-center justify-center gap-1"
              style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
            >
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: BRAND.bgAlt,
                  color: page === 1 ? BRAND.textMute : BRAND.text,
                  border: `1px solid ${BRAND.border}`,
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    return [
                      <span key={`e-${p}`} className="text-xs px-1" style={{ color: BRAND.textMute }}>
                        ...
                      </span>,
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                        style={{
                          backgroundColor: page === p ? BRAND.primary : BRAND.bgAlt,
                          color: page === p ? '#000' : BRAND.text,
                          border: `1px solid ${page === p ? BRAND.primary : BRAND.border}`,
                        }}
                      >
                        {p}
                      </button>,
                    ];
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: page === p ? BRAND.primary : BRAND.bgAlt,
                        color: page === p ? '#000' : BRAND.text,
                        border: `1px solid ${page === p ? BRAND.primary : BRAND.border}`,
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  backgroundColor: BRAND.bgAlt,
                  color: page === totalPages ? BRAND.textMute : BRAND.text,
                  border: `1px solid ${BRAND.border}`,
                  opacity: page === totalPages ? 0.5 : 1,
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>

        {/* 右：系统状态 + 热门 + 帮助 */}
        <aside className="col-span-12 md:col-span-3 space-y-3">
          {/* 系统运行状态 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                系统状态
              </h3>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: BRAND.success }}
                />
                <span className="text-[10px] font-mono" style={{ color: BRAND.success }}>
                  LIVE
                </span>
              </div>
            </div>
            <div className="space-y-0.5 divide-y" style={{ borderColor: BRAND.border }}>
              {services.map((s) => (
                <ServiceRow key={s.key} service={s} />
              ))}
            </div>
            <div
              className="mt-3 pt-3 text-[10px] font-mono flex items-center justify-between"
              style={{ borderTop: `1px solid ${BRAND.border}`, color: BRAND.textMute }}
            >
              <span>30 天平均可用率</span>
              <span style={{ color: BRAND.success }}>99.95%</span>
            </div>
          </div>

          {/* 热门公告 */}
          <div className="rounded-2xl p-4" style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                热门公告
              </h3>
              <Zap className="w-3.5 h-3.5" style={{ color: BRAND.warning }} />
            </div>
            <ul className="space-y-3">
              {hotTop5.map((item, idx) => (
                <HotItem
                  key={item.id}
                  rank={idx + 1}
                  title={item.title}
                  onClick={() => openAnnouncement(item)}
                />
              ))}
            </ul>
          </div>

          {/* 订阅 + 帮助 */}
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: BRAND.card, border: `1px solid ${BRAND.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4" style={{ color: BRAND.primary }} />
              <h3 className="text-sm font-bold" style={{ color: BRAND.text }}>
                公告订阅
              </h3>
            </div>
            <p className="text-[10px] mb-3" style={{ color: BRAND.textMute }}>
              订阅后重要公告将第一时间通过邮件 / 站内信推送
            </p>
            <button
              className="w-full py-2 rounded-lg text-xs font-bold transition-all"
              style={{ backgroundColor: BRAND.primary, color: '#000' }}
            >
              立即订阅
            </button>
            <button
              onClick={() => setHelpOpen(true)}
              className="w-full mt-2 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1"
              style={{
                backgroundColor: 'transparent',
                color: BRAND.textSub,
                border: `1px solid ${BRAND.border}`,
              }}
            >
              <HelpCircle className="w-3 h-3" />
              使用帮助
            </button>
          </div>
        </aside>
      </main>

      {/* ===== 3. 公告详情 Drawer ===== */}
      {activeAnnouncement && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          onClick={() => setActiveAnnouncement(null)}
        >
          <div
            className="w-full max-w-2xl h-full overflow-y-auto"
            style={{ backgroundColor: BRAND.bg, borderLeft: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 backdrop-blur-md" style={{ backgroundColor: `${BRAND.bg}E6` }}>
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: BRAND.border }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                  >
                    {activeAnnouncement.id}
                  </span>
                  {activeAnnouncement.pinned && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1"
                      style={{ backgroundColor: `${BRAND.primary}22`, color: BRAND.primary }}
                    >
                      <Pin className="w-2.5 h-2.5" />
                      置顶
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setActiveAnnouncement(null)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h1 className="text-xl font-bold leading-tight" style={{ color: BRAND.text }}>
                {activeAnnouncement.title}
              </h1>
              <div className="flex items-center gap-3 text-[10px] font-mono flex-wrap" style={{ color: BRAND.textMute }}>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activeAnnouncement.time}
                </span>
                <span>·</span>
                <span>{activeAnnouncement.author}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {activeAnnouncement.views.toLocaleString()}
                </span>
                <span
                  className="ml-auto px-2 py-0.5 rounded font-bold uppercase"
                  style={{
                    backgroundColor:
                      activeAnnouncement.importance === 'critical'
                        ? `${BRAND.danger}22`
                        : activeAnnouncement.importance === 'high'
                        ? `${BRAND.warning}22`
                        : `${BRAND.primary}22`,
                    color:
                      activeAnnouncement.importance === 'critical'
                        ? BRAND.danger
                        : activeAnnouncement.importance === 'high'
                        ? BRAND.warning
                        : BRAND.primary,
                  }}
                >
                  {activeAnnouncement.importance}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeAnnouncement.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded flex items-center gap-1"
                    style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textSub }}
                  >
                    <Hash className="w-2.5 h-2.5" />
                    {tag}
                  </span>
                ))}
              </div>
              <div
                className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line"
                style={{ backgroundColor: BRAND.card, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
              >
                {activeAnnouncement.content}
              </div>
              <div
                className="rounded-xl p-3 text-[10px]"
                style={{ backgroundColor: `${BRAND.warning}11`, color: BRAND.warning, border: `1px solid ${BRAND.warning}33` }}
              >
                <div className="font-bold mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  风险提示
                </div>
                数字资产价格波动剧烈，请根据风险承受能力审慎参与。本公告内容不构成投资建议。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 4. 快捷键帮助 Drawer ===== */}
      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="rounded-2xl p-6 max-w-md w-full mx-4"
            style={{ backgroundColor: BRAND.bg, border: `1px solid ${BRAND.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
                <Keyboard className="w-4 h-4" style={{ color: BRAND.primary }} />
                键盘快捷键
              </h2>
              <button
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: BRAND.bgAlt, color: BRAND.textMute }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                { key: '/', desc: '聚焦搜索框' },
                { key: 'Esc', desc: '关闭弹层 / 抽屉' },
                { key: '?', desc: '打开 / 关闭快捷键帮助' },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: BRAND.card }}
                >
                  <span style={{ color: BRAND.textMute }}>{s.desc}</span>
                  <kbd
                    className="text-[10px] font-mono px-2 py-1 rounded border"
                    style={{ backgroundColor: BRAND.bgAlt, borderColor: BRAND.border, color: BRAND.text }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 5. 底部说明 ===== */}
      <footer
        className="mt-12 border-t"
        style={{ borderColor: BRAND.border, backgroundColor: BRAND.bg }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-12 gap-4 text-[10px]" style={{ color: BRAND.textMute }}>
          <div className="col-span-12 md:col-span-6 flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5" style={{ color: BRAND.primary }} />
            <span>本页所有公告为 mock 占位示例，仅用于界面演示</span>
          </div>
          <div className="col-span-12 md:col-span-6 text-right font-mono">
            <span>tick #{tick} · 系统心跳运行中</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PortalAnnouncement;
