import SwiftData
import SwiftUI

struct RootTabView: View {
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        TabView {
            TransactionsView()
                .tabItem {
                    Label("账单", systemImage: "receipt")
                }

            StatisticsView()
                .tabItem {
                    Label("统计", systemImage: "chart.pie")
                }

            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape")
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
