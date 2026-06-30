/**
 * 模拟 AI Gateway 服务 - 多模型 AI 统一网关
 *
 * 实现 OpenAI 兼容 API + 自定义 action 接口：
 *  - GET  /health
 *  - POST /v1/chat
 *  - POST /api/v1/generate_welcome
 *  - POST /api/v1/generate_report
 *  - POST /api/v1/analyze_text
 *  - POST /api/v1/recommend_model
 *
 * 启动：node scripts/mock-ai-gateway.js
 */

const http = require('http');

const PORT = 8000;
const LOG_PREFIX = '[Mock AI Gateway]';

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data, null, 2));
}

const startTime = Date.now();

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  log('blue', `${req.method} ${req.url}`);
  const url = req.url;

  if (url === '/health' && req.method === 'GET') {
    sendJson(res, 200, {
      status: 'ok',
      version: '1.0.0-mock',
      name: 'ZS AI Gateway',
      uptime: Date.now() - startTime,
      models: ['gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet', 'qwen-max', 'ernie-bot-4'],
      providers: {
        openai: 'configured',
        anthropic: 'configured',
        aliyun: 'configured',
      },
    });
    log('green', '健康检查通过 - AI Gateway 已就绪');
    return;
  }

  const body = await parseBody(req);

  if (url === '/v1/chat' && req.method === 'POST') {
    const messages = body.messages || [];
    const model = body.model || 'gpt-4';
    const userMsg = messages[messages.length - 1]?.content || '';

    let responseText = '';

    if (body.action === 'generate_welcome') {
      responseText = `欢迎使用中萨数字科技交易所！我是您的智能助手，${userMsg.includes('test-user-001') ? '很高兴为您服务' : '为您提供专业的数字资产交易服务'}`;
    } else if (body.action === 'generate_report') {
      responseText = `【AI风控分析报告】\n\n1. 风险等级：中低\n2. 主要风险点：账户行为正常，未发现异常交易\n3. 建议：可继续正常交易\n\n报告生成时间：${new Date().toLocaleString('zh-CN')}`;
    } else if (body.action === 'analyze_text') {
      responseText = `【情感分析】整体情感倾向：积极\n【关键词提取】测试、交易、安全\n【实体识别】[ORG:中萨数字科技] [PRODUCT:数字资产]`;
    } else if (body.action === 'recommend_model') {
      responseText = `推荐使用 gpt-4-turbo 模型，理由：在保持高质量响应的同时，具有更快的推理速度和更低的成本。`;
    } else {
      responseText = `[Mock AI Gateway] 已通过 ${model} 处理您的请求，内容长度：${userMsg.length} 字符。`;
    }

    const response = {
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: responseText,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: userMsg.length,
        completion_tokens: responseText.length,
        total_tokens: userMsg.length + responseText.length,
      },
      response: responseText,
      content: responseText,
    };
    sendJson(res, 200, response);
    log('green', `AI 调用成功 - 模型: ${model}, 动作: ${body.action || 'chat'}`);
    return;
  }

  if (url.startsWith('/api/v1/') && req.method === 'POST') {
    const action = url.replace('/api/v1/', '');
    sendJson(res, 200, {
      action,
      result: `[Mock AI] ${action} 已完成`,
      input: body,
      timestamp: new Date().toISOString(),
    });
    log('green', `自定义 AI 动作: ${action}`);
    return;
  }

  sendJson(res, 404, { error: 'Not Found', path: url });
});

server.listen(PORT, () => {
  log('green', `模拟 AI Gateway 服务已启动`);
  log('green', `地址: http://localhost:${PORT}`);
  log('green', `健康检查: http://localhost:${PORT}/health`);
  log('green', `聊天 API: http://localhost:${PORT}/v1/chat`);
  console.log('');
});
