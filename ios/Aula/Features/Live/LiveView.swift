import SwiftUI

struct LiveView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var payload: LivePayload?
    @State private var error: String?
    @State private var doneLocal = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                AulaKicker(text: "In diretta")
                ScriptTitle(text: "Live")
                if let url = payload?.meetUrl, let link = URL(string: url) {
                    Link("Войти на созвон", destination: link)
                        .underline()
                        .foregroundStyle(AulaColor.ink)
                }
                content
            }
            .padding(.horizontal, AulaSpace.page)
            .padding(.top, 12)
            .padding(.bottom, 40)
        }
        .task { await poll() }
    }

    @ViewBuilder
    private var content: some View {
        if let error {
            AulaStatusView(kind: .error(error, retry: { Task { await loadOnce() } }))
        } else if let payload, let activity = payload.activity, payload.live.activityId != nil {
            ActivityBoardView(
                activity: activity,
                state: payload.live.board,
                queueLabel: payload.queue.count > 1 ? "\(payload.live.index + 1)/\(payload.queue.count)" : nil,
                doneLabel: payload.live.index + 1 < payload.live.queue.count ? nil : "Готово",
                onChange: { board in
                    Task { await patch(LivePatch(picks: board.picks, selected: Optional.some(board.selected), checked: board.checked, rev: payload.live.rev)) }
                },
                onNext: payload.live.index + 1 < payload.live.queue.count
                    ? nil
                    : {
                        doneLocal = true
                        if var current = payload {
                            current.activity = nil
                            current.done = true
                            self.payload = current
                        }
                    }
            )
        } else if payload != nil || doneLocal {
            AulaStatusView(kind: .empty(waitingCopy))
        } else {
            AulaStatusView(kind: .loading("Ждём занятие…"))
        }
    }

    private var waitingCopy: String {
        if doneLocal || payload?.done == true {
            return "Очередь пуста — можно отдохнуть."
        }
        return "Когда преподаватель откроет задание, оно появится здесь."
    }

    private func poll() async {
        while !Task.isCancelled {
            await loadOnce()
            try? await Task.sleep(nanoseconds: 1_500_000_000)
        }
    }

    private func loadOnce() async {
        do {
            payload = try await session.client.live()
            error = nil
        } catch AulaAPIError.unauthorized {
            await session.logout()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func patch(_ patch: LivePatch) async {
        do {
            payload = try await session.client.patchLive(patch)
            error = nil
        } catch AulaAPIError.conflict {
            await loadOnce()
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

}
