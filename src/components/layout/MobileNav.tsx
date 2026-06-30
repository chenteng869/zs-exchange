'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { NAV_ITEMS } from '@/lib/constants';

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const slideInRight: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring', damping: 30, stiffness: 300 },
  },
  exit: {
    x: '100%',
    transition: { duration: 0.25, ease: EASE },
  },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1050] lg:hidden">
          {/* Backdrop Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-in Drawer */}
          <motion.aside
            variants={slideInRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute top-0 right-0 h-full w-full sm:w-80 max-w-[100vw] sm:max-w-[85vw] bg-deep-900 border-l border-white/5 shadow-2xl overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex flex-col leading-tight">
                <span className="text-white font-semibold text-lg tracking-tight">
                  ZS EXCHANGE
                </span>
                <span className="text-text-muted text-xs">中萨数科</span>
              </div>
              <button
                onClick={onClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-lg text-text-muted hover:text-white hover:bg-white/5 transition-colors"
                aria-label="关闭菜单"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Menu */}
            <nav className="p-4 space-y-0.5">
              {NAV_ITEMS.filter((item) => item.label !== '登录' && item.label !== '注册').map(
                (item) =>
                  item.children ? (
                    <MobileDropdownItem
                      key={item.label}
                      label={item.label}
                      items={item.children}
                      pathname={pathname}
                      onClose={onClose}
                    />
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={`block px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors no-underline leading-[44px] ${
                        pathname === item.href
                          ? 'text-white font-medium'
                          : 'text-text-secondary hover:text-white hover:bg-white/[0.03]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
              )}
            </nav>

            {/* Divider */}
            <div className="mx-4 border-t border-[#EAECEF]" />

            {/* License Badge - 极简静态 */}
            <div className="p-4">
              <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gold-500/20 text-gold-400 bg-gold-500/5">
                <span className="text-sm">🇼🇸</span>
                <span className="text-xs font-medium">
                  萨摩亚持牌合规交易所
                </span>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="px-4 pb-6 space-y-2.5">
              <Link
                href="/download"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 text-center text-sm font-medium text-info border border-info/30 rounded-lg hover:bg-info/10 transition-colors no-underline"
              >
                <span>📱</span>
                下载 APP
              </Link>
              <Link
                href="/login"
                onClick={onClose}
                className="block w-full py-3 text-center text-sm font-medium text-text-secondary border border-deep-700 rounded-lg hover:bg-deep-800 hover:text-white transition-colors no-underline"
              >
                登录
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="block w-full py-3 text-center text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-500 transition-colors no-underline"
              >
                注册账户
              </Link>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Mobile Dropdown Submenu */
function MobileDropdownItem({
  label,
  items,
  pathname,
  onClose,
}: {
  label: string;
  items: { label: string; href: string }[];
  pathname: string;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium text-text-secondary hover:text-white hover:bg-white/[0.03] transition-colors"
      >
        {label}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-2 pb-1 space-y-0.5">
              {items.map((child) => (
                <Link
                  key={child.label}
                  href={child.href}
                  onClick={onClose}
                  className={`block px-4 py-2.5 min-h-[44px] rounded-lg text-sm transition-colors no-underline leading-[44px] ${
                    pathname === child.href
                      ? 'text-[#1E2329] font-medium'
                      : 'text-text-muted hover:text-text-secondary hover:bg-[#F7F8FA]'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
