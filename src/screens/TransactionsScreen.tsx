/**
 * 账单页面（首页）
 *
 * 功能：
 * - 按月显示交易列表（时间倒序）
 * - 月份筛选器
 * - 收支汇总卡片
 * - 新增交易按钮
 * - CSV / JSON 导入
 * - 交易项点击编辑、长按删除
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { Transaction, ImportResult, NewTransaction, MonthlySummary } from '../types';
import {
  initDatabase,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getAvailableMonths,
  addTransactionsBatch,
} from '../database/database';
import { generateTransactionId } from '../utils/hash';
import { parseCSV, ParsedTransaction } from '../utils/csvParser';
import { importFromJSON } from '../utils/exportImport';
import { createGlassStyles } from '../theme/glassStyles';
import { getSemanticColors } from '../theme/designSystem';
import TransactionItem from '../components/TransactionItem';
import TransactionForm from '../components/TransactionForm';
import ImportResultModal from '../components/ImportResultModal';
import MonthPicker, { MonthOption } from '../components/MonthPicker';

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glass = createGlassStyles(isDark);
  const colors = getSemanticColors(isDark);
  // ---- 状态 ----
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    count: 0,
  });
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 表单弹窗
  const [formVisible, setFormVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // 导入弹窗
  const [importVisible, setImportVisible] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult>({
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  });

  // Toast 消息
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useState(new Animated.Value(0))[0];

  // ---- 初始化 ----
  useEffect(() => {
    initDatabase()
      .then(() => loadData())
      .catch((err) => {
        Alert.alert('数据库初始化失败', err.message);
        setLoading(false);
      });
  }, []);

  // ---- 加载数据 ----
  async function loadData() {
    try {
      setLoading(true);
      // 加载可用月份
      const availableMonths = await getAvailableMonths();
      const currentMonth = getCurrentMonth();

      // 如果当前月份没有记录，也加入列表
      if (!availableMonths.includes(currentMonth)) {
        availableMonths.unshift(currentMonth);
      }

      setMonths(
        availableMonths.map((m) => ({
          label: formatMonthLabel(m),
          value: m,
        }))
      );

      // 默认选中最新月份
      const targetMonth = availableMonths.includes(selectedMonth)
        ? selectedMonth
        : availableMonths[0] || currentMonth;
      setSelectedMonth(targetMonth);

      // 加载交易和汇总
      await loadTransactions(targetMonth);
    } catch (err: any) {
      Alert.alert('数据加载失败', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(month: string) {
    try {
      const [txns, sum] = await Promise.all([
        getTransactions(month),
        getMonthlySummary(month),
      ]);
      setTransactions(txns);
      setSummary(sum);
    } catch (err: any) {
      console.error('加载交易失败:', err.message);
    }
  }

  // ---- 刷新 ----
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTransactions(selectedMonth);
    // 同时刷新月份列表
    const availableMonths = await getAvailableMonths();
    setMonths(
      availableMonths.map((m) => ({
        label: formatMonthLabel(m),
        value: m,
      }))
    );
    setRefreshing(false);
  }, [selectedMonth]);

  // ---- 月份切换 ----
  async function handleMonthSelect(month: string) {
    setSelectedMonth(month);
    await loadTransactions(month);
  }

  // ---- 新增 / 编辑 ----
  function handleAddPress() {
    setEditingTransaction(null);
    setFormVisible(true);
  }

  function handleEditPress(transaction: Transaction) {
    setEditingTransaction(transaction);
    setFormVisible(true);
  }

  async function handleSave(data: NewTransaction, id?: string) {
    try {
      if (id) {
        // 编辑模式：更新现有记录
        await updateTransaction({ id, ...data } as Transaction);
        showToast('交易已更新');
      } else {
        // 新增模式
        const newId = generateTransactionId();
        await addTransaction({ id: newId, ...data });
        showToast('交易已添加');
      }
      setFormVisible(false);
      setEditingTransaction(null);
      await loadTransactions(selectedMonth);
    } catch (err: any) {
      Alert.alert('保存失败', err.message);
    }
  }

  function handleLongPress(transaction: Transaction) {
    Alert.alert('操作', '选择要执行的操作', [
      { text: '编辑', onPress: () => handleEditPress(transaction) },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => confirmDelete(transaction.id),
      },
      { text: '取消', style: 'cancel' },
    ]);
  }

  async function confirmDelete(id: string) {
    try {
      await deleteTransaction(id);
      showToast('交易已删除');
      await loadTransactions(selectedMonth);
    } catch (err: any) {
      Alert.alert('删除失败', err.message);
    }
  }

  // ---- CSV 导入 ----
  async function handleImportCSV() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];

      // 读取文件
      let content: string;
      try {
        content = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch {
        // UTF-8 失败，尝试 GBK（读取为 base64 后用其他方式处理）
        // expo-file-system 不直接支持 GBK，这里先提示用户
        Alert.alert(
          '编码问题',
          '文件可能不是 UTF-8 编码。请尝试将 CSV 文件另存为 UTF-8 编码后再导入。'
        );
        return;
      }

      // 解析 CSV
      const parsed = parseCSV(content);

      if (parsed.source === 'unknown') {
        Alert.alert('无法识别', parsed.errors[0] || '不支持的 CSV 格式');
        return;
      }

      // 为每笔交易生成唯一编号并批量插入
      const importResult: ImportResult = {
        success: 0,
        skipped: 0,
        failed: 0,
        errors: [...parsed.errors],
      };

      const batchData: (NewTransaction & { id: string })[] = [];

      for (const t of parsed.transactions) {
        try {
          const id = generateTransactionId();
          batchData.push({
            id,
            amount: t.amount,
            type: t.type,
            category: guessCategory(t.merchant, t.product, t.type),
            merchant: t.merchant,
            note: t.note,
            payment_method: t.payment_method,
            transaction_date: t.transaction_date,
          });
        } catch (err: any) {
          importResult.failed++;
          importResult.errors.push(`生成编号失败: ${err.message}`);
        }
      }

      // 批量插入
      const batchResult = await addTransactionsBatch(batchData);
      importResult.success = batchResult.success;
      importResult.skipped += batchResult.skipped;

      setImportResult(importResult);
      setImportVisible(true);

      // 刷新数据
      await loadTransactions(selectedMonth);
    } catch (err: any) {
      Alert.alert('导入失败', err.message);
    }
  }

  // ---- JSON 导入 ----
  async function handleImportJSON() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const importResult = await importFromJSON(file.uri);

      setImportResult(importResult);
      setImportVisible(true);

      // 刷新数据
      await loadTransactions(selectedMonth);
    } catch (err: any) {
      Alert.alert('导入失败', err.message);
    }
  }

  // ---- 导入菜单 ----
  function handleImportPress() {
    Alert.alert('导入账单', '选择导入格式', [
      { text: '微信/支付宝 CSV', onPress: handleImportCSV },
      { text: 'MoneyTracker JSON', onPress: handleImportJSON },
      { text: '取消', style: 'cancel' },
    ]);
  }

  // ---- Toast ----
  function showToast(message: string) {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }

  // ---- 空状态 ----
  function renderEmpty() {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📒</Text>
        <Text style={[styles.emptyTitle, { color: colors.secondaryLabel }]}>暂无交易记录</Text>
        <Text style={[styles.emptySubtitle, { color: colors.secondaryLabel }]}>
          点击右下角 + 按钮添加第一笔交易{'\n'}
          或导入微信/支付宝账单
        </Text>
      </View>
    );
  }

  // ---- 列表头部（汇总卡片） ----
  function renderHeader() {
    return (
      <View style={[glass.liquidGlass, styles.summaryCard]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.secondaryLabel }]}>支出</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense }]}>
              -¥{summary.totalExpense.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.separator }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, { color: colors.secondaryLabel }]}>收入</Text>
            <Text style={[styles.summaryAmount, { color: colors.income }]}>
              +¥{summary.totalIncome.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={[styles.balanceRow, { borderTopColor: colors.separator }]}>
          <Text style={[styles.balanceLabel, { color: colors.secondaryLabel }]}>
            {summary.balance >= 0 ? '本月结余' : '本月超支'}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: summary.balance >= 0 ? colors.income : colors.expense },
            ]}
          >
            {summary.balance >= 0 ? '+' : '-'}¥
            {Math.abs(summary.balance).toFixed(2)}
          </Text>
        </View>
        <Text style={[styles.transactionCount, { color: colors.tertiaryLabel }]}>
          共 {summary.count} 笔交易
        </Text>
      </View>
    );
  }

  // ---- 渲染 ----
  return (
    <View style={[styles.container, { backgroundColor: colors.systemBackground }]}>
      {/* 顶部标题 */}
      <View style={[glass.liquidGlassNav, styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Text style={[styles.navTitle, { color: colors.label }]}>账单</Text>
        <TouchableOpacity style={[glass.liquidGlassChip, styles.importButton]} onPress={handleImportPress}>
          <Text style={styles.importButtonText}>导入</Text>
        </TouchableOpacity>
      </View>

      {/* 月份选择器 */}
      <MonthPicker
        months={months}
        selectedMonth={selectedMonth}
        onSelect={handleMonthSelect}
      />

      {/* 加载指示器 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* 交易列表 */}
      {!loading && (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={handleEditPress}
              onLongPress={handleLongPress}
            />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 添加按钮（FAB — 液态玻璃风格） */}
      <TouchableOpacity style={[glass.liquidGlassPill, styles.fab]} onPress={handleAddPress} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* 交易表单弹窗 */}
      <TransactionForm
        visible={formVisible}
        editTransaction={editingTransaction}
        onSave={handleSave}
        onDelete={(id) => {
          setFormVisible(false);
          confirmDelete(id);
        }}
        onClose={() => {
          setFormVisible(false);
          setEditingTransaction(null);
        }}
      />

      {/* 导入结果弹窗 */}
      <ImportResultModal
        visible={importVisible}
        result={importResult}
        onClose={() => setImportVisible(false)}
      />

      {/* Toast 提示 */}
      {toastMessage !== '' && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
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
  const year = parseInt(y);
  const month = parseInt(m);
  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (ym === currentYM) return '本月';
  return `${year}年${month}月`;
}

/**
 * 根据商家和商品名称，智能猜测分类
 */
function guessCategory(
  merchant: string,
  product: string,
  type: 'income' | 'expense'
): string {
  if (type === 'income') return '其他';

  const text = (merchant + product).toLowerCase();

  // 餐饮相关关键词
  if (/饭|餐|面|粉|粥|包|鸡|鸭|鱼|肉|汤|火锅|烧烤|奶茶|咖啡|茶|饮料|水果|菜|食|厨|小吃|外卖|美团|饿了么/.test(text))
    return '餐饮';
  // 交通相关
  if (/滴滴|出租|公交|地铁|火车|高铁|飞机|机票|加油|充电|停车|高速|etc/.test(text))
    return '交通';
  // 购物相关
  if (/淘宝|天猫|京东|拼多多|超市|商场|便利店|百货|服饰|服装|鞋|包|化妆品|电器|数码/.test(text))
    return '购物';
  // 娱乐相关
  if (/电影|KTV|游戏|旅游|景点|门票|酒店|民宿|健身|运动/.test(text))
    return '娱乐';
  // 住房相关
  if (/房租|水电|物业|暖气|天然气|宽带/.test(text))
    return '住房';
  // 通讯
  if (/话费|流量|充值|电信|移动|联通/.test(text))
    return '通讯';
  // 医疗
  if (/医院|药|诊所|挂号|体检|医保/.test(text))
    return '医疗';
  // 教育
  if (/书|课|培训|学习|考试|报名/.test(text))
    return '教育';

  return '其他';
}

// ============================================================
// 样式
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ---- 导航栏 ----
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0, // 由 insets.top 动态处理
    paddingBottom: 4,
  },
  navTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  importButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  importButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },

  // ---- 加载 ----
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- 列表 ----
  listContent: {
    paddingBottom: 100,
  },

  // ---- 汇总卡片 ----
  summaryCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E5EA',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
  },
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  transactionCount: {
    fontSize: 12,
    color: '#AEAEB2',
    textAlign: 'center',
    marginTop: 8,
  },

  // ---- 空状态 ----
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
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
    textAlign: 'center',
    lineHeight: 20,
  },

  // ---- FAB ----
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 30,
    fontWeight: '400',
    color: '#FFFFFF',
    marginTop: -1,
  },

  // ---- Toast ----
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
