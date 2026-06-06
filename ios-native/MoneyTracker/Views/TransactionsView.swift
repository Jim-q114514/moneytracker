import SwiftData
import SwiftUI

struct TransactionsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Transaction.transactionDate, order: .reverse) private var transactions: [Transaction]

    @State private var selectedMonth = Calendar.current.startOfMonth(for: .now)
    @State private var editorTransaction: Transaction?
    @State private var isAdding = false
    @State private var deleteCandidate: Transaction?

    private var months: [Date] {
        TransactionStore.availableMonths(in: transactions)
    }

    private var filteredTransactions: [Transaction] {
        TransactionStore.transactionsForMonth(selectedMonth, in: transactions)
    }

    private var summary: MonthlySummary {
        TransactionStore.summary(for: selectedMonth, in: transactions)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 14) {
                        monthPicker
                        summaryCard

                        if filteredTransactions.isEmpty {
                            emptyState
                        } else {
                            LazyVStack(spacing: 8) {
                                ForEach(filteredTransactions) { transaction in
                                    TransactionRow(transaction: transaction)
                                        .contentShape(Rectangle())
                                        .onTapGesture {
                                            editorTransaction = transaction
                                        }
                                        .contextMenu {
                                            Button("编辑", systemImage: "pencil") {
                                                editorTransaction = transaction
                                            }
                                            Button("删除", systemImage: "trash", role: .destructive) {
                                                deleteCandidate = transaction
                                            }
                                        }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("账单")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isAdding = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.headline)
                    }
                    .buttonStyle(LiquidGlassButton())
                    .accessibilityLabel("新增交易")
                }
            }
            .sheet(isPresented: $isAdding) {
                TransactionEditorView(mode: .add)
            }
            .sheet(item: $editorTransaction) { transaction in
                TransactionEditorView(mode: .edit(transaction))
            }
            .alert("删除交易", isPresented: deleteAlertBinding) {
                Button("取消", role: .cancel) {
                    deleteCandidate = nil
                }
                Button("删除", role: .destructive) {
                    if let deleteCandidate {
                        modelContext.delete(deleteCandidate)
                        try? modelContext.save()
                    }
                    deleteCandidate = nil
                }
            } message: {
                Text("删除后不可恢复。")
            }
            .onChange(of: months) { _, newValue in
                if !newValue.contains(selectedMonth) {
                    selectedMonth = newValue.first ?? Calendar.current.startOfMonth(for: .now)
                }
            }
        }
    }

    private var deleteAlertBinding: Binding<Bool> {
        Binding(
            get: { deleteCandidate != nil },
            set: { if !$0 { deleteCandidate = nil } }
        )
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
        VStack(spacing: 14) {
            HStack {
                SummaryMetric(title: "支出", value: summary.totalExpense.moneyText, color: .red)
                Divider().frame(height: 38)
                SummaryMetric(title: "收入", value: summary.totalIncome.moneyText, color: .green)
            }

            Divider()

            HStack {
                Text(summary.balance >= 0 ? "本月结余" : "本月超支")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(abs(summary.balance).moneyText)
                    .font(.title3.monospacedDigit().weight(.bold))
                    .foregroundStyle(summary.balance >= 0 ? .green : .red)
            }

            Text("共 \(summary.count) 笔交易")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .liquidGlassCard(cornerRadius: 28)
        .padding(.horizontal, 16)
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label("暂无交易记录", systemImage: "tray")
        } description: {
            Text("点击右上角 + 添加第一笔交易")
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

private struct SummaryMetric: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.monospacedDigit().weight(.bold))
                .foregroundStyle(color)
                .minimumScaleFactor(0.72)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(.regularMaterial)
                    .frame(width: 44, height: 44)
                Image(systemName: iconName)
                    .font(.headline)
                    .foregroundStyle(iconColor)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(transaction.merchant)
                    .font(.headline)
                    .lineLimit(1)
                HStack(spacing: 4) {
                    Text(transaction.category)
                    Text("·")
                    Text(transaction.paymentMethod.rawValue)
                    Text("·")
                    Text(transaction.transactionDate.formatted(date: .omitted, time: .shortened))
                }
                .font(.caption)
                .foregroundStyle(.secondary)

                if !transaction.note.isEmpty {
                    Text(transaction.note)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            Text("\(transaction.type == .income ? "+" : "-")\(transaction.amount.moneyText)")
                .font(.headline.monospacedDigit())
                .foregroundStyle(transaction.type == .income ? .green : .red)
                .lineLimit(1)
                .minimumScaleFactor(0.72)
        }
        .liquidGlassCard(cornerRadius: 22, interactive: true)
    }

    private var iconColor: Color {
        transaction.type == .income ? .green : TransactionStore.categoryColor(transaction.category)
    }

    private var iconName: String {
        switch transaction.category {
        case "餐饮": "fork.knife"
        case "交通": "car.fill"
        case "购物": "bag.fill"
        case "娱乐": "gamecontroller.fill"
        case "住房": "house.fill"
        case "通讯": "antenna.radiowaves.left.and.right"
        case "医疗": "cross.case.fill"
        case "教育": "book.fill"
        case "工资": "briefcase.fill"
        case "红包": "gift.fill"
        default: "circle.grid.2x2.fill"
        }
    }
}
