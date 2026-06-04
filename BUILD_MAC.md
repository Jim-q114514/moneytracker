# MoneyTracker iOS .ipa 构建指南（Mac）

## 📋 准备工作

### 1. 需要从 Windows 传到 Mac 的文件

以下文件**不在 GitHub 上**（已通过 .gitignore 排除），需要单独复制到 Mac：

| 文件 | 用途 | 密码 |
|------|------|------|
| `certificate.p12`（或 `certificate_legacy.p12`）| 企业分发证书 | `iosxb.cn` |
| `profile.mobileprovision` | 企业描述文件 | — |

> 💡 放在项目根目录即可

### 2. Mac 上需要安装

- **Node.js** (v18+) — https://nodejs.org
- **Xcode** (最新版) — App Store 下载
- **Git** — Mac 自带，或 `xcode-select --install`

---

## 🔨 构建步骤

### 第 1 步：克隆项目

```bash
git clone https://github.com/Jim-q114514/moneytracker.git
cd moneytracker
npm install
```

### 第 2 步：安装证书

```bash
# 导入 .p12 证书到钥匙串（需要输入密码 iosxb.cn）
security import certificate.p12 -P iosxb.cn -T /usr/bin/codesign

# 安装描述文件
open profile.mobileprovision
# 或将描述文件复制到 Xcode 目录
cp profile.mobileprovision ~/Library/MobileDevice/Provisioning\ Profiles/
```

或者手动操作：
- 双击 `certificate.p12` → 输入密码 `iosxb.cn` → 导入到"登录"钥匙串
- 双击 `profile.mobileprovision` → 自动安装到 Xcode

### 第 3 步：生成 iOS 原生项目

```bash
npx expo prebuild --platform ios
```

这会生成 `ios/` 目录，包含 Xcode 项目文件。

### 第 4 步：在 Xcode 中配置签名

```bash
open ios/moneytracker.xcworkspace
```

然后在 Xcode 中：
1. 左侧选择 **moneytracker** 项目
2. 选择 **Targets → moneytracker**
3. **Signing & Capabilities** 标签页
4. 取消勾选 "Automatically manage signing"
5. **Provisioning Profile** 下拉选择 `CycommGroupAppProfile`
6. **Signing Certificate** 选择 `iPhone Distribution: Aramco Services Company`

### 第 5 步：Archive（归档）并导出 .ipa

1. Xcode 顶部菜单：**Product → Archive**
2. 等待编译完成（约 5-10 分钟）
3. 在弹出的 Organizer 窗口中：
   - 选中刚生成的 Archive
   - 点击 **Distribute App**
   - 选择 **Enterprise** → Next
   - 选择 **Automatically manage signing** → Next
   - 点击 **Export**，选择保存位置
4. 得到 `moneytracker.ipa` 文件 🎉

---

## 📦 项目信息速查

| 项目 | 值 |
|------|-----|
| Bundle ID | `com.aramco.cycomm` |
| Team ID | `4TDEWHFV5T` |
| 显示名称 | MoneyTracker |
| 版本号 | 1.0.0 (Build 1) |
| 最低 iOS | 15.1 |
| 证书名称 | iPhone Distribution: Aramco Services Company |
| 证书密码 | `iosxb.cn` |
| 描述文件 | CycommGroupAppProfile (IN_HOUSE) |
| 证书过期 | 2026年9月24日 |

---

## ❓ 常见问题

**Q: "XXX is not in your keychain"**
→ 确保已双击 .p12 导入证书，密码是 `iosxb.cn`

**Q: "Provisioning profile not found"**
→ 确保 .mobileprovision 已双击安装，Team ID 显示为 4TDEWHFV5T

**Q: "No signing certificate found"**
→ 在 Xcode → Settings → Accounts 中检查是否有 Aramco Services Company 的证书

**Q: prebuild 失败**
→ 确保 Node.js 版本 ≥ 18，运行 `node -v` 检查；然后 `npx expo prebuild --platform ios --clean`
