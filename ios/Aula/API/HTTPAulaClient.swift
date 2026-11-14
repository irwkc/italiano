import Foundation

/// HTTP client for `docs/mobile-api.md` (`/api/mobile/v1`).
final class HTTPAulaClient: AulaClient, @unchecked Sendable {
    private let baseURL: URL
    private let session: URLSession
    private let tokenStore: TokenStore
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    init(baseURL: URL, tokenStore: TokenStore, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.tokenStore = tokenStore
        self.session = session
    }

    func login(email: String, password: String) async throws -> AuthSession {
        let body = try encoder.encode(["email": email, "password": password])
        let session = try await send(AuthSession.self, path: MobileAPIPaths.login, method: "POST", body: body, authed: false)
        save(session)
        return session
    }

    func register(inviteToken: String, name: String, email: String, password: String) async throws -> String {
        struct Body: Encodable {
            var inviteToken: String
            var name: String
            var email: String
            var password: String
        }
        struct OK: Decodable { var message: String?; var ok: Bool? }
        let data = try encoder.encode(Body(inviteToken: inviteToken, name: name, email: email, password: password))
        let ok = try await send(OK.self, path: MobileAPIPaths.register, method: "POST", body: data, authed: false)
        return ok.message ?? "Проверьте почту — пришло письмо со ссылкой подтверждения."
    }

    func logout() async throws {
        struct Body: Encodable { var refreshToken: String }
        let refresh = tokenStore.refreshToken
        let data = refresh.flatMap { try? encoder.encode(Body(refreshToken: $0)) }
        do {
            _ = try await sendRaw(path: MobileAPIPaths.logout, method: "POST", body: data, authed: tokenStore.accessToken != nil)
        } catch AulaAPIError.unauthorized {}
        save(nil)
    }

    func me() async throws -> Student {
        try await send(Student.self, path: MobileAPIPaths.me, method: "GET", body: nil, authed: true)
    }

    func orario() async throws -> OrarioPayload {
        let dto = try await send(LessonsDTO.self, path: MobileAPIPaths.lessons, method: "GET", body: nil, authed: true)
        return OrarioPayload(lessons: dto.lessons, meetUrl: dto.meetUrl)
    }

    func compiti(lessonId: String?) async throws -> CompitiPayload {
        var query: [String: String] = [:]
        if let lessonId { query["lessonId"] = lessonId }
        let dto = try await send(HomeworkDTO.self, path: MobileAPIPaths.homework, method: "GET", body: nil, authed: true, query: query)
        let lessons = dto.lessons
        let items = dto.items.map { row -> CompitiItem in
            let assignment = Assignment(
                id: row.id,
                lessonId: row.lessonId,
                activityId: row.activity?.id ?? "",
                kind: row.kind,
                progress: row.progress
            )
            return CompitiItem(
                assignment: assignment,
                activity: row.activity,
                lesson: lessons.first(where: { $0.id == row.lessonId })
            )
        }
        return CompitiPayload(lessons: lessons, selectedLessonId: dto.lessonId ?? lessonId, items: items)
    }

    func saveProgress(assignmentId: String, picks: [String: String?], checked: Bool) async throws -> ProgressResult {
        struct Body: Encodable {
            var picks: [String: String?]
            var checked: Bool
        }
        struct OK: Decodable {
            var correct: Bool?
            var progress: AssignmentProgress?
        }
        let data = try encoder.encode(Body(picks: picks, checked: checked))
        let ok = try await send(OK.self, path: MobileAPIPaths.homeworkItem(assignmentId), method: "PUT", body: data, authed: true)
        return ProgressResult(correct: ok.correct ?? ok.progress?.correct)
    }

    func live() async throws -> LivePayload {
        let dto = try await send(LiveStateDTO.self, path: MobileAPIPaths.live, method: "GET", body: nil, authed: true)
        return dto.payload
    }

    func patchLive(_ patch: LivePatch) async throws -> LivePayload {
        var object: [String: Any] = [:]
        if let picks = patch.picks { object["picks"] = jsonPicks(picks) }
        if let selected = patch.selected { object["selected"] = selected as Any? ?? NSNull() }
        if let checked = patch.checked { object["checked"] = checked }
        if let rev = patch.rev { object["rev"] = rev }
        // Contract: student cannot change index/queue; ignored if present.
        let body = try JSONSerialization.data(withJSONObject: object)
        do {
            let dto = try await send(LiveStateDTO.self, path: MobileAPIPaths.live, method: "PATCH", body: body, authed: true)
            return dto.payload
        } catch let error as AulaAPIError where error == .conflict {
            throw error
        }
    }

    func gloss(word: String) async throws -> String {
        Gloss.lookup(word) ?? "нет перевода"
    }

    private func save(_ session: AuthSession?) {
        tokenStore.accessToken = session?.accessToken
        tokenStore.refreshToken = session?.refreshToken
    }

    private func jsonPicks(_ picks: [String: String?]) -> [String: Any] {
        var out: [String: Any] = [:]
        for (key, value) in picks {
            out[key] = value as Any? ?? NSNull()
        }
        return out
    }

    private func send<T: Decodable>(
        _ type: T.Type,
        path: String,
        method: String,
        body: Data?,
        authed: Bool,
        query: [String: String] = [:],
        allowRefresh: Bool = true
    ) async throws -> T {
        let data = try await sendRaw(path: path, method: method, body: body, authed: authed, query: query, allowRefresh: allowRefresh)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw AulaAPIError.decoding
        }
    }

    private func sendRaw(
        path: String,
        method: String,
        body: Data?,
        authed: Bool,
        query: [String: String] = [:],
        allowRefresh: Bool = true
    ) async throws -> Data {
        let url = try makeURL(path: path, query: query)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if authed {
            guard let token = tokenStore.accessToken, !token.isEmpty else { throw AulaAPIError.unauthorized }
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw AulaAPIError.network("Нет сети. Проверьте соединение.")
        }
        guard let http = response as? HTTPURLResponse else {
            throw AulaAPIError.network("Пустой ответ.")
        }
        if http.statusCode == 401, authed, allowRefresh, tokenStore.refreshToken != nil {
            try await refreshTokens()
            return try await sendRaw(path: path, method: method, body: body, authed: authed, query: query, allowRefresh: false)
        }
        switch http.statusCode {
        case 200...299:
            return data
        default:
            throw mapError(status: http.statusCode, data: data)
        }
    }

    private func refreshTokens() async throws {
        guard let refresh = tokenStore.refreshToken else { throw AulaAPIError.unauthorized }
        struct Body: Encodable { var refreshToken: String }
        let body = try encoder.encode(Body(refreshToken: refresh))
        do {
            let session = try await send(AuthSession.self, path: MobileAPIPaths.refresh, method: "POST", body: body, authed: false, allowRefresh: false)
            save(session)
        } catch {
            save(nil)
            throw AulaAPIError.unauthorized
        }
    }

    private func mapError(status: Int, data: Data) -> AulaAPIError {
        let envelope = try? decoder.decode(ErrorEnvelope.self, from: data)
        let code = envelope?.error?.code ?? ""
        let message = envelope?.error?.message ?? HTTPURLResponse.localizedString(forStatusCode: status)
        switch (status, code) {
        case (401, "invalid_credentials"):
            return .badRequest(message)
        case (401, "email_unverified"):
            return .emailUnverified(message.isEmpty ? "Сначала подтвердите email — ссылка в письме." : message)
        case (401, _):
            return .unauthorized
        case (403, _):
            return .forbidden
        case (404, _):
            return .notFound
        case (409, _):
            return .conflict
        case (429, _):
            return .rateLimited(message.isEmpty ? "Слишком много попыток. Подождите минуту." : message)
        case (400, _):
            return .badRequest(message)
        default:
            return status >= 500 ? .server(message) : .badRequest(message)
        }
    }

    private func makeURL(path: String, query: [String: String]) throws -> URL {
        let root = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        let suffix = path.hasPrefix("/") ? path : "/" + path
        guard var components = URLComponents(string: root + suffix) else { throw AulaAPIError.missingBaseURL }
        if !query.isEmpty {
            components.queryItems = query.map { URLQueryItem(name: $0.key, value: $0.value) }
        }
        guard let url = components.url else { throw AulaAPIError.missingBaseURL }
        return url
    }
}

private struct ErrorEnvelope: Decodable {
    struct Body: Decodable {
        var code: String?
        var message: String?
    }
    var error: Body?
}

private struct LessonsDTO: Decodable {
    var lessons: [Lesson]
    var meetUrl: String?
}

private struct HomeworkDTO: Decodable {
    var lessonId: String?
    var lessons: [Lesson]
    var items: [HomeworkItem]
}

private struct HomeworkItem: Decodable {
    var id: String
    var lessonId: String
    var kind: AssignmentKind
    var activity: Activity?
    var progress: AssignmentProgress?
}

private struct LiveStateDTO: Decodable {
    var studentId: String
    var activityId: String?
    var queue: [QueueItem]
    var index: Int
    var picks: [String: String?]
    var selected: String?
    var checked: Bool
    var rev: Int
    var activity: Activity?
    var meetUrl: String?

    var payload: LivePayload {
        LivePayload(
            live: LiveSession(
                studentId: studentId,
                activityId: activityId,
                queue: queue.map(\.id),
                index: index,
                picks: picks,
                selected: selected,
                checked: checked,
                rev: rev
            ),
            activity: activity,
            queue: queue,
            meetUrl: meetUrl,
            done: activityId == nil && !queue.isEmpty && index >= queue.count - 1
        )
    }
}
