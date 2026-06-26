import React, { forwardRef } from 'react';

// ==================== Sub-components ====================

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  // inherit all td props
}

const Td = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', ...props }, ref) => (
    <td
      ref={ref}
      className={`
        px-4 py-3 text-sm text-text-secondary align-middle
        whitespace-nowrap
        ${className}
      `}
      {...props}
    />
  ),
);
Td.displayName = 'Table.Td';

interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

const Th = forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className = '', ...props }, ref) => (
    <th
      ref={ref}
      className={`
        px-4 py-3.5 text-xs font-semibold uppercase tracking-wider
        text-text-muted text-left align-middle
        ${className}
      `}
      {...props}
    />
  ),
);
Th.displayName = 'Table.Th';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isZebra?: boolean;
  index?: number;
}

const Tr = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ isZebra = true, index = 0, className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        transition-colors duration-150
        hover:bg-[#F7F8FA]
        ${isZebra && index % 2 === 1 ? 'bg-[#F7F8FA]' : ''}
        ${className}
      `}
      {...props}
    />
  ),
);
Tr.displayName = 'Table.Tr';

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const Thead = forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ className = '', ...props }, ref) => (
    <thead
      ref={ref}
      className={`bg-deep-800 border-b border-deep-700 ${className}`}
      {...props}
    />
  ),
);
Thead.displayName = 'Table.Thead';

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

const Tbody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', ...props }, ref) => (
    <tbody ref={ref} className={`divide-y divide-deep-700/50 ${className}`} {...props} />
  ),
);
Tbody.displayName = 'Table.Tbody';

// ==================== Main Table Component ====================

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ bordered = false, striped = true, hoverable = false, className = '', children, ...props }, ref) => (
    <div className="overflow-x-auto rounded-xl border border-deep-700">
      <table
        ref={ref}
        className={`
          w-full text-left border-collapse
          ${bordered ? '[&_td]:border [&_&]:border-deep-700' : ''}
          ${hoverable ? '[&_tr:hover]:bg-[#F7F8FA] [&_tr]:transition-colors' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
);

Table.displayName = 'Table';

// Extend Table with sub-components using a typed cast
type TableComposite = typeof Table & {
  Thead: typeof Thead;
  Tbody: typeof Tbody;
  Tr: typeof Tr;
  Th: typeof Th;
  Td: typeof Td;
};

(Table as TableComposite).Thead = Thead;
(Table as TableComposite).Tbody = Tbody;
(Table as TableComposite).Tr = Tr;
(Table as TableComposite).Th = Th;
(Table as TableComposite).Td = Td;

export default Table as TableComposite;
export { Thead, Tbody, Tr, Th, Td };
export type { TableProps, TableRowProps, TableHeaderCellProps, TableCellProps, TableBodyProps, TableHeadProps };
