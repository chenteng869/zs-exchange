'use client';

/**
 * H5 钱包连接按钮
 *
 *  - 未连：显示"连接钱包"按钮（多钱包选择）
 *  - 已连：显示地址（ENS 优先）+ 当前链名 + 下拉菜单
 *  - 集成 3 个钱包：MetaMask / WalletConnect / Coinbase
 *
 *  设计要求：
 *  - 顶部 sticky，不影响主导航
 *  - 移动端友好：触屏大按钮
 */

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useEnsName, useChainId, useSwitchChain } from 'wagmi';
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { shortAddress } from '@/lib/web3/wagmi-config';

const CHAIN_META: Record<number, { name: string; color: string; bg: string }> = {
  [mainnet.id]:  { name: 'Ethereum',  color: '#627EEA', bg: 'rgba(98, 126, 234, 0.15)' },
  [bsc.id]:      { name: 'BSC',       color: '#F0B90B', bg: 'rgba(240, 185, 11, 0.15)' },
  [polygon.id]:  { name: 'Polygon',   color: '#8247E5', bg: 'rgba(130, 71, 229, 0.15)' },
  [arbitrum.id]: { name: 'Arbitrum',  color: '#28A0F0', bg: 'rgba(40, 160, 240, 0.15)' },
};

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const { chains, switchChain, isPending: switching } = useSwitchChain();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ============ 未连接 ============
  if (!isConnected) {
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 10, border: '1px solid rgba(240, 185, 11, 0.30)',
            background: 'linear-gradient(135deg, rgba(240,185,11,0.20) 0%, rgba(167,139,250,0.10) 100%)',
            color: '#F0B90B', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Wallet size={13} />
          连接钱包
          <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
        </button>

        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 240,
                background: 'linear-gradient(180deg, #1A2456 0%, #15224A 100%)',
                border: '1px solid rgba(240, 185, 11, 0.30)',
                borderRadius: 14, padding: 8,
                boxShadow: '0 8px 32px rgba(0,0,0,0.50)',
                zIndex: 100,
              }}
            >
              <div style={{ fontSize: 11, color: '#7B89B8', padding: '6px 10px' }}>选择钱包</div>
              {connectors.map((c) => (
                <button
                  key={c.uid}
                  onClick={() => { connect({ connector: c }); setOpen(false); }}
                  disabled={isPending}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 12px', borderRadius: 10, border: 'none',
                    background: 'transparent', color: '#F8FAFC',
                    fontSize: 13, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.10)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <WalletIcon id={c.id} />
                  <span>{c.name}</span>
                  {isPending && <Loader2 size={12} style={{ marginLeft: 'auto', animation: 'spin 1s linear infinite' }} />}
                </button>
              ))}
              {error && (
                <div style={{ padding: 10, marginTop: 6, fontSize: 10, color: '#F472B6', background: 'rgba(244, 114, 182, 0.10)', borderRadius: 8 }}>
                  <AlertTriangle size={11} style={{ display: 'inline-block', verticalAlign: -1, marginRight: 4 }} />
                  {error.message.slice(0, 80)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ============ 已连接 ============
  const chain = CHAIN_META[chainId] || { name: `Chain ${chainId}`, color: '#7B89B8', bg: 'rgba(148,163,184,0.15)' };
  const supported = chains.some((c) => c.id === chainId);
  const label = ensName || shortAddress(address);

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 10px', borderRadius: 10,
          border: `1px solid ${chain.color}55`,
          background: 'rgba(15, 27, 61, 0.60)',
          color: '#F8FAFC', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <span
          style={{
            padding: '2px 6px', borderRadius: 6, fontSize: 9, fontWeight: 800,
            color: chain.color, background: chain.bg,
          }}
        >
          {chain.name}
        </span>
        <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <ChevronDown size={11} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: 260, padding: 10,
              background: 'linear-gradient(180deg, #1A2456 0%, #15224A 100%)',
              border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: 14,
              boxShadow: '0 8px 32px rgba(0,0,0,0.50)', zIndex: 100,
            }}
          >
            {/* 完整地址 + 复制 */}
            <div
              style={{
                padding: '8px 10px', background: 'rgba(148, 163, 184, 0.05)',
                borderRadius: 8, marginBottom: 8, fontSize: 10, color: '#7B89B8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                wordBreak: 'break-all',
              }}
            >
              {address}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              <button
                onClick={copy}
                style={{
                  padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.20)',
                  background: 'rgba(148, 163, 184, 0.05)', color: '#F8FAFC',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                {copied ? <Check size={11} color="#34D399" /> : <Copy size={11} />}
                {copied ? '已复制' : '复制地址'}
              </button>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank" rel="noreferrer"
                style={{
                  padding: '6px 8px', borderRadius: 8, border: '1px solid rgba(148, 163, 184, 0.20)',
                  background: 'rgba(148, 163, 184, 0.05)', color: '#F8FAFC',
                  fontSize: 11, fontWeight: 600, textDecoration: 'none', textAlign: 'center',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}
              >
                <ExternalLink size={11} /> 区块浏览器
              </a>
            </div>

            {/* 切链 */}
            <div style={{ fontSize: 10, color: '#7B89B8', padding: '4px 6px', marginBottom: 4 }}>切换网络</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
              {[mainnet, bsc, polygon, arbitrum].map((c) => {
                const active = c.id === chainId;
                return (
                  <button
                    key={c.id}
                    onClick={() => switchChain({ chainId: c.id })}
                    disabled={switching}
                    style={{
                      padding: '6px 8px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: active ? CHAIN_META[c.id].bg : 'rgba(148, 163, 184, 0.05)',
                      border: `1px solid ${active ? CHAIN_META[c.id].color : 'rgba(148, 163, 184, 0.15)'}`,
                      color: active ? CHAIN_META[c.id].color : '#B4C0E0',
                    }}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>

            {/* 不支持提示 */}
            {!supported && (
              <div
                style={{
                  padding: 8, marginBottom: 8, fontSize: 10, color: '#F472B6',
                  background: 'rgba(244, 114, 182, 0.10)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <AlertTriangle size={11} /> 当前网络不支持，请切换
              </div>
            )}

            <button
              onClick={() => { disconnect(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                padding: '8px 10px', borderRadius: 8, border: 'none',
                background: 'rgba(244, 114, 182, 0.10)', color: '#F472B6',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <LogOut size={12} /> 断开连接
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// 钱包图标（按 connector id 区分）
// =============================================================================
function WalletIcon({ id }: { id: string }) {
  if (id === 'metaMask') {
    return (
      <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F1B3D', fontSize: 11, fontWeight: 800 }}>M</div>
    );
  }
  if (id === 'coinbaseWalletSDK') {
    return (
      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#1652F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>C</div>
    );
  }
  if (id === 'walletConnect') {
    return (
      <div style={{ width: 22, height: 22, borderRadius: 6, background: '#3B99FC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>W</div>
    );
  }
  return (
    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(148, 163, 184, 0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
      <Wallet size={12} />
    </div>
  );
}
