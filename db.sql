-- ============================================================
-- FemCanvas PostgreSQL 完整建表脚本
-- Author: Allen Wang
-- 所有时间字段使用 BIGINT 存储毫秒级时间戳
-- ============================================================

-- ========================================
-- 1. 用户表 users
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    uuid BIGINT NOT NULL UNIQUE,
    email VARCHAR(128) DEFAULT NULL,
    address VARCHAR(64) DEFAULT NULL,
    username VARCHAR(64) DEFAULT NULL,
    avatar_url TEXT DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    status SMALLINT DEFAULT 1,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE users IS '用户表';
COMMENT ON COLUMN users.id IS '自增主键';
COMMENT ON COLUMN users.email IS '用户邮箱';
COMMENT ON COLUMN users.address IS '钱包地址';
COMMENT ON COLUMN users.username IS '用户名';
COMMENT ON COLUMN users.avatar_url IS '用户头像 URL';
COMMENT ON COLUMN users.bio IS '用户简介';
COMMENT ON COLUMN users.status IS '状态 1=启用 0=禁用';
COMMENT ON COLUMN users.created_ts IS '创建时间（毫秒）';
COMMENT ON COLUMN users.updated_ts IS '更新时间（毫秒）';
COMMENT ON COLUMN users.is_deleted IS '逻辑删除标志 0=未删除 1=删除';
CREATE INDEX idx_users_wallet ON users(address);

-- ========================================
-- 2. 后台管理账号表 admin_accounts
-- ========================================
CREATE TABLE IF NOT EXISTS admin_accounts (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    role SMALLINT DEFAULT 1,
    status SMALLINT DEFAULT 1,
    last_login_ts BIGINT DEFAULT NULL,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE admin_accounts IS '后台管理员账号表';
COMMENT ON COLUMN admin_accounts.id IS '自增主键';
COMMENT ON COLUMN admin_accounts.username IS '登录用户名';
COMMENT ON COLUMN admin_accounts.password_hash IS '密码';
COMMENT ON COLUMN admin_accounts.role IS '管理员角色';
COMMENT ON COLUMN admin_accounts.status IS '状态 1=启用 0=禁用';
COMMENT ON COLUMN admin_accounts.last_login_ts IS '上次登录时间';
COMMENT ON COLUMN admin_accounts.created_ts IS '创建时间';
COMMENT ON COLUMN admin_accounts.updated_ts IS '更新时间';
COMMENT ON COLUMN admin_accounts.is_deleted IS '逻辑删除';
-- 插入默认管理员
INSERT INTO admin_accounts(
    username, password_hash, role, status, created_ts, updated_ts, is_deleted
) VALUES (
    'admin',
    MD5('123456789'),
    9,
    1,
    EXTRACT(EPOCH FROM NOW()) * 1000,
    EXTRACT(EPOCH FROM NOW()) * 1000,
    0
);

-- ========================================
-- 3. 颜色表 colors
-- ========================================
CREATE TABLE IF NOT EXISTS colors (
    id BIGSERIAL PRIMARY KEY,
    color_id BIGINT NOT NULL UNIQUE,
    color_code VARCHAR(16) NOT NULL,
    metadata_uri VARCHAR(255) DEFAULT NULL,
    owner_address VARCHAR(64) DEFAULT NULL,
    price_wei NUMERIC(36,0) DEFAULT 0,
    tx_hash VARCHAR(66) DEFAULT NULL,
    status SMALLINT DEFAULT 1,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE colors IS '颜色表';
COMMENT ON COLUMN colors.id IS '自增主键';
COMMENT ON COLUMN colors.color_id IS '后端生成唯一颜色 UUID';
COMMENT ON COLUMN colors.color_code IS '颜色码，例如 #FFFFFF';
COMMENT ON COLUMN colors.owner_address IS '用户address';
COMMENT ON COLUMN colors.price_wei IS '价格，单位 wei';
COMMENT ON COLUMN colors.tx_hash IS '上链交易 hash';
COMMENT ON COLUMN colors.status IS '状态 1=启用 0=禁用';
COMMENT ON COLUMN colors.created_ts IS '创建时间';
COMMENT ON COLUMN colors.updated_ts IS '更新时间';
COMMENT ON COLUMN colors.is_deleted IS '逻辑删除';
CREATE INDEX idx_colors_owner ON colors(owner_address);
CREATE INDEX idx_colors_code ON colors(color_code);

-- ========================================
-- 4. 画布表 canvases
-- ========================================
CREATE TABLE IF NOT EXISTS canvases (
    id BIGSERIAL PRIMARY KEY,
    canvas_id NUMERIC(78, 0) NOT NULL UNIQUE,
    day_timestamp BIGINT NOT NULL,
    metadata_uri VARCHAR(255) NOT NULL,
    creator VARCHAR(64) NOT NULL,
    price BIGINT DEFAULT 0,
    total_contributions BIGINT DEFAULT 0,
    total_raised_wei NUMERIC(36,0) DEFAULT 0,
    finalized SMALLINT DEFAULT 0,
    tx_hash VARCHAR(66) DEFAULT NULL,
    status SMALLINT DEFAULT 1,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE canvases IS '画布表';
COMMENT ON COLUMN canvases.id IS '自增主键';
COMMENT ON COLUMN canvases.canvas_id IS '系统生成的 Canvas ID 或 ERC1155 tokenId';
COMMENT ON COLUMN canvases.day_timestamp IS '画布日期零点时间戳（毫秒）';
COMMENT ON COLUMN canvases.metadata_uri IS '存储 metadata 的 IPFS URI';
COMMENT ON COLUMN canvases.creator IS '创建者用户 address';
COMMENT ON COLUMN canvases.price IS '画布单价';
COMMENT ON COLUMN canvases.total_contributions IS '总贡献量';
COMMENT ON COLUMN canvases.total_raised_wei IS '总筹集金额（wei）';
COMMENT ON COLUMN canvases.finalized IS '是否结算完成 0=未结算 1=结算完成';
COMMENT ON COLUMN canvases.tx_hash IS '上链交易 hash';
COMMENT ON COLUMN canvases.status IS '状态';
COMMENT ON COLUMN canvases.created_ts IS '创建时间';
COMMENT ON COLUMN canvases.updated_ts IS '更新时间';
COMMENT ON COLUMN canvases.is_deleted IS '逻辑删除';
CREATE UNIQUE INDEX idx_canvases_day ON canvases(day_timestamp);
CREATE INDEX idx_canvases_creator ON canvases(creator_id);

-- ========================================
-- 5. 贡献表 contributions
-- ========================================
CREATE TABLE IF NOT EXISTS contributions (
    id BIGSERIAL PRIMARY KEY,
    canvas_id NUMERIC(78, 0) NOT NULL,
    contributor VARCHAR(64) NOT NULL,
    contributions INT NOT NULL,
    tx_hash VARCHAR(128) DEFAULT NULL,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE contributions IS '贡献记录表';
COMMENT ON COLUMN contributions.id IS '自增主键';
COMMENT ON COLUMN contributions.canvas_id IS '画布 ID';
COMMENT ON COLUMN contributions.contributor IS '贡献者address';
COMMENT ON COLUMN contributions.contributions IS '贡献数量';
COMMENT ON COLUMN contributions.tx_hash IS '上链交易 hash';
COMMENT ON COLUMN contributions.created_ts IS '创建时间';
COMMENT ON COLUMN contributions.updated_ts IS '更新时间';
COMMENT ON COLUMN contributions.is_deleted IS '逻辑删除';
CREATE INDEX idx_contributions_canvas_user ON contributions(canvas_id, contributor);
CREATE INDEX idx_contributions_txhash ON contributions(tx_hash);

-- ========================================
-- 6. 结算表 settlements
-- ========================================
CREATE TABLE IF NOT EXISTS settlements (
    id BIGSERIAL PRIMARY KEY,
    canvas_id NUMERIC(78, 0) NOT NULL,
    total_income_wei NUMERIC(36,0) DEFAULT 0,
    distributed SMALLINT DEFAULT 0,
    settled_ts BIGINT DEFAULT NULL,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE settlements IS '结算表';
COMMENT ON COLUMN settlements.id IS '自增主键';
COMMENT ON COLUMN settlements.canvas_id IS '画布 ID';
COMMENT ON COLUMN settlements.total_income_wei IS '总收入（wei）';
COMMENT ON COLUMN settlements.distributed IS '是否分配完成 0=未 1=完成';
COMMENT ON COLUMN settlements.settled_ts IS '结算时间';
COMMENT ON COLUMN settlements.created_ts IS '创建时间';
COMMENT ON COLUMN settlements.updated_ts IS '更新时间';
COMMENT ON COLUMN settlements.is_deleted IS '逻辑删除';
CREATE INDEX idx_settlements_canvas ON settlements(canvas_id);
CREATE INDEX idx_settlements_ts ON settlements(settled_ts);

-- ========================================
-- 7. 分润表 revenue_shares
-- ========================================
CREATE TABLE IF NOT EXISTS revenue_shares (
    id BIGSERIAL PRIMARY KEY,
    settlement_id BIGINT NOT NULL,
    contributor VARCHAR(64) NOT NULL,
    canvas_id NUMERIC(78, 0) NOT NULL,
    contributions INT DEFAULT 0,
    reward_wei NUMERIC(36,0) DEFAULT 0,
    claimed SMALLINT DEFAULT 0,
    claimed_tx VARCHAR(128) DEFAULT NULL,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE revenue_shares IS '分润表';
COMMENT ON COLUMN revenue_shares.id IS '自增主键';
COMMENT ON COLUMN revenue_shares.settlement_id IS '结算记录 ID';
COMMENT ON COLUMN revenue_shares.contributor IS '贡献者address';
COMMENT ON COLUMN revenue_shares.canvas_id IS '画布 ID';
COMMENT ON COLUMN revenue_shares.contributions IS '贡献量';
COMMENT ON COLUMN revenue_shares.reward_wei IS '分润金额(wei)';
COMMENT ON COLUMN revenue_shares.claimed IS '是否已领取(0=未领取 1=已领取)';
COMMENT ON COLUMN revenue_shares.claimed_tx IS '领取交易 hash';
COMMENT ON COLUMN revenue_shares.created_ts IS '创建时间';
COMMENT ON COLUMN revenue_shares.updated_ts IS '更新时间';
COMMENT ON COLUMN revenue_shares.is_deleted IS '逻辑删除';
CREATE INDEX idx_revenue_user_canvas ON revenue_shares(contributor, canvas_id);
CREATE INDEX idx_revenue_settlement ON revenue_shares(settlement_id);

-- ========================================
-- 8. 平台配置表 platform_config
-- ========================================
CREATE TABLE IF NOT EXISTS platform_config (
    id BIGSERIAL PRIMARY KEY,
    config_key VARCHAR(64) NOT NULL UNIQUE,
    config_value VARCHAR(256) NOT NULL,
    description VARCHAR(256) DEFAULT NULL,
    created_ts BIGINT NOT NULL,
    updated_ts BIGINT NOT NULL,
    is_deleted SMALLINT DEFAULT 0
);
COMMENT ON TABLE platform_config IS '平台配置表';
COMMENT ON COLUMN platform_config.id IS '自增主键';
COMMENT ON COLUMN platform_config.config_key IS '配置键';
COMMENT ON COLUMN platform_config.config_value IS '配置值';
COMMENT ON COLUMN platform_config.description IS '配置描述';
COMMENT ON COLUMN platform_config.created_ts IS '创建时间';
COMMENT ON COLUMN platform_config.updated_ts IS '更新时间';
COMMENT ON COLUMN platform_config.is_deleted IS '逻辑删除';
