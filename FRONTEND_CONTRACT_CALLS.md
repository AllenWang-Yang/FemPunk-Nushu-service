# 前端调用合约接口文档

## 📋 概述

本文档列出所有需要前端直接调用智能合约的接口，以及对应的后端记录接口。

---

## 🎨 1. 颜色购买

### 前端调用合约

**合约方法**: `buyColor(uint256 colorId)`

**合约地址**: `COLORS_CONTRACT_ADDRESS`

**调用流程**:

```javascript
// 1. 连接钱包
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. 创建合约实例
const colorsContract = new ethers.Contract(
  COLORS_CONTRACT_ADDRESS,
  colorsAbi,
  signer
);

// 3. 获取颜色价格
const colorPrice = await colorsContract.colorPrice(); // 或从后端API获取

// 4. 调用合约购买
const tx = await colorsContract.buyColor(colorId, {
  value: colorPrice  // 支付ETH
});

// 5. 等待交易确认
const receipt = await tx.wait();
```

**合约参数**:
- `colorId`: 颜色ID (uint256)
- `value`: 支付金额 (wei)

**合约返回**:
- 交易哈希 (transaction hash)
- 用户获得颜色NFT

---

### 后端记录接口

**接口**: `POST /api/colors/recordPurchase`

**调用时机**: 合约交易确认后

**请求参数**:
```json
{
  "color_id": 1,
  "buyer_address": "0x1234...",
  "tx_hash": "0xabc123...",
  "price_wei": "1000000000000000"
}
```

**响应**:
```json
{
  "success": true,
  "color_id": 1,
  "owner_address": "0x1234...",
  "tx_hash": "0xabc123..."
}
```

**作用**:
- 更新数据库中颜色的所有者
- 记录交易哈希
- 记录购买价格

---

## 🖼️ 2. 画布购买

### 前端调用合约

**合约方法**: `buyCanvas(uint256 canvasId)`

**合约地址**: `CANVAS_CONTRACT_ADDRESS`

**调用流程**:

```javascript
// 1. 连接钱包
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. 创建合约实例
const canvasContract = new ethers.Contract(
  CANVAS_CONTRACT_ADDRESS,
  canvasAbi,
  signer
);

// 3. 获取画布价格
const canvasPrice = await canvasContract.canvasPrice();

// 4. 调用合约购买
const tx = await canvasContract.buyCanvas(canvasId, {
  value: canvasPrice  // 支付ETH
});

// 5. 等待交易确认
const receipt = await tx.wait();
```

**合约参数**:
- `canvasId`: 画布ID (uint256)
- `value`: 支付金额 (wei)

**合约返回**:
- 交易哈希
- 用户获得画布NFT
- 合约更新 `totalRaised`

---

### 后端记录接口

**接口**: `POST /api/canvas/purchase`

**调用时机**: 合约交易确认后

**请求参数**:
```json
{
  "canvas_id": "123456789",
  "buyer_address": "0x1234...",
  "tx_hash": "0xabc123...",
  "amount_wei": "1800000000000000"
}
```

**响应**:
```json
{
  "success": true,
  "canvas_id": "123456789",
  "total_raised_wei": "180000000000000000",
  "tx_hash": "0xabc123..."
}
```

**作用**:
- 累加画布的 `total_raised_wei`
- 记录购买交易（可选）

---

## 💰 3. 收益提取

### 前端调用合约

**合约方法**: `claimRevenue(uint256 canvasId)`

**合约地址**: `REVENUE_CONTRACT_ADDRESS`

**调用流程**:

```javascript
// 1. 连接钱包
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const userAddress = await signer.getAddress();

// 2. 创建合约实例
const revenueContract = new ethers.Contract(
  REVENUE_CONTRACT_ADDRESS,
  revenueAbi,
  signer
);

// 3. 查询可领取金额（可选）
const claimableAmount = await revenueContract.getClaimableAmount(
  canvasId, 
  userAddress
);

// 4. 调用合约提取收益
const tx = await revenueContract.claimRevenue(canvasId);

// 5. 等待交易确认
const receipt = await tx.wait();
// ETH会自动发送到用户钱包
```

**合约参数**:
- `canvasId`: 画布ID (uint256)

**合约返回**:
- 交易哈希
- ETH发送到用户钱包
- 合约更新 `claimableAmount[canvasId][user] = 0`

---

### 后端记录接口

**接口**: `POST /api/revenue/recordClaim`

**调用时机**: 合约交易确认后

**请求参数**:
```json
{
  "contributor": "0x1234...",
  "canvas_id": "123456789",
  "tx_hash": "0xabc123..."
}
```

**响应**:
```json
{
  "success": true,
  "canvas_id": "123456789",
  "contributor": "0x1234...",
  "reward_wei": "32400000000000000",
  "tx_hash": "0xabc123..."
}
```

**作用**:
- 更新数据库 `revenue_shares` 表
- 设置 `claimed = 1`
- 记录 `claimed_tx`

---

## 🔄 4. 完整业务流程

### 用户购买颜色流程

```
1. 前端: 用户点击购买按钮
   ↓
2. 前端: 调用合约 buyColor(colorId, {value: price})
   ↓
3. 用户: 在钱包中确认交易
   ↓
4. 区块链: 交易确认，用户获得NFT
   ↓
5. 前端: 调用后端 POST /api/colors/recordPurchase
   ↓
6. 后端: 更新数据库记录
   ↓
7. 前端: 显示购买成功，刷新UI
```

---

### 用户购买画布流程

```
1. 前端: 用户点击购买画布
   ↓
2. 前端: 调用合约 buyCanvas(canvasId, {value: price})
   ↓
3. 用户: 在钱包中确认交易
   ↓
4. 区块链: 交易确认，用户获得NFT，合约记录收入
   ↓
5. 前端: 调用后端 POST /api/canvas/purchase
   ↓
6. 后端: 更新数据库 total_raised_wei
   ↓
7. 前端: 显示购买成功
```

---

### 用户提取收益流程

```
1. 前端: 查询用户可领取收益
   ↓
2. 前端: 显示可领取金额
   ↓
3. 前端: 用户点击提取按钮
   ↓
4. 前端: 调用合约 claimRevenue(canvasId)
   ↓
5. 用户: 在钱包中确认交易
   ↓
6. 区块链: 交易确认，ETH发送到用户钱包
   ↓
7. 前端: 调用后端 POST /api/revenue/recordClaim
   ↓
8. 后端: 更新数据库 claimed = 1
   ↓
9. 前端: 显示提取成功，刷新余额
```

---

## 📊 5. 合约查询方法（只读）

以下方法不需要发送交易，可以直接查询：

### 颜色合约查询

```javascript
// 获取颜色价格
const price = await colorsContract.colorPrice();

// 获取颜色所有者
const owner = await colorsContract.ownerOf(colorId);

// 获取用户拥有的颜色数量
const balance = await colorsContract.balanceOf(userAddress);
```

---

### 画布合约查询

```javascript
// 获取画布价格
const price = await canvasContract.canvasPrice();

// 获取画布信息
const canvas = await canvasContract.getCanvas(canvasId);
// 返回: {canvasId, dayTimestamp, metadataURI, creator, totalRaised, finalized}

// 获取用户拥有的画布NFT数量
const balance = await canvasContract.balanceOf(userAddress, canvasId);
```

---

### 收益合约查询

```javascript
// 获取用户在某个画布的可领取金额
const claimable = await revenueContract.getClaimableAmount(canvasId, userAddress);

// 获取用户在多个画布的总可领取金额
const total = await revenueContract.getTotalClaimableAmount(
  [canvasId1, canvasId2, canvasId3],
  userAddress
);

// 获取画布收益状态
const status = await revenueContract.getCanvasRevenueStatus(canvasId);
// 返回: {totalRevenue, distributed, contributorsCount}

// 检查收益是否已分配
const distributed = await revenueContract.revenueDistributed(canvasId);
```

---

### 贡献合约查询

```javascript
// 获取用户在某个画布的贡献
const contribution = await contributionsContract.getContribution(canvasId, userAddress);

// 获取画布的总贡献
const total = await contributionsContract.getTotalContribution(canvasId);

// 获取画布的所有贡献者详情
const details = await contributionsContract.getCanvasContributionDetails(canvasId);
// 返回: {contributors[], amounts[], totalContributions}
```

---

## 🛠️ 6. 错误处理

### 常见错误代码

```javascript
try {
  const tx = await contract.someFunction();
  await tx.wait();
} catch (error) {
  // 用户拒绝交易
  if (error.code === 'ACTION_REJECTED') {
    console.log('User rejected transaction');
  }
  
  // 余额不足
  if (error.code === 'INSUFFICIENT_FUNDS') {
    console.log('Insufficient funds');
  }
  
  // 合约执行失败
  if (error.message.includes('execution reverted')) {
    console.log('Contract execution failed:', error.reason);
  }
  
  // Gas估算失败
  if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
    console.log('Transaction will likely fail');
  }
}
```

---

### 合约错误信息

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Color not found` | 颜色ID不存在 | 检查颜色ID |
| `Color already owned` | 颜色已被购买 | 选择其他颜色 |
| `Canvas does not exist` | 画布不存在 | 检查画布ID |
| `Canvas already finalized` | 画布已结算 | 无法再购买 |
| `No revenue to claim` | 没有可领取收益 | 等待结算或已领取 |
| `Revenue not distributed yet` | 收益未分配 | 等待管理员结算 |
| `Incorrect payment amount` | 支付金额错误 | 检查价格 |

---

## 🔐 7. 安全注意事项

### 前端验证

```javascript
// 1. 验证网络
const network = await provider.getNetwork();
if (network.chainId !== EXPECTED_CHAIN_ID) {
  throw new Error('Wrong network');
}

// 2. 验证余额
const balance = await provider.getBalance(userAddress);
if (balance < price) {
  throw new Error('Insufficient balance');
}

// 3. 验证合约状态
const isFinalized = await canvasContract.canvases(canvasId).finalized;
if (isFinalized) {
  throw new Error('Canvas already finalized');
}
```

---

### 交易确认

```javascript
// 等待多个区块确认（更安全）
const receipt = await tx.wait(3); // 等待3个区块确认

// 检查交易状态
if (receipt.status === 0) {
  throw new Error('Transaction failed');
}
```

---

### Gas优化

```javascript
// 估算Gas
const gasEstimate = await contract.estimateGas.buyColor(colorId, {
  value: price
});

// 设置Gas限制（增加20%缓冲）
const tx = await contract.buyColor(colorId, {
  value: price,
  gasLimit: gasEstimate * 120n / 100n
});
```

---

## 📝 8. 接口对照表

| 功能 | 合约方法 | 合约地址 | 后端记录接口 | 是否需要付款 |
|------|---------|---------|-------------|------------|
| 购买颜色 | `buyColor(colorId)` | COLORS_CONTRACT | `POST /api/colors/recordPurchase` | ✅ 是 |
| 购买画布 | `buyCanvas(canvasId)` | CANVAS_CONTRACT | `POST /api/canvas/purchase` | ✅ 是 |
| 提取收益 | `claimRevenue(canvasId)` | REVENUE_CONTRACT | `POST /api/revenue/recordClaim` | ❌ 否（收款）|
| 查询颜色价格 | `colorPrice()` | COLORS_CONTRACT | - | ❌ 否 |
| 查询画布价格 | `canvasPrice()` | CANVAS_CONTRACT | - | ❌ 否 |
| 查询可领取金额 | `getClaimableAmount(canvasId, user)` | REVENUE_CONTRACT | - | ❌ 否 |
| 查询画布信息 | `getCanvas(canvasId)` | CANVAS_CONTRACT | `GET /api/canvas/id/:canvas_id` | ❌ 否 |
| 查询贡献 | `getContribution(canvasId, user)` | CONTRIBUTIONS_CONTRACT | `GET /api/contributions/:canvas_id` | ❌ 否 |

---

## 🎯 9. 快速参考

### 需要前端调用合约的操作（3个）

1. ✅ **购买颜色** - 用户付款购买
2. ✅ **购买画布** - 用户付款购买  
3. ✅ **提取收益** - 用户领取收益

### 管理员操作（后端调用）

1. 铸造画布NFT
2. 结算画布收益
3. 奖励颜色给用户
4. 批量上链贡献记录

### 纯数据库操作（后端）

1. 创建画布记录
2. 记录用户贡献
3. 查询各种数据
4. 停止画布销售

---

## 💡 10. 开发建议

1. **使用环境变量**：合约地址、链ID等配置使用环境变量
2. **错误提示友好**：给用户清晰的错误提示
3. **加载状态**：交易进行时显示加载动画
4. **交易追踪**：提供区块浏览器链接查看交易
5. **余额检查**：发送交易前检查用户余额
6. **网络检查**：确保用户在正确的网络
7. **事件监听**：监听合约事件实时更新UI
8. **缓存查询**：合理缓存合约查询结果
9. **批量查询**：使用 `multicall` 批量查询数据
10. **测试网测试**：先在测试网充分测试

---

这份文档提供了所有前端需要调用合约的接口详细信息，可以作为前端开发的参考手册！
