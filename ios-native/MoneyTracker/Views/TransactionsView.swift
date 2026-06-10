import SwiftData
import SwiftUI

struct TransactionsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.appLanguage) private var language
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
                            LiquidGlassGroup(spacing: 8) {
                                LazyVStack(spacing: 8) {
                                    ForEach(filteredTransactions) { transaction in
                                        TransactionRow(transaction: transaction)
                                            .contentShape(Rectangle())
                                            .onTapGesture {
                                                editorTransaction = transaction
                                            }
                                            .contextMenu {
                                                Button(L10n.text(.edit, language), systemImage: "pencil") {
                                                    editorTransaction = transaction
                                                }
                                                Button(L10n.text(.delete, language), systemImage: "trash", role: .destructive) {
                                                    deleteCandidate = transaction
                                                }
                                            }
                                    }
                                }
                                .padding(.horizontal, 16)
                            }
                        }
                    }
                    .padding(.top, 8)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle(L10n.text(.transactions, language))
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isAdding = true
                    } label: {
                        Image(systemName: "plus")
                            .font(.headline)
                    }
                    .buttonStyle(LiquidGlassButton())
                    .accessibilityLabel(L10n.text(.addTransaction, language))
                }
            }
            .sheet(isPresented: $isAdding) {
                TransactionEditorView(mode: .add)
            }
            .sheet(item: $editorTransaction) { transaction in
                TransactionEditorView(mode: .edit(transaction))
            }
            .alert(L10n.text(.deleteTransaction, language), isPresented: deleteAlertBinding) {
                Button(L10n.text(.cancel, language), role: .cancel) {
                    deleteCandidate = nil
                }
                Button(L10n.text(.delete, language), role: .destructive) {
                    if let deleteCandidate {
                        modelContext.delete(deleteCandidate)
                        try? modelContext.save()
                    }
                    deleteCandidate = nil
                }
            } message: {
                Text(L10n.text(.deleteWarning, language))
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
                SummaryMetric(title: L10n.text(.totalExpense, language), value: summary.totalExpense.moneyText(language: language), color: .red)
                Divider().frame(height: 38)
                SummaryMetric(title: L10n.text(.totalIncome, language), value: summary.totalIncome.moneyText(language: language), color: .green)
            }

            Divider()

            HStack {
                Text(summary.balance >= 0 ? L10n.text(.monthBalance, language) : L10n.text(.monthOverspend, language))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(abs(summary.balance).moneyText(language: language))
                    .font(.title3.monospacedDigit().weight(.bold))
                    .foregroundStyle(summary.balance >= 0 ? .green : .red)
            }

            Text(String(format: L10n.text(.transactionCountFormat, language), summary.count))
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .liquidGlassCard(cornerRadius: 28, prominence: .accent)
        .padding(.horizontal, 16)
    }

    private var emptyState: some View {
        ContentUnavailableView {
            Label(L10n.text(.emptyTransactionsTitle, language), systemImage: "tray")
        } description: {
            Text(L10n.text(.emptyTransactionsDescription, language))
        }
        .padding(.top, 80)
    }

    private func monthLabel(_ date: Date) -> String {
        date.monthLabel(language: language)
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
    @Environment(\.appLanguage) private var language

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
                    Text(L10n.category(transaction.category, language))
                    Text("·")
                    Text(L10n.payment(transaction.paymentMethod.rawValue, language))
                    Text("·")
                    Text(transaction.transactionDate.formatted(.dateTime.hour().minute().locale(Locale(identifier: language.localeIdentifier))))
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

            Text("\(transaction.type == .income ? "+" : "-")\(transaction.amount.moneyText(language: language))")
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
