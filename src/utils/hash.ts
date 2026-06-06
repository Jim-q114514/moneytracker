/**
 * 唯一编号生成工具
 *
 * 两种 ID 生成策略：
 * 1. generateTransactionId() — 随机 UUID v4，用于手动添加的交易（无去重需求）
 * 2. generateDeterministicId() — 确定性哈希 ID，用于 CSV 导入（相同交易永远生成相同 ID，实现真正去重）
 */

/** 生成随机 UUID v4（用于手动添加的交易） */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成交易的唯一编号（随机）
 * 用于手动添加的交易，每次生成不同 ID
 */
export function generateTransactionId(): string {
  return generateUUID();
}

/**
 * 确定性哈希函数（FNV-1a 变体）
 * 输入相同始终输出相同，用于去重
 */
function hashString(str: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash = hash >>> 0; // 转为无符号 32 位
  }
  return hash;
}

/**
 * 从交易关键字段生成确定性 ID
 *
 * 使用场景：CSV/账单导入时，同一笔交易多次导入生成相同 ID，
 * 配合 INSERT OR IGNORE 实现真正的去重。
 *
 * 去重依据：交易单号（最可靠）+ 交易时间 + 金额 + 交易对方 + 收/支
 *
 * @returns 格式为 UUID v4 风格的确定性编号
 */
export function generateDeterministicId(fields: {
  transaction_date: string;
  amount: number;
  type: string;
  merchant: string;
  original_order_id?: string;
}): string {
  // 拼接关键字段，用 | 分隔
  const seed = [
    fields.original_order_id || '',
    fields.transaction_date,
    fields.amount.toFixed(2),
    fields.type,
    fields.merchant,
  ].join('|');

  // 对种子字符串做两次哈希，降低碰撞概率
  const hash1 = hashString(seed);
  const hash2 = hashString(seed + 'salt');

  // 将两个 32 位哈希拼接成 128 位，格式化为 UUID
  const hex1 = hash1.toString(16).padStart(8, '0');
  const hex2 = (hash1 >>> 16).toString(16).padStart(4, '0');
  const hex3 = ((hash1 & 0xffff) | 0x4000).toString(16).padStart(4, '0'); // UUID v4 标志
  const hex4 = ((hash2 & 0x3fff) | 0x8000).toString(16).padStart(4, '0'); // UUID 变体标志
  const hex5 = hash2.toString(16).padStart(8, '0');
  const hex6 = (hash2 >>> 16).toString(16).padStart(4, '0');

  return `${hex1}-${hex2}-${hex3}-${hex4}-${hex5}${hex6}`;
}

/**
 * 获取唯一编号的后四位（用于界面展示辨识）
 */
export function getShortId(fullId: string): string {
  // UUID 格式如 xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // 取最后一段的前 4 个字符用于显示
  const lastSegment = fullId.split('-').pop() || fullId;
  return lastSegment.slice(0, 4).toUpperCase();
}
