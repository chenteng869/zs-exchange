// ==================== ZS Exchange UI Atomic Components V4 ====================
// 严格遵循《数字交易所官网与管理员后台色系搭配最佳方案 V1.0》

// ==================== 基础控件 ====================

export { default as Button } from './Button';
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  ButtonTheme,
} from './Button';

export { default as Card } from './Card';
export type { CardProps, CardVariant, CardPadding } from './Card';

export { default as Input } from './Input';
export type { InputProps } from './Input';

export { default as Modal } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

// ==================== 数据展示 ====================

export { default as Badge } from './Badge';
export type {
  BadgeProps,
  BadgeVariant,
  BadgeSize,
  BadgeTheme,
} from './Badge';

export { default as StatusBadge } from './StatusBadge';
export type {
  StatusBadgeProps,
  StatusCategory,
  StatusVariant,
  StatusSize,
} from './StatusBadge';
export {
  userStatusLabels,
  txStatusLabels,
  orderStatusLabels,
  riskLevelLabels,
  labelMap,
} from './StatusBadge';

export { default as Table } from './Table';
export type {
  TableProps,
  TableRowProps,
  TableHeaderCellProps,
  TableCellProps,
  TableBodyProps,
  TableHeadProps,
} from './Table';

export { default as Tabs } from './Tabs';
export type { TabsProps, Tab } from './Tabs';

export { default as Accordion, AccordionItem } from './Accordion';
export type { AccordionProps, AccordionItemProps } from './Accordion';

// ==================== 交互反馈 ====================

export { default as AnimatedCounter } from './AnimatedCounter';
export type { AnimatedCounterProps } from './AnimatedCounter';
