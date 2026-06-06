/**
 * MoneyTracker - 智能记账软件
 * 入口文件
 *
 * 职责：
 * 1. 初始化数据库
 * 2. 监听 URL Scheme（moneytracker://add?amount=...&merchant=...）
 * 3. 渲染导航和 Toast 提示
 */

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Animated, DeviceEventEmitter, Text, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase, addTransaction } from './src/database/database';
import { generateTransactionId } from './src/utils/hash';
import { TRANSACTIONS_CHANGED_EVENT } from './src/utils/events';

/** 解析 URL 参数 */
function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryString = url.split('?')[1];
  if (!queryString) return params;

  queryString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  return params;
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // 初始化数据库
  useEffect(() => {
    initDatabase()
      .then(() => {
        setDbReady(true);
        console.log('✅ 数据库初始化成功');
      })
      .catch((err) => {
        Alert.alert('启动失败', `数据库初始化出错: ${err.message}`);
        console.error('数据库初始化失败:', err);
      });
  }, []);

  // 监听 URL Scheme
  useEffect(() => {
    // 处理冷启动时的 URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleIncomingURL(url);
      }
    });

    // 监听运行时 URL
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleIncomingURL(url);
    });

    return () => {
      subscription.remove();
    };
  }, [dbReady]);

  /**
   * 处理通过 URL Scheme 传入的自动记账请求
   * 格式：moneytracker://add?amount=28.5&merchant=星巴克&payment=微信&note=拿铁&type=expense&time=2024-01-15T10:30:00
   */
  async function handleIncomingURL(url: string) {
    if (!dbReady) {
      console.warn('数据库尚未就绪，忽略 URL:', url);
      return;
    }

    try {
      // 检查是否是 add 路径
      if (!url.includes('moneytracker://add')) {
        return;
      }

      const params = parseQueryParams(url);

      // 验证必填参数
      const amount = parseFloat(params.amount);
      if (isNaN(amount) || amount <= 0) {
        showToast('❌ 自动记账失败：无效的金额');
        return;
      }

      const merchant = params.merchant || '自动记账';
      const payment = params.payment || '微信';
      const type = params.type === 'income' ? 'income' : 'expense';
      const note = params.note || '';

      // 时间：如果提供了 time 参数就用它，否则用当前时间
      const transactionDate = params.time || new Date().toISOString();

      // 生成唯一编号
      const id = generateTransactionId();

      // 添加到数据库
      await addTransaction({
        id,
        amount,
        type,
        category: '其他',
        merchant,
        note,
        payment_method: payment as any,
        transaction_date: transactionDate,
      });

      DeviceEventEmitter.emit(TRANSACTIONS_CHANGED_EVENT);

      const typeLabel = type === 'income' ? '收入' : '支出';
      showToast(`✅ 自动记账成功：${typeLabel} ¥${amount.toFixed(2)} - ${merchant}`);
    } catch (err: any) {
      showToast(`❌ 自动记账失败：${err.message}`);
      console.error('URL Scheme 处理失败:', err);
    }
  }

  /** 显示 Toast 提示 */
  function showToast(message: string) {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage('');
    });
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <AppNavigator />

        {/* 全局 Toast */}
        {toastMessage !== '' && (
          <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.82)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
