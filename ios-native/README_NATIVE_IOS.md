# MoneyTracker 原生 iOS 版

这是从 Expo / React Native 迁移出来的纯 SwiftUI 版本。

当前版本：`1.1.0`

## 技术栈

- SwiftUI
- SwiftData 本地持久化
- Charts 原生图表
- SwiftUI 文件导入 / 导出
- iOS URL Scheme：`moneytracker://add`
- iOS 26 Liquid Glass：使用系统 `glassEffect`，低版本回退到 `ultraThinMaterial`

## 打开方式

1. 在 macOS 上打开：

   ```bash
   open ios-native/MoneyTracker.xcodeproj
   ```

2. Xcode 顶部 Scheme 选择 `MoneyTracker`。
3. 选择一台 iPhone 或 iOS Simulator。
4. 点击 Run。

## 自动记账 URL 示例

```text
moneytracker://add?amount=28.5&merchant=星巴克&type=expense&payment=微信&note=拿铁
```

支持参数：

- `amount`：金额，必填，必须大于 0
- `merchant`：商家
- `type`：`expense` 或 `income`
- `payment`：`微信`、`支付宝`、`现金`、`银行卡`、`其他`
- `note`：备注
- `time`：ISO 8601 时间，可选

## 迁移说明

这个原生版本不再依赖 Metro、Expo Go、二维码扫码和 JavaScript 运行时。数据使用 SwiftData 存在 App 沙盒内，和旧 Expo SQLite 数据库不是同一个文件。

旧数据迁移流程：

1. 在旧 Expo 版中导出 MoneyTracker JSON。
2. 打开原生版 `设置 -> 数据迁移 -> 导入 JSON`。
3. 选择旧版导出的 JSON 文件。

导入时会按交易 ID 自动跳过重复记录。原生版也可以在 `设置 -> 数据迁移 -> 导出 JSON` 导出同格式备份，便于跨设备迁移。
