/**
 * 模拟 BPM (Flowable) 服务 - 用于验证 BPM 引擎的真实 HTTP 调用
 *
 * 实现 Flowable REST API 子集：
 *  - GET  /flowable-rest/service/management/engine
 *  - POST /flowable-rest/service/runtime/process-instances
 *  - DELETE /flowable-rest/service/runtime/process-instances/{id}
 *  - GET  /flowable-rest/service/runtime/process-instances/{id}
 *
 * 启动：node scripts/mock-bpm-server.js
 */

const http = require('http');

const PORT = 8080;
const LOG_PREFIX = '[Mock BPM]';

function log(color, ...args) {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
  };
  const timestamp = new Date().toISOString();
  console.log(
    `${colors[color] || ''}${LOG_PREFIX} [${timestamp}]${colors.reset}`,
    ...args
  );
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

const processes = new Map();
const startTime = Date.now();

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  log('blue', `${req.method} ${req.url}`);

  const url = req.url;

  if (url === '/flowable-rest/service/management/engine' && req.method === 'GET') {
    sendJson(res, 200, {
      name: 'default',
      version: '6.8.0-mock',
      resourceUrl: 'file:///flowable-rest/service/management/engine',
      exceptionMessage: null,
      uptime: Date.now() - startTime,
    });
    log('green', '健康检查通过 - Flowable 6.8.0-mock');
    return;
  }

  if (url === '/flowable-rest/service/runtime/process-instances' && req.method === 'POST') {
    const body = await parseBody(req);
    const procId = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const processInstance = {
      id: procId,
      url: `/flowable-rest/service/runtime/process-instances/${procId}`,
      businessKey: body.businessKey,
      processDefinitionId: `${body.processDefinitionKey || 'approval'}:1:${Math.floor(Math.random() * 1000)}`,
      processDefinitionUrl: `/flowable-rest/service/repository/process-definitions/${body.processDefinitionKey || 'approval'}:1:${Math.floor(Math.random() * 1000)}`,
      ended: false,
      suspended: false,
      tenantId: '',
      variables: body.variables || [],
      startedAt: new Date().toISOString(),
      variablesLocal: [],
    };
    processes.set(procId, processInstance);
    sendJson(res, 201, processInstance);
    log('green', `流程已启动: ${procId} (类型: ${body.processDefinitionKey || 'approval'})`);
    return;
  }

  const procMatch = url.match(/^\/flowable-rest\/service\/runtime\/process-instances\/([^/]+)$/);
  if (procMatch) {
    const procId = procMatch[1];
    if (req.method === 'GET') {
      const proc = processes.get(procId) || {
        id: procId,
        ended: false,
        startedAt: new Date().toISOString(),
      };
      sendJson(res, 200, proc);
      log('green', `查询流程状态: ${procId}`);
      return;
    }
    if (req.method === 'DELETE') {
      processes.delete(procId);
      sendJson(res, 204, {});
      log('yellow', `流程已终止: ${procId}`);
      return;
    }
  }

  sendJson(res, 404, { error: 'Not Found', path: url });
});

server.listen(PORT, () => {
  log('green', `模拟 BPM (Flowable) 服务已启动`);
  log('green', `地址: http://localhost:${PORT}`);
  log('green', `管理API: http://localhost:${PORT}/flowable-rest/service/management/engine`);
  log('green', `流程API: http://localhost:${PORT}/flowable-rest/service/runtime/process-instances`);
  console.log('');
});
