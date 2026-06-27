import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { badRequest, success } from '@/lib/api/response';
import { requireAuth } from '@/lib/api/auth';
import prisma from '@/lib/prisma';
import { walletCurrencyRepository } from '@/repositories/wallet-currency.repository';

const ACCOUNTS = ['spot', 'fund', 'futures'] as const;
const TRANSFER_REFERENCE_PREFIX = 'wallet_transfer:';

type AccountKey = (typeof ACCOUNTS)[number];
type DbClient = typeof prisma | Prisma.TransactionClient;

class TransferRequestError extends Error {}

function isAccountKey(value: string): value is AccountKey {
  return ACCOUNTS.includes(value as AccountKey);
}

function normalizeAccount(value: unknown): AccountKey | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return isAccountKey(normalized) ? normalized : null;
}

function normalizeCurrency(value: unknown): string {
  return String(value ?? '').trim().toUpperCase();
}

function parsePositiveDecimal(value: unknown): Prisma.Decimal | null {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,18})?$/.test(text)) return null;

  const amount = new Prisma.Decimal(text);
  return amount.gt(0) ? amount : null;
}

function decimalToString(value: Prisma.Decimal | { toString(): string } | number | string): string {
  return new Prisma.Decimal(value.toString()).toString();
}

function buildReferenceType(fromAccount: AccountKey, toAccount: AccountKey): string {
  return `${TRANSFER_REFERENCE_PREFIX}${fromAccount}:${toAccount}`;
}

function parseReferenceType(referenceType: string | null | undefined) {
  const parts = String(referenceType ?? '').split(':');
  if (parts.length !== 3 || parts[0] !== 'wallet_transfer') return null;

  const [, fromAccount, toAccount] = parts;
  if (!isAccountKey(fromAccount) || !isAccountKey(toAccount)) return null;

  return { fromAccount, toAccount };
}

function publicBalance(balance: {
  id: string;
  userId: string;
  currency: string;
  balance: Prisma.Decimal;
  available: Prisma.Decimal;
  frozen: Prisma.Decimal;
  locked: Prisma.Decimal;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    id: balance.id,
    userId: balance.userId,
    currency: balance.currency,
    balance: decimalToString(balance.balance),
    available: decimalToString(balance.available),
    frozen: decimalToString(balance.frozen),
    locked: decimalToString(balance.locked),
    createdAt: balance.createdAt?.toISOString(),
    updatedAt: balance.updatedAt?.toISOString(),
  };
}

async function getSpotBalance(client: DbClient, userId: string, currency: string) {
  return client.tradeBalance.findFirst({
    where: { userId, currency },
  });
}

async function getAccountAvailable(
  client: DbClient,
  userId: string,
  account: AccountKey,
  currency: string,
): Promise<Prisma.Decimal> {
  if (account === 'spot') {
    const balance = await getSpotBalance(client, userId, currency);
    return new Prisma.Decimal(balance?.available?.toString() ?? '0');
  }

  const rows = await client.tradeTransaction.findMany({
    where: {
      userId,
      currency,
      type: 'TRANSFER_OUT',
      referenceType: { startsWith: TRANSFER_REFERENCE_PREFIX },
    },
    select: {
      amount: true,
      referenceType: true,
    },
  });

  return rows.reduce((total, row) => {
    const parsed = parseReferenceType(row.referenceType);
    if (!parsed) return total;

    const amount = new Prisma.Decimal(row.amount.toString()).abs();
    if (parsed.toAccount === account) return total.add(amount);
    if (parsed.fromAccount === account) return total.sub(amount);
    return total;
  }, new Prisma.Decimal(0));
}

async function getAccountBalances(client: DbClient, userId: string, currency: string) {
  const entries = await Promise.all(
    ACCOUNTS.map(async (account) => {
      const available = await getAccountAvailable(client, userId, account, currency);
      return [account, decimalToString(available)] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<AccountKey, string>;
}

async function decrementSpotBalance(
  client: Prisma.TransactionClient,
  userId: string,
  currency: string,
  amount: Prisma.Decimal,
) {
  const balance = await getSpotBalance(client, userId, currency);
  if (!balance) {
    throw new TransferRequestError('现货账户余额不足');
  }

  const available = new Prisma.Decimal(balance.available.toString());
  if (available.lt(amount)) {
    throw new TransferRequestError('现货账户可用余额不足');
  }

  return client.tradeBalance.update({
    where: { id: balance.id },
    data: {
      balance: { decrement: amount },
      available: { decrement: amount },
    },
  });
}

async function incrementSpotBalance(
  client: Prisma.TransactionClient,
  userId: string,
  currency: string,
  amount: Prisma.Decimal,
) {
  const balance = await getSpotBalance(client, userId, currency);

  if (balance) {
    return client.tradeBalance.update({
      where: { id: balance.id },
      data: {
        balance: { increment: amount },
        available: { increment: amount },
      },
    });
  }

  return client.tradeBalance.create({
    data: {
      userId,
      currency,
      balance: amount,
      available: amount,
      frozen: 0,
      locked: 0,
    },
  });
}

export async function GET(req: NextRequest) {
  return requireAuth(req, async (ctx) => {
    const url = new URL(req.url);
    const currency = normalizeCurrency(url.searchParams.get('currency') || 'USDT');
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 20)));
    const skip = (page - 1) * pageSize;

    const [accountBalances, rows, total] = await Promise.all([
      getAccountBalances(prisma, ctx.userId, currency),
      prisma.tradeTransaction.findMany({
        where: {
          userId: ctx.userId,
          currency,
          type: 'TRANSFER_OUT',
          referenceType: { startsWith: TRANSFER_REFERENCE_PREFIX },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.tradeTransaction.count({
        where: {
          userId: ctx.userId,
          currency,
          type: 'TRANSFER_OUT',
          referenceType: { startsWith: TRANSFER_REFERENCE_PREFIX },
        },
      }),
    ]);

    return success({
      accountBalances,
      list: rows.map((row) => {
        const parsed = parseReferenceType(row.referenceType);
        return {
          id: row.referenceId || row.id,
          ledgerId: row.id,
          fromAccount: parsed?.fromAccount || 'spot',
          toAccount: parsed?.toAccount || 'fund',
          currency: row.currency,
          amount: decimalToString(new Prisma.Decimal(row.amount.toString()).abs()),
          status: 'completed',
          createdAt: row.createdAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
    });
  });
}

export async function POST(req: NextRequest) {
  return requireAuth(req, async (ctx) => {
    const body = await req.json().catch(() => null);
    const fromAccount = normalizeAccount(body?.fromAccount);
    const toAccount = normalizeAccount(body?.toAccount);
    const currency = normalizeCurrency(body?.currency);
    const amount = parsePositiveDecimal(body?.amount);

    if (!fromAccount || !toAccount) {
      return badRequest('请选择有效的转出账户和转入账户');
    }

    if (fromAccount === toAccount) {
      return badRequest('转出账户和转入账户不能相同');
    }

    if (!currency) {
      return badRequest('请选择有效币种');
    }

    if (!amount) {
      return badRequest('请输入有效划转数量');
    }

    const walletCurrency = await walletCurrencyRepository.findBySymbol(currency);
    if (!walletCurrency || !walletCurrency.isActive) {
      return badRequest(`币种 ${currency} 暂不可用`);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const sourceBefore = await getAccountAvailable(tx, ctx.userId, fromAccount, currency);
        if (sourceBefore.lt(amount)) {
          throw new TransferRequestError('转出账户可用余额不足');
        }

        const targetBefore = await getAccountAvailable(tx, ctx.userId, toAccount, currency);
        let spotBalance = null;

        if (fromAccount === 'spot') {
          spotBalance = await decrementSpotBalance(tx, ctx.userId, currency, amount);
        }

        if (toAccount === 'spot') {
          spotBalance = await incrementSpotBalance(tx, ctx.userId, currency, amount);
        }

        const sourceAfter = sourceBefore.sub(amount);
        const targetAfter = targetBefore.add(amount);
        const now = new Date();
        const referenceType = buildReferenceType(fromAccount, toAccount);
        const transfer = await tx.walletInternalTransfer.create({
          data: {
            fromUserId: ctx.userId,
            toUserId: ctx.userId,
            currency,
            amount,
            status: 'completed',
            completedAt: now,
          },
        });
        const description = JSON.stringify({
          kind: 'wallet_account_transfer',
          fromAccount,
          toAccount,
          currency,
          transferId: transfer.id,
        });

        await tx.tradeTransaction.create({
          data: {
            userId: ctx.userId,
            type: 'TRANSFER_OUT',
            currency,
            amount: amount.neg(),
            balance: sourceAfter,
            description,
            referenceId: transfer.id,
            referenceType,
          },
        });

        await tx.tradeTransaction.create({
          data: {
            userId: ctx.userId,
            type: 'TRANSFER_IN',
            currency,
            amount,
            balance: targetAfter,
            description,
            referenceId: transfer.id,
            referenceType,
          },
        });

        return {
          transfer,
          sourceAfter,
          targetAfter,
          spotBalance,
        };
      });

      const accountBalances = {
        ...(await getAccountBalances(prisma, ctx.userId, currency)),
        [fromAccount]: decimalToString(result.sourceAfter),
        [toAccount]: decimalToString(result.targetAfter),
      };

      return success(
        {
          id: result.transfer.id,
          fromAccount,
          toAccount,
          currency,
          amount: decimalToString(result.transfer.amount),
          status: result.transfer.status,
          createdAt: result.transfer.createdAt.toISOString(),
          completedAt: result.transfer.completedAt?.toISOString() ?? null,
          accountBalances,
          spotBalance: result.spotBalance ? publicBalance(result.spotBalance) : null,
        },
        201,
      );
    } catch (e) {
      if (e instanceof TransferRequestError) {
        return badRequest(e.message);
      }
      throw e;
    }
  });
}
