/**
 * CSV 解析工具
 *
 * 支持微信账单和支付宝账单两种 CSV 格式
 * - 自动识别 UTF-8 / GBK 编码（通过 expo-file-system 读取后处理）
 * - 容错跳过无效行
 * - 金额正负自动判断收支类型
 */

import Papa from 'papaparse';
import { TransactionType, PaymentMethod } from '../types';

/** 解析后的原始交易数据（不含唯一编号） */
export interface ParsedTransaction {
  /** 交易时间（ISO 格式） */
  transaction_date: string;
  /** 交易类型 */
  type: TransactionType;
  /** 交易对方 / 商家 */
  merchant: string;
  /** 商品描述 */
  product: string;
  /** 金额（正数） */
  amount: number;
  /** 支付方式 */
  payment_method: PaymentMethod;
  /** 备注 */
  note: string;
  /** 原始交易单号（用于辅助识别） */
  original_order_id: string;
}

/** CSV 解析结果 */
export interface CSVParsedResult {
  /** 数据来源类型 */
  source: 'wechat' | 'alipay' | 'unknown';
  /** 成功解析的交易 */
  transactions: ParsedTransaction[];
  /** 跳过的无效行 */
  errors: string[];
}

/**
 * 检测 CSV 来源类型（微信 or 支付宝）
 * 通过表头特征判断
 */
function detectSource(headers: string[]): 'wechat' | 'alipay' | 'unknown' {
  const headerStr = headers.join(',');
  if (headerStr.includes('交易对方') && headerStr.includes('收/支') && headerStr.includes('金额(元)')) {
    return 'wechat';
  }
  if (headerStr.includes('交易对方') && headerStr.includes('收/支') && !headerStr.includes('金额(元)')) {
    return 'alipay';
  }
  return 'unknown';
}

/**
 * 标准化日期格式为 ISO 8601
 */
function normalizeDate(dateStr: string): string {
  // 移除多余空格
  const cleaned = dateStr.trim();
  // 尝试解析常见格式
  const date = new Date(cleaned);
  if (isNaN(date.getTime())) {
    throw new Error(`无法解析日期: ${cleaned}`);
  }
  return date.toISOString();
}

/**
 * 从 "收/支" 字段和金额正负判断交易类型
 */
function determineType(
  shouzhi: string,
  amount: number
): TransactionType {
  const trimmed = shouzhi.trim();
  if (trimmed === '收入' || trimmed === '收') return 'income';
  if (trimmed === '支出' || trimmed === '支') return 'expense';
  // 兜底：通过金额正负判断
  return amount >= 0 ? 'income' : 'expense';
}

/**
 * 解析金额，处理正负号和千分位
 */
function parseAmount(amountStr: string): number {
  // 移除千分位逗号、空格、¥ 符号
  let cleaned = amountStr.trim()
    .replace(/,/g, '')
    .replace(/，/g, '')
    .replace(/¥/g, '')
    .replace(/￥/g, '')
    .replace(/\s/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) {
    throw new Error(`无法解析金额: ${amountStr}`);
  }
  return Math.abs(num);
}

/**
 * 将微信/支付宝支付方式映射到统一支付方式
 */
function normalizePaymentMethod(payment: string): PaymentMethod {
  const p = payment.trim();
  if (p.includes('微信') || p.includes('零钱')) return '微信';
  if (p.includes('支付宝') || p.includes('余额宝')) return '支付宝';
  if (p.includes('现金')) return '现金';
  if (p.includes('银行') || p.includes('借记卡') || p.includes('信用卡')) return '银行卡';
  return '其他';
}

/**
 * 解析微信账单 CSV 行
 */
function parseWechatRow(row: Record<string, string>): ParsedTransaction {
  const date = normalizeDate(row['交易时间'] || '');
  const type = determineType(row['收/支'] || '', parseFloat(row['金额(元)'] || '0'));
  const amount = parseAmount(row['金额(元)'] || '0');
  const merchant = (row['交易对方'] || '未知商家').trim();
  const product = (row['商品'] || '').trim();
  const payment = normalizePaymentMethod(row['支付方式'] || '其他');
  const note = (row['备注'] || '').trim();

  // 微信格式：商品字段可为空，用备注补充
  const combinedNote = [product, note].filter(Boolean).join(' | ');

  return {
    transaction_date: date,
    type,
    merchant,
    product,
    amount: Math.abs(amount),
    payment_method: payment,
    note: combinedNote,
    original_order_id: (row['交易单号'] || row['商户单号'] || '').trim(),
  };
}

/**
 * 解析支付宝账单 CSV 行
 */
function parseAlipayRow(row: Record<string, string>): ParsedTransaction {
  const date = normalizeDate(row['交易时间'] || '');
  const type = determineType(row['收/支'] || '', parseFloat(row['金额'] || '0'));
  const amount = parseAmount(row['金额'] || '0');
  const merchant = (row['交易对方'] || '未知商家').trim();
  const product = (row['商品'] || '').trim();
  const payment = '支付宝'; // 支付宝账单通常不标明子支付方式
  const note = (row['备注'] || '').trim();

  const combinedNote = [product, note].filter(Boolean).join(' | ');

  return {
    transaction_date: date,
    type,
    merchant,
    product,
    amount: Math.abs(amount),
    payment_method: payment,
    note: combinedNote,
    original_order_id: (row['交易订单号'] || row['商家订单号'] || '').trim(),
  };
}

/**
 * 解析 CSV 文本内容
 * @param csvText  CSV 文件的文本内容
 * @returns 解析结果
 */
export function parseCSV(csvText: string): CSVParsedResult {
  // 去除 BOM 头
  const cleanText = csvText.replace(/^﻿/, '');

  const result = Papa.parse(cleanText, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return {
      source: 'unknown',
      transactions: [],
      errors: result.errors.map((e) => `CSV 解析错误: ${e.message}`),
    };
  }

  const headers = result.meta.fields || [];
  const source = detectSource(headers);

  if (source === 'unknown') {
    return {
      source: 'unknown',
      transactions: [],
      errors: [
        `无法识别的 CSV 格式。表头: ${headers.join(', ')}。支持微信和支付宝账单格式。`,
      ],
    };
  }

  const transactions: ParsedTransaction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < result.data.length; i++) {
    try {
      const row = result.data[i] as Record<string, string>;
      // 跳过空行或无效行
      if (!row['交易时间'] && !row['交易对方']) continue;

      const parsed =
        source === 'wechat' ? parseWechatRow(row) : parseAlipayRow(row);
      transactions.push(parsed);
    } catch (err: any) {
      errors.push(`第 ${i + 2} 行解析失败: ${err.message}`);
    }
  }

  return { source, transactions, errors };
}
