/**
 * 唯一编号生成工具
 *
 * 使用 UUID v4 作为交易唯一编号
 * 每次调用生成一个全新的 UUID，简单可靠
 */

/** 生成 UUID v4 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 生成交易的唯一编号
 * 直接使用 UUID v4，简单可靠，碰撞概率极低
 */
export function generateTransactionId(): string {
  return generateUUID();
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
