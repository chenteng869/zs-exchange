# 2026-06-26 Project Health Check

## Scope

This pass keeps the existing project intact while making the backend/API spine measurable and repeatable:

- Mainline TypeScript health through `tsconfig.json`.
- P0 backend TypeScript boundary through `tsconfig.check.json`.
- Perpetual-contract debt isolated through `tsconfig.perp.json`.
- API route structure health for `src/app/api`.
- Real auth -> wallet balance -> spot order -> match -> trade history -> depth -> cancel flow.
- Focused P0 unit tests for shared trade symbol normalization.

## Health Scripts

- `npm.cmd run type-check`: P0 backend type gate, alias of `type-check:p0`.
- `npm.cmd run type-check:p0`: checks health/auth/docs/market/trade/user/wallet and shared backend code.
- `npm.cmd run type-check:full`: checks the current mainline app surface.
- `npm.cmd run type-check:perp`: checks isolated perpetual-contract source; currently expected to fail until P1 repair.
- `npm.cmd run test:p0`: runs focused P0 Vitest suites.
- `npm.cmd run health:routes`: scans API route files for missing method exports, duplicate URL paths, and required P0 route presence.
- `npm.cmd run health:p0`: runs the real local P0 API integration loop.

## Changes Made

- Added `/api/health`.
- Added `src/lib/trade/symbol.ts` to normalize symbols such as `BTCUSDT`, `BTC-USDT`, `BTC_USDT`, and `BTC%2FUSDT` to `BTC/USDT`.
- Applied symbol normalization to market and trade APIs:
  - `src/app/api/v1/market/[symbol]/route.ts`
  - `src/app/api/v1/market/depth/[symbol]/route.ts`
  - `src/app/api/v1/market/klines/[symbol]/route.ts`
  - `src/app/api/v1/trade/orders/route.ts`
  - `src/app/api/v1/trade/trades/route.ts`
- Added persistent spot order matching and orderbook fallback so market depth can be derived from live `TradeOrder` rows when snapshots are missing.
- Added `scripts/health-p0-check.cjs` for repeatable local P0 API verification.
- Added `scripts/route-health-check.cjs` for repeatable API route structure verification.
- Added `vitest.p0.config.ts` and `tests/p0/trade-symbol.test.ts`.
- Cleaned mainline TypeScript drift in low-risk places:
  - Animation easing constant.
  - Auth barrel duplicate `sha256` export.
  - Ant Design prop mismatches in selected admin pages.
  - FAQ accordion usage and injected theme prop type.
  - Home hero ticker field and counter value guard.
  - License page CSS custom property typing.
  - Binance fallback feed orderbook/subscribe compatibility.
  - Wallet audit nested value typing.
  - Wallet key derivation async seed/path/sign-type issues.
  - Bitcoin adapter request signature compatibility.
- Isolated perpetual-contract source from mainline `tsconfig.json` into `tsconfig.perp.json`.

## Passing Checks

- `npm.cmd run type-check:full`: passed.
- `npm.cmd run type-check:p0`: passed.
- `npm.cmd run test:p0`: passed, 1 file / 3 tests.
- `npm.cmd run health:routes`: passed.
  - Route count: 20.
  - P0 required route count: 9.
  - Perp route count: 5.
  - Missing method exports: 0.
  - Duplicate normalized route paths: 0.
  - Missing required P0 routes: 0.
- `npm.cmd run health:p0`: passed.

Latest P0 API result:

- Created isolated seller, resting buyer, and taker buyer users.
- Resting sell opened with `0.003 BTC`.
- Resting bid opened with `0.002 BTC`.
- Taker buy filled `0.001 BTC` and created `2` trade rows.
- Seller order became `partial` with `0.002 BTC` remaining.
- Depth fallback exposed both bid and ask levels before cancel.
- Seller partial order cancelled and frozen BTC released.
- Resting bid cancelled and frozen USDT released.
- Final seller, taker buyer, and maker buyer frozen balances were all `0`.

## Current Boundaries

### Mainline App

Status: green for current source included by `tsconfig.json`.

- The root type-check now excludes inactive/heavy side surfaces such as mobile/build artifacts, disabled pages, `src/modules/web3-wallet`, and isolated perpetual-contract source.
- This makes `npm.cmd run type-check:full` a usable mainline gate again.

### P0 API Spine

Status: healthy enough to continue feature development.

- `/api/health` is available.
- Auth/session, wallet balances, market depth, trade orders, and trade history run as a real local API loop.
- Symbol normalization keeps market/trade endpoints consistent across common URL/input formats.
- Route structure scanning confirms the P0 API files are present and export HTTP handlers.

### Perpetual Contracts

Status: isolated P1 repair queue.

`npm.cmd run type-check:perp` currently fails in `src/lib/perp/**` and `src/app/api/v1/perp/**`. The failures are now contained instead of breaking mainline checks.

Main failure clusters:

- Contract/funding/liquidation interfaces drifted from their current domain types.
- `PerpEnginePersistence` async method signatures no longer match the synchronous base `PerpEngine`.
- Prisma create inputs need relation-shaped writes such as `account`/`contract`, not stale scalar fields such as `accountId`.
- Perp service return types need global `Promise<T>` and Decimal/type alignment.

### Full Test Suite

Status: still not a reliable mainline gate.

- `test:p0` is usable and passing.
- The broad `npm.cmd test` suite still contains older wallet/perp/KYC expectations and timeout-prone adapter tests. Keep it diagnostic until those suites are split or repaired.

## Recommended Next Health Gates

1. Keep `npm.cmd run type-check:full` and `npm.cmd run type-check:p0` green before larger backend changes.
2. Run `npm.cmd run health:routes` after adding or moving API route files.
3. Run `npm.cmd run health:p0` after touching auth, market, wallet, balances, orders, or matching.
4. Repair `type-check:perp` as the next isolated P1 track.
5. Split the broad Vitest suite into active gates such as `test:p0`, `test:wallet`, `test:perp`, and `test:integration`.
