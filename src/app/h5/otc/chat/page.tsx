'use client';
import { useState } from 'react';
import {
  MessageCircle, Send, Paperclip, ArrowLeft, Phone, Video, MoreVertical, Image as ImageIcon, Smile, ShieldCheck,
} from 'lucide-react';

const INIT_MESSAGES = [
  { id: 1, from: 'merchant', text: '您好，欢迎咨询 ZS Exchange OTC 服务，请问需要买币还是卖币？', time: '10:00', avatar: 'B' },
  { id: 2, from: 'me',       text: '我想买 1000 USDT',                                              time: '10:01' },
  { id: 3, from: 'merchant', text: '好的，当前买价 7.18 CNY/USDT，1000 USDT 共计 ¥7,180。\n付款方式：银行转账/支付宝/微信 都支持。\n请问您选择哪种支付方式？', time: '10:01', avatar: 'B' },
  { id: 4, from: 'me',       text: '用支付宝',                                                      time: '10:02' },
  { id: 5, from: 'merchant', text: '请使用以下支付宝账号付款：\n\n账号：example@alipay.com\n姓名：张三\n金额：¥7,180.00\n备注：请备注您的订单号', time: '10:02', avatar: 'B' },
  { id: 6, from: 'me',       text: '已付款，请查收',                                                time: '10:15' },
  { id: 7, from: 'merchant', text: '收到款项，正在为您放币...',                                       time: '10:16', avatar: 'B' },
];

export default function H5OtcChatPage() {
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: messages.length + 1, from: 'me', text: input, time: '10:30' }]);
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: 'linear-gradient(180deg, #0F1B3D 0%, #131E45 100%)' }}>
      {/* 顶部 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'rgba(15, 27, 61, 0.80)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(148, 163, 184, 0.10)' }}>
        <a href="/h5/otc/market" style={{ color: '#7B89B8', textDecoration: 'none' }}><ArrowLeft size={18} /></a>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>B</div>
          <div style={{ position: 'absolute', right: -2, bottom: -2, width: 10, height: 10, borderRadius: '50%', background: '#34D399', border: '2px solid #0F1B3D' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>币安大客户部</span>
            <ShieldCheck size={11} color="#38BDF8" />
          </div>
          <div style={{ fontSize: 9, color: '#34D399' }}>在线 · 平均 2 分钟回复</div>
        </div>
        <button style={{ color: '#7B89B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><Phone size={16} /></button>
        <button style={{ color: '#7B89B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><Video size={16} /></button>
        <button style={{ color: '#7B89B8', background: 'transparent', border: 'none', cursor: 'pointer' }}><MoreVertical size={16} /></button>
      </div>

      {/* 提示条 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(56, 189, 248, 0.10)', borderBottom: '1px solid rgba(56, 189, 248, 0.20)' }}>
        <ShieldCheck size={12} color="#38BDF8" />
        <span style={{ fontSize: 10, color: '#38BDF8' }}>ZS Exchange OTC 担保交易，请勿脱离平台交易</span>
      </div>

      {/* 消息列表 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map(m => (
          <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-start' }}>
            {m.from === 'merchant' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{m.avatar}</div>
            )}
            <div style={{ maxWidth: '70%' }}>
              <div style={{ padding: '8px 12px', background: m.from === 'me' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.80) 0%, rgba(21, 34, 74, 0.80) 100%)', borderRadius: 12, color: m.from === 'me' ? '#0F1B3D' : '#F8FAFC', fontSize: 13, whiteSpace: 'pre-line', lineHeight: 1.6, border: m.from === 'merchant' ? '1px solid rgba(148, 163, 184, 0.10)' : 'none' }}>
                {m.text}
              </div>
              <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 3, textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
            </div>
            {m.from === 'me' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#0F1B3D', flexShrink: 0 }}>我</div>
            )}
          </div>
        ))}
      </div>

      {/* 输入区 */}
      <div style={{ padding: 10, background: 'rgba(15, 27, 61, 0.80)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(148, 163, 184, 0.10)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paperclip size={16} />
        </button>
        <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageIcon size={16} />
        </button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="输入消息..."
          style={{ flex: 1, padding: '8px 12px', background: 'rgba(15, 27, 61, 0.60)', border: '1px solid rgba(148, 163, 184, 0.20)', borderRadius: 20, color: '#F8FAFC', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
        <button style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', color: '#7B89B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Smile size={16} />
        </button>
        <button onClick={send} style={{ width: 36, height: 32, borderRadius: 16, background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', border: 'none', color: '#0F1B3D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
