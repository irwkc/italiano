import XCTest

final class ScreenshotTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        if #available(iOS 17.0, *) {
            XCUIDevice.shared.appearance = .light
        }
        app = XCUIApplication()
        app.launchArguments = ["-AULAUseMock", "-UITest", "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        app.launch()
    }

    func testCaptureMainScreens() throws {
        XCTAssertTrue(app.staticTexts["Aula"].waitForExistence(timeout: 12))
        settle()
        capture("login")

        button(id: "login-register-toggle", label: "Регистрация по приглашению").tap()
        XCTAssertTrue(app.staticTexts["Код приглашения"].waitForExistence(timeout: 6)
            || app.textFields["invite-token"].waitForExistence(timeout: 2))
        settle()
        capture("invite")

        button(id: "login-register-toggle", label: "У меня уже есть аккаунт").tap()
        XCTAssertTrue(app.staticTexts["Aula"].waitForExistence(timeout: 6))

        let email = firstExisting([app.textFields["login-email"], app.textFields["Email"]])
        XCTAssertTrue(email.waitForExistence(timeout: 4))
        email.tap()
        email.typeText("anna@aula.test")
        let password = firstExisting([app.secureTextFields["login-password"], app.secureTextFields["Пароль"]])
        password.tap()
        password.typeText("aula-demo-8")
        button(id: "login-submit", label: "Entrare").tap()

        let liveTab = button(id: "tab-live", label: "Live")
        XCTAssertTrue(liveTab.waitForExistence(timeout: 12))
        _ = app.buttons["quiz-option-0"].waitForExistence(timeout: 8)
        settle()
        capture("live")

        if app.buttons["quiz-option-0"].exists {
            app.buttons["quiz-option-0"].tap()
        } else if app.buttons["Ciao!"].exists {
            app.buttons["Ciao!"].tap()
        }
        settle()
        capture("quiz")

        let gloss = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "gloss-")).firstMatch
        if gloss.waitForExistence(timeout: 2) {
            gloss.tap()
        } else if app.buttons["Come"].exists {
            app.buttons["Come"].tap()
        }
        settle()
        capture("gloss")

        button(id: "tab-orario", label: "Orario").tap()
        XCTAssertTrue(app.staticTexts["Orario"].waitForExistence(timeout: 8))
        settle()
        capture("orario")

        button(id: "tab-compiti", label: "Compiti").tap()
        XCTAssertTrue(app.staticTexts["Compiti"].waitForExistence(timeout: 8))
        settle()
        capture("compiti")
    }

    private func button(id: String, label: String) -> XCUIElement {
        let byId = app.buttons[id]
        if byId.waitForExistence(timeout: 2) { return byId }
        return app.buttons[label]
    }

    private func firstExisting(_ elements: [XCUIElement]) -> XCUIElement {
        elements.first(where: { $0.waitForExistence(timeout: 1) }) ?? elements[0]
    }

    private func settle() {
        RunLoop.current.run(until: Date().addingTimeInterval(0.8))
    }

    private func capture(_ name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)

        let data = screenshot.pngRepresentation
        let bases = [
            ProcessInfo.processInfo.environment["SCREENSHOT_UPLOAD_URL"],
            "http://127.0.0.1:47321",
        ].compactMap { $0 }
        for base in bases {
            guard let url = URL(string: base.trimmingCharacters(in: CharacterSet(charactersIn: "/")) + "/\(name).png") else { continue }
            var request = URLRequest(url: url)
            request.httpMethod = "PUT"
            request.setValue("image/png", forHTTPHeaderField: "Content-Type")
            request.httpBody = data
            request.timeoutInterval = 5
            let semaphore = DispatchSemaphore(value: 0)
            URLSession.shared.dataTask(with: request) { _, _, _ in semaphore.signal() }.resume()
            _ = semaphore.wait(timeout: .now() + 5)
        }
    }
}
