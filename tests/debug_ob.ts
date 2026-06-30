// Debug - just 1000 orders
import { performance } from 'perf_hooks';
import { OrderBook } from '../src/lib/matching/orderbook';
import type { Order } from '../src/types/models';
import { writeFileSync, appendFileSync } from 'fs';

const log = (msg: string) => {
  appendFileSync('d:/tmp/debug.log', msg + '\n');
};
writeFileSync('d:/tmp/debug.log', '');

function mkOrder(over: Partial<Order>): Order {
  return {
    id: over.id ?? 'o_' + Math.random().toString(36).slice(2),
    userId: over.userId ?? 'u',
    symbol: 'BTC/USDT',
    side: over.side ?? 'buy',
    type: 'limit',
    status: 'new',
    timeInForce: 'GTC',
    price: over.price ?? '30000',
    quantity: over.quantity ?? '0.1',
    executedQty: '0',
    remainingQty: over.quantity ?? '0.1',
    cummulativeQuoteQty: '0',
    avgPrice: '0',
    fee: '0',
    feeAsset: 'USDT',
    market: 'spot',
    source: 'web',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Order;
}

log('Starting test');
const ob = new OrderBook('BTC/USDT');
log('OrderBook created');
const t0 = performance.now();
for (let i = 0; i < 1000; i++) {
  ob.addOrder(mkOrder({ id: 'b' + i, userId: 'm' + (i % 10), side: 'buy', price: String(29000 + (i % 100)), quantity: '0.1' }));
  if (i % 200 === 0) log(`Inserted ${i} orders`);
}
const tIns = performance.now() - t0;
log(`Insert took ${tIns.toFixed(2)}ms, ob.size()=${ob.size()}`);

log('About to add taker sell at 28999');
try {
  const t1 = performance.now();
  const res = ob.addOrder(mkOrder({ id: 't', userId: 'taker', side: 'sell', price: '28999', quantity: '0.05' }));
  const dt = performance.now() - t1;
  log(`Match took ${dt.toFixed(2)}ms, filled=${res.takerFilled}, results=${res.results.length}`);
} catch (e) {
  log('ERROR: ' + (e as Error).message + '\n' + (e as Error).stack);
}

log('Done');
process.exit(0);
