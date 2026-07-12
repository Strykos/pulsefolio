import Foundation

@MainActor
final class APIClient: ObservableObject {
    let baseURL = URL(string: ProcessInfo.processInfo.environment["API_URL"] ?? "http://localhost:8000")!

    @Published var dashboard: DashboardData?
    @Published var portfolio: PortfolioData?
    @Published var trades: [Trade] = []
    @Published var insights: [AIInsight] = []
    @Published var settings: SettingsData?
    @Published var isLoading = false
    @Published var isAnalyzing = false
    @Published var isLive = false
    @Published var apiUnavailable = false
    @Published var statusMessage: String?
    @Published var loadError: String?
    @Published var accessToken: String?
    @Published var isAuthenticated = false

    private let tokenKey = "pulsefolio_token"

    init() {
        if let envToken = ProcessInfo.processInfo.environment["PULSEFOLIO_TOKEN"], !envToken.isEmpty {
            accessToken = envToken
            isAuthenticated = true
        } else if let stored = UserDefaults.standard.string(forKey: tokenKey) {
            accessToken = stored
            isAuthenticated = true
        }
    }

    private var apiPrefix: String {
        "/api/v1/me"
    }

    func login(email: String, password: String) async -> Bool {
        guard let url = URL(string: "/api/v1/auth/login", relativeTo: baseURL) else { return false }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["email": email, "password": password])

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return false }
            let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
            accessToken = tokenResponse.accessToken
            isAuthenticated = true
            UserDefaults.standard.set(tokenResponse.accessToken, forKey: tokenKey)
            return true
        } catch {
            return false
        }
    }

    func logout() {
        accessToken = nil
        isAuthenticated = false
        UserDefaults.standard.removeObject(forKey: tokenKey)
    }

    func refreshAll() async {
        isLoading = true
        defer { isLoading = false }
        await fetchDashboard()
        await fetchPortfolio()
        await withTaskGroup(of: Void.self) { group in
            group.addTask { await self.fetchTrades() }
            group.addTask { await self.fetchInsights() }
            group.addTask { await self.fetchSettings() }
        }
    }

    func showStatus(_ message: String) {
        statusMessage = message
        Task {
            try? await Task.sleep(for: .seconds(2.5))
            if statusMessage == message { statusMessage = nil }
        }
    }

    func fetchDashboard() async {
        let result: DashboardData? = await fetch("/dashboard", setsLiveFlag: true)
        dashboard = result
    }

    func fetchPortfolio() async {
        portfolio = await fetch("/portfolio")
    }

    func fetchTrades() async {
        trades = await fetch("/trades") ?? []
    }

    func fetchInsights() async {
        insights = await fetch("/insights") ?? []
    }

    func fetchSettings() async {
        settings = await fetch("/settings")
    }

    func approveTrade(id: String) async -> Bool {
        guard let url = URL(string: "\(apiPrefix)/trades/\(id)/approve", relativeTo: baseURL) else { return false }
        var request = authorizedRequest(url: url, method: "POST")
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode < 300 else { return false }
            await fetchTrades()
            return true
        } catch {
            return false
        }
    }

    func approveRecommendation(id: String) async -> Bool {
        guard let url = URL(
            string: "\(apiPrefix)/recommendations/\(id)/approve",
            relativeTo: baseURL
        ) else { return false }
        var request = authorizedRequest(url: url, method: "POST")
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return false }
            await refreshAll()
            return true
        } catch {
            return false
        }
    }

    func dismissRecommendation() async -> Bool {
        guard let url = URL(
            string: "\(apiPrefix)/recommendations/dismiss",
            relativeTo: baseURL
        ) else { return false }
        var request = authorizedRequest(url: url, method: "POST")
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return false }
            await fetchDashboard()
            await fetchInsights()
            return true
        } catch {
            return false
        }
    }

    func generateAIAnalysis() async -> Bool {
        guard !isAnalyzing else { return false }
        guard let url = URL(
            string: "\(apiPrefix)/recommendations/generate",
            relativeTo: baseURL
        ) else { return false }

        isAnalyzing = true
        defer { isAnalyzing = false }
        var request = authorizedRequest(url: url, method: "POST")
        request.timeoutInterval = 120
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else {
                return false
            }
            await refreshAll()
            return true
        } catch {
            return false
        }
    }

    func updateSettings(mode: String) async {
        guard var current = settings else { return }
        current.mode = mode
        settings = current

        guard let url = URL(string: "\(apiPrefix)/settings", relativeTo: baseURL) else { return }
        var request = authorizedRequest(url: url, method: "PATCH")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(["mode": mode])
        _ = try? await URLSession.shared.data(for: request)
    }

    private func authorizedRequest(url: URL, method: String) -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func fetch<T: Decodable>(_ path: String, setsLiveFlag: Bool = false) async -> T? {
        guard let url = URL(string: "\(apiPrefix)\(path)", relativeTo: baseURL) else {
            if setsLiveFlag {
                apiUnavailable = true
                isLive = false
                loadError = "Invalid API URL"
            }
            return nil
        }
        var request = URLRequest(url: url)
        if let token = accessToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                if setsLiveFlag {
                    apiUnavailable = true
                    isLive = false
                    loadError = "API returned non-200 status"
                }
                return nil
            }
            let decoded = try JSONDecoder().decode(T.self, from: data)
            if setsLiveFlag {
                apiUnavailable = false
                isLive = true
                loadError = nil
            }
            return decoded
        } catch {
            if setsLiveFlag {
                apiUnavailable = true
                isLive = false
                loadError = error.localizedDescription
            }
            return nil
        }
    }
}

struct TokenResponse: Codable {
    let accessToken: String
    let refreshToken: String

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
    }
}

struct DashboardData: Codable {
    let portfolio: PortfolioSummary
    let recommendation: AIRecommendation?
    let pendingTrades: Int
}

struct PortfolioSummary: Codable {
    let totalValue: Double
    let dayChange: Double
    let dayChangePercent: Double
    let riskScore: Double
    let riskLabel: String
    let allocations: [Allocation]
    let sparkline: [Double]
}

struct Allocation: Codable, Identifiable {
    var id: String { label }
    let label: String
    let percent: Double
    let color: String
}

struct PortfolioData: Codable {
    let assetClasses: [AssetClassGroup]
    let riskAlerts: [RiskAlert]?
    let allocationDrift: [String: Double]?
}

struct AssetClassGroup: Codable, Identifiable {
    var id: String { assetClass }
    let assetClass: String
    let currentPercent: Double
    let targetPercent: Double
    let positions: [Position]
}

struct Position: Codable, Identifiable {
    var id: String { symbol }
    let symbol: String
    let name: String
    let assetClass: String
    let shares: Double
    let price: Double
    let value: Double
    let changePercent: Double
}

struct AIRecommendation: Codable {
    let id: String
    let action: String
    let symbol: String
    let confidence: Int
    let riskDelta: Double
    let returnDelta: Double
    let rationale: String
    let suggestedQuantity: Double?
    let engine: String?
    let model: String?
}

struct Trade: Codable, Identifiable {
    let id: String
    let symbol: String
    let side: String
    let quantity: Double
    let price: Double
    let mode: String
    let status: String
    let timestamp: String
    let pnl: Double?
}

struct AIInsight: Codable, Identifiable {
    var id: String { title + date }
    let title: String
    let action: String
    let symbol: String?
    let confidence: Int?
    let rationale: String
    let outcome: String
    let date: String
}

struct SettingsData: Codable {
    var mode: String
    var riskProfile: String
    var motion: String
    var soundEnabled: Bool
}

struct RiskAlert: Codable {
    let code: String
    let severity: String
    let message: String
}
