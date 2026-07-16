/**
 * 简易日志器
 * - 开发环境输出到 console
 * - 生产环境可对接远程日志（占位）
 * - 自动脱敏：所有入参都会经过 logSanitizer 处理（防止敏感信息泄漏）
 */

import { logSanitizer } from './security/log-sanitizer';

type Level = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV !== 'production';

const levelOrder: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel: Level = isDev ? 'debug' : 'warn';

const shouldLog = (level: Level) => levelOrder[level] >= levelOrder[currentLevel];

const fmt = (level: Level, args: unknown[]) => {
  const time = new Date().toISOString().split('T')[1].slice(0, 12);
  return [`[${time}] [${level.toUpperCase()}]`, ...args.map((a) => logSanitizer(a))];
};

export const logger = {
  debug: (...args: unknown[]) => shouldLog('debug') && console.debug(...fmt('debug', args)),
  info:  (...args: unknown[]) => shouldLog('info')  && console.info(...fmt('info', args)),
  warn:  (...args: unknown[]) => shouldLog('warn')  && console.warn(...fmt('warn', args)),
  error: (...args: unknown[]) => shouldLog('error') && console.error(...fmt('error', args)),
};

export default logger;
