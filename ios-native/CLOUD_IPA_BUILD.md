# 没有 Mac 时如何构建 IPA

这个项目已经包含 GitHub Actions 云端构建工作流：

```text
.github/workflows/build-native-ios-ipa.yml
```

它会在 GitHub 的 macOS runner 上使用 Xcode 构建 `ios-native/MoneyTracker.xcodeproj`，并导出 `MoneyTracker.ipa`。

## 必须准备

你需要有可用的 Apple 签名材料：

- iOS Distribution / In-House 证书 `.p12`
- 对应 `com.aramco.cycomm` 的 `.mobileprovision`
- `.p12` 密码

> 注意：证书、描述文件和密码属于敏感信息。不要提交到 Git；请放进 GitHub Secrets。

## GitHub Secrets

在 GitHub 仓库进入：

```text
Settings → Secrets and variables → Actions → New repository secret
```

添加这些 Secrets：

```text
IOS_P12_BASE64
IOS_P12_PASSWORD
IOS_PROVISION_PROFILE_BASE64
IOS_KEYCHAIN_PASSWORD
```

`IOS_KEYCHAIN_PASSWORD` 可以自己设置一个临时强密码，例如一串随机字符。

## 在 Windows 上生成 base64

在项目根目录运行 PowerShell：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Set-Content ios_p12_base64.txt
[Convert]::ToBase64String([IO.File]::ReadAllBytes("profile.mobileprovision")) | Set-Content ios_profile_base64.txt
```

然后分别把文件内容粘贴到：

- `ios_p12_base64.txt` → `IOS_P12_BASE64`
- `ios_profile_base64.txt` → `IOS_PROVISION_PROFILE_BASE64`

## 开始构建

把代码推到 GitHub 后：

1. 打开 GitHub 仓库。
2. 进入 `Actions`。
3. 选择 `Build Native iOS IPA`。
4. 点击 `Run workflow`。
5. 构建完成后，在页面底部 `Artifacts` 下载 `MoneyTracker-IPA`。

## 如何安装到 iPhone

取决于你的签名类型：

- Enterprise / In-House：可以通过 MDM，或把 IPA 和 manifest plist 放到 HTTPS 服务器后用 `itms-services://` 安装。首次打开时可能需要在 iPhone 设置里信任企业开发者。
- Ad Hoc：只有描述文件里包含 UDID 的设备能安装。
- App Store / TestFlight：需要上传 App Store Connect，不是直接分发 IPA。

如果你只是自己测试，最稳的是 Ad Hoc 或 Development 签名；如果你确实是公司内部 App，才使用 Enterprise / In-House。
