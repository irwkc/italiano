import SwiftUI

struct OrarioView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var payload: OrarioPayload?
    @State private var error: String?
    @State private var year: Int = Calendar.current.component(.year, from: Date())
    @State private var month: Int = Calendar.current.component(.month, from: Date())
    @State private var selected: String?
    @State private var today: String = AulaFormat.dayKey(Date())

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                AulaKicker(text: "Calendario")
                ScriptTitle(text: "Orario")
                meet
                if let error {
                    AulaStatusView(kind: .error(error, retry: { Task { await load() } }))
                } else if let payload {
                    if payload.lessons.isEmpty {
                        AulaStatusView(kind: .empty("Пока нет занятий в календаре."))
                    }
                    calendar(lessons: payload.lessons)
                } else {
                    AulaStatusView(kind: .loading("Календарь…"))
                }
            }
            .padding(.horizontal, AulaSpace.page)
            .padding(.top, 12)
            .padding(.bottom, 40)
        }
        .task { await load() }
    }

    @ViewBuilder
    private var meet: some View {
        VStack(alignment: .leading, spacing: 8) {
            AulaKicker(text: "Lezione")
            if let url = payload?.meetUrl, let link = URL(string: url) {
                Link("Войти на созвон", destination: link)
                    .underline()
                    .foregroundStyle(AulaColor.ink)
            } else if payload != nil {
                Text("Ссылку на видеоконференцию задаст преподаватель.")
                    .foregroundStyle(AulaColor.inkSoft)
            }
        }
    }

    private func calendar(lessons: [Lesson]) -> some View {
        let byDay = Dictionary(grouping: lessons, by: { AulaFormat.lessonDayKey($0.startsAt) })
        let cells = AulaFormat.calendarCells(year: year, month: month)
        let dow = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
        return VStack(alignment: .leading, spacing: 16) {
            HStack {
                Button("Indietro") { shift(-1) }
                    .font(.system(size: 12))
                    .tracking(1.4)
                    .textCase(.uppercase)
                    .foregroundStyle(AulaColor.inkSoft)
                Spacer()
                Text(AulaFormat.formatMonth(year: year, month: month))
                    .font(AulaFonts.script(32, relativeTo: .title))
                    .foregroundStyle(AulaColor.ink)
                Spacer()
                Button("Avanti") { shift(1) }
                    .font(.system(size: 12))
                    .tracking(1.4)
                    .textCase(.uppercase)
                    .foregroundStyle(AulaColor.inkSoft)
            }
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 0), count: 7), spacing: 0) {
                ForEach(dow, id: \.self) { label in
                    Text(label)
                        .font(.system(size: 10))
                        .tracking(1)
                        .textCase(.uppercase)
                        .foregroundStyle(AulaColor.inkSoft)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .overlay(Rectangle().stroke(AulaColor.line, lineWidth: 0.5))
                }
                ForEach(cells, id: \.self) { date in
                    dayCell(date: date, marks: byDay[AulaFormat.dayKey(date)] ?? [])
                }
            }
            .overlay(Rectangle().stroke(AulaColor.line, lineWidth: 1))

            if let selected {
                VStack(alignment: .leading, spacing: 8) {
                    AulaKicker(text: AulaFormat.formatDayKey(selected))
                    let dayLessons = byDay[selected] ?? []
                    if dayLessons.isEmpty {
                        Text("В этот день занятия нет.")
                            .foregroundStyle(AulaColor.inkSoft)
                    } else {
                        ForEach(dayLessons) { lesson in
                            HStack {
                                Text(lesson.title)
                                Spacer()
                                Text(AulaFormat.formatTimeRange(start: lesson.startsAt, end: lesson.endsAt))
                                    .foregroundStyle(AulaColor.inkSoft)
                            }
                            .padding(.vertical, 10)
                            .overlay(alignment: .bottom) { AulaHairline() }
                        }
                    }
                }
            }
        }
    }

    private func dayCell(date: Date, marks: [Lesson]) -> some View {
        let key = AulaFormat.dayKey(date)
        let outside = Calendar.current.component(.month, from: date) != month
        let isOn = selected == key
        let isToday = today == key
        return Button {
            selected = key
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Text("\(Calendar.current.component(.day, from: date))")
                    .font(.system(size: 13))
                    .foregroundStyle(isToday ? AulaColor.pompei : (outside ? AulaColor.inkSoft.opacity(0.45) : AulaColor.ink))
                if !outside, !marks.isEmpty {
                    Circle()
                        .fill(AulaColor.pompei)
                        .frame(width: 5, height: 5)
                }
                Spacer(minLength: 0)
            }
            .padding(6)
            .frame(maxWidth: .infinity, minHeight: 52, alignment: .topLeading)
            .background(isOn ? AulaColor.ivory2 : AulaColor.ivory)
            .overlay(Rectangle().stroke(AulaColor.line, lineWidth: 0.5))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(key)
    }

    private func shift(_ delta: Int) {
        var comps = DateComponents()
        comps.year = year
        comps.month = month + delta
        comps.day = 1
        let date = Calendar.current.date(from: comps) ?? Date()
        year = Calendar.current.component(.year, from: date)
        month = Calendar.current.component(.month, from: date)
    }

    private func load() async {
        error = nil
        do {
            let data = try await session.client.orario()
            payload = data
            if selected == nil {
                let upcoming = data.lessons.first(where: { (AulaFormat.date(from: $0.startsAt) ?? .distantPast) >= Date() })
                    ?? data.lessons.first
                if let upcoming {
                    selected = AulaFormat.lessonDayKey(upcoming.startsAt)
                    if let date = AulaFormat.date(from: upcoming.startsAt) {
                        year = Calendar.current.component(.year, from: date)
                        month = Calendar.current.component(.month, from: date)
                    }
                } else {
                    selected = today
                }
            }
        } catch AulaAPIError.unauthorized {
            await session.logout()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
