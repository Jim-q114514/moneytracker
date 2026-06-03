/**
 * 底部标签导航配置
 *
 * 三个标签页：账单、统计、设置
 * 遵循 iOS 设计规范，使用系统图标
 */

import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import TransactionsScreen from '../screens/TransactionsScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { getSemanticColors } from '../theme/designSystem';

const Tab = createBottomTabNavigator();

/** 自定义浅色主题（iOS 风格） */
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F2F2F7',
    card: 'rgba(255,255,255,0.9)',
    border: 'rgba(0,0,0,0.08)',
  },
};

/** 自定义深色主题 */
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000000',
    card: 'rgba(28,28,30,0.9)',
    border: 'rgba(255,255,255,0.08)',
  },
};

export default function AppNavigator() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getSemanticColors(isDark);

  return (
    <NavigationContainer theme={isDark ? CustomDarkTheme : LightTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Transactions') {
              iconName = focused ? 'receipt' : 'receipt-outline';
            } else if (route.name === 'Statistics') {
              iconName = focused ? 'pie-chart' : 'pie-chart-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            } else {
              iconName = 'ellipse-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.tertiaryLabel,
          tabBarStyle: {
            backgroundColor: isDark
              ? 'rgba(28,28,30,0.82)'
              : 'rgba(255,255,255,0.78)',
            borderTopColor: colors.separator,
            borderTopWidth: 0.5,
            paddingBottom: Platform.OS === 'ios' ? 24 : 8,
            paddingTop: 6,
            height: Platform.OS === 'ios' ? 86 : 60,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
          },
        })}
      >
        <Tab.Screen
          name="Transactions"
          component={TransactionsScreen}
          options={{ tabBarLabel: '账单' }}
        />
        <Tab.Screen
          name="Statistics"
          component={StatisticsScreen}
          options={{ tabBarLabel: '统计' }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarLabel: '设置' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
