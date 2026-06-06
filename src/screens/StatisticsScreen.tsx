/**
 * 统计页面
 *
 * 功能：
 * - 月度收支饼图（消费分类占比）
 * - 近 6 个月收支趋势柱状图
 * - 分类排行榜
 * - 月份切换
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PieChart, BarChart } from 'react-native-chart-kit';

import {
  CategoryStat,
  MonthlyTrend,
  MonthlySummary,
} from '../types';
import {
  initDatabase,
  getCategoryStats,
  getMonthlyTrends,
  getMonthlySummary,
  getAvailableMonths,
} from '../database/database';
import { getSemanticColors } from '../theme/designSystem';
import MonthPicker, { MonthOption } from '../components/MonthPicker';
import GlassView from '../components/GlassView';

const SCREEN_WIDTH = Dimensions.get('window').width;

/** 图表配色 */
const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD93D', '#6C5CE7', '#A8E6CF',
  '#FF8B94', '#74B9FF', '#FDA7DF', '#55E6C1', '#F9CA24',
  '#E056A0', '#6AB04C', '#F0932B', '#B53471', '#3B3B98',
];

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getSemanticColors(isDark);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 月份相关
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // 数据
  const [summary, setSummary] = useState<MonthlySummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    count: 0,
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);

  // ---- 初始化 ----
  useEffect(() => {
    initDatabase()
      .then(() => loadAllData())
      .catch((err) => console.error('数据库初始化失败:', err));
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);

      // 加载月份列表
      const availableMonths = await getAvailableMonths();
      const currentMonth = getCurrentMonth();
      if (!availableMonths.includes(currentMonth)) {
        availableMonths.unshift(currentMonth);
      }

      setMonths(
        availableMonths.map((m) => ({
          label: formatMonthLabel(m),
          value: m,
        }))
      );

      const targetMonth = availableMonths.includes(selectedMonth)
        ? selectedMonth
        : availableMonths[0] || currentMonth;

      setSelectedMonth(targetMonth);

      // 并行加载数据
      const [sum, cats, trendData] = await Promise.all([
        getMonthlySummary(targetMonth),
        getCategoryStats(targetMonth),
        getMonthlyTrends(6),
      ]);

      setSummary(sum);
      setCategoryStats(cats);
      setTrends(trendData);
    } catch (err: any) {
      console.error('数据加载失败:', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- 刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  }, [selectedMonth]);

  // ---- 月份切换 ----
  async function handleMonthSelect(month: string) {
    setSelectedMonth(month);
    const [sum, cats] = await Promise.all([
      getMonthlySummary(month),
      getCategoryStats(month),
    ]);
    setSummary(sum);
    setCategoryStats(cats);
  }

  // ---- 饼图数据 ----
  const pieData = categoryStats.map((cat, index) => ({
    name: cat.category,
    amount: cat.amount,
    color: cat.color || CHART_COLORS[index % CHART_COLORS.length],
    legendFontColor: isDark ? '#D1D1D6' : '#3C3C43',
    legendFontSize: 13,
  }));

  // ---- 柱状图数据 ----
  const barData = {
    labels: trends.map((t) => {
      const parts = t.month.split('-');
      return `${parseInt(parts[1])}月`;
    }),
    datasets: [
      {
        data: trends.map((t) => t.expense),
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      },
    ],
  };

  // ---- 空状态 ----
  if (!loading && categoryStats.length === 0 && summary.count === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.systemBackground }]}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={[styles.emptyTitle, { color: colors.secondaryLabel }]}>暂无统计数据</Text>
        <Text style={[styles.emptySubtitle, { color: colors.tertiaryLabel }]}>添加交易记录后即可看到统计图表</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.systemBackground }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* 标题 */}
      <Text style={[styles.pageTitle, { color: colors.label, paddingTop: insets.top + 8 }]}>统计</Text>

      {/* 月份选择器 */}
      <MonthPicker
        months={months}
        selectedMonth={selectedMonth}
        onSelect={handleMonthSelect}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <>
          {/* ---- 月度收支概览 ---- */}
          <GlassView intensity="md" radius="lg" style={styles.summaryCard}>
            <Text style={[styles.cardTitle, { color: colors.label }]}>月度概览</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryLabel }]}>收入</Text>
                <Text style={[styles.summaryValue, { color: colors.income }]}>
                  ¥{summary.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryLabel }]}>支出</Text>
                <Text style={[styles.summaryValue, { color: colors.expense }]}>
                  ¥{summary.totalExpense.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.secondaryLabel }]}>结余</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: summary.balance >= 0 ? colors.income : colors.expense },
                  ]}
                >
                  ¥{summary.balance.toFixed(2)}
                </Text>
              </View>
            </View>
          </GlassView>

          {/* ---- 消费分类饼图 ---- */}
          {pieData.length > 0 && (
            <GlassView intensity="md" radius="lg" style={styles.chartCard}>
              <Text style={[styles.cardTitle, { color: colors.label }]}>支出分类占比</Text>
              <PieChart
                data={pieData}
                width={SCREEN_WIDTH - 64}
                height={220}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute={false}
              />
            </GlassView>
          )}

          {/* ---- 近 6 个月趋势 ---- */}
          {trends.length > 0 && trends.some((t) => t.expense > 0 || t.income > 0) && (
            <GlassView intensity="md" radius="lg" style={styles.chartCard}>
              <Text style={[styles.cardTitle, { color: colors.label }]}>近 6 个月趋势</Text>
              <BarChart
                data={barData}
                width={SCREEN_WIDTH - 64}
                height={220}
                yAxisLabel="¥"
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: colors.secondarySystemBackground,
                  backgroundGradientFrom: colors.secondarySystemBackground,
                  backgroundGradientTo: colors.secondarySystemBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                  labelColor: (opacity = 1) => isDark
                    ? `rgba(152, 152, 157, ${opacity})`
                    : `rgba(60, 60, 67, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '4 4',
                    stroke: colors.separator,
                  },
                  barPercentage: 0.6,
                }}
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                fromZero
                showBarTops={false}
              />
            </GlassView>
          )}

          {/* ---- 分类排行榜 ---- */}
          {categoryStats.length > 0 && (
            <GlassView intensity="md" radius="lg" style={styles.rankCard}>
              <Text style={[styles.cardTitle, { color: colors.label }]}>支出排行榜</Text>
              {categoryStats.slice(0, 10).map((cat, index) => (
                <View key={cat.category} style={[styles.rankItem, { borderBottomColor: colors.separator }]}>
                  <View style={styles.rankLeft}>
                    <Text style={[styles.rankNumber, { color: colors.tertiaryLabel }]}>{index + 1}</Text>
                    <View
                      style={[
                        styles.rankDot,
                        {
                          backgroundColor:
                            cat.color || CHART_COLORS[index % CHART_COLORS.length],
                        },
                      ]}
                    />
                    <Text style={[styles.rankCategory, { color: colors.label }]}>{cat.category}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={[styles.rankAmount, { color: colors.label }]}>
                      ¥{cat.amount.toFixed(2)}
                    </Text>
                    <Text style={[styles.rankPercent, { color: colors.tertiaryLabel }]}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                    {/* 进度条 */}
                    <View style={[styles.progressBar, { backgroundColor: colors.progressBackground }]}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor:
                              cat.color || CHART_COLORS[index % CHART_COLORS.length],
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </GlassView>
          )}

          {/* ---- 月度趋势详情表格 ---- */}
          {trends.length > 0 && (
            <GlassView intensity="md" radius="lg" style={styles.rankCard}>
              <Text style={[styles.cardTitle, { color: colors.label }]}>月度收支明细</Text>
              {trends.slice().reverse().map((t) => (
                <View key={t.month} style={[styles.trendItem, { borderBottomColor: colors.separator }]}>
                  <Text style={[styles.trendMonth, { color: colors.label }]}>
                    {formatMonthLabel(t.month)}
                  </Text>
                  <View style={styles.trendAmounts}>
                    <Text style={[styles.trendAmount, { color: colors.income }]}>
                      收 ¥{t.income.toFixed(0)}
                    </Text>
                    <Text style={[styles.trendAmount, { color: colors.expense }]}>
                      支 ¥{t.expense.toFixed(0)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.trendNet,
                      {
                        color:
                          t.income - t.expense >= 0 ? colors.income : colors.expense,
                      },
                    ]}
                  >
                    ¥{(t.income - t.expense).toFixed(0)}
                  </Text>
                </View>
              ))}
            </GlassView>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${parseInt(y)}年${parseInt(m)}月`;
}

// ============================================================
// 样式
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // ---- 标题 ----
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },

  // ---- 加载 ----
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },

  // ---- 卡片通用 ----
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    alignItems: 'center',
  },
  rankCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 14,
  },

  // ---- 月度概览 ----
  summaryRow: {
    flexDirection: 'row',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // ---- 排行榜 ----
  rankItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    width: 24,
  },
  rankDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  rankCategory: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  rankRight: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  rankAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  rankPercent: {
    fontSize: 12,
    color: '#AEAEB2',
    marginTop: 2,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#F2F2F7',
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },

  // ---- 趋势表格 ----
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F2F2F7',
  },
  trendMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    width: 80,
  },
  trendAmounts: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  trendAmount: {
    fontSize: 14,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  trendNet: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    width: 70,
    textAlign: 'right',
  },

  // ---- 空状态 ----
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    backgroundColor: '#F2F2F7',
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
});
