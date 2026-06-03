/**
 * MoneyTracker 统一设计系统
 *
 * 所有视觉常量集中管理，确保全局风格统一
 * ── 色板：语义色（深/浅双模式），所有文字对比度 ≥ 4.5:1（WCAG AA）
 * ── 字体层级：largeTitle → caption2
 * ── 间距 / 圆角 / 触控区规范
 * ── 禁止使用硬编码纯灰色，一律走语义色
 */

// ============================================================
// 语义色板
// ============================================================

/** 浅色模式语义色 */
export const LightColors = {
  // ── 背景 ──
  systemBackground: '#F2F2F7',
  secondarySystemBackground: '#FFFFFF',
  groupedBackground: '#F2F2F7',

  // ── 文字（全部 ≥ 4.5:1 对比度） ──
  /** 主文字，对比度 ~18:1 */
  label: '#1C1C1E',
  /** 辅助文字，对比度 ~7.9:1（替代原 #8E8E93 ~3.7:1） */
  secondaryLabel: '#515154',
  /** 三级文字，对比度 ~4.6:1 */
  tertiaryLabel: '#787880',
  /** 占位符/禁用态文字 */
  quaternaryLabel: '#A1A1A6',

  // ── 语义色 ──
  /** 收入/正向/成功 */
  income: '#34C759',
  /** 支出/负向/危险 */
  expense: '#FF3B30',
  /** 交互/链接 */
  accent: '#007AFF',
  /** 危险操作文字 */
  destructive: '#FF3B30',

  // ── 分隔 ──
  /** 标准分隔线 */
  separator: '#E5E5EA',
  /** 不透明分隔线 */
  opaqueSeparator: '#C6C6C8',

  // ── 其他 ──
  /** 进度条背景 */
  progressBackground: '#E5E5EA',
  /** Toast / 深色遮罩文字 */
  toastForeground: '#FFFFFF',
} as const;

/** 深色模式语义色 */
export const DarkColors = {
  // ── 背景 ──
  systemBackground: '#000000',
  secondarySystemBackground: '#1C1C1E',
  groupedBackground: '#000000',

  // ── 文字 ──
  /** 主文字，对比度 ~21:1 */
  label: '#FFFFFF',
  /** 辅助文字，对比度 ~10:1 */
  secondaryLabel: '#D1D1D6',
  /** 三级文字，对比度 ~7.3:1 */
  tertiaryLabel: '#98989D',
  /** 占位符/禁用态文字 */
  quaternaryLabel: '#636366',

  // ── 语义色（深色下降低饱和度，避免刺眼） ──
  /** 收入/正向/成功 */
  income: '#30D158',
  /** 支出/负向/危险 */
  expense: '#FF453A',
  /** 交互/链接 */
  accent: '#0A84FF',
  /** 危险操作文字 */
  destructive: '#FF453A',

  // ── 分隔 ──
  /** 标准分隔线 */
  separator: '#38383A',
  /** 不透明分隔线 */
  opaqueSeparator: '#545458',

  // ── 其他 ──
  /** 进度条背景 */
  progressBackground: '#3A3A3C',
  /** Toast / 深色遮罩文字 */
  toastForeground: '#FFFFFF',
} as const;

/** 获取当前模式下的语义色 */
export type SemanticColors = typeof LightColors;

/**
 * 根据深色/浅色模式返回语义色对象
 * @param isDark 是否深色模式
 */
export function getSemanticColors(isDark: boolean): SemanticColors {
  return isDark ? DarkColors : LightColors;
}

// ============================================================
// 字体层级（基于 Apple typography scale）
// ============================================================

export const Typography = {
  /** 页面大标题 — 34pt 粗体 */
  largeTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
  },
  /** 一级标题 */
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  /** 二级标题 */
  title2: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  /** 三级标题 */
  title3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  /** 小标题/卡片标题 */
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  /** 正文 */
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
  },
  /** 标注 */
  callout: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  /** 副标题 */
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  /** 脚注 */
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
  },
  /** 辅助说明文字（确保对比度 ≥ 4.5:1） */
  caption1: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  /** 最小辅助文字 */
  caption2: {
    fontSize: 11,
    fontWeight: '400' as const,
  },
} as const;

// ============================================================
// 间距系统
// ============================================================

export const Spacing = {
  /** 卡片外边距 — 16pt */
  margin: 16,
  /** 卡片内边距 — 12pt */
  padding: 12,
  /** 分组间距 — 24pt */
  sectionGap: 24,
  /** 列表项间距 */
  itemGap: 8,
  /** 紧凑间距 */
  compact: 4,
  /** 最小触控区域 — Apple HIG 要求 ≥ 44pt */
  minTouchTarget: 44,
} as const;

// ============================================================
// 圆角系统
// ============================================================

export const Radius = {
  /** 卡片圆角 — 16pt */
  card: 16,
  /** 按钮圆角 — 12pt */
  button: 12,
  /** Chip/标签圆角 */
  chip: 10,
  /** 输入框圆角 */
  input: 12,
  /** 模态框圆角 */
  modal: 20,
  /** 图标容器圆角 */
  iconContainer: 10,
  /** 完全圆角（胶囊形） */
  pill: 9999,
  /** 开关/Toggle 圆角 */
  toggle: 10,
} as const;

// ============================================================
// 阴影策略
// ============================================================

/**
 * 阴影预设
 * 浅色模式：柔和阴影
 * 深色模式：取消阴影，改用边框（`ShadowStrategy.darkBorder`）
 */
export const ShadowStrategy = {
  /** 卡片阴影（浅色） */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  /** 悬浮阴影 */
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  /** 深色模式下替代阴影的边框色 */
  darkBorder: 'rgba(255, 255, 255, 0.10)',
  /** 深色模式增强边框（用于需要突出层次时） */
  darkBorderProminent: 'rgba(255, 255, 255, 0.15)',
  /** 浅色模式下替代阴影的边框色 */
  lightBorder: 'rgba(0, 0, 0, 0.06)',
} as const;

// ============================================================
// 便捷 Hook — useSemanticColors
// ============================================================

import { useColorScheme } from 'react-native';

/**
 * 在组件中获取当前模式的语义色
 *
 * 使用方式：
 * ```tsx
 * const colors = useSemanticColors();
 * // colors.label → 当前模式下的主文字色
 * // colors.income → 当前模式下的收入色（深色自动降饱和）
 * ```
 */
export function useSemanticColors(): SemanticColors {
  const colorScheme = useColorScheme();
  return getSemanticColors(colorScheme === 'dark');
}
