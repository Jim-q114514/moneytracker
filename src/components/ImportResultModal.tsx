/**
 * 导入结果展示弹窗
 *
 * 液态玻璃风格弹窗
 * - 半透明深色遮罩
 * - 玻璃态卡片容器
 * - 支持深色/浅色模式
 * - 按钮带按下反馈
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Animated,
} from 'react-native';
import { ImportResult } from '../types';
import { createGlassStyles } from '../theme/glassStyles';
import { getSemanticColors } from '../theme/designSystem';

interface Props {
  visible: boolean;
  result: ImportResult;
  onClose: () => void;
}

export default function ImportResultModal({ visible, result, onClose }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const glass = createGlassStyles(isDark);
  const colors = getSemanticColors(isDark);

  const [pressScale] = useState(() => new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 玻璃深色遮罩 */}
      <View style={[styles.overlay, {
        backgroundColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.4)',
      }]}>
        {/* 液态玻璃卡片 */}
        <View style={[glass.liquidGlassElevated, styles.card]}>
          <Text style={[styles.title, { color: colors.label }]}>
            导入完成
          </Text>

          {/* 统计数字 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.income }]}>
                {result.success}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>成功导入</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#FF9500' }]}>
                {result.skipped}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>已跳过</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.expense }]}>
                {result.failed}
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryLabel }]}>失败</Text>
            </View>
          </View>

          {/* 错误详情 */}
          {result.errors.length > 0 && (
            <View style={[styles.errorContainer, {
              backgroundColor: isDark ? 'rgba(255,69,58,0.12)' : '#FFF5F5',
            }]}>
              <Text style={[styles.errorTitle, { color: colors.destructive }]}>错误详情</Text>
              <ScrollView style={styles.errorList}>
                {result.errors.map((err, index) => (
                  <Text key={index} style={[styles.errorText, { color: colors.secondaryLabel }]}>
                    {err}
                  </Text>
                ))}
              </ScrollView>
            </View>
          )}

          {/* 玻璃按钮 + 按下反馈 */}
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <TouchableOpacity
              style={[glass.liquidGlassPill, styles.button, {
                backgroundColor: colors.accent,
              }]}
              onPress={onClose}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>知道了</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 24,
    width: '85%',
    maxWidth: 340,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    maxHeight: 150,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorList: {
    maxHeight: 100,
  },
  errorText: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 2,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
