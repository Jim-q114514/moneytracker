# MoneyTracker 原生 iOS 版

这是从 Expo / React Native 迁移出来的纯 SwiftUI 版本。

## 技术栈

- SwiftUI
- SwiftData 本地持久化
- Charts 原生图表
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

这个原生版本不再依赖 Metro、Expo Go、二维码扫码和 JavaScript 运行时。数据使用 SwiftData 存在 App 沙盒内，和旧 Expo SQLite 数据库不是同一个文件；后续如果需要迁移旧数据，建议从旧版导出 JSON，再给原生版补一个 JSON 导入入口。
