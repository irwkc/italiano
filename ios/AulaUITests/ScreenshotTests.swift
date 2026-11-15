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
        XCTAssertTrue(app.descendants(matching: .any)["login-screen"].waitForExistence(timeout: 12))
        settle()
        capture("login")

        app.buttons["login-register-toggle"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["invite-screen"].waitForExistence(timeout: 6))
        settle()
        capture("invite")

        app.buttons["login-register-toggle"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["login-screen"].waitForExistence(timeout: 6))

        let email = app.textFields["login-email"]
        XCTAssertTrue(email.waitForExistence(timeout: 4))
        email.tap()
        email.typeText("anna@aula.test")
        let password = app.secureTextFields["login-password"]
        password.tap()
        password.typeText("aula-demo-8")
        app.buttons["login-submit"].tap()

        XCTAssertTrue(app.buttons["tab-live"].waitForExistence(timeout: 12))
        XCTAssertTrue(app.descendants(matching: .any)["live-screen"].waitForExistence(timeout: 8))
        _ = app.buttons["quiz-option-0"].waitForExistence(timeout: 8)
        settle()
        capture("live")

        if app.buttons["quiz-option-0"].exists {
            app.buttons["quiz-option-0"].tap()
            settle()
            capture("quiz")
        } else {
            capture("quiz")
        }

        let gloss = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "gloss-")).firstMatch
        if gloss.waitForExistence(timeout: 3) {
            gloss.tap()
            settle()
            capture("gloss")
        }

        app.buttons["tab-orario"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["orario-screen"].waitForExistence(timeout: 8))
        _ = app.buttons["Indietro"].waitForExistence(timeout: 6)
        settle()
        capture("orario")

        app.buttons["tab-compiti"].tap()
        XCTAssertTrue(app.descendants(matching: .any)["compiti-screen"].waitForExistence(timeout: 8))
        settle()
        capture("compiti")
    }

    private func settle() {
        RunLoop.current.run(until: Date().addingTimeInterval(0.7))
    }

    private func capture(_ name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)

        let data = screenshot.pngRepresentation
        let urls = [
            ProcessInfo.processInfo.environment["SCREENSHOT_UPLOAD_URL"],
            "http://127.0.0.1:47321",
        ].compactMap { $0 }
        for base in urls {
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
