'use client';

import { Card, Alert } from 'antd';
import UserLayout from '@/components/user/UserLayout';

export default function UserDefiLending() {
  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">借贷</h1>
        <Alert
          message="功能开发中"
          description="借贷功能正在开发中，敬请期待！"
          type="info"
          showIcon
        />
      </div>
    </UserLayout>
  );
}
