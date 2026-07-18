'use client';

/**
 * AdminDataTable（2026-07-18 真实化底座）
 *
 * 目标：替代 263 个 TEMPLATE page 内的散乱 <Table>，提供统一的：
 *   - loading / error / empty 三态
 *   - 分页 / 排序 / 筛选
 *   - search + refresh
 *   - 内置可重试（error 态）
 *   - 强类型 rowKey
 *
 * 设计原则：
 *   - 与既有 DataTable.tsx 区分：DataTable 是 2026-07 旧版，AdminDataTable 是真实化底座
 *   - 不依赖 mock 数据
 *   - 不耦合具体业务 API（通过 dataSource / columns / onChange 暴露）
 *   - 'use client' 客户端组件
 *
 * 硬约束（Q04-3.11.b 范围）：
 *   - 不引入新依赖
 *   - 不修改既有 DataTable.tsx
 *   - 不强制任何 page 接入
 */

import { ReactNode, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tooltip,
  Popconfirm,
  Dropdown,
  type TableProps,
  Empty,
  Alert,
  Skeleton,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';

const { Option } = Select;

export interface AdminTableColumn<T = any> {
  key: string;
  title: ReactNode;
  dataIndex?: keyof T | string;
  width?: number | string;
  fixed?: 'left' | 'right';
  sorter?: boolean | ((a: T, b: T) => number);
  render?: (value: any, record: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
}

export interface AdminTableAction<T = any> {
  key: string;
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: (record: T) => boolean;
  hidden?: (record: T) => boolean;
  onClick?: (record: T) => void | Promise<void>;
  confirm?: {
    title: string;
    description?: string;
    okText?: string;
    cancelText?: string;
  };
}

export interface AdminDataTableProps<T = any> {
  /** 数据源（来自 API/Server Component，**禁止** 传入 mock） */
  dataSource: T[];
  /** 列定义 */
  columns: AdminTableColumn<T>[];
  /** 行 key 取值（默认 'id'） */
  rowKey?: keyof T | string;
  /** loading 态 */
  loading?: boolean;
  /** error 错误对象 */
  error?: Error | string | null;
  /** 重试回调（error 态时显示） */
  onRetry?: () => void;
  /** 数据为空时描述 */
  emptyText?: string;
  /** 操作列定义 */
  actions?: AdminTableAction<T>[];
  /** 搜索 placeholder */
  searchPlaceholder?: string;
  /** 受控搜索值（外部传入） */
  searchValue?: string;
  /** 搜索变化回调 */
  onSearch?: (value: string) => void;
  /** 筛选选项 */
  filterOptions?: { label: string; value: string }[];
  /** 筛选 placeholder */
  filterPlaceholder?: string;
  /** 受控筛选值 */
  filterValue?: string;
  /** 筛选变化回调 */
  onFilter?: (value: string | undefined) => void;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 当前页码 */
  page?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 总条数（分页） */
  total?: number;
  /** 分页变化回调 */
  onPageChange?: (page: number, pageSize: number) => void;
  /** 是否可滚动 */
  scroll?: TableProps<T>['scroll'];
  /** 表格尺寸 */
  size?: 'small' | 'middle' | 'large';
  /** 表格标题（左侧） */
  title?: ReactNode;
  /** 表格额外内容（右侧） */
  extra?: ReactNode;
}

/**
 * AdminDataTable - 真实化底座表格
 */
export function AdminDataTable<T extends Record<string, any> = any>({
  dataSource,
  columns,
  rowKey = 'id',
  loading = false,
  error = null,
  onRetry,
  emptyText = '暂无数据',
  actions = [],
  searchPlaceholder = '搜索...',
  searchValue,
  onSearch,
  filterOptions,
  filterPlaceholder = '筛选',
  filterValue,
  onFilter,
  onRefresh,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  scroll = { x: 'max-content' },
  size = 'middle',
  title,
  extra,
}: AdminDataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const currentSearch = searchValue !== undefined ? searchValue : internalSearch;

  const handleSearch = useCallback(
    (value: string) => {
      setInternalSearch(value);
      onSearch?.(value);
    },
    [onSearch],
  );

  const handleFilter = useCallback(
    (value: string | undefined) => {
      onFilter?.(value);
    },
    [onFilter],
  );

  // 渲染 action
  const renderAction = (action: AdminTableAction<T>, record: T) => {
    if (action.hidden?.(record)) return null;
    const isDisabled = action.disabled?.(record) || false;

    if (action.confirm) {
      return (
        <Popconfirm
          key={action.key}
          title={action.confirm.title}
          description={action.confirm.description}
          onConfirm={() => action.onClick?.(record)}
          okText={action.confirm.okText || '确定'}
          cancelText={action.confirm.cancelText || '取消'}
          disabled={isDisabled}
        >
          <Button
            type="link"
            size="small"
            danger={action.danger}
            disabled={isDisabled}
            icon={action.icon}
          >
            {action.label}
          </Button>
        </Popconfirm>
      );
    }

    return (
      <Button
        key={action.key}
        type="link"
        size="small"
        danger={action.danger}
        disabled={isDisabled}
        icon={action.icon}
        onClick={() => action.onClick?.(record)}
      >
        {action.label}
      </Button>
    );
  };

  // 渲染 actions 列
  const renderActionsColumn = (record: T) => {
    const visible = actions.filter((a) => !a.hidden?.(record));
    if (visible.length === 0) return null;
    if (visible.length <= 2) {
      return <Space size={4}>{visible.map((a) => renderAction(a, record))}</Space>;
    }
    return (
      <Dropdown
        menu={{
          items: visible.map((a) => ({
            key: a.key,
            label: a.label,
            icon: a.icon,
            danger: a.danger,
            disabled: a.disabled?.(record),
            onClick: () => {
              if (!a.confirm) a.onClick?.(record);
            },
          })),
        }}
        trigger={['click']}
      >
        <Button type="text" size="small" icon={<MoreOutlined />} />
      </Dropdown>
    );
  };

  // 转换列定义
  const tableColumns: TableProps<T>['columns'] = columns.map((c) => ({
    key: c.key,
    title: c.title,
    dataIndex: c.dataIndex as string | undefined,
    width: c.width,
    fixed: c.fixed,
    sorter: c.sorter,
    render: c.render,
    align: c.align,
    ellipsis: c.ellipsis,
  }));

  if (actions.length > 0) {
    tableColumns.push({
      key: 'admin-table-actions',
      title: '操作',
      width: actions.length > 2 ? 80 : 160,
      fixed: 'right',
      render: (_, record) => renderActionsColumn(record),
    });
  }

  // error 态
  if (error) {
    const errMsg = typeof error === 'string' ? error : error.message;
    return (
      <Alert
        type="error"
        showIcon
        icon={<ExclamationCircleOutlined />}
        message="数据加载失败"
        description={errMsg}
        action={
          onRetry ? (
            <Button size="small" danger onClick={onRetry}>
              重试
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="admin-data-table-wrapper">
      {(title || extra || onSearch || onRefresh || filterOptions) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Space wrap>
            {title && <span style={{ fontWeight: 600 }}>{title}</span>}
            {onSearch && (
              <Input.Search
                placeholder={searchPlaceholder}
                allowClear
                style={{ width: 240 }}
                value={currentSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                onSearch={handleSearch}
                enterButton={<SearchOutlined />}
              />
            )}
            {filterOptions && onFilter && (
              <Select
                placeholder={filterPlaceholder}
                style={{ width: 160 }}
                allowClear
                value={filterValue}
                onChange={handleFilter}
              >
                {filterOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            )}
          </Space>
          <Space>
            {onRefresh && (
              <Tooltip title="刷新">
                <Button icon={<ReloadOutlined />} onClick={onRefresh} />
              </Tooltip>
            )}
            {extra}
          </Space>
        </div>
      )}

      <Table<T>
        columns={tableColumns}
        dataSource={dataSource}
        rowKey={rowKey as string}
        loading={loading ? { indicator: <Skeleton active paragraph={{ rows: 4 }} />, spinning: true } : false}
        size={size}
        scroll={scroll}
        locale={{
          emptyText: loading ? <Skeleton active paragraph={{ rows: 3 }} /> : <Empty description={emptyText} />,
        }}
        pagination={
          total !== undefined
            ? {
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: onPageChange,
              }
            : {
                pageSize,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
              }
        }
        bordered
      />
    </div>
  );
}

export default AdminDataTable;
