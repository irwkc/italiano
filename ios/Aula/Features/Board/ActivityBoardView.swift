import SwiftUI
import UIKit

struct ActivityBoardView: View {
    let activity: Activity
    let state: BoardState
    var queueLabel: String?
    var busy: Bool = false
    var correctOverride: Bool?
    var doneLabel: String?
    var onChange: (BoardState) -> Void
    var onNext: (() -> Void)?

    private var ok: Bool? {
        if let correctOverride { return correctOverride }
        if activity.answersStripped { return nil }
        return Score.isBoardCorrect(activity, picks: state.picks)
    }

    private var canJudge: Bool {
        Score.canJudge(activity, picks: state.picks)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let queueLabel {
                AulaPill(text: queueLabel)
            }
            GlossText(text: activity.title, font: AulaFonts.script(38, relativeTo: .title))
            if let image = activity.image {
                ActivityImage(name: image)
            }
            switch activity {
            case .quiz(let quiz):
                QuizView(activity: quiz, state: state, correctOverride: correctOverride, onChange: onChange)
            case .cloze(let cloze):
                ClozeView(activity: cloze, state: state, correctOverride: correctOverride, onChange: onChange)
            }
            checks
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder
    private var checks: some View {
        HStack(spacing: 10) {
            if !state.checked {
                AulaButton(title: "Проверить", enabled: canJudge && !busy) {
                    var next = state
                    next.checked = true
                    onChange(next)
                }
            } else if ok == nil {
                Text("Проверяем…")
                    .foregroundStyle(AulaColor.inkSoft)
            } else if ok == true {
                if onNext != nil || doneLabel != nil {
                    AulaButton(title: doneLabel ?? "Далее") {
                        onNext?()
                    }
                } else {
                    Text("Верно.")
                        .foregroundStyle(AulaColor.inkSoft)
                }
            } else {
                AulaButton(title: "Попробовать заново", kind: .outline) {
                    onChange(.empty)
                }
                if onNext != nil || doneLabel != nil {
                    AulaButton(title: doneLabel ?? "Далее") {
                        onNext?()
                    }
                }
            }
        }
        if !state.checked && !canJudge {
            Text("Выберите ответ.")
                .font(.system(size: 14))
                .foregroundStyle(AulaColor.inkSoft)
        }
    }
}

struct ActivityImage: View {
    let name: String

    var body: some View {
        Group {
            if let url = URL(string: name), let scheme = url.scheme, scheme.hasPrefix("http") {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .success(let image):
                        image.resizable().scaledToFit()
                    default:
                        Color.clear.frame(height: 1)
                    }
                }
            } else if let ui = bundledJPEG(fileKey) ?? UIImage(named: fileKey) {
                Image(uiImage: ui)
                    .resizable()
                    .scaledToFit()
            }
        }
        .frame(maxWidth: 260)
        .grayscale(0.15)
        .opacity(0.95)
        .accessibilityHidden(true)
    }

    private var fileKey: String {
        (name as NSString).lastPathComponent
            .replacingOccurrences(of: ".jpg", with: "")
            .replacingOccurrences(of: ".png", with: "")
    }

    private func bundledJPEG(_ key: String) -> UIImage? {
        if let url = Bundle.main.url(forResource: key, withExtension: "jpg") {
            return UIImage(contentsOfFile: url.path)
        }
        return nil
    }
}
