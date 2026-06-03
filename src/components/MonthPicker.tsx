/**
 * 月份选择器组件
 *
 * 液态玻璃 Chip 风格
 * - 未选中：半透明玻璃态
 * - 选中：蓝色高亮（支持深色模式）
 * - 水平滚动，带按下缩放反馈
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { createGlassStyles } from '../theme/glassStyles';
import { getSemanticColors } from '../theme/designSystem';

export interface MonthOption {
  label: string;
  value: string;
}

interface Props {
  months: MonthOption[];
  selectedMonth: string;
  onSelect: (month: string) => void;
}

export default function MonthPicker({ months, selectedMonth, onSelect }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glass = createGlassStyles(isDark);
  const colors = getSemanticColors(isDark);

  if (months.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.secondaryLabel }]}>暂无交易记录</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {months.map((month) => {
          const isSelected = month.value === selectedMonth;
          return (
            <TouchableOpacity
              key={month.value}
              style={[
                glass.liquidGlassChip,
                styles.chip,
                isSelected && glass.liquidGlassChipSelected,
                isSelected && styles.chipSelectedShadow,
              ]}
              onPress={() => onSelect(month.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isDark ? '#D1D1D6' : '#515154' },
                  isSelected && styles.chipTextSelected,
                ]}
              >
                {month.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipSelectedShadow: {
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
