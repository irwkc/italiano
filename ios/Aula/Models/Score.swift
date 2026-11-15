import Foundation

enum Score {
    static func setPick(_ picks: inout [String: String?], key: String, value: String?) {
        picks[key] = Optional.some(value)
    }

    static func quizKey(_ activityId: String) -> String { activityId }
    static func clozeKey(_ index: Int) -> String { String(index) }

    static func splitCloze(_ text: String) -> [String] {
        text.components(separatedBy: "____")
    }

    static func remainingBank(_ bank: [String], picks: [String: String?]) -> [String] {
        var left = bank
        for value in picks.values {
            guard let word = value else { continue }
            if let i = left.firstIndex(of: word) {
                left.remove(at: i)
            }
        }
        return left
    }

    static func isQuizCorrect(_ activity: QuizActivity, picks: [String: String?]) -> Bool {
        picks[quizKey(activity.id)] ?? nil == String(activity.answer)
    }

    static func isClozeSlotCorrect(_ activity: ClozeActivity, picks: [String: String?], index: Int) -> Bool {
        picks[clozeKey(index)] ?? nil == activity.answers[safe: index]
    }

    static func isBoardCorrect(_ activity: Activity, picks: [String: String?]) -> Bool {
        switch activity {
        case .quiz(let quiz):
            return isQuizCorrect(quiz, picks: picks)
        case .cloze(let cloze):
            return cloze.answers.enumerated().allSatisfy { offset, _ in
                isClozeSlotCorrect(cloze, picks: picks, index: offset)
            }
        }
    }

    static func canJudge(_ activity: Activity, picks: [String: String?]) -> Bool {
        switch activity {
        case .quiz(let quiz):
            if let value = picks[quizKey(quiz.id)] ?? nil, !value.isEmpty { return true }
            return false
        case .cloze(let cloze):
            let gaps = max(0, splitCloze(cloze.text).count - 1)
            let filled = picks.values.compactMap { $0 }.count
            return filled >= gaps
        }
    }

    static func publicActivity(_ activity: Activity) -> Activity {
        switch activity {
        case .quiz(var quiz):
            quiz.answer = -1
            return .quiz(quiz)
        case .cloze(var cloze):
            cloze.answers = cloze.answers.map { _ in "" }
            return .cloze(cloze)
        }
    }
}

extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}
