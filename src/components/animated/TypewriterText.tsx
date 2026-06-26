'use client';

import React, { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'framer-motion';

// ==================== 类型定义 ====================
interface TypewriterTextProps {
  /** 要显示的文本内容 */
  text: string;
  /** 打字速度 (毫秒/字符), 默认 50 */
  speed?: number;
  /** 光标字符, 默认 '|' */
  cursor?: string;
  /** 自定义类名 */
  className?: string;
  /** 是否进入视口后才开始打字, 默认 true */
  startOnView?: boolean;
  /** 打字完成后是否隐藏光标, 默认 false (持续闪烁) */
  hideCursorOnComplete?: boolean;
}

/**
 * 打字机文字效果组件
 * 字符逐个出现 + 闪烁光标
 * 支持多行文本 (按 \\n 分割)
 *
 * @example
 * ```tsx
 * <TypewriterText text="Hello\nWorld" speed={80} startOnView />
 * ```
 */
const TypewriterText = forwardRef<HTMLSpanElement, TypewriterTextProps>(
  (
    {
      text,
      speed = 50,
      cursor = '|',
      className = '',
      startOnView = true,
      hideCursorOnComplete = false,
    },
    forwardedRef,
  ) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-50px', amount: 0.3 });
    const hasStartedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursorTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // 合并外部传入的 ref
    const setRefs = (node: HTMLSpanElement | null) => {
      (ref as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLSpanElement | null>).current = node;
      }
    };

    // 光标闪烁效果
    useEffect(() => {
      cursorTimerRef.current = setInterval(() => {
        setCursorVisible((prev) => !prev);
      }, 530); // 接近自然打字机闪烁频率

      return () => {
        if (cursorTimerRef.current) {
          clearInterval(cursorTimerRef.current);
        }
      };
    }, []);

    // 打字逻辑
    const startTyping = useCallback(() => {
      let currentIndex = 0;

      const typeNextChar = () => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
          timerRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
        }
      };

      timerRef.current = setTimeout(typeNextChar, speed);
    }, [text, speed]);

    // 触发条件判断
    useEffect(() => {
      // 如果需要进入视口才启动, 且尚未进入视口
      if (startOnView && !isInView) return;
      // 已经启动过则不再重复
      if (hasStartedRef.current) return;

      // 检查减少动画偏好
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setDisplayedText(text);
        setIsComplete(true);
        return;
      }

      hasStartedRef.current = true;
      startTyping();

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [isInView, startOnView, startTyping, text]);

    // 决定是否显示光标
    const showCursor = hideCursorOnComplete ? !isComplete : true;

    return (
      <span ref={setRefs} className={`inline ${className}`}>
        {/* 多行文本渲染 */}
        {displayedText.split('\n').map((line, index) => (
          <React.Fragment key={index}>
            {line}
            {index < displayedText.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
        {/* 光标 */}
        {showCursor && (
          <span
            className={`inline-block w-[0.55em] text-left ${cursorVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100`}
            aria-hidden="true"
          >
            {cursor}
          </span>
        )}
      </span>
    );
  },
);

TypewriterText.displayName = 'TypewriterText';

export default TypewriterText;
export type { TypewriterTextProps };
