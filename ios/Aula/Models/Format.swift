import Foundation

enum AulaFormat {
    private static let iso: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()

    private static let isoPlain: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime]
        return f
    }()

    static func date(from isoString: String) -> Date? {
        iso.date(from: isoString) ?? isoPlain.date(from: isoString)
    }

    static func formatLessonWhen(_ isoString: String) -> String {
        guard let date = date(from: isoString) else { return isoString }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ru_RU")
        f.dateFormat = "EEE, d MMMM, HH:mm"
        return f.string(from: date)
    }

    static func formatTime(_ isoString: String) -> String {
        guard let date = date(from: isoString) else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ru_RU")
        f.dateFormat = "HH:mm"
        return f.string(from: date)
    }

    static func formatTimeRange(start: String, end: String?) -> String {
        let startDate = date(from: start)
        let endDate = end.flatMap(date(from:)) ?? startDate.map { $0.addingTimeInterval(3600) }
        guard let startDate, let endDate else { return "" }
        let f = DateFormatter()
        f.locale = Locale(identifier: "ru_RU")
        f.dateFormat = "HH:mm"
        return "\(f.string(from: startDate))–\(f.string(from: endDate))"
    }

    static func formatMonth(year: Int, month: Int) -> String {
        var comps = DateComponents()
        comps.year = year
        comps.month = month
        comps.day = 1
        let date = Calendar.current.date(from: comps) ?? Date()
        let f = DateFormatter()
        f.locale = Locale(identifier: "ru_RU")
        f.dateFormat = "LLLL yyyy"
        return f.string(from: date)
    }

    static func formatDayKey(_ key: String) -> String {
        let parts = key.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return key }
        var comps = DateComponents()
        comps.year = parts[0]
        comps.month = parts[1]
        comps.day = parts[2]
        let date = Calendar.current.date(from: comps) ?? Date()
        let f = DateFormatter()
        f.locale = Locale(identifier: "ru_RU")
        f.dateFormat = "EEEE, d MMMM"
        return f.string(from: date)
    }

    static func dayKey(_ date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    static func lessonDayKey(_ isoString: String) -> String {
        dayKey(date(from: isoString) ?? Date())
    }

    static func kindLabel(_ kind: AssignmentKind) -> String {
        kind == .homework ? "на дом" : "в классе"
    }

    static func defaultLessonId(lessons: [Lesson], homeworkLessonIds: Set<String>, now: Date = Date()) -> String? {
        let withHw = lessons.filter { homeworkLessonIds.contains($0.id) }
        if let upcomingHw = withHw.first(where: { (date(from: $0.startsAt) ?? .distantPast) >= now }) {
            return upcomingHw.id
        }
        if let upcoming = lessons.first(where: { (date(from: $0.startsAt) ?? .distantPast) >= now }) {
            return upcoming.id
        }
        if let lastHw = withHw.last { return lastHw.id }
        return lessons.last?.id
    }

    static func calendarCells(year: Int, month: Int, calendar: Calendar = .current) -> [Date] {
        var cal = calendar
        cal.firstWeekday = 2
        var comps = DateComponents()
        comps.year = year
        comps.month = month
        comps.day = 1
        let first = cal.date(from: comps) ?? Date()
        let weekday = cal.component(.weekday, from: first)
        let offset = (weekday + 5) % 7
        let start = cal.date(byAdding: .day, value: -offset, to: first) ?? first
        return (0..<42).compactMap { cal.date(byAdding: .day, value: $0, to: start) }
    }
}
