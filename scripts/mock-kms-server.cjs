const http = require('http');

const PORT = Number(process.env.KMS_MOCK_PORT || 8787);
const HOST = process.env.KMS_MOCK_HOST || '127.0.0.1';
const TOKEN = process.env.KMS_MOCK_TOKEN || 'dev-kms-token';
const REQUIRE_AUTH = String(process.env.KMS_MOCK_REQUIRE_AUTH || 'true').toLowerCase() !== 'false';

/** @type {Map<string, { privateKeyBase58: string, keyId: string }>} */
const keyStore = new Map();

const preloadKeyRef = process.env.KMS_MOCK_PRELOAD_KEY_REF;
const preloadPrivateKey = process.env.KMS_MOCK_PRELOAD_PRIVATE_KEY;
if (preloadKeyRef && preloadPrivateKey) {
  keyStore.set(preloadKeyRef, {
    privateKeyBase58: preloadPrivateKey,
    keyId: process.env.KMS_MOCK_PRELOAD_KEY_ID || preloadKeyRef,
  });
}

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

function unauthorized(res) {
  return json(res, 401, {
    success: false,
    error: {
      code: 'KMS_UNAUTHORIZED',
      message: 'Invalid or missing bearer token.',
    },
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const requestId = req.headers['x-request-id'] || '';

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      success: true,
      data: {
        status: 'ok',
        keys: keyStore.size,
      },
    });
  }

  if (REQUIRE_AUTH) {
    const auth = String(req.headers.authorization || '');
    if (auth !== `Bearer ${TOKEN}`) {
      return unauthorized(res);
    }
  }

  if (req.method === 'POST' && req.url === '/register') {
    try {
      const body = await parseBody(req);
      const keyRef = String(body.keyRef || '').trim();
      const privateKeyBase58 = String(body.privateKeyBase58 || '').trim();
      const keyId = String(body.keyId || keyRef || '').trim();

      if (!keyRef || !privateKeyBase58) {
        return json(res, 400, {
          success: false,
          error: {
            code: 'KMS_PAYLOAD_INVALID',
            message: 'keyRef and privateKeyBase58 are required.',
          },
        });
      }

      keyStore.set(keyRef, {
        privateKeyBase58,
        keyId: keyId || keyRef,
      });

      return json(res, 200, {
        success: true,
        data: {
          keyRef,
          keyId: keyId || keyRef,
          stored: true,
          requestId,
        },
      });
    } catch (error) {
      return json(res, 400, {
        success: false,
        error: {
          code: 'KMS_PAYLOAD_INVALID',
          message: error instanceof Error ? error.message : 'Invalid request body',
        },
      });
    }
  }

  if (req.method === 'POST' && req.url === '/resolve') {
    try {
      const body = await parseBody(req);
      const keyRef = String(body.keyRef || '').trim();
      if (!keyRef) {
        return json(res, 400, {
          success: false,
          error: {
            code: 'KMS_PAYLOAD_INVALID',
            message: 'keyRef is required.',
          },
        });
      }

      const found = keyStore.get(keyRef);
      if (!found) {
        return json(res, 404, {
          success: false,
          error: {
            code: 'KMS_NOT_FOUND',
            message: `No key found for keyRef: ${keyRef}`,
          },
        });
      }

      return json(res, 200, {
        success: true,
        data: {
          privateKeyBase58: found.privateKeyBase58,
          keyId: found.keyId,
          requestId,
        },
      });
    } catch (error) {
      return json(res, 400, {
        success: false,
        error: {
          code: 'KMS_PAYLOAD_INVALID',
          message: error instanceof Error ? error.message : 'Invalid request body',
        },
      });
    }
  }

  return json(res, 404, {
    success: false,
    error: {
      code: 'KMS_NOT_FOUND',
      message: `Route not found: ${req.method} ${req.url}`,
    },
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[kms-mock] listening on http://${HOST}:${PORT}`);
  console.log(`[kms-mock] auth required: ${REQUIRE_AUTH}`);
  console.log(`[kms-mock] resolve endpoint: http://${HOST}:${PORT}/resolve`);
});
