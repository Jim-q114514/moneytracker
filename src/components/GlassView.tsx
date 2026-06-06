/**
 * GlassView — 液态玻璃容器组件
 *
 * React Native 中的毛玻璃效果实现
 * 使用 expo-blur 的 BlurView 实现真正的 iOS 背景模糊
 *
 * 用法：
 *   <GlassView intensity="md" radius="md">
 *     <Text>玻璃卡片内容</Text>
 *   </GlassView>
 */

import React, { ReactNode } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  StyleProp,
  useColorScheme,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  GLASS_BLUR,
  GLASS_RADIUS,
  GLASS_BORDER,
  GLASS_SHADOW,
  GLASS_OPACITY,
  getGlassTokens,
} from '../theme/glassTokens';

type GlassIntensity = 'sm' | 'md' | 'lg' | 'xl' | 'none';
type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | 'pill' | 'none';

interface GlassViewProps {
  children: ReactNode;
  /** 模糊强度，默认 'md' */
  intensity?: GlassIntensity;
  /** 圆角大小，默认 'md' */
  radius?: GlassRadius;
  /** 是否带边框 */
  border?: boolean;
  /** 是否带内高光 */
  highlight?: boolean;
  /** 是否可交互（启用 press 反馈） */
  interactive?: boolean;
  /** 自定义样式 */
  style?: StyleProp<ViewStyle>;
  /** 按下回调 */
  onPress?: () => void;
  /** 长按回调 */
  onLongPress?: () => void;
  /** 是否启用边缘折射 SVG 滤镜（性能开销大，默认关闭） */
  enableEdgeRefraction?: boolean;
}

export default function GlassView({
  children,
  intensity = 'md',
  radius = 'md',
  border = true,
  highlight = true,
  interactive = false,
  style,
  onPress,
  onLongPress,
  enableEdgeRefraction = false,
}: GlassViewProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tokens = getGlassTokens(isDark);

  // 圆角值
  const borderRadius = radius === 'none' ? 0 : GLASS_RADIUS[radius];

  // 模糊值
  const blurIntensity = intensity === 'none' ? 0 : GLASS_BLUR[intensity];

  // 半透明背景叠加色
  const tintColor = isDark
    ? `rgba(28, 28, 30, ${GLASS_OPACITY.dark})`
    : `rgba(255, 255, 255, ${GLASS_OPACITY.light})`;

  const content = (
    <View
      style={[
        styles.wrapper,
        {
          borderRadius,
          ...(border
            ? {
                borderWidth: GLASS_BORDER.width,
                borderColor: tokens.borderColor,
              }
            : {}),
          ...tokens.shadow,
        },
        style,
      ]}
    >
      {/* 底层：iOS 原生模糊 */}
      {blurIntensity > 0 && (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blur, { borderRadius }]}
        />
      )}

      {/* 中间层：半透明色调叠加 */}
      <View
        style={[
          styles.tint,
          {
            backgroundColor: tintColor,
            borderRadius,
          },
        ]}
      />

      {/* 顶层：内高光（模拟玻璃边缘反射） */}
      {highlight && (
        <View
          style={[
            styles.highlight,
            {
              borderRadius,
              borderColor: tokens.highlightColor,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* 内容层 */}
      <View style={[styles.content, { borderRadius }]}>{children}</View>
    </View>
  );

  // 可交互模式：包裹 Pressable 实现 press 反馈
  if (interactive && (onPress || onLongPress)) {
    return (
      <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={500}>
        {({ pressed }) => (
          <View
            style={[
              pressed && {
                transform: [{ scale: 0.985 }],
                opacity: 0.92,
              },
            ]}
          >
            {content}
          </View>
        )}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopWidth: 0.5,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0,
    opacity: 0.6,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
