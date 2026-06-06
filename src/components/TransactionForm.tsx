/**
 * 交易表单组件
 *
 * 全液态玻璃风格
 * - 玻璃态导航栏 + 分隔线
 * - 玻璃态金额输入区、文本输入框
 * - 玻璃 Chip：分类、支付方式
 * - 深色/浅色自适应
 * - 所有按钮/芯片按下缩放反馈
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useColorScheme,
  Animated,
} from 'react-native';
import {
  TransactionType,
  Transaction,
  PaymentMethod,
  PAYMENT_METHODS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  NewTransaction,
} from '../types';
import { createGlassStyles } from '../theme/glassStyles';
import { getSemanticColors } from '../theme/designSystem';
import GlassView from './GlassView';

interface Props {
  visible: boolean;
  editTransaction?: Transaction | null;
  prefilledData?: Partial<NewTransaction>;
  onSave: (data: NewTransaction, id?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

/** 可按下 Chip 子组件 — 带玻璃缩放反馈 */
function GlassChip({
  label,
  selected,
  onPress,
  isDark,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const glass = createGlassStyles(isDark);
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.93, friction: 8, tension: 100, useNativeDriver: true }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          glass.liquidGlassChip,
          styles.chipBase,
          selected && glass.liquidGlassChipSelected,
        ]}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.chipText,
            { color: isDark ? '#D1D1D6' : '#515154' },
            selected && { color: '#FFFFFF', fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function TransactionForm({
  visible,
  editTransaction,
  prefilledData,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glass = createGlassStyles(isDark);
  const colors = getSemanticColors(isDark);
  const isEdit = !!editTransaction;

  // ---- 表单状态 ----
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('其他');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('微信');
  const [dateTime, setDateTime] = useState(new Date());

  // ---- 初始化数据 ----
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.type);
      setAmount(String(editTransaction.amount));
      setCategory(editTransaction.category);
      setMerchant(editTransaction.merchant === '手动' ? '' : editTransaction.merchant);
      setNote(editTransaction.note);
      setPaymentMethod(editTransaction.payment_method as PaymentMethod);
      setDateTime(new Date(editTransaction.transaction_date));
    } else if (prefilledData) {
      if (prefilledData.type) setType(prefilledData.type);
      if (prefilledData.amount) setAmount(String(prefilledData.amount));
      if (prefilledData.merchant) setMerchant(prefilledData.merchant);
      if (prefilledData.note) setNote(prefilledData.note);
      if (prefilledData.payment_method) setPaymentMethod(prefilledData.payment_method as PaymentMethod);
      setDateTime(prefilledData.transaction_date ? new Date(prefilledData.transaction_date) : new Date());
    } else {
      setType('expense'); setAmount(''); setCategory('其他');
      setMerchant(''); setNote(''); setPaymentMethod('微信');
      setDateTime(new Date());
    }
  }, [editTransaction, prefilledData, visible]);

  const categories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  // ---- 保存 ----
  function handleSave() {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('请输入有效金额', '金额必须大于 0');
      return;
    }
    onSave({
      amount: numAmount, type, category,
      merchant: merchant.trim() || '手动',
      note: note.trim(), payment_method: paymentMethod,
      transaction_date: dateTime.toISOString(),
    }, editTransaction?.id);
  }

  // ---- 删除 ----
  function handleDelete() {
    if (!editTransaction) return;
    Alert.alert('确认删除', '删除后不可恢复，确定要删除这条交易记录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => onDelete?.(editTransaction.id) },
    ]);
  }

  // ---- 快捷金额 ----
  function adjustAmount(delta: number) {
    const current = parseFloat(amount) || 0;
    const newVal = Math.max(0, current + delta);
    setAmount(newVal > 0 ? newVal.toFixed(2) : '');
  }

  const textColor = colors.label;
  const mutedColor = colors.secondaryLabel;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.systemBackground }]}>
        {/* ---- 玻璃导航栏 ---- */}
        <View style={[glass.liquidGlassNav, styles.header]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.accent }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isEdit ? '编辑交易' : '新增交易'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
            <Text style={[styles.saveText, { color: colors.accent }]}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* ---- 收支类型切换 ---- */}
          <View style={[styles.typeSwitch, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(118,118,128,0.12)' }]}>
            {(['expense', 'income'] as TransactionType[]).map((t) => {
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeButton,
                    active && {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : colors.secondarySystemBackground,
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
                    },
                  ]}
                  onPress={() => { setType(t); setCategory('其他'); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeText, { color: mutedColor },
                    active && { color: textColor, fontWeight: '600' }]}>
                    {t === 'expense' ? '支出' : '收入'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ---- 金额输入（玻璃卡片） ---- */}
          <GlassView intensity="md" radius="lg" style={[styles.amountSection, { alignItems: 'center' }]}>
            <Text style={[styles.currencySymbol, { color: mutedColor }]}>¥</Text>
            <TextInput
              style={[styles.amountInput, { color: textColor }]}
              value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0.00"
              placeholderTextColor={isDark ? '#636366' : '#C7C7CC'} selectTextOnFocus
            />
            <View style={styles.amountAdjust}>
              {[0.5, 1, 10].map((d) => (
                <TouchableOpacity key={d}
                  style={[glass.liquidGlassChip, styles.adjustButton]}
                  onPress={() => adjustAmount(d)} activeOpacity={0.7}>
                  <Text style={[styles.adjustButtonText, { color: colors.accent }]}>+{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassView>

          {/* ---- 分类 ---- */}
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>分类</Text>
          <View style={styles.chipGrid}>
            {categories.map((cat) => (
              <GlassChip key={cat} label={cat} selected={category === cat}
                onPress={() => setCategory(cat)} isDark={isDark} />
            ))}
          </View>

          {/* ---- 商家 ---- */}
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>商家 / 交易对方</Text>
          <TextInput style={[glass.liquidGlassInput, { color: textColor }]}
            value={merchant} onChangeText={setMerchant}
            placeholder="例如：星巴克、滴滴出行"
            placeholderTextColor={isDark ? '#636366' : '#C7C7CC'} />

          {/* ---- 备注 ---- */}
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>备注</Text>
          <TextInput style={[glass.liquidGlassInput, { color: textColor }]}
            value={note} onChangeText={setNote}
            placeholder="添加备注信息（可选）"
            placeholderTextColor={isDark ? '#636366' : '#C7C7CC'} />

          {/* ---- 支付方式 ---- */}
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>支付方式</Text>
          <View style={styles.chipGrid}>
            {PAYMENT_METHODS.map((method) => (
              <GlassChip key={method} label={method} selected={paymentMethod === method}
                onPress={() => setPaymentMethod(method)} isDark={isDark} />
            ))}
          </View>

          {/* ---- 交易时间 ---- */}
          <Text style={[styles.sectionTitle, { color: mutedColor }]}>交易时间</Text>
          <GlassView intensity="sm" radius="md" style={[styles.dateTimeBox, { alignItems: 'center' }]}>
            <Text style={[styles.dateTimeText, { color: textColor }]}>
              {formatDateTime(dateTime)}
            </Text>
            <Text style={[styles.dateTimeHint, { color: colors.tertiaryLabel }]}>
              {isEdit ? '编辑时默认保留原交易时间' : '默认使用当前系统时间'}
            </Text>
            <TouchableOpacity
              style={[glass.liquidGlassChip, styles.nowButton]}
              onPress={() => setDateTime(new Date())}
              activeOpacity={0.7}
            >
              <Text style={[styles.nowButtonText, { color: colors.accent }]}>设为现在</Text>
            </TouchableOpacity>
          </GlassView>

          {/* ---- 删除（仅编辑模式） ---- */}
          {isEdit && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={[styles.deleteText, { color: colors.destructive }]}>删除此交易</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}  ${h}:${mi}:${s}`;
}

// ============================================================
// 样式（仅保留布局/尺寸属性，颜色全由 glass tokens 控制）
// ============================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerButton: { minWidth: 50 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  cancelText: { fontSize: 17, color: '#007AFF' },
  saveText: { fontSize: 17, fontWeight: '600', color: '#007AFF', textAlign: 'right' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  // 收支切换
  typeSwitch: { flexDirection: 'row', borderRadius: 10, padding: 2, marginBottom: 20 },
  typeButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  typeText: { fontSize: 15, fontWeight: '500' },

  // 金额输入
  amountSection: { marginBottom: 24, paddingVertical: 16 },
  currencySymbol: { fontSize: 20, fontWeight: '500', marginBottom: 4 },
  amountInput: {
    fontSize: 48, fontWeight: '700', textAlign: 'center',
    minWidth: 200, paddingVertical: 4, fontVariant: ['tabular-nums'],
  },
  amountAdjust: { flexDirection: 'row', marginTop: 12, gap: 8 },
  adjustButton: { paddingHorizontal: 14, paddingVertical: 6 },
  adjustButtonText: { fontSize: 14, fontWeight: '500', color: '#007AFF' },

  // 分区
  sectionTitle: {
    fontSize: 13, fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0, marginBottom: 8, marginTop: 4,
  },

  // Chip 网格
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chipBase: { paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 14, fontWeight: '500' },

  // 日期
  dateTimeBox: { marginBottom: 20, paddingHorizontal: 14, paddingVertical: 12 },
  dateTimeText: { fontSize: 16, fontWeight: '500' },
  dateTimeHint: { fontSize: 12, color: '#AEAEB2', marginTop: 4 },
  nowButton: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 7 },
  nowButtonText: { fontSize: 14, fontWeight: '500', color: '#007AFF' },

  // 删除
  deleteButton: { alignItems: 'center', paddingVertical: 16, marginTop: 12 },
  deleteText: { fontSize: 17, color: '#FF3B30', fontWeight: '500' },
});
