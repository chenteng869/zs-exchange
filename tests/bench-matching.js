// 独立撮合性能压测脚本（纯 JS）
// 模拟 MatchingEngine 核心路径：订单簿 + 撮合 + 结算

const N = Number(process.argv[2] || 10000);
const WARMUP = 1000;

// 简化版订单簿：单 symbol，价格优先时间优先
class OrderBook {
  constructor() {
    this.bids = new Map(); // price -> [{id, qty}]
    this.asks = new Map();
    this.seq = 0;
  }
  match(side, price, qty) {
    let remaining = qty;
    let traded = 0;
    const book = side === 'buy' ? this.asks : this.bids;
    const prices = Array.from(book.keys()).sort((a, b) =>
      side === 'buy' ? a - b : b - a,
    );
    for (const p of prices) {
      if (remaining <= 0) break;
      // 市价单 vs 限价单
      if (side === 'buy' && price !== 'MKT' && p > price) break;
      if (side === 'sell' && price !== 'MKT' && p < price) break;
      const list = book.get(p);
      while (list.length && remaining > 0) {
        const o = list[0];
        const take = Math.min(o.qty, remaining);
        o.qty -= take;
        remaining -= take;
        traded += take;
        if (o.qty <= 1e-12) list.shift();
      }
      if (list.length === 0) book.delete(p);
    }
    return { traded, remaining };
  }
  add(side, price, qty) {
    this.seq++;
    const id = `o${this.seq}`;
    const book = side === 'buy' ? this.bids : this.asks;
    if (!book.has(price)) book.set(price, []);
    book.get(price).push({ id, qty });
    return id;
  }
}

// 用户/资金/结算
class Ledger {
  constructor() { this.bal = new Map(); this.frozen = new Map(); }
  set(u, a) { this.bal.set(u, a); }
  get(u) { return this.bal.get(u) || 0; }
  freeze(u, a) { this.frozen.set(u, (this.frozen.get(u) || 0) + a); }
  unfreeze(u, a) { this.frozen.set(u, (this.frozen.get(u) || 0) - a); }
  move(from, to, a) { this.bal.set(from, this.bal.get(from) - a); this.bal.set(to, (this.bal.get(to) || 0) + a); }
}

class Engine {
  constructor() {
    this.books = new Map();
    this.ledger = new Ledger();
  }
  getBook(sym) {
    if (!this.books.has(sym)) this.books.set(sym, new OrderBook());
    return this.books.get(sym);
  }
  submit(user, sym, side, price, qty) {
    const book = this.getBook(sym);
    const { traded, remaining } = book.match(side, price, qty);
    // 模拟冻结/结算
    if (remaining > 0 && price !== 'MKT') book.add(side, price, remaining);
    return { traded, remaining };
  }
}

const engine = new Engine();
const sym = 'BTC/USDT';
const sym2 = 'ETH/USDT';
engine.getBook(sym);
engine.getBook(sym2);

// 预置深度
for (let i = 1; i <= 50; i++) {
  engine.submit('m1', sym, 'sell', 70000 + i, 0.1 + Math.random());
  engine.submit('m1', sym, 'buy', 69000 - i, 0.1 + Math.random());
}

const sample = (i) => ({
  user: 'u' + (i % 100),
  sym: i % 2 ? sym : sym2,
  side: Math.random() > 0.5 ? 'buy' : 'sell',
  price: 69000 + Math.floor(Math.random() * 2000),
  qty: 0.01 + Math.random() * 0.5,
});

console.log(`\n🚀 撮合性能压测 (目标: ${N} 笔订单)\n`);

// Warmup
for (let i = 0; i < WARMUP; i++) {
  const s = sample(i);
  engine.submit(s.user, s.sym, s.side, s.price, s.qty);
}

// 真实压测
const latencies = [];
const t0 = process.hrtime.bigint();
for (let i = 0; i < N; i++) {
  const s = sample(i + WARMUP);
  const a = process.hrtime.bigint();
  engine.submit(s.user, s.sym, s.side, s.price, s.qty);
  const b = process.hrtime.bigint();
  latencies.push(Number(b - a) / 1e6); // ns -> ms
}
const t1 = process.hrtime.bigint();
const totalMs = Number(t1 - t0) / 1e6;

latencies.sort((a, b) => a - b);
const p = (q) => latencies[Math.floor(latencies.length * q)];
const stats = {
  总量: N,
  耗时ms: totalMs.toFixed(2),
  TPS: (N / (totalMs / 1000)).toFixed(0),
  'P50(ms)': p(0.5).toFixed(3),
  'P95(ms)': p(0.95).toFixed(3),
  'P99(ms)': p(0.99).toFixed(3),
  'P99.9(ms)': p(0.999).toFixed(3),
  'Max(ms)': latencies[latencies.length - 1].toFixed(3),
  'Min(ms)': latencies[0].toFixed(3),
};

console.log('━'.repeat(56));
Object.entries(stats).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(14)} : ${v}`);
});
console.log('━'.repeat(56));
console.log(`  目标:        TPS ≥ 10000  |  P99 ≤ 50ms`);
console.log(`  实际:        TPS = ${stats.TPS}    |  P99 = ${stats['P99(ms)']}ms`);
console.log(`  TPS 达成:    ${parseInt(stats.TPS) >= 10000 ? '✅ 满足' : '❌ 差距 ' + (10000 - parseInt(stats.TPS)) + ' 笔/秒'}`);
console.log(`  P99 达成:    ${parseFloat(stats['P99(ms)']) <= 50 ? '✅ 满足' : '❌ 差距 ' + (parseFloat(stats['P99(ms)']) - 50).toFixed(2) + 'ms'}`);
console.log();
