import SwiftUI

@main
struct AulaApp: App {
    @UIApplicationDelegateAdaptor(AulaAppDelegate.self) private var appDelegate
    @StateObject private var session: SessionStore

    init() {
        AulaFonts.register()
        if AppConfig.isUITest {
            let tokens = KeychainTokenStore()
            tokens.accessToken = nil
            tokens.refreshToken = nil
        }
        let pair = AulaClientFactory.make()
        let store = SessionStore(client: pair.client, tokenStore: pair.tokens)
        _session = StateObject(wrappedValue: store)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(session)
                .preferredColorScheme(.light)
                .onAppear { appDelegate.session = session }
        }
    }
}
