import SwiftData
import SwiftUI

enum TransactionEditorMode {
    case add
    case edit(Transaction)
}

struct TransactionEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

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
                        chipSection("分类", items: categories, selected: category) { category = $0 }
                        textSection
                        chipSection("支付方式", items: PaymentMethod.allCases.map(\.rawValue), selected: paymentMethod.rawValue) {
                            paymentMethod = PaymentMethod(rawValue: $0) ?? .other
                        }
                        dateSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 18)
                }
            }
            .navigationTitle(isEditing ? "编辑交易" : "新增交易")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") { save() }
                        .fontWeight(.semibold)
                }
            }
            .alert("请输入有效金额", isPresented: $showInvalidAmount) {
                Button("好", role: .cancel) {}
            } message: {
                Text("金额必须大于 0。")
            }
            .onAppear(perform: loadInitialData)
        }
    }

    private var typePicker: some View {
        Picker("收支类型", selection: $type) {
            ForEach(TransactionType.allCases) { item in
                Text(item.title).tag(item)
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
            Text("交易信息")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            VStack(spacing: 0) {
                TextField("商家 / 交易对方", text: $merchant)
                    .textContentType(.organizationName)
                    .padding(.vertical, 12)
                Divider()
                TextField("备注（可选）", text: $note)
                    .padding(.vertical, 12)
            }
            .padding(.horizontal, 14)
            .liquidGlassCard(cornerRadius: 20)
        }
    }

    private var dateSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("交易时间")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            DatePicker("时间", selection: $transactionDate, displayedComponents: [.date, .hourAndMinute])
                .datePickerStyle(.compact)
                .liquidGlassCard(cornerRadius: 20)
        }
    }

    private func chipSection(_ title: String, items: [String], selected: String, onSelect: @escaping (String) -> Void) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.secondary)

            FlowLayout(spacing: 8) {
                ForEach(items, id: \.self) { item in
                    Button {
                        onSelect(item)
                    } label: {
                        Text(item)
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
        merchant = transaction.merchant == "手动" ? "" : transaction.merchant
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
            ? "手动"
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
