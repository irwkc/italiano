import SwiftUI

enum AulaTab: String, CaseIterable, Identifiable {
    case live, orario, compiti
    var id: String { rawValue }
    var label: String {
        switch self {
        case .live: return "Live"
        case .orario: return "Orario"
        case .compiti: return "Compiti"
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var tab: AulaTab = .live

    var body: some View {
        ZStack {
            AulaColor.ivory.ignoresSafeArea()
            Group {
                if session.isRestoring {
                    AulaStatusView(kind: .loading("Aula"))
                        .padding(AulaSpace.page)
                } else if session.isLoggedIn {
                    cabinet
                } else {
                    LoginView()
                }
            }
        }
        .tint(AulaColor.pompei)
        .task { await session.restore() }
    }

    private var cabinet: some View {
        VStack(spacing: 0) {
            AulaHeaderBar()
            AulaTabStrip(selection: $tab)
            Group {
                switch tab {
                case .live: LiveView()
                case .orario: OrarioView()
                case .compiti: CompitiView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }
}

struct AulaHeaderBar: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            Text("G")
                .font(AulaFonts.script(34, relativeTo: .title))
                .foregroundStyle(AulaColor.pompei)
                .accessibilityHidden(true)
            Text(session.student?.name ?? "")
                .font(.system(size: 13))
                .tracking(1.1)
                .textCase(.uppercase)
                .foregroundStyle(AulaColor.inkSoft)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .lineLimit(1)
            Button("Выйти") {
                Task { await session.logout() }
            }
            .accessibilityIdentifier("logout")
            .font(.system(size: 12))
            .tracking(1.4)
            .textCase(.uppercase)
            .foregroundStyle(AulaColor.inkSoft)
        }
        .padding(.horizontal, AulaSpace.page)
        .padding(.top, 8)
        .padding(.bottom, 12)
        .overlay(alignment: .bottom) { AulaHairline() }
        .background(AulaColor.ivory)
    }
}

struct AulaTabStrip: View {
    @Binding var selection: AulaTab

    var body: some View {
        HStack(alignment: .lastTextBaseline, spacing: 22) {
            ForEach(AulaTab.allCases) { tab in
                Button {
                    selection = tab
                } label: {
                    Text(tab.label)
                        .font(AulaFonts.script(32, relativeTo: .title))
                        .foregroundStyle(selection == tab ? AulaColor.ink : AulaColor.inkSoft)
                        .overlay(alignment: .bottom) {
                            Rectangle()
                                .fill(selection == tab ? AulaColor.pompei : Color.clear)
                                .frame(height: 1)
                                .offset(y: 4)
                        }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("tab-\(tab.rawValue)")
                .accessibilityAddTraits(selection == tab ? [.isSelected] : [])
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, AulaSpace.page)
        .padding(.top, 18)
        .padding(.bottom, 8)
        .dynamicTypeSize(...DynamicTypeSize.accessibility2)
    }
}

#Preview("Макет") {
    let tokens = MemoryTokenStore()
    let store = SessionStore(client: MockAulaClient(tokenStore: tokens), tokenStore: tokens)
    return RootView()
        .environmentObject(store)
        .preferredColorScheme(.light)
}
