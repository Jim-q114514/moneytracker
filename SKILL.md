---
name: moneytracker
description: |
  MoneyTracker 智能记账应用开发助手。基于 React Native (Expo SDK 54) 的 iOS 本地记账应用，
  支持手动记账、Siri 快捷指令自动记账、微信/支付宝账单 CSV 导入、JSON 跨设备同步、
  月度统计图表等功能。触发词：记账、MoneyTracker、React Native、Expo、SQLite。
---

# MoneyTracker - 智能记账软件开发助手

## 项目概述

MoneyTracker 是一款基于 **React Native (Expo SDK 54)** 的 iOS 本地记账应用。所有数据通过 **expo-sqlite** 存储在设备本地，100% 本地存储，不上传任何服务器。

### 核心功能
- 📝 **手动记账**：金额、分类、商家、备注、支付方式
- ⚡ **自动记账**：通过 URL Scheme (`moneytracker://add`) 配合 Siri 快捷指令实现
- 📥 **账单导入**：微信 CSV、支付宝 CSV、MoneyTracker JSON
- 📤 **数据导出**：JSON 导出、数据库文件导出、隔空投送分享
- 📊 **统计分析**：月度收支汇总、分类饼图、趋势柱状图、分类排行榜
- 🎨 **设计**：iOS 原生风格，深色/浅色模式自适应，液态玻璃效果
- 🔒 **隐私**：100% 本地存储

### 技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Expo SDK | ~54.0.0 | 跨平台开发框架 |
| React Native | 0.81.5 | UI 框架 |
| TypeScript | ^5.3.0 | 类型安全 |
| expo-sqlite | ~16.0.10 | 本地数据库（异步 API） |
| expo-blur | ~56.0.3 | 液态玻璃效果 |
| React Navigation | ^6.5.11 | 底部标签导航 |
| react-native-chart-kit | ^6.12.0 | 统计图表 |
| PapaParse | ^5.4.1 | CSV 解析 |
| expo-document-picker | ~14.0.8 | 文件选择 |
| expo-file-system | ~19.0.23 | 文件读写 |
| expo-sharing | ~14.0.8 | 文件分享 |
| expo-linking | ~8.0.12 | URL Scheme 处理 |

## 项目结构

```
MoneyTracker/
├── App.tsx                        # 入口文件（URL Scheme 监听）
├── app.json                       # Expo 配置（userInterfaceStyle: automatic）
├── package.json                   # 依赖管理
├── tsconfig.json                  # TypeScript 配置
├── babel.config.js                # Babel 配置
├── README.md                      # 项目文档
├── SKILL.md                       # 本文件 - AI 开发指南
├── assets/                        # 静态资源（图标、启动画面）
└── src/
    ├── types/
    │   └── index.ts               # 所有 TypeScript 类型定义
    ├── database/
    │   └── database.ts            # SQLite 数据库操作层（异步 API）
    ├── theme/
    │   ├── designSystem.ts        # 统一设计系统（语义色、字体、间距、圆角）
    │   └── glassStyles.ts         # 液态玻璃样式工厂（深色/浅色自适应）
    ├── utils/
    │   ├── hash.ts                # SHA256 唯一编号生成
    │   ├── csvParser.ts           # CSV 解析器（微信/支付宝格式）
    │   └── exportImport.ts        # JSON 导出/导入
    ├── screens/
    │   ├── TransactionsScreen.tsx # 账单列表页（首页，含 FAB 按钮）
    │   ├── StatisticsScreen.tsx   # 统计图表页（饼图+柱状图+排行榜）
    │   └── SettingsScreen.tsx     # 设置页（导出/导入/关于）
    ├── components/
    │   ├── TransactionItem.tsx    # 交易列表项组件
    │   ├── TransactionForm.tsx    # 新增/编辑交易表单（全屏弹窗）
    │   ├── ImportResultModal.tsx  # 导入结果弹窗
    │   └── MonthPicker.tsx        # 月份选择器（水平滚动 Chip）
    └── navigation/
        └── AppNavigator.tsx       # 底部标签导航配置
```

## 数据库架构

### 表：transactions
```sql
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,               -- SHA256 生成的唯一编号
  amount REAL NOT NULL,              -- 金额
  type TEXT NOT NULL,                -- 'income' | 'expense'
  category TEXT NOT NULL,            -- 分类名称
  merchant TEXT DEFAULT '手动',      -- 商家/交易对方
  note TEXT DEFAULT '',              -- 备注
  payment_method TEXT DEFAULT '微信',-- 支付方式
  transaction_date TEXT NOT NULL,    -- ISO 日期字符串
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 关键数据库函数（expo-sqlite 异步 API）
- `initDatabase()` — 初始化数据库和表
- `getTransactions(month)` — 按月查询交易列表（时间倒序）
- `getMonthlySummary(month)` — 月度收支汇总
- `getAvailableMonths()` — 获取有数据的月份列表
- `addTransaction(txn)` / `updateTransaction(txn)` / `deleteTransaction(id)`
- `addTransactionsBatch(txns)` — 批量插入（导入时使用，带去重）

## 设计系统

### 语义色板（designSystem.ts）
所有颜色通过 `getSemanticColors(isDark: boolean)` 获取，禁止直接硬编码颜色值。

```typescript
// 使用方式
import { getSemanticColors } from '../theme/designSystem';

const colorScheme = useColorScheme();
const isDark = colorScheme === 'dark';
const colors = getSemanticColors(isDark);

// 然后用 colors.xxx 替代硬编码颜色
<Text style={{ color: colors.label }}>主文字</Text>
<Text style={{ color: colors.secondaryLabel }}>辅助文字</Text>
<Text style={{ color: colors.income }}>收入金额</Text>
<Text style={{ color: colors.expense }}>支出金额</Text>
```

### 核心语义色
| 颜色名 | 浅色模式 | 深色模式 | 用途 |
|--------|---------|---------|------|
| `label` | #1C1C1E | #FFFFFF | 主文字（对比度 ≥ 18:1） |
| `secondaryLabel` | #515154 | #D1D1D6 | 辅助文字（≥ 7.9:1） |
| `tertiaryLabel` | #787880 | #98989D | 三级文字（≥ 4.6:1） |
| `income` | #34C759 | #30D158 | 收入/正数 |
| `expense` | #FF3B30 | #FF453A | 支出/负数 |
| `accent` | #007AFF | #0A84FF | 强调色/链接 |
| `destructive` | #FF3B30 | #FF453A | 危险操作 |
| `separator` | #E5E5EA | #38383A | 分隔线 |

### 布局规范
- 卡片圆角：16pt
- 按钮圆角：12pt
- Chip 圆角：10pt
- 外边距：16pt
- 内边距：12pt
- 触控目标：≥ 44pt（Apple HIG）

### 液态玻璃样式（glassStyles.ts）
```typescript
import { createGlassStyles } from '../theme/glassStyles';
const glass = createGlassStyles(isDark);
// 变体：glass.liquidGlass, glass.liquidGlassElevated,
//        glass.liquidGlassChip, glass.liquidGlassChipSelected,
//        glass.liquidGlassNav, glass.liquidGlassPill, glass.liquidGlassInput
```

深色模式下自动取消阴影，改用边框替代。

## 编码规范

### 动态颜色模式
```typescript
// ✅ 正确：inline style 覆盖 StyleSheet 静态默认值
<Text style={[styles.foo, { color: colors.label }]}>文字</Text>

// ❌ 错误：StyleSheet.create 内直接放硬编码颜色
// StyleSheet.create({ foo: { color: '#1C1C1E' } })  // 不跟随深色模式
```

### 组件模式
- 函数组件 + Hooks
- `useColorScheme()` 在组件顶层调用
- `getSemanticColors(isDark)` 和 `createGlassStyles(isDark)` 在 render 中调用
- 表单使用 `Modal` + `presentationStyle="formSheet"`
- 弹窗使用 `Modal` + `transparent` + `animationType="fade"`
- 按钮按下反馈使用 `Animated.spring`（scale 0.93~0.97）

### 导航结构
- `@react-navigation/bottom-tabs` 底部三标签：账单 / 统计 / 设置
- 主题跟随系统（`DefaultTheme` / `DarkTheme` 自定义）
- 标签栏使用 Ionicons 图标（filled/outline 切换）

## 开发命令

```bash
# 安装依赖
npm install

# 启动 Expo 开发服务器
npx expo start

# iOS 模拟器
npx expo start --ios

# 类型检查
npx tsc --noEmit
```

## Rule: 回答原则

1. **用简体中文回复**，代码注释也用中文
2. **循序渐进**，适合高中编程学习者理解
3. **代码示例完整可运行**，不省略关键 import 和上下文
4. **修改前先读取文件**，确保理解最新代码状态
5. **遵循现有代码风格**：函数组件、inline style 覆盖、语义色
6. **深色模式必须支持**，所有新颜色通过 `getSemanticColors()` 获取

## Rule: 新增功能清单

当用户要求新增功能时，按以下优先级处理：
1. 创建/修改类型定义（`src/types/index.ts`）
2. 实现数据库操作（`src/database/database.ts`）
3. 实现 UI 组件（`src/components/` 或 `src/screens/`）
4. 注册导航/路由（如需要）
5. 更新设计系统常量（如需要新颜色）
6. 深色模式适配（所有颜色走语义色）
