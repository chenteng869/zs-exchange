'use client';

import { useState, useCallback } from 'react';
import { Wallet, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useFujianWine } from '@/lib/web3/fujian-wine/useFujianWine';
import type { ProfitBreakdown } from '@/lib/web3/fujian-wine/useFujianWine';
import { PROFIT_ROLES } from '@/lib/web3/fujian-wine/abi';

interface Props {
  priceTier: 369 | 699;
  productName: string;
}

export default function FujianWinePurchase({ priceTier, productName }: Props) {
  const {
    isConnected,
    account,
    isLoading,
    error,
    connect,
    createOrder,
    getProfitBreakdown,
    formatAmount,
  } = useFujianWine();

  const [referrerAddress, setReferrerAddress] = useState('');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdown, setBreakdown] = useState<ProfitBreakdown | null>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleViewBreakdown = useCallback(async () => {
    try {
      const data = await getProfitBreakdown(priceTier);
      setBreakdown(data);
      setShowBreakdown(true);
    } catch (err) {
      console.error('获取分润明细失败:', err);
    }
  }, [priceTier, getProfitBreakdown]);

  const handlePurchase = useCallback(async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    try {
      setOrderSuccess(false);
      setOrderHash(null);

      const referrer = referrerAddress.startsWith('0x') && referrerAddress.length === 42
        ? referrerAddress as `0x${string}`
        : undefined;

      const result = await createOrder(priceTier, referrer);
      setOrderHash(result.hash);
      setOrderSuccess(true);
    } catch (err: any) {
      console.error('下单失败:', err);
    }
  }, [isConnected, connect, createOrder, priceTier, referrerAddress]);

  const handleCopyAddress = useCallback(() => {
    if (account) {
      navigator.clipboard.writeText(account);
    }
  }, [account]);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 14,
    }}>
      <div style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700, marginBottom: 12 }}>
        🔗 链上购买（智能合约自动分润）
      </div>

      {/* 钱包连接状态 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wallet size={16} color={isConnected ? '#34D399' : '#94A3B8'} />
          <span style={{ fontSize: 12, color: isConnected ? '#34D399' : '#94A3B8' }}>
            {isConnected ? '钱包已连接' : '未连接钱包'}
          </span>
        </div>
        {isConnected && account ? (
          <button
            onClick={handleCopyAddress}
            style={{
              fontSize: 11,
              color: '#60A5FA',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {account.substring(0, 6)}...{account.substring(38)}
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isLoading}
            style={{
              fontSize: 11,
              color: '#F0B90B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
            连接钱包
          </button>
        )}
      </div>

      {/* 推荐人地址输入 */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: '#94A3B8', marginBottom: 6, display: 'block' }}>
          推荐人地址（可选，可获得推荐奖励）
        </label>
        <input
          type="text"
          placeholder="0x... 推荐人钱包地址"
          value={referrerAddress}
          onChange={(e) => setReferrerAddress(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            color: '#F8FAFC',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* 分润明细查看 */}
      <button
        onClick={handleViewBreakdown}
        style={{
          width: '100%',
          padding: '8px 0',
          marginBottom: 12,
          fontSize: 12,
          color: '#60A5FA',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        查看 ${priceTier} 分润明细 →
      </button>

      {/* 分润明细弹窗 */}
      {showBreakdown && breakdown && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }} onClick={() => setShowBreakdown(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1E293B',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 700, marginBottom: 4 }}>
              ${priceTier} 分润明细
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>
              40% 产品成本 / 30% AIOPC 提成 / 30% 剩余分润池
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#FCD535', fontWeight: 600, marginBottom: 6 }}>
                产品成本 (40%)
              </div>
              <div style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 800 }}>
                ${formatAmount(breakdown.productCost)}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#FCD535', fontWeight: 600, marginBottom: 6 }}>
                AIOPC 创业家大宗提成 (30%)
              </div>
              <div style={{ fontSize: 18, color: '#F8FAFC', fontWeight: 800 }}>
                ${formatAmount(breakdown.aiopcCommission)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#FCD535', fontWeight: 600, marginBottom: 8 }}>
                剩余分润池 (30%) - ${formatAmount(breakdown.profitPool)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { key: 'zsVenture', amount: breakdown.zsVentureShare, label: '中萨合资公司' },
                  { key: 'overseasCrypto', amount: breakdown.overseasCryptoShare, label: '海外加密资产公司' },
                  { key: 'businessSchool', amount: breakdown.businessSchoolShare, label: '商学院事业部' },
                  { key: 'techTeam', amount: breakdown.techTeamShare, label: '太初国链技术团队' },
                  { key: 'operations', amount: breakdown.operationsShare, label: '运营事业部' },
                  { key: 'affairsDept', amount: breakdown.affairsDeptShare, label: '创业家事务部' },
                  { key: 'referrer', amount: breakdown.referrerShare, label: '推荐人奖励' },
                ].map((item) => (
                  <div key={item.key} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
                      ${formatAmount(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowBreakdown(false)}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '12px 0',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #D2691E, #F0B90B)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 10px',
          background: 'rgba(239,68,68,0.1)',
          borderRadius: 6,
          marginBottom: 12,
        }}>
          <AlertCircle size={14} color="#EF4444" />
          <span style={{ fontSize: 11, color: '#EF4444' }}>{error}</span>
        </div>
      )}

      {/* 成功提示 */}
      {orderSuccess && orderHash && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'rgba(52,211,153,0.1)',
          borderRadius: 8,
          marginBottom: 12,
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <div>
            <div style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>
              下单成功！
            </div>
            <a
              href={`https://sepolia.basescan.org/tx/${orderHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 10,
                color: '#60A5FA',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              查看链上记录 <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* 购买按钮 */}
      <button
        onClick={handlePurchase}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 10,
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          background: isLoading
            ? 'rgba(210,105,30,0.5)'
            : 'linear-gradient(135deg, #D2691E, #F0B90B)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {isLoading && <Loader2 size={18} className="animate-spin" />}
        {isLoading ? '处理中...' : isConnected ? `链上购买 $${priceTier}` : '连接钱包并购买'}
      </button>

      <div style={{
        marginTop: 8,
        fontSize: 10,
        color: '#64748B',
        textAlign: 'center',
      }}>
        所有分润由智能合约自动执行，链上可查，公开透明
      </div>
    </div>
  );
}
