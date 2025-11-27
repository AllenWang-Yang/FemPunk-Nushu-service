# API 文档

## 基础信息

- **Base URL**: `http://localhost:3001` (开发环境)
- **Content-Type**: `application/json`
- **响应格式**: JSON

---

## 1. 颜色管理 (Colors)

### 1.1 获取所有颜色

**GET** `/api/colors`

获取所有可用的颜色列表。

**响应示例**:
```json
{
  "success": true,
  "colors": [
    {
      "id": 1,
      "color_id": 1,
      "color_code": "#FF5733",
      "owner_address": "0x...",
      "metadata_uri": "ipfs://...",
      "price_wei": "1000000000000000",
      "tx_hash": "0x...",
      "status": 1,
      "created_ts": 1234567890000,
      "updated_ts": 1234567890000
    }
  ]
}
```

---

### 1.2 记录颜色购买

**POST** `/api/colors/recordPurchase`

用户在前端调用合约购买颜色后，记录购买信息到数据库。

**前端流程**：
1. 用户在前端调用合约：`contract.buyColor(color_id, {value: price})`
2. 等待交易确认
3. 调用此接口记录购买信息

**请求参数**:
```json
{
  "color_id": 1,
  "buyer_address": "0x1234...",
  "tx_hash": "0xabc123...",
  "price_wei": "1000000000000000"
}
```

**响应示例**:
```json
{
  "success": true,
  "color_id": 1,
  "owner_address": "0x1234...",
  "tx_hash": "0xabc123..."
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Color already owned"
}
```

---

### 1.3 奖励颜色

**POST** `/api/colors/reward`

向用户奖励指定颜色。

**请求参数**:
```json
{
  "address": "0x1234...",
  "color_id": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "txHash": "0xabc123...",
  "color_code": "#FF5733"
}
```

---

### 1.4 获取用户拥有的颜色

**GET** `/api/colors/owner/:address`

获取指定地址拥有的所有颜色。

**路径参数**:
- `address`: 用户钱包地址

**响应示例**:
```json
{
  "success": true,
  "colors": [
    {
      "id": 1,
      "color_id": 1,
      "color_code": "#FF5733",
      "owner_address": "0x1234...",
      "metadata_uri": "ipfs://...",
      "price_wei": "1000000000000000"
    }
  ]
}
```

---

## 2. 画布管理 (Canvas)

### 2.1 获取所有画布

**GET** `/api/canvas`

获取所有画布列表。

**响应示例**:
```json
{
  "success": true,
  "canvas": {
    "id": 1,
    "canvas_id": "123456789",
    "day_timestamp": 1760976000000,
    "metadata_uri": "ipfs://...",
    "creator": "0x...",
    "total_raised_wei": "180000000000000000",
    "finalized": 0,
    "status": 1
  }
}
```

---

### 2.2 根据日期获取画布

**GET** `/api/canvas/:day_timestamp`

根据日期时间戳获取画布信息。

**路径参数**:
- `day_timestamp`: 日期时间戳（毫秒）

**响应示例**:
```json
{
  "success": true,
  "canvas": {
    "canvas_id": "123456789",
    "day_timestamp": 1760976000000,
    "metadata_uri": "ipfs://...",
    "creator": "0x...",
    "total_raised_wei": "180000000000000000",
    "finalized": 0,
    "tx_hash": "0x...",
    "created_ts": 1234567890000,
    "updated_ts": 1234567890000
  }
}
```

---

### 2.3 根据ID获取画布

**GET** `/api/canvas/id/:canvas_id`

根据画布ID获取画布信息。

**路径参数**:
- `canvas_id`: 画布唯一标识符

**响应示例**:
```json
{
  "success": true,
  "canvas": {
    "canvas_id": "123456789",
    "day_timestamp": 1760976000000,
    "metadata_uri": "ipfs://...",
    "creator": "0x...",
    "total_raised_wei": "180000000000000000"
  }
}
```

---

### 2.4 创建画布

**POST** `/api/canvas/create`

创建新的每日画布（每天UTC+8 00:00自动创建）。

**请求参数**:
```json
{
  "day_timestamp": 1760976000000,
  "metadata_uri": "ipfs://...",
  "supply": 100,
  "creator": "0x84228976433481050297e5780D80c3141D0BEACf"
}
```

**说明**:
- `creator` 参数可选，默认为 `0x84228976433481050297e5780D80c3141D0BEACf`

**响应示例**:
```json
{
  "success": true,
  "canvasId": "123456789"
}
```

---

### 2.5 铸造画布NFT

**POST** `/api/canvas/mint`

将画布铸造为ERC1155 NFT，默认供应量为100。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

**响应示例**:
```json
{
  "success": true,
  "txHash": "0xabc123..."
}
```

---

### 2.6 记录画布购买

**POST** `/api/canvas/purchase`

用户购买画布NFT后，记录购买信息到数据库。

**说明**：
- 用户应该在前端直接调用智能合约的 `buyCanvas(canvasId)` 函数购买
- 购买成功后，前端调用此接口更新数据库

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "buyer_address": "0x1234...",
  "tx_hash": "0xabc123...",
  "amount_wei": "1000000000000000"
}
```

**响应示例**:
```json
{
  "success": true,
  "canvas_id": "123456789",
  "total_raised_wei": "50000000000000000",
  "tx_hash": "0xabc123..."
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Canvas not found"
}
```

---

### 2.7 完成画布（一键完成 - 测试用）

**POST** `/api/canvas/finalize`

一次性完成铸造、贡献记录和收益分配（仅用于测试）。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

**响应示例**:
```json
{
  "success": true,
  "mintTxHash": "0xabc123...",
  "receiveRevenueTxHash": "0xdef456...",
  "revenueTxHash": "0xghi789..."
}
```

---

## 3. 贡献管理 (Contributions)

### 3.1 记录用户贡献

**POST** `/api/contributions/record`

记录用户对画布的贡献。

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "contributor": "0x1234...",
  "_contributions": 10
}
```

**说明**:
- 如果记录已存在，会累加贡献值
- 如果记录不存在，会创建新记录

**响应示例**:
```json
{
  "success": true
}
```

---

### 3.2 链上记录贡献

**POST** `/api/contributions/recordOnChain`

将画布的所有贡献记录到区块链。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

**响应示例**:
```json
{
  "success": true
}
```

---

### 3.3 获取画布贡献列表

**GET** `/api/contributions/:canvas_id`

获取指定画布的所有贡献记录。

**路径参数**:
- `canvas_id`: 画布唯一标识符

**响应示例**:
```json
{
  "success": true,
  "contributions": [
    {
      "id": 1,
      "canvas_id": "123456789",
      "contributor": "0x1234...",
      "contributions": 10,
      "tx_hash": "0x...",
      "created_ts": 1234567890000,
      "updated_ts": 1234567890000
    }
  ]
}
```

---

### 3.4 计算画布销售总额

**POST** `/api/contributions/calculateSales`

在铸造画布时统计总销售金额，并更新到数据库。

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "supply": 100,
  "price_wei": "1800000000000000"
}
```

**响应示例**:
```json
{
  "success": true,
  "total_sales_wei": "180000000000000000",
  "supply": 100,
  "price_wei": "1800000000000000"
}
```

---

### 3.5 获取用户参与的画布

**GET** `/api/contributions/contributor/:address`

获取指定用户有贡献的所有画布列表，按日期倒序排列。

**路径参数**:
- `address`: 用户钱包地址

**响应示例**:
```json
{
  "success": true,
  "canvases": [
    {
      "canvas_id": "123456789",
      "day_timestamp": 1760976000000,
      "metadata_uri": "ipfs://...",
      "total_raised_wei": "180000000000000000",
      "finalized": 1,
      "contributions": 10,
      "created_ts": 1234567890000
    }
  ]
}
```

---

## 4. 收益管理 (Revenue)

### 4.1 获取画布收益

**POST** `/api/revenue/getCanvasRevenue`

获取用户在指定画布的收益份额。

**请求参数**:
```json
{
  "contributor": "0x1234...",
  "cavans_id": "123456789"
}
```

**响应示例**:
```json
{
  "success": true,
  "revenue": [
    {
      "id": 1,
      "settlement_id": 1,
      "contributor": "0x1234...",
      "canvas_id": "123456789",
      "contributions": 10,
      "reward_wei": "32400000000000000",
      "claimed": 0,
      "claimed_tx": null
    }
  ]
}
```

---

### 4.2 记录收益提取

**POST** `/api/revenue/recordClaim`

贡献者在前端调用合约提取收益后，记录提取信息到数据库。

**前端流程**：
1. 用户在前端调用合约：`contract.claimRevenue(canvas_id)`
2. 等待交易确认，收益发送到用户钱包
3. 调用此接口记录提取信息

**请求参数**:
```json
{
  "contributor": "0x1234...",
  "canvas_id": "123456789",
  "tx_hash": "0xabc123..."
}
```

**响应示例**:
```json
{
  "success": true,
  "canvas_id": "123456789",
  "contributor": "0x1234...",
  "reward_wei": "32400000000000000",
  "tx_hash": "0xabc123..."
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "No claimable revenue found or already claimed"
}
```

**说明**:
- 只能记录未领取的收益（claimed=0）
- 记录成功后会更新数据库，将claimed设为1
- 收益直接从合约发送到用户钱包

---

## 5. 用户管理 (Users)

### 5.1 获取所有用户

**GET** `/api/users`

获取所有注册用户列表。

**响应示例**:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "uuid": 1234567890,
      "username": "alice",
      "email": "alice@example.com",
      "address": "0x1234...",
      "avatar_url": null,
      "bio": null,
      "status": 1,
      "created_ts": 1234567890000,
      "updated_ts": 1234567890000
    }
  ]
}
```

---

### 5.2 注册新用户

**POST** `/api/users/register`

注册新用户账户。

**请求参数**:
```json
{
  "username": "alice",
  "email": "alice@example.com",
  "address": "0x1234..."
}
```

**说明**:
- `address` 参数可选，默认为空字符串

**响应示例**:
```json
{
  "success": true
}
```

---

### 5.3 更新用户地址

**POST** `/api/users/updateAddress`

更新用户的钱包地址。

**请求参数**:
```json
{
  "user_id": 1,
  "address": "0x1234..."
}
```

**响应示例**:
```json
{
  "success": true
}
```

---

### 5.4 根据ID获取用户

**GET** `/api/users/:user_id`

获取指定用户的详细信息。

**路径参数**:
- `user_id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "uuid": 1234567890,
    "username": "alice",
    "email": "alice@example.com",
    "address": "0x1234...",
    "avatar_url": null,
    "bio": null,
    "status": 1,
    "created_ts": 1234567890000,
    "updated_ts": 1234567890000
  }
}
```

---

## 6. 管理员接口 (Admin)

### 6.1 创建画布

**POST** `/api/admin/create`

管理员创建新画布。

**请求参数**:
```json
{
  "creator_address": "0x1234...",
  "day_timestamp": 1760976000000,
  "metadata_uri": "ipfs://..."
}
```

**响应示例**:
```json
{
  "success": true,
  "canvasId": "123456789"
}
```

---

### 6.2 铸造画布NFT

**POST** `/api/admin/mint`

管理员铸造画布NFT。

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "supply": 100
}
```

**响应示例**:
```json
{
  "success": true,
  "transactionHash": "0xabc123..."
}
```

---

### 6.3 停止画布销售

**POST** `/api/admin/stopSales`

管理员停止指定画布的销售，将画布状态设为0（禁用）。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "Canvas sales stopped successfully",
  "canvas_id": "123456789"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "Canvas not found"
}
```

---

### 6.4 结算画布

**POST** `/api/admin/settle`

管理员对画布进行结算，调用智能合约分配收益，按照总销售额扣除1%平台费用后，根据贡献比例分配给所有贡献者。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

**结算规则**:
1. 平台费用 = 总销售额 × 1% (100 basis points / 10000)
2. 可分配金额 = 总销售额 - 平台费用
3. 每个贡献者收益 = 可分配金额 × (个人贡献 / 总贡献)

**结算流程**:
1. 调用合约 `receiveRevenue(canvasId)` 发送收益到合约
2. 调用合约 `distributeRevenue(canvasId)` 在链上分配收益
3. 在数据库中记录结算信息和每个贡献者的收益

**响应示例**:
```json
{
  "success": true,
  "settlement_id": 1,
  "receive_revenue_tx": "0xabc123...",
  "distribute_tx": "0xdef456...",
  "total_sales_wei": "180000000000000000",
  "platform_fee_wei": "1800000000000000",
  "distribution_wei": "178200000000000000",
  "contributors_count": 5
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "No sales to settle"
}
```

或

```json
{
  "success": false,
  "error": "No contributors found"
}
```

**说明**:
- 结算会调用智能合约，需要等待两次交易确认
- 结算成功后会创建settlement记录
- 为每个贡献者创建revenue_shares记录
- 更新画布的finalized状态为1
- 合约中会记录每个贡献者的可领取金额（claimableAmount）

---

## 错误响应格式

所有接口在发生错误时返回以下格式：

```json
{
  "success": false,
  "error": "错误信息描述"
}
```

**常见HTTP状态码**:
- `200`: 请求成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 注意事项

1. **时间戳**: 所有时间戳使用毫秒级Unix时间戳
2. **地址格式**: 以太坊地址格式为 `0x` 开头的42位十六进制字符串
3. **交易哈希**: 交易哈希格式为 `0x` 开头的66位十六进制字符串
4. **金额单位**: 所有金额单位为 wei（1 ETH = 10^18 wei）
5. **区块链交互**: 所有区块链交互操作需要等待交易确认，可能需要较长时间
6. **管理员权限**: 管理员接口需要管理员权限（当前为测试环境，权限验证已注释）
7. **画布状态**: 
   - `status=1` 表示正常销售
   - `status=0` 表示已停止销售
8. **结算状态**: 
   - `finalized=0` 表示未结算
   - `finalized=1` 表示已完成结算
9. **收益提取**: 收益提取前需要先完成画布结算
10. **贡献累加**: 多次记录同一用户对同一画布的贡献会自动累加
11. **平台费率**: 当前平台费率为 1%（合约中 platformFeeRate = 100 basis points / 10000）

---

## 业务流程示例

### 完整的画布生命周期

#### 阶段1：创建和铸造
1. **创建画布**: `POST /api/canvas/create`
2. **铸造NFT**: `POST /api/canvas/mint`（管理员铸造100个NFT到合约）

#### 阶段2：用户参与和购买
3. **用户贡献**: `POST /api/contributions/record`（用户在画布上绘制/贡献）
4. **用户购买**: 前端调用合约 `buyCanvas(canvasId, {value: price})`
5. **记录购买**: `POST /api/canvas/purchase`（更新数据库）

#### 阶段3：结算和分配
6. **停止销售**: `POST /api/admin/stopSales`
7. **结算分配**: `POST /api/admin/settle`（调用合约分配收益）
8. **用户提取收益**: 前端调用合约 `claimRevenue(canvasId)`

### 用户查询和提取收益

1. **查询参与的画布**: `GET /api/contributions/contributor/:address`
2. **查询具体收益**: `POST /api/revenue/getCanvasRevenue`
3. **前端调用合约提取**: `contract.claimRevenue(canvas_id)`
4. **记录提取**: `POST /api/revenue/recordClaim`

### 用户购买颜色

1. **查询可用颜色**: `GET /api/colors`
2. **前端调用合约购买**: `contract.buyColor(color_id, {value: price})`
3. **记录购买**: `POST /api/colors/recordPurchase`
