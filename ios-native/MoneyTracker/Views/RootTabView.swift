import SwiftData
import SwiftUI

struct RootTabView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.appLanguage) private var language

    var body: some View {
        TabView {
            TransactionsView()
                .tabItem {
                    Label(L10n.text(.transactions, language), systemImage: "receipt")
                }

            StatisticsView()
                .tabItem {
                    Label(L10n.text(.statistics, language), systemImage: "chart.pie")
                }

            SettingsView()
                .tabItem {
                    Label(L10n.text(.settings, language), systemImage: "gearshape")
                }
        }
        .tint(.blue)
        .onOpenURL { url in
            guard let transaction = URLTransactionParser.transaction(from: url) else {
                return
            }
            modelContext.insert(transaction)
            try? modelContext.save()
        }
    }
}
