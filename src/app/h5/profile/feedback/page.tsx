'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Star,
  Camera,
  Send,
  CheckCircle2,
  Bug,
  Lightbulb,
  HelpCircle,
  ThumbsUp,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'bug',     label: '功能异常', icon: Bug,        color: '#F472B6' },
  { id: 'advice',  label: '产品建议', icon: Lightbulb,  color: '#F0B90B' },
  { id: 'help',    label: '使用问题', icon: HelpCircle, color: '#38BDF8' },
  { id: 'praise',  label: '表扬鼓励', icon: ThumbsUp,   color: '#34D399' },
];

export default function H5ProfileFeedbackPage() {
  const [category, setCategory] = useState('advice');
  const [rating, setRating] = useState(4);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (!content.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContent('');
    }, 2500);
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>意见反馈</span>
      </div>

      {/* 顶部插画卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 18,
          padding: 20,
          marginBottom: 12,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              boxShadow: '0 6px 20px rgba(56, 189, 248, 0.40)',
            }}
          >
            <MessageSquare size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#F8FAFC' }}>
            您的反馈是我们前进的动力
          </div>
          <div style={{ fontSize: 11, color: '#B4C0E0', marginTop: 4, lineHeight: 1.6 }}>
            每一份建议都会被产品团队认真阅读<br />
            优质反馈可获得神秘奖励 🎁
          </div>
        </div>
      </div>

      {/* 评分 */}
      <Card title="给 ZS Exchange 评分">
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '4px 0' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              <Star
                size={32}
                fill={s <= rating ? '#F0B90B' : 'transparent'}
                color={s <= rating ? '#F0B90B' : '#7B89B8'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: '#FCD535',
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {rating === 5
            ? '非常满意 🎉'
            : rating === 4
            ? '比较满意'
            : rating === 3
            ? '一般般'
            : rating === 2
            ? '需要改进'
            : '非常失望'}
        </div>
      </Card>

      {/* 分类 */}
      <Card title="问题类型">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  background: active ? `${c.color}26` : 'rgba(15, 27, 61, 0.40)',
                  border: `1px solid ${active ? c.color : 'rgba(148, 163, 184, 0.12)'}`,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <Icon size={20} color={active ? c.color : '#7B89B8'} style={{ marginBottom: 4 }} />
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: active ? c.color : '#7B89B8',
                  }}
                >
                  {c.label}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* 内容 */}
      <Card title="详细描述">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请详细描述您遇到的问题或建议...(至少 10 字)"
          rows={5}
          maxLength={500}
          style={{
            width: '100%',
            background: 'rgba(15, 27, 61, 0.40)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 10,
            padding: 10,
            color: '#F8FAFC',
            fontSize: 12,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
          }}
        >
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.10)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38BDF8',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Camera size={12} /> 添加截图
          </button>
          <span style={{ fontSize: 10, color: '#7B89B8' }}>{content.length} / 500</span>
        </div>
      </Card>

      {/* 联系方式 */}
      <Card title="联系方式 (选填)">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="邮箱 / 手机号 / 微信号"
          style={{
            width: '100%',
            background: 'rgba(15, 27, 61, 0.40)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 10,
            padding: '10px 12px',
            color: '#F8FAFC',
            fontSize: 13,
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 6 }}>
          留下联系方式方便我们回复您，处理结果将通过此渠道通知
        </div>
      </Card>

      {/* 提交按钮 */}
      <button
        onClick={submit}
        style={{
          width: '100%',
          marginTop: 14,
          padding: '14px 0',
          background: submitted
            ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
            : 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#0F1B3D',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        {submitted ? (
          <><CheckCircle2 size={16} /> 提交成功，感谢反馈</>
        ) : (
          <><Send size={16} /> 提交反馈</>
        )}
      </button>

      {/* 其他渠道 */}
      <Card title="其他反馈渠道" noPad>
        <ContactRow icon={Phone} iconColor="#34D399" label="客服热线" value="+1 (684) 1234-5678" />
        <ContactRow icon={Mail} iconColor="#F0B90B" label="邮件反馈" value="feedback@zse.exchange" />
        <ContactRow icon={MessageSquare} iconColor="#38BDF8" label="官方微信" value="@ZSE_Official" last />
      </Card>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Card({
  title,
  children,
  noPad,
}: {
  title: string;
  children: React.ReactNode;
  noPad?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          margin: '0 4px 8px',
        }}
      >
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
      </div>
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: noPad ? 0 : 14,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  iconColor,
  label,
  value,
  last,
}: {
  icon: React.ElementType;
  iconColor: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${iconColor}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
        <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, marginTop: 2 }}>{value}</div>
      </div>
      <ChevronRight size={14} color="#7B89B8" />
    </div>
  );
}
