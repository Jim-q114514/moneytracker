# MoneyTracker - 智能记账软件

一款基于 React Native (Expo) 的 iOS 本地记账应用，支持手动记账、自动记账（Siri 快捷指令集成）、微信/支付宝账单导入、跨设备数据同步等功能。

## ✨ 功能特性

### 📝 手动记账
- 输入金额、分类（可自定义）、商家、备注、支付方式
- 支持收入和支出快速切换
- 分类智能推荐（根据商家名称自动推断分类）

### ⚡ 自动记账（Siri 快捷指令）
- 注册自定义 URL Scheme：`moneytracker://add`
- 当收到微信/支付宝支付通知时，快捷指令自动提取信息并调用 URL 添加交易
- 支持通过快捷指令 App 设置自动化流程

### 📥 账单导入
- **微信账单 CSV**：自动识别 UTF-8/GBK 编码
- **支付宝账单 CSV**：识别常见格式
- **MoneyTracker JSON**：支持跨设备导入（如隔空投送）

### 📤 数据导出
- 导出为 JSON 格式（保留完整交易信息）
- 导出数据库文件（完整备份）
- 支持隔空投送分享

### 🔐 重复检测
- 每笔交易使用 SHA256 哈希生成唯一 16 位编号
- 编号规则：`日期 + 金额 + 商家 + 支付方式`
- 导入时自动跳过已有记录

### 📊 统计分析
- 月度收支汇总卡片
- 消费分类饼图
- 近 6 个月收支趋势柱状图
- 分类排行榜

### 🎨 设计
- 遵循 iOS 设计规范
- 支持深色/浅色模式（跟随系统）
- 卡片式布局、半透明效果
- 适合 iPhone 和 iPad

### 🔒 隐私
- **100% 本地存储**，数据不上传任何服务器
- 使用 SQLite 存储在设备本地

---

## 🚀 快速开始

### 环境要求
- Node.js 18+
- iOS 设备或模拟器
- Expo Go App（在 App Store 下载）

### 安装和运行

```bash
# 1. 进入项目目录
cd MoneyTracker

# 2. 安装依赖
npm install

# 3. 启动 Expo 开发服务器
npx expo start
```

启动后，使用 iPhone/iPad 上的 **Expo Go** App 扫描二维码即可预览。

---

## 🔗 URL Scheme 自动记账

### 格式

```
moneytracker://add?amount=金额&merchant=商家&payment=支付方式&note=备注&type=expense|income&time=ISO日期(可选)
```

### 参数说明

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `amount` | ✅ 是 | 金额（正数） | `28.50` |
| `merchant` | 否 | 商家名称 | `星巴克` |
| `payment` | 否 | 支付方式 | `微信`、`支付宝`、`现金` |
| `note` | 否 | 备注 | `拿铁+三明治` |
| `type` | 否 | 类型，默认 `expense` | `expense` 或 `income` |
| `time` | 否 | 交易时间 ISO 格式 | `2024-01-15T10:30:00` |

### 示例

```
moneytracker://add?amount=28.50&merchant=星巴克&payment=微信&type=expense
moneytracker://add?amount=2000&merchant=工资&payment=银行卡&type=income&note=1月工资
```

---

## 📱 设置 Siri 快捷指令自动记账

### 步骤 1：创建快捷指令

1. 打开 iOS 系统自带的 **「快捷指令」** App
2. 点击底部 **「自动化」** 标签
3. 点击右上角 **「+」** 创建新的自动化
4. 选择 **「收到信息」** 作为触发条件

### 步骤 2：设置触发条件

- **发件人**：选择「微信支付」或「支付宝」
- **内容包含**：可留空（匹配所有支付通知）

### 步骤 3：添加操作

1. 点击 **「添加操作」**
2. 搜索并选择 **「从输入中获取文本」**
3. 再添加 **「匹配文本」** 操作，使用正则表达式提取金额和商家：

```
匹配金额：金额¥?(\d+\.?\d*)
匹配商家：在(.+?)消费|支付给(.+?)
```

4. 添加 **「设定变量」** 保存提取到的值
5. 添加 **「打开 URL」** 操作，输入：

```
moneytracker://add?amount=变量金额&merchant=变量商家&payment=微信&type=expense
```

### 步骤 4：完成

- 关闭 **「运行前询问」** 开关（实现全自动）
- 点击 **「完成」** 保存

之后每当收到微信/支付宝支付通知，就会自动记录一笔交易到 MoneyTracker！

> 💡 **提示**：支付宝的支付通知格式与微信不同，需要创建两条自动化规则，分别匹配两种格式。

---

## 📊 CSV 导入指南

### 微信账单 CSV

微信导出的账单格式如下（第一行为表头）：

```
交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注
2024-01-15 10:30:00,商户消费,星巴克,拿铁咖啡,支出,28.50,零钱通,支付成功,1000100200300400500,, 
```

导入步骤：
1. 微信 → 我 → 支付 → 钱包 → 账单 → 右上角「常见问题」→ 「下载账单」→ 「用于个人对账」
2. 解压邮件附件中的 CSV 文件
3. 在 MoneyTracker 账单页点击右上角「导入」→「微信/支付宝 CSV」
4. 选择 CSV 文件即可

### 支付宝账单 CSV

支付宝导出格式：

```
交易时间,交易对方,商品,收/支,金额,交易状态,交易订单号,商家订单号,备注
2024-01-15 10:30:00,星巴克,拿铁咖啡,支出,28.50,交易成功,20240115XXXXXXXX,,
```

导入步骤类似，在支付宝 App 中导出账单后选择对应的 CSV 文件即可。

---

## 🔄 跨设备同步（iPhone ↔ iPad）

由于 MoneyTracker 采用 100% 本地存储，跨设备同步通过以下方式实现：

### 导出（设备 A）
1. 进入「设置」→「导出为 JSON」
2. 通过隔空投送发送到设备 B

### 导入（设备 B）
1. 接收隔空投送的文件
2. 在 MoneyTracker 账单页点击「导入」→「MoneyTracker JSON」
3. 选择刚接收的 JSON 文件

应用会自动基于唯一编号去重，不会产生重复记录。

---

## 📁 项目结构

```
MoneyTracker/
├── App.tsx                          # 入口文件（含 URL Scheme 监听）
├── app.json                         # Expo 配置
├── package.json                     # 依赖管理
├── tsconfig.json                    # TypeScript 配置
├── babel.config.js                  # Babel 配置
├── README.md                        # 项目文档
├── assets/                          # 静态资源
└── src/
    ├── types/
    │   └── index.ts                 # TypeScript 类型定义
    ├── database/
    │   └── database.ts              # SQLite 数据库操作层
    ├── utils/
    │   ├── hash.ts                  # SHA256 唯一编号生成
    │   ├── csvParser.ts             # CSV 解析器（微信/支付宝）
    │   └── exportImport.ts          # JSON 导出/导入
    ├── screens/
    │   ├── TransactionsScreen.tsx   # 账单列表页（首页）
    │   ├── StatisticsScreen.tsx     # 统计图表页
    │   └── SettingsScreen.tsx       # 设置页
    ├── components/
    │   ├── TransactionItem.tsx      # 交易列表项
    │   ├── TransactionForm.tsx      # 新增/编辑交易表单
    │   ├── ImportResultModal.tsx    # 导入结果弹窗
    │   └── MonthPicker.tsx          # 月份选择器
    └── navigation/
        └── AppNavigator.tsx         # 底部标签导航
```

---

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Expo SDK 50 | 跨平台开发框架 |
| TypeScript | 类型安全 |
| expo-sqlite | 本地数据库存储 |
| expo-crypto | SHA256 哈希计算 |
| expo-document-picker | 文件选择 |
| expo-file-system | 文件读写 |
| expo-sharing | 文件分享 |
| expo-linking | URL Scheme 处理 |
| React Navigation | 导航 |
| react-native-chart-kit | 图表 |
| PapaParse | CSV 解析 |

---

## 📝 License

MIT License

---

## 👤 作者

**Jim（瑾墨）** - 一名正在学习编程的高中生。

---

*Made with ❤️ and React Native Expo*
