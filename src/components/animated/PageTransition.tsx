'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ==================== 类型定义 ====================
interface PageTransitionProps {
  children: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

/**
 * 页面切换动画组件
 * 使用 framer-motion AnimatePresence 实现路由切换时的淡入淡出 + 上移效果
 * mode="wait" 确保旧页面完全离开后新页面才进入
 *
 * @example
 * ```tsx
 * // 在 layout.tsx 中使用
 * <PageTransition>
 *   {children}
 * </PageTransition>
 * ```
 */

// 页面入场/退场变体
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
}) => {
  const transitionKey = React.useId();

  // 检测用户是否偏好减少动画
  const [prefersReduced, setPrefersReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // 减少动画偏好时直接渲染子元素
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey} // 使用稳定 key 强制重新挂载以触发动画
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
export type { PageTransitionProps };
