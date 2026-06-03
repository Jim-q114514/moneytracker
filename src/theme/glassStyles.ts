/**
 * 液态玻璃样式预设 — 可直接在 StyleSheet.create / inline 中使用的样式
 *
 * 这些是纯样式对象（不依赖组件），轻量级替代 GlassView
 * 适用于不想嵌套 BlurView 的场景（如 FlatList 中的每行）
 *
 * 设计规范对齐：
 * - 卡片圆角 16pt、按钮圆角 12pt
 * - 浅色模式用柔和阴影、深色模式取消阴影改用边框
 * - 内边距 12pt、外边距 16pt
 */

import { ViewStyle, TextStyle } from 'react-native';
import { getGlassTokens, GLASS_RADIUS, GLASS_BLUR } from './glassTokens';
import { Radius, ShadowStrategy, Spacing } from './designSystem';

// ============================================================
// 样式工厂函数
// ============================================================

/**
 * 生成一组液态玻璃样式
 * @param isDark 是否深色模式
 */
export function createGlassStyles(isDark: boolean) {
  const tokens = getGlassTokens(isDark);

  // 深色模式用边框替代阴影
  const cardElevation = isDark
    ? {
        borderWidth: 1 as const,
        borderColor: ShadowStrategy.darkBorder,
      }
    : {
        ...ShadowStrategy.card,
        borderWidth: 0.5 as const,
        borderColor: ShadowStrategy.lightBorder,
      };

  return {
    // ---- 基础液态玻璃卡片（圆角 16pt） ----
    liquidGlass: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity})`,
      borderRadius: Radius.card,
      ...cardElevation,
      overflow: 'hidden' as const,
    } as ViewStyle,

    // ---- 高亮液态玻璃（悬浮态，圆角 20pt） ----
    liquidGlassElevated: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity + 0.06})`,
      borderRadius: Radius.modal,
      ...(isDark
        ? {
            borderWidth: 1,
            borderColor: ShadowStrategy.darkBorderProminent,
          }
        : {
            borderWidth: 0.5,
            borderColor: ShadowStrategy.lightBorder,
            ...ShadowStrategy.elevated,
          }),
      overflow: 'hidden' as const,
    } as ViewStyle,

    // ---- 玻璃按钮/胶囊（圆角 max） ----
    liquidGlassPill: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity})`,
      borderRadius: Radius.pill,
      ...(isDark
        ? {
            borderWidth: 1,
            borderColor: ShadowStrategy.darkBorder,
          }
        : {
            borderWidth: 0.5,
            borderColor: ShadowStrategy.lightBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }),
    } as ViewStyle,

    // ---- 玻璃导航栏 ----
    liquidGlassNav: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity + 0.04})`,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark
        ? ShadowStrategy.darkBorder
        : 'rgba(0, 0, 0, 0.08)',
    } as ViewStyle,

    // ---- 玻璃模态背景 ----
    liquidGlassOverlay: {
      backgroundColor: isDark
        ? 'rgba(0, 0, 0, 0.55)'
        : 'rgba(0, 0, 0, 0.35)',
    } as ViewStyle,

    // ---- 玻璃输入框（圆角 12pt） ----
    liquidGlassInput: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity + 0.04})`,
      borderRadius: Radius.input,
      borderWidth: 0.5,
      borderColor: tokens.borderColor,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#1C1C1E',
    } as ViewStyle & TextStyle,

    // ---- 玻璃分隔线 ----
    liquidGlassSeparator: {
      height: 0.5,
      backgroundColor: tokens.borderColor,
    } as ViewStyle,

    // ---- 玻璃标签/Chip（圆角 10pt） ----
    liquidGlassChip: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity})`,
      borderRadius: Radius.chip,
      borderWidth: 0.5,
      borderColor: tokens.borderColor,
      paddingHorizontal: 14,
      paddingVertical: 8,
    } as ViewStyle,

    // ---- 玻璃 Chip 选中态 ----
    liquidGlassChipSelected: {
      backgroundColor: isDark
        ? 'rgba(0, 122, 255, 0.35)'
        : 'rgba(0, 122, 255, 0.85)',
      borderColor: isDark
        ? 'rgba(255, 255, 255, 0.25)'
        : 'rgba(255, 255, 255, 0.5)',
      borderWidth: 0.5,
    } as ViewStyle,
  };
}

// ============================================================
// 动画参数（用于 Animated.spring / Animated.timing）
// ============================================================

export const GLASS_ANIMATION = {
  /** 按下缩放 */
  pressScale: {
    toValue: 0.97,
    duration: 100,
    useNativeDriver: true,
  },
  /** 释放回弹 */
  releaseSpring: {
    toValue: 1,
    friction: 6,
    tension: 100,
    useNativeDriver: true,
  },
  /** 出现动画 */
  appear: {
    from: { opacity: 0, transform: [{ scale: 0.95 }] },
    to: { opacity: 1, transform: [{ scale: 1 }] },
    duration: 300,
    useNativeDriver: true,
  },
} as const;
