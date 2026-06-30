# ZS Exchange 从30%到100%地狱级执行方案

**文档版本**：v1.0  
**编制日期**：2026-06-25  
**密级**：内部绝密  
**适用范围**：全技术团队 + 产品团队 + 运维团队  
**编制原则**：5W2H全覆盖、零精简、零假设、可执行、可验收

---

## 目录

- [第一部分：执行摘要与现状全景分析](#第一部分执行摘要与现状全景分析)
- [第二部分：数据库层从30%到100%的完整设计方案](#第二部分数据库层从30到100的完整设计方案)
- [第三部分：API层从1%到100%的完整设计方案](#第三部分api层从1到100的完整设计方案)
- [第四部分：前端UI从33%到100%的完成方案](#第四部分前端ui从33到100的完成方案)
- [第五部分：加密货币行情数据对接地狱级方案](#第五部分加密货币行情数据对接地狱级方案)
- [第六部分：5W2H分阶段执行计划](#第六部分5w2h分阶段执行计划)
- [第七部分：人力、资源与预算清单](#第七部分人力资源与预算清单)
- [第八部分：风险清单与应对策略](#第八部分风险清单与应对策略)
- [附录A：外部服务商对接清单](#附录a外部服务商对接清单)
- [附录B：代码规范与验收标准](#附录b代码规范与验收标准)

---

## 第一部分：执行摘要与现状全景分析

### 1.1 项目资产清单（精确到文件级）

#### 1.1.1 已确认的资产

| 资产类别 | 数量 | 位置 | 状态 |
|----------|------|------|------|
| 业务逻辑TS文件 | 275个 | src/lib/ | 100%可用 |
| 前端页面文件 | 375个 page.tsx | src/app/ | 33%完整 |
| 前端组件文件 | 63个 .tsx | src/components/ | 可用 |
| 自定义Hooks | 9个 | src/hooks/ | 可用 |
| Webhook接口 | 2个 | src/app/api/webhooks/ | 可用 |
| 数据库初始化脚本 | 1个 | infra/local-deploy/conf/postgres/init.sql | 30%完成 |
| 文档文件 | 25+ | docs/ | 持续更新 |
| Android项目 | 1个 | android/ | 骨架 |
| Flutter项目 | 1个 | mobile/ | 骨架 |
| 部署脚本 | 40+ | *.ps1 | 可用 |

#### 1.1.2 缺失的资产（必须补齐）

| 缺失类别 | 预估数量 | 当前状态 | 优先级 |
|----------|----------|----------|--------|
| 数据库核心业务表 | 120+张表 | 未设计 | P0 |
| 业务API路由 | 200+个接口 | 未开发 | P0 |
| 完整前端页面 | ~250个页面需完善 | 骨架/占位 | P0 |
| 单元测试文件 | 500+个测试用例 | 未开发 | P1 |
| 集成测试脚本 | 50+个场景 | 未开发 | P1 |
| K8s生产部署配置 | 20+个YAML | 未开发 | P1 |
| CI/CD流水线 | 3套环境 | 未配置 | P1 |
| 监控告警规则 | 100+条规则 | 未配置 | P2 |
| 日志聚合配置 | 1套ELK/Loki | 未配置 | P2 |

### 1.2 技术栈确认（已锁定，不可变更）

| 层级 | 技术选型 | 版本 | 用途 | 变更风险 |
|------|----------|------|------|----------|
| 前端框架 | Next.js | 14.1.0 | SSR/SSG/App Router | 高 |
| UI组件库 | shadcn/ui + Tailwind CSS | 3.4.0 | 样式系统 | 中 |
| 状态管理 | Zustand | 4.4.7 | 客户端状态 | 低 |
| 服务端状态 | TanStack React Query | 5.15.5 | 数据获取/缓存 | 低 |
| Web3连接 | Wagmi + Viem | 2.19.5/2.53.1 | 钱包连接 | 中 |
| 图表库 | Recharts + ECharts | 5.4.3 | 数据可视化 | 低 |
| 后端运行时 | Next.js API Routes | 14.1.0 | API服务 | 高 |
| 数据库 | PostgreSQL | 15+ | 主数据库 | 高 |
| 缓存 | Redis | 7+ | 会话/缓存/队列 | 中 |
| 消息队列 | Redis Streams / BullMQ | - | 异步任务 | 中 |
| 搜索引擎 | Elasticsearch | 8+ | 日志/搜索 | 低 |
| 移动端 | Flutter + Capacitor | 3.19+ | 跨平台App | 中 |
| 容器编排 | Kubernetes | 1.28+ | 生产部署 | 中 |

### 1.3 核心架构图（当前 vs 目标）

```
【当前架构 - 瘸腿状态】

  用户浏览器/App
       |
       v
  ┌─────────────────────────────────────────────┐
  │  前端层 (Next.js)                              │
  │  ├─ 完整页面: ~50个                            │
  │  ├─ 骨架页面: ~250个                           │
  │  └─ 组件库: 63个                               │
  └─────────────────────────────────────────────┘
       |                                    |
       | (缺少API连接)                       | (直接调用，无API)
       v                                    v
  ┌─────────────────────────────────────────────┐
  │  API层                                        │
  │  ├─ Webhook: 2个 (MoonPay/Alchemy)           │
  │  └─ 业务API: 0个                              │
  └─────────────────────────────────────────────┘
       |                                    |
       | (缺少持久化)                          | (内存运行)
       v                                    v
  ┌─────────────────────────────────────────────┐
  │  业务逻辑层 (src/lib/)                         │
  │  ├─ 32个模块, 275个TS文件                     │
  │  ├─ 撮合引擎/钱包/DeFi/风控 等                │
  │  └─ 全部在内存运行，无持久化                  │
  └─────────────────────────────────────────────┘
       |
       | (缺少数据库连接)
       v
  ┌─────────────────────────────────────────────┐
  │  数据库层 (PostgreSQL)                         │
  │  ├─ core.users (用户表)                       │
  │  ├─ audit.logs (审计日志)                     │
  │  └─ blockchain.notarizations (存证)           │
  └─────────────────────────────────────────────┘

【目标架构 - 完整状态】

  用户浏览器/App
       |
       v
  ┌─────────────────────────────────────────────┐
  │  前端层 (Next.js + Flutter)                    │
  │  ├─ Web端: 150+完整页面                        │
  │  ├─ H5端: 80+完整页面                          │
  │  ├─ Admin后台: 60+完整页面                     │
  │  └─ App端: Flutter完整实现                     │
  └─────────────────────────────────────────────┘
       |
       | REST API / WebSocket / tRPC
       v
  ┌─────────────────────────────────────────────┐
  │  API网关层 (Next.js API Routes)                │
  │  ├─ REST API: 200+个接口                       │
  │  ├─ WebSocket: 行情推送/实时通知               │
  │  ├─ Webhook: 外部服务回调                      │
  │  └─ 中间件: 鉴权/限流/日志/错误处理            │
  └─────────────────────────────────────────────┘
       |
       v
  ┌─────────────────────────────────────────────┐
  │  业务逻辑层 (src/lib/)                         │
  │  ├─ 32个模块 (已有，需接入数据库)              │
  │  └─ 新增: 数据库Repository层                   │
  └─────────────────────────────────────────────┘
       |
       | Prisma ORM / Raw SQL
       v
  ┌─────────────────────────────────────────────┐
  │  数据库层 (PostgreSQL 15+)                     │
  │  ├─ 10个Schema                                 │
  │  ├─ 120+张业务表                               │
  │  ├─ 200+个索引                                 │
  │  ├─ 50+个存储过程/函数                         │
  │  └─ 分区表: 订单/成交/日志                     │
  └─────────────────────────────────────────────┘
       |
       v
  ┌─────────────────────────────────────────────┐
  │  缓存与消息层 (Redis 7+)                       │
  │  ├─ Session存储                                │
  │  ├─ 行情缓存                                   │
  │  ├─ 限频计数器                                 │
  │  └─ 任务队列 (BullMQ)                          │
  └─────────────────────────────────────────────┘
       |
       v
  ┌─────────────────────────────────────────────┐
  │  外部服务层                                    │
  │  ├─ 行情聚合: Binance/Kaiko/CoinGecko         │
  │  ├─ 链上数据: Nansen/Alchemy/Infura           │
  │  ├─ 支付: Stripe/Adyen/MoonPay                │
  │  ├─ KYC: 阿里云/OCR/活体检测                  │
  │  ├─ 通知: Twilio/SendGrid/FCM                 │
  │  └─ 预言机: Chainlink                         │
  └─────────────────────────────────────────────┘
```

---

## 第二部分：数据库层从30%到100%的完整设计方案

### 2.1 设计原则与约束

#### 2.1.1 必须遵守的10条铁律

1. **所有表必须有主键**：禁用无主见表，主键统一使用UUIDv7（时间有序，利于B+树索引）
2. **所有表必须有created_at/updated_at**：使用TIMESTAMPTZ，默认NOW()
3. **所有金额字段使用DECIMAL(36,18)**：禁止使用FLOAT/DOUBLE存储资金
4. **所有外键必须建立索引**：查询性能保障
5. **所有删除必须是软删除**：添加deleted_at字段，物理删除禁止
6. **所有JSON字段必须使用JSONB**：GIN索引支持
7. **所有枚举使用CHECK约束**：不用PostgreSQL原生ENUM（变更困难）
8. **所有大表必须分区**：按时间范围分区（订单、成交、日志）
9. **所有敏感数据必须加密存储**：API密钥、私钥片段使用AES-256加密
10. **所有变更必须版本控制**：数据库迁移使用Prisma Migrate，禁止手动改表

#### 2.1.2 Schema划分（10个，已存在8个需补充）

```sql
-- 已存在Schema（需扩充）
CREATE SCHEMA IF NOT EXISTS core;        -- 用户/认证/权限/配置
CREATE SCHEMA IF NOT EXISTS trade;       -- 交易/订单/成交/账本
CREATE SCHEMA IF NOT EXISTS wallet;      -- 钱包/资产/充提/地址
CREATE SCHEMA IF NOT EXISTS kyc;         -- KYC/实名/合规检查
CREATE SCHEMA IF NOT EXISTS nft;         -- NFT/系列/铸造/市场
CREATE SCHEMA IF NOT EXISTS defi;        -- DeFi/质押/流动性/收益
CREATE SCHEMA IF NOT EXISTS blockchain;  -- 链上数据/存证/监听
CREATE SCHEMA IF NOT EXISTS ai;          -- AI模型/智能体/分析结果

-- 需新增Schema
CREATE SCHEMA IF NOT EXISTS market;      -- 行情/K线/交易对/深度
CREATE SCHEMA IF NOT EXISTS audit;       -- 审计日志/操作记录/变更追踪
CREATE SCHEMA IF NOT EXISTS settlement;  -- 结算/清算/资金流水
```

### 2.2 core Schema - 用户与认证（扩充现有3张表到15张表）

#### 2.2.1 core.users（现有，需扩充字段）

```sql
-- 现有表结构（保留）
CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    country_code CHAR(2) DEFAULT 'CN',
    status VARCHAR(20) DEFAULT 'active',
    kyc_level INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 需要增加的字段（ALTER TABLE）
ALTER TABLE core.users ADD COLUMN IF NOT EXISTS 
    referral_code VARCHAR(20) UNIQUE,           -- 邀请码
    referred_by UUID REFERENCES core.users(id), -- 邀请人
    user_type VARCHAR(20) DEFAULT 'retail'      -- retail|vip|institution|market_maker
        CHECK (user_type IN ('retail','vip','institution','market_maker')),
    vip_level INT DEFAULT 0                     -- VIP等级 0-10
        CHECK (vip_level >= 0 AND vip_level <= 10),
    fee_discount DECIMAL(5,4) DEFAULT 0.0000,   -- 手续费折扣
    trading_enabled BOOLEAN DEFAULT FALSE,      -- 是否开启交易
    withdrawal_enabled BOOLEAN DEFAULT FALSE,   -- 是否开启提币
    deposit_enabled BOOLEAN DEFAULT TRUE,       -- 是否开启充值
    last_login_at TIMESTAMPTZ,                  -- 最后登录时间
    last_login_ip INET,                         -- 最后登录IP
    last_password_change TIMESTAMPTZ,           -- 最后改密时间
    password_history JSONB DEFAULT '[]',        -- 历史密码哈希（防复用）
    security_settings JSONB DEFAULT '{          -- 安全设置JSON
        "2fa_enabled": false,
        "2fa_method": null,
        "anti_phishing_code": null,
        "login_notification": true,
        "withdrawal_whitelist": false
    }',
    preferences JSONB DEFAULT '{                -- 用户偏好
        "language": "zh-CN",
        "currency": "USDT",
        "timezone": "Asia/Shanghai",
        "theme": "dark",
        "price_precision": 2,
        "amount_precision": 6
    }',
    risk_profile JSONB DEFAULT '{               -- 风险画像
        "trading_volume_24h": "0",
        "trading_volume_30d": "0",
        "order_count_24h": 0,
        "max_position_value": "0",
        "risk_score": 100
    }',
    deleted_at TIMESTAMPTZ,                     -- 软删除标记
    deleted_reason VARCHAR(100);                -- 删除原因

-- 需要新增的索引
CREATE INDEX IF NOT EXISTS idx_users_referral ON core.users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON core.users(referred_by);
CREATE INDEX IF NOT EXISTS idx_users_status ON core.users(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_kyc ON core.users(kyc_level, status);
CREATE INDEX IF NOT EXISTS idx_users_type ON core.users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_created ON core.users(created_at);

-- 触发器：自动更新updated_at
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_users_updated_at ON core.users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();
```

#### 2.2.2 core.sessions（新增 - 会话管理）

```sql
CREATE TABLE IF NOT EXISTS core.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,           -- JWT token哈希
    refresh_token_hash VARCHAR(255),            -- 刷新token哈希
    device_info JSONB NOT NULL DEFAULT '{}',    -- 设备信息
    ip_address INET,                            -- IP地址
    user_agent TEXT,                            -- UA
    status VARCHAR(20) DEFAULT 'active'         -- active|expired|revoked|blocked
        CHECK (status IN ('active','expired','revoked','blocked')),
    expires_at TIMESTAMPTZ NOT NULL,            -- 过期时间
    last_active_at TIMESTAMPTZ DEFAULT NOW(),   -- 最后活跃
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,                     -- 吊销时间
    revoked_reason VARCHAR(100)                 -- 吊销原因
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON core.sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON core.sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON core.sessions(expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON core.sessions(ip_address);
```

#### 2.2.3 core.mfa_methods（新增 - 多因素认证）

```sql
CREATE TABLE IF NOT EXISTS core.mfa_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL            -- totp|sms|email|webauthn|backup_codes
        CHECK (method_type IN ('totp','sms','email','webauthn','backup_codes')),
    secret_encrypted TEXT,                      -- 加密后的密钥
    verified_at TIMESTAMPTZ,                    -- 验证时间
    is_primary BOOLEAN DEFAULT FALSE,           -- 是否主认证方式
    is_enabled BOOLEAN DEFAULT TRUE,
    used_count INT DEFAULT 0,                   -- 使用次数
    last_used_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',                -- 额外配置
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, method_type)
);

CREATE INDEX IF NOT EXISTS idx_mfa_user ON core.mfa_methods(user_id, is_enabled);
```

#### 2.2.4 core.api_keys（新增 - API密钥管理）

```sql
CREATE TABLE IF NOT EXISTS core.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    key_prefix VARCHAR(16) NOT NULL,            -- 密钥前缀（用于日志识别）
    key_hash VARCHAR(255) NOT NULL,             -- 密钥哈希
    secret_encrypted TEXT NOT NULL,             -- 加密后的完整密钥
    name VARCHAR(100) NOT NULL DEFAULT 'API Key',
    permissions JSONB NOT NULL DEFAULT '["read"]', -- 权限列表
    ip_whitelist TEXT[],                        -- IP白名单
    rate_limit_tier VARCHAR(20) DEFAULT 'standard', -- standard|vip|enterprise
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('active','expired','revoked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revoked_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_apikeys_user ON core.api_keys(user_id, status);
CREATE INDEX IF NOT EXISTS idx_apikeys_prefix ON core.api_keys(key_prefix);
```

#### 2.2.5 core.login_history（新增 - 登录历史）

```sql
CREATE TABLE IF NOT EXISTS core.login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    login_type VARCHAR(20) NOT NULL             -- password|2fa|oauth|api_key|biometric
        CHECK (login_type IN ('password','2fa','oauth','api_key','biometric')),
    status VARCHAR(20) NOT NULL                 -- success|failed|blocked|suspicious
        CHECK (status IN ('success','failed','blocked','suspicious')),
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),            -- 设备指纹
    location JSONB,                             -- 地理位置
    failure_reason VARCHAR(100),                -- 失败原因
    session_id UUID REFERENCES core.sessions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 按月分区
CREATE TABLE IF NOT EXISTS core.login_history_2026_01 PARTITION OF core.login_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE IF NOT EXISTS core.login_history_2026_02 PARTITION OF core.login_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- 以此类推，需要自动化脚本创建未来分区

CREATE INDEX IF NOT EXISTS idx_login_history_user ON core.login_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON core.login_history(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON core.login_history(status, created_at DESC);
```

#### 2.2.6 core.system_configs（新增 - 系统配置）

```sql
CREATE TABLE IF NOT EXISTS core.system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,    -- 配置键
    config_value TEXT NOT NULL,                 -- 配置值
    config_type VARCHAR(20) DEFAULT 'string'    -- string|number|boolean|json
        CHECK (config_type IN ('string','number','boolean','json')),
    description TEXT,                           -- 配置说明
    is_editable BOOLEAN DEFAULT TRUE,           -- 是否可编辑
    is_sensitive BOOLEAN DEFAULT FALSE,         -- 是否敏感（日志脱敏）
    category VARCHAR(50) DEFAULT 'general',     -- 分类
    updated_by UUID REFERENCES core.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 预置系统配置
INSERT INTO core.system_configs (config_key, config_value, config_type, description, category) VALUES
('trading.enabled', 'true', 'boolean', '全局交易开关', 'trading'),
('trading.maintenance_message', '系统维护中', 'string', '维护提示消息', 'trading'),
('withdrawal.daily_limit_usdt', '100000', 'number', '每日提现限额(USDT)', 'withdrawal'),
('withdrawal.min_amount_usdt', '10', 'number', '最小提现金额(USDT)', 'withdrawal'),
('kyc.required_for_trading', 'true', 'boolean', '交易是否需要KYC', 'kyc'),
('kyc.required_for_withdrawal', 'true', 'boolean', '提币是否需要KYC', 'kyc'),
('fees.spot_maker_bps', '10', 'number', '现货maker手续费(万分比)', 'fees'),
('fees.spot_taker_bps', '20', 'number', '现货taker手续费(万分比)', 'fees'),
('fees.perp_maker_bps', '2', 'number', '合约maker手续费(万分比)', 'fees'),
('fees.perp_taker_bps', '5', 'number', '合约taker手续费(万分比)', 'fees'),
('security.max_login_attempts', '5', 'number', '最大登录尝试次数', 'security'),
('security.lockout_duration_minutes', '30', 'number', '锁定时长(分钟)', 'security'),
('security.session_ttl_hours', '24', 'number', '会话有效期(小时)', 'security'),
('market.price_update_interval_ms', '100', 'number', '价格更新间隔(ms)', 'market'),
('market.kline_intervals', '["1m","5m","15m","1h","4h","1d","1w","1M"]', 'json', '支持的K线周期', 'market')
ON CONFLICT (config_key) DO NOTHING;
```

#### 2.2.7 core.roles & core.permissions & core.user_roles（新增 - RBAC权限）

```sql
CREATE TABLE IF NOT EXISTS core.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,            -- 系统内置角色不可删除
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.permissions (
    id SERIAL PRIMARY KEY,
    resource VARCHAR(50) NOT NULL,              -- 资源名
    action VARCHAR(50) NOT NULL,                -- 操作名
    description TEXT,
    UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS core.role_permissions (
    role_id INT REFERENCES core.roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES core.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS core.user_roles (
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    role_id INT REFERENCES core.roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES core.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,                     -- 角色过期时间（临时权限）
    PRIMARY KEY (user_id, role_id)
);

-- 预置角色
INSERT INTO core.roles (name, description, is_system) VALUES
('super_admin', '超级管理员', TRUE),
('admin', '管理员', TRUE),
('support', '客服', TRUE),
('compliance_officer', '合规官', TRUE),
('risk_manager', '风控经理', TRUE),
('market_maker', '做市商', TRUE),
('vip_user', 'VIP用户', TRUE),
('standard_user', '普通用户', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 预置权限（部分示例）
INSERT INTO core.permissions (resource, action, description) VALUES
('user', 'read', '查看用户'),
('user', 'update', '修改用户'),
('user', 'delete', '删除用户'),
('user', 'block', '封禁用户'),
('order', 'read', '查看订单'),
('order', 'cancel', '取消订单'),
('wallet', 'read', '查看钱包'),
('wallet', 'freeze', '冻结资金'),
('kyc', 'read', '查看KYC'),
('kyc', 'approve', '审批KYC'),
('system', 'config', '修改系统配置'),
('audit', 'read', '查看审计日志')
ON CONFLICT (resource, action) DO NOTHING;
```

---

## 第三部分：API层从1%到100%的完整设计方案

### 3.1 API设计总览

#### 3.1.1 接口分类与数量统计

| 类别 | 接口数量 | 认证方式 | 限流策略 |
|------|----------|----------|----------|
| 认证API | 12 | 无/Refresh Token | 5次/分钟（登录） |
| 用户API | 18 | Bearer JWT | 100次/分钟 |
| 交易API | 35 | Bearer JWT + 交易密码 | 50次/秒 |
| 钱包API | 28 | Bearer JWT + 2FA | 30次/分钟 |
| 行情API | 20 | 可选 | 1000次/分钟 |
| DeFi API | 25 | Bearer JWT | 100次/分钟 |
| KYC API | 15 | Bearer JWT | 30次/分钟 |
| 通知API | 10 | Bearer JWT | 60次/分钟 |
| Admin API | 45 | Bearer JWT + RBAC | 200次/分钟 |
| Webhook | 8 | HMAC签名 | 无限制（需验签） |
| WebSocket | 6 | JWT参数 | 连接数限制 |
| **总计** | **222** | - | - |

#### 3.1.2 API路由规划（Next.js App Router）

```
src/app/api/
├── v1/
│   ├── auth/
│   │   ├── register/route.ts           POST   用户注册
│   │   ├── login/route.ts              POST   用户登录
│   │   ├── logout/route.ts             POST   登出
│   │   ├── refresh/route.ts            POST   刷新Token
│   │   ├── password/
│   │   │   ├── forgot/route.ts         POST   忘记密码
│   │   │   ├── reset/route.ts          POST   重置密码
│   │   │   └── change/route.ts         POST   修改密码
│   │   ├── 2fa/
│   │   │   ├── setup/route.ts          POST   设置2FA
│   │   │   ├── verify/route.ts         POST   验证2FA
│   │   │   └── disable/route.ts        POST   关闭2FA
│   │   └── session/
│   │       └── route.ts                GET    获取会话列表
│   │                                    DELETE 吊销会话
│   ├── users/
│   │   ├── me/route.ts                 GET    获取当前用户
│   │   │                                PATCH  更新用户信息
│   │   ├── me/preferences/route.ts     GET    获取偏好设置
│   │   │                                PATCH  更新偏好设置
│   │   ├── me/security/route.ts        GET    获取安全设置
│   │   │                                PATCH  更新安全设置
│   │   ├── me/activities/route.ts      GET    用户活动日志
│   │   └── [id]/route.ts               GET    获取指定用户（Admin）
│   ├── trading/
│   │   ├── pairs/route.ts              GET    获取交易对列表
│   │   ├── pairs/[symbol]/route.ts     GET    获取交易对详情
│   │   ├── orders/route.ts             GET    获取订单列表
│   │   │                                POST   创建订单
│   │   ├── orders/[id]/route.ts        GET    获取订单详情
│   │   │                                DELETE 取消订单
│   │   ├── trades/route.ts             GET    获取成交记录
│   │   ├── depth/route.ts              GET    获取深度数据
│   │   └── history/route.ts            GET    获取历史委托
│   ├── wallet/
│   │   ├── balances/route.ts           GET    获取资产余额
│   │   ├── deposits/route.ts           GET    获取充值记录
│   │   │                                POST   创建充值地址
│   │   ├── withdrawals/route.ts        GET    获取提币记录
│   │   │                                POST   创建提币申请
│   │   ├── withdrawals/[id]/route.ts   GET    获取提币详情
│   │   │                                DELETE 取消提币
│   │   ├── transfer/route.ts           POST   内部转账
│   │   ├── addresses/route.ts          GET    获取地址列表
│   │   └── history/route.ts            GET    获取资金流水
│   ├── market/
│   │   ├── tickers/route.ts            GET    获取所有Ticker
│   │   ├── tickers/[symbol]/route.ts   GET    获取指定Ticker
│   │   ├── klines/route.ts             GET    获取K线数据
│   │   ├── trades/route.ts             GET    获取最新成交
│   │   ├── depth/route.ts              GET    获取订单簿
│   │   └── alert/route.ts              POST   设置价格提醒
│   │                                    GET    获取价格提醒
│   │                                    DELETE 删除价格提醒
│   ├── defi/
│   │   ├── swap/route.ts               POST   执行兑换
│   │   ├── pools/route.ts              GET    获取流动性池
│   │   │                                POST   添加流动性
│   │   ├── pools/[id]/route.ts         GET    获取池详情
│   │   │                                DELETE 移除流动性
│   │   ├── stake/route.ts              POST   质押
│   │   │                                DELETE 解除质押
│   │   ├── yield/route.ts              GET    获取收益列表
│   │   └── farming/route.ts            GET    获取挖矿列表
│   │                                    POST   参与挖矿
│   ├── kyc/
│   │   ├── status/route.ts             GET    获取KYC状态
│   │   ├── submit/route.ts             POST   提交KYC资料
│   │   ├── documents/route.ts          GET    获取文档列表
│   │   │                                POST   上传文档
│   │   └── liveness/route.ts           POST   活体检测
│   ├── notifications/
│   │   ├── route.ts                    GET    获取通知列表
│   │   │                                PATCH  标记已读
│   │   │                                DELETE 删除通知
│   │   ├── settings/route.ts           GET    获取通知设置
│   │   │                                PATCH  更新通知设置
│   │   └── unread/route.ts             GET    获取未读数量
│   └── admin/
│       ├── users/route.ts              GET    用户列表
│       │                                PATCH  批量操作用户
│       ├── users/[id]/route.ts         GET    用户详情
│       │                                PATCH  修改用户
│       │                                DELETE 删除用户
│       ├── orders/route.ts             GET    全站订单
│       ├── deposits/route.ts           GET    充值审核列表
│       │                                PATCH  审核充值
│       ├── withdrawals/route.ts        GET    提币审核列表
│       │                                PATCH  审核提币
│       ├── system/config/route.ts      GET    系统配置
│       │                                PATCH  修改配置
│       ├── audit/route.ts              GET    审计日志
│       └── stats/route.ts              GET    统计数据
├── webhooks/
│   ├── moonpay/route.ts                POST   MoonPay回调
│   ├── alchemy/route.ts                POST   Alchemy回调
│   ├── stripe/route.ts                 POST   Stripe回调
│   ├── adyen/route.ts                  POST   Adyen回调
│   └── chainlink/route.ts              POST   Chainlink回调
└── ws/
    ├── market/route.ts                 WS     行情推送
    ├── user/route.ts                   WS     用户通知
    └── orderbook/route.ts              WS     深度推送
```

### 3.2 核心API接口详细定义

#### 3.2.1 认证API

**POST /api/v1/auth/register - 用户注册**

```typescript
// Request
interface RegisterRequest {
  email: string;           // 邮箱，必填，格式校验
  password: string;        // 密码，必填，8-32位，含大小写+数字+特殊字符
  confirmPassword: string; // 确认密码
  referralCode?: string;   // 邀请码，可选
  captchaToken: string;    // 验证码Token
  agreeTerms: boolean;     // 同意条款
}

// Response 201
interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
  requiresEmailVerification: boolean;
}

// Response 400 - 参数错误
// Response 409 - 邮箱已存在
// Response 429 - 请求过频
```

**POST /api/v1/auth/login - 用户登录**

```typescript
// Request
interface LoginRequest {
  email: string;
  password: string;
  captchaToken?: string;    // 失败次数>3时需要
  deviceInfo?: {            // 设备信息
    type: 'web' | 'ios' | 'android';
    fingerprint: string;
  };
}

// Response 200
interface LoginResponse {
  accessToken: string;      // JWT，有效期24小时
  refreshToken: string;     // 刷新Token，有效期30天
  expiresIn: number;        // 过期时间（秒）
  tokenType: 'Bearer';
  user: {
    id: string;
    email: string;
    username: string;
    kycLevel: number;
    tradingEnabled: boolean;
    withdrawalEnabled: boolean;
  };
  requires2FA: boolean;     // 是否需要2FA验证
}

// Response 401 - 密码错误
// Response 403 - 账户被冻结
// Response 423 - 账户被锁定（30分钟）
```

#### 3.2.2 交易API

**POST /api/v1/trading/orders - 创建订单**

```typescript
// Request Headers
// Authorization: Bearer {accessToken}
// X-Trade-Password: {tradePassword}  // 如果开启交易密码

// Request Body
interface CreateOrderRequest {
  symbol: string;           // 交易对，如 "BTCUSDT"
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop_limit' | 'iceberg';
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
  
  // 限价单必填
  price?: string;           // 价格，字符串防止精度丢失
  
  // 止损单必填
  stopPrice?: string;
  
  quantity: string;         // 数量
  
  // 冰山单必填
  visibleQuantity?: string;
  
  clientOrderId?: string;   // 客户端自定义ID，最大50字符
}

// Response 201
interface CreateOrderResponse {
  orderId: string;
  clientOrderId?: string;
  symbol: string;
  side: string;
  type: string;
  price: string;
  quantity: string;
  status: 'new';
  createdAt: string;
}

// Response 400 - 参数错误（含详细字段错误）
// Response 401 - 未认证
// Response 403 - 未开启交易权限/KYC不足
// Response 409 - 余额不足
```

**GET /api/v1/trading/orders - 获取订单列表**

```typescript
// Query Parameters
interface GetOrdersQuery {
  symbol?: string;          // 交易对过滤
  status?: 'new' | 'partially_filled' | 'filled' | 'cancelled' | 'all';
  side?: 'buy' | 'sell';
  type?: 'limit' | 'market';
  startTime?: string;       // ISO 8601
  endTime?: string;
  page?: number;            // 默认1
  pageSize?: number;        // 默认20，最大100
}

// Response 200
interface GetOrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
```

#### 3.2.3 钱包API

**GET /api/v1/wallet/balances - 获取资产余额**

```typescript
// Response 200
interface GetBalancesResponse {
  data: Array<{
    asset: string;
    assetName: string;
    assetLogo: string;
    available: string;
    frozen: string;
    locked: string;
    total: string;
    btcValue: string;       // BTC估值
    usdtValue: string;      // USDT估值
    price: string;          // 当前价格
    priceChange24h: string;
  }>;
  totalBtcValue: string;
  totalUsdtValue: string;
}
```

**POST /api/v1/wallet/withdrawals - 创建提币申请**

```typescript
// Request Headers
// Authorization: Bearer {accessToken}
// X-2FA-Code: {totpCode}  // 如果开启2FA

// Request Body
interface CreateWithdrawalRequest {
  asset: string;
  chain: string;
  amount: string;
  address: string;
  addressTag?: string;      // Memo/Tag
  feeLevel?: 'slow' | 'standard' | 'fast';  // 手续费等级
}

// Response 201
interface CreateWithdrawalResponse {
  withdrawalId: string;
  status: 'pending' | 'reviewing';
  estimatedArrival: string;
  fee: string;
  deductedAmount: string;
}

// Response 400 - 地址格式错误/余额不足/低于最小提币额
// Response 403 - 提币未开启/触发风控审核
```

#### 3.2.4 行情API（公开，无需认证）

**GET /api/v1/market/tickers - 获取所有Ticker**

```typescript
// Query Parameters
// symbols: string (逗号分隔，如 "BTCUSDT,ETHUSDT"，不传返回所有)

// Response 200
interface GetTickersResponse {
  data: Array<{
    symbol: string;
    lastPrice: string;
    priceChange: string;
    priceChangePercent: string;
    highPrice: string;
    lowPrice: string;
    volume: string;
    quoteVolume: string;
    bidPrice: string;
    bidQty: string;
    askPrice: string;
    askQty: string;
    openTime: string;
    closeTime: string;
    count: number;
  }>;
  updatedAt: string;
}
```

**GET /api/v1/market/klines - 获取K线数据**

```typescript
// Query Parameters
interface GetKlinesQuery {
  symbol: string;           // 必填
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1M';
  startTime?: string;       // ISO 8601
  endTime?: string;
  limit?: number;           // 默认500，最大1000
}

// Response 200 - 数组格式，与Binance兼容
// [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyVolume, takerBuyQuoteVolume, ignore]
```

### 3.3 API中间件设计

#### 3.3.1 认证中间件 (auth.ts)

```typescript
// src/app/api/middleware/auth.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

export async function authMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { code: 401001, message: '缺少认证令牌' },
      { status: 401 }
    );
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyToken(token);
    
    // 检查会话状态
    const session = await getSessionByTokenHash(hashToken(token));
    if (!session || session.status !== 'active') {
      return NextResponse.json(
        { code: 401002, message: '会话已过期或已被吊销' },
        { status: 401 }
      );
    }
    
    // 将用户信息附加到请求
    req.user = payload;
    
    return null; // 继续处理
  } catch (error) {
    return NextResponse.json(
      { code: 401003, message: '无效的认证令牌' },
      { status: 401 }
    );
  }
}
```

#### 3.3.2 限流中间件 (rateLimit.ts)

```typescript
// src/app/api/middleware/rateLimit.ts

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitConfig {
  windowMs: number;         // 时间窗口（毫秒）
  maxRequests: number;      // 最大请求数
  keyPrefix: string;        // Redis键前缀
}

export async function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
) {
  const key = `${config.keyPrefix}:${req.ip}:${req.user?.id || 'anon'}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // 使用Redis Sorted Set实现滑动窗口限流
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(key, 0, windowStart);
  pipeline.zcard(key);
  pipeline.zadd(key, now, `${now}-${Math.random()}`);
  pipeline.pexpire(key, config.windowMs);
  
  const results = await pipeline.exec();
  const currentCount = results[1][1] as number;
  
  if (currentCount >= config.maxRequests) {
    return NextResponse.json(
      { code: 429001, message: '请求过于频繁，请稍后再试' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(config.windowMs / 1000)) } }
    );
  }
  
  return null;
}
```

#### 3.3.3 统一错误处理

```typescript
// src/app/api/middleware/errorHandler.ts

export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export const ErrorCodes = {
  // 1xxxxx - 认证相关
  AUTH_INVALID_CREDENTIALS: { code: '101001', message: '邮箱或密码错误', status: 401 },
  AUTH_TOKEN_EXPIRED: { code: '101002', message: '登录已过期', status: 401 },
  AUTH_2FA_REQUIRED: { code: '101003', message: '需要二次验证', status: 403 },
  AUTH_ACCOUNT_LOCKED: { code: '101004', message: '账户已锁定', status: 423 },
  
  // 2xxxxx - 交易相关
  TRADE_INSUFFICIENT_BALANCE: { code: '201001', message: '余额不足', status: 409 },
  TRADE_INVALID_SYMBOL: { code: '201002', message: '交易对不存在', status: 400 },
  TRADE_PRICE_TOO_HIGH: { code: '201003', message: '价格超出限制', status: 400 },
  TRADE_MIN_NOTIONAL: { code: '201004', message: '下单金额小于最小值', status: 400 },
  TRADE_MARKET_CLOSED: { code: '201005', message: '交易对暂停交易', status: 403 },
  
  // 3xxxxx - 钱包相关
  WALLET_INVALID_ADDRESS: { code: '301001', message: '地址格式错误', status: 400 },
  WALLET_MIN_WITHDRAWAL: { code: '301002', message: '低于最小提币额', status: 400 },
  WALLET_DAILY_LIMIT: { code: '301003', message: '超出每日提币限额', status: 403 },
  WALLET_RISK_BLOCKED: { code: '301004', message: '触发风控，提币被拒绝', status: 403 },
  
  // 4xxxxx - 系统相关
  SYSTEM_MAINTENANCE: { code: '401001', message: '系统维护中', status: 503 },
  SYSTEM_RATE_LIMIT: { code: '401002', message: '请求过于频繁', status: 429 },
} as const;
```

### 3.4 WebSocket实时推送设计

#### 3.4.1 WebSocket连接管理

```typescript
// src/app/api/ws/market/route.ts

import { Server } from 'ws';

// 连接管理
const connections = new Map<string, WebSocketClient>();

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  subscriptions: Set<string>;     // 订阅的频道
  userId?: string;                // 认证用户ID
  lastPing: number;
}

// 频道格式
// market:ticker:{symbol}       - 指定交易对Ticker
// market:klines:{symbol}:{interval} - K线数据
// market:depth:{symbol}:{level}     - 深度数据
// market:trades:{symbol}       - 最新成交
// user:order:{userId}          - 用户订单更新
// user:balance:{userId}        - 用户余额更新
// user:notification:{userId}   - 用户通知

export async function GET(req: NextRequest) {
  // 升级WebSocket连接
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  
  // 验证Token（可选，公开行情可不传）
  let userId: string | undefined;
  if (token) {
    const payload = await verifyToken(token);
    userId = payload.userId;
  }
  
  // 创建WebSocket连接
  const clientId = generateClientId();
  const ws = new WebSocket(...);
  
  connections.set(clientId, {
    id: clientId,
    ws,
    subscriptions: new Set(),
    userId,
    lastPing: Date.now(),
  });
  
  // 发送连接成功消息
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected',
    clientId,
  }));
  
  return new Response(null, { status: 101 });
}
```

#### 3.4.2 消息格式

```typescript
// 客户端 -> 服务器
interface WsRequest {
  id: string;                   // 请求ID，用于匹配响应
  method: 'subscribe' | 'unsubscribe' | 'ping';
  params: {
    channels: string[];         // 订阅频道列表
  };
}

// 服务器 -> 客户端
interface WsResponse {
  id?: string;                  // 对应请求ID
  type: 'response' | 'push' | 'error' | 'pong';
  channel?: string;             // 推送频道
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

// 行情推送示例
interface TickerPush {
  channel: 'market:ticker:BTCUSDT';
  data: {
    e: '24hrTicker';           // 事件类型
    E: 1719300000000;          // 事件时间
    s: 'BTCUSDT';              // 交易对
    c: '67234.56';             // 最新价
    p: '1234.56';              // 24h涨跌
    P: '1.87';                 // 24h涨跌幅%
    h: '68500.00';             // 24h最高
    l: '66000.00';             // 24h最低
    v: '12345.6789';           // 24h成交量
    q: '825000000.00';         // 24h成交额
    b: '67234.00';             // 买一价
    B: '1.5';                  // 买一量
    a: '67235.00';             // 卖一价
    A: '0.8';                  // 卖一量
  };
}
```

### 3.5 API开发执行计划

| 阶段 | 任务 | 接口数量 | 预计时间 | 负责人 |
|------|------|----------|----------|--------|
| 3.5.1 | 搭建API框架（中间件/错误处理/日志） | - | 2天 | 后端Leader |
| 3.5.2 | 认证API（注册/登录/2FA/密码） | 12 | 3天 | 后端开发A |
| 3.5.3 | 用户API（信息/偏好/安全） | 18 | 2天 | 后端开发A |
| 3.5.4 | 行情API（Ticker/K线/深度/成交） | 20 | 3天 | 后端开发B |
| 3.5.5 | 交易API（下单/撤单/订单查询） | 35 | 5天 | 后端开发B |
| 3.5.6 | 钱包API（余额/充值/提币/转账） | 28 | 5天 | 后端开发C |
| 3.5.7 | DeFi API（兑换/流动性/质押） | 25 | 4天 | 后端开发C |
| 3.5.8 | KYC/通知/其他API | 25 | 3天 | 后端开发A |
| 3.5.9 | Admin后台API | 45 | 5天 | 后端开发D |
| 3.5.10 | WebSocket服务 | 6 | 3天 | 后端开发B |
| 3.5.11 | Webhook接口完善 | 8 | 2天 | 后端开发C |
| 3.5.12 | API文档（OpenAPI/Swagger） | - | 2天 | 后端Leader |
| 3.5.13 | API测试（Postman集合） | 222 | 3天 | QA工程师 |
| **总计** | - | **222** | **42天** | - |

---

## 第四部分：前端UI从33%到100%的完成方案

### 4.1 前端现状盘点

#### 4.1.1 已存在的页面（375个page.tsx）

| 端 | 路径前缀 | 页面数 | 完整度 | 说明 |
|----|----------|--------|--------|------|
| Web端 | src/app/ | ~30 | 60% | 首页/市场/交易/关于/下载 |
| H5端 | src/app/h5/ | ~120 | 30% | 大量骨架页面，缺少交互 |
| Admin后台 | src/app/admin/ | ~60 | 20% | 大量占位符页面 |
| 用户中心 | src/app/user/ | ~30 | 40% | 基础结构存在 |
| Dashboard | src/app/dashboard/ | ~5 | 50% | 简单数据展示 |
| 门户 | src/app/portal/ | ~10 | 30% | 文化/电商/论坛 |
| IDO | src/app/ido/ | ~5 | 40% | 基础列表页 |
| 注册/登录 | src/app/register/ | ~3 | 70% | 相对完整 |

#### 4.1.2 缺失的核心页面与功能

| 模块 | 缺失页面 | 优先级 | 工作量 |
|------|----------|--------|--------|
| 交易 | 永续合约交易页、期权交易页、OTC交易页、算法交易页 | P0 | 15天 |
| 钱包 | 充币详情页、提币审核页、地址管理页、资金流水页 | P0 | 10天 |
| DeFi | 流动性添加/移除交互、质押详情、收益收割 | P0 | 10天 |
| KYC | 实名认证流程页、OCR上传、活体检测交互 | P0 | 7天 |
| Admin | 用户管理详情、订单审核、风控配置、数据统计 | P0 | 15天 |
| 行情 | 深度图、成交明细、K线工具栏、技术指标叠加 | P1 | 7天 |
| 通知 | 通知中心、消息设置、站内信 | P1 | 5天 |

### 4.2 前端架构优化方案

#### 4.2.1 状态管理架构

```
Zustand Store 架构（客户端状态）

src/stores/
├── authStore.ts           # 认证状态：用户/Token/权限
├── tradeStore.ts          # 交易状态：当前交易对/订单簿/深度
├── walletStore.ts         # 钱包状态：余额/充值/提币
├── marketStore.ts         # 行情状态：Ticker/K线/提醒
├── uiStore.ts             # UI状态：主题/语言/侧边栏
├── notificationStore.ts   # 通知状态：未读/消息列表
└── defiStore.ts           # DeFi状态：池子/质押/收益

React Query 架构（服务端状态）

src/queries/
├── keys.ts                # 所有Query Key定义
├── useUser.ts             # 用户数据查询
├── useOrders.ts           # 订单查询
├── useBalances.ts         # 余额查询
├── useMarketData.ts       # 行情查询
├── useKlines.ts           # K线查询
├── useTrades.ts           # 成交查询
└── useNotifications.ts    # 通知查询

Hooks 封装

src/hooks/
├── useAuth.ts             # 认证相关Hook
├── useTrade.ts            # 交易操作Hook
├── useWebSocket.ts        # WebSocket连接管理
├── usePagination.ts       # 分页逻辑复用
├── useInfiniteScroll.ts   # 无限滚动
├── useCountdown.ts        # 倒计时
├── useDebounce.ts         # 防抖
└── useInterval.ts         # 定时器
```

#### 4.2.2 组件分层架构

```
组件分层（原子设计方法论）

src/components/
├── atoms/                 # 原子组件：最基础不可再分
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   ├── Spinner/
│   └── Icon/
├── molecules/             # 分子组件：原子组合
│   ├── SearchInput/       # Input + Button + Icon
│   ├── FormField/         # Label + Input + Error
│   ├── AssetBadge/        # Icon + Symbol + Name
│   └── PriceChange/       # Price + Badge + Arrow
├── organisms/             # 有机体组件：分子组合
│   ├── OrderForm/         # 完整的下单表单
│   ├── OrderBook/         # 完整的订单簿
│   ├── TradeHistory/      # 成交历史列表
│   ├── AssetCard/         # 资产卡片
│   └── KlineChart/        # K线图表组件
├── templates/             # 模板：页面布局结构
│   ├── TradeLayout/       # 交易页三栏布局
│   ├── DashboardLayout/   # 仪表盘网格布局
│   └── AdminLayout/       # 后台管理布局
└── pages/                 # 页面级组件
    ├── HomePage/
    ├── TradePage/
    ├── WalletPage/
    └── AdminPage/
```

### 4.3 关键页面实现清单

#### 4.3.1 交易页面（现货）完整实现

```typescript
// src/app/trade/spot/ClientPage.tsx 完整版

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTradeStore } from '@/stores/tradeStore';
import { useMarketStore } from '@/stores/marketStore';
import { useCreateOrder, useCancelOrder, useOrders } from '@/hooks/useTrade';
import { useBalances } from '@/hooks/useWallet';
import { useMarketData, useOrderBook, useRecentTrades } from '@/hooks/useMarketData';
import { useWebSocket } from '@/hooks/useWebSocket';

// 子组件
import OrderBook from '@/components/organisms/OrderBook';
import TradeForm from '@/components/organisms/TradeForm';
import RecentTrades from '@/components/organisms/RecentTrades';
import KlineChart from '@/components/organisms/KlineChart';
import AssetInfo from '@/components/organisms/AssetInfo';
import OpenOrders from '@/components/organisms/OpenOrders';
import OrderHistory from '@/components/organisms/OrderHistory';

export default function SpotTradePage() {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get('symbol') || 'BTCUSDT');
  const { isAuthenticated } = useAuthStore();
  
  // WebSocket连接
  const { subscribe, unsubscribe, isConnected } = useWebSocket();
  
  // 数据获取
  const { data: ticker } = useMarketData(symbol);
  const { data: orderBook } = useOrderBook(symbol);
  const { data: recentTrades } = useRecentTrades(symbol);
  const { data: balances } = useBalances();
  const { data: openOrders, refetch: refetchOrders } = useOrders({ symbol, status: 'open' });
  
  // Mutations
  const createOrder = useCreateOrder();
  const cancelOrder = useCancelOrder();
  
  // 订阅WebSocket频道
  useEffect(() => {
    if (!isConnected) return;
    
    const channels = [
      `market:ticker:${symbol}`,
      `market:depth:${symbol}:20`,
      `market:trades:${symbol}`,
    ];
    
    channels.forEach(ch => subscribe(ch));
    
    return () => {
      channels.forEach(ch => unsubscribe(ch));
    };
  }, [symbol, isConnected]);
  
  // 处理下单
  const handleCreateOrder = useCallback(async (params: CreateOrderParams) => {
    try {
      await createOrder.mutateAsync(params);
      // 成功提示
      toast.success('下单成功');
      refetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  }, [createOrder, refetchOrders]);
  
  // 处理撤单
  const handleCancelOrder = useCallback(async (orderId: string) => {
    try {
      await cancelOrder.mutateAsync(orderId);
      toast.success('撤单成功');
      refetchOrders();
    } catch (error) {
      toast.error(error.message);
    }
  }, [cancelOrder, refetchOrders]);
  
  return (
    <div className="flex h-screen bg-background">
      {/* 左侧：市场列表 + 订单簿 */}
      <aside className="w-80 border-r border-border flex flex-col">
        <MarketList selected={symbol} onSelect={setSymbol} />
        <OrderBook 
          symbol={symbol} 
          data={orderBook} 
          lastPrice={ticker?.lastPrice}
        />
      </aside>
      
      {/* 中间：K线 + 交易区 */}
      <main className="flex-1 flex flex-col min-w-0">
        <AssetInfo symbol={symbol} ticker={ticker} />
        <KlineChart symbol={symbol} />
        <div className="flex-1 flex">
          <TradeForm 
            symbol={symbol}
            balances={balances}
            onSubmit={handleCreateOrder}
            isSubmitting={createOrder.isPending}
          />
          <OpenOrders 
            orders={openOrders}
            onCancel={handleCancelOrder}
            isCancelling={cancelOrder.isPending}
          />
        </div>
      </main>
      
      {/* 右侧：最新成交 + 订单历史 */}
      <aside className="w-80 border-l border-border flex flex-col">
        <RecentTrades trades={recentTrades} />
        <OrderHistory symbol={symbol} />
      </aside>
    </div>
  );
}
```

### 4.4 前端开发执行计划

| 阶段 | 任务 | 页面数 | 预计时间 | 负责人 |
|------|------|--------|----------|--------|
| 4.4.1 | 搭建前端架构（Store/Hooks/组件分层） | - | 3天 | 前端Leader |
| 4.4.2 | 通用组件完善（atoms/molecules） | 30 | 5天 | 前端开发A |
| 4.4.3 | 交易页面完整实现（现货/合约/期权） | 8 | 10天 | 前端开发B |
| 4.4.4 | 钱包页面完整实现 | 10 | 7天 | 前端开发A |
| 4.4.5 | DeFi页面完整实现 | 12 | 8天 | 前端开发C |
| 4.4.6 | KYC/认证流程页面 | 8 | 5天 | 前端开发A |
| 4.4.7 | Admin后台管理页面 | 30 | 12天 | 前端开发D |
| 4.4.8 | H5移动端页面适配 | 60 | 10天 | 前端开发C |
| 4.4.9 | 行情/图表/数据展示页面 | 10 | 7天 | 前端开发B |
| 4.4.10 | 门户/内容/社区页面 | 15 | 5天 | 前端开发D |
| 4.4.11 | 前端测试（E2E/单元测试） | - | 5天 | QA工程师 |
| 4.4.12 | 性能优化（首屏/懒加载/代码分割） | - | 3天 | 前端Leader |
| **总计** | - | **~183** | **80天** | - |

---

## 第五部分：加密货币行情数据对接地狱级方案

### 5.1 行情数据聚合商全景图

#### 5.1.1 聚合商分级矩阵

| 聚合商 | 级别 | 覆盖市场 | 延迟 | 费用 | 可靠性 | 适用场景 |
|--------|------|----------|------|------|--------|----------|
| **Binance** | Tier 1 | 现货+合约+期权 | <50ms | 免费 | 99.99% | 主数据源 |
| **Coinbase Exchange** | Tier 1 | 现货+合约 | <100ms | 免费 | 99.99% | 备用数据源 |
| **Kaiko** | Tier 1 | 全市场聚合 | <200ms | $500+/月 | 99.95% | 机构级历史数据 |
| **CoinGecko** | Tier 2 | 全市场现货 | <500ms | 免费/$129+/月 | 99.9% | 市值/排名/元数据 |
| **CryptoCompare** | Tier 2 | 全市场 | <300ms | 免费/$79+/月 | 99.9% | 社交数据/新闻 |
| **Messari** | Tier 2 | 全市场 | <1s | $29+/月 | 99.5% | 研报/链上指标 |
| **The Block** | Tier 3 | 衍生品 | <1s | 定制 | 99% | 期权/期货市场深度 |
| **Skew** | Tier 3 | 衍生品 | <1s | 定制 | 99% | 期权波动率曲面 |

#### 5.1.2 主从架构设计

```
行情数据流架构

                    ┌─────────────────────────────────────────┐
                    │         用户浏览器/App                   │
                    │         (WebSocket接收实时行情)          │
                    └─────────────────────────────────────────┘
                                      ▲
                                      │ WebSocket
                    ┌─────────────────┴───────────────────────┐
                    │      ZS Exchange 行情服务层               │
                    │  ┌─────────────────────────────────────┐│
                    │  │  行情聚合引擎 (Market Aggregation)    ││
                    │  │  - 多源数据归一化                     ││
                    │  │  - 价格发现算法 (加权中位数)          ││
                    │  │  - 异常数据过滤 (3σ原则)              ││
                    │  │  - 故障自动切换                       ││
                    │  └─────────────────────────────────────┘│
                    │  ┌─────────────────────────────────────┐│
                    │  │  WebSocket广播服务                   ││
                    │  │  - 订阅管理                          ││
                    │  │  - 消息压缩 (permessage-deflate)     ││
                    │  │  - 连接心跳 (30s ping/pong)          ││
                    │  └─────────────────────────────────────┘│
                    └─────────────────────────────────────────┘
                                      ▲
                                      │ REST API / WebSocket
        ┌───────────────┬─────────────┼─────────────┬───────────────┐
        │               │             │             │               │
        ▼               ▼             ▼             ▼               ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │Binance  │   │Coinbase │   │  Kaiko  │   │CoinGecko│   │CryptoCmp│
   │(主源)   │   │(备用1)  │   │(备用2)  │   │(元数据) │   │(辅助)   │
   │REST+WS  │   │REST+WS  │   │REST+WS  │   │REST     │   │REST     │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
```

### 5.2 Binance 对接方案（主数据源）

#### 5.2.1 基础信息

| 项目 | 内容 |
|------|------|
| 官方网站 | https://www.binance.com |
| API文档 | https://binance-docs.github.io/apidocs/spot/en/ |
| REST Base URL | https://api.binance.com |
| WebSocket Base URL | wss://stream.binance.com:9443/ws |
| 聚合流WebSocket | wss://stream.binance.com:9443/stream |
| 测试网REST | https://testnet.binance.vision |
| 测试网WS | wss://testnet.binance.vision/ws |
| 注册地址 | https://www.binance.com/en/register |
| API管理 | https://www.binance.com/en/my/settings/api-management |

#### 5.2.2 API密钥申请流程（必须人为操作）

**步骤1：注册Binance账户**
1. 访问 https://www.binance.com/en/register
2. 使用企业邮箱注册（禁止使用个人邮箱）
3. 完成邮箱验证
4. 完成KYC Level 2（需要企业营业执照）
5. 开启Google Authenticator 2FA

**步骤2：创建API密钥**
1. 登录后访问 https://www.binance.com/en/my/settings/api-management
2. 点击 "Create API"
3. 选择API类型："System-generated"（系统生成）
4. 给API Key命名："ZS_Exchange_Production"
5. 绑定IP白名单（必须填写生产服务器出口IP）
6. 开启权限：
   - Enable Reading（读取权限）- 必须
   - Enable Spot & Margin Trading（现货交易权限）- 如果要做市需要
   - Enable Withdrawals（提币权限）- 如果要做资金划转需要
7. 保存API Key和Secret Key到密码管理器（1Password/Vault）
8. **严禁将Secret Key提交到代码仓库**

**步骤3：环境变量配置**

```bash
# .env.production
# Binance API配置
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_secret_key_here
BINANCE_BASE_URL=https://api.binance.com
BINANCE_WS_URL=wss://stream.binance.com:9443/ws

# 测试网配置（开发/测试环境使用）
BINANCE_TESTNET_API_KEY=your_testnet_key
BINANCE_TESTNET_API_SECRET=your_testnet_secret
BINANCE_TESTNET_BASE_URL=https://testnet.binance.vision
```

#### 5.2.3 REST API对接（行情数据）

**获取所有交易对信息**

```typescript
// src/lib/market/binance-client.ts

const BINANCE_BASE_URL = process.env.BINANCE_BASE_URL || 'https://api.binance.com';

/**
 * 获取所有交易对信息
 * API: GET /api/v3/exchangeInfo
 * 权重: 20
 * 频率限制: 1200 req/min (IP)
 */
export async function getExchangeInfo(): Promise<BinanceExchangeInfo> {
  const response = await fetch(`${BINANCE_BASE_URL}/api/v3/exchangeInfo`);
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  return response.json();
}

// 响应格式
interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  rateLimits: Array<{
    rateLimitType: string;
    interval: string;
    intervalNum: number;
    limit: number;
  }>;
  symbols: Array<{
    symbol: string;
    status: string;
    baseAsset: string;
    baseAssetPrecision: number;
    quoteAsset: string;
    quotePrecision: number;
    orderTypes: string[];
    icebergAllowed: boolean;
    filters: Array<{
      filterType: string;
      minPrice?: string;
      maxPrice?: string;
      tickSize?: string;
      minQty?: string;
      maxQty?: string;
      stepSize?: string;
      minNotional?: string;
    }>;
  }>;
}
```

**获取24小时价格变动统计（Ticker）**

```typescript
/**
 * 获取24小时Ticker数据
 * API: GET /api/v3/ticker/24hr
 * 权重: 
 *   - 不传symbol: 80 (全部)
 *   - 传1个symbol: 1
 *   - 传多个symbol: 每symbol权重2，最多40
 * 频率限制: 1200 req/min (IP)
 */
export async function get24hrTicker(symbol?: string): Promise<Binance24hrTicker | Binance24hrTicker[]> {
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/ticker/24hr`);
  if (symbol) {
    url.searchParams.append('symbol', symbol);
  }
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  return response.json();
}

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}
```

**获取K线数据**

```typescript
/**
 * 获取K线/Candlestick数据
 * API: GET /api/v3/klines
 * 权重: 
 *   - 1-100条: 1
 *   - 101-500条: 2
 *   - 501-1000条: 5
 *   - 1001条以上: 10
 * 频率限制: 1200 req/min (IP)
 */
export async function getKlines(
  symbol: string,
  interval: string,
  options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
  }
): Promise<BinanceKline[]> {
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/klines`);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('interval', interval);
  
  if (options?.startTime) url.searchParams.append('startTime', String(options.startTime));
  if (options?.endTime) url.searchParams.append('endTime', String(options.endTime));
  if (options?.limit) url.searchParams.append('limit', String(Math.min(options.limit, 1000)));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  
  // 返回数组格式
  // [openTime, open, high, low, close, volume, closeTime, quoteVolume, trades, takerBuyVolume, takerBuyQuoteVolume, ignore]
  return response.json();
}

type BinanceKline = [
  number,   // 0: openTime
  string,   // 1: open
  string,   // 2: high
  string,   // 3: low
  string,   // 4: close
  string,   // 5: volume
  number,   // 6: closeTime
  string,   // 7: quoteVolume
  number,   // 8: trades
  string,   // 9: takerBuyVolume
  string,   // 10: takerBuyQuoteVolume
  string    // 11: ignore
];
```

**获取订单簿深度**

```typescript
/**
 * 获取订单簿深度
 * API: GET /api/v3/depth
 * 权重:
 *   - limit 1-100: 5
 *   - limit 101-500: 25
 *   - limit 501-1000: 50
 *   - limit 1000+: 250
 * 频率限制: 1200 req/min (IP)
 */
export async function getDepth(
  symbol: string,
  limit: number = 100
): Promise<BinanceDepth> {
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/depth`);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('limit', String(Math.min(limit, 1000)));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  return response.json();
}

interface BinanceDepth {
  lastUpdateId: number;
  bids: [string, string][];  // [价格, 数量]
  asks: [string, string][];
}
```

**获取最新成交记录**

```typescript
/**
 * 获取最新成交
 * API: GET /api/v3/trades
 * 权重: 10
 * 频率限制: 1200 req/min (IP)
 */
export async function getRecentTrades(
  symbol: string,
  limit: number = 500
): Promise<BinanceTrade[]> {
  const url = new URL(`${BINANCE_BASE_URL}/api/v3/trades`);
  url.searchParams.append('symbol', symbol);
  url.searchParams.append('limit', String(Math.min(limit, 1000)));
  
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }
  return response.json();
}

interface BinanceTrade {
  id: number;
  price: string;
  qty: string;
  quoteQty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}
```

#### 5.2.4 WebSocket对接（实时行情）

```typescript
// src/lib/market/binance-ws.ts

import WebSocket from 'ws';
import { EventEmitter } from 'events';

const BINANCE_WS_URL = process.env.BINANCE_WS_URL || 'wss://stream.binance.com:9443/ws';
const BINANCE_STREAM_URL = process.env.BINANCE_STREAM_URL || 'wss://stream.binance.com:9443/stream';

/**
 * Binance WebSocket客户端
 * 
 * 流名称规范:
 * - <symbol>@ticker          - 24小时统计
 * - <symbol>@depth<level>    - 订单簿深度 (5/10/20)
 * - <symbol>@kline_<interval> - K线 (1m/5m/15m/1h/4h/1d)
 * - <symbol>@trade           - 实时成交
 * - <symbol>@aggTrade        - 聚合成交
 * - !ticker@arr              - 所有交易对Ticker (数组)
 */
export class BinanceWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private heartbeatInterval = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions = new Set<string>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  
  constructor(private readonly streams: string[] = []) {
    super();
    if (streams.length > 0) {
      this.connect();
    }
  }
  
  connect() {
    const streamPath = this.streams.length === 1 
      ? `/${this.streams[0]}` 
      : `/stream?streams=${this.streams.join('/')}`;
    
    const url = `${BINANCE_WS_URL}${streamPath}`;
    
    this.ws = new WebSocket(url);
    
    this.ws.on('open', () => {
      console.log('[BinanceWS] Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.emit('connected');
    });
    
    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('[BinanceWS] Parse error:', error);
      }
    });
    
    this.ws.on('close', (code: number, reason: Buffer) => {
      console.log(`[BinanceWS] Closed: ${code} ${reason.toString()}`);
      this.isConnected = false;
      this.stopHeartbeat();
      this.emit('disconnected');
      
      // 自动重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectInterval * this.reconnectAttempts, 60000);
        console.log(`[BinanceWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.connect(), delay);
      } else {
        this.emit('maxReconnectReached');
      }
    });
    
    this.ws.on('error', (error: Error) => {
      console.error('[BinanceWS] Error:', error);
      this.emit('error', error);
    });
  }
  
  private handleMessage(message: any) {
    // 聚合流格式: { stream: 'btcusdt@ticker', data: {...} }
    // 单流格式: 直接是数据对象
    
    const stream = message.stream;
    const data = message.data || message;
    
    if (data.e === '24hrTicker') {
      this.emit('ticker', this.normalizeTicker(data));
    } else if (data.e === 'depthUpdate') {
      this.emit('depth', this.normalizeDepth(data));
    } else if (data.e === 'trade') {
      this.emit('trade', this.normalizeTrade(data));
    } else if (data.e === 'kline') {
      this.emit('kline', this.normalizeKline(data));
    } else if (data.e === 'aggTrade') {
      this.emit('aggTrade', this.normalizeAggTrade(data));
    }
  }
  
  private normalizeTicker(data: any) {
    return {
      symbol: data.s,
      lastPrice: data.c,
      priceChange: data.p,
      priceChangePercent: data.P,
      highPrice: data.h,
      lowPrice: data.l,
      volume: data.v,
      quoteVolume: data.q,
      bidPrice: data.b,
      bidQty: data.B,
      askPrice: data.a,
      askQty: data.A,
      openTime: data.O,
      closeTime: data.C,
      firstTradeId: data.F,
      lastTradeId: data.L,
      tradeCount: data.n,
      eventTime: data.E,
    };
  }
  
  private normalizeDepth(data: any) {
    return {
      symbol: data.s,
      lastUpdateId: data.u,
      bids: data.b.map((item: string[]) => ({ price: item[0], quantity: item[1] })),
      asks: data.a.map((item: string[]) => ({ price: item[0], quantity: item[1] })),
      eventTime: data.E,
    };
  }
  
  private normalizeTrade(data: any) {
    return {
      id: data.t,
      symbol: data.s,
      price: data.p,
      quantity: data.q,
      quoteQuantity: data.p * data.q,
      time: data.T,
      isBuyerMaker: data.m,
      isBestMatch: data.M,
    };
  }
  
  private normalizeKline(data: any) {
    const k = data.k;
    return {
      symbol: data.s,
      interval: k.i,
      openTime: k.t,
      closeTime: k.T,
      open: k.o,
      high: k.h,
      low: k.l,
      close: k.c,
      volume: k.v,
      quoteVolume: k.q,
      trades: k.n,
      takerBuyVolume: k.V,
      takerBuyQuoteVolume: k.Q,
      isFinal: k.x,
    };
  }
  
  private normalizeAggTrade(data: any) {
    return {
      id: data.a,
      symbol: data.s,
      price: data.p,
      quantity: data.q,
      firstTradeId: data.f,
      lastTradeId: data.l,
      time: data.T,
      isBuyerMaker: data.m,
    };
  }
  
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, this.heartbeatInterval);
  }
  
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  subscribe(stream: string) {
    this.subscriptions.add(stream);
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [stream],
        id: Date.now(),
      }));
    }
  }
  
  unsubscribe(stream: string) {
    this.subscriptions.delete(stream);
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: Date.now(),
      }));
    }
  }
  
  close() {
    this.stopHeartbeat();
    this.ws?.close();
  }
}
```

#### 5.2.5 限流与错误处理

```typescript
// src/lib/market/binance-rate-limiter.ts

/**
 * Binance API限流器
 * 
 * 限流规则（按IP）:
 * - 权重模式: 每分钟1200
 * - 原始模式: 每秒10
 * - 订单模式: 每秒10, 每分钟100, 每日200000
 * 
 * 错误码:
 * - 429: 请求过频
 * - 418: IP被自动封禁（持续发送429后）
 * - 403: WAF限制
 */

import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitConfig {
  weight: number;           // 本次请求权重
  limitType: 'REQUEST_WEIGHT' | 'RAW_REQUESTS' | 'ORDERS';
}

export class BinanceRateLimiter {
  private readonly WEIGHT_LIMIT = 1200;  // 每分钟
  private readonly RAW_LIMIT = 10;       // 每秒
  private readonly ORDER_LIMIT_PER_SEC = 10;
  private readonly ORDER_LIMIT_PER_MIN = 100;
  
  async checkLimit(config: RateLimitConfig): Promise<boolean> {
    const now = Math.floor(Date.now() / 1000);
    const minute = Math.floor(now / 60);
    
    switch (config.limitType) {
      case 'REQUEST_WEIGHT': {
        const key = `binance:weight:${minute}`;
        const current = await redis.incrby(key, config.weight);
        if (current === config.weight) {
          await redis.expire(key, 120); // 2分钟后过期
        }
        return current <= this.WEIGHT_LIMIT;
      }
      
      case 'RAW_REQUESTS': {
        const key = `binance:raw:${now}`;
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, 2);
        }
        return current <= this.RAW_LIMIT;
      }
      
      case 'ORDERS': {
        const secKey = `binance:order:sec:${now}`;
        const minKey = `binance:order:min:${minute}`;
        
        const [secCount, minCount] = await Promise.all([
          redis.incr(secKey).then(c => {
            if (c === 1) redis.expire(secKey, 2);
            return c;
          }),
          redis.incr(minKey).then(c => {
            if (c === 1) redis.expire(minKey, 120);
            return c;
          }),
        ]);
        
        return secCount <= this.ORDER_LIMIT_PER_SEC && minCount <= this.ORDER_LIMIT_PER_MIN;
      }
      
      default:
        return true;
    }
  }
  
  async waitForLimit(config: RateLimitConfig, maxWaitMs: number = 60000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      if (await this.checkLimit(config)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('Rate limit wait timeout');
  }
}
```

### 5.3 CoinGecko 对接方案（元数据与市值）

#### 5.3.1 基础信息

| 项目 | 内容 |
|------|------|
| 官方网站 | https://www.coingecko.com |
| API文档 | https://docs.coingecko.com/reference/introduction |
| REST Base URL | https://api.coingecko.com/api/v3 |
| 专业版URL | https://pro-api.coingecko.com/api/v3 |
| 注册地址 | https://www.coingecko.com/en/api/pricing |
| 免费版限制 | 10-30 calls/min |
| 付费版 | $129/月起，500 calls/min |

#### 5.3.2 API密钥申请流程

1. 访问 https://www.coingecko.com/en/api/pricing
2. 选择套餐："Analyst" ($129/月) 或 "Lite" ($0/月，限流严格)
3. 使用企业邮箱注册
4. 在Dashboard获取API Key (x-cg-pro-api-key)
5. 配置环境变量：
   ```bash
   COINGECKO_API_KEY=your_api_key
   COINGECKO_BASE_URL=https://pro-api.coingecko.com/api/v3
   ```

#### 5.3.3 核心接口对接

```typescript
// src/lib/market/coingecko-client.ts

const COINGECKO_BASE_URL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

async function coingeckoRequest(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${COINGECKO_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const headers: Record<string, string> = {};
  if (COINGECKO_API_KEY) {
    headers['x-cg-pro-api-key'] = COINGECKO_API_KEY;
  }
  
  const response = await fetch(url.toString(), { headers });
  
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
  }
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * 获取所有币种列表
 * API: GET /coins/list
 * 限流: 免费版约1次/分钟，数据量约5MB
 */
export async function getCoinList(): Promise<CoinGeckoCoin[]> {
  return coingeckoRequest('/coins/list');
}

interface CoinGeckoCoin {
  id: string;        // "bitcoin"
  symbol: string;    // "btc"
  name: string;      // "Bitcoin"
}

/**
 * 获取币种市场数据
 * API: GET /coins/markets
 * 限流: 免费版1次/30秒 (每页)
 */
export async function getCoinMarkets(params: {
  vs_currency: string;       // "usd"
  ids?: string;              // "bitcoin,ethereum"
  category?: string;         // "layer-1"
  order?: string;            // "market_cap_desc"
  per_page?: number;         // 1-250
  page?: number;
  sparkline?: boolean;
  price_change_percentage?: string; // "1h,24h,7d,30d"
}): Promise<CoinGeckoMarket[]> {
  return coingeckoRequest('/coins/markets', {
    vs_currency: params.vs_currency,
    ...(params.ids && { ids: params.ids }),
    ...(params.category && { category: params.category }),
    order: params.order || 'market_cap_desc',
    per_page: String(params.per_page || 100),
    page: String(params.page || 1),
    sparkline: String(params.sparkline || false),
    ...(params.price_change_percentage && { 
      price_change_percentage: params.price_change_percentage 
    }),
  });
}

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
}
```

### 5.4 Kaiko 对接方案（机构级历史数据）

#### 5.4.1 基础信息

| 项目 | 内容 |
|------|------|
| 官方网站 | https://www.kaiko.com |
| API文档 | https://docs.kaiko.com/ |
| REST Base URL | https://us.market-api.kaiko.io/v2 |
| WebSocket URL | wss://us.market-ws.kaiko.io/v1 |
| 注册地址 | https://www.kaiko.com/pages/contact-1 |
| 定价 | $500+/月（起） |
| 特点 | 机构级、低延迟、覆盖150+交易所 |

#### 5.4.2 API密钥申请

1. 访问 https://www.kaiko.com/pages/contact-1
2. 填写企业信息表单
3. 销售团队会在1-3个工作日内联系
4. 签署服务协议
5. 获取API Key
6. 配置环境变量：
   ```bash
   KAIKO_API_KEY=your_api_key
   KAIKO_BASE_URL=https://us.market-api.kaiko.io/v2
   KAIKO_WS_URL=wss://us.market-ws.kaiko.io/v1
   ```

#### 5.4.3 核心接口

```typescript
// src/lib/market/kaiko/kaiko-client.ts

const KAIKO_BASE_URL = process.env.KAIKO_BASE_URL || 'https://us.market-api.kaiko.io/v2';
const KAIKO_API_KEY = process.env.KAIKO_API_KEY;

async function kaikoRequest(endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${KAIKO_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const response = await fetch(url.toString(), {
    headers: {
      'X-Api-Key': KAIKO_API_KEY || '',
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Kaiko API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * 获取聚合行情 (Aggregated Price)
 * API: GET /data/trades.v1/spot_exchange_rate/{base_asset}/{quote_asset}
 */
export async function getSpotExchangeRate(
  baseAsset: string,
  quoteAsset: string,
  params?: {
    interval?: string;      // 1m, 1h, 1d
    start_time?: string;    // ISO 8601
    end_time?: string;
    page_size?: number;
  }
) {
  const query: Record<string, string> = {};
  if (params?.interval) query.interval = params.interval;
  if (params?.start_time) query.start_time = params.start_time;
  if (params?.end_time) query.end_time = params.end_time;
  if (params?.page_size) query.page_size = String(params.page_size);
  
  return kaikoRequest(
    `/data/trades.v1/spot_exchange_rate/${baseAsset}/${quoteAsset}`,
    query
  );
}

/**
 * 获取OHLCV数据
 * API: GET /data/trades.v1/spot_ohlcv/{base_asset}/{quote_asset}
 */
export async function getSpotOHLCV(
  baseAsset: string,
  quoteAsset: string,
  params: {
    interval: string;       // 1m, 5m, 15m, 1h, 4h, 1d
    start_time?: string;
    end_time?: string;
    page_size?: number;
  }
) {
  return kaikoRequest(
    `/data/trades.v1/spot_ohlcv/${baseAsset}/${quoteAsset}`,
    {
      interval: params.interval,
      ...(params.start_time && { start_time: params.start_time }),
      ...(params.end_time && { end_time: params.end_time }),
      page_size: String(params.page_size || 100),
    }
  );
}
```

### 5.5 数据归一化层（多源统一）

```typescript
// src/lib/market/normalizer.ts

/**
 * 多源行情数据归一化器
 * 
 * 目标：将不同聚合商的数据格式统一为ZS Exchange内部标准格式
 * 策略：
 * 1. 价格发现：多源加权中位数（剔除异常值）
 * 2. 数据质量评分：基于延迟、精度、历史准确性
 * 3. 故障转移：主源故障时自动切换到备用源
 */

import { EventEmitter } from 'events';

interface NormalizedTicker {
  symbol: string;
  source: string;              // 数据来源: binance|coinbase|kaiko
  sourceWeight: number;        // 数据源权重 (0-1)
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  timestamp: number;           // 毫秒时间戳
  latency: number;             // 获取延迟(ms)
}

interface PriceDiscoveryResult {
  symbol: string;
  price: string;               // 最终价格（加权中位数）
  confidence: number;          // 置信度 (0-1)
  sources: Array<{
    name: string;
    price: string;
    weight: number;
    latency: number;
  }>;
  timestamp: number;
}

export class MarketDataNormalizer extends EventEmitter {
  private sources = new Map<string, NormalizedTicker>();
  private sourceWeights = new Map<string, number>([
    ['binance', 0.5],
    ['coinbase', 0.3],
    ['kaiko', 0.2],
  ]);
  
  /**
   * 添加数据源数据
   */
  addSourceData(ticker: NormalizedTicker) {
    this.sources.set(ticker.source, ticker);
    
    // 计算加权中位数价格
    const result = this.calculatePrice(ticker.symbol);
    
    this.emit('price', result);
  }
  
  /**
   * 价格发现算法：加权中位数 + 异常值剔除
   */
  private calculatePrice(symbol: string): PriceDiscoveryResult {
    const sourceData = Array.from(this.sources.values())
      .filter(t => t.symbol === symbol);
    
    if (sourceData.length === 0) {
      return {
        symbol,
        price: '0',
        confidence: 0,
        sources: [],
        timestamp: Date.now(),
      };
    }
    
    // 1. 收集所有价格
    const prices = sourceData.map(s => ({
      source: s.source,
      price: parseFloat(s.lastPrice),
      weight: this.sourceWeights.get(s.source) || 0.1,
      latency: s.latency,
    }));
    
    // 2. 剔除异常值（超过3个标准差的价格）
    const mean = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p.price - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    const validPrices = prices.filter(p => Math.abs(p.price - mean) <= 3 * stdDev);
    
    // 3. 计算加权中位数
    const sorted = validPrices.sort((a, b) => a.price - b.price);
    const totalWeight = sorted.reduce((sum, p) => sum + p.weight, 0);
    let cumulativeWeight = 0;
    let medianPrice = sorted[0].price;
    
    for (const p of sorted) {
      cumulativeWeight += p.weight;
      if (cumulativeWeight >= totalWeight / 2) {
        medianPrice = p.price;
        break;
      }
    }
    
    // 4. 计算置信度
    const confidence = Math.min(validPrices.length / this.sourceWeights.size, 1);
    
    return {
      symbol,
      price: medianPrice.toFixed(8),
      confidence,
      sources: validPrices.map(p => ({
        name: p.source,
        price: p.price.toFixed(8),
        weight: p.weight,
        latency: p.latency,
      })),
      timestamp: Date.now(),
    };
  }
}
```

### 5.6 行情数据存储与缓存策略

```
行情数据生命周期

┌─────────────────────────────────────────────────────────────────────┐
│  数据源 (Binance/Coinbase/Kaiko)                                     │
│  - 实时推送: WebSocket (100ms间隔)                                   │
│  - 历史数据: REST API (按需拉取)                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  归一化层 (Normalizer)                                               │
│  - 多源价格发现 (加权中位数)                                         │
│  - 异常值过滤 (3σ原则)                                               │
│  - 数据质量评分                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  Redis 缓存层 (热数据)       │   │  PostgreSQL 持久层 (冷数据)  │
│                             │   │                             │
│  Keys:                      │   │  Tables:                    │
│  - market:ticker:{symbol}   │   │  - market.tickers           │
│    TTL: 10s                 │   │  - market.klines            │
│  - market:depth:{symbol}    │   │  - market.trades            │
│    TTL: 5s                  │   │                             │
│  - market:klines:{s}:{i}    │   │  保留时间:                   │
│    TTL: 1h                  │   │  - 1m K线: 3个月             │
│  - market:trades:{symbol}   │   │  - 5m K线: 6个月             │
│    TTL: 60s                 │   │  - 1h K线: 2年               │
│                             │   │  - 1d K线: 永久              │
└─────────────────────────────┘   └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WebSocket广播服务                                                   │
│  - 订阅管理: 用户订阅的symbol列表                                    │
│  - 消息压缩: permessage-deflate                                      │
│  - 批量推送: 100ms批量合并推送                                       │
│  - 连接管理: 心跳检测、自动重连                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  前端 (Next.js)                                                      │
│  - React Query缓存                                                   │
│  - Zustand状态管理                                                   │
│  - WebSocket客户端                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.7 外部服务商完整对接清单

| 服务商 | 类型 | 官网 | 注册流程 | API Key获取 | 月费用 | 用途 |
|--------|------|------|----------|-------------|--------|------|
| **Binance** | 交易所 | binance.com | 企业邮箱注册+KYC L2 | API管理页面 | 免费 | 主行情源 |
| **Coinbase Exchange** | 交易所 | exchange.coinbase.com | 企业注册 | API设置 | 免费 | 备用行情源 |
| **Kaiko** | 数据聚合 | kaiko.com | 联系销售 | Dashboard | $500+ | 机构级历史数据 |
| **CoinGecko** | 数据聚合 | coingecko.com | 邮箱注册 | API Pricing | $0-$129 | 市值/元数据 |
| **CryptoCompare** | 数据聚合 | cryptocompare.com | 邮箱注册 | API Dashboard | $0-$79 | 社交数据 |
| **Nansen** | 链上分析 | nansen.ai | 企业注册 | API Dashboard | $1500+ | 聪明钱追踪 |
| **Alchemy** | 节点服务 | alchemy.com | 邮箱注册 | Dashboard | $0-$49 | ETH/BSC节点 |
| **Infura** | 节点服务 | infura.io | 邮箱注册 | Dashboard | $0-$225 | ETH节点 |
| **Chainlink** | 预言机 | chain.link | 无需注册 | 公开API | 免费 | 价格喂价 |
| **MoonPay** | 法币入金 | moonpay.com | 企业注册 | Dashboard | 按交易收费 | 信用卡买币 |
| **Stripe** | 支付网关 | stripe.com | 企业注册 | Dashboard | 2.9%+30c | 信用卡支付 |
| **Adyen** | 支付网关 | adyen.com | 企业注册 | Dashboard | 定制 | 全球支付 |
| **Twilio** | SMS | twilio.com | 邮箱注册 | Console | 按条收费 | 短信验证码 |
| **SendGrid** | Email | sendgrid.com | 邮箱注册 | Dashboard | $0-$90 | 邮件通知 |
| **阿里云** | OCR/人脸 | aliyun.com | 企业注册 | RAM控制台 | 按次收费 | KYC认证 |
| **腾讯云** | OCR/人脸 | cloud.tencent.com | 企业注册 | 控制台 | 按次收费 | KYC备用 |

---

## 第六部分：5W2H分阶段执行计划

### 6.1 执行总览

| 维度 | 内容 |
|------|------|
| **What (做什么)** | 将ZS Exchange从30%完成度推进到100%，涵盖数据库层、API层、前端UI、外部服务对接 |
| **Why (为什么做)** | 当前项目只有业务逻辑层（275个TS文件），缺少数据库持久化、API接口、完整前端，无法作为完整系统运行 |
| **Who (谁来做)** | 技术团队12人（后端4人、前端4人、DBA 1人、DevOps 1人、QA 1人、项目经理1人） |
| **When (何时做)** | 总工期6个月（26周），分4个阶段执行 |
| **Where (在哪做)** | 远程开发 + 深圳研发中心集中联调 |
| **How (怎么做)** | 敏捷开发（2周一个Sprint），每日站会，每周复盘 |
| **How much (花多少)** | 人力成本约180万，外部服务约15万/年，基础设施约5万/月 |

### 6.2 四阶段执行路线图

```
【第一阶段：地基建设】第1-6周（6周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
目标：数据库设计完成 + API框架搭建 + 核心接口开发

Week 1-2: 数据库设计
  - DBA: 完成100张表的设计与创建
  - DBA: 完成200+索引、50+存储过程
  - 后端: 安装Prisma，配置ORM
  - 后端: 编写Repository层（32个模块）

Week 3-4: API框架搭建
  - 后端Leader: 搭建API中间件（认证/限流/日志/错误处理）
  - 后端Leader: 设计统一响应格式
  - 后端Leader: 配置Swagger/OpenAPI文档
  - DevOps: 搭建开发环境（Docker Compose）

Week 5-6: 核心API开发
  - 后端A: 认证API（注册/登录/2FA/密码）
  - 后端B: 行情API（Ticker/K线/深度/成交）
  - 后端C: 钱包API（余额/充值/提币）
  - QA: 编写API测试用例

验收标准：
  - 数据库100张表创建成功，100万测试数据导入
  - 50个核心API可调用（Postman测试通过）
  - 行情数据可从Binance实时获取并存储


【第二阶段：主体建设】第7-14周（8周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
目标：所有API开发完成 + 前端核心页面完成 + 行情对接完成

Week 7-8: 交易API + 前端交易页
  - 后端B: 交易API（下单/撤单/订单查询/持仓）
  - 后端B: WebSocket行情推送服务
  - 前端B: 现货交易页完整实现
  - 前端B: K线图表集成（TradingView/ECharts）

Week 9-10: DeFi API + 前端DeFi页
  - 后端C: DeFi API（兑换/流动性/质押/收益）
  - 前端C: DeFi页面完整实现
  - 前端C: 钱包连接（Wagmi + MetaMask）

Week 11-12: 其他API + 前端用户中心
  - 后端A: KYC/通知/用户管理API
  - 前端A: 用户中心/安全设置/KYC流程
  - 前端A: 通知中心/消息推送

Week 13-14: Admin后台 + 行情聚合
  - 后端D: Admin后台API（45个接口）
  - 前端D: Admin后台管理页面
  - 后端B: 多源行情聚合（Binance/Coinbase/Kaiko）
  - 后端B: 数据归一化与价格发现

验收标准：
  - 222个API全部开发完成，Postman测试通过率>95%
  - 前端核心页面（交易/钱包/DeFi/用户中心）可正常使用
  - 行情数据实时推送延迟<200ms


【第三阶段：完善与测试】第15-20周（6周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
目标：前端全部完成 + 集成测试 + 性能优化 + 安全审计

Week 15-16: 前端完善
  - 前端C: H5移动端页面适配（60个页面）
  - 前端D: 门户/内容/社区页面
  - 前端Leader: 性能优化（首屏<2s，Lighthouse>80）

Week 17-18: 集成测试
  - QA: 编写集成测试脚本（50个场景）
  - QA: 自动化测试（Playwright/Cypress）
  - 全员: Bug修复冲刺

Week 19-20: 安全审计 + 性能压测
  - 后端Leader: 安全漏洞扫描（SQL注入/XSS/CSRF）
  - DevOps: 压力测试（JMeter/k6，目标QPS>1000）
  - DBA: 数据库性能优化（慢查询优化、索引调优）

验收标准：
  - 前端所有页面可正常使用
  - 集成测试通过率>95%
  - 安全扫描无高危漏洞
  - 压测QPS>1000，P99<100ms


【第四阶段：部署与上线】第21-26周（6周）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
目标：生产环境部署 + 监控配置 + 灰度发布 + 正式上线

Week 21-22: 生产环境准备
  - DevOps: K8s集群部署（3节点，高可用）
  - DevOps: CI/CD流水线配置（GitHub Actions）
  - DevOps: 监控告警配置（Prometheus + Grafana + AlertManager）
  - DBA: 生产数据库迁移 + 主从配置

Week 23-24: 灰度发布
  - 全员: 内部测试环境验证
  - 全员: 邀请100名种子用户内测
  - 全员: Bug修复与优化

Week 25-26: 正式上线
  - 全员: 生产环境切换
  - 全员: 7x24小时值班（上线首周）
  - 项目经理: 项目复盘与文档归档

验收标准：
  - 生产环境稳定运行7天无重大故障
  - 监控告警无漏报/误报
  - 用户反馈满意度>80%
```

### 6.3 每周执行日历（示例：Week 1-2）

| 日期 | 时间 | 事项 | 参与人 | 输出物 |
|------|------|------|--------|--------|
| **周一** | 09:30 | Sprint Kickoff会议 | 全员 | Sprint计划 |
| | 10:00 | DBA开始core Schema设计 | DBA | core.sql |
| | 10:00 | 后端安装Prisma | 后端全员 | prisma/schema.prisma |
| | 14:00 | 前端Leader搭建Store架构 | 前端Leader | stores/目录 |
| | 17:00 | 每日站会（15分钟） | 全员 | 进度更新 |
| **周二** | 09:30 | DBA继续trade Schema设计 | DBA | trade.sql |
| | 10:00 | 后端A编写users Repository | 后端A | users.repo.ts |
| | 14:00 | 前端A搭建React Query | 前端A | queries/目录 |
| | 17:00 | 每日站会 | 全员 | 进度更新 |
| **周三** | 09:30 | DBA继续wallet Schema设计 | DBA | wallet.sql |
| | 10:00 | 后端B编写orders Repository | 后端B | orders.repo.ts |
| | 14:00 | 前端B编写TradeForm组件 | 前端B | TradeForm.tsx |
| | 17:00 | 每日站会 | 全员 | 进度更新 |
| **周四** | 09:30 | DBA继续market Schema设计 | DBA | market.sql |
| | 10:00 | 后端C编写balances Repository | 后端C | balances.repo.ts |
| | 14:00 | 前端C编写OrderBook组件 | 前端C | OrderBook.tsx |
| | 17:00 | 每日站会 | 全员 | 进度更新 |
| **周五** | 09:30 | DBA完成所有Schema设计 | DBA | 完整SQL脚本 |
| | 10:00 | 后端Leader审核Repository代码 | 后端Leader | Code Review |
| | 14:00 | 前端Leader审核组件代码 | 前端Leader | Code Review |
| | 16:00 | Sprint Review会议 | 全员 | 演示进度 |
| | 17:00 | Sprint Retro会议 | 全员 | 改进项 |

### 6.4 关键里程碑检查点

| 里程碑 | 时间 | 检查项 | 通过标准 | 负责人 |
|--------|------|--------|----------|--------|
| M1 | Week 2末 | 数据库设计完成 | 100张表创建成功，100万测试数据导入 | DBA |
| M2 | Week 4末 | API框架搭建完成 | 中间件/认证/限流/日志全部可用 | 后端Leader |
| M3 | Week 6末 | 核心API可用 | 50个API测试通过率>90% | 后端Leader |
| M4 | Week 10末 | 交易功能可用 | 可下单/撤单/查看订单 | 后端B+前端B |
| M5 | Week 14末 | 所有API完成 | 222个API全部开发完成 | 后端Leader |
| M6 | Week 16末 | 前端核心页完成 | 交易/钱包/DeFi/用户中心可用 | 前端Leader |
| M7 | Week 20末 | 测试通过 | 集成测试>95%，无高危漏洞 | QA |
| M8 | Week 22末 | 生产环境就绪 | K8s部署完成，监控可用 | DevOps |
| M9 | Week 24末 | 灰度发布完成 | 100名种子用户内测通过 | 项目经理 |
| M10 | Week 26末 | 正式上线 | 稳定运行7天 | 项目经理 |

---

## 第七部分：人力、资源与预算清单

### 7.1 团队配置

| 角色 | 人数 | 职责 | 月薪（万元） | 工期（月） | 小计（万元） |
|------|------|------|-------------|-----------|-------------|
| 技术总监/架构师 | 1 | 技术决策、架构设计、Code Review | 5 | 6 | 30 |
| 后端Leader | 1 | 后端技术管理、API框架搭建 | 4 | 6 | 24 |
| 后端开发A | 1 | 认证/用户/KYC/通知API | 2.5 | 6 | 15 |
| 后端开发B | 1 | 交易/行情/WebSocket | 2.5 | 6 | 15 |
| 后端开发C | 1 | 钱包/DeFi/Webhook | 2.5 | 6 | 15 |
| 后端开发D | 1 | Admin后台/结算/监控 | 2.5 | 6 | 15 |
| 前端Leader | 1 | 前端技术管理、性能优化 | 4 | 6 | 24 |
| 前端开发A | 1 | 用户中心/钱包/认证页面 | 2.5 | 6 | 15 |
| 前端开发B | 1 | 交易页面/行情图表 | 2.5 | 6 | 15 |
| 前端开发C | 1 | DeFi/H5移动端 | 2.5 | 6 | 15 |
| 前端开发D | 1 | Admin后台/门户页面 | 2.5 | 6 | 15 |
| DBA | 1 | 数据库设计/优化/运维 | 3 | 6 | 18 |
| DevOps工程师 | 1 | CI/CD/K8s/监控 | 3 | 4 | 12 |
| QA工程师 | 1 | 测试用例/自动化测试 | 2 | 4 | 8 |
| 项目经理 | 1 | 进度管理/协调/汇报 | 2 | 6 | 12 |
| **合计** | **15人** | - | - | - | **273万** |

### 7.2 外部服务费用（首年）

| 服务商 | 费用类型 | 月费用 | 年费用 | 备注 |
|--------|----------|--------|--------|------|
| AWS/阿里云服务器 | 基础设施 | 3万 | 36万 | 8核32G x 6台 |
| PostgreSQL RDS | 数据库 | 0.5万 | 6万 | 主从+只读副本 |
| Redis ElastiCache | 缓存 | 0.3万 | 3.6万 | 集群模式 |
| Kaiko | 数据服务 | 0.5万 | 6万 | 机构级行情 |
| CoinGecko Pro | 数据服务 | 0.1万 | 1.2万 | 市值数据 |
| Nansen | 链上分析 | 0.15万 | 1.8万 | 聪明钱追踪 |
| Alchemy | 节点服务 | 0.05万 | 0.6万 | ETH/BSC节点 |
| 阿里云OCR | KYC服务 | 按次 | 0.5万 | 身份证识别 |
| 阿里云活体检测 | KYC服务 | 按次 | 0.3万 | 人脸识别 |
| Twilio | SMS | 按条 | 0.5万 | 短信验证码 |
| SendGrid | Email | 按量 | 0.2万 | 邮件通知 |
| 域名+CDN+SSL | 基础服务 | 0.1万 | 1.2万 | CloudFlare Pro |
| **合计** | - | **5.05万/月** | **60.6万/年** | - |

### 7.3 总预算

| 项目 | 金额（万元） |
|------|-------------|
| 人力成本（6个月） | 273 |
| 基础设施（首年） | 60.6 |
| 应急储备（10%） | 33.4 |
| **总计** | **367万** |

---

## 第八部分：风险清单与应对策略

### 8.1 风险矩阵

| 风险ID | 风险描述 | 可能性 | 影响 | 等级 | 应对策略 | 负责人 |
|--------|----------|--------|------|------|----------|--------|
| R01 | 核心开发人员离职 | 中 | 高 | 高 | 代码文档化、知识分享、AB角备份 | 项目经理 |
| R02 | Binance API限流/封禁 | 中 | 高 | 高 | 多源聚合、备用源切换、限流器 | 后端B |
| R03 | 数据库性能瓶颈 | 中 | 高 | 高 | 分区表、读写分离、Redis缓存、CQRS | DBA |
| R04 | 安全漏洞被利用 | 低 | 极高 | 高 | 代码审计、渗透测试、Bug Bounty | 后端Leader |
| R05 | 第三方KYC服务故障 | 中 | 中 | 中 | 双供应商（阿里云+腾讯云） | 后端A |
| R06 | 需求变更频繁 | 高 | 中 | 中 | 变更控制流程、Sprint缓冲时间 | 项目经理 |
| R07 | 前端性能不达标 | 中 | 中 | 中 | 性能预算、Lighthouse监控、代码分割 | 前端Leader |
| R08 | 测试覆盖不足 | 中 | 中 | 中 | 强制Code Coverage>80%、自动化测试 | QA |
| R09 | 外部服务商涨价 | 低 | 低 | 低 | 合同锁定价格、备选供应商 | 项目经理 |
| R10 | 合规政策变化 | 低 | 高 | 中 | 法务跟踪、合规官参与、灵活架构 | 合规官 |

### 8.2 关键风险详细应对

#### R02: Binance API限流/封禁应对方案

```
风险场景：
- 请求过频导致IP被封（429错误）
- 持续429后IP被自动封禁24小时（418错误）
- Binance API服务中断

应对策略：
1. 限流器（已实现）
   - Redis滑动窗口限流
   - 权重预算管理
   - 请求队列缓冲

2. 多源故障转移
   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
   │  Binance    │────▶│  Coinbase   │────▶│   Kaiko     │
   │  (主源 50%) │     │  (备用 30%) │     │  (备用 20%) │
   └─────────────┘     └─────────────┘     └─────────────┘
        │                    │                    │
        └────────────────────┴────────────────────┘
                           │
                    ┌──────▼──────┐
                    │  归一化层   │
                    │ 价格发现    │
                    └─────────────┘

3. 降级策略
   - Level 1: 主源正常，使用加权中位数
   - Level 2: 主源故障，切换到备用源
   - Level 3: 所有源故障，使用缓存数据（Redis 10分钟TTL）
   - Level 4: 所有源故障+缓存过期，暂停交易，显示维护页面
```

#### R03: 数据库性能瓶颈应对方案

```
性能指标目标：
- 订单写入: >1000 TPS
- 查询响应: P99 < 50ms
- 连接数: < 500

优化策略：
1. 分区表
   - orders按created_at按月分区
   - trades按created_at按月分区
   - login_history按created_at按月分区

2. 读写分离
   - 主库: 写操作（订单/成交/充值/提币）
   - 从库1: 读操作（行情查询/历史数据）
   - 从库2: 报表查询（Admin后台统计）

3. 缓存策略
   - Redis: Ticker（10s TTL）、Depth（5s TTL）、K线（1h TTL）
   - 本地缓存: 交易对配置（1h TTL）

4. 索引优化
   - 所有WHERE字段建立索引
   - 复合索引遵循最左前缀原则
   - 定期分析慢查询日志（pg_stat_statements）

5. 连接池
   - Prisma连接池: 最大20连接
   - PgBouncer: 事务模式，最大100连接
```

#### R04: 安全漏洞应对方案

```
安全措施清单：

【应用安全】
- 输入校验: 所有API参数使用Zod Schema校验
- SQL注入防护: 使用Prisma ORM，禁止拼接SQL
- XSS防护: 前端React自动转义，CSP策略
- CSRF防护: SameSite=Strict Cookie
- 敏感数据加密: AES-256加密存储私钥/API密钥

【认证安全】
- JWT: RS256非对称加密，过期时间24小时
- 密码: bcrypt哈希，salt rounds 12
- 2FA: TOTP + 短信 + 邮件多重验证
- 会话: 设备指纹 + IP绑定 + 异常登录检测

【交易安全】
- 交易密码: 独立于登录密码
- 提币审核: 大额提币人工审核（>$10,000）
- 风控引擎: 实时检测异常交易模式
- 资金冻结: 可疑账户自动冻结

【审计安全】
- 操作日志: 所有管理操作记录
-  immutable日志: 使用append-only表
- 定期审计: 每月安全审计报告

【渗透测试】
- 上线前: 第三方安全公司渗透测试
- 每季度: 自动化安全扫描（Snyk/Dependabot）
- Bug Bounty: 上线后启动漏洞赏金计划
```

---

## 附录A：外部服务商对接清单

### A.1 必须注册的服务商（按优先级）

| 优先级 | 服务商 | 类型 | 注册地址 | 所需资料 | 预计时间 | 费用 |
|--------|--------|------|----------|----------|----------|------|
| P0 | Binance | 交易所 | binance.com | 企业邮箱+营业执照 | 1-3天 | 免费 |
| P0 | AWS/阿里云 | 云服务器 | aws.amazon.com | 企业邮箱+信用卡 | 即时 | 按需 |
| P0 | 阿里云 | OCR/KYC | aliyun.com | 企业实名认证 | 1天 | 按次 |
| P1 | Coinbase | 交易所 | exchange.coinbase.com | 企业注册 | 3-5天 | 免费 |
| P1 | Kaiko | 数据 | kaiko.com | 企业信息表单 | 3-7天 | $500+/月 |
| P1 | CoinGecko | 数据 | coingecko.com | 邮箱 | 即时 | $129/月 |
| P1 | Alchemy | 节点 | alchemy.com | 邮箱 | 即时 | $49/月 |
| P2 | Nansen | 链上 | nansen.ai | 企业注册 | 3-7天 | $1500+/月 |
| P2 | MoonPay | 法币入金 | moonpay.com | 企业注册+合规审核 | 2-4周 | 按交易 |
| P2 | Stripe | 支付 | stripe.com | 企业注册+银行账户 | 1-2周 | 2.9%+30c |
| P2 | Twilio | SMS | twilio.com | 邮箱+手机号 | 即时 | 按条 |
| P2 | SendGrid | Email | sendgrid.com | 邮箱 | 即时 | $90/月 |

### A.2 注册资料准备清单

| 资料 | 用途 | 状态 | 负责人 |
|------|------|------|--------|
| 企业营业执照 | 所有服务商注册 | 需确认 | 项目经理 |
| 企业邮箱（如 tech@zs-exchange.com） | 所有服务商注册 | 需申请 | 项目经理 |
| 企业银行账户 | Stripe/Adyen/MoonPay | 需申请 | 财务 |
| 域名（zs-exchange.com） | 网站/邮件/SSL | 需购买 | DevOps |
| SSL证书（EV/OV） | HTTPS/安全 | 需购买 | DevOps |
| DUNS编号 | 部分服务商需要 | 需申请 | 项目经理 |
| 服务器出口IP | Binance API白名单 | 需确定 | DevOps |

---

## 附录B：代码规范与验收标准

### B.1 代码规范

| 规范 | 要求 | 工具 |
|------|------|------|
| TypeScript | 严格模式（strict: true） | tsconfig.json |
| ESLint | Next.js推荐配置 | eslint-config-next |
| Prettier | 2空格缩进，单引号 | .prettierrc |
| 命名规范 | PascalCase（组件/类型）、camelCase（变量/函数） | - |
| 文件命名 | kebab-case（组件）、camelCase（工具） | - |
| 注释规范 | JSDoc（公共API）、行内注释（复杂逻辑） | - |
| 提交规范 | Conventional Commits | commitlint |

### B.2 验收标准

| 层级 | 验收项 | 标准 | 检查方式 |
|------|--------|------|----------|
| 数据库 | 表结构 | 100张表创建成功 | Prisma Migrate |
| 数据库 | 数据完整性 | 无外键违反，无孤儿记录 | 自动化测试 |
| 数据库 | 性能 | QPS>1000，P99<100ms | k6压测 |
| API | 功能 | 222个接口全部可调用 | Postman Collection |
| API | 性能 | P99<50ms | k6压测 |
| API | 安全 | 无SQL注入/XSS/CSRF漏洞 | Snyk扫描 |
| 前端 | 功能 | 所有页面可正常访问 | E2E测试 |
| 前端 | 性能 | Lighthouse>80 | Lighthouse CI |
| 前端 | 兼容 | Chrome/Firefox/Safari/Edge | BrowserStack |
| 集成 | 端到端 | 注册->充值->交易->提币全流程 | 手工测试 |
| 集成 | 行情 | 实时推送延迟<200ms | 日志分析 |

---

**文档结束**

**编制**：技术团队  
**审核**：待补充  
**批准**：待补充  
**版本**：v1.0  
**日期**：2026-06-25  
**下次更新**：每周五更新进度


