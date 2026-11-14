import SwiftUI

struct AulaStatusView: View {
    enum Kind {
        case loading(String)
        case empty(String)
        case error(String, retry: (() -> Void)?)
    }

    let kind: Kind

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            switch kind {
            case .loading(let text):
                ProgressView()
                    .tint(AulaColor.pompei)
                    .accessibilityLabel("Загрузка")
                Text(text)
                    .foregroundStyle(AulaColor.inkSoft)
            case .empty(let text):
                Text(text)
                    .foregroundStyle(AulaColor.inkSoft)
                    .opacity(0.85)
            case .error(let text, let retry):
                Text(text)
                    .foregroundStyle(AulaColor.pompei)
                if let retry {
                    AulaButton(title: "Ещё раз", kind: .outline, action: retry)
                        .frame(maxWidth: 220)
                }
            }
        }
        .font(.system(size: 16))
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.vertical, 28)
    }
}
