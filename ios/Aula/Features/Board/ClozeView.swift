import SwiftUI

struct ClozeView: View {
    let activity: ClozeActivity
    let state: BoardState
    var correctOverride: Bool?
    var onChange: (BoardState) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let prompt = activity.prompt {
                GlossText(text: prompt, font: .system(size: 16))
                    .foregroundStyle(AulaColor.inkSoft)
            }
            clozeLine
            bank
        }
    }

    private var clozeLine: some View {
        let parts = Score.splitCloze(activity.text)
        return FlowLayout(spacing: 4, lineSpacing: 10) {
            ForEach(Array(parts.enumerated()), id: \.offset) { index, part in
                GlossText(text: part, font: .system(size: 18))
                if index < parts.count - 1 {
                    gap(index)
                }
            }
        }
    }

    private func gap(_ index: Int) -> some View {
        let key = Score.clozeKey(index)
        let filled = state.picks[key] ?? nil
        let reveal = activity.answers.contains { !$0.isEmpty }
        var tone: GapTone = filled == nil ? .empty : .on
        if state.checked {
            if !reveal, let correctOverride {
                tone = correctOverride ? .right : (filled == nil ? .empty : .wrong)
            } else {
                tone = Score.isClozeSlotCorrect(activity, picks: state.picks, index: index) ? .right : .wrong
            }
        }
        return Button {
            place(index)
        } label: {
            Text(filled ?? "  ")
                .font(.system(size: 18, weight: .regular))
                .foregroundStyle(tone.text)
                .frame(minWidth: 56)
                .padding(.bottom, 2)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(tone.line).frame(height: 2)
                }
        }
        .buttonStyle(.plain)
        .disabled(state.checked)
        .accessibilityLabel("пропуск \(index + 1)")
    }

    private var bank: some View {
        let left = Score.remainingBank(activity.bank, picks: state.picks)
        return FlowLayout(spacing: 8, lineSpacing: 8) {
            ForEach(Array(left.enumerated()), id: \.offset) { _, word in
                let on = state.selected == word
                Button {
                    guard !state.checked else { return }
                    var next = state
                    next.selected = on ? nil : word
                    next.checked = false
                    onChange(next)
                } label: {
                    Text(word)
                        .font(.system(size: 15))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .overlay(Rectangle().stroke(AulaColor.ink, lineWidth: 1))
                        .background(on ? AulaColor.ivory2 : Color.clear)
                        .foregroundStyle(AulaColor.ink)
                }
                .buttonStyle(.plain)
                .disabled(state.checked)
            }
        }
    }

    private func place(_ index: Int) {
        guard !state.checked else { return }
        let key = Score.clozeKey(index)
        var next = state
        next.checked = false
        if let selected = state.selected {
            Score.setPick(&next.picks, key: key, value: selected)
            next.selected = nil
        } else if let current = state.picks[key] ?? nil {
            next.selected = current
            Score.setPick(&next.picks, key: key, value: nil)
        }
        onChange(next)
    }

    private enum GapTone {
        case empty, on, right, wrong
        var line: Color {
            switch self {
            case .empty, .right: return AulaColor.ink
            case .on, .wrong: return AulaColor.pompei
            }
        }
        var text: Color {
            self == .wrong || self == .on ? AulaColor.pompei : AulaColor.ink
        }
    }
}
