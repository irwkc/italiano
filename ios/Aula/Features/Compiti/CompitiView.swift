import SwiftUI

struct CompitiView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var payload: CompitiPayload?
    @State private var error: String?
    @State private var lessonId: String?
    @State private var correct: [String: Bool] = [:]
    @State private var busyId: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 8) {
                    AulaKicker(text: "Lavoro")
                    ScriptTitle(text: "Compiti")
                }
                if let error {
                    AulaStatusView(kind: .error(error, retry: { Task { await load() } }))
                } else if let payload {
                    if payload.lessons.isEmpty {
                        AulaStatusView(kind: .empty("Пока нет занятий, к которым можно повесить работу."))
                    } else {
                        lessonPicker(payload.lessons)
                    }
                    if payload.items.isEmpty {
                        AulaStatusView(kind: .empty("К этому занятию пока ничего не повесили."))
                    } else {
                        ForEach(Array(payload.items.enumerated()), id: \.element.id) { index, item in
                            assignmentBlock(item, next: payload.items[safe: index + 1], isLast: index == payload.items.count - 1)
                        }
                    }
                } else {
                    AulaStatusView(kind: .loading("Compiti…"))
                }
            }
            .padding(.horizontal, AulaSpace.page)
            .padding(.top, 12)
            .padding(.bottom, 48)
            .accessibilityIdentifier("compiti-screen")
        }
        .task { await load() }
    }

    private func lessonPicker(_ lessons: [Lesson]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Занятие")
                .font(.system(size: 11))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(AulaColor.inkSoft)
            Picker("Занятие", selection: Binding(
                get: { lessonId ?? payload?.selectedLessonId ?? lessons.first?.id ?? "" },
                set: { newValue in
                    lessonId = newValue
                    Task { await load(lessonId: newValue) }
                }
            )) {
                ForEach(lessons) { lesson in
                    Text("\(lesson.title) · \(AulaFormat.formatLessonWhen(lesson.startsAt))")
                        .tag(lesson.id)
                }
            }
            .pickerStyle(.menu)
            .tint(AulaColor.ink)
            AulaHairline()
        }
    }

    private func assignmentBlock(_ item: CompitiItem, next: CompitiItem?, isLast: Bool) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            AulaHairline()
            let status: String = {
                if let progress = item.assignment.progress, progress.checked {
                    return progress.correct ? " · верно" : " · есть ошибки"
                }
                if let flag = correct[item.id] {
                    return flag ? " · верно" : " · есть ошибки"
                }
                return ""
            }()
            AulaPill(text: "\(AulaFormat.kindLabel(item.assignment.kind))\(item.lesson.map { " · \(AulaFormat.formatLessonWhen($0.startsAt))" } ?? "")\(status)")
            if let activity = item.activity {
                ActivityBoardView(
                    activity: activity,
                    state: boardState(item),
                    busy: busyId == item.id,
                    correctOverride: correct[item.id] ?? (item.assignment.progress?.checked == true ? item.assignment.progress?.correct : nil),
                    doneLabel: isLast ? "Готово" : "Далее",
                    onChange: { nextState in
                        Task { await persist(item, state: nextState) }
                    },
                    onNext: next == nil ? nil : { }
                )
            } else {
                Text("Материал удалён.")
                    .foregroundStyle(AulaColor.inkSoft)
            }
        }
    }

    private func boardState(_ item: CompitiItem) -> BoardState {
        if let progress = item.assignment.progress {
            return BoardState(picks: progress.picks, selected: nil, checked: progress.checked)
        }
        return .empty
    }

    private func persist(_ item: CompitiItem, state: BoardState) async {
        busyId = item.id
        defer { busyId = nil }
        do {
            let result = try await session.client.saveProgress(
                assignmentId: item.assignment.id,
                picks: state.picks,
                checked: state.checked
            )
            if let flag = result.correct {
                correct[item.id] = flag
            } else if !state.checked {
                correct[item.id] = nil
            }
            await load(lessonId: lessonId ?? payload?.selectedLessonId)
        } catch AulaAPIError.unauthorized {
            await session.logout()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func load(lessonId: String? = nil) async {
        error = nil
        do {
            let data = try await session.client.compiti(lessonId: lessonId ?? self.lessonId)
            payload = data
            self.lessonId = data.selectedLessonId
            for item in data.items {
                if let progress = item.assignment.progress, progress.checked {
                    correct[item.id] = progress.correct
                }
            }
        } catch AulaAPIError.unauthorized {
            await session.logout()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
