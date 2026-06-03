/**
 * 交易记录类型定义
 * MoneyTracker 核心数据模型
 */

/** 交易类型：收入 或 支出 */
export type TransactionType = 'income' | 'expense';

/** 支付方式 */
export type PaymentMethod = '微信' | '支付宝' | '现金' | '银行卡' | '其他';

/** 交易记录完整字段 */
export interface Transaction {
  /** 唯一编号（UUID v4） */
  id: string;
  /** 金额（始终为正数，通过 type 字段判断收支） */
  amount: number;
  /** 交易类型 */
  type: TransactionType;
  /** 分类名称 */
  category: string;
  /** 商家 / 交易对方 */
  merchant: string;
  /** 备注 */
  note: string;
  /** 支付方式 */
  payment_method: PaymentMethod;
  /** 交易时间（ISO 8601 格式） */
  transaction_date: string;
  /** 记录创建时间 */
  created_at: string;
  /** 记录最后更新时间 */
  updated_at: string;
}

/** 新建交易时需要的字段（不含自动生成的字段） */
export interface NewTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  merchant: string;
  note: string;
  payment_method: PaymentMethod;
  transaction_date: string;
}

/** 导入结果统计 */
export interface ImportResult {
  /** 成功导入的条数 */
  success: number;
  /** 因重复跳过的条数 */
  skipped: number;
  /** 解析失败的条数 */
  failed: number;
  /** 错误详情列表 */
  errors: string[];
}

/** 默认支出分类 */
export const DEFAULT_EXPENSE_CATEGORIES = [
  '餐饮',
  '交通',
  '购物',
  '娱乐',
  '住房',
  '通讯',
  '医疗',
  '教育',
  '生活',
  '其他',
];

/** 默认收入分类 */
export const DEFAULT_INCOME_CATEGORIES = [
  '工资',
  '兼职',
  '理财',
  '红包',
  '退款',
  '其他',
];

/** 支付方式列表 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  '微信',
  '支付宝',
  '现金',
  '银行卡',
  '其他',
];

/** 月度汇总数据 */
export interface MonthlySummary {
  /** 总收入 */
  totalIncome: number;
  /** 总支出 */
  totalExpense: number;
  /** 结余 */
  balance: number;
  /** 交易总笔数 */
  count: number;
}

/** 分类统计数据 */
export interface CategoryStat {
  /** 分类名称 */
  category: string;
  /** 该分类总金额 */
  amount: number;
  /** 占比百分比 */
  percentage: number;
  /** 交易笔数 */
  count: number;
  /** 颜色（用于图表） */
  color: string;
}

/** 月度趋势数据点 */
export interface MonthlyTrend {
  /** 月份标签，如 "2024-01" */
  month: string;
  /** 收入总额 */
  income: number;
  /** 支出总额 */
  expense: number;
}
