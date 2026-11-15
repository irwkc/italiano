import SwiftUI

struct GlossText: View {
    let text: String
    var font: Font = .system(size: 19)
    @EnvironmentObject private var session: SessionStore
    @State private var open: Int?
    @State private var meanings: [String: String] = [:]

    var body: some View {
        let parts = Gloss.splitWords(text)
        FlowLayout(spacing: 0, lineSpacing: 6) {
            ForEach(Array(parts.enumerated()), id: \.offset) { index, part in
                if Gloss.isWord(part) {
                    word(part, index: index)
                } else {
                    Text(part).font(font).foregroundStyle(AulaColor.ink)
                }
            }
        }
        .overlay(alignment: .top) {
            if let open, parts.indices.contains(open) {
                let word = parts[open]
                VStack(alignment: .leading, spacing: 2) {
                    Text(word.uppercased())
                        .font(.system(size: 10))
                        .tracking(1.6)
                        .foregroundStyle(AulaColor.inkSoft)
                    Text(meanings[word] ?? Gloss.lookup(word) ?? "…")
                        .font(.system(size: 15))
                        .foregroundStyle(AulaColor.ink)
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
                .background(AulaColor.ivory)
                .overlay(Rectangle().stroke(AulaColor.line, lineWidth: 1))
                .offset(y: -8)
            }
        }
    }

    private func word(_ part: String, index: Int) -> some View {
        Button {
            toggle(index, word: part)
        } label: {
            Text(part)
                .foregroundStyle(open == index ? AulaColor.pompei : AulaColor.ink)
                .font(font)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("gloss-\(part)")
        .accessibilityHint("перевод")
    }

    private func toggle(_ index: Int, word: String) {
        if open == index {
            open = nil
            return
        }
        open = index
        if let local = Gloss.lookup(word) {
            meanings[word] = local
            return
        }
        Task {
            let text = (try? await session.client.gloss(word: word)) ?? "…"
            await MainActor.run { meanings[word] = text }
        }
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 0
    var lineSpacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var row: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += row + lineSpacing
                row = 0
            }
            row = max(row, size.height)
            x += size.width + spacing
        }
        return CGSize(width: maxWidth.isFinite ? maxWidth : x, height: y + row)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var row: CGFloat = 0
        for view in subviews {
            let size = view.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += row + lineSpacing
                row = 0
            }
            view.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            row = max(row, size.height)
            x += size.width + spacing
        }
    }
}
