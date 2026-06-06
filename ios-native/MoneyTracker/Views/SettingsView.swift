import SwiftData
import SwiftUI

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var transactions: [Transaction]

    @State private var showClearAlert = false

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
        }
    }

    private var statsCard: some View {
        HStack {
            SettingStat(title: "总交易数", value: "\(transactions.count)")
            Divider().frame(height: 42)
            SettingStat(title: "有记录月份", value: "\(monthCount)")
        }
        .liquidGlassCard(cornerRadius: 28)
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
                AboutRow(title: "版本", value: "1.0.0")
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
