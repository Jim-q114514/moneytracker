import Foundation
import SwiftData
import SwiftUI

enum TransactionType: String, CaseIterable, Codable, Identifiable {
    case expense
    case income

    var id: String { rawValue }

    var title: String {
        switch self {
        case .expense: "支出"
        case .income: "收入"
        }
    }
}

enum PaymentMethod: String, CaseIterable, Codable, Identifiable {
    case wechat = "微信"
    case alipay = "支付宝"
    case cash = "现金"
    case bankCard = "银行卡"
    case other = "其他"

    var id: String { rawValue }
}

@Model
final class Transaction: Identifiable {
    @Attribute(.unique) var id: String
    var amount: Double
    var typeRawValue: String
    var category: String
    var merchant: String
    var note: String
    var paymentMethodRawValue: String
    var transactionDate: Date
    var createdAt: Date
    var updatedAt: Date

    var type: TransactionType {
        get { TransactionType(rawValue: typeRawValue) ?? .expense }
        set { typeRawValue = newValue.rawValue }
    }

    var paymentMethod: PaymentMethod {
        get { PaymentMethod(rawValue: paymentMethodRawValue) ?? .other }
        set { paymentMethodRawValue = newValue.rawValue }
    }

    init(
        id: String = UUID().uuidString,
        amount: Double,
        type: TransactionType,
        category: String,
        merchant: String,
        note: String = "",
        paymentMethod: PaymentMethod,
        transactionDate: Date = .now,
        createdAt: Date = .now,
        updatedAt: Date = .now
    ) {
        self.id = id
        self.amount = amount
        self.typeRawValue = type.rawValue
        self.category = category
        self.merchant = merchant
        self.note = note
        self.paymentMethodRawValue = paymentMethod.rawValue
        self.transactionDate = transactionDate
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

struct MonthlySummary {
    let totalIncome: Double
    let totalExpense: Double
    let count: Int

    var balance: Double { totalIncome - totalExpense }
}

struct CategoryStat: Identifiable {
    let id = UUID()
    let category: String
    let amount: Double
    let count: Int
    let color: Color

    func percentage(of total: Double) -> Double {
        total > 0 ? amount / total : 0
    }
}

struct MonthlyTrend: Identifiable {
    let id = UUID()
    let month: Date
    let income: Double
    let expense: Double
}

let expenseCategories = ["餐饮", "交通", "购物", "娱乐", "住房", "通讯", "医疗", "教育", "生活", "其他"]
let incomeCategories = ["工资", "兼职", "理财", "红包", "退款", "其他"]
