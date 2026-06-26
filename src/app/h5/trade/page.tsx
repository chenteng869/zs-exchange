import { Suspense } from 'react';
import H5Trade from '@/components/h5/H5Trade';

// H5Trade uses useSearchParams() — Next.js 14 静态导出要求包 <Suspense>
// 否则 export 时会报错："useSearchParams() should be wrapped in a suspense boundary"
export default function TradePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#9aa3b2' }}>加载中…</div>}>
      <H5Trade />
    </Suspense>
  );
}
