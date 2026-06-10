import Foundation
import SwiftUI

enum AppLanguage: String, CaseIterable, Identifiable {
    case zhHans
    case en

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .zhHans: "简体中文"
        case .en: "English"
        }
    }

    var localeIdentifier: String {
        switch self {
        case .zhHans: "zh-Hans"
        case .en: "en"
        }
    }
}

private struct AppLanguageKey: EnvironmentKey {
    static let defaultValue = AppLanguage.zhHans
}

extension EnvironmentValues {
    var appLanguage: AppLanguage {
        get { self[AppLanguageKey.self] }
        set { self[AppLanguageKey.self] = newValue }
    }
}

enum L10n {
    static func text(_ key: Key, _ language: AppLanguage) -> String {
        switch language {
        case .zhHans:
            zhHans[key] ?? key.rawValue
        case .en:
            en[key] ?? key.rawValue
        }
    }

    static func category(_ value: String, _ language: AppLanguage) -> String {
        guard language == .en else { return value }
        return categoryEN[value] ?? value
    }

    static func payment(_ value: String, _ language: AppLanguage) -> String {
        guard language == .en else { return value }
        return paymentEN[value] ?? value
    }

    static func transactionType(_ type: TransactionType, _ language: AppLanguage) -> String {
        switch (type, language) {
        case (.expense, .zhHans): "支出"
        case (.income, .zhHans): "收入"
        case (.expense, .en): "Expense"
        case (.income, .en): "Income"
        }
    }

    enum Key: String {
        case transactions
        case statistics
        case settings
        case addTransaction
        case edit
        case delete
        case deleteTransaction
        case deleteWarning
        case cancel
        case save
        case confirm
        case totalExpense
        case totalIncome
        case monthBalance
        case monthOverspend
        case transactionCountFormat
        case emptyTransactionsTitle
        case emptyTransactionsDescription
        case currentMonth
        case income
        case expense
        case balance
        case noStatsTitle
        case noStatsDescription
        case categoryShare
        case sixMonthTrend
        case categoryRanking
        case monthlyDetails
        case receivedFormat
        case spentFormat
        case addTransactionTitle
        case editTransactionTitle
        case invalidAmountTitle
        case invalidAmountMessage
        case typePicker
        case category
        case paymentMethod
        case transactionInfo
        case merchantPlaceholder
        case notePlaceholder
        case transactionTime
        case time
        case totalTransactions
        case trackedMonths
        case dataMigration
        case exportJSON
        case exportJSONDescription
        case importJSON
        case importJSONDescription
        case shortcuts
        case shortcutTitle
        case shortcutDescription
        case urlExample
        case dangerZone
        case clearAllData
        case clearAllDataDescription
        case clearAllDataTitle
        case clearAllDataMessage
        case deleteAll
        case about
        case appName
        case version
        case techStack
        case bundleID
        case language
        case languageDescription
        case appearance
        case systemAppearance
        case systemAppearanceDescription
        case operationResult
        case exportCompleted
        case exportFailedFormat
        case importFailedNoFile
        case importFailedFormat
        case importSuccessFormat
        case importSkippedFormat
        case importFailedCountFormat
        case automatic
        case manualMerchant
    }

    private static let zhHans: [Key: String] = [
        .transactions: "账单",
        .statistics: "统计",
        .settings: "设置",
        .addTransaction: "新增交易",
        .edit: "编辑",
        .delete: "删除",
        .deleteTransaction: "删除交易",
        .deleteWarning: "删除后不可恢复。",
        .cancel: "取消",
        .save: "保存",
        .confirm: "好",
        .totalExpense: "支出",
        .totalIncome: "收入",
        .monthBalance: "本月结余",
        .monthOverspend: "本月超支",
        .transactionCountFormat: "共 %d 笔交易",
        .emptyTransactionsTitle: "暂无交易记录",
        .emptyTransactionsDescription: "点击右上角 + 添加第一笔交易",
        .currentMonth: "本月",
        .income: "收入",
        .expense: "支出",
        .balance: "结余",
        .noStatsTitle: "暂无统计数据",
        .noStatsDescription: "添加交易记录后即可看到统计图表",
        .categoryShare: "支出分类占比",
        .sixMonthTrend: "近 6 个月趋势",
        .categoryRanking: "支出排行榜",
        .monthlyDetails: "月度收支明细",
        .receivedFormat: "收 %@",
        .spentFormat: "支 %@",
        .addTransactionTitle: "新增交易",
        .editTransactionTitle: "编辑交易",
        .invalidAmountTitle: "请输入有效金额",
        .invalidAmountMessage: "金额必须大于 0。",
        .typePicker: "收支类型",
        .category: "分类",
        .paymentMethod: "支付方式",
        .transactionInfo: "交易信息",
        .merchantPlaceholder: "商家 / 交易对方",
        .notePlaceholder: "备注（可选）",
        .transactionTime: "交易时间",
        .time: "时间",
        .totalTransactions: "总交易数",
        .trackedMonths: "有记录月份",
        .dataMigration: "数据迁移",
        .exportJSON: "导出 JSON",
        .exportJSONDescription: "生成兼容 Expo 旧版的 MoneyTracker 备份",
        .importJSON: "导入 JSON",
        .importJSONDescription: "从旧版导出的 JSON 恢复账单，并自动跳过重复记录",
        .shortcuts: "自动记账",
        .shortcutTitle: "快捷指令自动记账",
        .shortcutDescription: "通过 moneytracker://add 写入交易",
        .urlExample: "moneytracker://add?amount=28.5&merchant=星巴克&type=expense&payment=微信",
        .dangerZone: "危险操作",
        .clearAllData: "清理所有数据",
        .clearAllDataDescription: "删除全部交易记录，不可恢复",
        .clearAllDataTitle: "清理所有数据",
        .clearAllDataMessage: "此操作会永久删除所有交易记录。建议先保留一份设备备份。",
        .deleteAll: "删除全部",
        .about: "关于",
        .appName: "应用名称",
        .version: "版本",
        .techStack: "技术栈",
        .bundleID: "Bundle ID",
        .language: "语言",
        .languageDescription: "切换应用界面语言，默认简体中文",
        .appearance: "外观",
        .systemAppearance: "跟随系统",
        .systemAppearanceDescription: "自动适配浅色和深色模式",
        .operationResult: "数据操作结果",
        .exportCompleted: "导出完成。",
        .exportFailedFormat: "导出失败：%@",
        .importFailedNoFile: "导入失败：没有选择文件。",
        .importFailedFormat: "导入失败：%@",
        .importSuccessFormat: "成功导入 %d 条",
        .importSkippedFormat: "跳过重复 %d 条",
        .importFailedCountFormat: "失败 %d 条",
        .automatic: "自动记账",
        .manualMerchant: "手动"
    ]

    private static let en: [Key: String] = [
        .transactions: "Transactions",
        .statistics: "Statistics",
        .settings: "Settings",
        .addTransaction: "Add Transaction",
        .edit: "Edit",
        .delete: "Delete",
        .deleteTransaction: "Delete Transaction",
        .deleteWarning: "This action cannot be undone.",
        .cancel: "Cancel",
        .save: "Save",
        .confirm: "OK",
        .totalExpense: "Expense",
        .totalIncome: "Income",
        .monthBalance: "Monthly Balance",
        .monthOverspend: "Overspent This Month",
        .transactionCountFormat: "%d transactions",
        .emptyTransactionsTitle: "No Transactions",
        .emptyTransactionsDescription: "Tap + to add your first transaction.",
        .currentMonth: "This Month",
        .income: "Income",
        .expense: "Expense",
        .balance: "Balance",
        .noStatsTitle: "No Statistics Yet",
        .noStatsDescription: "Add transactions to see charts and trends.",
        .categoryShare: "Expense Breakdown",
        .sixMonthTrend: "6-Month Trend",
        .categoryRanking: "Category Ranking",
        .monthlyDetails: "Monthly Details",
        .receivedFormat: "In %@",
        .spentFormat: "Out %@",
        .addTransactionTitle: "Add Transaction",
        .editTransactionTitle: "Edit Transaction",
        .invalidAmountTitle: "Invalid Amount",
        .invalidAmountMessage: "Amount must be greater than 0.",
        .typePicker: "Type",
        .category: "Category",
        .paymentMethod: "Payment Method",
        .transactionInfo: "Transaction Info",
        .merchantPlaceholder: "Merchant / Payee",
        .notePlaceholder: "Note (optional)",
        .transactionTime: "Transaction Time",
        .time: "Time",
        .totalTransactions: "Transactions",
        .trackedMonths: "Tracked Months",
        .dataMigration: "Data Migration",
        .exportJSON: "Export JSON",
        .exportJSONDescription: "Create a MoneyTracker backup compatible with the Expo version.",
        .importJSON: "Import JSON",
        .importJSONDescription: "Restore an exported JSON file and skip duplicate records.",
        .shortcuts: "Automation",
        .shortcutTitle: "Shortcuts Automation",
        .shortcutDescription: "Write transactions through moneytracker://add",
        .urlExample: "moneytracker://add?amount=28.5&merchant=Starbucks&type=expense&payment=微信",
        .dangerZone: "Danger Zone",
        .clearAllData: "Clear All Data",
        .clearAllDataDescription: "Delete all transactions permanently.",
        .clearAllDataTitle: "Clear All Data",
        .clearAllDataMessage: "This permanently deletes all transactions. Keep a backup first.",
        .deleteAll: "Delete All",
        .about: "About",
        .appName: "App Name",
        .version: "Version",
        .techStack: "Tech Stack",
        .bundleID: "Bundle ID",
        .language: "Language",
        .languageDescription: "Switch app language. Chinese is the default.",
        .appearance: "Appearance",
        .systemAppearance: "Follow System",
        .systemAppearanceDescription: "Automatically adapts to Light and Dark Mode.",
        .operationResult: "Data Operation Result",
        .exportCompleted: "Export completed.",
        .exportFailedFormat: "Export failed: %@",
        .importFailedNoFile: "Import failed: no file selected.",
        .importFailedFormat: "Import failed: %@",
        .importSuccessFormat: "Imported %d",
        .importSkippedFormat: "Skipped duplicates %d",
        .importFailedCountFormat: "Failed %d",
        .automatic: "Automatic",
        .manualMerchant: "Manual"
    ]

    private static let categoryEN: [String: String] = [
        "餐饮": "Food",
        "交通": "Transport",
        "购物": "Shopping",
        "娱乐": "Entertainment",
        "住房": "Housing",
        "通讯": "Mobile",
        "医疗": "Medical",
        "教育": "Education",
        "生活": "Daily",
        "工资": "Salary",
        "兼职": "Side Job",
        "理财": "Investment",
        "红包": "Gift Money",
        "退款": "Refund",
        "其他": "Other"
    ]

    private static let paymentEN: [String: String] = [
        "微信": "WeChat Pay",
        "支付宝": "Alipay",
        "现金": "Cash",
        "银行卡": "Bank Card",
        "其他": "Other"
    ]
}

extension Date {
    func monthLabel(language: AppLanguage) -> String {
        if Calendar.current.isDate(self, equalTo: .now, toGranularity: .month) {
            return L10n.text(.currentMonth, language)
        }
        return formatted(
            .dateTime
                .year()
                .month(.wide)
                .locale(Locale(identifier: language.localeIdentifier))
        )
    }
}

extension Double {
    func moneyText(language: AppLanguage) -> String {
        formatted(
            .currency(code: "CNY")
                .precision(.fractionLength(2))
                .locale(Locale(identifier: language.localeIdentifier))
        )
    }
}
