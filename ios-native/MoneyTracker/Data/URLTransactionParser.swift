import Foundation

enum URLTransactionParser {
    static func transaction(from url: URL) -> Transaction? {
        guard url.scheme == "moneytracker", url.host == "add" else {
            return nil
        }

        let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        let params = Dictionary(uniqueKeysWithValues: (components?.queryItems ?? []).map { ($0.name, $0.value ?? "") })

        guard let amountText = params["amount"], let amount = Double(amountText), amount > 0 else {
            return nil
        }

        let type = params["type"] == "income" ? TransactionType.income : .expense
        let merchant = params["merchant"]?.removingPercentEncoding?.trimmingCharacters(in: .whitespacesAndNewlines)
        let note = params["note"]?.removingPercentEncoding?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let payment = PaymentMethod(rawValue: params["payment"] ?? "") ?? .wechat

        let date: Date
        if let timeText = params["time"], let parsed = ISO8601DateFormatter().date(from: timeText) {
            date = parsed
        } else {
            date = .now
        }

        let finalMerchant = merchant?.isEmpty == false ? merchant! : "自动记账"
        let category = TransactionStore.guessCategory(merchant: finalMerchant, note: note, type: type)

        return Transaction(
            amount: amount,
            type: type,
            category: category,
            merchant: finalMerchant,
            note: note,
            paymentMethod: payment,
            transactionDate: date
        )
    }
}
