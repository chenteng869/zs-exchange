/**
 * Cosmos 链适配器
 *
 * 支持的链：
 *  - Cosmos Hub (ATOM)
 *  - Osmosis (OSMO)
 *  - Juno (JUNO)
 *  - Axelar (AXL)
 *  - Evmos (EVMOS)
 *  - Injective (INJ)
 *  - Sei (SEI)
 *  - Celestia (TIA)
 *  - Kujira (KUJI)
 *  - Noble (USDC)
 *  - Stride (STRD)
 *  - 更多...
 *
 * 功能：
 *  - 地址生成 (Bech32)
 *  - 余额查询
 *  - 交易构建与签名 (Proto / Amino)
 *  - 跨链转账 (IBC)
 *  - 质押
 *  - 治理
 *  - NFT
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface CosmosChainConfig {
  chainId: string;
  chainName: string;
  symbol: string;
  decimals: number;
  bech32Prefix: string;
  rpcUrls: string[];
  restUrls: string[];
  blockExplorerUrl: string;
  features: {
    ibc: boolean;
    staking: boolean;
    governance: boolean;
    nft: boolean;
    smartContracts: boolean;
  };
}

export interface CosmosBalance {
  denom: string;
  amount: string;
  formatted: string;
  usdValue?: string;
}

export interface CosmosAccount {
  address: string;
  pubkey: string;
  accountNumber: number;
  sequence: number;
  type: string;
}

export interface CosmosTransaction {
  hash: string;
  height: string;
  timestamp: string;
  code: number;
  gasWanted: string;
  gasUsed: string;
  fee: {
    amount: Array<{ denom: string; amount: string }>;
    gas_limit: string;
  };
  messages: CosmosMessage[];
  memo?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface CosmosMessage {
  type: string;
  value: any;
}

export interface CosmosStakeInfo {
  delegatorAddress: string;
  validatorAddress: string;
  shares: string;
  balance: string;
  status: 'bonded' | 'unbonding' | 'unbonded';
  completionTime?: string;
}

export interface ValidatorInfo {
  operatorAddress: string;
  consensusPubkey: string;
  jailed: boolean;
  status: string;
  tokens: string;
  delegatorShares: string;
  description: {
    moniker: string;
    identity: string;
    website: string;
    details: string;
  };
  commission: {
    commission_rates: {
      rate: string;
      max_rate: string;
      max_change_rate: string;
    };
    update_time: string;
  };
  votingPower: string;
}

export interface ProposalInfo {
  id: string;
  title: string;
  description: string;
  status: string;
  submitTime: string;
  depositEndTime: string;
  votingStartTime: string;
  votingEndTime: string;
  totalDeposit: Array<{ denom: string; amount: string }>;
  finalTallyResult?: {
    yes: string;
    abstain: string;
    no: string;
    noWithVeto: string;
  };
}

export interface IBCChainInfo {
  chainId: string;
  channelId: string;
  counterpartyChainId: string;
  counterpartyChannelId: string;
  connectionId: string;
  state: 'STATE_OPEN' | string;
  ordering: 'ORDER_UNORDERED' | 'ORDER_ORDERED';
  version: string;
  portId: string;
  counterpartyPortId: string;
}

export interface IBCTransferParams {
  sender: string;
  receiver: string;
  sourceChannel: string;
  sourcePort: string;
  token: {
    denom: string;
    amount: string;
  };
  timeoutHeight?: {
    revisionNumber: string;
    revisionHeight: string;
  };
  timeoutTimestamp?: string;
  memo?: string;
}

// ============================================================================
// Cosmos 链配置
// ============================================================================

export const COSMOS_CHAINS: Record<string, CosmosChainConfig> = {
  cosmos: {
    chainId: 'cosmoshub-4',
    chainName: 'Cosmos Hub',
    symbol: 'ATOM',
    decimals: 6,
    bech32Prefix: 'cosmos',
    rpcUrls: ['https://rpc.cosmos.directory/cosmoshub', 'https://cosmos-rpc.publicnode.com:443'],
    restUrls: ['https://rest.cosmos.directory/cosmoshub', 'https://cosmos-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/cosmos',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  osmosis: {
    chainId: 'osmosis-1',
    chainName: 'Osmosis',
    symbol: 'OSMO',
    decimals: 6,
    bech32Prefix: 'osmo',
    rpcUrls: ['https://rpc.osmosis.zone', 'https://osmosis-rpc.publicnode.com:443'],
    restUrls: ['https://lcd.osmosis.zone', 'https://osmosis-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/osmosis',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: true,
    },
  },
  juno: {
    chainId: 'juno-1',
    chainName: 'Juno',
    symbol: 'JUNO',
    decimals: 6,
    bech32Prefix: 'juno',
    rpcUrls: ['https://rpc.juno.strange.love', 'https://juno-rpc.publicnode.com:443'],
    restUrls: ['https://rest.juno.strange.love', 'https://juno-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/juno',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: true,
    },
  },
  axelar: {
    chainId: 'axelar-dojo-1',
    chainName: 'Axelar',
    symbol: 'AXL',
    decimals: 6,
    bech32Prefix: 'axelar',
    rpcUrls: ['https://rpc.axelar.strange.love', 'https://axelar-rpc.publicnode.com:443'],
    restUrls: ['https://rest.axelar.strange.love', 'https://axelar-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/axelar',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  evmos: {
    chainId: 'evmos_9001-2',
    chainName: 'Evmos',
    symbol: 'EVMOS',
    decimals: 18,
    bech32Prefix: 'evmos',
    rpcUrls: ['https://rpc.evmos.strange.love', 'https://evmos-rpc.publicnode.com:443'],
    restUrls: ['https://rest.evmos.strange.love', 'https://evmos-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/evmos',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: true,
    },
  },
  injective: {
    chainId: 'injective-1',
    chainName: 'Injective',
    symbol: 'INJ',
    decimals: 18,
    bech32Prefix: 'inj',
    rpcUrls: ['https://injective-rpc.publicnode.com:443', 'https://rpc.injective.strange.love'],
    restUrls: ['https://injective-rest.publicnode.com', 'https://rest.injective.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/injective',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  sei: {
    chainId: 'pacific-1',
    chainName: 'Sei',
    symbol: 'SEI',
    decimals: 6,
    bech32Prefix: 'sei',
    rpcUrls: ['https://sei-rpc.publicnode.com:443', 'https://rpc.sei.strange.love'],
    restUrls: ['https://sei-rest.publicnode.com', 'https://rest.sei.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/sei',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  celestia: {
    chainId: 'celestia',
    chainName: 'Celestia',
    symbol: 'TIA',
    decimals: 6,
    bech32Prefix: 'celestia',
    rpcUrls: ['https://celestia-rpc.publicnode.com:443', 'https://rpc.celestia.strange.love'],
    restUrls: ['https://celestia-rest.publicnode.com', 'https://rest.celestia.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/celestia',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  kujira: {
    chainId: 'kaiyo-1',
    chainName: 'Kujira',
    symbol: 'KUJI',
    decimals: 6,
    bech32Prefix: 'kujira',
    rpcUrls: ['https://kujira-rpc.publicnode.com:443', 'https://rpc.kujira.strange.love'],
    restUrls: ['https://kujira-rest.publicnode.com', 'https://rest.kujira.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/kujira',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  stride: {
    chainId: 'stride-1',
    chainName: 'Stride',
    symbol: 'STRD',
    decimals: 6,
    bech32Prefix: 'stride',
    rpcUrls: ['https://stride-rpc.publicnode.com:443', 'https://rpc.stride.strange.love'],
    restUrls: ['https://stride-rest.publicnode.com', 'https://rest.stride.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/stride',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  noble: {
    chainId: 'noble-1',
    chainName: 'Noble',
    symbol: 'USDC',
    decimals: 6,
    bech32Prefix: 'noble',
    rpcUrls: ['https://noble-rpc.publicnode.com:443', 'https://rpc.noble.strange.love'],
    restUrls: ['https://noble-rest.publicnode.com', 'https://rest.noble.strange.love'],
    blockExplorerUrl: 'https://mintscan.io/noble',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  agoric: {
    chainId: 'agoric-3',
    chainName: 'Agoric',
    symbol: 'BLD',
    decimals: 6,
    bech32Prefix: 'agoric',
    rpcUrls: ['https://agoric-rpc.publicnode.com:443'],
    restUrls: ['https://agoric-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/agoric',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  akash: {
    chainId: 'akashnet-2',
    chainName: 'Akash',
    symbol: 'AKT',
    decimals: 6,
    bech32Prefix: 'akash',
    rpcUrls: ['https://akash-rpc.publicnode.com:443'],
    restUrls: ['https://akash-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/akash',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  crescent: {
    chainId: 'crescent-1',
    chainName: 'Crescent',
    symbol: 'CRE',
    decimals: 6,
    bech32Prefix: 'cre',
    rpcUrls: ['https://crescent-rpc.publicnode.com:443'],
    restUrls: ['https://crescent-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/crescent',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  desmos: {
    chainId: 'desmos-mainnet',
    chainName: 'Desmos',
    symbol: 'DSM',
    decimals: 6,
    bech32Prefix: 'desmos',
    rpcUrls: ['https://desmos-rpc.publicnode.com:443'],
    restUrls: ['https://desmos-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/desmos',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  dig: {
    chainId: 'dig-1',
    chainName: 'Dig',
    symbol: 'DIG',
    decimals: 6,
    bech32Prefix: 'dig',
    rpcUrls: ['https://dig-rpc.publicnode.com:443'],
    restUrls: ['https://dig-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/dig',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  fetchai: {
    chainId: 'fetchhub-4',
    chainName: 'Fetch.ai',
    symbol: 'FET',
    decimals: 18,
    bech32Prefix: 'fetch',
    rpcUrls: ['https://fetchai-rpc.publicnode.com:443'],
    restUrls: ['https://fetchai-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/fetchai',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  gravitybridge: {
    chainId: 'gravity-bridge-3',
    chainName: 'Gravity Bridge',
    symbol: 'GRAV',
    decimals: 6,
    bech32Prefix: 'gravity',
    rpcUrls: ['https://gravitybridge-rpc.publicnode.com:443'],
    restUrls: ['https://gravitybridge-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/gravity-bridge',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  iris: {
    chainId: 'irishub-1',
    chainName: 'IRISnet',
    symbol: 'IRIS',
    decimals: 6,
    bech32Prefix: 'iaa',
    rpcUrls: ['https://iris-rpc.publicnode.com:443'],
    restUrls: ['https://iris-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/iris',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  likecoin: {
    chainId: 'likecoin-mainnet-2',
    chainName: 'LikeCoin',
    symbol: 'LIKE',
    decimals: 9,
    bech32Prefix: 'like',
    rpcUrls: ['https://likecoin-rpc.publicnode.com:443'],
    restUrls: ['https://likecoin-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/likecoin',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  lumnetwork: {
    chainId: 'lum-network-1',
    chainName: 'Lum Network',
    symbol: 'LUM',
    decimals: 6,
    bech32Prefix: 'lum',
    rpcUrls: ['https://lumnetwork-rpc.publicnode.com:443'],
    restUrls: ['https://lumnetwork-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/lumnetwork',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  mars: {
    chainId: 'mars-1',
    chainName: 'Mars',
    symbol: 'MARS',
    decimals: 6,
    bech32Prefix: 'mars',
    rpcUrls: ['https://mars-rpc.publicnode.com:443'],
    restUrls: ['https://mars-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/mars',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  omniflix: {
    chainId: 'omniflixhub-1',
    chainName: 'OmniFlix',
    symbol: 'FLIX',
    decimals: 6,
    bech32Prefix: 'omniflix',
    rpcUrls: ['https://omniflix-rpc.publicnode.com:443'],
    restUrls: ['https://omniflix-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/omniflix',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  onomy: {
    chainId: 'onomy-mainnet-1',
    chainName: 'Onomy',
    symbol: 'NOM',
    decimals: 18,
    bech32Prefix: 'onomy',
    rpcUrls: ['https://onomy-rpc.publicnode.com:443'],
    restUrls: ['https://onomy-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/onomy',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  provenance: {
    chainId: 'pio-mainnet-1',
    chainName: 'Provenance',
    symbol: 'HASH',
    decimals: 9,
    bech32Prefix: 'pb',
    rpcUrls: ['https://provenance-rpc.publicnode.com:443'],
    restUrls: ['https://provenance-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/provenance',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: true,
    },
  },
  quicksilver: {
    chainId: 'quicksilver-2',
    chainName: 'Quicksilver',
    symbol: 'QCK',
    decimals: 6,
    bech32Prefix: 'quick',
    rpcUrls: ['https://quicksilver-rpc.publicnode.com:443'],
    restUrls: ['https://quicksilver-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/quicksilver',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  regen: {
    chainId: 'regen-1',
    chainName: 'Regen',
    symbol: 'REGEN',
    decimals: 6,
    bech32Prefix: 'regen',
    rpcUrls: ['https://regen-rpc.publicnode.com:443'],
    restUrls: ['https://regen-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/regen',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  rizon: {
    chainId: 'rizon-world',
    chainName: 'Rizon',
    symbol: 'ATOLO',
    decimals: 6,
    bech32Prefix: 'rizon',
    rpcUrls: ['https://rizon-rpc.publicnode.com:443'],
    restUrls: ['https://rizon-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/rizon',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  shentu: {
    chainId: 'shentu-2.2',
    chainName: 'Shentu',
    symbol: 'CTK',
    decimals: 6,
    bech32Prefix: 'shentu',
    rpcUrls: ['https://shentu-rpc.publicnode.com:443'],
    restUrls: ['https://shentu-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/shentu',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  sifchain: {
    chainId: 'sifchain-1',
    chainName: 'Sifchain',
    symbol: 'ROWAN',
    decimals: 18,
    bech32Prefix: 'sif',
    rpcUrls: ['https://sifchain-rpc.publicnode.com:443'],
    restUrls: ['https://sifchain-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/sifchain',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  sommelier: {
    chainId: 'sommelier-3',
    chainName: 'Sommelier',
    symbol: 'SOMM',
    decimals: 6,
    bech32Prefix: 'somm',
    rpcUrls: ['https://sommelier-rpc.publicnode.com:443'],
    restUrls: ['https://sommelier-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/sommelier',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  stafihub: {
    chainId: 'stafihub-1',
    chainName: 'stafihub',
    symbol: 'FIS',
    decimals: 12,
    bech32Prefix: 'stafi',
    rpcUrls: ['https://stafihub-rpc.publicnode.com:443'],
    restUrls: ['https://stafihub-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/stafihub',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  starname: {
    chainId: 'iov-mainnet-ibc',
    chainName: 'Starname',
    symbol: 'IOV',
    decimals: 6,
    bech32Prefix: 'star',
    rpcUrls: ['https://starname-rpc.publicnode.com:443'],
    restUrls: ['https://starname-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/starname',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  umee: {
    chainId: 'umee-1',
    chainName: 'Umee',
    symbol: 'UMEE',
    decimals: 6,
    bech32Prefix: 'umee',
    rpcUrls: ['https://umee-rpc.publicnode.com:443'],
    restUrls: ['https://umee-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/umee',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  comdex: {
    chainId: 'comdex-1',
    chainName: 'Comdex',
    symbol: 'CMDX',
    decimals: 6,
    bech32Prefix: 'comdex',
    rpcUrls: ['https://comdex-rpc.publicnode.com:443'],
    restUrls: ['https://comdex-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/comdex',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
  cheqd: {
    chainId: 'cheqd-mainnet-1',
    chainName: 'cheqd',
    symbol: 'CHEQ',
    decimals: 9,
    bech32Prefix: 'cheqd',
    rpcUrls: ['https://cheqd-rpc.publicnode.com:443'],
    restUrls: ['https://cheqd-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/cheqd',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: false,
    },
  },
  bitsong: {
    chainId: 'bitsong-2b',
    chainName: 'BitSong',
    symbol: 'BTSG',
    decimals: 6,
    bech32Prefix: 'bitsong',
    rpcUrls: ['https://bitsong-rpc.publicnode.com:443'],
    restUrls: ['https://bitsong-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/bitsong',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  assetmantle: {
    chainId: 'mantle-1',
    chainName: 'AssetMantle',
    symbol: 'MNTL',
    decimals: 6,
    bech32Prefix: 'mantle',
    rpcUrls: ['https://assetmantle-rpc.publicnode.com:443'],
    restUrls: ['https://assetmantle-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/assetmantle',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: true,
      smartContracts: false,
    },
  },
  echelon: {
    chainId: 'echelon_3000-3',
    chainName: 'Echelon',
    symbol: 'ECH',
    decimals: 18,
    bech32Prefix: 'echelon',
    rpcUrls: ['https://echelon-rpc.publicnode.com:443'],
    restUrls: ['https://echelon-rest.publicnode.com'],
    blockExplorerUrl: 'https://mintscan.io/echelon',
    features: {
      ibc: true,
      staking: true,
      governance: true,
      nft: false,
      smartContracts: true,
    },
  },
};

// ============================================================================
// Bech32 工具
// ============================================================================

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= GEN[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const expand: number[] = [];
  for (let i = 0; i < hrp.length; i++) {
    expand.push(hrp.charCodeAt(i) >> 5);
  }
  expand.push(0);
  for (let i = 0; i < hrp.length; i++) {
    expand.push(hrp.charCodeAt(i) & 31);
  }
  return expand;
}

function convertBits(data: Uint8Array, fromBits: number, toBits: number, pad: boolean = true): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  const maxv = (1 << toBits) - 1;

  for (let i = 0; i < data.length; i++) {
    acc = (acc << fromBits) | data[i];
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad && bits > 0) {
    result.push((acc << (toBits - bits)) & maxv);
  }

  return result;
}

function bech32Encode(hrp: string, data: Uint8Array): string {
  const values = convertBits(data, 8, 5);
  const expanded = [...bech32HrpExpand(hrp), ...values];
  const polymod = bech32Polymod([...expanded, 0, 0, 0, 0, 0, 0]) ^ 1;

  let checksum: number[] = [];
  for (let i = 0; i < 6; i++) {
    checksum.push((polymod >> (5 * (5 - i))) & 31);
  }

  const combined = [...values, ...checksum];
  return hrp + '1' + combined.map((v) => BECH32_CHARSET[v]).join('');
}

// ============================================================================
// 地址生成
// ============================================================================

/**
 * 从公钥生成 Cosmos 地址
 */
export function getCosmosAddress(publicKey: Uint8Array, prefix: string = 'cosmos'): string {
  const pubKeyHash = sha256ToRipemd160(publicKey);
  return bech32Encode(prefix, pubKeyHash);
}

function sha256ToRipemd160(data: Uint8Array): Uint8Array {
  const crypto = require('crypto');
  const sha = crypto.createHash('sha256').update(Buffer.from(data)).digest();
  return new Uint8Array(crypto.createHash('rmd160').update(sha).digest());
}

/**
 * 验证 Cosmos 地址
 */
export function isValidCosmosAddress(address: string, prefix?: string): boolean {
  try {
    if (prefix && !address.startsWith(prefix + '1')) return false;
    const parts = address.split('1');
    if (parts.length < 2) return false;
    const hrp = parts[0];
    if (!hrp || hrp.length < 1 || hrp.length > 83) return false;
    return address.length >= 8 + hrp.length + 1;
  } catch {
    return false;
  }
}

// ============================================================================
// Cosmos REST 客户端
// ============================================================================

export class CosmosClient {
  private chainKey: string;
  private config: CosmosChainConfig;
  private currentRpcIndex: number = 0;
  private currentRestIndex: number = 0;
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private cacheTTL: number = 10 * 1000;

  constructor(chainKey: string = 'cosmos') {
    this.chainKey = chainKey;
    this.config = COSMOS_CHAINS[chainKey] || COSMOS_CHAINS.cosmos;
  }

  getConfig(): CosmosChainConfig {
    return { ...this.config };
  }

  private async restRequest(path: string, method: string = 'GET', body?: any): Promise<any> {
    const cacheKey = `${method}:${path}`;
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.value;
      }
    }

    for (let i = 0; i < this.config.restUrls.length; i++) {
      try {
        const baseUrl = this.config.restUrls[(this.currentRestIndex + i) % this.config.restUrls.length];
        const url = `${baseUrl}/${path}`;

        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (method === 'GET') {
          this.cache.set(cacheKey, {
            value: data,
            expiresAt: Date.now() + this.cacheTTL,
          });
        }

        return data;
      } catch (error) {
        if (i < this.config.restUrls.length - 1) continue;
        throw error;
      }
    }
  }

  /**
   * 获取余额
   */
  async getBalance(address: string, denom?: string): Promise<CosmosBalance[]> {
    const path = denom
      ? `cosmos/bank/v1beta1/balances/${address}/by_denom?denom=${denom}`
      : `cosmos/bank/v1beta1/balances/${address}`;

    const result = await this.restRequest(path);

    if (denom) {
      return [result.balance];
    }

    return result.balances || [];
  }

  /**
   * 获取账户信息
   */
  async getAccount(address: string): Promise<CosmosAccount | null> {
    try {
      const result = await this.restRequest(`cosmos/auth/v1beta1/accounts/${address}`);
      const account = result.account;

      if (!account) return null;

      const baseAccount = account.base_account || account;
      return {
        address: baseAccount.address,
        pubkey: baseAccount.pub_key?.key || '',
        accountNumber: parseInt(baseAccount.account_number || '0'),
        sequence: parseInt(baseAccount.sequence || '0'),
        type: account['@type'] || '/cosmos.auth.v1beta1.BaseAccount',
      };
    } catch {
      return null;
    }
  }

  /**
   * 获取交易历史
   */
  async getTransactions(
    address: string,
    options: {
      page?: number;
      limit?: number;
      orderBy?: string;
    } = {}
  ): Promise<{ txs: CosmosTransaction[]; total: number }> {
    const { page = 1, limit = 20, orderBy = 'ORDER_BY_DESC' } = options;
    const result = await this.restRequest(
      `cosmos/tx/v1beta1/txs?events=transfer.recipient='${address}'&pagination.offset=${(page - 1) * limit}&pagination.limit=${limit}&order_by=${orderBy}`
    );

    return {
      txs: (result.tx_responses || []).map((tx: any) => ({
        hash: tx.txhash,
        height: tx.height,
        timestamp: tx.timestamp,
        code: tx.code,
        gasWanted: tx.gas_wanted,
        gasUsed: tx.gas_used,
        fee: tx.tx?.auth_info?.fee || {},
        messages: tx.tx?.body?.messages || [],
        memo: tx.tx?.body?.memo,
        status: tx.code === 0 ? 'confirmed' : 'failed',
      })),
      total: parseInt(result.pagination?.total || '0'),
    };
  }

  /**
   * 获取质押信息
   */
  async getDelegations(delegatorAddress: string): Promise<CosmosStakeInfo[]> {
    const result = await this.restRequest(
      `cosmos/staking/v1beta1/delegations/${delegatorAddress}`
    );

    return (result.delegation_responses || []).map((d: any) => ({
      delegatorAddress: d.delegation?.delegator_address,
      validatorAddress: d.delegation?.validator_address,
      shares: d.delegation?.shares || '0',
      balance: d.balance?.amount || '0',
      status: 'bonded',
    }));
  }

  /**
   * 获取解绑中质押
   */
  async getUnbondingDelegations(delegatorAddress: string): Promise<CosmosStakeInfo[]> {
    const result = await this.restRequest(
      `cosmos/staking/v1beta1/delegators/${delegatorAddress}/unbonding_delegations`
    );

    const delegations: CosmosStakeInfo[] = [];
    for (const u of result.unbonding_responses || []) {
      for (const entry of u.entries || []) {
        delegations.push({
          delegatorAddress: u.delegator_address,
          validatorAddress: u.validator_address,
          shares: entry.balance || '0',
          balance: entry.balance || '0',
          status: 'unbonding',
          completionTime: entry.completion_time,
        });
      }
    }

    return delegations;
  }

  /**
   * 获取验证人列表
   */
  async getValidators(status: string = 'BOND_STATUS_BONDED'): Promise<ValidatorInfo[]> {
    const result = await this.restRequest(
      `cosmos/staking/v1beta1/validators?status=${status}&pagination.limit=100`
    );

    return (result.validators || []).map((v: any) => ({
      operatorAddress: v.operator_address,
      consensusPubkey: v.consensus_pubkey?.key || '',
      jailed: v.jailed,
      status: v.status,
      tokens: v.tokens || '0',
      delegatorShares: v.delegator_shares || '0',
      description: {
        moniker: v.description?.moniker || '',
        identity: v.description?.identity || '',
        website: v.description?.website || '',
        details: v.description?.details || '',
      },
      commission: {
        commission_rates: {
          rate: v.commission?.commission_rates?.rate || '0',
          max_rate: v.commission?.commission_rates?.max_rate || '0',
          max_change_rate: v.commission?.commission_rates?.max_change_rate || '0',
        },
        update_time: v.commission?.update_time || '',
      },
      votingPower: '0',
    }));
  }

  /**
   * 获取治理提案
   */
  async getProposals(status?: string): Promise<ProposalInfo[]> {
    const path = status
      ? `cosmos/gov/v1beta1/proposals?proposal_status=${status}`
      : 'cosmos/gov/v1beta1/proposals';

    const result = await this.restRequest(path);

    return (result.proposals || []).map((p: any) => ({
      id: p.proposal_id,
      title: p.content?.title || '',
      description: p.content?.description || '',
      status: p.status,
      submitTime: p.submit_time,
      depositEndTime: p.deposit_end_time,
      votingStartTime: p.voting_start_time,
      votingEndTime: p.voting_end_time,
      totalDeposit: p.total_deposit || [],
      finalTallyResult: p.final_tally_result
        ? {
            yes: p.final_tally_result.yes,
            abstain: p.final_tally_result.abstain,
            no: p.final_tally_result.no,
            noWithVeto: p.final_tally_result.no_with_veto,
          }
        : undefined,
    }));
  }

  /**
   * 获取 IBC 通道
   */
  async getIBCChannels(): Promise<IBCChainInfo[]> {
    const result = await this.restRequest('ibc/core/channel/v1/channels?pagination.limit=100');

    return (result.channels || []).map((c: any) => ({
      channelId: c.channel_id,
      counterpartyChainId: c.counterparty?.channel_id || '',
      counterpartyChannelId: c.counterparty?.port_id || '',
      connectionId: c.connection_hops?.[0] || '',
      state: c.state,
      ordering: c.ordering,
      version: c.version,
      portId: c.port_id,
      chainId: this.config.chainId,
    }));
  }

  /**
   * 广播交易
   */
  async broadcastTransaction(txBytes: string, mode: string = 'BROADCAST_MODE_SYNC'): Promise<{
    txhash: string;
    code?: number;
    raw_log?: string;
  }> {
    const result = await this.restRequest('cosmos/tx/v1beta1/txs', 'POST', {
      tx_bytes: txBytes,
      mode,
    });

    return {
      txhash: result.tx_response?.txhash || '',
      code: result.tx_response?.code,
      raw_log: result.tx_response?.raw_log,
    };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 切换 RPC
   */
  switchRpc(): string {
    this.currentRestIndex = (this.currentRestIndex + 1) % this.config.restUrls.length;
    return this.config.restUrls[this.currentRestIndex];
  }
}

// ============================================================================
// Cosmos 钱包管理器
// ============================================================================

export class CosmosWalletManager {
  private client: CosmosClient;
  private chainKey: string;

  constructor(chainKey: string = 'cosmos') {
    this.chainKey = chainKey;
    this.client = new CosmosClient(chainKey);
  }

  getClient(): CosmosClient {
    return this.client;
  }

  /**
   * 生成地址
   */
  generateAddress(publicKey: Uint8Array): string {
    const config = this.client.getConfig();
    return getCosmosAddress(publicKey, config.bech32Prefix);
  }

  /**
   * 获取余额
   */
  async getBalance(address: string): Promise<CosmosBalance[]> {
    return this.client.getBalance(address);
  }

  /**
   * 获取质押总额
   */
  async getTotalStaked(address: string): Promise<string> {
    const delegations = await this.client.getDelegations(address);
    const config = this.client.getConfig();
    const denom = `u${config.symbol.toLowerCase()}`;

    let total = 0;
    for (const d of delegations) {
      if (d.balance) {
        total += parseInt(d.balance);
      }
    }

    return total.toString();
  }

  /**
   * 获取交易历史
   */
  async getTransactionHistory(address: string, page: number = 1, limit: number = 20) {
    return this.client.getTransactions(address, { page, limit });
  }

  /**
   * 获取验证人列表
   */
  async getValidators(status?: string) {
    return this.client.getValidators(status);
  }

  /**
   * 获取治理提案
   */
  async getProposals(status?: string) {
    return this.client.getProposals(status);
  }
}

// ============================================================================
// 默认导出
// ============================================================================

export default {
  COSMOS_CHAINS,
  CosmosClient,
  CosmosWalletManager,
  getCosmosAddress,
  isValidCosmosAddress,
  bech32Encode,
};
