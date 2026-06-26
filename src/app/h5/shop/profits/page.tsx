'use client';
/**
 * H5 福建老酒 - 分润明细
 */
import Link from 'next/link';
import { useState } from 'react';
import { ChevronRight, ArrowUpRight, Wallet, TrendingUp, Gift, DollarSign, Users } from 'lucide-react';

const PROFIT_RECORDS = [
  { id: 1, type: 'direct', title: '直推奖励 - 福建老酒·369', amount: 36.9, date: '2024-06-25 14:32', from: '张小明', status: 'done' },
  { id: 2, type: 'direct', title: '直推奖励 - 福建老酒·699', amount: 83.88, date: '2024-06-25 10:15', from: '李华', status: 'done' },
  { id: 3, type: 'team', title: '团队分润 - V2级差', amount: 25.6, date: '2024-06-24 18:45', from: '王芳团队', status: 'done' },
  { id: 4, type: 'direct', title: '直推奖励 - 福建老酒·369', amount: 36.9, date: '2024-06-24 11:20', from: '陈强', status: 'done' },
  { id: 5, type: 'team', title: '团队分润 - V3级差', amount: 128.5, date: '2024-06-23 20:10', from: '团队业绩', status: 'done' },
  { id: 6, type: 'direct', title: '直推奖励 - 企业定制·坛装', amount: 199.9, date: '2024-06-23 09:30', from: '刘燕', status: 'done' },
  { id: 7, type: 'withdraw', title: '提现到钱包', amount: -500, date: '2024-06-22 16:00', from: 'USDT钱包', status: 'done' },
  { id: 8, type: 'team', title: '团队分润 - 平级奖', amount: 45.2, date: '2024-06-22 14:20', from: '张小明团队', status: 'done' },
  { id: 9, type: 'direct', title: '直推奖励 - 福建老酒·699', amount: 83.88, date: '2024-06-21 15:45', from: '赵雪', status: 'pending' },
];

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'direct', label: '直推奖励' },
  { key: 'team', label: '团队分润' },
  { key: 'withdraw', label: '提现记录' },
];

export default function H5ProfitsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all'
    ? PROFIT_RECORDS
    : PROFIT_RECORDS.filter(r => r.type === activeTab);

  const totalProfit = PROFIT_RECORDS.filter(r => r.amount > 0).reduce((sum, r) => sum + r.amount, 0);
  const monthProfit = PROFIT_RECORDS.filter(r => r.amount > 0 && r.date.startsWith('2024-06')).reduce((sum, r) => sum + r.amount, 0);

  return (
    <div style={{ padding: '12px', paddingBottom: 80, background: '#0F172A', minHeight: '100vh' }}>
      {/* 顶部标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Link href="/h5/shop" style={{ color: '#F8FAFC' }}>
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
        </Link>
        <span style={{ fontSize: 17, color: '#F8FAFC', fontWeight: 700 }}>分润明细</span>
      </div>

      {/* 收益总览卡片 */}
      <div style={{
        background: 'linear-gradient(135deg, #065F46 0%, #047857 40%, #10B981 100%)',
        borderRadius: 16, padding: 18, marginBottom: 14, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 80, opacity: 0.1 }}>💰</div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>累计总收益</div>
          <div style={{ fontSize: 32, color: '#fff', fontWeight: 800, marginBottom: 12 }}>
            ¥{totalProfit.toFixed(2)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>本月收益</div>
              <div style={{ fontSize: 16, color: '#FCD535', fontWeight: 700, marginTop: 4 }}>¥{monthProfit.toFixed(2)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>可提现</div>
              <div style={{ fontSize: 16, color: '#fff', fontWeight: 700, marginTop: 4 }}>¥1,256.86</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>已提现</div>
              <div style={{ fontSize: 16, color: '#fff', fontWeight: 700, marginTop: 4 }}>¥500.00</div>
            </div>
          </div>
        </div>
      </div>

      {/* 提现按钮 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <button style={{
          flex: 1, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #D2691E, #F0B90B)', color: '#fff',
          fontSize: 14, fontWeight: 700,
        }}>
          立即提现
        </button>
        <button style={{
          flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
          background: 'rgba(255,255,255,0.04)', color: '#E2E8F0',
          fontSize: 14, fontWeight: 600,
        }}>
          收益规则
        </button>
      </div>

      {/* 数据统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { icon: TrendingUp, label: '直推奖励', value: '¥441.46', color: '#F0B90B' },
          { icon: Users, label: '团队分润', value: '¥199.30', color: '#A78BFA' },
          { icon: Gift, label: '平级奖励', value: '¥45.20', color: '#F472B6' },
          { icon: DollarSign, label: '其他奖励', value: '¥0.00', color: '#34D399' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Icon size={16} color={item.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 13, color: item.color, fontWeight: 700 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 4 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.key ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === tab.key ? '#F8FAFC' : '#94A3B8',
              fontSize: 12, fontWeight: activeTab === tab.key ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 分润记录列表 */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        {filtered.map((r, i) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', padding: '14px',
            borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: r.type === 'direct' ? 'rgba(240,185,11,0.15)' :
                r.type === 'team' ? 'rgba(167,139,250,0.15)' :
                r.type === 'withdraw' ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r.type === 'direct' && <TrendingUp size={16} color="#F0B90B" />}
              {r.type === 'team' && <Users size={16} color="#A78BFA" />}
              {r.type === 'withdraw' && <Wallet size={16} color="#EF4444" />}
            </div>
            <div style={{ flex: 1, marginLeft: 10 }}>
              <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 500 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                来自: {r.from} · {r.date}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 14, fontWeight: 700,
                color: r.amount > 0 ? '#10B981' : '#EF4444',
              }}>
                {r.amount > 0 ? '+' : ''}¥{Math.abs(r.amount).toFixed(2)}
              </div>
              <div style={{ fontSize: 10, marginTop: 2, color: r.status === 'done' ? '#10B981' : '#F59E0B' }}>
                {r.status === 'done' ? '已到账' : '待结算'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: 13 }}>
          暂无记录
        </div>
      )}
    </div>
  );
}
