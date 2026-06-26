'use client';
/** H5 AI 智能客服 - 聊天界面 */
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Send, Sparkles, Bot, User, Loader2, History } from 'lucide-react';

interface Msg { role: 'user' | 'ai'; text: string; }

const QUICK = ['BTC 现在能买吗？', '今日热门币种', '如何开通合约？', 'OTC 限额多少？'];

const SEED: Msg[] = [
  { role: 'ai', text: '你好，我是 ZS-AI 智能客服小 Z 👋\n我可以帮你解答交易、行情、账户等问题。' },
  { role: 'ai', text: '你可以直接输入问题，或点击下方快捷问题开始 ✨' },
];

function fakeAIResponse(q: string): string {
  if (q.includes('BTC')) return '当前 BTC 报价 $68,420，24h +2.3%。\nAI 趋势研判：短线震荡偏多，注意 67,800 支撑。\n建议关注：突破 69,000 可轻仓做多，止损 67,500。';
  if (q.includes('热门')) return '今日热门 TOP 3：\n1. SOL  +8.4%  突破压力位\n2. PEPE +12.1% MEME 轮动\n3. TON  +5.2% 消息面催化';
  if (q.includes('合约')) return '开通合约步骤：\n1. 完成 KYC 二级认证\n2. 划转 USDT 至合约账户\n3. 进入"交易 → 永续合约"\n\n目前合约手续费 Maker 0.02% / Taker 0.05%，VIP 等级越高越优惠。';
  if (q.includes('OTC')) return 'OTC 单笔限额：\n• 基础用户  ¥100 - ¥50,000\n• 高级 KYC  ¥100 - ¥500,000\n• 商家用户  无上限\n\n大额请联系商家走担保交易。';
  return '已收到你的问题：「' + q + '」\n我正在调度最合适的 AI 模型为你解答，请稍候 ⏳';
}

export default function H5AIChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(SEED);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);

  const send = (text: string) => {
    if (!text.trim() || thinking) return;
    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: 'ai', text: fakeAIResponse(text) }]);
      setThinking(false);
    }, 900);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* 顶部 AI 状态条 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)',
          borderRadius: 14,
          padding: 12,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(167,139,250,0.5)',
          }}
        >
          <Bot size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>小 Z · ZS-AI 客服</div>
          <div style={{ fontSize: 10, color: '#34D399' }}>● 在线 · 平均响应 1.2s</div>
        </div>
        <Link
          href="/h5/ai/chat/history"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '4px 10px', borderRadius: 8,
            background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 10, fontWeight: 700, textDecoration: 'none',
          }}
        >
          <History size={10} /> 历史
        </Link>
      </div>

      {/* 消息流 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 4px' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10, gap: 8 }}>
            {m.role === 'ai' && (
              <div style={{ width: 28, height: 28, borderRadius: 10, background: 'linear-gradient(135deg, #A78BFA, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles size={14} color="#fff" />
              </div>
            )}
            <div
              style={{
                maxWidth: '78%',
                padding: '10px 12px',
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.role === 'user' ? 'linear-gradient(135deg, #38BDF8, #2563EB)' : 'rgba(26, 36, 86, 0.65)',
                border: m.role === 'ai' ? '1px solid rgba(148, 163, 184, 0.12)' : 'none',
                fontSize: 12.5, color: '#F8FAFC', lineHeight: 1.6, whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 28, height: 28, borderRadius: 10, background: 'rgba(56,189,248,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={14} color="#38BDF8" />
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 10, background: 'linear-gradient(135deg, #A78BFA, #F472B6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div style={{ padding: '10px 12px', borderRadius: '14px 14px 14px 4px', background: 'rgba(26, 36, 86, 0.65)', border: '1px solid rgba(148, 163, 184, 0.12)', display: 'flex', gap: 4, alignItems: 'center' }}>
              <Loader2 size={12} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, color: '#7B89B8' }}>AI 思考中…</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* 快捷问题 */}
      {msgs.length <= 2 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0', marginBottom: 6 }}>
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: 12, fontSize: 11,
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.30)',
                color: '#A78BFA', cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(26, 36, 86, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.20)',
          borderRadius: 14, padding: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder="问问 AI 任何事…"
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: 13, outline: 'none', padding: '4px 8px' }}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || thinking}
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: input.trim() && !thinking ? 'linear-gradient(135deg, #A78BFA, #F472B6)' : 'rgba(123,137,184,0.20)',
            border: 'none', color: '#fff', cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={14} />
        </button>
      </div>
      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
