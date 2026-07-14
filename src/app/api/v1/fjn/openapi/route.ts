/**
 * FJN OpenAPI 规范端点
 * GET /api/v1/fjn/openapi
 *
 * 返回 OpenAPI 3.0 规范 JSON（直接返回根级 spec，不包装）
 * Swagger UI 通过此 URL 加载规范
 *
 * 文档生成器：scripts/generate-fjn-openapi.ts
 */
import { NextRequest } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { serverError } from '@/lib/api/response';
import { handleApiError } from '@/lib/api/error-handler';
import { logger } from '@/lib/logger';

const OPENAPI_PATH = join(process.cwd(), 'docs', 'openapi', 'fjn-openapi.json');

export async function GET(_req: NextRequest) {
  try {
    if (!existsSync(OPENAPI_PATH)) {
      return serverError('OpenAPI spec not generated. Run: npx tsx scripts/generate-fjn-openapi.ts');
    }
    const content = readFileSync(OPENAPI_PATH, 'utf-8');
    const parsed = JSON.parse(content);
    // 直接返回 spec（Swagger UI 需要根级 openapi 字段）
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (e) {
    return handleApiError(e, 'api:fjn/openapi get-spec');
  }
}
