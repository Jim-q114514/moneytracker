import SwiftData
import SwiftUI

@main
struct MoneyTrackerApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(for: Transaction.self)
    }
}
