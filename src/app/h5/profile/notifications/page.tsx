'use client';

import { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Settings as SettingsIcon,
  TrendingUp,
  Gift,
  Shield,
  Activity,
  Trash2,
} from 'lucide-react';
import { getNotifications, NotificationItem } from '@/lib/h5-mock';

export default function H5ProfileNotificationsPage() {
  const all = getNotifications();
  const [items, setItems] = useState<NotificationItem[]>(all);
  const [tab, setTab] = useState<'all' | 'unread' | 'system' | 'trade' | 'activity'>('all');

  const filtered = items.filter((it) => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !it.read;
    return it.type === tab;
  });

  const markAllRead = () => {
    setItems((arr) => arr.map((it) => ({ ...it, read: true })));
  };

  const clearAll = () => setItems([]);

  const toggleRead = (id: string) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, read: !it.read } : it)));
  };

  const unreadCount = items.filter((it) => !it.read).length;

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>消息通知</span>
        {unreadCount > 0 && (
          <span
            style={{
              fontSize: 10,
              padding: '2px 8px',
              borderRadius: 10,
              background: 'rgba(244, 114, 182, 0.20)',
              color: '#F472B6',
              fontWeight: 700,
            }}
          >
            {unreadCount} 条未读
          </span>
        )}
        <button
          style={{
            marginLeft: 'auto',
            padding: 6,
            borderRadius: 8,
            background: 'rgba(148, 163, 184, 0.10)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <SettingsIcon size={14} color="#B4C0E0" />
        </button>
      </div>

      {/* 操作栏 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <button
          onClick={markAllRead}
          style={actionBtnStyle('#38BDF8')}
        >
          <CheckCheck size={12} /> 全部已读
        </button>
        <button
          onClick={clearAll}
          style={actionBtnStyle('#F472B6')}
        >
          <Trash2 size={12} /> 清空
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        {[
          { key: 'all',      label: '全部' },
          { key: 'unread',   label: '未读' },
          { key: 'system',   label: '系统' },
          { key: 'trade',    label: '交易' },
          { key: 'activity', label: '活动' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'all' | 'unread' | 'system' | 'trade' | 'activity')}
            style={{
              flex: 1,
              padding: '6px 0',
              borderRadius: 8,
              border: 'none',
              background: tab === t.key ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
              color: tab === t.key ? '#38BDF8' : '#7B89B8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 列表 */}
      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            background:
              'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {filtered.map((it, i) => (
            <NotifItem
              key={it.id}
              item={it}
              last={i === filtered.length - 1}
              onToggleRead={() => toggleRead(it.id)}
            />
          ))}
        </div>
      )}

      <div style={{ height: 20 }} />
    </div>
  );
}

const actionBtnStyle = (color: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '6px 12px',
  borderRadius: 8,
  background: `${color}1A`,
  border: `1px solid ${color}40`,
  color,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
});

function NotifItem({
  item,
  last,
  onToggleRead,
}: {
  item: NotificationItem;
  last: boolean;
  onToggleRead: () => void;
}) {
  const Icon = item.type === 'system' ? Shield : item.type === 'trade' ? TrendingUp : Gift;
  const color = item.type === 'system' ? '#F0B90B' : item.type === 'trade' ? '#38BDF8' : '#F472B6';

  return (
    <div
      onClick={onToggleRead}
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
        cursor: 'pointer',
        background: item.read ? 'transparent' : 'rgba(56, 189, 248, 0.04)',
        position: 'relative',
      }}
    >
      {!item.read && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 6,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#F472B6',
          }}
        />
      )}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: item.read ? '#B4C0E0' : '#F8FAFC',
            }}
          >
            {item.title}
          </span>
          {item.read && <Check size={12} color="#7B89B8" />}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#7B89B8',
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          {item.content}
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 4 }}>{item.time}</div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 40,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(56, 189, 248, 0.10)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}
      >
        <Bell size={24} color="#7B89B8" />
      </div>
      <div style={{ fontSize: 13, color: '#B4C0E0' }}>暂无消息</div>
      <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 4 }}>下拉刷新或切换其他分类</div>
    </div>
  );
}
