import XCTest

final class ScreenshotTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        if #available(iOS 17.0, *) {
            XCUIDevice.shared.appearance = .light
        }
        app = XCUIApplication()
    }

    func testCaptureMainScreens() throws {
        launch(autoLogin: false)
        XCTAssertTrue(app.staticTexts["Aula"].waitForExistence(timeout: 12))
        settle()
        capture("login")

        button(id: "login-register-toggle", label: "Регистрация по приглашению").tap()
        XCTAssertTrue(
            app.staticTexts["Код приглашения"].waitForExistence(timeout: 6)
                || app.textFields["invite-token"].waitForExistence(timeout: 2)
        )
        settle()
        capture("invite")

        app.terminate()
        launch(autoLogin: true)

        XCTAssertTrue(
            button(id: "tab-live", label: "Live").waitForExistence(timeout: 15)
                || app.staticTexts["Live"].waitForExistence(timeout: 4)
                || app.buttons["logout"].waitForExistence(timeout: 4)
                || app.buttons["Выйти"].waitForExistence(timeout: 4)
        )
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

    private func launch(autoLogin: Bool) {
        app.launchArguments = ["-AULAUseMock", "-UITest", "-AppleLanguages", "(ru)", "-AppleLocale", "ru_RU"]
        if autoLogin {
            app.launchArguments.append("-UITestAutoLogin")
        }
        app.launchEnvironment["AULA_USE_MOCK"] = "YES"
        app.launch()
    }

    private func button(id: String, label: String) -> XCUIElement {
        let byId = app.buttons[id]
        if byId.waitForExistence(timeout: 2) { return byId }
        return app.buttons[label]
    }

    private func settle() {
        RunLoop.current.run(until: Date().addingTimeInterval(0.9))
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
        for base in Set(bases) {
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
