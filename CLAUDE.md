# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 技术栈

- **Expo SDK 54**（managed workflow），React Native 0.81.5，React 19.1.0，TypeScript 5.3+
- **expo-sqlite**（SDK 54 新版异步 API）本地存储
- **React Navigation 6**（bottom tabs）
- **PapaParse**（CSV 解析）、**react-native-chart-kit**（图表）
- 目标平台：iOS（企业证书分发）+ Android

## 常用命令

```bash
npm install              # 安装依赖（需 .npmrc 中的 legacy-peer-deps=true）
npx expo start           # 启动 Expo 开发服务器
npx tsc --noEmit         # TypeScript 类型检查
npx eas build --platform android --profile preview     # Android APK 构建
npx eas build --platform ios --profile simulator       # iOS 模拟器构建（无需证书）
npx eas build --platform ios --profile preview         # iOS IPA 构建（需企业证书）
npx expo prebuild --platform ios                       # 生成 ios/ 原生项目（需 macOS）
```

## 整体架构

```
App.tsx                      入口：初始化 DB、监听 URL Scheme (moneytracker://add)
├── AppNavigator.tsx          底部三 Tab 导航（账单/统计/设置）
├── src/database/database.ts  SQLite CRUD + 统计查询（唯一的数据层）
├── src/screens/
│   ├── TransactionsScreen   首页：交易列表、月份筛选、CSV/JSON 导入
│   ├── StatisticsScreen     收支饼图、月度趋势柱状图、分类排行榜
│   └── SettingsScreen       导出 JSON/DB、清理数据、URL Scheme 说明
├── src/components/          可复用 UI（TransactionItem、TransactionForm 等）
├── src/theme/
│   ├── designSystem.ts      语义色板（Light/Darkcolors）、字体层级、间距/圆角
│   ├── glassStyles.ts       液态玻璃样式预设（createGlassStyles(isDark)）
│   └── glassTokens.ts       玻璃模糊/透明度/阴影/边框参数
├── src/utils/
│   ├── csvParser.ts         Papaparse 解析微信/支付宝 CSV
│   ├── exportImport.ts      JSON 导入导出 + 去重
│   └── hash.ts              UUID v4 生成交易唯一编号
└── src/types/index.ts       核心类型：Transaction、NewTransaction、MonthlySummary 等
```

**数据流**：所有数据操作经过 `database.ts` → SQLite。没有网络层、没有 Redux/Context。各 Screen 通过直接调用 database 函数获取数据。

## SDK 54 关键适配（修改时务必注意）

1. **`expo-file-system`**：SDK 54 主模块已弃用旧 API，必须从 `expo-file-system/legacy` 导入 `documentDirectory`、`EncodingType`、`readAsStringAsync` 等。当前 `TransactionsScreen.tsx`、`SettingsScreen.tsx`、`exportImport.ts` 已完成迁移。
2. **PapaParse**：v5 类型定义要求 `worker: false` 才能返回 `ParseResult<T>` 类型（否则返回 `void`）。`csvParser.ts:178` 已修复。
3. **`as const` + 联合类型**：`LightColors` 和 `DarkColors` 都使用了 `as const`，它们的字面量类型互不兼容。`SemanticColors` 必须使用联合类型 `typeof LightColors | typeof DarkColors`，不能用单一 `typeof`。

## iOS 构建与证书

- **Bundle ID**：`com.aramco.cycomm`（app.json）
- **Team ID**：`4TDEWHFV5T`（Aramco Services Company）
- **证书类型**：企业版 IN_HOUSE（不限设备安装）
- 本地证书文件（gitignored）：`certificate.p12`（密码 `iosxb.cn`）、`profile.mobileprovision`、`credentials.json`
- `eas.json` 中 `preview` profile 使用 `credentialsSource: "local"`，但 EAS 云端对企业证书存在兼容性问题（多次尝试失败）。Simulator 构建验证了代码可正常编译。
- **Mac 原生构建**：需在 macOS 上 clone 项目 → `npm install` → `npx expo prebuild --platform ios` → 双击证书导入钥匙串 → Xcode Archive → 导出 IPA。详见 `BUILD_MAC.md`。
- `.easignore` 故意不排除 `*.p12`/`*.mobileprovision`/`credentials.json`，以确保 EAS 能上传证书文件。

## 设计系统约定

- **禁止硬编码灰色**：所有文字色、背景色、分隔线色必须走 `getSemanticColors(isDark)` 或 `useSemanticColors()` hook。
- **液态玻璃**：卡片/按钮/导航栏使用 `createGlassStyles(isDark)` 生成预设样式对象（`liquidGlass`、`liquidGlassPill`、`liquidGlassNav` 等）。
- **深色模式**：深度集成，所有语义色在 `designSystem.ts` 中有独立的 Dark 色值。深色下用边框替代阴影。
- **WCAG AA 对比度**：所有文字色对比度 ≥ 4.5:1。
- **触控区域**：最小 44pt（`Spacing.minTouchTarget`）。

## 数据库设计

- 单表 `transactions`，以 UUID v4 为 PRIMARY KEY。
- `INSERT OR IGNORE` 实现去重（导入时自动跳过已存在的 ID）。
- 月份筛选使用 `strftime('%Y-%m', transaction_date)`。
- WAL 模式已启用（`PRAGMA journal_mode = WAL`）。
- `addTransactionsBatch` 逐条插入（非事务），因为在 Expo SQLite 中进行批处理已经很高效。

## CSV 导入流程

1. `DocumentPicker.getDocumentAsync` 选择文件
2. `FileSystem.readAsStringAsync(file.uri, { encoding: EncodingType.UTF8 })` 读取内容（GBK 编码需用户另存为 UTF-8）
3. `parseCSV(text)` 自动检测微信/支付宝格式（按表头特征判断）
4. 逐行解析 → 生成 UUID → `addTransactionsBatch` 批量插入（`INSERT OR IGNORE` 自动去重）
5. 商家分类通过 `guessCategory()` 智能推断（关键词匹配）
