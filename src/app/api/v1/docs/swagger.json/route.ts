import { NextRequest, NextResponse } from 'next/server';

const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'ZS Exchange API',
    version: '1.0.0',
    description: 'ZS Stock Exchange DAPP - REST API Documentation',
    contact: {
      name: 'API Support',
      email: 'support@zs-exchange.com',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string', nullable: true },
          kycLevel: { type: 'integer' },
          userType: { type: 'string' },
          vipLevel: { type: 'integer' },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Ticker: {
        type: 'object',
        properties: {
          symbol: { type: 'string' },
          lastPrice: { type: 'string' },
          highPrice: { type: 'string' },
          lowPrice: { type: 'string' },
          volume24h: { type: 'string' },
          change24h: { type: 'string' },
          changePercent24h: { type: 'string' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          symbol: { type: 'string' },
          side: { type: 'string', enum: ['buy', 'sell'] },
          type: { type: 'string', enum: ['market', 'limit'] },
          price: { type: 'string' },
          amount: { type: 'string' },
          status: { type: 'string' },
          filledAmount: { type: 'string' },
          remainingAmount: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Balance: {
        type: 'object',
        properties: {
          currency: { type: 'string' },
          type: { type: 'string' },
          available: { type: 'string' },
          frozen: { type: 'string' },
          total: { type: 'string' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'User', description: 'User management endpoints' },
    { name: 'Market', description: 'Market data endpoints' },
    { name: 'Trade', description: 'Trading endpoints' },
    { name: 'Wallet', description: 'Wallet and fund management endpoints' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  phone: { type: 'string' },
                  referralCode: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Registration successful' },
          '400': { description: 'Bad request' },
          '409': { description: 'User already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token refreshed' },
          '401': { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'User logout',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/user/profile': {
      get: {
        tags: ['User'],
        summary: 'Get user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: { type: 'string' },
                  countryCode: { type: 'string' },
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/market/tickers': {
      get: {
        tags: ['Market'],
        summary: 'Get all tickers',
        parameters: [
          {
            name: 'symbols',
            in: 'query',
            schema: { type: 'string' },
            description: 'Comma-separated list of symbols',
          },
        ],
        responses: {
          '200': { description: 'List of tickers' },
        },
      },
    },
    '/market/pairs': {
      get: {
        tags: ['Market'],
        summary: 'Get trading pairs',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'List of trading pairs' },
        },
      },
    },
    '/market/klines/{symbol}': {
      get: {
        tags: ['Market'],
        summary: 'Get K-line data',
        parameters: [
          { name: 'symbol', in: 'path', required: true, schema: { type: 'string' } },
          {
            name: 'interval',
            in: 'query',
            schema: { type: 'string', default: '1h' },
            description: 'K-line interval (1m,5m,15m,30m,1h,2h,4h,6h,12h,1d,1w,1M)',
          },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 500 } },
          { name: 'startTime', in: 'query', schema: { type: 'integer' } },
          { name: 'endTime', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          '200': { description: 'K-line data' },
        },
      },
    },
    '/market/depth/{symbol}': {
      get: {
        tags: ['Market'],
        summary: 'Get order book depth',
        parameters: [
          { name: 'symbol', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'Order book depth' },
        },
      },
    },
    '/trade/orders': {
      get: {
        tags: ['Trade'],
        summary: 'Get order history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'symbol', in: 'query', schema: { type: 'string' } },
          { name: 'side', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Order history' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Trade'],
        summary: 'Create a new order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol', 'side', 'type', 'amount'],
                properties: {
                  symbol: { type: 'string' },
                  side: { type: 'string', enum: ['buy', 'sell'] },
                  type: { type: 'string', enum: ['market', 'limit'] },
                  price: { type: 'string' },
                  amount: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Order created' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Trade'],
        summary: 'Cancel an order',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderId'],
                properties: {
                  orderId: { type: 'string' },
                  symbol: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Order cancelled' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '404': { description: 'Order not found' },
        },
      },
    },
    '/trade/trades': {
      get: {
        tags: ['Trade'],
        summary: 'Get trade history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'symbol', in: 'query', schema: { type: 'string' } },
          { name: 'side', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Trade history' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/wallet/balances': {
      get: {
        tags: ['Wallet'],
        summary: 'Get wallet balances',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'currency', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string', default: 'all' } },
        ],
        responses: {
          '200': { description: 'Wallet balances' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/wallet/deposits': {
      get: {
        tags: ['Wallet'],
        summary: 'Get deposit history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'currency', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Deposit history' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Wallet'],
        summary: 'Get deposit address',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currency'],
                properties: {
                  currency: { type: 'string' },
                  chain: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Deposit address' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/wallet/withdrawals': {
      get: {
        tags: ['Wallet'],
        summary: 'Get withdrawal history',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'currency', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Withdrawal history' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Wallet'],
        summary: 'Create withdrawal',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currency', 'amount', 'address'],
                properties: {
                  currency: { type: 'string' },
                  amount: { type: 'string' },
                  address: { type: 'string' },
                  chain: { type: 'string' },
                  memo: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Withdrawal created' },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
        },
      },
    },
  },
};

export async function GET(req: NextRequest) {
  return NextResponse.json(swaggerSpec);
}
