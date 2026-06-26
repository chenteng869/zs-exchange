'use client';

import { useState } from 'react';
import {
  User,
  Camera,
  Check,
  ChevronRight,
  AtSign,
  Mail,
  Phone,
  Calendar,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { getUserProfile } from '@/lib/h5-mock';

export default function H5ProfileEditPage() {
  const u = getUserProfile();
  const [nickname, setNickname] = useState(u.nickname);
  const [bio, setBio] = useState('专注现货与合约交易，长期价值投资。');
  const [email, setEmail] = useState(u.email);
  const [phone, setPhone] = useState(u.phone);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [country, setCountry] = useState('中国');
  const [saved, setSaved] = useState(false);

  const onSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>编辑资料</span>
      </div>

      {/* 头像卡 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(56, 189, 248, 0.10) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
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
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.40)',
            }}
          >
            {nickname.charAt(0) || 'T'}
          </div>
          <div
            style={{
              position: 'absolute',
              right: -4,
              bottom: -4,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#F0B90B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0F1B3D',
            }}
          >
            <Camera size={12} color="#0F1B3D" strokeWidth={2.5} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', marginBottom: 4 }}>
            点击更换头像
          </div>
          <div style={{ fontSize: 11, color: '#7B89B8' }}>
            支持 JPG / PNG，大小不超过 2MB
          </div>
        </div>
      </div>

      {/* 字段卡 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: '4px 14px',
          marginBottom: 12,
        }}
      >
        <Field icon={User} label="昵称">
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={inputStyle}
            maxLength={20}
          />
        </Field>
        <Field icon={AtSign} label="UID" disabled>
          <span style={{ ...inputStyle, color: '#7B89B8' }}>{u.uid}</span>
        </Field>
        <Field icon={Mail} label="邮箱">
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field icon={Phone} label="手机">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </Field>
        <Field icon={User} label="性别" last>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: gender === g ? '#38BDF8' : 'rgba(148,163,184,0.20)',
                  background: gender === g ? 'rgba(56,189,248,0.15)' : 'transparent',
                  color: gender === g ? '#38BDF8' : '#7B89B8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {g === 'male' ? '男' : g === 'female' ? '女' : '其他'}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* 简介卡 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>个人简介</div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={120}
          rows={3}
          style={{
            width: '100%',
            background: 'rgba(15, 27, 61, 0.40)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 10,
            padding: 10,
            color: '#F8FAFC',
            fontSize: 13,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />
        <div style={{ fontSize: 10, color: '#7B89B8', textAlign: 'right', marginTop: 4 }}>
          {bio.length} / 120
        </div>
      </div>

      {/* 地区/生日卡 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: '4px 14px',
          marginBottom: 12,
        }}
      >
        <Field icon={Globe} label="国家/地区">
          <span style={inputStyle}>{country}</span>
          <ChevronRight size={14} color="#7B89B8" />
        </Field>
        <Field icon={Calendar} label="生日" last>
          <span style={inputStyle}>1995-06-15</span>
          <ChevronRight size={14} color="#7B89B8" />
        </Field>
      </div>

      {/* KYC 入口 */}
      <LinkRow
        icon={ShieldCheck}
        iconColor="#34D399"
        title="实名认证 (KYC2)"
        subtitle="已认证，可提升提币额度"
        badge="已认证"
        badgeColor="#34D399"
      />

      {/* 保存按钮 */}
      <button
        onClick={onSave}
        style={{
          width: '100%',
          marginTop: 18,
          padding: '14px 0',
          background: saved
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
          transition: 'all 0.2s',
          boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        {saved ? <><Check size={16} /> 已保存</> : '保存修改'}
      </button>
      <div style={{ height: 20 }} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#F8FAFC',
  fontSize: 13,
  textAlign: 'right',
  fontFamily: 'inherit',
};

function Field({
  icon: Icon,
  label,
  children,
  last,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  last?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 0',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Icon size={14} color="#7B89B8" />
      <span style={{ fontSize: 13, color: '#B4C0E0', minWidth: 60 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>{children}</div>
    </div>
  );
}

function LinkRow({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  badgeColor,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: '12px 14px',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
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
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {badge && (
        <span
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 4,
            background: `${badgeColor}33`,
            color: badgeColor,
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
      <ChevronRight size={14} color="#7B89B8" />
    </div>
  );
}
