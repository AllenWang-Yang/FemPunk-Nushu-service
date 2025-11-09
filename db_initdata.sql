
-- 先生成color的uuid，手动写入初始颜色数据sql中
-- 插入 10 个灰阶颜色
INSERT INTO colors (
    color_id,
    color_code,
    token_id,
    owner_id,
    price_wei,
    status,
    created_ts,
    updated_ts,
    is_deleted
) VALUES
    (2901679367952876, '#FFFFFF', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (1342079089309930, '#E5E5E5', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (9088662171658145, '#CCCCCC', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (7656395871870435, '#B2B2B2', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (8417776330751887, '#999999', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (1064344713925674, '#7F7F7F', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (0996980585393431, '#666666', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (5750188040977308, '#4C4C4C', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (2954185897270328, '#333333', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0),
    (4270721359686718, '#000000', NULL, NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0);



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
    8417776330752267,                                -- 唯一的 Canvas ID (可以随机生成或链上对应 tokenId)
    1735142400003,                                   -- 例如: 2024-12-26 零点（毫秒时间戳）
    'https://ipfs.filebase.io/ipfs/QmZ5DCAuWBtadbsdpUiWnXteduiSiGUzY6iwnfd7F49U5w',  -- metadata_uri
    '0x84228976433481050297e5780D80c3141D0BEACf',    -- creator 地址
    1800000000000000,                                -- 单价 0.0018 ETH = 0.0018 * 10^18 wei
    0,                                               -- 初始贡献总量
    0,                                               -- 初始募集金额
    0,                                               -- 未结算
    NULL,                                            -- 交易 hash 先空
    1,                                               -- 状态正常
    extract(epoch from now())*1000,                  -- 创建时间（毫秒）
    extract(epoch from now())*1000,                  -- 更新时间（毫秒）
    0                                                -- 未删除
);


INSERT INTO colors (
    color_id,
    color_code,
    metadata_uri,
    owner_address,
    price_wei,
    status,
    created_ts,
    updated_ts,
    is_deleted
) VALUES
    (2954185897270380, '#7F7F7F', 'https://ipfs.filebase.io/ipfs/QmSRD9sakiftBbot1gKPv63Tz8N76vPSmHR2n7kPTiRvfY', NULL, 0, 1, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000, 0);



    