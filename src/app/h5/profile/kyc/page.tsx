'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  Camera,
  CreditCard,
  FileCheck,
  ChevronRight,
  Award,
  Lock,
} from 'lucide-react';

interface KYCStep {
  id: string;
  title: string;
  desc: string;
  status: 'done' | 'current' | 'todo';
  icon: React.ElementType;
  iconColor: string;
}

export default function H5ProfileKycPage() {
  const [currentStep, setCurrentStep] = useState(1);

  const steps: KYCStep[] = [
    { id: 's1', title: '基础信息',      desc: '国籍 / 姓名 / 证件号',  status: 'done',     icon: CreditCard, iconColor: '#34D399' },
    { id: 's2', title: '证件上传',      desc: '身份证 / 护照正反面',   status: 'current',  icon: Camera,     iconColor: '#F0B90B' },
    { id: 's3', title: '人脸识别',      desc: '活体认证 + 数字比对',   status: 'todo',     icon: FileCheck,  iconColor: '#7B89B8' },
    { id: 's4', title: '审核完成',      desc: '预计 5-10 分钟',         status: 'todo',     icon: Award,      iconColor: '#7B89B8' },
  ];

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>实名认证</span>
      </div>

      {/* 顶部等级卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <ShieldCheck size={20} color="#F0B90B" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>KYC 认证等级</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#FCD535' }}>L{currentStep}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>已完成基础信息</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
            <Limit label="24h 提币额度" value="$50,000" />
            <Limit label="法币交易" value="已支持" valueColor="#34D399" />
            <Limit label="合约额度" value="100x" valueColor="#FCD535" />
          </div>
        </div>
      </div>

      {/* 步骤进度 */}
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
        <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 12 }}>
          认证流程
        </div>
        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} index={i} isLast={i === steps.length - 1} />
        ))}
      </div>

      {/* 当前步骤表单 - 证件上传 */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Camera size={16} color="#F0B90B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>上传证件</span>
        </div>

        <UploadTile title="证件人像面" subtitle="请上传清晰原件" />
        <UploadTile title="证件国徽面" subtitle="请确保边角完整" />
        <UploadTile title="手持证件照" subtitle="手持证件 + 手写当日日期" last />
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Lock size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          所有证件信息使用 AES-256 加密存储，仅用于身份核验，不会用于其他用途。
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
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
        提交审核
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Limit({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: valueColor || '#F8FAFC',
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StepRow({
  step,
  index,
  isLast,
}: {
  step: KYCStep;
  index: number;
  isLast: boolean;
}) {
  const Icon = step.icon;
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 0',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background:
              step.status === 'done'
                ? '#34D399'
                : step.status === 'current'
                ? 'rgba(240, 185, 11, 0.20)'
                : 'rgba(148, 163, 184, 0.10)',
            border:
              step.status === 'current'
                ? '2px solid #F0B90B'
                : step.status === 'todo'
                ? '2px solid rgba(148, 163, 184, 0.20)'
                : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {step.status === 'done' ? (
            <CheckCircle2 size={16} color="#fff" />
          ) : step.status === 'current' ? (
            <Icon size={14} color={step.iconColor} />
          ) : (
            <Circle size={14} color="#7B89B8" />
          )}
        </div>
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 2,
              background:
                step.status === 'done'
                  ? '#34D399'
                  : 'rgba(148, 163, 184, 0.20)',
              marginTop: 4,
              minHeight: 24,
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, paddingTop: 2, paddingBottom: isLast ? 0 : 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color:
                step.status === 'todo' ? '#7B89B8' : '#F8FAFC',
            }}
          >
            {step.title}
          </span>
          {step.status === 'current' && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(240, 185, 11, 0.20)',
                color: '#F0B90B',
                fontWeight: 700,
              }}
            >
              进行中
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{step.desc}</div>
      </div>
    </div>
  );
}

function UploadTile({ title, subtitle, last }: { title: string; subtitle: string; last?: boolean }) {
  return (
    <div
      style={{
        marginBottom: last ? 0 : 10,
        padding: 14,
        background: 'rgba(15, 27, 61, 0.40)',
        border: '1px dashed rgba(148, 163, 184, 0.30)',
        borderRadius: 12,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'rgba(56, 189, 248, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 6px',
        }}
      >
        <Camera size={18} color="#38BDF8" />
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#F8FAFC' }}>{title}</div>
      <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{subtitle}</div>
    </div>
  );
}
