'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  /** 自定义首页文字，默认 "首页" */
  homeLabel?: string;
  /** 分隔符类型 */
  separator?: 'slash' | 'chevron';
  /** 最大显示层级，超出折叠为 "..." */
  maxItems?: number;
}

/**
 * 面包屑导航组件
 *
 * @example
 * // 基础用法
 * <Breadcrumb />
 *
 * @example
 * // 自定义路径
 * <Breadcrumb items={[
 *   { label: '产品', href: '/products' },
 *   { label: '现货交易', href: '/products/spot' },
 *   { label: 'BTC/USDT' },
 * ]} />
 */
export default function Breadcrumb({
  items = [],
  homeLabel = '首页',
  separator = 'chevron',
  maxItems,
}: BreadcrumbProps) {
  const pathname = usePathname();

  // 如果没有传入 items，则根据当前路由自动生成
  const resolvedItems: BreadcrumbItem[] =
    items.length > 0
      ? items
      : generateBreadcrumbsFromPath(pathname, homeLabel);

  // 处理最大层级限制
  const displayItems = maxItems && resolvedItems.length > maxItems
    ? [
        resolvedItems[0],
        { label: '...' },
        ...resolvedItems.slice(-(maxItems - 2)),
      ]
    : resolvedItems;

  if (displayItems.length <= 1) return null;

  const lastIndex = displayItems.length - 1;

  return (
    <nav aria-label="面包屑导航" className="flex items-center flex-wrap gap-1.5 text-sm text-text-muted">
      {displayItems.map((item, index) => {
        const isLast = index === lastIndex;
        const isEllipsis = item.label === '...';

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {/* Separator */}
            {index > 0 &&
              !isEllipsis &&
              (displayItems[index - 1].label !== '...') &&
              (separator === 'chevron' ? (
                <ChevronRight size={14} className="text-text-muted/50 shrink-0" />
              ) : (
                <span className="text-text-muted/50 select-none">/</span>
              ))}

            {/* Item */}
            {isLast || isEllipsis || !item.href ? (
              <span
                className={
                  isLast
                    ? 'text-text-primary font-medium'
                    : 'text-text-muted cursor-default'
                }
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-brand-light transition-colors no-underline"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/** 根据当前路径自动生成面包屑 */
function generateBreadcrumbsFromPath(
  path: string,
  homeLabel: string
): BreadcrumbItem[] {
  if (!path || path === '/') {
    return [{ label: homeLabel, href: '/' }];
  }

  // 路径标签映射（可扩展）
  const labelMap: Record<string, string> = {
    trade: '交易',
    market: '行情',
    licenses: '牌照资质',
    about: '关于我们',
    help: '帮助中心',
    login: '登录',
    register: '注册',
    business: '业务生态',
    spot: '现货交易',
    futures: '合约交易',
    margin: '杠杆交易',
    earn: '理财服务',
    nft: 'NFT市场',
    ido: 'IDO平台',
    news: '新闻动态',
    careers: '加入我们',
    contact: '联系我们',
    compliance: '合规',
    vip: 'VIP服务',
    referral: '推荐返佣',
    'api-docs': 'API文档',
  };

  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: homeLabel, href: '/' }];

  segments.forEach((segment, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    const decodedSegment = decodeURIComponent(segment);
    const label = labelMap[segment] || formatSegment(decodedSegment);

    breadcrumbs.push({
      label,
      href,
    });
  });

  return breadcrumbs;
}

/** 格式化路径段为可读标签 */
function formatSegment(segment: string): string {
  // 将 kebab-case 或 snake_case 转换为中文友好格式
  return segment
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/([A-Z])/g, ' $1')
    .trim();
}
