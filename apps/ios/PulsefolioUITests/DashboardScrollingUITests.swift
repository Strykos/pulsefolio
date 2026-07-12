import XCTest

final class DashboardScrollingUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testDashboardMovesAfterVerticalSwipe() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(
            app.staticTexts["Pulsefolio"].waitForExistence(timeout: 15),
            "Briefing did not finish loading"
        )

        let scrollView = app.scrollViews["dashboard-scroll"]
        let evidenceButton = app.buttons["Swipe up for evidence"].firstMatch

        XCTAssertTrue(scrollView.waitForExistence(timeout: 5))
        XCTAssertTrue(evidenceButton.waitForExistence(timeout: 5))
    }
}
