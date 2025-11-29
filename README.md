# FemPunk-Nushu-service

一个基于区块链的协作画布平台后端服务，支持用户购买颜色、创建画布、记录贡献和分配收益。

## 项目概述

FemPunk-Nushu-service 是一个 Web3 应用的后端服务，提供以下核心功能：

- **颜色管理**: 用户可以购买和拥有独特的颜色NFT
- **画布系统**: 每日创建协作画布，用户可以使用拥有的颜色进行创作
- **贡献追踪**: 记录用户对画布的贡献度
- **收益分配**: 根据贡献比例自动分配画布销售收益
- **用户管理**: 用户注册和钱包地址管理

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: PostgreSQL
- **区块链**: Ethereum + ethers.js
- **智能合约**: ERC1155 (画布NFT) + ERC721 (颜色NFT)

## 安装和运行

### 环境要求

- Node.js >= 16.0.0
- PostgreSQL >= 12.0
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd FemPunk-Nushu-service
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env` 文件并配置以下变量：
```env
# 数据库配置
DB_URL=postgresql://username:password@localhost:5432/database_name

# 智能合约地址
CANVAS_CONTRACT_ADDRESS=0x...
COLORS_CONTRACT_ADDRESS=0x...
REVENUE_CONTRACT_ADDRESS=0x...
CONTRIBUITION_CONTRACT_ADDRESS=0x...

# 钱包私钥
PRIVATE_KEY=your_private_key

# 服务端口
PORT=3001
```

4. 初始化数据库
```bash
# 执行数据库初始化脚本
psql -d your_database -f db.sql
psql -d your_database -f db_initdata.sql
```

5. 启动服务
```bash
npm start
```

服务将在 `http://localhost:3001` 启动。

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3001`
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

### 2.2 根据日期获取画布

**GET** `/api/canvas/:day_timestamp`

根据日期时间戳获取画布信息。

**路径参数**:
- `day_timestamp`: 日期时间戳（毫秒）

### 2.3 根据ID获取画布

**GET** `/api/canvas/id/:canvas_id`

根据画布ID获取画布信息。

**路径参数**:
- `canvas_id`: 画布唯一标识符

### 2.4 创建画布

**POST** `/api/canvas/create`

创建新的每日画布。

**请求参数**:
```json
{
  "day_timestamp": 1760976000000,
  "metadata_uri": "ipfs://...",
  "supply": 100,
  "creator": "0x84228976433481050297e5780D80c3141D0BEACf"
}
```

### 2.5 铸造画布NFT

**POST** `/api/canvas/mint`

将画布铸造为ERC1155 NFT，默认供应量为100。

**请求参数**:
```json
{
  "canvas_id": "123456789"
}
```

### 2.6 记录画布购买

**POST** `/api/canvas/purchase`

用户购买画布NFT后，记录购买信息到数据库。

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "buyer_address": "0x1234...",
  "tx_hash": "0xabc123...",
  "amount_wei": "1000000000000000"
}
```

### 2.7 完成画布（测试用）

**POST** `/api/canvas/finalize`

一次性完成铸造、贡献记录和收益分配（仅用于测试）。

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

### 3.2 链上记录贡献

**POST** `/api/contributions/recordOnChain`

将画布的所有贡献记录到区块链。

### 3.3 获取画布贡献列表

**GET** `/api/contributions/:canvas_id`

获取指定画布的所有贡献记录。

### 3.4 计算画布销售总额

**POST** `/api/contributions/calculateSales`

在铸造画布时统计总销售金额。

### 3.5 获取用户参与的画布

**GET** `/api/contributions/contributor/:address`

获取指定用户有贡献的所有画布列表。

---

## 4. 收益管理 (Revenue)

### 4.1 获取画布收益

**POST** `/api/revenue/getCanvasRevenue`

获取用户在指定画布的收益份额。

**请求参数**:
```json
{
  "contributor": "0x1234...",
  "canvas_id": "123456789"
}
```

### 4.2 获取用户所有收益

**GET** `/api/revenue/user/:address`

获取用户在所有画布的收益记录。

### 4.3 记录收益提取

**POST** `/api/revenue/recordClaim`

贡献者在前端调用合约提取收益后，记录提取信息到数据库。

**请求参数**:
```json
{
  "contributor": "0x1234...",
  "canvas_id": "123456789",
  "tx_hash": "0xabc123..."
}
```

---

## 5. 用户管理 (Users)

### 5.1 获取所有用户

**GET** `/api/users`

获取所有注册用户列表。

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

### 5.3 更新用户地址

**POST** `/api/users/updateAddress`

更新用户的钱包地址。

### 5.4 根据ID获取用户

**GET** `/api/users/:user_id`

获取指定用户的详细信息。

---

## 6. 管理员接口 (Admin)

### 6.1 创建画布

**POST** `/api/admin/create`

管理员创建新画布。

### 6.2 铸造画布NFT

**POST** `/api/admin/mint`

管理员铸造画布NFT。

### 6.3 停止画布销售

**POST** `/api/admin/stopSales`

管理员停止指定画布的销售。

### 6.4 结算画布

**POST** `/api/admin/settle`

管理员对画布进行结算，调用智能合约分配收益。

**结算规则**:
1. 平台费用 = 总销售额 × 1%
2. 可分配金额 = 总销售额 - 平台费用
3. 每个贡献者收益 = 可分配金额 × (个人贡献 / 总贡献)

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

## 业务流程

### 完整的画布生命周期

#### 阶段1：创建和铸造
1. **创建画布**: `POST /api/canvas/create`
2. **铸造NFT**: `POST /api/canvas/mint`

#### 阶段2：用户参与和购买
3. **用户贡献**: `POST /api/contributions/record`
4. **用户购买**: 前端调用合约 + `POST /api/canvas/purchase`

#### 阶段3：结算和分配
5. **停止销售**: `POST /api/admin/stopSales`
6. **结算分配**: `POST /api/admin/settle`
7. **用户提取收益**: 前端调用合约 + `POST /api/revenue/recordClaim`

---

## 注意事项

1. **时间戳**: 所有时间戳使用毫秒级Unix时间戳
2. **地址格式**: 以太坊地址格式为 `0x` 开头的42位十六进制字符串
3. **金额单位**: 所有金额单位为 wei（1 ETH = 10^18 wei）
4. **区块链交互**: 所有区块链交互操作需要等待交易确认
5. **平台费率**: 当前平台费率为 1%

---

## 开发和测试

### 测试

项目包含完整的测试套件，位于 `test/` 目录：

```bash
# 运行所有测试
npm test

# 运行特定测试
node test/testUserFlow.js
node test/testAdminFlow.js
```

### 开发模式

```bash
# 使用 nodemon 启动开发服务器
npm run dev
```

---

## 许可证

MIT License

---

## 联系方式

如有问题或建议，请联系开发团队。
