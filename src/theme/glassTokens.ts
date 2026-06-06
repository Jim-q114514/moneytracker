/**
 * Liquid Glass Design Tokens — iOS 26 液态玻璃参数系统
 *
 * 所有玻璃材质的设计变量集中管理
 * 支持深色/浅色模式自动切换
 */

import { useColorScheme } from 'react-native';

// ============================================================
// 基础玻璃参数（浅色模式）
// ============================================================

/** 玻璃模糊强度参数 */
export const GLASS_BLUR = {
  /** 轻度模糊（小型控件） */
  sm: 16,
  /** 标准模糊（卡片、面板） */
  md: 32,
  /** 强模糊（模态、弹窗、导航栏） */
  lg: 48,
  /** 极强模糊（全屏覆盖层） */
  xl: 60,
} as const;

/** 玻璃背景透明度（0-1，越大越不透明） */
export const GLASS_OPACITY = {
  /** 浅色模式基础透明度 */
  light: 0.64,
  /** 深色模式基础透明度 */
  dark: 0.44,
  /** 高亮模式（hover/press） */
  highlight: 0.72,
} as const;

/** 玻璃圆角 */
export const GLASS_RADIUS = {
  sm: 12,
  md: 20,
  lg: 28,
  xl: 36,
  pill: 9999,
} as const;

/** 玻璃边框 */
export const GLASS_BORDER = {
  light: 'rgba(255, 255, 255, 0.62)',
  dark: 'rgba(255, 255, 255, 0.14)',
  width: 0.5,
} as const;

/** 玻璃阴影 */
export const GLASS_SHADOW = {
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 26,
    elevation: 7,
  },
  dark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 8,
  },
  /** 悬浮（hover 等效） */
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 40,
    elevation: 16,
  },
  /** 按下 */
  pressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

/** 玻璃内高光（顶部高光线，模拟玻璃边缘反射） */
export const GLASS_HIGHLIGHT = {
  light: 'rgba(255, 255, 255, 0.40)',
  dark: 'rgba(255, 255, 255, 0.10)',
} as const;

/** 玻璃色调（tint） */
export const GLASS_TINT = {
  light: 'rgba(255, 255, 255, 0.12)',
  dark: 'rgba(28, 28, 30, 0.45)',
} as const;

// ============================================================
// 深色/浅色模式感知 Hook
// ============================================================

export interface GlassTokens {
  blur: typeof GLASS_BLUR;
  radius: typeof GLASS_RADIUS;
  // 动态值
  backgroundOpacity: number;
  borderColor: string;
  shadow: object;
  highlightColor: string;
  tintColor: string;
  isDark: boolean;
}

/**
 * 获取当前模式下的玻璃 tokens
 * 在组件中使用：const glass = useGlassTokens();
 */
export function getGlassTokens(isDark: boolean) {
  return {
    blur: GLASS_BLUR,
    radius: GLASS_RADIUS,
    backgroundOpacity: isDark ? GLASS_OPACITY.dark : GLASS_OPACITY.light,
    borderColor: isDark ? GLASS_BORDER.dark : GLASS_BORDER.light,
    shadow: isDark ? GLASS_SHADOW.dark : GLASS_SHADOW.light,
    highlightColor: isDark ? GLASS_HIGHLIGHT.dark : GLASS_HIGHLIGHT.light,
    tintColor: isDark ? GLASS_TINT.dark : GLASS_TINT.light,
    isDark,
  };
}

// ============================================================
// 预置玻璃样式工厂
// ============================================================

/**
 * 生成一组玻璃卡片样式
 * 用于 StyleSheet.create 中展开
 */
export function glassCardStyles(isDark: boolean) {
  const tokens = getGlassTokens(isDark);
  return {
    /** 基础液态玻璃卡片 */
    card: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity})`,
      borderRadius: tokens.radius.md,
      borderWidth: GLASS_BORDER.width,
      borderColor: tokens.borderColor,
      ...tokens.shadow,
      overflow: 'hidden' as const,
    },
    /** 浮动液态玻璃卡片（更强调层次） */
    cardElevated: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity + 0.08})`,
      borderRadius: tokens.radius.lg,
      borderWidth: GLASS_BORDER.width,
      borderColor: tokens.borderColor,
      ...GLASS_SHADOW.elevated,
      overflow: 'hidden' as const,
    },
    /** 圆角胶囊 */
    pill: {
      backgroundColor: `rgba(255, 255, 255, ${tokens.backgroundOpacity})`,
      borderRadius: tokens.radius.pill,
      borderWidth: GLASS_BORDER.width,
      borderColor: tokens.borderColor,
      ...tokens.shadow,
    },
  };
}

// ============================================================
// 边缘折射滤镜参数
// ============================================================

/** SVG 滤镜 — 边缘折射扰动参数 */
export const EDGE_REFRACTION_CONFIG = {
  /** 噪点基础频率 */
  baseFrequency: 0.04,
  /** 噪点八度数 */
  numOctaves: 3,
  /** 噪点种子 */
  seed: 2,
  /** 边缘位移强度（像素） */
  edgeDisplacement: 2.5,
  /** 中心位移强度（应为 0，保持中心清晰） */
  centerDisplacement: 0,
};
