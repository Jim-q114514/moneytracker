import SwiftData
import SwiftUI
import UniformTypeIdentifiers

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.appLanguage) private var language
    @Query private var transactions: [Transaction]

    @AppStorage("appLanguage") private var appLanguageRawValue = AppLanguage.zhHans.rawValue

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
                    LiquidGlassGroup(spacing: 22) {
                        VStack(alignment: .leading, spacing: 22) {
                            statsCard
                            personalizationSection
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
            }
            .navigationTitle(L10n.text(.settings, language))
            .alert(L10n.text(.clearAllDataTitle, language), isPresented: $showClearAlert) {
                Button(L10n.text(.cancel, language), role: .cancel) {}
                Button(L10n.text(.deleteAll, language), role: .destructive) {
                    for transaction in transactions {
                        modelContext.delete(transaction)
                    }
                    try? modelContext.save()
                }
            } message: {
                Text(L10n.text(.clearAllDataMessage, language))
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
            .alert(L10n.text(.operationResult, language), isPresented: operationAlertBinding) {
                Button(L10n.text(.confirm, language), role: .cancel) {
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
            SettingStat(title: L10n.text(.totalTransactions, language), value: "\(transactions.count)")
            Divider().frame(height: 42)
            SettingStat(title: L10n.text(.trackedMonths, language), value: "\(monthCount)")
        }
        .liquidGlassCard(cornerRadius: 28, prominence: .accent)
    }

    private var personalizationSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle(L10n.text(.appearance, language))

            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Image(systemName: "globe")
                        .font(.headline)
                        .foregroundStyle(.blue)
                        .frame(width: 32, height: 32)

                    VStack(alignment: .leading, spacing: 2) {
                        Text(L10n.text(.language, language))
                            .font(.body.weight(.semibold))
                        Text(L10n.text(.languageDescription, language))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer()

                    Picker(L10n.text(.language, language), selection: $appLanguageRawValue) {
                        ForEach(AppLanguage.allCases) { item in
                            Text(item.displayName).tag(item.rawValue)
                        }
                    }
                    .labelsHidden()
                    .pickerStyle(.menu)
                }
                .frame(minHeight: 56)

                Divider().padding(.leading, 44)

                SettingsRow(
                    icon: "circle.lefthalf.filled",
                    title: L10n.text(.systemAppearance, language),
                    subtitle: L10n.text(.systemAppearanceDescription, language)
                )
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private var dataSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle(L10n.text(.dataMigration, language))

            VStack(spacing: 0) {
                Button {
                    prepareExport()
                } label: {
                    SettingsRow(
                        icon: "square.and.arrow.up",
                        title: L10n.text(.exportJSON, language),
                        subtitle: L10n.text(.exportJSONDescription, language)
                    )
                }
                .buttonStyle(.plain)

                Divider().padding(.leading, 44)

                Button {
                    isImportingJSON = true
                } label: {
                    SettingsRow(
                        icon: "square.and.arrow.down",
                        title: L10n.text(.importJSON, language),
                        subtitle: L10n.text(.importJSONDescription, language)
                    )
                }
                .buttonStyle(.plain)
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private var shortcutSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle(L10n.text(.shortcuts, language))

            VStack(spacing: 0) {
                SettingsRow(
                    icon: "bolt.fill",
                    title: L10n.text(.shortcutTitle, language),
                    subtitle: L10n.text(.shortcutDescription, language)
                )
                Divider().padding(.leading, 44)
                SettingsRow(
                    icon: "link",
                    title: "URL Scheme",
                    subtitle: L10n.text(.urlExample, language)
                )
            }
            .liquidGlassCard(cornerRadius: 24)
        }
    }

    private var dangerSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionTitle(L10n.text(.dangerZone, language))

            Button(role: .destructive) {
                showClearAlert = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "trash.fill")
                        .frame(width: 32, height: 32)
                        .foregroundStyle(.red)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(L10n.text(.clearAllData, language))
                            .font(.body.weight(.semibold))
                            .foregroundStyle(.red)
                        Text(L10n.text(.clearAllDataDescription, language))
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
            sectionTitle(L10n.text(.about, language))

            VStack(spacing: 0) {
                AboutRow(title: L10n.text(.appName, language), value: "MoneyTracker")
                Divider()
                AboutRow(title: L10n.text(.version, language), value: "1.1.0")
                Divider()
                AboutRow(title: L10n.text(.techStack, language), value: "SwiftUI + SwiftData")
                Divider()
                AboutRow(title: L10n.text(.bundleID, language), value: "com.aramco.cycomm")
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
            operationMessage = String(format: L10n.text(.exportFailedFormat, language), error.localizedDescription)
        }
    }

    private func handleExportResult(_ result: Result<URL, Error>) {
        switch result {
        case .success:
            operationMessage = L10n.text(.exportCompleted, language)
        case let .failure(error):
            operationMessage = String(format: L10n.text(.exportFailedFormat, language), error.localizedDescription)
        }
    }

    private func handleImportResult(_ result: Result<[URL], Error>) {
        switch result {
        case let .success(urls):
            guard let url = urls.first else {
                operationMessage = L10n.text(.importFailedNoFile, language)
                return
            }
            importJSON(from: url)
        case let .failure(error):
            operationMessage = String(format: L10n.text(.importFailedFormat, language), error.localizedDescription)
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
            operationMessage = importSummaryMessage(summary)
        } catch {
            operationMessage = String(format: L10n.text(.importFailedFormat, language), error.localizedDescription)
        }
    }

    private func importSummaryMessage(_ summary: ImportSummary) -> String {
        var lines = [
            String(format: L10n.text(.importSuccessFormat, language), summary.success),
            String(format: L10n.text(.importSkippedFormat, language), summary.skipped),
            String(format: L10n.text(.importFailedCountFormat, language), summary.failed)
        ]
        if !summary.errors.isEmpty {
            lines.append(summary.errors.prefix(3).joined(separator: "\n"))
        }
        return lines.joined(separator: "\n")
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
                    .minimumScaleFactor(0.86)
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
