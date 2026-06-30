/**
 * 模拟 n8n 服务 - 用于验证引擎适配层的真实 HTTP 调用
 *
 * 功能：
 *  - GET  /healthz                         健康检查
 *  - POST /webhook/notification-workflow   通知工作流
 *  - POST /webhook/sync-data               数据同步工作流
 *  - POST /webhook/*                       通用 webhook
 *
 * 启动：node scripts/mock-n8n-server.js
 */

const http = require('http');

const PORT = 5678;
const LOG_PREFIX = '[Mock n8n]';

function log(color, ...args) {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    red: '\x1b[31m',
  };
  const timestamp = new Date().toISOString();
  console.log(
    `${colors[color] || ''}${LOG_PREFIX} [${timestamp}]${colors.reset}`,
    ...args
  );
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1e6) {
        reject(new Error('Request body too large'));
        req.connection.destroy();
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  log('cyan', `${req.method} ${req.url}`);

  try {
    const body = await parseBody(req);
    if (Object.keys(body).length > 0) {
      log('blue', '请求体:', JSON.stringify(body).slice(0, 200));
    }

    if (req.url === '/healthz' && req.method === 'GET') {
      log('green', '健康检查 - OK');
      sendJson(res, 200, {
        status: 'ok',
        version: '1.94.1-mock',
        name: 'n8n',
      });
      return;
    }

    if (req.url.startsWith('/webhook/') && req.method === 'POST') {
      const workflowId = req.url.replace('/webhook/', '');
      log('green', `触发工作流: ${workflowId}`);

      const executionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      let resultData = {};

      switch (workflowId) {
        case 'notification-workflow':
          resultData = {
            notificationId: `n8n-notif-${executionId}`,
            workflowId,
            status: 'success',
            channel: body.channel || 'email',
            recipients: body.recipients ? body.recipients.length : 1,
            sentAt: new Date().toISOString(),
            executionId,
            message: `通知已发送: ${body.title || body.subject || '无标题'}`,
          };
          log('green', `通知发送成功: channel=${body.channel || 'email'}, title=${body.title || body.subject || 'N/A'}`);
          break;

        case 'sync-data':
          resultData = {
            syncId: `n8n-sync-${executionId}`,
            workflowId,
            status: 'success',
            syncedRecords: Math.floor(Math.random() * 500) + 50,
            syncedAt: new Date().toISOString(),
            executionId,
          };
          log('green', `数据同步完成: ${resultData.syncedRecords} 条记录`);
          break;

        default:
          resultData = {
            executionId,
            workflowId,
            status: 'success',
            triggeredAt: new Date().toISOString(),
            input: body,
          };
          log('green', `工作流触发成功: ${workflowId}`);
      }

      setTimeout(() => {
        sendJson(res, 200, resultData);
      }, 200 + Math.random() * 500);

      return;
    }

    log('yellow', `404 Not Found: ${req.method} ${req.url}`);
    sendJson(res, 404, { error: 'Not Found', path: req.url });
  } catch (e) {
    log('red', '服务器错误:', e.message);
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  log('green', `模拟 n8n 服务已启动`);
  log('green', `地址: http://localhost:${PORT}`);
  log('green', `健康检查: http://localhost:${PORT}/healthz`);
  log('green', `通知 Webhook: http://localhost:${PORT}/webhook/notification-workflow`);
  log('green', `同步 Webhook: http://localhost:${PORT}/webhook/sync-data`);
  console.log('');
});

process.on('SIGINT', () => {
  log('yellow', '正在关闭服务...');
  server.close(() => {
    log('green', '服务已关闭');
    process.exit(0);
  });
});
