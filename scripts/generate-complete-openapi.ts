/**
 * 完整 OpenAPI 3.0 自动生成器
 *
 * 自动扫描 src/app/api/v1 下所有 route.ts 文件，提取：
 *  - 路径（Path）：从文件系统结构推断 + 路径参数 [id] → {id}
 *  - 方法（Method）：GET / POST / PUT / PATCH / DELETE
 *  - Summary / Description：JSDoc 注释（@summary, @description）
 *  - Tags：路径第一段（admin / auth / chain / fjn / wallet 等）
 *  - Auth 要求：检测 requireAuth / withUserAuth / withAdminAuth
 *  - Query 参数：url.searchParams.get('xxx')
 *  - Path 参数：[id] 目录
 *
 * 输出：docs/openapi/complete-openapi.json
 */

import {
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'fs';
import { join, relative, sep, basename } from 'path';

// ============================================================
// 配置
// ============================================================

const ROOT = join(process.cwd(), 'src', 'app', 'api', 'v1');
const OUT_DIR = join(process.cwd(), 'docs', 'openapi');
const OUT_FILE = join(OUT_DIR, 'complete-openapi.json');

// 路径标签映射（基于一级目录）
const DOMAIN_TAGS: Record<string, { name: string; description: string }> = {
  admin: { name: 'admin', description: '管理后台域（仅 admin）' },
  ai: { name: 'ai', description: 'AI 智能域' },
  auth: { name: 'auth', description: '认证域（登录/注册/Token）' },
  chain: { name: 'chain', description: '跨链对账域' },
  crypto: { name: 'crypto', description: '加密货币数据域（CoinGecko/Binance/CoinMarketCap）' },
  did: { name: 'did', description: '去中心化身份域（Solana DID）' },
  docs: { name: 'docs', description: 'API 文档域（OpenAPI/Swagger）' },
  fjn: { name: 'fjn', description: 'FJN 福建老酒业务域（33 Service）' },
  game: { name: 'game', description: '游戏域' },
  mall: { name: 'mall', description: '商城域（DAppX Mall）' },
  market: { name: 'market', description: '行情域' },
  nft: { name: 'nft', description: 'NFT 平台域' },
  perp: { name: 'perp', description: '永续合约域' },
  solana: { name: 'solana', description: 'Solana 基础层（链上查询/Indexer/Program）' },
  'solana-ico': { name: 'solana-ico', description: 'Solana ICO 业务线（Token/Order/Vesting/Claim/Reconciliation）' },
  sports: { name: 'sports', description: '体育竞猜域' },
  spot: { name: 'spot', description: '现货交易域' },
  trade: { name: 'trade', description: '交易域（订单/成交）' },
  user: { name: 'user', description: '用户自助域' },
  wallet: { name: 'wallet', description: '钱包域' },
};

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
type HttpMethod = (typeof HTTP_METHODS)[number];

interface Endpoint {
  path: string;
  method: HttpMethod;
  tags: string[];
  summary: string;
  description: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  pathParams: string[];
  queryParams: string[];
  bodyFields: string[];
  filePath: string;
}

interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    contact?: { name: string };
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<
    string,
    Partial<Record<HttpMethod, Record<string, unknown>>>
  >;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
    responses: Record<string, unknown>;
  };
}

// ============================================================
// 1. 递归扫描 route.ts
// ============================================================

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p, out);
    } else if (name === 'route.ts' || name === 'route.js') {
      out.push(p);
    }
  }
  return out;
}

// ============================================================
// 2. 从文件路径推断 API 路径
// ============================================================

function fileToApiPath(filePath: string): { path: string; pathParams: string[] } {
  // filePath = ROOT/xxx/yyy/[id]/route.ts → /api/v1/xxx/yyy/{id}
  const rel = relative(ROOT, filePath).split(sep);
  // 去掉 'route.ts'
  rel.pop();
  const pathParams: string[] = [];
  const parts = rel.map((p) => {
    if (p.startsWith('[') && p.endsWith(']')) {
      const name = p.slice(1, -1);
      pathParams.push(name);
      return `{${name}}`;
    }
    return p;
  });
  return { path: '/api/v1/' + parts.join('/'), pathParams };
}

// ============================================================
// 3. 解析单个 route.ts 提取 endpoint
// ============================================================

function parseRouteFile(filePath: string): Endpoint[] {
  const content = readFileSync(filePath, 'utf-8');
  const { path: apiPath, pathParams } = fileToApiPath(filePath);

  // 提取 JSDoc 注释（文件顶部）
  const jsdocMatch = content.match(/^([\s\S]*?)\*\//);
  const topJsdoc = jsdocMatch ? jsdocMatch[1] : '';
  const summaryMatch = topJsdoc.match(/@summary\s+(.+)/);
  const descMatch = topJsdoc.match(/@description\s+(.+)/);
  const fileSummary = summaryMatch ? summaryMatch[1].trim() : basename(filePath, '.ts');
  const fileDescription = descMatch ? descMatch[1].trim() : '';

  // 检测认证
  const requiresAuth =
    /requireAuth\s*\(/.test(content) ||
    /withUserAuth\s*\(/.test(content) ||
    /withAdminAuth\s*\(/.test(content);
  const requiresAdmin = /withAdminAuth\s*\(/.test(content);

  // 提取 query 参数
  const queryParams = new Set<string>();
  const queryRegex = /searchParams\.get\(['"`]([^'"`]+)['"`]\)/g;
  let m: RegExpExecArray | null;
  while ((m = queryRegex.exec(content)) !== null) {
    queryParams.add(m[1]);
  }
  const queryRegex2 = /url\.searchParams\.get\(['"`]([^'"`]+)['"`]\)/g;
  while ((m = queryRegex2.exec(content)) !== null) {
    queryParams.add(m[1]);
  }

  // 提取 body 字段
  const bodyFields = new Set<string>();
  const bodyRegex = /body\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((m = bodyRegex.exec(content)) !== null) {
    bodyFields.add(m[1]);
  }
  // 兼容 body.X 形式
  const bodyRegex2 = /body\?\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  while ((m = bodyRegex2.exec(content)) !== null) {
    bodyFields.add(m[1]);
  }
  // 兼容 body: { xxx: ... } 形式
  const bodyRegex3 = /body\?:\s*\{\s*([^}]+)\}/g;
  while ((m = bodyRegex3.exec(content)) !== null) {
    const fields = m[1].split(',').map((f) => f.split(':')[0].trim().split('?')[0]);
    for (const f of fields) {
      if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(f)) bodyFields.add(f);
    }
  }

  // 推断 tags（基于路径第一段）
  const segs = apiPath.split('/').filter(Boolean); // ['api','v1','admin',...]
  const firstSeg = segs[2] || 'misc';
  const tags = [firstSeg];

  // 检测导出的方法
  const endpoints: Endpoint[] = [];
  for (const method of HTTP_METHODS) {
    const exportRegex = new RegExp(
      `export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`,
    );
    if (exportRegex.test(content)) {
      // 推断 method 特定的 summary
      let methodSummary = `${method} ${apiPath}`;
      let methodDesc = fileDescription;
      // 查找内联注释 @summary
      const methodIdx = content.indexOf(`export ${method === 'DELETE' ? 'async function DELETE' : `async function ${method}`}`);
      if (methodIdx > 0) {
        const before = content.slice(Math.max(0, methodIdx - 500), methodIdx);
        const sm = before.match(/@summary\s+(.+)/);
        const dm = before.match(/@description\s+(.+)/);
        if (sm) methodSummary = sm[1].trim();
        if (dm) methodDesc = dm[1].trim();
      }

      endpoints.push({
        path: apiPath,
        method,
        tags,
        summary: methodSummary,
        description: methodDesc || fileSummary,
        requiresAuth,
        requiresAdmin,
        pathParams,
        queryParams: Array.from(queryParams),
        bodyFields: Array.from(bodyFields),
        filePath: relative(process.cwd(), filePath),
      });
    }
  }

  return endpoints;
}

// ============================================================
// 4. 构造 OpenAPI Operation
// ============================================================

function buildOperation(ep: Endpoint): Record<string, unknown> {
  const op: Record<string, unknown> = {
    tags: ep.tags,
    summary: ep.summary,
    description: ep.description,
    operationId: `${ep.method.toLowerCase()}_${ep.path.replace(/[\/{}-]/g, '_')}`,
  };

  // Security
  if (ep.requiresAdmin) {
    op.security = [{ BearerAuth: ['admin'] }];
  } else if (ep.requiresAuth) {
    op.security = [{ BearerAuth: [] }];
  } else {
    op.security = [];
  }

  // Parameters (path + query)
  const params: unknown[] = [];
  for (const p of ep.pathParams) {
    params.push({
      name: p,
      in: 'path',
      required: true,
      description: `路径参数 ${p}`,
      schema: { type: 'string' },
    });
  }
  for (const q of ep.queryParams) {
    params.push({
      name: q,
      in: 'query',
      required: false,
      description: `查询参数 ${q}`,
      schema: { type: 'string' },
    });
  }
  // 标准分页参数
  if (ep.method === 'GET' && !ep.queryParams.includes('page')) {
    params.push(
      { name: 'page', in: 'query', required: false, description: '页码', schema: { type: 'integer', default: 1 } },
      { name: 'pageSize', in: 'query', required: false, description: '每页数量', schema: { type: 'integer', default: 20 } },
    );
  }
  if (params.length > 0) op.parameters = params;

  // Request Body
  if (ep.method === 'POST' || ep.method === 'PUT' || ep.method === 'PATCH') {
    if (ep.bodyFields.length > 0) {
      const properties: Record<string, unknown> = {};
      for (const f of ep.bodyFields) {
        properties[f] = { type: 'string', description: `字段 ${f}` };
      }
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties,
              description: `${ep.method} ${ep.path} 请求体`,
            },
          },
        },
      };
    } else {
      op.requestBody = {
        required: false,
        content: {
          'application/json': {
            schema: { type: 'object', description: `${ep.method} ${ep.path} 请求体` },
          },
        },
      };
    }
  }

  // Responses
  op.responses = {
    200: { description: '成功', content: { 'application/json': { schema: { $ref: '#/components/responses/StandardResponse' } } } },
    201: { description: '创建成功', content: { 'application/json': { schema: { $ref: '#/components/responses/StandardResponse' } } } },
    400: { description: '请求参数错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    401: { description: '未认证', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    403: { description: '权限不足', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    404: { description: '资源不存在', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
    500: { description: '服务器错误', content: { 'application/json': { schema: { $ref: '#/components/responses/ErrorResponse' } } } },
  };

  return op;
}

// ============================================================
// 5. 聚合到 OpenAPI Document
// ============================================================

function buildDocument(endpoints: Endpoint[]): OpenAPIDocument {
  const paths: Record<string, Partial<Record<HttpMethod, Record<string, unknown>>>> = {};
  for (const ep of endpoints) {
    if (!paths[ep.path]) paths[ep.path] = {};
    paths[ep.path][ep.method] = buildOperation(ep);
  }

  // Tags（基于已发现的 tag 集合）
  const tagSet = new Set<string>();
  for (const ep of endpoints) {
    for (const t of ep.tags) tagSet.add(t);
  }
  const tags = Array.from(tagSet)
    .sort()
    .map((t) => ({
      name: t,
      description: DOMAIN_TAGS[t]?.description ?? `${t} 域`,
    }));

  return {
    openapi: '3.0.3',
    info: {
      title: 'ZS Exchange 完整 API 规范',
      version: '1.0.0',
      description: `ZS Exchange 项目的完整 REST API 规范（自动扫描生成）。

**覆盖**: 20 个一级域、${endpoints.length} 个 endpoint、${new Set(endpoints.map((e) => e.tags[0])).size} 个业务域

**鉴权**: JWT Bearer Token（来自 /api/v1/auth/login）。

**生成方式**: 扫描 src/app/api/v1 下所有 route.ts 自动提取。`,
      contact: { name: 'ZS Exchange Dev Team' },
    },
    servers: [
      { url: OPENAPI_DEV_URL, description: '本地开发' },
      { url: OPENAPI_PROD_URL, description: '生产环境' },
    ],
    tags,
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Token，从 /api/v1/auth/login 获取',
        },
      },
      schemas: {
        StandardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            code: { type: 'integer', example: 0 },
            message: { type: 'string', example: 'OK' },
            data: { type: 'object', description: '业务数据' },
          },
          required: ['success', 'code', 'message'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            code: { type: 'integer', example: 400 },
            message: { type: 'string', example: 'Bad request' },
            data: { type: 'object' },
          },
          required: ['success', 'code', 'message'],
        },
      },
      responses: {
        StandardResponse: {
          description: '标准响应',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' },
            },
          },
        },
        ErrorResponse: {
          description: '错误响应',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  };
}

// ============================================================
// 6. 入口
// ============================================================

function main() {
  console.log('🔍 扫描 route.ts 文件...');
  const files = walk(ROOT);
  console.log(`  ✅ 发现 ${files.length} 个 route.ts`);

  const endpoints: Endpoint[] = [];
  for (const f of files) {
    const eps = parseRouteFile(f);
    endpoints.push(...eps);
  }
  console.log(`  ✅ 提取 ${endpoints.length} 个 endpoint`);

  // 按域统计
  const byDomain: Record<string, number> = {};
  for (const ep of endpoints) {
    const d = ep.tags[0];
    byDomain[d] = (byDomain[d] ?? 0) + 1;
  }
  console.log('  📊 按域统计:');
  for (const [d, c] of Object.entries(byDomain).sort((a, b) => b[1] - a[1])) {
    console.log(`    - ${d}: ${c}`);
  }

  // 构造 OpenAPI
  const doc = buildDocument(endpoints);

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(doc, null, 2));
  const stat = statSync(OUT_FILE);
  console.log(`\n✅ 已生成 ${OUT_FILE} (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log(`   路径数: ${Object.keys(doc.paths).length}`);
  console.log(`   endpoint 数: ${endpoints.length}`);
  console.log(`   标签数: ${doc.tags.length}`);
}

main();
