import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var email = ""
    @State private var password = ""
    @State private var inviteToken = ""
    @State private var name = ""
    @State private var pending = false
    @State private var registering = false
    @State private var registerOk: String?
    @FocusState private var focus: Field?

    private enum Field { case email, password, invite, name }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                ScriptTitle(text: "Aula", size: 56)
                Text("Email и пароль после приглашения.")
                    .foregroundStyle(AulaColor.inkSoft)
                    .font(.system(size: 16))

                AulaField(
                    label: "Email",
                    text: $email,
                    keyboard: .emailAddress,
                    textContentType: .username,
                    submitLabel: .next
                )
                .focused($focus, equals: .email)

                AulaField(
                    label: "Пароль",
                    text: $password,
                    textContentType: .password,
                    isSecure: true,
                    submitLabel: .go
                )
                .focused($focus, equals: .password)
                .onSubmit { Task { await submit() } }

                if let error = session.lastError {
                    Text(error)
                        .foregroundStyle(AulaColor.pompei)
                        .font(.system(size: 15))
                        .accessibilityIdentifier("login-error")
                }

                AulaButton(title: pending ? "…" : "Entrare", enabled: !pending && canSubmit) {
                    Task { await submit() }
                }

                Button(registering ? "У меня уже есть аккаунт" : "Регистрация по приглашению") {
                    registering.toggle()
                    session.lastError = nil
                    registerOk = nil
                }
                .font(.system(size: 13))
                .foregroundStyle(AulaColor.pompei)

                if registering {
                    AulaField(label: "Код приглашения", text: $inviteToken, textContentType: .oneTimeCode, submitLabel: .next)
                    AulaField(label: "Имя", text: $name, textContentType: .name, submitLabel: .next)
                    AulaButton(title: pending ? "…" : "Создать аккаунт", enabled: !pending && canRegister) {
                        Task { await submitRegister() }
                    }
                    if let registerOk {
                        Text(registerOk)
                            .foregroundStyle(AulaColor.inkSoft)
                    }
                }

                if AppConfig.useMock {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Режим макета (схема AulaMock). Демо-вход:")
                            .font(.system(size: 13))
                            .foregroundStyle(AulaColor.inkSoft)
                        Text("\(MockAulaClient.annaEmail) / \(MockAulaClient.demoPassword)")
                            .font(.system(size: 13))
                            .foregroundStyle(AulaColor.inkSoft)
                            .textSelection(.enabled)
                    }
                    .padding(.top, 8)
                }
            }
            .padding(.horizontal, AulaSpace.page)
            .padding(.top, 72)
            .padding(.bottom, 40)
            .frame(maxWidth: 420)
            .frame(maxWidth: .infinity)
        }
        .scrollDismissesKeyboard(.interactively)
        .onAppear { focus = .email }
    }

    private var canSubmit: Bool {
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !password.isEmpty
    }

    private var canRegister: Bool {
        canSubmit && !inviteToken.isEmpty && !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && password.count >= 8
    }

    private func submit() async {
        guard canSubmit, !pending else { return }
        pending = true
        defer { pending = false }
        await session.login(email: email, password: password)
    }

    private func submitRegister() async {
        guard canRegister, !pending else { return }
        pending = true
        defer { pending = false }
        if let message = await session.register(inviteToken: inviteToken, name: name, email: email, password: password) {
            registerOk = message
        }
    }
}
