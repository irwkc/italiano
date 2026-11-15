import Foundation
import SwiftUI
import UIKit
import UserNotifications

@MainActor
final class SessionStore: ObservableObject {
    @Published private(set) var student: Student?
    @Published private(set) var isRestoring = true
    @Published var lastError: String?

    let client: any AulaClient
    private let tokenStore: TokenStore
    private let apnsDefaultsKey = "aula.apnsToken"

    var isLoggedIn: Bool { student != nil }

    init(client: any AulaClient, tokenStore: TokenStore) {
        self.client = client
        self.tokenStore = tokenStore
    }

    func restore() async {
        isRestoring = true
        defer { isRestoring = false }
        guard tokenStore.accessToken != nil || tokenStore.refreshToken != nil else {
            student = nil
            return
        }
        do {
            student = try await client.me()
            if !AppConfig.isUITest { requestPushRegistration() }
        } catch {
            student = nil
            tokenStore.accessToken = nil
            tokenStore.refreshToken = nil
        }
    }

    func login(email: String, password: String) async {
        lastError = nil
        do {
            let session = try await client.login(email: email, password: password)
            tokenStore.accessToken = session.accessToken
            tokenStore.refreshToken = session.refreshToken
            student = session.student
            if !AppConfig.isUITest { requestPushRegistration() }
        } catch {
            lastError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    func register(inviteToken: String, name: String, email: String, password: String) async -> String? {
        lastError = nil
        do {
            return try await client.register(inviteToken: inviteToken, name: name, email: email, password: password)
        } catch {
            lastError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
            return nil
        }
    }

    func logout() async {
        if let token = UserDefaults.standard.string(forKey: apnsDefaultsKey) {
            try? await client.unregisterDevice(apnsToken: token)
            UserDefaults.standard.removeObject(forKey: apnsDefaultsKey)
        }
        try? await client.logout()
        tokenStore.accessToken = nil
        tokenStore.refreshToken = nil
        student = nil
    }

    func requestPushRegistration() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
    }

    func didReceiveAPNsToken(_ hex: String) async {
        UserDefaults.standard.set(hex, forKey: apnsDefaultsKey)
        guard student != nil else { return }
        try? await client.registerDevice(apnsToken: hex)
    }
}

enum AulaClientFactory {
    static func make() -> (client: any AulaClient, tokens: TokenStore) {
        let tokens = KeychainTokenStore()
        if AppConfig.useMock {
            return (MockAulaClient(tokenStore: tokens), tokens)
        }
        return (HTTPAulaClient(baseURL: AppConfig.apiBaseURL, tokenStore: tokens), tokens)
    }
}
