/**
 * 模拟 AI 分析中心 + OpenClaw 智能体 + 区块链 RPC 服务
 *
 * AI 分析中心 (端口 8001)：
 *  - GET  /health
 *  - POST /api/v1/analyze_risk
 *  - POST /api/v1/predict_hazard
 *  - POST /api/v1/build_knowledge_graph
 *
 * OpenClaw 智能体 (端口 18789)：
 *  - GET  /health
 *  - POST /api/v1/execute
 *
 * 区块链 RPC (端口 8545)：
 *  - POST / (JSON-RPC)
 *  - GET  /health
 *
 * 启动：node scripts/mock-ai-blockchain-server.js
 */

const http = require('http');
const crypto = require('crypto');

const AI_CENTER_PORT = 8001;
const OPENCLAW_PORT = 18789;
const BLOCKCHAIN_PORT = 8545;

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(prefix, color, ...args) {
  const timestamp = new Date().toISOString();
  console.log(
    `${COLORS[color] || ''}[${prefix}]${COLORS.reset} [${timestamp}]`,
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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

const startTime = Date.now();

function makeServer(port, serviceName, color) {
  return http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    log(serviceName, color, `${req.method} ${req.url}`);
    const body = await parseBody(req);

    if (req.url === '/health' && req.method === 'GET') {
      sendJson(res, 200, {
        status: 'ok',
        service: serviceName,
        version: '1.0.0-mock',
        uptime: Date.now() - startTime,
      });
      log(serviceName, 'green', `健康检查通过`);
      return;
    }

    if (serviceName === 'AI分析中心') {
      if (req.url === '/api/v1/analyze_risk') {
        sendJson(res, 200, {
          reportId: `risk-${Date.now()}`,
          userId: body.userId,
          scene: body.scene,
          riskLevel: ['low', 'low', 'medium'][Math.floor(Math.random() * 3)],
          riskScore: Math.floor(Math.random() * 30) + 5,
          factors: [
            { name: '设备指纹', score: 0.1, weight: 0.3 },
            { name: 'IP风险', score: 0.05, weight: 0.25 },
            { name: '行为模式', score: 0.15, weight: 0.45 },
          ],
          modelVersion: 'risk-v2.3.1',
          processedAt: new Date().toISOString(),
        });
        log(serviceName, 'green', `风险分析完成: ${body.userId}, 风险等级计算完毕`);
        return;
      }
      if (req.url === '/api/v1/predict_hazard') {
        sendJson(res, 200, {
          predictionId: `hazard-${Date.now()}`,
          hazards: [
            { type: 'transaction_anomaly', probability: 0.05, severity: 'low' },
            { type: 'account_takeover', probability: 0.02, severity: 'low' },
          ],
          modelVersion: 'hazard-v1.5.0',
        });
        log(serviceName, 'green', `风险预测完成`);
        return;
      }
    }

    if (serviceName === 'OpenClaw') {
      if (req.url === '/api/v1/execute') {
        sendJson(res, 200, {
          agentId: 'claw-ops-001',
          taskId: body.action,
          status: 'success',
          result: {
            executed: true,
            steps: 3,
            duration: Math.floor(Math.random() * 500) + 200,
            output: `[Mock OpenClaw] 任务 ${body.action} 已执行完成`,
          },
          executedAt: new Date().toISOString(),
        });
        log(serviceName, 'green', `智能体任务执行: ${body.action}`);
        return;
      }
    }

    if (serviceName === '区块链') {
      if (req.method === 'POST' && req.url === '/') {
        const rpcReq = body;
        if (rpcReq.method === 'eth_chainId') {
          sendJson(res, 200, { jsonrpc: '2.0', id: rpcReq.id, result: '0x539' });
          return;
        }
        if (rpcReq.method === 'eth_blockNumber') {
          const blockNum = '0x' + (18000000 + Math.floor(Math.random() * 1000000)).toString(16);
          sendJson(res, 200, { jsonrpc: '2.0', id: rpcReq.id, result: blockNum });
          return;
        }
        if (rpcReq.method === 'eth_gasPrice') {
          sendJson(res, 200, { jsonrpc: '2.0', id: rpcReq.id, result: '0x174876e800' });
          return;
        }
        sendJson(res, 200, { jsonrpc: '2.0', id: rpcReq.id, result: null });
        return;
      }
    }

    sendJson(res, 200, {
      service: serviceName,
      endpoint: req.url,
      method: req.method,
      received: body,
      processedAt: new Date().toISOString(),
      message: `[Mock ${serviceName}] 请求已接收并处理`,
    });
    log(serviceName, 'green', `${req.method} ${req.url} - 默认处理完成`);
  });
}

const aiCenterServer = makeServer(AI_CENTER_PORT, 'AI分析中心', 'magenta');
const openclawServer = makeServer(OPENCLAW_PORT, 'OpenClaw', 'cyan');
const blockchainServer = makeServer(BLOCKCHAIN_PORT, '区块链', 'green');

aiCenterServer.listen(AI_CENTER_PORT, () => {
  log('AI分析中心', 'magenta', `已启动 http://localhost:${AI_CENTER_PORT}`);
  log('AI分析中心', 'magenta', `健康检查: http://localhost:${AI_CENTER_PORT}/health`);
});
openclawServer.listen(OPENCLAW_PORT, () => {
  log('OpenClaw', 'cyan', `已启动 http://localhost:${OPENCLAW_PORT}`);
  log('OpenClaw', 'cyan', `健康检查: http://localhost:${OPENCLAW_PORT}/health`);
});
blockchainServer.listen(BLOCKCHAIN_PORT, () => {
  log('区块链', 'green', `已启动 http://localhost:${BLOCKCHAIN_PORT}`);
  log('区块链', 'green', `JSON-RPC 端点: http://localhost:${BLOCKCHAIN_PORT}/`);
  log('区块链', 'green', `健康检查: http://localhost:${BLOCKCHAIN_PORT}/health`);
});
console.log('');

process.on('SIGINT', () => {
  log('System', 'yellow', '正在关闭所有服务...');
  aiCenterServer.close();
  openclawServer.close();
  blockchainServer.close();
  process.exit(0);
});
