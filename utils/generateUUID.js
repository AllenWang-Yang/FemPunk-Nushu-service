const crypto = require("crypto");
const { keccak256, toHex } = require("viem");

/**
 * 生成安全的 16 位数字 UUID（不以0开头）
 * 并同时生成 keccak256 哈希（可用于链上）
 */
function generateUUID() {
  // 生成 8 字节（64 bit）随机值
  const buf = crypto.randomBytes(8);
  const hex = buf.toString("hex");
  const bigIntValue = BigInt("0x" + hex);

  // 转成 16 位十进制，避免 0 开头
  let uuid16 = (bigIntValue % (10n ** 16n)).toString();
  while (uuid16.length < 16) uuid16 = "0" + uuid16; // 补齐
  if (uuid16.startsWith("0")) {
    // 若首位为0，重新生成（避免 0 开头）
    return generateUUID();
  }

  // 生成链上哈希（比如可用于 tokenId）
  const uuidHash = keccak256(toHex(uuid16));

  // return {
  //   uuid16,
  //   uuidHash,
  // };
  return uuid16.toString();
}

module.exports = { generateUUID };
