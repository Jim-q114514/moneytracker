import Charts
import SwiftData
import SwiftUI

struct StatisticsView: View {
    @Query(sort: \Transaction.transactionDate, order: .reverse) private var transactions: [Transaction]
    @State private var selectedMonth = Calendar.current.startOfMonth(for: .now)

    private var months: [Date] {
        TransactionStore.availableMonths(in: transactions)
    }

    private var summary: MonthlySummary {
        TransactionStore.summary(for: selectedMonth, in: transactions)
    }

    private var categoryStats: [CategoryStat] {
        TransactionStore.categoryStats(for: selectedMonth, in: transactions)
    }

    private var trends: [MonthlyTrend] {
        TransactionStore.trends(months: 6, in: transactions)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 16) {
                        monthPicker
                        summaryCard

                        if summary.count == 0 {
                            emptyState
                        } else {
                            if !categoryStats.isEmpty {
                                categoryChart
                                categoryRank
                            }

                            trendChart
                            trendList
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("统计")
            .onChange(of: months) { _, newValue in
                if !newValue.contains(selectedMonth) {
                    selectedMonth = newValue.first ?? Calendar.current.startOfMonth(for: .now)
                }
            }
        }
    }

    private var monthPicker: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(months, id: \.self) { month in
                    Button {
                        selectedMonth = month
                    } label: {
                        Text(monthLabel(month))
                            .font(.subheadline.weight(.semibold))
                            .padding(.horizontal, 14)
                            .frame(height: 36)
                            .background(selectedMonth == month ? Color.blue : Color.clear, in: Capsule())
                            .foregroundStyle(selectedMonth == month ? .white : .primary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var summaryCard: some View {
        HStack(spacing: 12) {
            StatBox(title: "收入", value: summary.totalIncome.moneyText, color: .green)
            StatBox(title: "支出", value: summary.totalExpense.moneyText, color: .red)
            StatBox(title: "结余", value: summary.balance.moneyText, color: summary.balance >= 0 ? .green : .red)
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var categoryChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("支出分类占比")
                .font(.headline)

            Chart(categoryStats) { item in
                SectorMark(
                    angle: .value("金额", item.amount),
                    innerRadius: .ratio(0.58),
                    angularInset: 1.5
                )
                .foregroundStyle(item.color)
                .cornerRadius(4)
            }
            .frame(height: 220)
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var trendChart: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("近 6 个月趋势")
                .font(.headline)

            Chart(trends) { item in
                BarMark(
                    x: .value("月份", item.month, unit: .month),
                    y: .value("支出", item.expense)
                )
                .foregroundStyle(.blue.gradient)

                LineMark(
                    x: .value("月份", item.month, unit: .month),
                    y: .value("收入", item.income)
                )
                .foregroundStyle(.green)
                .interpolationMethod(.catmullRom)
            }
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .frame(height: 220)
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var categoryRank: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("支出排行榜")
                .font(.headline)

            let total = categoryStats.reduce(0) { $0 + $1.amount }
            ForEach(Array(categoryStats.prefix(10).enumerated()), id: \.element.id) { index, item in
                VStack(spacing: 8) {
                    HStack {
                        Text("\(index + 1)")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(.secondary)
                            .frame(width: 24)
                        Circle()
                            .fill(item.color)
                            .frame(width: 10, height: 10)
                        Text(item.category)
                            .font(.subheadline.weight(.semibold))
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            Text(item.amount.moneyText)
                                .font(.subheadline.monospacedDigit().weight(.semibold))
                            Text(item.percentage(of: total), format: .percent.precision(.fractionLength(1)))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }

                    ProgressView(value: item.percentage(of: total))
                        .tint(item.color)
                }
                .padding(.vertical, 4)
            }
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var trendList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("月度收支明细")
                .font(.headline)

            ForEach(trends.reversed()) { item in
                HStack {
                    Text(monthLabel(item.month))
                        .font(.subheadline.weight(.semibold))
                        .frame(width: 76, alignment: .leading)
                    Spacer()
                    Text("收 \(item.income.moneyText)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.green)
                    Text("支 \(item.expense.moneyText)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(.red)
                }
                .padding(.vertical, 4)
            }
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("暂无统计数据", systemImage: "chart.pie")
        } description: {
            Text("添加交易记录后即可看到统计图表")
        }
        .padding(.top, 80)
    }

    private func monthLabel(_ date: Date) -> String {
        if Calendar.current.isDate(date, equalTo: .now, toGranularity: .month) {
            return "本月"
        }
        return date.formatted(.dateTime.year().month(.wide))
    }
}

private struct StatBox: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline.monospacedDigit().weight(.bold))
                .foregroundStyle(color)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }
}
