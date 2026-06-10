import Foundation
import SwiftData
import SwiftUI
import UniformTypeIdentifiers

struct MoneyTrackerJSONDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }

    var text: String

    init(text: String = "") {
        self.text = text
    }

    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents,
              let text = String(data: data, encoding: .utf8)
        else {
            throw CocoaError(.fileReadCorruptFile)
        }
        self.text = text
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        FileWrapper(regularFileWithContents: Data(text.utf8))
    }
}

struct ImportSummary {
    var success: Int = 0
    var skipped: Int = 0
    var failed: Int = 0
    var errors: [String] = []

    var message: String {
        var lines = [
            "成功导入 \(success) 条",
            "跳过重复 \(skipped) 条",
            "失败 \(failed) 条"
        ]
        if !errors.isEmpty {
            lines.append(errors.prefix(3).joined(separator: "\n"))
        }
        return lines.joined(separator: "\n")
    }
}

enum DataPortability {
    static func exportJSON(from transactions: [Transaction]) throws -> String {
        let payload = ExportPayload(
            app: "MoneyTracker",
            version: 1,
            exportedAt: isoString(from: .now),
            transactions: transactions
                .sorted { $0.transactionDate > $1.transactionDate }
                .map(PortableTransaction.init)
        )

        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        let data = try encoder.encode(payload)
        return String(decoding: data, as: UTF8.self)
    }

    static func importJSON(
        _ text: String,
        into modelContext: ModelContext,
        existing transactions: [Transaction]
    ) throws -> ImportSummary {
        let data = Data(text.utf8)
        let payload = try JSONDecoder().decode(ExportPayload.self, from: data)

        guard payload.app == "MoneyTracker" else {
            throw ImportError.invalidApp
        }

        var summary = ImportSummary()
        var knownIDs = Set(transactions.map(\.id))

        for item in payload.transactions {
            do {
                let transaction = try item.makeTransaction()
                if knownIDs.contains(transaction.id) {
                    summary.skipped += 1
                    continue
                }

                modelContext.insert(transaction)
                knownIDs.insert(transaction.id)
                summary.success += 1
            } catch {
                summary.failed += 1
                summary.errors.append("交易 \(item.id.suffix(4)) 导入失败：\(error.localizedDescription)")
            }
        }

        try modelContext.save()
        return summary
    }

    static func defaultExportFilename() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyyMMdd_HHmm"
        return "MoneyTracker_导出_\(formatter.string(from: .now))"
    }

    private static func isoString(from date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}

private struct ExportPayload: Codable {
    let app: String
    let version: Int
    let exportedAt: String?
    let transactions: [PortableTransaction]
}

private struct PortableTransaction: Codable {
    let id: String
    let amount: Double
    let type: String
    let category: String
    let merchant: String
    let note: String
    let paymentMethod: String
    let transactionDate: String

    enum CodingKeys: String, CodingKey {
        case id
        case amount
        case type
        case category
        case merchant
        case note
        case paymentMethod = "payment_method"
        case transactionDate = "transaction_date"
    }

    init(_ transaction: Transaction) {
        id = transaction.id
        amount = transaction.amount
        type = transaction.type.rawValue
        category = transaction.category
        merchant = transaction.merchant
        note = transaction.note
        paymentMethod = transaction.paymentMethod.rawValue
        transactionDate = DataPortabilityDateParser.isoString(from: transaction.transactionDate)
    }

    func makeTransaction() throws -> Transaction {
        let cleanedID = id.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedID.isEmpty else {
            throw ImportError.missingID
        }
        guard amount > 0 else {
            throw ImportError.invalidAmount
        }
        guard let parsedType = TransactionType(rawValue: type) else {
            throw ImportError.invalidType
        }
        guard let date = DataPortabilityDateParser.date(from: transactionDate) else {
            throw ImportError.invalidDate
        }

        return Transaction(
            id: cleanedID,
            amount: amount,
            type: parsedType,
            category: category.isEmpty ? "其他" : category,
            merchant: merchant.isEmpty ? "手动" : merchant,
            note: note,
            paymentMethod: PaymentMethod(rawValue: paymentMethod) ?? .other,
            transactionDate: date
        )
    }
}

private enum DataPortabilityDateParser {
    static func date(from text: String) -> Date? {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractional.date(from: text) {
            return date
        }

        let standard = ISO8601DateFormatter()
        standard.formatOptions = [.withInternetDateTime]
        if let date = standard.date(from: text) {
            return date
        }

        let localFormatter = DateFormatter()
        localFormatter.locale = Locale(identifier: "zh_CN")
        localFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return localFormatter.date(from: text)
    }

    static func isoString(from date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}

private enum ImportError: LocalizedError {
    case invalidApp
    case missingID
    case invalidAmount
    case invalidType
    case invalidDate

    var errorDescription: String? {
        switch self {
        case .invalidApp:
            "不是 MoneyTracker 导出文件"
        case .missingID:
            "缺少交易 ID"
        case .invalidAmount:
            "金额必须大于 0"
        case .invalidType:
            "交易类型无效"
        case .invalidDate:
            "交易时间无法解析"
        }
    }
}
