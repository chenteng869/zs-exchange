import { vi } from 'vitest';

const mockRpcResponses: Record<string, any> = {
  getSlot: 200000000,
  getBalance: { value: 1000000000 },
  getAccountInfo: {
    context: { slot: 200000000 },
    value: {
      lamports: 1000000000,
      owner: '11111111111111111111111111111111',
      executable: false,
      data: [],
    },
  },
  getBlock: {
    slot: 123456789,
    blockhash: 'abc123',
    previousBlockhash: 'def456',
    parentSlot: 123456788,
    blockTime: 1690000000,
    transactions: [],
    rewards: [],
  },
  getTokenAccountsByOwner: {
    context: { slot: 200000000 },
    value: [],
  },
  getTransaction: {
    slot: 123456789,
    transaction: {
      message: {
        accountKeys: ['5vPDcfdUgNGdpZFY8R9wAfcUcNxL3UjY9zQ5VvRzXxwz', '11111111111111111111111111111111'],
        recentBlockhash: 'abc123',
        instructions: [],
      },
      signatures: ['test-signature'],
    },
    meta: {
      fee: 5000,
      err: null,
    },
  },
  getLatestBlockhash: {
    context: { slot: 200000000 },
    value: {
      blockhash: 'abc123',
      lastValidBlockHeight: 200000015,
    },
  },
  getFeeForMessage: {
    context: { slot: 200000000 },
    value: 5000,
  },
  getSignatureStatuses: {
    context: { slot: 200000000 },
    value: [{ confirmationStatus: 'confirmed' }],
  },
  simulateTransaction: {
    context: { slot: 200000000 },
    value: {
      err: null,
      logs: [],
      unitsConsumed: 1000,
    },
  },
};

export function createSolanaMock() {
  const mockRequest = vi.fn(async (method: string, params: any[]) => {
    const response = mockRpcResponses[method];
    if (response !== undefined) {
      return response;
    }
    throw new Error(`Mock not implemented for method: ${method}`);
  });

  return {
    request: mockRequest,
    getMock: () => mockRequest,
  };
}

export function setupSolanaMock() {
  vi.mock('../../chains/solana-adapter', () => {
    const original = vi.importActual('../../chains/solana-adapter');
    return {
      ...original,
      SolanaAdapter: vi.fn().mockImplementation(() => {
        const mock = createSolanaMock();
        return {
          getSupportedChains: vi.fn().mockReturnValue(['solana', 'mainnet', 'devnet', 'testnet']),
          getChainInfo: vi.fn().mockReturnValue({
            name: 'Solana',
            symbol: 'SOL',
            chainId: 'mainnet-beta',
          }),
          getBlockNumber: vi.fn().mockResolvedValue(200000000),
          getBlock: vi.fn().mockResolvedValue({
            slot: 123456789,
            blockhash: 'abc123',
          }),
          getBalance: vi.fn().mockResolvedValue('1000000000'),
          getTokenBalance: vi.fn().mockResolvedValue('0'),
          getTransaction: vi.fn().mockResolvedValue({
            slot: 123456789,
            transaction: { message: {} },
            meta: { fee: 5000 },
          }),
          getLatestBlockhash: vi.fn().mockResolvedValue({
            blockhash: 'abc123',
            lastValidBlockHeight: 200000015,
          }),
          getFeeForMessage: vi.fn().mockResolvedValue(5000),
          sendRawTransaction: vi.fn().mockResolvedValue({ txHash: 'test-tx-hash' }),
          broadcastTransaction: vi.fn().mockResolvedValue('test-tx-id'),
          isValidAddress: vi.fn().mockImplementation((address: string) => {
            return address.length >= 32 && address.length <= 44;
          }),
          getAccountInfo: vi.fn().mockResolvedValue({
            value: { lamports: 1000000000 },
          }),
          getTokenAccounts: vi.fn().mockResolvedValue([]),
          findProgramAddress: vi.fn().mockReturnValue({
            address: 'test-pda-address',
            nonce: 0,
          }),
          simulateTransaction: vi.fn().mockResolvedValue({
            success: true,
            err: null,
            logs: [],
            unitsConsumed: 1000,
          }),
          getNonce: vi.fn().mockResolvedValue(0),
          clearCache: vi.fn(),
          checkHealth: vi.fn().mockResolvedValue({
            healthy: true,
            reachable: true,
          }),
          request: mockRequest,
        };
      }),
    };
  });
}

const mockRequest = vi.fn(async (method: string) => {
  return mockRpcResponses[method];
});