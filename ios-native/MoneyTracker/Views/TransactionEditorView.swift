import SwiftData
import SwiftUI

enum TransactionEditorMode {
    case add
    case edit(Transaction)
}

struct TransactionEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Environment(\.appLanguage) private var language

    let mode: TransactionEditorMode

    @State private var type: TransactionType = .expense
    @State private var amountText = ""
    @State private var category = "其他"
    @State private var merchant = ""
    @State private var note = ""
    @State private var paymentMethod: PaymentMethod = .wechat
    @State private var transactionDate = Date()
    @State private var showInvalidAmount = false

    private var isEditing: Bool {
        if case .edit = mode { return true }
        return false
    }

    private var categories: [String] {
        type == .income ? incomeCategories : expenseCategories
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        typePicker
                        amountPanel
                        chipSection(
                            L10n.text(.category, language),
                            items: categories,
                            selected: category,
                            displayTitle: { L10n.category($0, language) }
                        ) { category = $0 }
                        textSection
                        chipSection(
                            L10n.text(.paymentMethod, language),
                            items: PaymentMethod.allCases.map(\.rawValue),
                            selected: paymentMethod.rawValue,
                            displayTitle: { L10n.payment($0, language) }
                        ) {
                            paymentMethod = PaymentMethod(rawValue: $0) ?? .other
                        }
                        dateSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 18)
                }
            }
            .navigationTitle(isEditing ? L10n.text(.editTransactionTitle, language) : L10n.text(.addTransactionTitle, language))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.text(.cancel, language)) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.text(.save, language)) { save() }
                        .fontWeight(.semibold)
                }
            }
            .alert(L10n.text(.invalidAmountTitle, language), isPresented: $showInvalidAmount) {
                Button(L10n.text(.confirm, language), role: .cancel) {}
            } message: {
                Text(L10n.text(.invalidAmountMessage, language))
            }
            .onAppear(perform: loadInitialData)
        }
    }

    private var typePicker: some View {
        Picker(L10n.text(.typePicker, language), selection: $type) {
            ForEach(TransactionType.allCases) { item in
                Text(L10n.transactionType(item, language)).tag(item)
            }
        }
        .pickerStyle(.segmented)
        .onChange(of: type) { _, _ in
            category = "其他"
        }
    }

    private var amountPanel: some View {
        VStack(spacing: 12) {
            Text("¥")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.secondary)

            TextField("0.00", text: $amountText)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.center)
                .font(.system(size: 46, weight: .bold, design: .rounded).monospacedDigit())

            HStack(spacing: 8) {
                ForEach([0.5, 1, 10], id: \.self) { value in
                    Button("+\(value.formatted(.number.precision(.fractionLength(value == 0.5 ? 1 : 0))))") {
                        let current = Double(amountText) ?? 0
                        amountText = (current + value).formatted(.number.precision(.fractionLength(2)))
                    }
                    .buttonStyle(LiquidGlassButton())
                }
            }
        }
        .frame(maxWidth: .infinity)
        .liquidGlassCard(cornerRadius: 28)
    }

    private var textSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(L10n.text(.transactionInfo, language))
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            VStack(spacing: 0) {
                TextField(L10n.text(.merchantPlaceholder, language), text: $merchant)
                    .textContentType(.organizationName)
                    .padding(.vertical, 12)
                Divider()
                TextField(L10n.text(.notePlaceholder, language), text: $note)
                    .padding(.vertical, 12)
            }
            .padding(.horizontal, 14)
            .liquidGlassCard(cornerRadius: 20)
        }
    }

    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(L10n.text(.transactionTime, language))
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            DatePicker(L10n.text(.time, language), selection: $transactionDate, displayedComponents: [.date, .hourAndMinute])
                .datePickerStyle(.compact)
                .liquidGlassCard(cornerRadius: 20)
        }
    }

    private func chipSection(
        _ title: String,
        items: [String],
        selected: String,
        displayTitle: @escaping (String) -> String = { $0 },
        onSelect: @escaping (String) -> Void
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            FlowLayout(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    Button {
                        onSelect(item)
                    } label: {
                        Text(displayTitle(item))
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(selected == item ? .white : .primary)
                            .padding(.horizontal, 14)
                            .frame(height: 36)
                            .background(selected == item ? Color.blue : Color.clear, in: Capsule())
                    }
                    .buttonStyle(.plain)
                    .background(.regularMaterial, in: Capsule())
                }
            }
        }
    }

    private func loadInitialData() {
        guard case let .edit(transaction) = mode else {
            return
        }

        type = transaction.type
        amountText = transaction.amount.formatted(.number.precision(.fractionLength(2)))
        category = transaction.category
        merchant = transaction.merchant == L10n.text(.manualMerchant, .zhHans) ? "" : transaction.merchant
        note = transaction.note
        paymentMethod = transaction.paymentMethod
        transactionDate = transaction.transactionDate
    }

    private func save() {
        guard let amount = Double(amountText.replacingOccurrences(of: ",", with: "")), amount > 0 else {
            showInvalidAmount = true
            return
        }

        let finalMerchant = merchant.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ? L10n.text(.manualMerchant, .zhHans)
            : merchant.trimmingCharacters(in: .whitespacesAndNewlines)

        switch mode {
        case .add:
            let transaction = Transaction(
                amount: amount,
                type: type,
                category: category,
                merchant: finalMerchant,
                note: note.trimmingCharacters(in: .whitespacesAndNewlines),
                paymentMethod: paymentMethod,
                transactionDate: transactionDate
            )
            modelContext.insert(transaction)
        case let .edit(transaction):
            transaction.amount = amount
            transaction.type = type
            transaction.category = category
            transaction.merchant = finalMerchant
            transaction.note = note.trimmingCharacters(in: .whitespacesAndNewlines)
            transaction.paymentMethod = paymentMethod
            transaction.transactionDate = transactionDate
            transaction.updatedAt = .now
        }

        try? modelContext.save()
        dismiss()
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? 320
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return CGSize(width: maxWidth, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }
    }
}
