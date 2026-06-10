import SwiftData
import SwiftUI

@main
struct MoneyTrackerApp: App {
    @AppStorage("appLanguage") private var appLanguageRawValue = AppLanguage.zhHans.rawValue

    private var appLanguage: AppLanguage {
        AppLanguage(rawValue: appLanguageRawValue) ?? .zhHans
    }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .environment(\.appLanguage, appLanguage)
                .environment(\.locale, Locale(identifier: appLanguage.localeIdentifier))
                .preferredColorScheme(nil)
        }
        .modelContainer(for: Transaction.self)
    }
}
