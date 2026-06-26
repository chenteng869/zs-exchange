'use client';

/**
 * H5 交易历史页
 */
import { useState } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown } from 'lucide-react';
import { getWalletTx } from '@/lib/h5-mock';

type Filter = 'all' | 'deposit' | 'withdraw' | 'transfer';

export default function H5HistoryPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const txs = getWalletTx();

  let list = txs;
  if (filter === 'deposit')  list = txs.filter((t) => t.type === 'deposit');
  if (filter === 'withdraw') list = txs.filter((t) => t.type === 'withdraw');
  if (filter === 'transfer') list = txs.filter((t) => t.type.includes('transfer'));

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>交易历史</span>
      </div>

      {/* 筛选 Tab */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { k: 'all',      l: '全部' },
          { k: 'deposit',  l: '充值' },
          { k: 'withdraw', l: '提现' },
          { k: 'transfer', l: '划转' },
        ].map((t) => {
          const active = t.k === filter;
          return (
            <button
              key={t.k}
              onClick={() => setFilter(t.k as Filter)}
              style={{
                padding: '6px 14px', borderRadius: 16,
                background: active ? 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)' : 'rgba(148, 163, 184, 0.10)',
                color: active ? '#0F1B3D' : '#B4C0E0',
                border: 'none', fontSize: 12, fontWeight: active ? 700 : 500,
                cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {/* 时间分组 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '10px 14px', fontSize: 11, color: '#7B89B8', borderBottom: '1px solid rgba(148, 163, 184, 0.10)' }}>
          2026-06
        </div>
        {list.map((tx, i) => {
          const isIn = tx.type === 'deposit' || tx.type === 'transfer_in';
          return (
            <div
              key={tx.id}
              style={{
                display: 'flex', alignItems: 'center', padding: 12, gap: 10,
                borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              }}
            >
              <div
                style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: isIn ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isIn ? <ArrowDownToLine size={14} color="#34D399" /> : <ArrowUpFromLine size={14} color="#F472B6" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>
                  {tx.type === 'deposit' && '充值'}
                  {tx.type === 'withdraw' && '提现'}
                  {tx.type === 'transfer_in' && '转入'}
                  {tx.type === 'transfer_out' && '转出'} {tx.symbol}
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{tx.time}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: 13,
                    color: isIn ? '#34D399' : '#F472B6',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {isIn ? '+' : '-'}{tx.amount.replace(/^[+-]/, '')}
                </div>
                <div style={{ fontSize: 10, color: tx.status === 'success' ? '#34D399' : '#FCD535', marginTop: 2 }}>
                  {tx.status === 'success' && '● 已完成'}
                  {tx.status === 'pending' && '● 处理中'}
                  {tx.status === 'failed' && '● 失败'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}