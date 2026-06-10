import SwiftData
import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var transactions: [Transaction]

    @State private var showClearAlert = false
    @State private var isImportingJSON = false
    @State private var isExportingJSON = false
    @State private var exportDocument = MoneyTrackerJSONDocument(text: "{}")
    @State private var operationMessage: String?

    private var monthCount: Int {
        Set(transactions.map { Calendar.current.startOfMonth(for: $0.transactionDate) }).count
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.appBackground.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 22) {
                        statsCard
                        dataSection
                        shortcutSection
                        dangerSection
                        aboutSection
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("设置")
            .alert("清理所有数据", isPresented: $showClearAlert) {
                Button("取消", role: .cancel) {}
                Button("删除全部", role: .destructive) {
                    for transaction in transactions {
                        modelContext.delete(transaction)
                    }
                    try? modelContext.save()
                }
            } message: {
                Text("此操作会永久删除所有交易记录。建议先保留一份设备备份。")
            }
            .fileImporter(
                isPresented: $isImportingJSON,
                allowedContentTypes: [.json],
                allowsMultipleSelection: false,
                onCompletion: handleImportResult
            )
            .fileExporter(
                isPresented: $isExportingJSON,
                document: exportDocument,
                contentType: .json,
                defaultFilename: DataPortability.defaultExportFilename(),
                onCompletion: handleExportResult
            )
            .alert("数据操作结果", isPresented: operationAlertBinding) {
                Button("好", role: .cancel) {
                    operationMessage = nil
                }
            } message: {
                Text(operationMessage ?? "")
            }
        }
    }

    private var operationAlertBinding: Binding<Bool> {
        Binding(
            get: { operationMessage != nil },
            set: { if !$0 { operationMessage = nil } }
        )
    }

    private var statsCard: some View {
        HStack {
            SettingStat(title: "总交易数", value: "\(transactions.count)")
            Divider().frame(height: 42)
            SettingStat(title: "有记录月份", value: "\(monthCount)")
        }
        .liquidGlassCard(cornerRadius: 28)
    }

    private var dataSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("数据迁移")

            VStack(spacing: 0) {
                Button {
                    prepareExport()
                } label: {
                    SettingsRow(
                        icon: "square.and.arrow.up",
                        title: "导出 JSON",
                        subtitle: "生成兼容 Expo 旧版的 MoneyTracker 备份"
                    )
                }
                .buttonStyle(.plain)

                Divider().padding(.leading, 44)

                Button {
                    isImportingJSON = true
                } label: {
                    SettingsRow(
                        icon: "square.and.arrow.down",
                        title: "导入 JSON",
                        subtitle: "从旧版导出的 JSON 恢复账单，并自动跳过重复记录"
                    )
                }
                .buttonStyle(.plain)
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private var shortcutSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("自动记账")

            VStack(spacing: 0) {
                SettingsRow(
                    icon: "bolt.fill",
                    title: "快捷指令自动记账",
                    subtitle: "通过 moneytracker://add 写入交易"
                )
                Divider().padding(.leading, 44)
                SettingsRow(
                    icon: "link",
                    title: "URL Scheme 示例",
                    subtitle: "moneytracker://add?amount=28.5&merchant=星巴克&type=expense&payment=微信"
                )
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("危险操作")

            Button(role: .destructive) {
                showClearAlert = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "trash.fill")
                        .frame(width: 32, height: 32)
                        .foregroundStyle(.red)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("清理所有数据")
                            .font(.body.weight(.semibold))
                            .foregroundStyle(.red)
                        Text("删除全部交易记录，不可恢复")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                }
                .frame(minHeight: 44)
            }
            .buttonStyle(.plain)
            .liquidGlassCard(cornerRadius: 24, interactive: true)
        }
    }

    private var aboutSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle("关于")

            VStack(spacing: 0) {
                AboutRow(title: "应用名称", value: "MoneyTracker")
                Divider()
                AboutRow(title: "版本", value: "1.1.0")
                Divider()
                AboutRow(title: "技术栈", value: "SwiftUI + SwiftData")
                Divider()
                AboutRow(title: "Bundle ID", value: "com.aramco.cycomm")
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(.secondary)
            .padding(.horizontal, 4)
    }

    private func prepareExport() {
        do {
            exportDocument = MoneyTrackerJSONDocument(text: try DataPortability.exportJSON(from: transactions))
            isExportingJSON = true
        } catch {
            operationMessage = "导出失败：\(error.localizedDescription)"
        }
    }

    private func handleExportResult(_ result: Result<URL, Error>) {
        switch result {
        case .success:
            operationMessage = "导出完成。"
        case let .failure(error):
            operationMessage = "导出失败：\(error.localizedDescription)"
        }
    }

    private func handleImportResult(_ result: Result<[URL], Error>) {
        switch result {
        case let .success(urls):
            guard let url = urls.first else {
                operationMessage = "导入失败：没有选择文件。"
                return
            }
            importJSON(from: url)
        case let .failure(error):
            operationMessage = "导入失败：\(error.localizedDescription)"
        }
    }

    private func importJSON(from url: URL) {
        let canAccess = url.startAccessingSecurityScopedResource()
        defer {
            if canAccess {
                url.stopAccessingSecurityScopedResource()
            }
        }

        do {
            let text = try String(contentsOf: url, encoding: .utf8)
            let summary = try DataPortability.importJSON(text, into: modelContext, existing: transactions)
            operationMessage = summary.message
        } catch {
            operationMessage = "导入失败：\(error.localizedDescription)"
        }
    }
}

private struct SettingStat: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title.weight(.bold))
                .foregroundStyle(.blue)
            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(.blue)
                .frame(width: 32, height: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body.weight(.semibold))
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            Spacer()
        }
        .frame(minHeight: 52)
    }
}

private struct AboutRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.body)
            Spacer()
            Text(value)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.trailing)
        }
        .frame(minHeight: 44)
    }
}
