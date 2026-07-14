/**
 * FJN Swagger UI 在线文档路由
 * GET /api/v1/fjn/docs
 *
 * 提供 Swagger UI HTML 页面，加载本地 swagger-ui 资源
 * 数据源：/api/v1/fjn/openapi
 *
 * 资源来源：
 *  - /swagger-ui/swagger-ui.css         (本地 static asset)
 *  - /swagger-ui/swagger-ui-bundle.js  (本地 static asset)
 *  - /swagger-ui/swagger-ui-standalone-preset.js (本地 static asset)
 */
import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>FJN 福建老酒业务服务 API - Swagger UI</title>
  <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 30px 0; }
    .swagger-ui .info .title { font-size: 32px; color: #1a1a1a; }
    .swagger-ui .scheme-container { background: #fafafa; padding: 10px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/swagger-ui/swagger-ui-bundle.js" crossorigin></script>
  <script src="/swagger-ui/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/fjn/openapi',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      });
    };
  </script>
</body>
</html>`;

export async function GET(_req: NextRequest) {
  try {
    return new Response(SWAGGER_HTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (e: any) {
    logger.error('[api:fjn/docs] error', e);
    return new Response('Internal Server Error', { status: 500 });
  }
}
