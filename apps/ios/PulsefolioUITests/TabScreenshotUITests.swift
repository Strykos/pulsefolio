import XCTest

final class TabScreenshotUITests: XCTestCase {
    private let outputDir = "/Users/venkyiyer/Projects/pulsefolio/docs/test-reports/ios-screens"

    override func setUpWithError() throws {
        continueAfterFailure = true
        try FileManager.default.createDirectory(atPath: outputDir, withIntermediateDirectories: true)
    }

    private func launchAuthenticatedApp() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchEnvironment["API_URL"] = "http://localhost:8000"
        app.launch()
        sleep(2)
        if app.buttons["Sign in"].waitForExistence(timeout: 5) {
            app.buttons["Sign in"].tap()
            sleep(4)
        }
        return app
    }

    func testCaptureBriefingLayoutPhase1() throws {
        let app = launchAuthenticatedApp()

        XCTAssertTrue(app.buttons["Briefing"].waitForExistence(timeout: 20))
        capture(app, name: "briefing-layout-phase1")
    }

    func testCaptureAllTabScreens() throws {
        let app = launchAuthenticatedApp()

        XCTAssertTrue(app.buttons["Briefing"].waitForExistence(timeout: 20))

        capture(app, name: "briefing-layout-phase1")
        app.buttons["Portfolio"].tap()
        sleep(2)
        capture(app, name: "02-portfolio")
        if app.buttons["Close portfolio"].exists {
            app.buttons["Close portfolio"].tap()
        } else {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.1, dy: 0.08)).tap()
        }
        sleep(1)
        app.buttons["Activity"].tap()
        sleep(1)
        capture(app, name: "03-activity")
        app.buttons["Review"].tap()
        sleep(2)
        capture(app, name: "06-decision-review")
        XCTAssertTrue(app.buttons["Briefing"].waitForExistence(timeout: 5))
        app.buttons["Briefing"].tap()
        sleep(1)
        app.buttons["Insights"].tap()
        sleep(2)
        capture(app, name: "04-insights")
        if app.buttons["Done"].exists {
            app.buttons["Done"].tap()
        }
    }

    private func capture(_ app: XCUIApplication, name: String) {
        let shot = XCUIScreen.main.screenshot()
        let path = "\(outputDir)/\(name).png"
        try? shot.pngRepresentation.write(to: URL(fileURLWithPath: path))
        let attachment = XCTAttachment(screenshot: shot)
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
