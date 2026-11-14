import XCTest
@testable import Aula

final class ScoreTests: XCTestCase {
    func testQuizKeyAndCorrect() {
        let quiz = QuizActivity(
            id: "quiz-ciao",
            title: "Saluti",
            topic: "Saluti",
            prompt: "Come?",
            options: ["Ciao!", "Arrivederci"],
            answer: 0,
            image: nil
        )
        XCTAssertEqual(Score.quizKey(quiz.id), "quiz-ciao")
        XCTAssertTrue(Score.isQuizCorrect(quiz, picks: ["quiz-ciao": "0"]))
        XCTAssertFalse(Score.isQuizCorrect(quiz, picks: ["quiz-ciao": "1"]))
        XCTAssertFalse(Score.canJudge(.quiz(quiz), picks: [:]))
        XCTAssertTrue(Score.canJudge(.quiz(quiz), picks: ["quiz-ciao": "1"]))
    }

    func testClozeSlots() {
        let cloze = ClozeActivity(
            id: "cloze-mattina",
            title: "La routine",
            topic: "Routine",
            prompt: nil,
            text: "Ogni mattina ____ sveglio. Poi ____ colazione.",
            bank: ["mi", "faccio", "sono"],
            answers: ["mi", "faccio"],
            image: nil
        )
        XCTAssertEqual(Score.splitCloze(cloze.text).count, 3)
        var picks: [String: String?] = [:]
        Score.setPick(&picks, key: "0", value: "mi")
        Score.setPick(&picks, key: "1", value: "faccio")
        XCTAssertTrue(Score.isBoardCorrect(.cloze(cloze), picks: picks))
        Score.setPick(&picks, key: "1", value: "sono")
        XCTAssertFalse(Score.isBoardCorrect(.cloze(cloze), picks: picks))
        let left = Score.remainingBank(cloze.bank, picks: picks)
        XCTAssertFalse(left.contains("mi"))
        XCTAssertTrue(left.contains("faccio"))
    }

    func testPublicActivityStripsKeys() {
        let quiz = QuizActivity(id: "q", title: "t", topic: "t", prompt: "p", options: ["a"], answer: 2, image: nil)
        if case .quiz(let publicQuiz) = Score.publicActivity(.quiz(quiz)) {
            XCTAssertEqual(publicQuiz.answer, -1)
        } else {
            XCTFail("expected quiz")
        }
    }

    func testSetPickKeepsNull() {
        var picks: [String: String?] = [:]
        Score.setPick(&picks, key: "q", value: nil)
        XCTAssertTrue(picks.keys.contains("q"))
        XCTAssertNil(picks["q"] ?? nil)
    }
}

final class FormatTests: XCTestCase {
    func testDayKeyAndRange() {
        let iso = "2026-11-06T13:00:00.000Z"
        XCTAssertEqual(AulaFormat.lessonDayKey(iso).count, 10)
        XCTAssertFalse(AulaFormat.formatTimeRange(start: iso, end: nil).isEmpty)
        XCTAssertEqual(AulaFormat.kindLabel(.homework), "на дом")
        XCTAssertEqual(AulaFormat.kindLabel(.classwork), "в классе")
        let cells = AulaFormat.calendarCells(year: 2026, month: 11)
        XCTAssertEqual(cells.count, 42)
    }

    func testDefaultLessonPrefersUpcomingHomework() {
        let lessons = [
            Lesson(id: "past", studentId: "st", startsAt: "2026-10-01T13:00:00.000Z", endsAt: nil, title: "A"),
            Lesson(id: "future-hw", studentId: "st", startsAt: "2026-12-01T13:00:00.000Z", endsAt: nil, title: "B"),
            Lesson(id: "future", studentId: "st", startsAt: "2026-12-08T13:00:00.000Z", endsAt: nil, title: "C"),
        ]
        let now = AulaFormat.date(from: "2026-11-14T00:00:00.000Z")!
        let id = AulaFormat.defaultLessonId(lessons: lessons, homeworkLessonIds: ["future-hw"], now: now)
        XCTAssertEqual(id, "future-hw")
    }
}

final class GlossTests: XCTestCase {
    func testLookupAndSplit() {
        XCTAssertEqual(Gloss.lookup("Ciao"), "привет")
        XCTAssertEqual(Gloss.lookup("caffè"), "кофе")
        let parts = Gloss.splitWords("Ciao, amico!")
        XCTAssertTrue(parts.contains("Ciao"))
        XCTAssertTrue(parts.contains("amico"))
        XCTAssertTrue(Gloss.isWord("Vespa"))
        XCTAssertFalse(Gloss.isWord(", "))
    }
}

final class DecodingTests: XCTestCase {
    func testActivityJSON() throws {
        let raw = """
        {"id":"quiz-ciao","type":"quiz","title":"Saluti","topic":"Saluti","prompt":"Come?","options":["Ciao!","Piacere."],"answer":0}
        """.data(using: .utf8)!
        let activity = try JSONDecoder().decode(Activity.self, from: raw)
        XCTAssertEqual(activity.id, "quiz-ciao")
        if case .quiz(let quiz) = activity {
            XCTAssertEqual(quiz.answer, 0)
        } else {
            XCTFail("quiz")
        }
    }

    func testPublicActivityOmitsAnswer() throws {
        let raw = """
        {"id":"quiz-ciao","type":"quiz","title":"Saluti","topic":"Saluti","prompt":"Come?","options":["Ciao!"]}
        """.data(using: .utf8)!
        let activity = try JSONDecoder().decode(Activity.self, from: raw)
        XCTAssertTrue(activity.answersStripped)
    }
}

final class MockClientTests: XCTestCase {
    func testStudentCabinet() async throws {
        let client = MockAulaClient()
        do {
            _ = try await client.me()
            XCTFail("expected unauthorized")
        } catch AulaAPIError.unauthorized {}

        do {
            _ = try await client.login(email: "nope@aula.test", password: "x")
            XCTFail("expected bad login")
        } catch let error as AulaAPIError {
            guard case .badRequest = error else {
                XCTFail("unexpected \(error)")
                return
            }
        }

        let session = try await client.login(email: MockAulaClient.annaEmail, password: MockAulaClient.demoPassword)
        XCTAssertEqual(session.student.name, "Anna")
        let me = try await client.me()
        XCTAssertEqual(me.id, "st-anna")

        let orario = try await client.orario()
        XCTAssertGreaterThan(orario.lessons.count, 0)
        XCTAssertNotNil(orario.meetUrl)

        let live = try await client.live()
        XCTAssertEqual(live.activity?.id, "quiz-ciao")

        let compiti = try await client.compiti(lessonId: "l-anna-1")
        XCTAssertEqual(compiti.items.count, 1)
        let assignmentId = try XCTUnwrap(compiti.items.first?.id)
        var picks: [String: String?] = [:]
        Score.setPick(&picks, key: "0", value: "mi")
        Score.setPick(&picks, key: "1", value: "faccio")
        let result = try await client.saveProgress(assignmentId: assignmentId, picks: picks, checked: true)
        XCTAssertEqual(result.correct, true)

        let gloss = try await client.gloss(word: "casa")
        XCTAssertEqual(gloss, "дом")
        try await client.logout()
        do {
            _ = try await client.me()
            XCTFail("logged out")
        } catch AulaAPIError.unauthorized {}
    }
}
