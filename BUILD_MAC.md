# MoneyTracker 原生 iOS 构建指南（Mac）

本项目已经包含纯 SwiftUI 原生工程：

```text
ios-native/MoneyTracker.xcodeproj
```

如果你要构建 Swift 原生版，不需要再运行 `npx expo prebuild`。Expo 代码仍保留在仓库中，主要用于参考旧功能和数据格式。

## 环境要求

- macOS
- Xcode 16 或更新版本
- Git
- 可用的 Apple Developer 签名材料

项目当前配置：

| 项目 | 值 |
|------|-----|
| Xcode 工程 | `ios-native/MoneyTracker.xcodeproj` |
| Scheme | `MoneyTracker` |
| Bundle ID | `com.aramco.cycomm` |
| Team ID | `4TDEWHFV5T` |
| 最低 iOS | `18.0` |
| 技术栈 | SwiftUI + SwiftData + Charts |

## 本地调试运行

```bash
git clone https://github.com/Jim-q114514/moneytracker.git
cd moneytracker
open ios-native/MoneyTracker.xcodeproj
```

在 Xcode 中：

1. 选择 Scheme：`MoneyTracker`
2. 选择 iPhone Simulator 或真机
3. 如使用真机，进入 Target 的 `Signing & Capabilities` 检查 Team 和 Bundle ID
4. 点击 Run

## 本地 Archive 导出 IPA

如果你有 `.p12` 证书和 `.mobileprovision` 描述文件：

1. 双击或用 `security import` 导入 `.p12` 到钥匙串。
2. 双击 `.mobileprovision` 安装描述文件。
3. 打开 `ios-native/MoneyTracker.xcodeproj`。
4. 选择 `Product -> Archive`。
5. Archive 成功后在 Organizer 中选择 `Distribute App`。
6. 根据签名类型选择 `Ad Hoc`、`Enterprise`、`Development` 或 `App Store Connect`。

不要把证书、描述文件、证书密码写进仓库。密码应只保存在本地密码管理器或 GitHub Secrets 中。

## 没有 Mac 时

仓库已经包含 GitHub Actions 云端构建流程：

```text
.github/workflows/build-native-ios-ipa.yml
```

详细步骤见：

```text
ios-native/CLOUD_IPA_BUILD.md
```

你需要在 GitHub Actions Secrets 中配置：

```text
IOS_P12_BASE64
IOS_P12_PASSWORD
IOS_PROVISION_PROFILE_BASE64
IOS_KEYCHAIN_PASSWORD
```

## 常见问题

**`xcodebuild: command not found`**

说明当前不是 macOS/Xcode 环境。Windows 上无法直接用 Xcode 编译 iOS App，请使用 Mac 或 GitHub Actions。

**`No signing certificate found`**

说明 `.p12` 没有正确导入钥匙串，或证书和描述文件不匹配。

**`Provisioning profile doesn't include the application identifier`**

说明描述文件对应的 Bundle ID 和项目里的 `com.aramco.cycomm` 不一致。

**旧 Expo 数据如何迁移？**

先在旧 Expo 版导出 MoneyTracker JSON，再在原生版 `设置 -> 数据迁移 -> 导入 JSON` 中导入。原生版会按交易 ID 自动跳过重复记录。
