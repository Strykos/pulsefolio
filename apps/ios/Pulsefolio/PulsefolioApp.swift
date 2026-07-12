import SwiftUI

@main
struct PulsefolioApp: App {
    @StateObject private var themeManager = ThemeManager()
    @StateObject private var apiClient = APIClient()

    var body: some Scene {
        WindowGroup {
            SplashView()
                .environmentObject(themeManager)
                .environmentObject(apiClient)
                .preferredColorScheme(themeManager.colorScheme)
        }
    }
}
