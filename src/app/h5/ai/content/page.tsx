'use client';
/** H5 AI 内容生成 - 研报/摘要生成器 */
import { useState } from 'react';
import { FileText, Sparkles, Loader2, Download, Copy } from 'lucide-react';

const TEMPLATES = [
  { id: 'report',   name: '项目研报',    icon: '📊', desc: 'AI 深度分析项目基本面、赛道、团队' },
  { id: 'summary',  name: '新闻摘要',    icon: '📰', desc: '长文一键生成 200 字摘要' },
  { id: 'tweet',    name: '推文生成',    icon: '🐦', desc: '行情/事件自动生成社交媒体文案' },
  { id: 'weekly',   name: '周报生成',    icon: '📅', desc: '本周市场数据自动整理' },
];

const SAMPLE = `【BTC 深度研报】

一、行情概览
本周 BTC 突破 68,000 关键阻力位，周涨幅 +5.8%。链上数据：
• 巨鲸地址（>1000 BTC）增持 12,580 枚
• 交易所余额创 3 年新低 -28,420 枚
• 长期持有者占比上升至 76.4%

二、AI 量化研判
• 短期：1-3 日看多，阻力 72,000，支撑 66,800
• 中期：1-2 周震荡偏多，注意美联储议息
• 长期：减半后 12 个月周期看多至 95,000-110,000

三、风险提示
• 美元强势反弹可能引发回调
• 山寨币吸血效应
• 监管政策不确定性

> 本研报由 ZS-AI 引擎生成，仅供参考，不构成投资建议`;

export default function H5AIContentPage() {
  const [picked, setPicked] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState('');

  const generate = (id: string) => {
    setPicked(id);
    setOutput('');
    setGenerating(true);
    setTimeout(() => {
      setOutput(SAMPLE);
      setGenerating(false);
    }, 1800);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(52,211,153,0.20) 0%, rgba(34,197,94,0.05) 100%)',
          border: '1px solid rgba(52,211,153,0.30)',
          borderRadius: 16, padding: 16, marginBottom: 14,
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #34D399, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(52,211,153,0.4)' }}>
          <FileText size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 16, color: '#F8FAFC', fontWeight: 800 }}>AI 内容生成</div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>研报 / 摘要 / 周报 · 一键生成</div>
        </div>
      </div>

      {/* 模板选择 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 14 }}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => generate(t.id)}
            disabled={generating}
            style={{
              padding: 16, borderRadius: 14, textAlign: 'left',
              background: picked === t.id ? 'linear-gradient(135deg, rgba(52,211,153,0.20), rgba(52,211,153,0.05))' : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: picked === t.id ? '1px solid rgba(52,211,153,0.50)' : '1px solid rgba(148,163,184,0.12)',
              color: '#F8FAFC', cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.name}</div>
            <div style={{ fontSize: 10, color: '#7B89B8' }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* 生成中 / 结果 */}
      {generating && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(52,211,153,0.30)',
            borderRadius: 14, padding: 24, textAlign: 'center',
          }}
        >
          <Loader2 size={28} color="#34D399" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>AI 正在生成...</div>
          <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 4 }}>调度 GPT-4o + 链上数据分析</div>
        </div>
      )}

      {output && !generating && (
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(52,211,153,0.30)',
            borderRadius: 14, padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Sparkles size={12} color="#34D399" />
            <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 700 }}>生成结果</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', color: '#34D399', fontSize: 10, cursor: 'pointer' }}>
                <Copy size={10} /> 复制
              </button>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.30)', color: '#34D399', fontSize: 10, cursor: 'pointer' }}>
                <Download size={10} /> 导出
              </button>
            </div>
          </div>
          <pre style={{ fontSize: 11.5, color: '#E5E7EB', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{output}</pre>
        </div>
      )}

      <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
