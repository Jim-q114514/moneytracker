/**
 * 设置页面
 *
 * 功能：
 * - 导出交易数据为 JSON
 * - 导出数据库文件
 * - 清理所有数据
 * - 应用信息
 * - 自动记账（快捷指令）说明
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

import {
  getAllTransactions,
  deleteAllTransactions,
  getAvailableMonths,
  getDatabasePath,
} from '../database/database';
import { exportToJSON } from '../utils/exportImport';
import { createGlassStyles } from '../theme/glassStyles';
import { getSemanticColors } from '../theme/designSystem';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glass = createGlassStyles(isDark);
  const colors = getSemanticColors(isDark);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [monthCount, setMonthCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const all = await getAllTransactions();
      const months = await getAvailableMonths();
      setTotalCount(all.length);
      setMonthCount(months.length);
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  }

  // ---- 导出 JSON ----
  async function handleExportJSON() {
    try {
      setLoading(true);
      const transactions = await getAllTransactions();

      if (transactions.length === 0) {
        Alert.alert('无数据', '没有可导出的交易记录');
        return;
      }

      await exportToJSON(transactions);
    } catch (err: any) {
      Alert.alert('导出失败', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- 导出数据库文件 ----
  async function handleExportDatabase() {
    try {
      setLoading(true);
      const dbPath = getDatabasePath();

      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        Alert.alert('文件不存在', '数据库文件未找到');
        return;
      }

      // 复制到文档目录以便分享
      const destPath = `${FileSystem.documentDirectory}moneytracker_backup.db`;
      await FileSystem.copyAsync({ from: dbPath, to: destPath });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destPath, {
          mimeType: 'application/octet-stream',
          dialogTitle: '导出数据库文件',
        });
      } else {
        Alert.alert('提示', `数据库已复制到:\n${destPath}`);
      }
    } catch (err: any) {
      Alert.alert('导出失败', err.message);
    } finally {
      setLoading(false);
    }
  }

  // ---- 清理所有数据 ----
  function handleClearData() {
    Alert.alert(
      '⚠️ 清理所有数据',
      '此操作将删除所有交易记录，不可恢复！\n\n建议先导出数据备份。',
      [
        { text: '先导出再清理', onPress: handleExportJSON },
        {
          text: '直接清理',
          style: 'destructive',
          onPress: async () => {
            Alert.alert(
              '确认清理',
              '输入 "删除" 确认此操作',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '确认清理',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      await deleteAllTransactions();
                      await loadStats();
                      Alert.alert('已清理', '所有交易记录已删除');
                    } catch (err: any) {
                      Alert.alert('清理失败', err.message);
                    } finally {
                      setLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
        { text: '取消', style: 'cancel' },
      ]
    );
  }

  // ---- 打开快捷指令说明 ----
  function handleShortcutGuide() {
    Alert.alert(
      '💡 自动记账说明',
      '1. 打开 iOS「快捷指令」App\n' +
        '2. 创建「自动化」→ 选择「收到短信/通知」\n' +
        '3. 设置触发条件：来自「微信支付」或「支付宝」\n' +
        '4. 添加操作「打开 URL」\n' +
        '5. 输入格式：moneytracker://add?amount=金额&merchant=商家&type=expense&payment=微信\n\n' +
        '详细教程请查看 README 文件。',
      [{ text: '知道了' }]
    );
  }

  const isLoading = loading;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.systemBackground }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 标题 */}
      <Text style={[styles.pageTitle, { color: colors.label, paddingTop: insets.top + 8 }]}>设置</Text>

      {/* 数据概览 */}
      <View style={[glass.liquidGlass, styles.statsCard]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{totalCount}</Text>
          <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>总交易数</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.accent }]}>{monthCount}</Text>
          <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>有记录月份</Text>
        </View>
      </View>

      {/* 加载指示器 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={[styles.loadingText, { color: colors.secondaryLabel }]}>处理中...</Text>
        </View>
      )}

      {/* ---- 数据管理 ---- */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryLabel }]}>数据管理</Text>

      <View style={[glass.liquidGlass, styles.menuCard]}>
        <MenuItem
          icon="📤"
          title="导出为 JSON"
          subtitle="可隔空投送到其他设备导入"
          onPress={handleExportJSON}
          colors={colors}
          isDark={isDark}
        />
        <MenuDivider color={colors.separator} />
        <MenuItem
          icon="🗄️"
          title="导出数据库文件"
          subtitle="完整数据库备份（.db 文件）"
          onPress={handleExportDatabase}
          colors={colors}
          isDark={isDark}
        />
        <MenuDivider color={colors.separator} />
        <MenuItem
          icon="📥"
          title="导入账单"
          subtitle="在账单页点击「导入」进行操作"
          onPress={() => Alert.alert('提示', '请在「账单」标签页点击右上角「导入」按钮进行操作')}
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* ---- 自动记账 ---- */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryLabel }]}>自动记账</Text>

      <View style={[glass.liquidGlass, styles.menuCard]}>
        <MenuItem
          icon="⚡"
          title="快捷指令自动记账"
          subtitle="通过 Siri 快捷指令实现自动记账"
          onPress={handleShortcutGuide}
          colors={colors}
          isDark={isDark}
        />
        <MenuDivider color={colors.separator} />
        <MenuItem
          icon="🔗"
          title="URL Scheme 说明"
          subtitle="moneytracker://add?amount=...&merchant=..."
          onPress={() => {
            Alert.alert(
              'URL Scheme 格式',
              'moneytracker://add\n' +
                '  ?amount=金额\n' +
                '  &merchant=商家\n' +
                '  &payment=支付方式\n' +
                '  &note=备注\n' +
                '  &type=expense 或 income\n' +
                '  &time=ISO日期(可选)\n\n' +
                '示例:\n' +
                'moneytracker://add?amount=28.50&merchant=星巴克&payment=微信&type=expense'
            );
          }}
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* ---- 危险操作 ---- */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryLabel }]}>危险操作</Text>

      <View style={[glass.liquidGlass, styles.menuCard]}>
        <MenuItem
          icon="🗑️"
          title="清理所有数据"
          subtitle="删除全部交易记录，不可恢复"
          onPress={handleClearData}
          destructive
          colors={colors}
          isDark={isDark}
        />
      </View>

      {/* ---- 关于 ---- */}
      <Text style={[styles.sectionHeader, { color: colors.secondaryLabel }]}>关于</Text>

      <View style={[glass.liquidGlass, styles.menuCard]}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.label }]}>应用名称</Text>
          <Text style={[styles.aboutValue, { color: colors.secondaryLabel }]}>MoneyTracker</Text>
        </View>
        <MenuDivider color={colors.separator} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.label }]}>版本</Text>
          <Text style={[styles.aboutValue, { color: colors.secondaryLabel }]}>1.0.0</Text>
        </View>
        <MenuDivider color={colors.separator} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.label }]}>数据存储</Text>
          <Text style={[styles.aboutValue, { color: colors.secondaryLabel }]}>100% 本地存储</Text>
        </View>
        <MenuDivider color={colors.separator} />
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: colors.label }]}>Bundle ID</Text>
          <Text style={[styles.aboutValue, { color: colors.secondaryLabel }]}>com.yourcompany.moneytracker</Text>
        </View>
      </View>

      <View style={{ height: 50 }} />
    </ScrollView>
  );
}

// ============================================================
// 子组件
// ============================================================

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  destructive = false,
  colors,
  isDark,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  destructive?: boolean;
  colors: ReturnType<typeof getSemanticColors>;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { minHeight: 44 }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuText}>
        <Text
          style={[
            styles.menuTitle,
            { color: destructive ? colors.destructive : colors.label },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.menuSubtitle, { color: colors.secondaryLabel }]}>
          {subtitle}
        </Text>
      </View>
      <Text style={[styles.menuArrow, { color: colors.quaternaryLabel }]}>›</Text>
    </TouchableOpacity>
  );
}

function MenuDivider({ color }: { color: string }) {
  return <View style={[styles.menuDivider, { backgroundColor: color }]} />;
}

// ============================================================
// 样式
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // ---- 标题 ----
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },

  // ---- 数据概览 ----
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
    alignSelf: 'center',
  },

  // ---- 加载覆盖层 ----
  loadingOverlay: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },

  // ---- 分组标题 ----
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },

  // ---- 菜单卡片 ----
  menuCard: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 22,
    fontWeight: '300',
    color: '#C7C7CC',
    marginLeft: 8,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 54,
  },

  // ---- 关于 ----
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aboutLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  aboutValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
