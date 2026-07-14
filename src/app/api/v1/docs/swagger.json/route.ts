import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Swagger UI 规范端点
 *
 * 优先返回 docs/openapi/complete-openapi.json（自动扫描生成的完整规范）
 * 如果不存在则返回硬编码的简化规范
 */

function loadCompleteSpec() {
  // 1. 尝试完整版（自动扫描）
  const completePath = join(process.cwd(), 'docs', 'openapi', 'complete-openapi.json');
  if (existsSync(completePath)) {
    try {
      return JSON.parse(readFileSync(completePath, 'utf-8'));
    } catch (e) {
      console.warn('[swagger] Failed to parse complete-openapi.json:', e);
    }
  }
  // 2. 尝试 FJN 11 Service 版
  const fjnPath = join(process.cwd(), 'docs', 'openapi', 'fjn-openapi.json');
  if (existsSync(fjnPath)) {
    try {
      return JSON.parse(readFileSync(fjnPath, 'utf-8'));
    } catch (e) {
      console.warn('[swagger] Failed to parse fjn-openapi.json:', e);
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const complete = loadCompleteSpec();
  if (complete) {
    return NextResponse.json(complete);
  }
  // 兜底（最简骨架）
  return NextResponse.json({
    openapi: '3.0.0',
    info: { title: 'ZS Exchange API', version: '1.0.0' },
    paths: {},
    components: { securitySchemes: {}, schemas: {} },
  });
}
