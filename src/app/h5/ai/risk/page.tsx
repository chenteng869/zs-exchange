'use client';
/** H5 AI 风控审计 - 合约/链上扫描 + 风险评分雷达图 */
import { useState } from 'react';
import { ShieldCheck, Search, AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const SAMPLE_RESULT = {
  address: '0x7a25...e4d8',
  score: 78,
  level: '中风险',
  color: '#FB923C',
  issues: [
    { label: '合约已开源',          pass: true,  text: '✓ 已在 Etherscan 验证源码' },
    { label: '无 mint 函数',         pass: true,  text: '✓ 未发现 owner 任意增发' },
    { label: '无代理升级',           pass: true,  text: '✓ 不可升级合约，代码已锁定' },
    { label: '持币集中度',           pass: false, text: '⚠ Top10 持有 68%，存在砸盘风险' },
    { label: '流动性锁定',           pass: true,  text: '✓ 80% LP 锁定 365 天' },
    { label: '持币地址数',           pass: true,  text: '✓ 持币地址 12,580，过半活跃' },
    { label: '黑客攻击历史',         pass: true,  text: '✓ 无已知漏洞' },
  ],
  radar: [
    { axis: '代码安全', value: 92 },
    { axis: '持币分散', value: 45 },
    { axis: '流动性',   value: 80 },
    { axis: '团队透明', value: 85 },
    { axis: '社区活跃', value: 88 },
    { axis: '合规度',   value: 70 },
  ],
};

export default function H5AIRiskPage() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<typeof SAMPLE_RESULT | null>(null);
  const [addr, setAddr] = useState('');

  const scan = () => {
    setResult(null);
    setScanning(true);
    setTimeout(() => {
      setResult(SAMPLE_RESULT);
      setScanning(false);
    }, 2000);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(251,146,60,0.20) 0%, rgba(217,119,6,0.05) 100%)',
          border: '1px solid rgba(251,146,60,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #FB923C, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(251,146,60,0.4)' }}>
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 风控审计</div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>合约扫描 · 链上画像 · 风险雷达</div>
        </div>
      </div>

      {/* 输入区 */}
      <div
        style={{
          display: 'flex', gap: 8, marginBottom: 14,
          background: 'rgba(26, 36, 86, 0.55)',
          border: '1px solid rgba(148, 163, 184, 0.20)',
          borderRadius: 14, padding: 8,
        }}
      >
        <input
          value={addr}
          onChange={(e) => setAddr(e.target.value)}
          placeholder="输入合约地址 / 项目名 / 代币符号…"
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 12, outline: 'none', padding: '6px 8px' }}
        />
        <button
          onClick={scan}
          disabled={scanning}
          style={{
            padding: '6px 14px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #FB923C, #D97706)',
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {scanning ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={12} />}
          扫描
        </button>
      </div>

      {scanning && (
        <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <Loader2 size={28} color="#FB923C" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>AI 风控引擎扫描中…</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 4 }}>调用链上数据 + 静态分析 + 模式识别</div>
        </div>
      )}

      {result && !scanning && (
        <>
          {/* 评分卡 */}
          <div
            style={{
              background: `linear-gradient(135deg, ${result.color}30 0%, ${result.color}08 100%)`,
              border: `1px solid ${result.color}50`,
              borderRadius: 16, padding: 18, marginBottom: 14, textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 11, color: '#7B89B8' }}>合约地址</div>
            <div style={{ fontSize: 12, color: '#F8FAFC', fontFamily: 'monospace', marginBottom: 8 }}>{result.address}</div>
            <div style={{ fontSize: 56, color: result.color, fontWeight: 800, lineHeight: 1 }}>{result.score}</div>
            <div style={{ fontSize: 14, color: result.color, fontWeight: 700, marginTop: 4 }}>{result.level}</div>
            <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 6 }}>满分 100 · 建议谨慎参与</div>
          </div>

          {/* 雷达图 */}
          <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700, marginBottom: 12 }}>六维风险雷达</div>
            <svg viewBox="0 0 240 240" style={{ width: '100%', maxWidth: 280, display: 'block', margin: '0 auto' }}>
              {/* 网格 */}
              {[0.25, 0.5, 0.75, 1].map((r, i) => (
                <polygon
                  key={i}
                  points={result.radar.map((_, j) => {
                    const angle = (j / result.radar.length) * Math.PI * 2 - Math.PI / 2;
                    return `${120 + Math.cos(angle) * 100 * r},${120 + Math.sin(angle) * 100 * r}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgba(148,163,184,0.20)"
                  strokeWidth="1"
                />
              ))}
              {/* 数值多边形 */}
              <polygon
                points={result.radar.map((p, j) => {
                  const angle = (j / result.radar.length) * Math.PI * 2 - Math.PI / 2;
                  return `${120 + Math.cos(angle) * p.value},${120 + Math.sin(angle) * p.value}`;
                }).join(' ')}
                fill="rgba(251,146,60,0.30)"
                stroke="#FB923C"
                strokeWidth="2"
              />
              {/* 轴线 */}
              {result.radar.map((p, j) => {
                const angle = (j / result.radar.length) * Math.PI * 2 - Math.PI / 2;
                return (
                  <g key={j}>
                    <line x1="120" y1="120" x2={120 + Math.cos(angle) * 100} y2={120 + Math.sin(angle) * 100} stroke="rgba(148,163,184,0.20)" />
                    <text x={120 + Math.cos(angle) * 115} y={120 + Math.sin(angle) * 115} fontSize="11" fill="#7B89B8" textAnchor="middle" dy="4">{p.axis}</text>
                    <text x={120 + Math.cos(angle) * (p.value + 12)} y={120 + Math.sin(angle) * (p.value + 12)} fontSize="10" fill="#FB923C" textAnchor="middle" dy="3" fontWeight="700">{p.value}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 详细检测项 */}
          <div style={{ background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 14, padding: 4 }}>
            {result.issues.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < result.issues.length - 1 ? '1px solid rgba(148,163,184,0.08)' : 'none' }}>
                {it.pass ? <CheckCircle2 size={16} color="#34D399" /> : <AlertTriangle size={16} color="#F472B6" />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{it.label}</div>
                  <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{it.text}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
