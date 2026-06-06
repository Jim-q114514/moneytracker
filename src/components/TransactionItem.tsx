/**
 * 交易列表项组件
 *
 * 展示单条交易的概要信息：
 * - 分类表情图标
 * - 商家名称
 * - 金额（收入绿色、支出红色）
 * - 交易时间
 * - 唯一编号后四位
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Transaction } from '../types';
import { getShortId } from '../utils/hash';
import { getSemanticColors } from '../theme/designSystem';
import GlassView from './GlassView';

/** 分类对应的表情图标 */
const CATEGORY_ICONS: Record<string, string> = {
  餐饮: '🍽️',
  交通: '🚗',
  购物: '🛍️',
  娱乐: '🎮',
  住房: '🏠',
  通讯: '📱',
  医疗: '💊',
  教育: '📚',
  生活: '🛒',
  工资: '💼',
  兼职: '💻',
  理财: '📈',
  红包: '🧧',
  退款: '💰',
  其他: '📌',
};

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || '📌';
}

interface Props {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  onLongPress?: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, onPress, onLongPress }: Props) {
  const isIncome = transaction.type === 'income';
  const amountPrefix = isIncome ? '+' : '-';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getSemanticColors(isDark);
  const amountColor = isIncome ? colors.income : colors.expense;

  // 格式化日期为可读格式
  const date = new Date(transaction.transaction_date);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
  const timeStr = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  return (
    <GlassView
      intensity="sm"
      radius="md"
      interactive
      onPress={() => onPress(transaction)}
      onLongPress={() => onLongPress?.(transaction)}
      style={styles.containerExtra}
    >
      {/* 分类图标 */}
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
        <Text style={styles.icon}>{getCategoryIcon(transaction.category)}</Text>
      </View>

      {/* 中间信息 */}
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.merchant, { color: colors.label }]} numberOfLines={1}>
            {transaction.merchant || '手动记账'}
          </Text>
          <Text style={[styles.amount, { color: amountColor }]}>
            {amountPrefix}¥{transaction.amount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.metaGroup}>
            <Text style={[styles.category, { color: colors.secondaryLabel }]}>{transaction.category}</Text>
            <Text style={[styles.dot, { color: colors.quaternaryLabel }]}>·</Text>
            <Text style={[styles.payment, { color: colors.secondaryLabel }]}>{transaction.payment_method}</Text>
          </View>
          <View style={styles.metaGroup}>
            <Text style={[styles.dateTime, { color: colors.tertiaryLabel }]}>{dateStr} {timeStr}</Text>
            <Text style={[styles.shortId, { color: colors.quaternaryLabel }]}>#{getShortId(transaction.id)}</Text>
          </View>
        </View>
        {transaction.note ? (
          <Text style={[styles.note, { color: colors.secondaryLabel }]} numberOfLines={1}>
            {transaction.note}
          </Text>
        ) : null}
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  containerExtra: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 12,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dot: {
    fontSize: 12,
    color: '#C7C7CC',
    marginHorizontal: 4,
  },
  payment: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dateTime: {
    fontSize: 12,
    color: '#AEAEB2',
  },
  shortId: {
    fontSize: 11,
    color: '#C7C7CC',
    marginLeft: 6,
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
});
