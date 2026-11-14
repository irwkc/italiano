import Foundation

/// In-memory cabinet that mirrors `learn/data/seed.ts` + student login from the developer branch.
final class MockAulaClient: AulaClient, @unchecked Sendable {
    static let annaEmail = "anna@aula.test"
    static let pavelEmail = "pavel@aula.test"
    static let demoPassword = "aula-demo-8"

    private let lock = NSLock()
    private let tokenStore: TokenStore
    private var students: [Student]
    private var passwords: [String: String]
    private var lessons: [Lesson]
    private var assignments: [Assignment]
    private var activities: [String: Activity]
    private var live: [String: LiveSession]
    private var meetUrl: String
    private var done: [String: Bool] = [:]

    init(tokenStore: TokenStore = MemoryTokenStore()) {
        self.tokenStore = tokenStore
        let seed = MockSeed.make()
        self.students = seed.students
        self.passwords = seed.passwords
        self.lessons = seed.lessons
        self.assignments = seed.assignments
        self.activities = seed.activities
        self.live = seed.live
        self.meetUrl = seed.meetUrl
    }

    func register(inviteToken: String, name: String, email: String, password: String) async throws -> String {
        try await pause(ms: 120)
        if inviteToken.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || name.isEmpty || password.count < 8 {
            throw AulaAPIError.badRequest("Имя, email и пароль от 8 символов.")
        }
        return "Проверьте почту — пришло письмо со ссылкой подтверждения."
    }

    func login(email: String, password: String) async throws -> AuthSession {
        try await pause()
        let email = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return try locked {
            guard let student = students.first(where: { $0.email == email }),
                  passwords[email] == password
            else {
                throw AulaAPIError.badRequest("Email или пароль не подошли.")
            }
            let token = "mock.\(student.id)"
            tokenStore.accessToken = token
            tokenStore.refreshToken = "refresh.\(student.id)"
            return AuthSession(accessToken: token, refreshToken: "refresh.\(student.id)", expiresIn: 900, student: student)
        }
    }

    func logout() async throws {
        try await pause(ms: 80)
        locked {
            tokenStore.accessToken = nil
            tokenStore.refreshToken = nil
        }
    }

    func me() async throws -> Student {
        try await pause(ms: 80)
        return try locked {
            try currentStudent()
        }
    }

    func orario() async throws -> OrarioPayload {
        try await pause()
        return try locked {
            let student = try currentStudent()
            let mine = lessons.filter { $0.studentId == student.id }.sorted { $0.startsAt < $1.startsAt }
            return OrarioPayload(lessons: mine, meetUrl: meetUrl)
        }
    }

    func compiti(lessonId: String?) async throws -> CompitiPayload {
        try await pause()
        return try locked {
            let student = try currentStudent()
            let mine = lessons.filter { $0.studentId == student.id }.sorted { $0.startsAt < $1.startsAt }
            let hwIds = Set(assignments.filter { $0.kind == .homework }.map(\.lessonId))
            let selected = lessonId.flatMap { id in mine.contains(where: { $0.id == id }) ? id : nil }
                ?? AulaFormat.defaultLessonId(lessons: mine, homeworkLessonIds: hwIds)
            let rows = assignments.filter { $0.lessonId == selected && $0.kind == .homework }
            let items = rows.map { assignment in
                CompitiItem(
                    assignment: assignment,
                    activity: activities[assignment.activityId].map(Score.publicActivity),
                    lesson: mine.first(where: { $0.id == assignment.lessonId })
                )
            }
            return CompitiPayload(lessons: mine, selectedLessonId: selected, items: items)
        }
    }

    func saveProgress(assignmentId: String, picks: [String: String?], checked: Bool) async throws -> ProgressResult {
        try await pause(ms: 120)
        return try locked {
            let student = try currentStudent()
            guard let index = assignments.firstIndex(where: { $0.id == assignmentId }) else {
                throw AulaAPIError.notFound
            }
            let assignment = assignments[index]
            guard let lesson = lessons.first(where: { $0.id == assignment.lessonId }), lesson.studentId == student.id else {
                throw AulaAPIError.forbidden
            }
            guard let activity = activities[assignment.activityId] else {
                throw AulaAPIError.badRequest("Материал удалён.")
            }
            var correct = false
            if checked {
                if !Score.canJudge(activity, picks: picks) {
                    throw AulaAPIError.badRequest("Сначала выберите ответ.")
                }
                correct = Score.isBoardCorrect(activity, picks: picks)
            }
            assignments[index].progress = AssignmentProgress(
                picks: picks,
                checked: checked,
                correct: checked ? correct : false,
                updatedAt: ISO8601DateFormatter().string(from: Date())
            )
            return ProgressResult(correct: checked ? correct : nil)
        }
    }

    func live() async throws -> LivePayload {
        try await pause(ms: 90)
        return try locked { try livePayload() }
    }

    func patchLive(_ patch: LivePatch) async throws -> LivePayload {
        try await pause(ms: 80)
        return try locked {
            let student = try currentStudent()
            var session = live[student.id] ?? LiveSession(
                studentId: student.id,
                activityId: nil,
                queue: [],
                index: 0,
                picks: [:],
                selected: nil,
                checked: false,
                rev: 0
            )
            if let rev = patch.rev, rev < session.rev {
                throw AulaAPIError.conflict
            }
            if let index = patch.index {
                showLiveAt(&session, index: index)
            }
            if let picks = patch.picks { session.picks = picks }
            if let selected = patch.selected { session.selected = selected }
            if let checked = patch.checked { session.checked = checked }
            session.rev += 1
            live[student.id] = session
            if patch.index != nil, session.activityId == nil {
                done[student.id] = true
            }
            return try livePayload()
        }
    }

    func liveNext(rev: Int?) async throws -> LivePayload {
        try await pause(ms: 80)
        return try locked {
            let student = try currentStudent()
            var session = live[student.id] ?? LiveSession(
                studentId: student.id,
                activityId: nil,
                queue: [],
                index: 0,
                picks: [:],
                selected: nil,
                checked: false,
                rev: 0
            )
            if let rev, rev < session.rev {
                throw AulaAPIError.conflict
            }
            if session.index + 1 < session.queue.count {
                showLiveAt(&session, index: session.index + 1)
                session.rev += 1
                live[student.id] = session
            } else {
                done[student.id] = true
            }
            return try livePayload()
        }
    }

    func gloss(word: String) async throws -> String {
        try await pause(ms: 40)
        return Gloss.lookup(word) ?? "нет перевода"
    }

    func registerDevice(apnsToken: String) async throws {
        try await pause(ms: 40)
        _ = try locked { try currentStudent() }
    }

    func unregisterDevice(apnsToken: String) async throws {
        try await pause(ms: 40)
    }

    private func livePayload() throws -> LivePayload {
        let student = try currentStudent()
        var session = live[student.id] ?? LiveSession(
            studentId: student.id,
            activityId: nil,
            queue: [],
            index: 0,
            picks: [:],
            selected: nil,
            checked: false,
            rev: 0
        )
        if session.queue.isEmpty {
            session.activityId = nil
        } else {
            session.index = min(max(0, session.index), session.queue.count - 1)
            session.activityId = session.queue[session.index]
        }
        let activity = session.activityId.flatMap { activities[$0] }.map(Score.publicActivity)
        let queue = session.queue.map { QueueItem(id: $0, title: activities[$0]?.title ?? $0) }
        let hasNext = session.activityId != nil && session.index + 1 < session.queue.count
        return LivePayload(
            live: session,
            activity: activity,
            queue: queue,
            meetUrl: meetUrl,
            done: done[student.id] ?? false,
            hasNext: hasNext
        )
    }

    private func showLiveAt(_ session: inout LiveSession, index: Int) {
        if session.queue.isEmpty {
            session.index = 0
            session.activityId = nil
            session.picks = [:]
            session.selected = nil
            session.checked = false
            return
        }
        let next = min(max(0, index), session.queue.count - 1)
        if index >= session.queue.count {
            session.activityId = nil
            session.picks = [:]
            session.selected = nil
            session.checked = false
            return
        }
        session.index = next
        session.activityId = session.queue[next]
        session.picks = [:]
        session.selected = nil
        session.checked = false
    }

    private func currentStudent() throws -> Student {
        guard let token = tokenStore.accessToken, token.hasPrefix("mock.") else {
            throw AulaAPIError.unauthorized
        }
        let id = String(token.dropFirst("mock.".count))
        guard let student = students.first(where: { $0.id == id }) else {
            throw AulaAPIError.unauthorized
        }
        return student
    }

    private func locked<T>(_ body: () throws -> T) rethrows -> T {
        lock.lock()
        defer { lock.unlock() }
        return try body()
    }

    private func pause(ms: UInt64 = 180) async throws {
        try await Task.sleep(nanoseconds: ms * 1_000_000)
    }
}

private enum MockSeed {
    static func make() -> (
        students: [Student],
        passwords: [String: String],
        lessons: [Lesson],
        assignments: [Assignment],
        activities: [String: Activity],
        live: [String: LiveSession],
        meetUrl: String
    ) {
        let students = [
            Student(id: "st-anna", name: "Anna", email: MockAulaClient.annaEmail),
            Student(id: "st-pavel", name: "Pavel", email: MockAulaClient.pavelEmail),
        ]
        let passwords = [
            MockAulaClient.annaEmail: MockAulaClient.demoPassword,
            MockAulaClient.pavelEmail: MockAulaClient.demoPassword,
        ]
        let activities: [Activity] = [
            .quiz(QuizActivity(
                id: "quiz-ciao", title: "Saluti", topic: "Saluti",
                prompt: "Come saluti un amico per strada?",
                options: ["Ciao!", "Arrivederci, dottore.", "Buonasera, professore.", "Piacere."],
                answer: 0, image: "aula-quaderno"
            )),
            .quiz(QuizActivity(
                id: "quiz-stai", title: "Come stai?", topic: "Saluti",
                prompt: "Qualcuno chiede: «Come stai?». Cosa rispondi?",
                options: ["Bene, grazie.", "Io ho fame.", "È buono.", "A dopo."],
                answer: 0, image: nil
            )),
            .cloze(ClozeActivity(
                id: "cloze-mattina", title: "La routine", topic: "Routine",
                prompt: "Completa. Una parola per ogni spazio.",
                text: "Ogni mattina ____ sveglio alle sette. Poi ____ colazione e esco di casa.",
                bank: ["mi", "faccio", "sono", "ho", "vado"],
                answers: ["mi", "faccio"],
                image: "aula-caffe"
            )),
            .quiz(QuizActivity(
                id: "quiz-essere", title: "Essere o avere", topic: "Essere e avere",
                prompt: "Io ____ italiano.",
                options: ["sono", "ho", "vado", "faccio"],
                answer: 0, image: "aula-quaderno"
            )),
            .quiz(QuizActivity(
                id: "quiz-buono", title: "Bene o buono", topic: "Essere e avere",
                prompt: "Il caffè è ____.",
                options: ["buono", "bene", "buona", "benissimo"],
                answer: 0, image: "aula-caffe"
            )),
            .cloze(ClozeActivity(
                id: "cloze-avere", title: "Avere", topic: "Essere e avere",
                prompt: "Completa con il verbo giusto.",
                text: "Anna ____ una Vespa rossa. Io ____ due biciclette.",
                bank: ["ha", "ho", "è", "sono", "va"],
                answers: ["ha", "ho"],
                image: "aula-vespa"
            )),
            .quiz(QuizActivity(
                id: "quiz-citta", title: "In città", topic: "In città",
                prompt: "Dove prendi un caffè in Italia?",
                options: ["Al bar.", "In stazione, sempre.", "Solo in piazza.", "A scuola."],
                answer: 0, image: "aula-piazza"
            )),
            .cloze(ClozeActivity(
                id: "cloze-andare", title: "Andare", topic: "In città",
                prompt: "Completa. Andare o venire, e il posto.",
                text: "Domani noi ____ al ____ per vedere un film.",
                bank: ["andiamo", "veniamo", "cinema", "mercato", "stazione"],
                answers: ["andiamo", "cinema"],
                image: "aula-piazza"
            )),
            .quiz(QuizActivity(
                id: "quiz-venire", title: "Venire", topic: "In città",
                prompt: "Marco, ____ a casa mia stasera?",
                options: ["vieni", "vai", "sei", "hai"],
                answer: 0, image: "aula-vespa"
            )),
        ]
        let byId = Dictionary(uniqueKeysWithValues: activities.map { ($0.id, $0) })
        let lessons: [Lesson] = [
            Lesson(id: "l-anna-0", studentId: "st-anna", startsAt: "2026-10-16T13:00:00.000Z", endsAt: nil, title: "Primi saluti"),
            Lesson(id: "l-anna-1", studentId: "st-anna", startsAt: "2026-10-23T13:00:00.000Z", endsAt: nil, title: "Saluti e routine"),
            Lesson(id: "l-anna-2", studentId: "st-anna", startsAt: "2026-10-30T13:00:00.000Z", endsAt: nil, title: "Essere e avere"),
            Lesson(id: "l-anna-3", studentId: "st-anna", startsAt: "2026-11-06T13:00:00.000Z", endsAt: nil, title: "In città"),
            Lesson(id: "l-anna-4", studentId: "st-anna", startsAt: "2026-11-20T13:00:00.000Z", endsAt: nil, title: "Ripasso"),
            Lesson(id: "l-pavel-0", studentId: "st-pavel", startsAt: "2026-10-17T08:00:00.000Z", endsAt: nil, title: "Primi saluti"),
            Lesson(id: "l-pavel-1", studentId: "st-pavel", startsAt: "2026-10-24T08:00:00.000Z", endsAt: nil, title: "Saluti e routine"),
            Lesson(id: "l-pavel-2", studentId: "st-pavel", startsAt: "2026-11-21T08:00:00.000Z", endsAt: nil, title: "In città"),
        ]
        let assignments: [Assignment] = [
            Assignment(id: "a3", lessonId: "l-anna-1", activityId: "cloze-mattina", kind: .homework, progress: nil),
            Assignment(id: "a6", lessonId: "l-anna-2", activityId: "cloze-avere", kind: .homework, progress: nil),
            Assignment(id: "a9", lessonId: "l-anna-3", activityId: "quiz-venire", kind: .homework, progress: nil),
            Assignment(id: "a10", lessonId: "l-anna-4", activityId: "quiz-ciao", kind: .homework, progress: nil),
            Assignment(id: "p3", lessonId: "l-pavel-1", activityId: "cloze-mattina", kind: .homework, progress: nil),
        ]
        var live: [String: LiveSession] = [:]
        live["st-anna"] = LiveSession(
            studentId: "st-anna",
            activityId: "quiz-ciao",
            queue: ["quiz-ciao", "cloze-mattina"],
            index: 0,
            picks: [:],
            selected: nil,
            checked: false,
            rev: 1
        )
        live["st-pavel"] = LiveSession(
            studentId: "st-pavel",
            activityId: nil,
            queue: [],
            index: 0,
            picks: [:],
            selected: nil,
            checked: false,
            rev: 0
        )
        return (students, passwords, lessons, assignments, byId, live, "https://meet.google.com/gia-como-aula")
    }
}
