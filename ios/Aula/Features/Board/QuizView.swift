import SwiftUI

struct QuizView: View {
    let activity: QuizActivity
    let state: BoardState
    var correctOverride: Bool?
    var onChange: (BoardState) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            GlossText(text: activity.prompt, font: .system(size: 19))
            VStack(spacing: 8) {
                ForEach(Array(activity.options.enumerated()), id: \.offset) { index, option in
                    optionButton(index: index, option: option)
                }
            }
        }
    }

    private func optionButton(index: Int, option: String) -> some View {
        let value = String(index)
        let chosen = state.picks[Score.quizKey(activity.id)] ?? nil
        let selected = chosen == value
        let localOk = Score.isQuizCorrect(activity, picks: state.picks)
        let ok = correctOverride ?? localOk
        let reveal = activity.answer >= 0
        let isAnswer = reveal && index == activity.answer
        var tone: Tone = .plain
        if state.checked && isAnswer { tone = .right }
        else if state.checked && selected && ok { tone = .right }
        else if state.checked && selected && !ok { tone = .wrong }
        else if selected { tone = .on }

        return Button {
            guard !state.checked else { return }
            var picks = state.picks
            Score.setPick(&picks, key: Score.quizKey(activity.id), value: selected ? nil : value)
            onChange(BoardState(picks: picks, selected: nil, checked: false))
        } label: {
            Text(option)
                .font(.system(size: 16))
                .foregroundStyle(tone == .wrong ? AulaColor.pompei : AulaColor.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 14)
                .padding(.horizontal, 14)
                .background(tone.background)
                .overlay(alignment: .leading) {
                    Rectangle()
                        .fill(tone.accent)
                        .frame(width: 3)
                }
                .overlay(Rectangle().stroke(tone.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
        .disabled(state.checked)
        .accessibilityAddTraits(selected ? [.isSelected] : [])
    }

    private enum Tone {
        case plain, on, right, wrong

        var background: Color {
            switch self {
            case .plain: return .clear
            case .on, .right: return AulaColor.ivory2
            case .wrong: return .clear
            }
        }

        var accent: Color {
            switch self {
            case .plain: return AulaColor.line
            case .on: return AulaColor.pompei
            case .right: return AulaColor.ink
            case .wrong: return AulaColor.pompei
            }
        }

        var border: Color {
            switch self {
            case .plain, .on: return AulaColor.line
            case .right: return AulaColor.ink
            case .wrong: return AulaColor.pompei
            }
        }
    }
}
