'use client';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** 透传其他属性，如 className、style、onClick 等 */
  [key: string]: any;
}

export default function AdminLayout({ children, title, subtitle, ...rest }: AdminLayoutProps) {
  return (
    <div data-admin-layout data-title={title} data-subtitle={subtitle} {...rest}>
      {children}
    </div>
  );
}
