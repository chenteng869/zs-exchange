-- =============================================================================
-- ZS Exchange 数据库初始化脚本
-- 在 PostgreSQL 容器首次启动时自动执行
-- =============================================================================

-- 启用常用扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- Schema 划分（按业务域）
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS core;        -- 用户/认证/权限
CREATE SCHEMA IF NOT EXISTS trade;       -- 交易/订单/账本
CREATE SCHEMA IF NOT EXISTS wallet;      -- 钱包/资产
CREATE SCHEMA IF NOT EXISTS kyc;         -- KYC/合规
CREATE SCHEMA IF NOT EXISTS nft;         -- NFT铸造/系列
CREATE SCHEMA IF NOT EXISTS defi;        -- 质押/流动性
CREATE SCHEMA IF NOT EXISTS blockchain;  -- 存证/链上数据
CREATE SCHEMA IF NOT EXISTS ai;          -- AI模型/智能体
CREATE SCHEMA IF NOT EXISTS audit;       -- 审计/日志
CREATE SCHEMA IF NOT EXISTS public;      -- 公共表

-- =============================================================================
-- 公共表 - 用户
-- =============================================================================
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

CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_status ON core.users(status);

-- =============================================================================
-- 公共表 - 审计日志
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit.logs(user_id);
CREATE INDEX idx_audit_action ON audit.logs(action);
CREATE INDEX idx_audit_created ON audit.logs(created_at);

-- =============================================================================
-- 区块链存证表
-- =============================================================================
CREATE TABLE IF NOT EXISTS blockchain.notarizations (
    id BIGSERIAL PRIMARY KEY,
    biz_id VARCHAR(100) UNIQUE NOT NULL,
    file_hash VARCHAR(128) NOT NULL,
    tx_hash VARCHAR(128),
    block_number BIGINT,
    did VARCHAR(255),
    issuer VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_notar_biz ON blockchain.notarizations(biz_id);
CREATE INDEX idx_notar_hash ON blockchain.notarizations(file_hash);
CREATE INDEX idx_notar_status ON blockchain.notarizations(status);

-- =============================================================================
-- 插入演示数据
-- =============================================================================
INSERT INTO core.users (username, email, password_hash, kyc_level) VALUES
    ('demo_user', 'demo@zs.exchange', crypt('demo123', gen_salt('bf')), 2),
    ('admin', 'admin@zs.exchange', crypt('admin123', gen_salt('bf')), 3)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 完成
-- =============================================================================
DO $$ BEGIN
    RAISE NOTICE '✅ ZS Exchange 数据库初始化完成';
    RAISE NOTICE '📦 已创建 10 个业务 Schema';
    RAISE NOTICE '👤 演示账号: demo / demo123, admin / admin123';
END $$;
