import Foundation
import SwiftData
import SwiftUI

enum TransactionStore {
    static func summary(for month: Date, in transactions: [Transaction]) -> MonthlySummary {
        let items = transactionsForMonth(month, in: transactions)
        let income = items.filter { $0.type == .income }.reduce(0) { $0 + $1.amount }
        let expense = items.filter { $0.type == .expense }.reduce(0) { $0 + $1.amount }
        return MonthlySummary(totalIncome: income, totalExpense: expense, count: items.count)
    }

    static func transactionsForMonth(_ month: Date, in transactions: [Transaction]) -> [Transaction] {
        let calendar = Calendar.current
        return transactions.filter { calendar.isDate($0.transactionDate, equalTo: month, toGranularity: .month) }
    }

    static func availableMonths(in transactions: [Transaction]) -> [Date] {
        let calendar = Calendar.current
        let months = Set(transactions.map { calendar.startOfMonth(for: $0.transactionDate) })
        let sorted = months.sorted(by: >)
        let current = calendar.startOfMonth(for: .now)
        return sorted.contains(current) ? sorted : [current] + sorted
    }

    static func categoryStats(for month: Date, in transactions: [Transaction]) -> [CategoryStat] {
        let expenses = transactionsForMonth(month, in: transactions).filter { $0.type == .expense }
        let grouped = Dictionary(grouping: expenses, by: \.category)

        return grouped.map { category, items in
            CategoryStat(
                category: category,
                amount: items.reduce(0) { $0 + $1.amount },
                count: items.count,
                color: categoryColor(category)
            )
        }
        .sorted { $0.amount > $1.amount }
    }

    static func trends(months: Int = 6, in transactions: [Transaction]) -> [MonthlyTrend] {
        let calendar = Calendar.current
        let current = calendar.startOfMonth(for: .now)

        return (0..<months).reversed().compactMap { offset in
            guard let month = calendar.date(byAdding: .month, value: -offset, to: current) else {
                return nil
            }

            let summary = summary(for: month, in: transactions)
            return MonthlyTrend(month: month, income: summary.totalIncome, expense: summary.totalExpense)
        }
    }

    static func guessCategory(merchant: String, note: String, type: TransactionType) -> String {
        guard type == .expense else { return "其他" }
        let text = merchant + note

        if text.range(of: "饭|餐|面|粉|粥|包|鸡|鸭|鱼|肉|汤|火锅|烧烤|奶茶|咖啡|茶|饮料|水果|菜|食|厨|小吃|外卖|美团|饿了么", options: .regularExpression) != nil {
            return "餐饮"
        }
        if text.range(of: "滴滴|出租|公交|地铁|火车|高铁|飞机|机票|加油|充电|停车|高速|etc", options: .regularExpression) != nil {
            return "交通"
        }
        if text.range(of: "淘宝|天猫|京东|拼多多|超市|商场|便利店|百货|服饰|服装|鞋|包|化妆品|电器|数码", options: .regularExpression) != nil {
            return "购物"
        }
        if text.range(of: "电影|KTV|游戏|旅游|景点|门票|酒店|民宿|健身|运动", options: .regularExpression) != nil {
            return "娱乐"
        }
        if text.range(of: "房租|水电|物业|暖气|天然气|宽带", options: .regularExpression) != nil {
            return "住房"
        }
        if text.range(of: "话费|流量|充值|电信|移动|联通", options: .regularExpression) != nil {
            return "通讯"
        }
        if text.range(of: "医院|药|诊所|挂号|体检|医保", options: .regularExpression) != nil {
            return "医疗"
        }
        if text.range(of: "书|课|培训|学习|考试|报名", options: .regularExpression) != nil {
            return "教育"
        }
        return "其他"
    }

    static func categoryColor(_ category: String) -> Color {
        switch category {
        case "餐饮": .red
        case "交通": .teal
        case "购物": .yellow
        case "娱乐": .indigo
        case "住房": .mint
        case "通讯": .orange
        case "医疗": .blue
        case "教育": .pink
        case "生活": .green
        default: .gray
        }
    }
}

extension Calendar {
    func startOfMonth(for date: Date) -> Date {
        let components = dateComponents([.year, .month], from: date)
        return self.date(from: components) ?? date
    }
}

extension Double {
    var moneyText: String {
        formatted(.currency(code: "CNY").precision(.fractionLength(2)))
    }
}
