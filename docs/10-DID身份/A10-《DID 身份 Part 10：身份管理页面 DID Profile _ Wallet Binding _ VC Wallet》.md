# A10\-《DID 身份 Part 10：身份管理页面 DID Profile / Wallet Binding / VC Wallet》

# 《DID 身份 Part 10：身份管理页面 DID Profile / Wallet Binding / VC Wallet》



本章实现 DID 身份系统的前端身份管理页面，覆盖：



- Identity Home

- DID Profile

- Wallet Binding UI

- VC Wallet

- Credential List

- Credential Detail

- Credential Verification

- Selective Disclosure Modal

- Samoa Enterprise Identity Page

- Company Formation VC Page

- Exchange KYC VC Page

- Gaming Age VC Page

- Financial Investor VC Page

- Commerce Merchant KYB Page

- 隐私展示规则

- 撤销 / 过期 / 链上锚定状态展示

    

目标：



```Plain Text
用户不仅能拥有 DID 和 VC，还能：
1. 看懂自己的身份状态
2. 管理绑定钱包
3. 查看凭证
4. 验证凭证
5. 选择性披露凭证
6. 知道哪些数据会被展示、隐藏、上链或承诺化
```



---



# 1\. 页面设计原则



DID 身份页面必须满足：



```Plain Text
1. 默认不展示敏感字段
2. 默认隐藏 PII
3. 高风险凭证显示风险提示
4. 过期 / 撤销 / 暂停状态必须醒目
5. 链上锚定状态必须透明
6. 钱包绑定状态必须清晰
7. 选择性披露前必须让用户确认披露字段
8. 萨摩亚公司设立类凭证必须单独展示企业流程
```



---



# 2\. 目录结构



```Bash
src/modules/did/
  ui/
    screens/
      IdentityHomeScreen.tsx
      DIDProfileScreen.tsx
      WalletBindingScreen.tsx
      CredentialListScreen.tsx
      CredentialDetailScreen.tsx
      CredentialVerifyScreen.tsx
      SamoaEnterpriseIdentityScreen.tsx
      SamoaCompanyFormationScreen.tsx

    components/
      DIDCard.tsx
      WalletBindingCard.tsx
      CredentialCard.tsx
      CredentialStatusBadge.tsx
      CredentialRiskBadge.tsx
      AnchorStatusView.tsx
      PrivacyClaimView.tsx
      VerificationResultView.tsx
      SelectiveDisclosureModal.tsx
      DomainIdentitySummary.tsx
      SamoaCompanyCard.tsx

    hooks/
      useIdentityProfile.ts
      useWalletBindings.ts
      useCredentialWallet.ts
```



---



# 3\. UI 类型



## `ui/types/identity-ui.types.ts`



```TypeScript
import { DIDString } from '../../core/did/did.types';
import { DIDBusinessDomain } from '../../core/domain/did-domain.types';
import { DomainCredentialType } from '../../core/domain/did-domain-credential.types';
import { WalletBindingRecord } from '../../core/wallet-binding/wallet-binding.types';
import { VerifiableCredential } from '../../core/vc/vc.types';

export type CredentialUiStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'suspended'
  | 'unknown';

export interface IdentityUiProfile {
  userId: string;
  primaryDid: DIDString;
  displayName?: string;
  avatarUrl?: string;

  domains: Array;

  walletBindings: WalletBindingRecord[];

  credentials: CredentialUiItem[];
}

export interface CredentialUiItem {
  credentialId: string;
  domain: DIDBusinessDomain;
  credentialType: DomainCredentialType;
  title: string;
  issuerDid: DIDString;
  subjectDid: DIDString;
  issuanceDate: string;
  expirationDate?: string;
  status: CredentialUiStatus;
  anchored?: boolean;
  anchorTxHash?: string;
  privacyLevel?: 'public' | 'private' | 'selective_disclosure' | 'zero_knowledge';
  credential?: VerifiableCredential;
}

export interface VerificationUiResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: Array;
}
```



---



# 4\. Credential 状态 Badge



## `ui/components/CredentialStatusBadge.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';
import { CredentialUiStatus } from '../types/identity-ui.types';

export function CredentialStatusBadge(props: {
  status: CredentialUiStatus;
}) {
  const color = getColor(props.status);

  return (
    
      
        {label(props.status)}
      
    
  );
}

function label(status: CredentialUiStatus) {
  switch (status) {
    case 'active':
      return '有效';
    case 'expired':
      return '已过期';
    case 'revoked':
      return '已撤销';
    case 'suspended':
      return '已暂停';
    default:
      return '未知';
  }
}

function getColor(status: CredentialUiStatus) {
  switch (status) {
    case 'active':
      return { bg: '#ECFDF5', fg: '#047857' };
    case 'expired':
      return { bg: '#F3F4F6', fg: '#374151' };
    case 'revoked':
      return { bg: '#FEF2F2', fg: '#991B1B' };
    case 'suspended':
      return { bg: '#FFFBEB', fg: '#92400E' };
    default:
      return { bg: '#F3F4F6', fg: '#6B7280' };
  }
}
```



---



# 5\. DID Card



## `ui/components/DIDCard.tsx`



```TypeScript
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function DIDCard(props: {
  did: string;
  displayName?: string;
  onPress?: () => void;
}) {
  return (
    
      
        Primary DID
      

      
        {props.displayName ?? 'My Identity'}
      

      
        {props.did}
      
    
  );
}
```



---



# 6\. Domain Identity Summary



## `ui/components/DomainIdentitySummary.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DIDBusinessDomain } from '../../core/domain/did-domain.types';

export function DomainIdentitySummary(props: {
  items: Array;
  onPressDomain: (domain: DIDBusinessDomain) => void;
}) {
  return (
    
      {props.items.map((item) => (
         props.onPressDomain(item.domain)}
          style={{
            width: 180,
            padding: 14,
            borderRadius: 18,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E5E7EB',
          }}
        >
          {icon(item.domain)}

          
            {label(item.domain)}
          

          
            {statusLabel(item.status)}
          

          
            {item.completedCredentials}/{item.requiredCredentials} credentials
          
        
      ))}
    
  );
}

function label(domain: DIDBusinessDomain) {
  const map: Record = {
    exchange: '交易所身份',
    cross_border_commerce: '跨境电商',
    gaming: '博彩身份',
    financial: '金融身份',
    samoa_enterprise: '萨摩亚企业家',
  };

  return map[domain];
}

function icon(domain: DIDBusinessDomain) {
  const map: Record = {
    exchange: '₿',
    cross_border_commerce: '🛒',
    gaming: '🎲',
    financial: '🏦',
    samoa_enterprise: '🏝️',
  };

  return map[domain];
}

function statusLabel(status: string) {
  switch (status) {
    case 'active':
      return '已完成';
    case 'restricted':
      return '受限';
    case 'under_review':
      return '审核中';
    default:
      return '待完善';
  }
}
```



---



# 7\. Wallet Binding Card



## `ui/components/WalletBindingCard.tsx`



```TypeScript
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WalletBindingRecord } from '../../core/wallet-binding/wallet-binding.types';

export function WalletBindingCard(props: {
  binding: WalletBindingRecord;
  onRevoke?: () => void;
}) {
  const revoked = Boolean(props.binding.revokedAt);

  return (
    
      
        {props.binding.namespace}:{props.binding.chainId}
      

      
        {props.binding.address}
      

      
        {revoked ? '已撤销' : '已验证绑定'}
      

      {!revoked && props.onRevoke && (
        
          
            撤销绑定
          
        
      )}
    
  );
}
```



---



# 8\. Credential Card



## `ui/components/CredentialCard.tsx`



```TypeScript
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CredentialUiItem } from '../types/identity-ui.types';
import { CredentialStatusBadge } from './CredentialStatusBadge';

export function CredentialCard(props: {
  item: CredentialUiItem;
  onPress: () => void;
}) {
  return (
    
      
        
          {icon(props.item.domain)}
        

        
          
            {props.item.title}
          

          
            {props.item.credentialType}
          
        

        
      

      
        {props.item.anchored && (
          
            ⛓ 已锚定
          
        )}

        {props.item.privacyLevel && (
          
            🔒 {privacyLabel(props.item.privacyLevel)}
          
        )}
      
    
  );
}

function icon(domain: string) {
  switch (domain) {
    case 'exchange':
      return '₿';
    case 'cross_border_commerce':
      return '🛒';
    case 'gaming':
      return '🎲';
    case 'financial':
      return '🏦';
    case 'samoa_enterprise':
      return '🏝️';
    default:
      return '🪪';
  }
}

function privacyLabel(level: string) {
  switch (level) {
    case 'zero_knowledge':
      return '零知识';
    case 'selective_disclosure':
      return '选择披露';
    case 'private':
      return '私密';
    default:
      return '公开';
  }
}
```



---



# 9\. Anchor Status View



## `ui/components/AnchorStatusView.tsx`



```TypeScript
import React from 'react';
import {
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function AnchorStatusView(props: {
  anchored?: boolean;
  txHash?: string;
  explorerUrl?: string;
}) {
  if (!props.anchored) {
    return (
      
        链上锚定
        该凭证尚未进行链上 Hash 锚定。
      
    );
  }

  return (
    
      链上锚定

      
        该凭证已将 Hash / Commitment 锚定到链上，用于防篡改验证。
      

      {props.txHash && (
         {
            if (props.explorerUrl) {
              Linking.openURL(`${props.explorerUrl}/tx/${props.txHash}`);
            }
          }}
        >
          
            {props.txHash}
          
        
      )}
    
  );
}

const box = {
  padding: 14,
  borderRadius: 16,
  backgroundColor: '#EFF6FF',
  marginTop: 14,
};

const title = {
  color: '#1E3A8A',
  fontWeight: '900' as const,
  fontSize: 14,
};

const desc = {
  marginTop: 6,
  color: '#1E40AF',
  fontSize: 12,
  lineHeight: 18,
};
```



---



# 10\. Privacy Claim View



敏感字段不能直接展示。



## `ui/components/PrivacyClaimView.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';

export function PrivacyClaimView(props: {
  label: string;
  value: unknown;
  privacyLevel?: string;
}) {
  const hidden =
    props.privacyLevel === 'sensitive' ||
    props.privacyLevel === 'zero_knowledge';

  return (
    
      
        {props.label}
      

      
        {hidden ? privacyText(props.privacyLevel) : stringify(props.value)}
      
    
  );
}

function privacyText(level?: string) {
  if (level === 'zero_knowledge') return '通过零知识证明，不展示原值';
  if (level === 'sensitive') return '已隐藏敏感字段';
  return '已隐藏';
}

function stringify(value: unknown) {
  if (value === undefined || value === null) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
```



---



# 11\. Verification Result View



## `ui/components/VerificationResultView.tsx`



```TypeScript
import React from 'react';
import { Text, View } from 'react-native';
import { VerificationUiResult } from '../types/identity-ui.types';

export function VerificationResultView(props: {
  result: VerificationUiResult;
}) {
  return (
    
      
        {props.result.valid ? '验证通过' : '验证失败'}
      

      {props.result.checks.map((check) => (
        
          
            {check.passed ? '✅' : check.skipped ? '⏭️' : '❌'}
          

          
            {check.name}
          

          {check.reason && (
            
              {check.reason}
            
          )}
        
      ))}

      {props.result.errors.length > 0 && (
        
          {props.result.errors.join(', ')}
        
      )}
    
  );
}
```



---



# 12\. Selective Disclosure Modal



## `ui/components/SelectiveDisclosureModal.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function SelectiveDisclosureModal(props: {
  visible: boolean;
  title?: string;
  requestedClaims: string[];
  sensitiveClaims?: string[];
  onApprove: (claims: string[]) => void;
  onReject: () => void;
}) {
  const [selected, setSelected] = useState>(
    new Set(props.requestedClaims),
  );

  function toggle(claim: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(claim) ? next.delete(claim) : next.add(claim);
      return next;
    });
  }

  return (
    
      
        
          {props.title ?? '选择性披露'}

          
            以下字段将披露给验证方。敏感字段默认建议隐藏或使用承诺 / 零知识证明。
          

          
            {props.requestedClaims.map((claim) => {
              const sensitive = props.sensitiveClaims?.includes(claim);
              const active = selected.has(claim);

              return (
                 toggle(claim)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    marginBottom: 8,
                    backgroundColor: active ? '#EEF2FF' : '#F9FAFB',
                    borderWidth: 1,
                    borderColor: active ? '#6366F1' : '#E5E7EB',
                  }}
                >
                  
                    {active ? '✓ ' : ''}
                    {claim}
                  

                  {sensitive && (
                    
                      敏感字段，建议不直接披露
                    
                  )}
                
              );
            })}
          

          
            
              拒绝
            

             props.onApprove(Array.from(selected))}
            >
              确认披露
            
          
        
      
    
  );
}

const backdrop = {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.45)',
  justifyContent: 'flex-end' as const,
};

const sheet = {
  backgroundColor: '#FFFFFF',
  padding: 20,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
};

const title = {
  color: '#111827',
  fontSize: 22,
  fontWeight: '900' as const,
};

const desc = {
  marginTop: 8,
  color: '#6B7280',
  fontSize: 13,
  lineHeight: 19,
};

const actions = {
  flexDirection: 'row' as const,
  gap: 12,
  marginTop: 18,
};

const rejectButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const approveButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const rejectText = {
  color: '#111827',
  fontWeight: '900' as const,
};

const approveText = {
  color: '#FFFFFF',
  fontWeight: '900' as const,
};
```



---



# 13\. Identity Home Screen



## `ui/screens/IdentityHomeScreen.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import { IdentityUiProfile } from '../types/identity-ui.types';
import { DIDBusinessDomain } from '../../core/domain/did-domain.types';
import { DIDCard } from '../components/DIDCard';
import { DomainIdentitySummary } from '../components/DomainIdentitySummary';
import { CredentialCard } from '../components/CredentialCard';
import { WalletBindingCard } from '../components/WalletBindingCard';

export function IdentityHomeScreen(props: {
  profile: IdentityUiProfile;
  onOpenDIDProfile: () => void;
  onOpenDomain: (domain: DIDBusinessDomain) => void;
  onOpenCredential: (credentialId: string) => void;
  onOpenWalletBinding: () => void;
}) {
  return (
    
      
        DID 身份
      

      

      

      

      

      {props.profile.walletBindings.slice(0, 2).map((binding) => (
        
      ))}

      

      {props.profile.credentials.slice(0, 5).map((credential) => (
         props.onOpenCredential(credential.credentialId)}
        />
      ))}
    
  );
}

function Section(props: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    
      
        {props.title}
      

      {props.action && (
        
          {props.action}
        
      )}
    
  );
}
```



---



# 14\. DID Profile Screen



## `ui/screens/DIDProfileScreen.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';

export function DIDProfileScreen(props: {
  did: string;
  document?: unknown;
  createdAt?: number;
}) {
  return (
    
      DID Profile

      

      {props.createdAt && (
        
      )}

      DID Document

      
        
          {JSON.stringify(props.document ?? {}, null, 2)}
        
      
    
  );
}

function Info(props: {
  label: string;
  value?: string;
}) {
  return (
    
      
        {props.label}
      
      
        {props.value ?? '-'}
      
    
  );
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};

const section = {
  marginTop: 24,
  marginBottom: 10,
  color: '#111827',
  fontSize: 18,
  fontWeight: '900' as const,
};

const jsonBox = {
  padding: 12,
  borderRadius: 14,
  backgroundColor: '#F9FAFB',
};

const jsonText = {
  color: '#111827',
  fontSize: 12,
  lineHeight: 17,
  fontFamily: 'Menlo',
};
```



---



# 15\. Wallet Binding Screen



## `ui/screens/WalletBindingScreen.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WalletBindingRecord } from '../../core/wallet-binding/wallet-binding.types';
import { WalletBindingCard } from '../components/WalletBindingCard';

export function WalletBindingScreen(props: {
  did: string;
  bindings: WalletBindingRecord[];
  onCreateBinding: () => Promise;
  onRevokeBinding: (bindingId: string) => Promise;
}) {
  const [loading, setLoading] = useState(false);

  async function bind() {
    setLoading(true);
    try {
      await props.onCreateBinding();
    } catch (error: any) {
      Alert.alert('绑定失败', error?.message ?? String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    
      钱包绑定

      
        钱包绑定用于证明你控制某个链上账户。交易所提现、博彩提现、金融投资、萨摩亚官方文件签署等高风险动作会要求强绑定。
      

      
        
          {loading ? '绑定中...' : '绑定新钱包'}
        
      

       item.bindingId}
        renderItem={({ item }) => (
           props.onRevokeBinding(item.bindingId)}
          />
        )}
        ListEmptyComponent={
          
            暂无绑定钱包
          
        }
      />
    
  );
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};

const desc = {
  marginTop: 8,
  color: '#6B7280',
  lineHeight: 20,
  fontSize: 13,
};
```



---



# 16\. Credential List Screen



## `ui/screens/CredentialListScreen.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DIDBusinessDomain } from '../../core/domain/did-domain.types';
import { CredentialUiItem } from '../types/identity-ui.types';
import { CredentialCard } from '../components/CredentialCard';

const domains: Array = [
  'all',
  'exchange',
  'cross_border_commerce',
  'gaming',
  'financial',
  'samoa_enterprise',
];

export function CredentialListScreen(props: {
  credentials: CredentialUiItem[];
  onOpenCredential: (credentialId: string) => void;
}) {
  const [active, setActive] = useState('all');

  const data =
    active === 'all'
      ? props.credentials
      : props.credentials.filter((item) => item.domain === active);

  return (
    
      VC Wallet

      
        {domains.map((domain) => (
           setActive(domain)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: active === domain ? '#111827' : '#F3F4F6',
            }}
          >
            
              {domainLabel(domain)}
            
          
        ))}
      

       item.credentialId}
        renderItem={({ item }) => (
           props.onOpenCredential(item.credentialId)}
          />
        )}
        ListEmptyComponent={
          
            暂无凭证
          
        }
      />
    
  );
}

function domainLabel(domain: DIDBusinessDomain | 'all') {
  const map: Record = {
    all: '全部',
    exchange: '交易所',
    cross_border_commerce: '电商',
    gaming: '博彩',
    financial: '金融',
    samoa_enterprise: '萨摩亚',
  };

  return map[domain];
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};
```



---



# 17\. Credential Detail Screen



## `ui/screens/CredentialDetailScreen.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CredentialUiItem, VerificationUiResult } from '../types/identity-ui.types';
import { CredentialStatusBadge } from '../components/CredentialStatusBadge';
import { AnchorStatusView } from '../components/AnchorStatusView';
import { PrivacyClaimView } from '../components/PrivacyClaimView';
import { VerificationResultView } from '../components/VerificationResultView';
import { SelectiveDisclosureModal } from '../components/SelectiveDisclosureModal';

export function CredentialDetailScreen(props: {
  item: CredentialUiItem;
  onVerify: (credentialId: string) => Promise;
  onCreateDisclosure: (credentialId: string, claims: string[]) => Promise;
}) {
  const [verifyResult, setVerifyResult] = useState(null);
  const [disclosureVisible, setDisclosureVisible] = useState(false);

  const subject = Array.isArray(props.item.credential?.credentialSubject)
    ? props.item.credential?.credentialSubject[0]
    : props.item.credential?.credentialSubject;

  const claims = subject
    ? Object.keys(subject).filter((key) => key !== 'id')
    : [];

  async function verify() {
    try {
      const result = await props.onVerify(props.item.credentialId);
      setVerifyResult(result);
    } catch (error: any) {
      Alert.alert('验证失败', error?.message ?? String(error));
    }
  }

  return (
    
      
        
          {props.item.title}
          {props.item.credentialType}
        

        
      

      
      
      
      
      

      

      Claims

      
        {claims.map((claim) => (
          
        ))}
      

      
        
          验证凭证
        

         setDisclosureVisible(true)}
        >
          选择披露
        
      

      {verifyResult && (
        
      )}

       inferPrivacy(c) !== 'public')}
        onReject={() => setDisclosureVisible(false)}
        onApprove={async (selected) => {
          setDisclosureVisible(false);
          await props.onCreateDisclosure(props.item.credentialId, selected);
        }}
      />
    
  );
}

function Info(props: {
  label: string;
  value?: string;
}) {
  return (
    
      
        {props.label}
      
      
        {props.value ?? '-'}
      
    
  );
}

function inferPrivacy(claim: string): string {
  if (/passport|tax|ubo|address|income|asset|dob|dateOfBirth/i.test(claim)) {
    return 'sensitive';
  }

  if (/ageOver|accredited|eligible|kycLevel|verified/i.test(claim)) {
    return 'private';
  }

  return 'public';
}

const title = {
  color: '#111827',
  fontSize: 22,
  fontWeight: '900' as const,
};

const subtitle = {
  marginTop: 4,
  color: '#6B7280',
  fontSize: 13,
};

const section = {
  marginTop: 22,
  marginBottom: 10,
  color: '#111827',
  fontSize: 18,
  fontWeight: '900' as const,
};

const claimsBox = {
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  paddingHorizontal: 14,
};

const primaryButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#111827',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const secondaryButton = {
  flex: 1,
  height: 48,
  borderRadius: 14,
  backgroundColor: '#F3F4F6',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const primaryText = {
  color: '#FFFFFF',
  fontWeight: '900' as const,
};

const secondaryText = {
  color: '#111827',
  fontWeight: '900' as const,
};
```



---



# 18\. Credential Verify Screen



## `ui/screens/CredentialVerifyScreen.tsx`



```TypeScript
import React, { useState } from 'react';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { VerificationUiResult } from '../types/identity-ui.types';
import { VerificationResultView } from '../components/VerificationResultView';

export function CredentialVerifyScreen(props: {
  onVerifyRaw: (raw: string) => Promise;
}) {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function verify() {
    setLoading(true);
    try {
      const res = await props.onVerifyRaw(raw);
      setResult(res);
    } catch (error: any) {
      Alert.alert('验证失败', error?.message ?? String(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    
      验证凭证

      

      
        
          {loading ? '验证中...' : '开始验证'}
        
      

      {result && (
        
      )}
    
  );
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};
```



---



# 19\. Samoa Company Card



## `ui/components/SamoaCompanyCard.tsx`



```TypeScript
import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export function SamoaCompanyCard(props: {
  companyName?: string;
  companyNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'incorporated' | 'rejected' | 'struck_off';
  goodStanding?: boolean;
  onPress: () => void;
}) {
  return (
    
      
        {props.companyName ?? '未命名公司申请'}
      

      
        {props.companyNumber ?? '暂无公司编号'}
      

      
        
          {statusLabel(props.status)}
        

        {props.goodStanding !== undefined && (
          
            {props.goodStanding ? 'Good Standing' : 'Not in Good Standing'}
          
        )}
      
    
  );
}

function statusLabel(status: string) {
  const map: Record = {
    draft: '草稿',
    submitted: '已提交',
    under_review: '审核中',
    incorporated: '已注册',
    rejected: '已拒绝',
    struck_off: '已除名',
  };

  return map[status] ?? status;
}

function statusColor(status: string) {
  if (status === 'incorporated') return '#047857';
  if (status === 'rejected' || status === 'struck_off') return '#DC2626';
  if (status === 'under_review') return '#92400E';
  return '#6B7280';
}
```



---



# 20\. Samoa Enterprise Identity Screen



## `ui/screens/SamoaEnterpriseIdentityScreen.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CredentialUiItem } from '../types/identity-ui.types';
import { CredentialCard } from '../components/CredentialCard';
import { SamoaCompanyCard } from '../components/SamoaCompanyCard';

export function SamoaEnterpriseIdentityScreen(props: {
  entrepreneurDid: string;
  credentials: CredentialUiItem[];
  companies: Array;
  onOpenCredential: (credentialId: string) => void;
  onOpenCompany: (index: number) => void;
}) {
  const entrepreneurCredential = props.credentials.find(
    (item) => item.credentialType === 'SamoaEntrepreneurIdentity',
  );

  return (
    
      萨摩亚企业家身份

      
        用于萨摩亚官网 APP、公司设立、董事 / 股东 / UBO 声明、注册代理、公司证书和 Good Standing 管理。
      

      
        
          Entrepreneur DID
        
        
          {props.entrepreneurDid}
        

        
          {entrepreneurCredential?.status === 'active'
            ? '企业家身份已验证'
            : '企业家身份待完善'}
        
      

      

      {props.companies.map((company, index) => (
         props.onOpenCompany(index)}
        />
      ))}

      

      {props.credentials.map((item) => (
         props.onOpenCredential(item.credentialId)}
        />
      ))}
    
  );
}

function Section(props: {
  title: string;
}) {
  return (
    
      {props.title}
    
  );
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};

const desc = {
  marginTop: 8,
  color: '#6B7280',
  lineHeight: 20,
  fontSize: 13,
};

const identityBox = {
  marginTop: 16,
  padding: 16,
  borderRadius: 18,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
};
```



---



# 21\. Samoa Company Formation Screen



## `ui/screens/SamoaCompanyFormationScreen.tsx`



```TypeScript
import React from 'react';
import {
  ScrollView,
  Text,
  View,
} from 'react-native';
import { CredentialUiItem } from '../types/identity-ui.types';
import { CredentialCard } from '../components/CredentialCard';

export function SamoaCompanyFormationScreen(props: {
  companyName?: string;
  companyNumber?: string;
  status: string;
  credentials: CredentialUiItem[];
  onOpenCredential: (credentialId: string) => void;
}) {
  const required = [
    'SamoaCompanyNameReservation',
    'SamoaCompanyFormationApplication',
    'SamoaDirectorIdentity',
    'SamoaShareholderIdentity',
    'SamoaUBODeclaration',
    'SamoaRegisteredAgent',
    'SamoaRegisteredOfficeAddress',
    'SamoaCompanyIncorporationCertificate',
    'SamoaCompanyGoodStanding',
  ];

  return (
    
      
        {props.companyName ?? '公司设立申请'}
      

      
        {props.companyNumber ?? '暂无公司编号'}
      

      
        状态：{props.status}
      

      设立流程

      {required.map((type) => {
        const item = props.credentials.find((c) => c.credentialType === type);

        return (
          
            
              {type}
            
            
              {item?.status === 'active' ? '完成' : '待完成'}
            
          
        );
      })}

      凭证

      {props.credentials.map((item) => (
         props.onOpenCredential(item.credentialId)}
        />
      ))}
    
  );
}

const title = {
  color: '#111827',
  fontSize: 24,
  fontWeight: '900' as const,
};

const desc = {
  marginTop: 6,
  color: '#6B7280',
  fontSize: 13,
};

const section = {
  marginTop: 22,
  marginBottom: 10,
  color: '#111827',
  fontSize: 18,
  fontWeight: '900' as const,
};

const step = {
  padding: 14,
  borderRadius: 14,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  marginBottom: 8,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
};
```



---



# 22\. Hooks：Identity Profile



## `ui/hooks/useIdentityProfile.ts`



```TypeScript
import { useEffect, useState } from 'react';
import { IdentityUiProfile } from '../types/identity-ui.types';

export interface IdentityProfileProvider {
  getProfile(userId: string): Promise;
}

export function useIdentityProfile(input: {
  userId: string;
  provider: IdentityProfileProvider;
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setProfile(await input.provider.getProfile(input.userId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [input.userId]);

  return {
    profile,
    loading,
    reload,
  };
}
```



---



# 23\. Hooks：Credential Wallet



## `ui/hooks/useCredentialWallet.ts`



```TypeScript
import { useEffect, useState } from 'react';
import {
  CredentialUiItem,
  VerificationUiResult,
} from '../types/identity-ui.types';

export interface CredentialWalletProvider {
  listCredentials(userId: string): Promise;
  verifyCredential(credentialId: string): Promise;
  createDisclosure(input: {
    credentialId: string;
    claims: string[];
  }): Promise;
}

export function useCredentialWallet(input: {
  userId: string;
  provider: CredentialWalletProvider;
}) {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setCredentials(await input.provider.listCredentials(input.userId));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [input.userId]);

  return {
    credentials,
    loading,
    reload,
    verifyCredential: input.provider.verifyCredential.bind(input.provider),
    createDisclosure: input.provider.createDisclosure.bind(input.provider),
  };
}
```



---



# 24\. Hooks：Wallet Bindings



## `ui/hooks/useWalletBindings.ts`



```TypeScript
import { useEffect, useState } from 'react';
import { WalletBindingRecord } from '../../core/wallet-binding/wallet-binding.types';

export interface WalletBindingProvider {
  listBindings(did: string): Promise;
  createBinding(did: string): Promise;
  revokeBinding(bindingId: string): Promise;
}

export function useWalletBindings(input: {
  did: string;
  provider: WalletBindingProvider;
}) {
  const [bindings, setBindings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    try {
      setBindings(await input.provider.listBindings(input.did));
    } finally {
      setLoading(false);
    }
  }

  async function createBinding() {
    await input.provider.createBinding(input.did);
    await reload();
  }

  async function revokeBinding(bindingId: string) {
    await input.provider.revokeBinding(bindingId);
    await reload();
  }

  useEffect(() => {
    void reload();
  }, [input.did]);

  return {
    bindings,
    loading,
    reload,
    createBinding,
    revokeBinding,
  };
}
```



---



# 25\. UI 数据适配 Service



把核心层 `IdentityProfile / VC / Lifecycle` 转成 UI 模型。



## `core/identity/identity-ui-adapter.service.ts`



```TypeScript
import { IdentityProfile } from './identity.types';
import { CredentialLifecycleRecord } from '../credential-lifecycle/credential-lifecycle.types';
import { CredentialUiItem, IdentityUiProfile } from '../../ui/types/identity-ui.types';
import { VerifiableCredential } from '../vc/vc.types';

export class IdentityUiAdapterService {
  toProfile(input: {
    profile: IdentityProfile;
    lifecycles: CredentialLifecycleRecord[];
    credentials: Array;
  }): IdentityUiProfile {
    const credentialItems = input.lifecycles.map((life) => {
      const credential = input.credentials.find(
        (item) => item.credentialId === life.credentialId,
      )?.credential;

      return this.toCredentialItem({
        lifecycle: life,
        credential,
      });
    });

    return {
      userId: input.profile.userId,
      primaryDid: input.profile.primaryDid,
      displayName: input.profile.displayName,
      avatarUrl: input.profile.avatarUrl,
      walletBindings: input.profile.wallets,
      credentials: credentialItems,
      domains: [
        'exchange',
        'cross_border_commerce',
        'gaming',
        'financial',
        'samoa_enterprise',
      ].map((domain: any) => {
        const domainCreds = credentialItems.filter((c) => c.domain === domain);
        const active = domainCreds.filter((c) => c.status === 'active').length;

        return {
          domain,
          status: active > 0 ? 'active' : 'incomplete',
          completedCredentials: active,
          requiredCredentials: requiredCount(domain),
        };
      }),
    };
  }

  toCredentialItem(input: {
    lifecycle: CredentialLifecycleRecord;
    credential?: VerifiableCredential;
  }): CredentialUiItem {
    return {
      credentialId: input.lifecycle.credentialId,
      domain: input.lifecycle.domain,
      credentialType: input.lifecycle.credentialType,
      title: titleForCredential(input.lifecycle.credentialType),
      issuerDid: input.lifecycle.issuerDid,
      subjectDid: input.lifecycle.subjectDid,
      issuanceDate: input.lifecycle.issuanceDate,
      expirationDate: input.lifecycle.expirationDate,
      status: mapStatus(input.lifecycle.status),
      anchored: Boolean(input.lifecycle.anchor),
      anchorTxHash: input.lifecycle.anchor?.txHash,
      privacyLevel: inferCredentialPrivacy(input.lifecycle.credentialType),
      credential: input.credential,
    };
  }
}

function mapStatus(status: string): any {
  if (status === 'active' || status === 'issued') return 'active';
  if (status === 'expired') return 'expired';
  if (status === 'revoked') return 'revoked';
  if (status === 'suspended') return 'suspended';
  return 'unknown';
}

function requiredCount(domain: string): number {
  const map: Record = {
    exchange: 3,
    cross_border_commerce: 3,
    gaming: 4,
    financial: 4,
    samoa_enterprise: 8,
  };

  return map[domain] ?? 1;
}

function titleForCredential(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function inferCredentialPrivacy(type: string): any {
  if (/Age|Asset|Income|UBO|KYC|KYB|Tax|Risk|Accredited/i.test(type)) {
    return 'selective_disclosure';
  }

  if (/AgeOver|Geo|Investor/i.test(type)) {
    return 'zero_knowledge';
  }

  return 'private';
}
```



---



# 26\. 页面路由建议



```TypeScript
type IdentityStackParamList = {
  IdentityHome: undefined;
  DIDProfile: { did: string };
  WalletBinding: { did: string };
  CredentialList: undefined;
  CredentialDetail: { credentialId: string };
  CredentialVerify: undefined;
  SamoaEnterpriseIdentity: undefined;
  SamoaCompanyFormation: { companyIndex: number };
};
```



---



# 27\. 五大域页面入口策略



```TypeScript
function openDomain(domain: DIDBusinessDomain) {
  switch (domain) {
    case 'samoa_enterprise':
      navigation.navigate('SamoaEnterpriseIdentity');
      return;

    case 'exchange':
    case 'cross_border_commerce':
    case 'gaming':
    case 'financial':
      navigation.navigate('CredentialList', {
        domain,
      });
      return;
  }
}
```



---



# 28\. 隐私展示规则



UI 必须遵守：



```Plain Text
1. passportNumber 永不展示
2. dateOfBirth 永不展示
3. taxId 永不展示
4. address 默认不展示
5. income / assetValue 永不展示
6. UBO name 默认不展示
7. 只展示 commitment / bucket / boolean / verified status
8. 用户点击选择性披露时必须二次确认
9. ZK 凭证展示为“已通过隐私证明”
10. 链上只展示 txHash，不展示原始字段
```



---



# 29\. Samoa 页面特别规则



萨摩亚企业家页面必须突出：



```Plain Text
Entrepreneur Identity
Company Name Reservation
Formation Application
Director / Shareholder / UBO
Registered Agent
Registered Office
Incorporation Certificate
Good Standing
Business License Eligibility
```



同时隐藏：



```Plain Text
护照号
真实地址
UBO 姓名
税务号
资金来源详情
AML / PEP / Sanctions 明细
```



---



# 30\. 验收标准



本章 UI 验收必须满足：



```Plain Text
1. 可展示 primary DID
2. 可展示五大业务域身份状态
3. 可展示钱包绑定
4. 可发起钱包绑定
5. 可撤销钱包绑定
6. 可展示 VC 列表
7. 可按业务域筛选 VC
8. 可查看 VC 详情
9. 不展示敏感 claim 原文
10. 可验证 VC
11. 可显示验证 checks
12. 可显示 revoked / expired / suspended
13. 可显示链上锚定 txHash
14. 可发起选择性披露
15. 萨摩亚企业家页面可展示公司设立流程
```



---



# 31\. 本章完成内容



本章完成：



```Plain Text
Identity UI 类型
DIDCard
DomainIdentitySummary
WalletBindingCard
CredentialStatusBadge
CredentialCard
AnchorStatusView
PrivacyClaimView
VerificationResultView
SelectiveDisclosureModal
IdentityHomeScreen
DIDProfileScreen
WalletBindingScreen
CredentialListScreen
CredentialDetailScreen
CredentialVerifyScreen
SamoaEnterpriseIdentityScreen
SamoaCompanyFormationScreen
useIdentityProfile
useCredentialWallet
useWalletBindings
IdentityUiAdapterService
五大业务域 UI 入口策略
隐私展示规则
```



现在 DID 身份系统具备完整用户侧身份管理界面：



```Plain Text
DID Profile
  -> Wallet Binding
  -> VC Wallet
  -> Credential Detail
  -> Verify
  -> Selective Disclosure
  -> Samoa Enterprise Flow
```



---



# 32\. 下一章继续



下一章：



# 《DID 身份 Part 11：后台管理 Issuer / Schema / Credential / Revocation / Audit》



将覆盖：



```Plain Text
Issuer Admin
Schema Admin
Credential Admin
Revocation Admin
Samoa Enterprise Admin
Company Formation Review
Credential Lifecycle Admin
StatusList Admin
Anchor Admin
Audit Log
RBAC 权限
高危操作 MFA
Prisma 数据表
NestJS Controller
```



