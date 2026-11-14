import Foundation

struct Student: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var name: String
    var email: String?
    var emailVerifiedAt: String?
}

struct AuthSession: Codable, Equatable, Sendable {
    var accessToken: String
    var refreshToken: String
    var expiresIn: Int?
    var tokenType: String?
    var student: Student

    enum CodingKeys: String, CodingKey {
        case accessToken, refreshToken, expiresIn, tokenType, student, token
    }

    init(accessToken: String, refreshToken: String, expiresIn: Int? = nil, tokenType: String? = "Bearer", student: Student) {
        self.accessToken = accessToken
        self.refreshToken = refreshToken
        self.expiresIn = expiresIn
        self.tokenType = tokenType
        self.student = student
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        accessToken = try c.decodeIfPresent(String.self, forKey: .accessToken) ?? c.decodeIfPresent(String.self, forKey: .token) ?? ""
        refreshToken = try c.decodeIfPresent(String.self, forKey: .refreshToken) ?? ""
        expiresIn = try c.decodeIfPresent(Int.self, forKey: .expiresIn)
        tokenType = try c.decodeIfPresent(String.self, forKey: .tokenType)
        student = try c.decode(Student.self, forKey: .student)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(accessToken, forKey: .accessToken)
        try c.encode(refreshToken, forKey: .refreshToken)
        try c.encodeIfPresent(expiresIn, forKey: .expiresIn)
        try c.encodeIfPresent(tokenType, forKey: .tokenType)
        try c.encode(student, forKey: .student)
    }
}

struct Lesson: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var studentId: String?
    var startsAt: String
    var endsAt: String?
    var title: String
}

enum AssignmentKind: String, Codable, Sendable {
    case homework
    case classwork
}

struct AssignmentProgress: Codable, Equatable, Sendable {
    var picks: [String: String?]
    var checked: Bool
    var correct: Bool
    var updatedAt: String
}

struct Assignment: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var lessonId: String
    var activityId: String
    var kind: AssignmentKind
    var progress: AssignmentProgress?
}

struct QuizActivity: Equatable, Identifiable, Sendable {
    var id: String
    var title: String
    var topic: String
    var prompt: String
    var options: [String]
    /// `-1` when the server stripped the answer key.
    var answer: Int
    var image: String?
}

extension QuizActivity: Codable {
    enum CodingKeys: String, CodingKey {
        case id, title, topic, prompt, options, answer, image, type
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        topic = try c.decodeIfPresent(String.self, forKey: .topic) ?? ""
        prompt = try c.decodeIfPresent(String.self, forKey: .prompt) ?? ""
        options = try c.decodeIfPresent([String].self, forKey: .options) ?? []
        answer = try c.decodeIfPresent(Int.self, forKey: .answer) ?? -1
        image = try c.decodeIfPresent(String.self, forKey: .image)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode("quiz", forKey: .type)
        try c.encode(title, forKey: .title)
        try c.encode(topic, forKey: .topic)
        try c.encode(prompt, forKey: .prompt)
        try c.encode(options, forKey: .options)
        try c.encode(answer, forKey: .answer)
        try c.encodeIfPresent(image, forKey: .image)
    }
}

struct ClozeActivity: Equatable, Identifiable, Sendable {
    var id: String
    var title: String
    var topic: String
    var prompt: String?
    var text: String
    var bank: [String]
    /// Empty strings when the server stripped keys.
    var answers: [String]
    var image: String?
}

extension ClozeActivity: Codable {
    enum CodingKeys: String, CodingKey {
        case id, title, topic, prompt, text, bank, answers, image, type
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        title = try c.decode(String.self, forKey: .title)
        topic = try c.decodeIfPresent(String.self, forKey: .topic) ?? ""
        prompt = try c.decodeIfPresent(String.self, forKey: .prompt)
        text = try c.decodeIfPresent(String.self, forKey: .text) ?? ""
        bank = try c.decodeIfPresent([String].self, forKey: .bank) ?? []
        answers = try c.decodeIfPresent([String].self, forKey: .answers) ?? []
        image = try c.decodeIfPresent(String.self, forKey: .image)
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode("cloze", forKey: .type)
        try c.encode(title, forKey: .title)
        try c.encode(topic, forKey: .topic)
        try c.encodeIfPresent(prompt, forKey: .prompt)
        try c.encode(text, forKey: .text)
        try c.encode(bank, forKey: .bank)
        try c.encode(answers, forKey: .answers)
        try c.encodeIfPresent(image, forKey: .image)
    }
}

enum Activity: Equatable, Identifiable, Sendable {
    case quiz(QuizActivity)
    case cloze(ClozeActivity)

    var id: String {
        switch self {
        case .quiz(let a): return a.id
        case .cloze(let a): return a.id
        }
    }

    var title: String {
        switch self {
        case .quiz(let a): return a.title
        case .cloze(let a): return a.title
        }
    }

    var image: String? {
        switch self {
        case .quiz(let a): return a.image
        case .cloze(let a): return a.image
        }
    }

    var typeName: String {
        switch self {
        case .quiz: return "quiz"
        case .cloze: return "cloze"
        }
    }

    var answersStripped: Bool {
        switch self {
        case .quiz(let a): return a.answer < 0
        case .cloze(let a): return a.answers.isEmpty || a.answers.allSatisfy(\.isEmpty)
        }
    }
}

extension Activity: Codable {
    private enum CodingKeys: String, CodingKey { case type }

    init(from decoder: Decoder) throws {
        let probe = try decoder.container(keyedBy: CodingKeys.self)
        let type = try probe.decode(String.self, forKey: .type)
        switch type {
        case "quiz":
            self = .quiz(try QuizActivity(from: decoder))
        case "cloze":
            self = .cloze(try ClozeActivity(from: decoder))
        default:
            throw DecodingError.dataCorruptedError(forKey: .type, in: probe, debugDescription: "unknown activity type")
        }
    }

    func encode(to encoder: Encoder) throws {
        switch self {
        case .quiz(let quiz):
            try quiz.encode(to: encoder)
        case .cloze(let cloze):
            try cloze.encode(to: encoder)
        }
    }
}

struct BoardState: Equatable, Sendable {
    var picks: [String: String?]
    var selected: String?
    var checked: Bool

    static let empty = BoardState(picks: [:], selected: nil, checked: false)
}

struct LiveSession: Codable, Equatable, Sendable {
    var studentId: String
    var activityId: String?
    var queue: [String]
    var index: Int
    var picks: [String: String?]
    var selected: String?
    var checked: Bool
    var rev: Int

    var board: BoardState {
        BoardState(picks: picks, selected: selected, checked: checked)
    }
}

struct QueueItem: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var title: String
}

struct LivePayload: Equatable, Sendable {
    var live: LiveSession
    var activity: Activity?
    var queue: [QueueItem]
    var meetUrl: String?
    var done: Bool
}

struct OrarioPayload: Equatable, Sendable {
    var lessons: [Lesson]
    var meetUrl: String?
}

struct CompitiItem: Equatable, Identifiable, Sendable {
    var assignment: Assignment
    var activity: Activity?
    var lesson: Lesson?
    var id: String { assignment.id }
}

struct CompitiPayload: Equatable, Sendable {
    var lessons: [Lesson]
    var selectedLessonId: String?
    var items: [CompitiItem]
}

struct ProgressResult: Equatable, Sendable {
    var correct: Bool?
}

struct APIErrorBody: Codable, Sendable {
    var error: String?
    var message: String?
}
