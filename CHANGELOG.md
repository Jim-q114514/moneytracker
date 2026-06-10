# 更新日志

## 1.1.0 - 2026-06-10

### 新增

- 新增纯 SwiftUI 原生 iOS 工程：`ios-native/MoneyTracker.xcodeproj`。
- 原生版使用 SwiftData 本地保存交易数据，去掉 Expo/Metro/JavaScript 运行时依赖。
- 原生版支持账单列表、新增、编辑、删除、月度汇总、分类统计、近 6 个月趋势图。
- 原生版支持 `moneytracker://add` URL Scheme，可继续配合 iOS 快捷指令自动记账。
- 新增原生版 JSON 导入/导出能力，可导入旧 Expo 版导出的 MoneyTracker JSON。
- 新增 GitHub Actions 原生 iOS IPA 构建流程：`.github/workflows/build-native-ios-ipa.yml`。
- 新增 GitHub Actions 原生 iOS 无签名构建验证流程：`.github/workflows/validate-native-ios.yml`。

### 优化

- README 改为以 Swift 原生 iOS 版为主线，同时保留 Expo 旧版说明。
- Mac 构建文档改为直接打开 `ios-native/MoneyTracker.xcodeproj`，不再要求 `expo prebuild`。
- 设置页新增“数据迁移”区域，导入时会按交易 ID 自动跳过重复记录。
- 版本号统一升级到 `1.1.0`。

### 注意

- 原生版使用 SwiftData，和旧 Expo SQLite 数据库不是同一个存储文件。
- 旧数据迁移推荐流程：先在 Expo 旧版导出 JSON，再在原生版设置页导入 JSON。
- CSV 导入目前仍只在 Expo 旧版中完整实现，原生版后续可以继续补齐。
- 本次变更在 Windows 环境完成，无法本地运行 Xcode 编译；需要在 macOS/Xcode 或 GitHub Actions 中验证 iOS 构建。
