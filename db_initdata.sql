
-- ========================================
-- 初始化颜色数据
-- ========================================
-- 插入 10 个灰阶颜色，统一使用新上传的 metadata_uri
INSERT INTO colors (
    color_id,
    color_code,
    metadata_uri,
    owner_address,
    price_wei,
    tx_hash,
    status,
    created_ts,
    updated_ts,
    is_deleted
) VALUES
    (2901679367952876, '#FFFFFF', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (1342079089309930, '#E5E5E5', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (9088662171658145, '#CCCCCC', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (7656395871870435, '#B2B2B2', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (8417776330751887, '#999999', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (1064344713925674, '#7F7F7F', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (0996980585393431, '#666666', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (5750188040977308, '#4C4C4C', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (2954185897270328, '#333333', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (4270721359686718, '#000000', 'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8', NULL, 0, NULL, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0);

-- ========================================
-- 初始化画布数据
-- ========================================
INSERT INTO canvases (
    canvas_id,
    day_timestamp,
    metadata_uri,
    creator,
    price,
    total_contributions,
    total_raised_wei,
    finalized,
    tx_hash,
    status,
    created_ts,
    updated_ts,
    is_deleted
) VALUES (
    8417776330752267,                                -- 唯一的 Canvas ID
    1735142400003,                                   -- 2024-12-26 零点（毫秒时间戳）
    'https://ipfs.filebase.io/ipfs/QmPTwYnc7AfuPq7fD6bUMTdX9jFCEYMUhQHBPNXYtLpEg8',  -- 使用统一的 metadata_uri
    '0x84228976433481050297e5780D80c3141D0BEACf',    -- creator 地址
    1800000000000000,                                -- 单价 0.0018 ETH = 0.0018 * 10^18 wei
    0,                                               -- 初始贡献总量
    0,                                               -- 初始募集金额
    0,                                               -- 未结算
    NULL,                                            -- 交易 hash 先空
    1,                                               -- 状态正常
    EXTRACT(EPOCH FROM NOW()) * 1000,                -- 创建时间（毫秒）
    EXTRACT(EPOCH FROM NOW()) * 1000,                -- 更新时间（毫秒）
    0                                                -- 未删除
);