import SwiftUI
import UIKit

/// Tokens from `app/globals.css` and `app/aula/aula.css` (ivory / ink / pompei).
enum AulaColor {
    static let ivory = Color(red: 236 / 255, green: 230 / 255, blue: 216 / 255)
    static let ivory2 = Color(red: 227 / 255, green: 220 / 255, blue: 203 / 255)
    static let ink = Color(red: 28 / 255, green: 25 / 255, blue: 21 / 255)
    static let inkSoft = Color(red: 92 / 255, green: 85 / 255, blue: 75 / 255)
    static let pompei = Color(red: 168 / 255, green: 55 / 255, blue: 31 / 255)
    static let line = Color(red: 28 / 255, green: 25 / 255, blue: 21 / 255).opacity(0.14)
}

enum AulaFonts {
    static let scriptName = "Italianno-Regular"
    static let serifName = "CormorantGaramond-Regular"

    static func register() {
        // UIAppFonts already loads bundled TTFs; this is a no-op safety check.
        _ = UIFont(name: scriptName, size: 24)
        _ = UIFont(name: serifName, size: 18)
        _ = UIFont(name: "Cormorant Garamond", size: 18)
    }

    static func script(_ size: CGFloat, relativeTo style: Font.TextStyle = .largeTitle) -> Font {
        custom(scriptName, fallback: "Snell Roundhand", size: size, relativeTo: style)
    }

    static func serif(_ size: CGFloat, relativeTo style: Font.TextStyle = .title) -> Font {
        if UIFont(name: serifName, size: size) != nil {
            return .custom(serifName, size: size, relativeTo: style)
        }
        if UIFont(name: "Cormorant Garamond", size: size) != nil {
            return .custom("Cormorant Garamond", size: size, relativeTo: style)
        }
        return .system(size: size, design: .serif)
    }

    private static func custom(
        _ name: String,
        fallback: String,
        size: CGFloat,
        relativeTo style: Font.TextStyle
    ) -> Font {
        if UIFont(name: name, size: size) != nil {
            return .custom(name, size: size, relativeTo: style)
        }
        if UIFont(name: fallback, size: size) != nil {
            return .custom(fallback, size: size, relativeTo: style)
        }
        return .system(size: size, design: .serif)
    }
}

enum AulaSpace {
    static let page: CGFloat = 20
    static let section: CGFloat = 28
}

struct AulaHairline: View {
    var body: some View {
        Rectangle()
            .fill(AulaColor.line)
            .frame(height: 1)
            .accessibilityHidden(true)
    }
}
