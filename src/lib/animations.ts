﻿﻿﻿import { Variants, Transition } from 'framer-motion';

// Custom bezier tuple type
type Bezier = [number, number, number, number];
const EASE: Bezier = [0.22, 1, 0.36, 1];

// ==================== 鍩虹杩囨浮閰嶇疆 ====================
const baseTransition: Transition = {
  duration: 0.4,
  ease: EASE,
};

const fastTransition: Transition = {
  duration: 0.2,
  ease: EASE,
};

// ==================== 娣″叆涓婄Щ鍔ㄧ敾 ====================
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: baseTransition,
  },
};

// ==================== 娣″叆鍔ㄧ敾 ====================
export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: baseTransition,
  },
};

// ==================== 缂╂斁杩涘叆鍔ㄧ敾 ====================
export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: baseTransition,
  },
};

// ==================== 瀹瑰櫒浜ら敊鍔ㄧ敾 (鐢ㄤ簬鍒楄〃) ====================
export const staggerContainer: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// ==================== 鍒楄〃椤逛氦閿欏姩鐢?====================
export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 15,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: fastTransition,
  },
};

// ==================== 鎮仠鎻愬崌鏁堟灉 ====================
export const hoverLift = {
  whileHover: {
    y: -8,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
  whileTap: {
    y: -2,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== 鎮仠缂╂斁鏁堟灉 ====================
export const hoverScale = {
  whileHover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
  whileTap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== 鐐瑰嚮缂╂斁鏁堟灉 ====================
export const tapScale = {
  whileTap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};

// ==================== 椤甸潰鍒囨崲杩囨浮鍔ㄧ敾 ====================
export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: EASE,
    },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.3,
      ease: EASE,
    },
  },
};

// ==================== 鍗＄墖鎮仠鍙戝厜鏁堟灉 ====================
export const cardGlow = {
  initial: {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
  },
  animate: {
    boxShadow: [
      '0 4px 6px rgba(124, 58, 237, 0.2)',
      '0 10px 30px rgba(124, 58, 237, 0.4)',
      '0 4px 6px rgba(124, 58, 237, 0.2)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ==================== 鏁板瓧婊氬姩鍔ㄧ敾 ====================
export const numberCountUp = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: EASE,
    },
  },
};

// ==================== 婊氬姩瑙﹀彂鐨勫叆鍦哄姩鐢?(澧炲己鐗? ====================
export const scrollRevealVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: EASE,
    },
  }),
};

// ==================== 瀛愬厓绱犱氦閿欏姩鐢?(澧炲己鐗? ====================
export const staggerContainerEnhanced = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ==================== 鍗＄墖鎮诞鏁堟灉 ====================
export const cardHover = {
  rest: { scale: 1, boxShadow: '0 0 0 rgba(124,58,237,0)' },
  hover: {
    scale: 1.02,
    boxShadow: '0 8px 40px rgba(124,58,237,0.15)',
    transition: { duration: 0.3 },
  },
};

// ==================== 鏁板瓧璺冲姩鏁堟灉 ====================
export const numberPop = {
  initial: { scale: 0.5, opacity: 0 },
  animate: {
    scale: [0.5, 1.2, 1],
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ==================== 鑴夊啿鍏夌幆 ====================
export const pulseRing = {
  animate: {
    scale: [1, 1.3, 1],
    opacity: [0.6, 0, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};
