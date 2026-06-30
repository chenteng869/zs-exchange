const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');

function loadEnvFile(fileName, override = false) {
  const filePath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local', true);

const prisma = new PrismaClient();
const base = process.env.HEALTH_BASE_URL || 'http://localhost:3200';
const stamp = Date.now();
const password = 'HealthCheck123!';
const priceOffset = (stamp % 100000) / 100;
const prices = {
  bid: (10000 + priceOffset).toFixed(2),
  ask: (900000 + priceOffset).toFixed(2),
  taker: (900001 + priceOffset).toFixed(2),
};

async function api(path, options = {}) {
  const res = await fetch(base + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }

  if (!res.ok || body.success === false) {
    throw new Error(`${options.method || 'GET'} ${path} failed ${res.status}: ${JSON.stringify(body)}`);
  }

  return body.data;
}

async function register(role) {
  return api('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: `health_${role}_${stamp}`,
      email: `health_${role}_${stamp}@example.com`,
      password,
    }),
  });
}

async function authed(path, token, body, method = 'POST') {
  return api(path, {
    method,
    headers: { authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function authedGet(path, token) {
  return api(path, {
    headers: { authorization: `Bearer ${token}` },
  });
}

async function setBalance(userId, currency, amount) {
  const data = {
    userId,
    currency,
    balance: amount,
    available: amount,
    frozen: 0,
    locked: 0,
  };
  const existing = await prisma.tradeBalance.findFirst({ where: { userId, currency } });

  if (existing) {
    return prisma.tradeBalance.update({ where: { id: existing.id }, data });
  }

  return prisma.tradeBalance.create({ data });
}

async function ensureWalletCurrency(symbol, data) {
  return prisma.walletCurrency.upsert({
    where: { symbol },
    update: {
      isActive: true,
      depositEnabled: true,
      confirmationCount: data.confirmationCount,
    },
    create: {
      symbol,
      name: data.name,
      decimals: data.decimals,
      blockchain: data.blockchain,
      isActive: true,
      depositEnabled: true,
      withdrawalEnabled: true,
      minDepositAmount: 0,
      minWithdrawalAmount: 0,
      withdrawalFee: 0,
      withdrawalFeeRate: 0,
      confirmationCount: data.confirmationCount,
    },
  });
}

async function ensureTradePair(symbol, data) {
  return prisma.tradePair.upsert({
    where: { symbol },
    update: {
      status: 'active',
      baseCurrency: data.baseCurrency,
      quoteCurrency: data.quoteCurrency,
      minOrderAmount: data.minOrderAmount,
      minOrderValue: data.minOrderValue,
    },
    create: {
      symbol,
      baseCurrency: data.baseCurrency,
      quoteCurrency: data.quoteCurrency,
      status: 'active',
      basePrecision: data.basePrecision,
      quotePrecision: data.quotePrecision,
      minOrderAmount: data.minOrderAmount,
      minOrderValue: data.minOrderValue,
      makerFeeRate: data.makerFeeRate,
      takerFeeRate: data.takerFeeRate,
      priceTickSize: data.priceTickSize,
      amountTickSize: data.amountTickSize,
    },
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeAmount(value) {
  return Number(value ?? 0).toString();
}

function compactBalances(balances) {
  return balances.map((balance) => ({
    currency: balance.currency,
    balance: String(balance.balance),
    available: String(balance.available),
    frozen: String(balance.frozen),
  }));
}

function findLevel(levels, price) {
  return levels.find(([levelPrice]) => levelPrice === price);
}

function hasLevelAmountAtLeast(levels, price, amount) {
  const level = findLevel(levels, price);
  return Number(level?.[1] || 0) >= amount;
}

async function cleanupStaleHealthOrders() {
  const healthUsers = await prisma.coreUser.findMany({
    where: { username: { startsWith: 'health_' } },
    select: { id: true },
  });
  const userIds = healthUsers.map((user) => user.id);
  if (userIds.length === 0) return { cancelledOrders: 0 };

  const activeOrders = await prisma.tradeOrder.findMany({
    where: {
      userId: { in: userIds },
      status: { in: ['pending', 'open', 'partial'] },
      remainingAmount: { gt: 0 },
    },
  });

  for (const order of activeOrders) {
    await prisma.$transaction(async (tx) => {
      const pair = await tx.tradePair.findUnique({ where: { symbol: order.symbol } });
      if (pair) {
        const currency = order.side === 'buy' ? pair.quoteCurrency : pair.baseCurrency;
        const remainingAmount = Number(order.remainingAmount.toString());
        const price = Number(order.price?.toString() || 0);
        const unfreezeAmount = order.side === 'buy' ? remainingAmount * price : remainingAmount;
        const balance = await tx.tradeBalance.findFirst({ where: { userId: order.userId, currency } });
        const frozen = Number(balance?.frozen?.toString() || 0);
        const amount = Math.min(unfreezeAmount, frozen);

        if (balance && amount > 0) {
          await tx.tradeBalance.update({
            where: { id: balance.id },
            data: {
              available: { increment: amount },
              frozen: { decrement: amount },
            },
          });
        }
      }

      await tx.tradeOrder.update({
        where: { id: order.id },
        data: { status: 'cancelled', closedAt: new Date() },
      });
    });
  }

  return { cancelledOrders: activeOrders.length };
}

async function main() {
  const cleanup = await cleanupStaleHealthOrders();
  await ensureWalletCurrency('USDT', {
    name: 'Tether USD',
    decimals: 6,
    blockchain: 'ethereum',
    confirmationCount: 1,
  });
  await ensureTradePair('BTC/USDT', {
    baseCurrency: 'BTC',
    quoteCurrency: 'USDT',
    basePrecision: 8,
    quotePrecision: 2,
    minOrderAmount: 0.000001,
    minOrderValue: 1,
    makerFeeRate: 0.001,
    takerFeeRate: 0.001,
    priceTickSize: 0.01,
    amountTickSize: 0.000001,
  });

  const seller = await register('seller');
  const makerBuyer = await register('makerbuyer');
  const takerBuyer = await register('takerbuyer');
  const depositUser = await register('deposituser');

  await setBalance(seller.user.id, 'BTC', 0.01);
  await setBalance(seller.user.id, 'USDT', 0);
  await setBalance(makerBuyer.user.id, 'USDT', 5000);
  await setBalance(makerBuyer.user.id, 'BTC', 0);
  await setBalance(takerBuyer.user.id, 'USDT', 5000);
  await setBalance(takerBuyer.user.id, 'BTC', 0);

  const sellOrder = await authed('/api/v1/trade/orders', seller.accessToken, {
    symbol: 'BTCUSDT',
    side: 'sell',
    type: 'limit',
    price: prices.ask,
    amount: '0.003',
  });

  const bidOrder = await authed('/api/v1/trade/orders', makerBuyer.accessToken, {
    symbol: 'BTC-USDT',
    side: 'buy',
    type: 'limit',
    price: prices.bid,
    amount: '0.002',
  });

  const takerOrder = await authed('/api/v1/trade/orders', takerBuyer.accessToken, {
    symbol: 'BTC_USDT',
    side: 'buy',
    type: 'limit',
    price: prices.taker,
    amount: '0.001',
  });

  const depth = await api('/api/v1/market/depth/BTCUSDT?limit=100&source=spot');
  const sellAfter = await prisma.tradeOrder.findUnique({ where: { id: sellOrder.id } });
  const cancel = await authed('/api/v1/trade/orders', seller.accessToken, { orderId: sellOrder.id }, 'DELETE');
  const cancelBid = await authed('/api/v1/trade/orders', makerBuyer.accessToken, { orderId: bidOrder.id }, 'DELETE');
  const sellerBalances = await authedGet('/api/v1/wallet/balances', seller.accessToken);
  const takerBalances = await authedGet('/api/v1/wallet/balances', takerBuyer.accessToken);
  const makerBalances = await authedGet('/api/v1/wallet/balances', makerBuyer.accessToken);
  const trades = await authedGet('/api/v1/trade/trades?symbol=BTCUSDT&page=1&pageSize=10', takerBuyer.accessToken);
  const depositAddress = await authed('/api/v1/wallet/deposits', depositUser.accessToken, {
    currency: 'USDT',
    chain: 'ethereum',
  });
  const pendingDeposit = await authed('/api/v1/wallet/deposits', depositUser.accessToken, {
    action: 'ingest',
    currency: 'USDT',
    chain: 'ethereum',
    address: depositAddress.address,
    txHash: `health_deposit_${stamp}`,
    amount: '12.5',
    confirmations: 0,
  });
  const creditedDeposit = await authed('/api/v1/wallet/deposits', depositUser.accessToken, {
    action: 'ingest',
    currency: 'USDT',
    chain: 'ethereum',
    address: depositAddress.address,
    txHash: `health_deposit_${stamp}`,
    amount: '12.5',
    confirmations: 1,
  });
  const replayDeposit = await authed('/api/v1/wallet/deposits', depositUser.accessToken, {
    action: 'ingest',
    currency: 'USDT',
    chain: 'ethereum',
    address: depositAddress.address,
    txHash: `health_deposit_${stamp}`,
    amount: '12.5',
    confirmations: 1,
  });
  const depositBalances = await authedGet('/api/v1/wallet/balances', depositUser.accessToken);
  const depositBalance = depositBalances.find((balance) => balance.currency === 'USDT');
  const transferOut = await authed('/api/v1/wallet/transfers', depositUser.accessToken, {
    fromAccount: 'spot',
    toAccount: 'fund',
    currency: 'USDT',
    amount: '2.5',
  });
  const transferBack = await authed('/api/v1/wallet/transfers', depositUser.accessToken, {
    fromAccount: 'fund',
    toAccount: 'spot',
    currency: 'USDT',
    amount: '2.5',
  });
  const transferOverview = await authedGet('/api/v1/wallet/transfers?currency=USDT&page=1&pageSize=10', depositUser.accessToken);
  const transferBalances = await authedGet('/api/v1/wallet/balances', depositUser.accessToken);
  const transferBalance = transferBalances.find((balance) => balance.currency === 'USDT');
  const bidLevel = findLevel(depth.bids, prices.bid) || null;
  const askLevelBeforeCancel = findLevel(depth.asks, prices.ask) || null;
  const bidLevelFound = hasLevelAmountAtLeast(depth.bids, prices.bid, 0.002);
  const askLevelFoundBeforeCancel = hasLevelAmountAtLeast(depth.asks, prices.ask, 0.002);

  assert(bidLevelFound, `Depth should include resting bid ${prices.bid} for at least 0.002 BTC`);
  assert(askLevelFoundBeforeCancel, `Depth should include resting ask ${prices.ask} for at least 0.002 BTC`);
  assert(pendingDeposit.deposit.status === 'pending', 'Deposit should start as pending before confirmations');
  assert(creditedDeposit.deposit.status === 'credited', 'Deposit should be credited after required confirmations');
  assert(replayDeposit.deposit.status === 'credited', 'Replay should return the credited deposit');
  assert(String(depositBalance?.available) === '12.5', 'Deposit replay must not credit balance twice');
  assert(transferOut.status === 'completed', 'Spot to fund transfer should complete');
  assert(normalizeAmount(transferOut.accountBalances?.spot) === '10', 'Spot balance should decrease after transfer out');
  assert(normalizeAmount(transferOut.accountBalances?.fund) === '2.5', 'Fund balance should increase after transfer out');
  assert(transferBack.status === 'completed', 'Fund to spot transfer should complete');
  assert(normalizeAmount(transferBack.accountBalances?.spot) === '12.5', 'Spot balance should be restored after transfer back');
  assert(normalizeAmount(transferBack.accountBalances?.fund) === '0', 'Fund balance should return to zero after transfer back');
  assert(normalizeAmount(transferBalance?.available) === '12.5', 'Wallet transfer must preserve final spot balance');
  assert(transferOverview.total >= 2, 'Wallet transfer history should include the completed transfer pair');

  const summary = {
    base,
    cleanup,
    users: {
      seller: seller.user.username,
      makerBuyer: makerBuyer.user.username,
      takerBuyer: takerBuyer.user.username,
      depositUser: depositUser.user.username,
    },
    orders: {
      sellInitial: {
        id: sellOrder.id,
        status: sellOrder.status,
        remainingAmount: String(sellOrder.remainingAmount),
        matched: sellOrder.matched,
      },
      restingBid: {
        id: bidOrder.id,
        status: bidOrder.status,
        remainingAmount: String(bidOrder.remainingAmount),
        matched: bidOrder.matched,
      },
      takerBuy: {
        id: takerOrder.id,
        status: takerOrder.status,
        remainingAmount: String(takerOrder.remainingAmount),
        executedValue: String(takerOrder.executedValue),
        tradeRows: takerOrder.trades.length,
        matched: takerOrder.matched,
      },
      sellAfterFill: {
        status: sellAfter?.status,
        remainingAmount: String(sellAfter?.remainingAmount),
        executedValue: String(sellAfter?.executedValue),
      },
      cancel: {
        status: cancel.status,
        remainingAmount: String(cancel.remainingAmount),
      },
      cancelRestingBid: {
        status: cancelBid.status,
        remainingAmount: String(cancelBid.remainingAmount),
      },
    },
    depthChecks: {
      symbol: depth.symbol,
      bidLevel,
      askLevelBeforeCancel,
      bidLevelFound,
      askLevelFoundBeforeCancel,
    },
    balances: {
      seller: compactBalances(sellerBalances),
      takerBuyer: compactBalances(takerBalances),
      makerBuyer: compactBalances(makerBalances),
    },
    tradesPage: {
      total: trades.total,
      returned: trades.list.length,
    },
    depositCredit: {
      address: depositAddress.address,
      pendingStatus: pendingDeposit.deposit.status,
      creditedStatus: creditedDeposit.deposit.status,
      replayCreditedAgain: replayDeposit.credited,
      balance: depositBalance ? {
        currency: depositBalance.currency,
        balance: String(depositBalance.balance),
        available: String(depositBalance.available),
      } : null,
    },
    walletTransfer: {
      out: {
        id: transferOut.id,
        status: transferOut.status,
        spot: transferOut.accountBalances?.spot,
        fund: transferOut.accountBalances?.fund,
      },
      back: {
        id: transferBack.id,
        status: transferBack.status,
        spot: transferBack.accountBalances?.spot,
        fund: transferBack.accountBalances?.fund,
      },
      historyReturned: transferOverview.list.length,
      finalSpotBalance: transferBalance ? {
        currency: transferBalance.currency,
        balance: String(transferBalance.balance),
        available: String(transferBalance.available),
      } : null,
    },
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
