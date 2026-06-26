'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserHome() {
  const router = useRouter();

  useEffect(() => {
    router.push('/user/dashboard');
  }, [router]);

  return null;
}
