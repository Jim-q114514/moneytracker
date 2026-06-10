# MoneyTracker - 智能记账软件

MoneyTracker 是一个 iOS 本地记账项目。当前主推版本是 **SwiftUI 原生 iOS 版**，旧版 Expo / React Native 代码仍保留在仓库中，方便继续参考和迁移功能。

## 当前版本

| 项目 | 说明 |
|------|------|
| 当前版本 | `1.1.0` |
| 主推客户端 | SwiftUI 原生 iOS |
| 原生工程 | `ios-native/MoneyTracker.xcodeproj` |
| 旧版架构 | Expo / React Native |
| 数据存储 | SwiftData / 本地存储 |
| 自动记账 | `moneytracker://add` URL Scheme |

## 功能特性

### Swift 原生 iOS 版

- 手动新增、编辑、删除交易记录
- 支持收入 / 支出、分类、商家、备注、支付方式、交易时间
- 月度收入、支出、结余汇总
- 支出分类占比图、分类排行榜
- 近 6 个月收支趋势
- 支持深色 / 浅色模式
- 支持 `moneytracker://add` 自动记账
- 支持 MoneyTracker JSON 导入 / 导出
- 100% 本地存储，不上传服务器

### Expo 旧版仍保留

旧版位于项目根目录和 `src/` 中，主要功能包括：

- Expo / React Native 页面和导航
- SQLite 数据库操作
- 微信 / 支付宝 CSV 解析
- MoneyTracker JSON 导入 / 导出
- Expo 文件选择、分享、URL Scheme 处理

后续如果继续完善原生版，建议优先把旧版 CSV 导入能力迁移到 Swift。

## 快速运行原生 iOS 版

需要 macOS 和 Xcode。

```bash
git clone https://github.com/Jim-q114514/moneytracker.git
cd moneytracker
open ios-native/MoneyTracker.xcodeproj
```

在 Xcode 中：

1. 选择 Scheme：`MoneyTracker`
2. 选择 iPhone Simulator 或真机
3. 点击 Run

如果要真机运行或导出 IPA，需要配置 Apple Developer 签名。详细说明见：

```text
BUILD_MAC.md
ios-native/CLOUD_IPA_BUILD.md
```

## 没有 Mac 时如何构建 IPA

仓库包含 GitHub Actions 工作流：

```text
.github/workflows/build-native-ios-ipa.yml
```

你需要在 GitHub Actions Secrets 中配置：

```text
IOS_P12_BASE64
IOS_P12_PASSWORD
IOS_PROVISION_PROFILE_BASE64
IOS_KEYCHAIN_PASSWORD
```

然后在 GitHub 仓库的 `Actions` 页面手动运行 `Build Native iOS IPA`。

## GitHub Actions 构建验证

仓库还包含一个无签名构建验证流程：

```text
.github/workflows/validate-native-ios.yml
```

它会在 PR 和相关分支推送时自动运行：

- 选择 GitHub 的 macOS runner
- 打印 Xcode 版本和工程 Scheme
- 使用 `xcodebuild build` 编译 `ios-native/MoneyTracker.xcodeproj`
- 设置 `CODE_SIGNING_ALLOWED=NO`，所以不需要证书或描述文件

这个流程用于验证“代码能不能编译”。真正导出 IPA 仍然使用 `Build Native iOS IPA`，因为 IPA 需要 Apple 签名材料。

## 旧 Expo 数据迁移到原生版

因为原生版使用 SwiftData，旧 Expo 版使用 SQLite，两个数据库文件不能直接互换。推荐使用 JSON 中转：

### 从旧版导出

1. 打开旧 Expo 版 MoneyTracker。
2. 在设置或导出入口中导出 MoneyTracker JSON。
3. 将 JSON 文件通过隔空投送、文件 App 或其他方式传到新 App 可访问的位置。

### 导入到原生版

1. 打开 Swift 原生版。
2. 进入 `设置 -> 数据迁移 -> 导入 JSON`。
3. 选择旧版导出的 JSON 文件。

导入时会按交易 ID 自动跳过重复记录，不会反复导入同一笔账单。

原生版也支持 `设置 -> 数据迁移 -> 导出 JSON`，可用于备份或跨设备迁移。

## URL Scheme 自动记账

格式：

```text
moneytracker://add?amount=金额&merchant=商家&payment=支付方式&note=备注&type=expense|income&time=ISO日期
```

参数说明：

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `amount` | 是 | 金额，必须大于 0 | `28.50` |
| `merchant` | 否 | 商家或交易对方 | `星巴克` |
| `payment` | 否 | 支付方式 | `微信`、`支付宝`、`现金`、`银行卡` |
| `note` | 否 | 备注 | `拿铁` |
| `type` | 否 | `expense` 或 `income`，默认支出 | `expense` |
| `time` | 否 | ISO 8601 时间 | `2026-06-10T10:30:00Z` |

示例：

```text
moneytracker://add?amount=28.50&merchant=星巴克&payment=微信&type=expense
moneytracker://add?amount=2000&merchant=工资&payment=银行卡&type=income&note=6月工资
```

## 项目结构

```text
MoneyTracker/
├── ios-native/                         # SwiftUI 原生 iOS 版
│   ├── MoneyTracker.xcodeproj
│   └── MoneyTracker/
│       ├── Data/                       # SwiftData 查询、URL 解析、JSON 迁移
│       ├── Design/                     # 原生视觉样式
│       ├── Models/                     # 交易模型
│       └── Views/                      # 账单、统计、设置等页面
├── src/                                # Expo 旧版源码
│   ├── components/
│   ├── database/
│   ├── navigation/
│   ├── screens/
│   ├── theme/
│   ├── types/
│   └── utils/
├── .github/workflows/                  # GitHub Actions 构建流程
├── App.tsx                             # Expo 旧版入口
├── package.json                        # Expo 旧版依赖和版本号
├── BUILD_MAC.md                        # Mac 本地构建说明
├── CHANGELOG.md                        # 更新日志
└── README.md
```

## 技术栈

| 模块 | 技术 |
|------|------|
| 原生 iOS | SwiftUI |
| 原生数据 | SwiftData |
| 原生图表 | Charts |
| 原生文件迁移 | SwiftUI FileImporter / FileExporter |
| 自动记账 | URL Scheme |
| 旧版客户端 | Expo SDK 54 / React Native |
| 旧版数据库 | expo-sqlite |
| 旧版 CSV 解析 | PapaParse |

## 版本记录

详细更新内容见：

```text
CHANGELOG.md
```

## License

MIT License

## 作者

**Jim（瑾墨）** - 一名正在学习编程的高中生。
