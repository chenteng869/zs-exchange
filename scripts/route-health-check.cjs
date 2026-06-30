const fs = require('node:fs');
const path = require('node:path');

const API_ROOT = path.join(process.cwd(), 'src', 'app', 'api');
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];
const REQUIRED_P0_ROUTES = [
  '/api/health',
  '/api/v1/auth/:action',
  '/api/v1/market/:symbol',
  '/api/v1/market/depth/:symbol',
  '/api/v1/market/klines/:symbol',
  '/api/v1/trade/orders',
  '/api/v1/trade/trades',
  '/api/v1/user/profile',
  '/api/v1/wallet/balances',
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    return entry.isFile() && /^route\.(ts|tsx|js|mjs)$/.test(entry.name) ? [fullPath] : [];
  });
}

function toRoutePath(filePath) {
  const relativeDir = path.relative(API_ROOT, path.dirname(filePath));
  const segments = relativeDir
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !/^\(.+\)$/.test(segment))
    .map((segment) => {
      const dynamicMatch = segment.match(/^\[(.+)\]$/);
      return dynamicMatch ? `:${dynamicMatch[1]}` : segment;
    });

  return `/api/${segments.join('/')}`.replace(/\/+$/, '');
}

function exportedMethods(source) {
  return HTTP_METHODS.filter((method) => {
    const declarationPattern = new RegExp(
      `\\bexport\\s+(?:async\\s+)?function\\s+${method}\\b|\\bexport\\s+const\\s+${method}\\b`,
      'm',
    );
    const listPattern = new RegExp(`\\bexport\\s*\\{[^}]*\\b${method}\\b[^}]*\\}`, 's');
    return declarationPattern.test(source) || listPattern.test(source);
  });
}

function main() {
  const routeFiles = walk(API_ROOT).sort();
  const routes = routeFiles.map((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    return {
      path: toRoutePath(filePath),
      file: path.relative(process.cwd(), filePath),
      methods: exportedMethods(source),
    };
  });

  const missingMethods = routes.filter((route) => route.methods.length === 0);
  const routeGroups = new Map();
  for (const route of routes) {
    const existing = routeGroups.get(route.path) || [];
    existing.push(route.file);
    routeGroups.set(route.path, existing);
  }

  const duplicates = Array.from(routeGroups.entries())
    .filter(([, files]) => files.length > 1)
    .map(([routePath, files]) => ({ path: routePath, files }));
  const paths = new Set(routes.map((route) => route.path));
  const missingRequired = REQUIRED_P0_ROUTES.filter((routePath) => !paths.has(routePath));
  const perpRoutes = routes.filter((route) => route.path.startsWith('/api/v1/perp'));

  const summary = {
    routeCount: routes.length,
    p0RouteCount: REQUIRED_P0_ROUTES.length,
    perpRouteCount: perpRoutes.length,
    missingMethods,
    duplicates,
    missingRequired,
    routes,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (missingMethods.length || duplicates.length || missingRequired.length) {
    process.exitCode = 1;
  }
}

main();
