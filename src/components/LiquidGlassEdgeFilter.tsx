/**
 * LiquidGlassEdgeFilter — iOS 26 液态玻璃边缘折射 SVG 滤镜
 *
 * 核心技术：
 * - feTurbulence：生成 Perlin 噪点纹理
 * - feDisplacementMap：基于噪点置换像素，模拟玻璃边缘折射
 * - 边缘区域折射强度高，中心区域强度为 0（保持内容清晰可读）
 *
 * 注意：此滤镜在 React Native 中通过 react-native-svg 的 Svg/Defs/Filter 实现
 * 性能开销较大，建议仅对关键 UI 元素启用
 */

import React from 'react';
import Svg, { Defs, Filter, FeTurbulence, FeDisplacementMap, FeMerge, FeMergeNode, FeGaussianBlur, FeColorMatrix } from 'react-native-svg';
import { EDGE_REFRACTION_CONFIG } from '../theme/glassTokens';

interface Props {
  /** 滤镜唯一 ID，用于在其他组件中引用 */
  filterId?: string;
  /** 噪点基础频率（越小越平滑），默认 0.04 */
  baseFrequency?: number;
  /** 噪点八度数，默认 3 */
  numOctaves?: number;
  /** 边缘位移强度（像素），默认 2.5 */
  edgeDisplacement?: number;
}

/**
 * 全局液态玻璃边缘折射滤镜
 *
 * 用法：
 *   1. 在根组件中放置 <LiquidGlassEdgeFilter filterId="glass-edge" />
 *   2. 在需要折射效果的 GlassView 上设置 enableEdgeRefraction={true}
 *   3. 或在任意 View 上使用：<View style={{ filter: 'url(#glass-edge)' }}>
 *
 * 注意：React Native 不原生支持 CSS filter: url()。
 * 如需边缘折射效果，请将内容放入 react-native-svg 的 <ForeignObject> 中，
 * 或使用 Image 组件的滤镜覆盖（性能优化方案）。
 */
export default function LiquidGlassEdgeFilter({
  filterId = 'liquid-glass-edge',
  baseFrequency = EDGE_REFRACTION_CONFIG.baseFrequency,
  numOctaves = EDGE_REFRACTION_CONFIG.numOctaves,
  edgeDisplacement = EDGE_REFRACTION_CONFIG.edgeDisplacement,
}: Props) {
  return (
    <Svg width={0} height={0} style={{ position: 'absolute' }}>
      <Defs>
        {/* ===== 液态玻璃边缘折射滤镜 ===== */}
        <Filter
          id={filterId}
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          filterUnits="objectBoundingBox"
        >
          {/* 1. 生成 Perlin 噪点纹理 */}
          <FeTurbulence
            type="fractalNoise"
            baseFrequency={baseFrequency}
            numOctaves={numOctaves}
            seed={EDGE_REFRACTION_CONFIG.seed}
            result="noise"
          />

          {/* 2. 对噪点做轻微模糊，使折射更自然 */}
          <FeGaussianBlur
            in="noise"
            stdDeviation={1.5}
            result="smoothNoise"
          />

          {/* 3. 基于噪点纹理置换 SourceGraphic 像素 */}
          {/*    xChannelSelector/yChannelSelector 控制置换方向 */}
          <FeDisplacementMap
            in="SourceGraphic"
            in2="smoothNoise"
            scale={edgeDisplacement}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          {/* 4. 合并结果 */}
          <FeMerge>
            <FeMergeNode in="displaced" />
            <FeMergeNode in="SourceGraphic" />
          </FeMerge>
        </Filter>

        {/* ===== 简化版：仅边缘微折射（性能优化版本） ===== */}
        <Filter
          id={`${filterId}-light`}
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <FeTurbulence
            type="fractalNoise"
            baseFrequency={0.06}
            numOctaves={2}
            seed={1}
            result="noise"
          />
          <FeDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={1.2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </Filter>

        {/* ===== 玻璃光泽叠加滤镜（模拟边缘内高光） ===== */}
        <Filter
          id={`${filterId}-gloss`}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          {/* 顶部高光 */}
          <FeColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.15 0
            "
            in="SourceGraphic"
            result="dimmed"
          />
        </Filter>
      </Defs>
    </Svg>
  );
}
