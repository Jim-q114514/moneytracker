/**
 * SQLite 数据库操作层
 *
 * 使用 expo-sqlite（SDK 54 新版异步 API）本地存储所有交易数据
 * 100% 本地，无需服务器
 */

import * as SQLite from 'expo-sqlite';
import {
  Transaction,
  NewTransaction,
  MonthlySummary,
  CategoryStat,
  MonthlyTrend,
} from '../types';
import { generateTransactionId } from '../utils/hash';

// ============================================================
// 数据库初始化
// ============================================================

const DB_NAME = 'moneytracker.db';
let db: SQLite.SQLiteDatabase | null = null;

/** 获取数据库实例（必须先调用 initDatabase） */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('数据库未初始化，请先调用 initDatabase()');
  }
  return db;
}

/** 初始化数据库表结构和索引 */
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);

  // 启用 WAL 模式提升性能
  await db.execAsync('PRAGMA journal_mode = WAL;');

  // 创建交易表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL DEFAULT '其他',
      merchant TEXT NOT NULL DEFAULT '手动',
      note TEXT DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT '其他',
      transaction_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 创建索引加速查询
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_transaction_date ON transactions(transaction_date DESC);
    CREATE INDEX IF NOT EXISTS idx_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_category ON transactions(category);
  `);
}

// ============================================================
// CRUD 操作
// ============================================================

/**
 * 添加一条交易记录
 * @param data 新交易数据（id 可选，不传则自动生成 UUID）
 * @returns 新创建的交易记录
 */
export async function addTransaction(
  data: NewTransaction & { id?: string }
): Promise<Transaction> {
  const database = getDatabase();
  const id = data.id || generateTransactionId();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT OR IGNORE INTO transactions
     (id, amount, type, category, merchant, note, payment_method, transaction_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      data.amount,
      data.type,
      data.category || '其他',
      data.merchant || '手动',
      data.note || '',
      data.payment_method || '其他',
      data.transaction_date,
      now,
      now,
    ]
  );

  return {
    id,
    ...data,
    category: data.category || '其他',
    merchant: data.merchant || '手动',
    note: data.note || '',
    payment_method: data.payment_method || '其他',
    created_at: now,
    updated_at: now,
  } as Transaction;
}

/**
 * 批量添加交易（用于 CSV/JSON 导入）
 * @returns 成功数量和跳过数量
 */
export async function addTransactionsBatch(
  transactions: (NewTransaction & { id: string })[]
): Promise<{ success: number; skipped: number }> {
  const database = getDatabase();
  const now = new Date().toISOString();
  let success = 0;
  let skipped = 0;

  for (const data of transactions) {
    try {
      const result = await database.runAsync(
        `INSERT OR IGNORE INTO transactions
         (id, amount, type, category, merchant, note, payment_method, transaction_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          data.id,
          data.amount,
          data.type,
          data.category || '其他',
          data.merchant || '手动',
          data.note || '',
          data.payment_method || '其他',
          data.transaction_date,
          now,
          now,
        ]
      );
      if (result.changes > 0) {
        success++;
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  return { success, skipped };
}

/**
 * 更新一条交易记录
 */
export async function updateTransaction(transaction: Transaction): Promise<void> {
  const database = getDatabase();
  const now = new Date().toISOString();

  const result = await database.runAsync(
    `UPDATE transactions SET
      amount = ?, type = ?, category = ?, merchant = ?, note = ?,
      payment_method = ?, transaction_date = ?, updated_at = ?
     WHERE id = ?;`,
    [
      transaction.amount,
      transaction.type,
      transaction.category,
      transaction.merchant,
      transaction.note,
      transaction.payment_method,
      transaction.transaction_date,
      now,
      transaction.id,
    ]
  );

  if (result.changes === 0) {
    throw new Error('未找到要更新的交易记录');
  }
}

/**
 * 删除一条交易记录
 */
export async function deleteTransaction(id: string): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
}

// ============================================================
// 查询操作
// ============================================================

/**
 * 获取交易列表（支持按月筛选）
 * @param yearMonth 可选，格式 "YYYY-MM"
 */
export async function getTransactions(yearMonth?: string): Promise<Transaction[]> {
  const database = getDatabase();

  if (yearMonth) {
    return (await database.getAllAsync(
      "SELECT * FROM transactions WHERE strftime('%Y-%m', transaction_date) = ? ORDER BY transaction_date DESC, created_at DESC;",
      [yearMonth]
    )) as Transaction[];
  }

  return (await database.getAllAsync(
    'SELECT * FROM transactions ORDER BY transaction_date DESC, created_at DESC;'
  )) as Transaction[];
}

/**
 * 根据 ID 获取单条交易
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  const database = getDatabase();
  const row = await database.getFirstAsync(
    'SELECT * FROM transactions WHERE id = ?;',
    [id]
  );
  return (row as Transaction) || null;
}

/**
 * 检查交易是否已存在（按唯一编号）
 */
export async function transactionExists(id: string): Promise<boolean> {
  const database = getDatabase();
  const row = await database.getFirstAsync(
    'SELECT COUNT(*) as count FROM transactions WHERE id = ?;',
    [id]
  );
  return (row as any)?.count > 0;
}

/**
 * 获取所有交易记录（用于导出）
 */
export function getAllTransactions(): Promise<Transaction[]> {
  return getTransactions();
}

// ============================================================
// 统计查询
// ============================================================

/**
 * 获取指定月份的收支汇总
 */
export async function getMonthlySummary(yearMonth: string): Promise<MonthlySummary> {
  const database = getDatabase();
  const row = (await database.getFirstAsync(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
      COUNT(*) as count
     FROM transactions
     WHERE strftime('%Y-%m', transaction_date) = ?;`,
    [yearMonth]
  )) as any;

  return {
    totalIncome: row?.totalIncome || 0,
    totalExpense: row?.totalExpense || 0,
    balance: (row?.totalIncome || 0) - (row?.totalExpense || 0),
    count: row?.count || 0,
  };
}

/**
 * 获取指定月份各分类的支出统计（用于饼图）
 */
export async function getCategoryStats(yearMonth: string): Promise<CategoryStat[]> {
  const database = getDatabase();
  const data = (await database.getAllAsync(
    `SELECT
      category,
      SUM(amount) as amount,
      COUNT(*) as count
     FROM transactions
     WHERE type = 'expense' AND strftime('%Y-%m', transaction_date) = ?
     GROUP BY category
     ORDER BY amount DESC;`,
    [yearMonth]
  )) as { category: string; amount: number; count: number }[];

  const totalExpense = data.reduce((sum, item) => sum + item.amount, 0);

  const categoryColors: Record<string, string> = {
    餐饮: '#FF6B6B', 交通: '#4ECDC4', 购物: '#FFD93D',
    娱乐: '#6C5CE7', 住房: '#A8E6CF', 通讯: '#FF8B94',
    医疗: '#74B9FF', 教育: '#FDA7DF', 生活: '#55E6C1',
    其他: '#B2BEC3',
  };

  return data.map((item) => ({
    category: item.category,
    amount: item.amount,
    count: item.count,
    percentage: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
    color: categoryColors[item.category] || getRandomColor(item.category),
  }));
}

/**
 * 获取最近 N 个月的收支趋势
 */
export async function getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
  const database = getDatabase();

  // 生成月份范围
  const now = new Date();
  const results: MonthlyTrend[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const row = (await database.getFirstAsync(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE strftime('%Y-%m', transaction_date) = ?;`,
      [ym]
    )) as any;

    results.push({
      month: ym,
      income: row?.income || 0,
      expense: row?.expense || 0,
    });
  }

  return results;
}

/**
 * 获取所有有交易记录的月份列表
 */
export async function getAvailableMonths(): Promise<string[]> {
  const database = getDatabase();
  const rows = (await database.getAllAsync(
    `SELECT DISTINCT strftime('%Y-%m', transaction_date) as month
     FROM transactions
     ORDER BY month DESC;`
  )) as { month: string }[];

  return rows.map((r) => r.month);
}

// ============================================================
// 数据管理
// ============================================================

/**
 * 删除所有交易数据
 */
export async function deleteAllTransactions(): Promise<void> {
  const database = getDatabase();
  await database.runAsync('DELETE FROM transactions;');
}

/**
 * 将 WAL 日志写回主数据库文件，便于导出 .db 备份
 */
export async function checkpointDatabase(): Promise<void> {
  const database = getDatabase();
  await database.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
}

/**
 * 获取数据库文件路径（用于导出）
 */
export function getDatabasePath(): string {
  const database = getDatabase();
  // expo-sqlite SDK 54 提供 databasePath 属性
  return (database as any).databasePath || '';
}

// ============================================================
// 辅助工具
// ============================================================

function getRandomColor(categoryName: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF',
    '#FF8B94', '#74B9FF', '#FDA7DF', '#55E6C1', '#F9CA24',
    '#E056A0', '#6AB04C', '#F0932B', '#B53471', '#3B3B98',
  ];
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
