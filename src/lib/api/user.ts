import { apiFetch, apiGet } from './client';

export interface ApiUserProfile {
  id: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  status?: string;
  kycLevel?: number;
  userType?: string;
  vipLevel?: number;
  feeDiscount?: string;
  tradingEnabled?: boolean;
  withdrawalEnabled?: boolean;
  depositEnabled?: boolean;
  referralCode?: string | null;
  referredBy?: string | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export const userApi = {
  getProfile: () => apiGet<ApiUserProfile>('/api/v1/user/profile'),

  updateProfile: (input: {
    phone?: string | null;
    countryCode?: string | null;
    currentPassword?: string;
    newPassword?: string;
  }) =>
    apiFetch<Pick<ApiUserProfile, 'id' | 'username' | 'email' | 'phone' | 'countryCode'> & { updatedAt?: string }>(
      '/api/v1/user/profile',
      {
        method: 'PUT',
        body: JSON.stringify(input),
      },
    ),
};
