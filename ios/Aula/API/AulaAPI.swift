import Foundation

enum AulaAPIError: Equatable, LocalizedError {
    case unauthorized
    case forbidden
    case notFound
    case conflict
    case badRequest(String)
    case server(String)
    case network(String)
    case decoding
    case missingBaseURL
    case emailUnverified(String)
    case rateLimited(String)

    var errorDescription: String? {
        switch self {
        case .unauthorized: return "Войдите в кабинет."
        case .forbidden: return "Нет доступа."
        case .notFound: return "Не найдено."
        case .conflict: return "Состояние на сервере изменилось. Обновляем."
        case .badRequest(let text), .server(let text), .network(let text):
            return text
        case .decoding: return "Непонятный ответ сервера."
        case .missingBaseURL: return "Не задан адрес API."
        case .emailUnverified(let text): return text
        case .rateLimited(let text): return text
        }
    }
}

/// Paths relative to `https://…/api/mobile/v1` — see `docs/mobile-api.md`.
enum MobileAPIPaths {
    static let login = "/auth/login"
    static let refresh = "/auth/refresh"
    static let logout = "/auth/logout"
    static let register = "/auth/register"
    static let me = "/me"
    static let lessons = "/lessons"
    static let homework = "/homework"
    static func homeworkItem(_ id: String) -> String { "/homework/\(id)" }
    static let live = "/live"
    static let devices = "/devices"
}

protocol AulaClient: AnyObject {
    func login(email: String, password: String) async throws -> AuthSession
    func register(inviteToken: String, name: String, email: String, password: String) async throws -> String
    func logout() async throws
    func me() async throws -> Student
    func orario() async throws -> OrarioPayload
    func compiti(lessonId: String?) async throws -> CompitiPayload
    func saveProgress(assignmentId: String, picks: [String: String?], checked: Bool) async throws -> ProgressResult
    func live() async throws -> LivePayload
    func patchLive(_ patch: LivePatch) async throws -> LivePayload
    func gloss(word: String) async throws -> String
}

struct LivePatch: Equatable, Sendable {
    var picks: [String: String?]?
    var selected: String??
    var checked: Bool?
    var index: Int?
    var rev: Int?
}

enum AppConfig {
    static var useMock: Bool {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "AULA_USE_MOCK") as? String ?? "YES")
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .uppercased()
        return raw != "NO" && raw != "0" && raw != "FALSE"
    }

    static var apiBaseURL: URL {
        let raw = (Bundle.main.object(forInfoDictionaryKey: "AULA_API_BASE_URL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if let raw, let url = URL(string: raw), url.scheme != nil {
            return url
        }
        return URL(string: "https://giacomoschiavon.ru/api/mobile/v1")!
    }
}
