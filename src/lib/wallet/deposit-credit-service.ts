import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export type DepositStatus = 'pending' | 'confirming' | 'confirmed' | 'credited';

export class DepositCreditError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DepositCreditError';
  }
}

export interface CreateDepositAddressInput {
  userId: string;
  currency: string;
  chain?: string;
}

export interface IngestDepositInput {
  userId: string;
  currency: string;
  address: string;
  txHash: string;
  amount: string | number | Prisma.Decimal;
  chain?: string;
  confirmations?: number;
  blockNumber?: string | number;
  fee?: string | number | Prisma.Decimal;
  logIndex?: number;
  eventIndex?: number;
}

const EVM_CHAINS = new Set([
  'ETH',
  'ETHEREUM',
  'ERC20',
  'BSC',
  'BNB',
  'BEP20',
  'POLYGON',
  'MATIC',
  'ARBITRUM',
  'OPTIMISM',
  'BASE',
]);

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function normalizeCurrency(symbol: string): string {
  return String(symbol || '').trim().toUpperCase();
}

function normalizeChain(chain?: string): string {
  return String(chain || 'ethereum').trim().toUpperCase();
}

function toDecimal(value: string | number | Prisma.Decimal, fieldName: string): Prisma.Decimal {
  try {
    const decimal = new Prisma.Decimal(value);
    if (!decimal.isFinite() || decimal.lte(0)) {
      throw new Error('non-positive');
    }
    return decimal;
  } catch {
    throw new DepositCreditError('INVALID_AMOUNT', `${fieldName} must be a positive decimal`);
  }
}

function toFeeDecimal(value?: string | number | Prisma.Decimal): Prisma.Decimal {
  if (value === undefined || value === null || value === '') {
    return new Prisma.Decimal(0);
  }

  try {
    const decimal = new Prisma.Decimal(value);
    if (!decimal.isFinite() || decimal.lt(0)) {
      throw new Error('negative');
    }
    return decimal;
  } catch {
    throw new DepositCreditError('INVALID_FEE', 'fee must be a non-negative decimal');
  }
}

function confirmationStatus(confirmations: number, requiredConfirmations: number): DepositStatus {
  if (confirmations <= 0) return 'pending';
  if (confirmations < requiredConfirmations) return 'confirming';
  return 'confirmed';
}

function normalizeConfirmations(value?: number): number {
  const confirmations = Number(value || 0);
  if (!Number.isFinite(confirmations)) {
    throw new DepositCreditError('INVALID_CONFIRMATIONS', 'confirmations must be a finite number');
  }
  return Math.max(0, Math.floor(confirmations));
}

function buildDepositNo(input: Pick<IngestDepositInput, 'txHash' | 'logIndex' | 'eventIndex'>): string {
  const txHash = String(input.txHash || '').trim();
  if (!txHash) {
    throw new DepositCreditError('TX_HASH_REQUIRED', 'txHash is required');
  }

  const index = input.logIndex ?? input.eventIndex;
  return index === undefined || index === null ? txHash : `${txHash}:${index}`;
}

function deterministicAddress(userId: string, currency: string, chain: string): string {
  const seed = `${userId}:${currency}:${chain}:${process.env.WALLET_ADDRESS_SALT || 'zs-mvp-wallet'}`;
  const hex = createHash('sha256').update(seed).digest('hex');

  if (EVM_CHAINS.has(chain)) {
    return `0x${hex.slice(0, 40)}`;
  }

  if (chain === 'TRON' || chain === 'TRC20') {
    return `T${hex.slice(0, 33)}`;
  }

  if (chain === 'SOL' || chain === 'SOLANA') {
    let output = '';
    for (let index = 0; index < 44; index += 1) {
      const byte = Number.parseInt(hex.slice((index * 2) % hex.length, ((index * 2) % hex.length) + 2), 16);
      output += BASE58_ALPHABET[byte % BASE58_ALPHABET.length];
    }
    return output;
  }

  return `zs_${chain.toLowerCase()}_${currency.toLowerCase()}_${hex.slice(0, 32)}`;
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

export class DepositCreditService {
  async getOrCreateAddress(input: CreateDepositAddressInput) {
    const currencySymbol = normalizeCurrency(input.currency);
    if (!currencySymbol) {
      throw new DepositCreditError('CURRENCY_REQUIRED', 'Currency is required');
    }

    const walletCurrency = await prisma.walletCurrency.findUnique({ where: { symbol: currencySymbol } });
    if (!walletCurrency || !walletCurrency.isActive || !walletCurrency.depositEnabled) {
      throw new DepositCreditError('DEPOSIT_DISABLED', 'Deposit is not available for this currency');
    }

    const chain = normalizeChain(input.chain || walletCurrency.blockchain);
    const existing = await prisma.walletAddress.findFirst({
      where: {
        userId: input.userId,
        currencyId: walletCurrency.id,
        tag: chain,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return { address: existing, currency: walletCurrency, chain, reused: true };
    }

    const addressValue = deterministicAddress(input.userId, walletCurrency.symbol, chain);

    try {
      const address = await prisma.walletAddress.create({
        data: {
          userId: input.userId,
          currency: { connect: { id: walletCurrency.id } },
          address: addressValue,
          tag: chain,
          status: 'active',
        },
      });

      return { address, currency: walletCurrency, chain, reused: false };
    } catch (error) {
      if (!isUniqueError(error)) {
        throw error;
      }

      const address = await prisma.walletAddress.findUnique({ where: { address: addressValue } });
      if (!address || address.userId !== input.userId || address.currencyId !== walletCurrency.id) {
        throw new DepositCreditError('ADDRESS_COLLISION', 'Generated deposit address is already assigned');
      }

      return { address, currency: walletCurrency, chain, reused: true };
    }
  }

  async ingestDeposit(input: IngestDepositInput) {
    const currencySymbol = normalizeCurrency(input.currency);
    const amount = toDecimal(input.amount, 'amount');
    const fee = toFeeDecimal(input.fee);
    const confirmations = normalizeConfirmations(input.confirmations);
    const depositNo = buildDepositNo(input);

    const walletCurrency = await prisma.walletCurrency.findUnique({ where: { symbol: currencySymbol } });
    if (!walletCurrency || !walletCurrency.isActive || !walletCurrency.depositEnabled) {
      throw new DepositCreditError('DEPOSIT_DISABLED', 'Deposit is not available for this currency');
    }

    if (amount.lt(walletCurrency.minDepositAmount)) {
      throw new DepositCreditError('AMOUNT_BELOW_MINIMUM', 'Deposit amount is below minimum');
    }

    const address = await prisma.walletAddress.findUnique({ where: { address: String(input.address || '').trim() } });
    if (!address || address.userId !== input.userId || address.currencyId !== walletCurrency.id || address.status !== 'active') {
      throw new DepositCreditError('ADDRESS_NOT_FOUND', 'Deposit address does not belong to this user and currency');
    }

    const requiredConfirmations = Math.max(1, walletCurrency.confirmationCount || 1);
    const nextStatus = confirmationStatus(confirmations, requiredConfirmations);
    const existing = await prisma.walletDeposit.findUnique({ where: { txHash: depositNo } });

    if (existing?.status === 'credited') {
      const balance = await prisma.tradeBalance.findFirst({
        where: { userId: existing.userId, currency: walletCurrency.symbol },
      });
      return { deposit: existing, balance, credited: false, depositNo };
    }

    if (existing) {
      if (
        existing.userId !== input.userId ||
        existing.currencyId !== walletCurrency.id ||
        existing.addressId !== address.id ||
        !existing.amount.equals(amount)
      ) {
        throw new DepositCreditError('DUPLICATE_TX_MISMATCH', 'Deposit transaction already exists with different data');
      }

      await prisma.walletDeposit.update({
        where: { id: existing.id },
        data: {
          confirmations: Math.max(existing.confirmations, confirmations),
          status: confirmationStatus(Math.max(existing.confirmations, confirmations), existing.requiredConfirmations),
          blockNumber: input.blockNumber === undefined ? existing.blockNumber : String(input.blockNumber),
        },
      });
    } else {
      await prisma.walletDeposit.create({
        data: {
          userId: input.userId,
          currency: { connect: { id: walletCurrency.id } },
          address: { connect: { id: address.id } },
          txHash: depositNo,
          amount,
          fee,
          status: nextStatus,
          confirmations,
          requiredConfirmations,
          blockNumber: input.blockNumber === undefined ? undefined : String(input.blockNumber),
          confirmedAt: nextStatus === 'confirmed' ? new Date() : undefined,
        },
      });
    }

    const latest = await prisma.walletDeposit.findUnique({ where: { txHash: depositNo } });
    if (!latest) {
      throw new DepositCreditError('DEPOSIT_NOT_FOUND', 'Deposit was not persisted');
    }

    if (latest.status === 'confirmed') {
      return this.creditDeposit(latest.id, depositNo);
    }

    const balance = await prisma.tradeBalance.findFirst({
      where: { userId: input.userId, currency: walletCurrency.symbol },
    });
    return { deposit: latest, balance, credited: false, depositNo };
  }

  async creditDeposit(depositId: string, depositNo?: string) {
    return prisma.$transaction(async (tx) => {
      const deposit = await tx.walletDeposit.findUnique({
        where: { id: depositId },
        include: { currency: true },
      });

      if (!deposit) {
        throw new DepositCreditError('DEPOSIT_NOT_FOUND', 'Deposit not found');
      }

      if (deposit.status === 'credited') {
        const balance = await tx.tradeBalance.findFirst({
          where: { userId: deposit.userId, currency: deposit.currency.symbol },
        });
        return { deposit, balance, credited: false, depositNo: depositNo || deposit.txHash };
      }

      if (deposit.status !== 'confirmed' || deposit.confirmations < deposit.requiredConfirmations) {
        throw new DepositCreditError('DEPOSIT_NOT_CONFIRMED', 'Only confirmed deposits can be credited');
      }

      const existingBalance = await tx.tradeBalance.findFirst({
        where: { userId: deposit.userId, currency: deposit.currency.symbol },
      });

      const balance = existingBalance
        ? await tx.tradeBalance.update({
            where: { id: existingBalance.id },
            data: {
              balance: { increment: deposit.amount },
              available: { increment: deposit.amount },
            },
          })
        : await tx.tradeBalance.create({
            data: {
              userId: deposit.userId,
              currency: deposit.currency.symbol,
              balance: deposit.amount,
              available: deposit.amount,
              frozen: new Prisma.Decimal(0),
              locked: new Prisma.Decimal(0),
            },
          });

      await tx.tradeTransaction.create({
        data: {
          userId: deposit.userId,
          type: 'deposit',
          currency: deposit.currency.symbol,
          amount: deposit.amount,
          balance: balance.balance,
          description: `Wallet deposit ${deposit.txHash}`,
          referenceId: deposit.id,
          referenceType: 'wallet_deposit',
        },
      });

      const creditedDeposit = await tx.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: 'credited',
          confirmedAt: deposit.confirmedAt || new Date(),
        },
        include: { currency: true },
      });

      return { deposit: creditedDeposit, balance, credited: true, depositNo: depositNo || deposit.txHash };
    });
  }
}

export const depositCreditService = new DepositCreditService();

export default depositCreditService;
