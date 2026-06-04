/**
 * 导出导入工具
 *
 * 导出：将交易记录导出为 JSON 文件（用于跨设备同步）
 * 导入：解析 JSON 文件，基于唯一编号去重后写入数据库
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction, ImportResult } from '../types';
import { getAllTransactions, addTransaction, transactionExists } from '../database/database';

/** 导出文件的 JSON 结构 */
interface ExportData {
  /** 应用名称标识 */
  app: 'MoneyTracker';
  /** 导出格式版本 */
  version: 1;
  /** 导出时间（ISO） */
  exportedAt: string;
  /** 交易记录数组 */
  transactions: ExportTransaction[];
}

/** 导出用的交易格式（与内部 Transaction 对齐，但只包含必要字段） */
interface ExportTransaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  merchant: string;
  note: string;
  payment_method: string;
  transaction_date: string;
}

/**
 * 将全部 / 筛选后的交易导出为 JSON 文件，并通过系统分享
 * @param transactions 要导出的交易列表
 * @returns 导出文件路径
 */
export async function exportToJSON(
  transactions: Transaction[]
): Promise<string> {
  const exportData: ExportData = {
    app: 'MoneyTracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      merchant: t.merchant,
      note: t.note,
      payment_method: t.payment_method,
      transaction_date: t.transaction_date,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const fileName = `MoneyTracker_导出_${formatDateForFile(new Date())}.json`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, jsonString, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  // 检查是否支持分享
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/json',
      dialogTitle: '导出 MoneyTracker 账单',
      UTI: 'public.json',
    });
  }

  return filePath;
}

/**
 * 从 JSON 文件导入交易
 * @param fileUri  JSON 文件 URI
 * @returns 导入结果统计
 */
export async function importFromJSON(fileUri: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // 读取文件内容
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const data: ExportData = JSON.parse(content);

    // 验证文件格式
    if (data.app !== 'MoneyTracker') {
      throw new Error('无效的 MoneyTracker 导出文件');
    }

    if (!Array.isArray(data.transactions)) {
      throw new Error('文件格式错误：缺少 transactions 数组');
    }

    // 逐条处理
    for (const t of data.transactions) {
      try {
        // 检查唯一编号是否已存在
        const exists = await transactionExists(t.id);
        if (exists) {
          result.skipped++;
          continue;
        }

        // 插入数据库
        await addTransaction({
          id: t.id,
          amount: t.amount,
          type: t.type,
          category: t.category || '其他',
          merchant: t.merchant || '手动',
          note: t.note || '',
          payment_method: (t.payment_method as any) || '其他',
          transaction_date: t.transaction_date,
        });

        result.success++;
      } catch (err: any) {
        result.failed++;
        result.errors.push(
          `交易 ${t.id?.slice(-4) || '未知'} 导入失败: ${err.message}`
        );
      }
    }
  } catch (err: any) {
    result.errors.push(`文件读取失败: ${err.message}`);
  }

  return result;
}

/**
 * 生成适合文件名的日期字符串
 */
function formatDateForFile(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}`;
}
