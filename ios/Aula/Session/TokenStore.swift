import Foundation
import Security

protocol TokenStore: AnyObject {
    var accessToken: String? { get set }
    var refreshToken: String? { get set }
}

final class KeychainTokenStore: TokenStore, @unchecked Sendable {
    private let lock = NSLock()
    private let service = "ru.giacomoschiavon.aula"

    var accessToken: String? {
        get { read("access") }
        set { write("access", newValue) }
    }

    var refreshToken: String? {
        get { read("refresh") }
        set { write("refresh", newValue) }
    }

    private func read(_ account: String) -> String? {
        lock.lock()
        defer { lock.unlock() }
        if let data = keychainRead(account), let value = String(data: data, encoding: .utf8), !value.isEmpty {
            return value
        }
        return UserDefaults.standard.string(forKey: "aula.\(account)")
    }

    private func write(_ account: String, _ value: String?) {
        lock.lock()
        defer { lock.unlock() }
        if let value, !value.isEmpty {
            _ = keychainWrite(account, Data(value.utf8))
            UserDefaults.standard.set(value, forKey: "aula.\(account)")
        } else {
            _ = keychainDelete(account)
            UserDefaults.standard.removeObject(forKey: "aula.\(account)")
        }
    }

    private func query(_ account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: "aula.student.\(account)",
            kSecAttrService as String: service,
        ]
    }

    private func keychainRead(_ account: String) -> Data? {
        var q = query(account)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        guard SecItemCopyMatching(q as CFDictionary, &item) == errSecSuccess else { return nil }
        return item as? Data
    }

    private func keychainWrite(_ account: String, _ data: Data) -> Bool {
        _ = keychainDelete(account)
        var q = query(account)
        q[kSecValueData as String] = data
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        return SecItemAdd(q as CFDictionary, nil) == errSecSuccess
    }

    private func keychainDelete(_ account: String) -> Bool {
        SecItemDelete(query(account) as CFDictionary) == errSecSuccess || true
    }
}

final class MemoryTokenStore: TokenStore, @unchecked Sendable {
    private let lock = NSLock()
    private var access: String?
    private var refresh: String?

    var accessToken: String? {
        get { lock.lock(); defer { lock.unlock() }; return access }
        set { lock.lock(); defer { lock.unlock() }; access = newValue }
    }

    var refreshToken: String? {
        get { lock.lock(); defer { lock.unlock() }; return refresh }
        set { lock.lock(); defer { lock.unlock() }; refresh = newValue }
    }
}
