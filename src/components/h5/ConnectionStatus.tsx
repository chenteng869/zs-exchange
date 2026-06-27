'use client';

/**
 * H5 连接状态指示器
 *
 *  - 显示 Binance WS 连接状态
 *  - 决策 A 行为：断线时显示"重连中..."，禁止业务操作
 *  - 多种位置/大小可选
 */

import { WifiOff, Loader2 } from 'lucide-react';

export type ConnStatus = 'connecting' | 'online' | 'offline';

export interface ConnectionStatusProps {
  status: ConnStatus;
  /** 尺寸：'sm' 顶部小角标 / 'lg' 整行 banner */
  size?: 'sm' | 'lg';
  /** 显示文字 */
  showText?: boolean;
}

export function ConnectionStatus({ status, size = 'sm', showText = true }: ConnectionStatusProps) {
  if (status === 'online') {
    if (!showText) return null;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: '#34D399',
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#34D399',
            boxShadow: '0 0 6px rgba(52, 211, 153, 0.6)',
          }}
        />
        实时
      </span>
    );
  }

  if (status === 'connecting') {
    if (size === 'sm') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            color: '#FCD535',
            fontWeight: 600,
          }}
        >
          <Loader2 size={10} color="#FCD535" style={{ animation: 'spin 1s linear infinite' }} />
          连接中
        </span>
      );
    }
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'rgba(252, 213, 53, 0.10)',
          border: '1px solid rgba(252, 213, 53, 0.30)',
          borderRadius: 10,
          color: '#FCD535',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        正在连接 Binance 实时行情…
      </div>
    );
  }

  // offline
  if (size === 'sm') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: '#F472B6',
          fontWeight: 600,
        }}
      >
        <WifiOff size={10} color="#F472B6" />
        重连中
      </span>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px',
        background: 'rgba(244, 114, 182, 0.10)',
        border: '1px solid rgba(244, 114, 182, 0.30)',
        borderRadius: 12,
        color: '#F472B6',
        fontSize: 13,
        fontWeight: 600,
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <WifiOff size={16} />
        行情连接已断开
      </div>
      <div style={{ fontSize: 11, color: '#7B89B8', fontWeight: 500 }}>正在尝试重新连接，请稍候…</div>
    </div>
  );
}
