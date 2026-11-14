import SwiftUI
import UIKit

struct AulaButton: View {
    enum Kind { case primary, outline }

    let title: String
    var kind: Kind = .primary
    var enabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 12, weight: .regular))
                .tracking(1.7)
                .textCase(.uppercase)
                .padding(.horizontal, 22)
                .frame(minHeight: 52)
                .frame(maxWidth: .infinity)
                .background(background)
                .foregroundStyle(foreground)
                .overlay(Rectangle().stroke(border, lineWidth: 1))
        }
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.45)
        .buttonStyle(.plain)
        .accessibilityAddTraits(.isButton)
    }

    private var background: Color {
        switch kind {
        case .primary: return AulaColor.ink
        case .outline: return .clear
        }
    }

    private var foreground: Color {
        switch kind {
        case .primary: return AulaColor.ivory
        case .outline: return AulaColor.ink
        }
    }

    private var border: Color {
        kind == .primary ? AulaColor.ink : AulaColor.ink
    }
}

struct AulaField: View {
    let label: String
    @Binding var text: String
    var keyboard: UIKeyboardType = .default
    var textContentType: UITextContentType?
    var isSecure: Bool = false
    var submitLabel: SubmitLabel = .next

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 11, weight: .regular))
                .tracking(1.4)
                .textCase(.uppercase)
                .foregroundStyle(AulaColor.inkSoft)
            Group {
                if isSecure {
                    SecureField("", text: $text)
                        .textContentType(textContentType)
                } else {
                    TextField("", text: $text)
                        .keyboardType(keyboard)
                        .textContentType(textContentType)
                        .textInputAutocapitalization(keyboard == .emailAddress ? .never : .words)
                        .autocorrectionDisabled(keyboard == .emailAddress)
                }
            }
            .font(AulaFonts.serif(22, relativeTo: .title2))
            .foregroundStyle(AulaColor.ink)
            .submitLabel(submitLabel)
            AulaHairline()
        }
    }
}

struct ScriptTitle: View {
    let text: String
    var size: CGFloat = 42

    var body: some View {
        Text(text)
            .font(AulaFonts.script(size, relativeTo: .largeTitle))
            .foregroundStyle(AulaColor.ink)
            .lineLimit(2)
            .minimumScaleFactor(0.7)
    }
}

struct AulaKicker: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .regular))
            .tracking(2)
            .textCase(.uppercase)
            .foregroundStyle(AulaColor.inkSoft)
    }
}

struct AulaPill: View {
    let text: String
    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .regular))
            .tracking(1.4)
            .textCase(.uppercase)
            .foregroundStyle(AulaColor.pompei)
    }
}

struct AulaLinkButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .underline()
                .foregroundStyle(AulaColor.ink)
        }
        .buttonStyle(.plain)
    }
}
