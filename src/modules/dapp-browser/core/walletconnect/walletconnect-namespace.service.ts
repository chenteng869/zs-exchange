import type { WalletConnectNamespace, WalletConnectProposal } from './walletconnect.types';

const DEFAULT_METHODS = [
  'eth_chainId',
  'eth_accounts',
  'eth_requestAccounts',
  'eth_sendTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'eth_call',
  'net_version',
  'net_chainId',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_watchAsset',
];

const DEFAULT_EVENTS = ['chainChanged', 'accountsChanged', 'connect', 'disconnect'];

const CHAIN_CONFIG: Record<string, { name: string; symbol: string }> = {
  'eip155:1': { name: 'Ethereum', symbol: 'ETH' },
  'eip155:5': { name: 'Goerli', symbol: 'ETH' },
  'eip155:56': { name: 'BSC', symbol: 'BNB' },
  'eip155:137': { name: 'Polygon', symbol: 'MATIC' },
  'eip155:42161': { name: 'Arbitrum', symbol: 'ETH' },
  'eip155:8453': { name: 'Base', symbol: 'ETH' },
};

export class WalletConnectNamespaceService {
  buildNamespace(chainId: string, address: string): WalletConnectNamespace {
    return {
      chains: [chainId],
      methods: DEFAULT_METHODS,
      events: DEFAULT_EVENTS,
    };
  }

  buildNamespaces(chains: string[], addresses: string[]): Record<string, WalletConnectNamespace> {
    const namespaces: Record<string, WalletConnectNamespace> = {};
    chains.forEach((chainId) => {
      namespaces[chainId.split(':')[0]] = {
        chains,
        methods: DEFAULT_METHODS,
        events: DEFAULT_EVENTS,
      };
    });
    return namespaces;
  }

  validateProposal(proposal: WalletConnectProposal): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { requiredNamespaces } = proposal.params;

    if (!requiredNamespaces || Object.keys(requiredNamespaces).length === 0) {
      errors.push('No required namespaces provided');
      return { valid: false, errors };
    }

    for (const [namespace, config] of Object.entries(requiredNamespaces)) {
      if (!config.chains || config.chains.length === 0) {
        errors.push(`Namespace ${namespace} has no chains`);
      }

      for (const chain of config.chains) {
        if (!chain.startsWith('eip155:')) {
          errors.push(`Unsupported chain namespace: ${chain}`);
        }
      }

      if (config.methods) {
        for (const method of config.methods) {
          if (!DEFAULT_METHODS.includes(method) && !method.startsWith('eth_')) {
            errors.push(`Unsupported method: ${method}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  filterAllowedMethods(methods: string[]): string[] {
    return methods.filter((method) => DEFAULT_METHODS.includes(method) || method.startsWith('eth_'));
  }

  getChainInfo(chainId: string): { name: string; symbol: string } | undefined {
    return CHAIN_CONFIG[chainId];
  }

  isChainSupported(chainId: string): boolean {
    return Object.keys(CHAIN_CONFIG).includes(chainId);
  }

  getAllSupportedChains(): string[] {
    return Object.keys(CHAIN_CONFIG);
  }
}