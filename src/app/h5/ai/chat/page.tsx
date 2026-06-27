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

export default function H5AIChatPage() {
  const [msgs, setMsgs] = useState<Msg[]>(SEED);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, thinking]);

  const send = async (text: string) => {
    if (!text.trim() || thinking) return;
    const userMsg: Msg = { role: 'user', text };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setThinking(true);
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: msgs.slice(-6) }),
      });
      const data = await res.json();
      const reply = data?.data?.reply || '抱歉，AI 暂时无法回复，请稍后再试。';
      setMsgs((m) => [...m, { role: 'ai', text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: 'ai', text: '网络异常，请检查连接后重试。' }]);
    } finally {
      setThinking(false);
    }
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
