'use client';

import { WagmiProvider } from '@/lib/web3/WagmiProvider';
import { WalletButton } from './WalletButton';

export function WalletButtonWithProvider() {
  return (
    <WagmiProvider>
      <WalletButton />
    </WagmiProvider>
  );
}

export default WalletButtonWithProvider;
