'use client';

import { useState } from 'react';
import {
  CreditCard,
  Building2,
  Plus,
  Check,
  Trash2,
  Star,
  Shield,
  ChevronRight,
} from 'lucide-react';

interface BankCard {
  id: string;
  bank: string;
  bankEn: string;
  cardNo: string;
  cardType: 'debit' | 'credit';
  branch: string;
  isDefault: boolean;
  iconColor: string;
}

export default function H5ProfileBankPage() {
  const [cards, setCards] = useState<BankCard[]>([
    { id: 'C1', bank: '中国工商银行', bankEn: 'ICBC', cardNo: '****  ****  ****  8821', cardType: 'debit', branch: '北京海淀分行', isDefault: true,  iconColor: '#EF4444' },
    { id: 'C2', bank: '中国建设银行', bankEn: 'CCB',  cardNo: '****  ****  ****  4523', cardType: 'debit', branch: '上海浦东分行', isDefault: false, iconColor: '#1E40AF' },
    { id: 'C3', bank: '招商银行',     bankEn: 'CMB',  cardNo: '****  ****  ****  7690', cardType: 'credit',branch: '深圳福田分行', isDefault: false, iconColor: '#F472B6' },
  ]);

  const setDefault = (id: string) => {
    setCards((arr) => arr.map((c) => ({ ...c, isDefault: c.id === id })));
  };

  const remove = (id: string) => {
    setCards((arr) => arr.filter((c) => c.id !== id));
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>银行卡管理</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 'auto' }}>
          已绑定 {cards.length}/5
        </span>
      </div>

      {/* 提示卡 */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: 12,
          background: 'rgba(240, 185, 11, 0.08)',
          border: '1px solid rgba(240, 185, 11, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Shield size={16} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          银行卡仅用于法币 (C2C) 交易提现，所有信息经 AES-256 加密存储。
        </div>
      </div>

      {/* 卡片列表 */}
      {cards.map((c) => (
        <BankCardItem
          key={c.id}
          card={c}
          onSetDefault={() => setDefault(c.id)}
          onRemove={() => remove(c.id)}
        />
      ))}

      {/* 添加按钮 */}
      <button
        style={{
          width: '100%',
          marginTop: 12,
          padding: '14px 0',
          background: 'rgba(56, 189, 248, 0.10)',
          border: '1px dashed rgba(56, 189, 248, 0.40)',
          borderRadius: 14,
          color: '#38BDF8',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <Plus size={16} /> 添加新银行卡
      </button>

      {/* 限额说明 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginTop: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>限额说明</span>
        </div>
        {[
          { label: '单笔限额', value: '¥50,000' },
          { label: '单日限额', value: '¥200,000' },
          { label: '单月限额', value: '¥2,000,000' },
          { label: '到账时间', value: '2 小时内' },
        ].map((it) => (
          <div
            key={it.label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 0',
              fontSize: 12,
            }}
          >
            <span style={{ color: '#7B89B8' }}>{it.label}</span>
            <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{it.value}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function BankCardItem({
  card,
  onSetDefault,
  onRemove,
}: {
  card: BankCard;
  onSetDefault: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${card.iconColor} 0%, ${card.iconColor}cc 60%, #0F1B3D 100%)`,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 6px 20px ${card.iconColor}40`,
      }}
    >
      {/* 装饰圆 */}
      <div
        style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -40,
          left: -20,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }}
      />

      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.20)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Building2 size={20} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{card.bank}</span>
                {card.isDefault && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: 'rgba(252, 213, 53, 0.30)',
                      color: '#FCD535',
                      fontWeight: 700,
                    }}
                  >
                    <Star size={9} fill="#FCD535" /> 默认
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.70)', marginTop: 2 }}>
                {card.bankEn} · {card.cardType === 'debit' ? '储蓄卡' : '信用卡'}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 2,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: 8,
          }}
        >
          {card.cardNo}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>{card.branch}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {!card.isDefault && (
              <button
                onClick={onSetDefault}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.20)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Check size={11} /> 设为默认
              </button>
            )}
            <button
              onClick={onRemove}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(244, 114, 182, 0.30)',
                border: 'none',
                color: '#fff',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Trash2 size={11} /> 解绑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
