import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var navTab: OptionBNavTab = .briefing
    @State private var activeScreen: ActiveScreen = .briefing
    @State private var auxiliaryScreen: AuxiliaryScreen?
    @State private var showEvidence = false

    enum ActiveScreen {
        case briefing, review, activity, portfolio
    }

    enum AuxiliaryScreen: Identifiable {
        case insights, settings
        var id: Self { self }
    }

    var body: some View {
        ZStack {
            switch activeScreen {
            case .briefing:
                OptionBBriefingScreen(
                    navTab: $navTab,
                    onPortfolio: { activeScreen = .portfolio },
                    onInsights: { auxiliaryScreen = .insights },
                    showEvidence: $showEvidence,
                    onApprove: { approveTrade() }
                )
            case .review:
                OptionBReviewScreen(
                    navTab: $navTab,
                    onBriefing: { activeScreen = .briefing; navTab = .briefing },
                    onApprove: { approveTrade() },
                    onDismiss: { dismissTrade() }
                )
            case .activity:
                OptionBActivityScreen(navTab: $navTab)
                    .onAppear { navTab = .activity }
            case .portfolio:
                OptionBPortfolioView(
                    onClose: { activeScreen = .briefing; navTab = .briefing },
                    onSettings: { auxiliaryScreen = .settings },
                    onRebalance: { rebalanceWithAI() }
                )
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.colors.bg)
        .onChange(of: navTab) { _, tab in
            if tab == .briefing { activeScreen = .briefing }
            if tab == .review { activeScreen = .review }
            if tab == .activity { activeScreen = .activity }
        }
        .sheet(item: $auxiliaryScreen) { screen in
            NavigationStack {
                Group {
                    switch screen {
                    case .insights: InsightsView()
                    case .settings: SettingsView()
                    }
                }
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") { auxiliaryScreen = nil }
                    }
                }
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
        }
        .task {
            await api.refreshAll()
        }
        .overlay(alignment: .top) {
            if let message = api.statusMessage {
                StatusToast(message: message)
                    .padding(.top, 54)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.2), value: api.statusMessage)
        .sheet(isPresented: $showEvidence) {
            if let portfolio = api.portfolio, let dashboard = api.dashboard {
                let cashPercent = dashboard.portfolio.allocations.first(where: { $0.label.lowercased().contains("cash") })?.percent ?? 0
                let topPositionPercent = portfolio.assetClasses
                    .flatMap(\.positions)
                    .map { position in
                        let invested = portfolio.assetClasses.flatMap(\.positions).reduce(0.0) { $0 + $1.value }
                        return invested > 0 ? (position.value / invested) * 100 : 0
                    }
                    .max() ?? 0
                OptionBEvidenceSheet(
                    positions: portfolio.assetClasses.flatMap(\.positions),
                    cashPercent: cashPercent,
                    topPositionPercent: topPositionPercent,
                    riskScore: dashboard.portfolio.riskScore
                )
            }
        }
    }

    private func approveTrade() {
        guard let rec = api.dashboard?.recommendation else { return }
        guard !rec.action.uppercased().contains("HOLD"), !rec.symbol.isEmpty else {
            api.showStatus("No trade to approve — AI recommends hold")
            return
        }
        Task {
            if await api.approveRecommendation(id: rec.id) {
                api.showStatus("Trade approved — paper execution queued")
                activeScreen = .activity
                navTab = .activity
            } else {
                api.showStatus("Approve failed — is the API running?")
            }
        }
    }

    private func dismissTrade() {
        Task {
            if await api.dismissRecommendation() {
                api.showStatus("Recommendation dismissed")
                activeScreen = .briefing
                navTab = .briefing
            } else {
                api.showStatus("Dismiss failed — is the API running?")
            }
        }
    }

    private func rebalanceWithAI() {
        Task {
            if await api.generateAIAnalysis() {
                api.showStatus("AI analysis ready")
                activeScreen = .review
                navTab = .review
            } else {
                api.showStatus("Analysis failed — try again")
            }
        }
    }
}

// MARK: - Briefing (mockup-faithful)

struct OptionBBriefingScreen: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @Binding var navTab: OptionBNavTab
    var onPortfolio: () -> Void
    var onInsights: () -> Void
    @Binding var showEvidence: Bool
    var onApprove: () -> Void
    @State private var period: TrendPeriodB = .thirtyDay

    private var canApprove: Bool {
        guard let rec = api.dashboard?.recommendation else { return false }
        return !api.apiUnavailable && !rec.action.uppercased().contains("HOLD") && !rec.symbol.isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 6) {
                    if api.apiUnavailable { OfflineBanner() }

                    if let dashboard = api.dashboard {
                        OptionBBriefingMockupHeader()
                            .padding(.horizontal, 16)
                            .overlay(alignment: .trailing) {
                                HStack(spacing: 8) {
                                    Button(action: onPortfolio) {
                                        Image(systemName: "chart.pie")
                                            .font(.caption.weight(.semibold))
                                            .foregroundColor(theme.colors.textMuted)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("Portfolio")
                                    Button(action: onInsights) {
                                        Image(systemName: "sparkle")
                                            .font(.caption.weight(.semibold))
                                            .foregroundColor(OptionBPalette.sparkleBlue)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityLabel("Insights")
                                }
                                .padding(.trailing, 36)
                            }

                        OptionBBriefingMockupHero(
                            portfolio: dashboard.portfolio,
                            isLive: api.isLive,
                            period: $period
                        )
                            .padding(.horizontal, 16)
                            .accessibilityIdentifier("dashboard-hero")

                        if let rec = dashboard.recommendation {
                            OptionBAIDecisionStrip(recommendation: rec) {
                                navTab = .review
                                onReviewTap()
                            }
                            .padding(.horizontal, 16)
                        }

                        OptionBMetricGrid(
                            portfolio: dashboard.portfolio,
                            recommendation: dashboard.recommendation,
                            holdings: api.portfolio,
                            compact: true,
                            forceDriftAlert: hasDrift(holdings: api.portfolio),
                            confidenceLabel: confidenceLabel(for: dashboard.recommendation)
                        )
                            .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 16)
            }
            .refreshable { await api.refreshAll() }
            .accessibilityIdentifier("dashboard-scroll")

            OptionBBriefingBottomBar(
                selected: $navTab,
                onApprove: onApprove,
                onEvidence: { showEvidence = true },
                approveEnabled: canApprove
            )
        }
        .background(theme.colors.bg)
        .task {
            await api.fetchDashboard()
            await api.fetchPortfolio()
        }
    }

    private func onReviewTap() {
        // navTab binding updates activeScreen via MainTabView.onChange
    }

    private func hasDrift(holdings: PortfolioData?) -> Bool {
        holdings?.assetClasses.contains { abs($0.currentPercent - $0.targetPercent) > 2 } ?? false
    }

    private func confidenceLabel(for rec: AIRecommendation?) -> String? {
        guard let conf = rec?.confidence else { return nil }
        return conf >= 80 ? "High" : "Moderate"
    }
}

// MARK: - Review tab

struct OptionBReviewScreen: View {
    @EnvironmentObject var api: APIClient
    @Binding var navTab: OptionBNavTab
    var onBriefing: () -> Void
    var onApprove: () -> Void
    var onDismiss: () -> Void

    var body: some View {
        Group {
            if let dashboard = api.dashboard,
               let rec = dashboard.recommendation,
               let holdings = api.portfolio {
                OptionBDecisionReviewView(
                    portfolio: dashboard.portfolio,
                    holdings: holdings,
                    recommendation: rec,
                    isLive: api.isLive,
                    onBriefing: onBriefing,
                    onApprove: onApprove,
                    onDismiss: onDismiss
                )
            } else {
                VStack(spacing: 12) {
                    Text("No active recommendation")
                        .foregroundColor(.secondary)
                    Button("Generate analysis") {
                        Task { _ = await api.generateAIAnalysis() }
                    }
                    .buttonStyle(.borderedProminent)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task {
            await api.fetchDashboard()
            await api.fetchPortfolio()
        }
    }
}

// MARK: - Activity tab

struct OptionBActivityScreen: View {
    @Binding var navTab: OptionBNavTab

    var body: some View {
        VStack(spacing: 0) {
            TradesView()
            OptionBNavOnlyBar(selected: $navTab)
        }
    }
}

// MARK: - Insights (P1)

struct InsightsView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var isRefreshing = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PulsefolioBrandHeader(
                    subtitle: "AI Insights",
                    showSparkle: true,
                    showLivePaper: true,
                    isLive: api.isLive
                )
                if api.apiUnavailable { OfflineBanner() }
                if api.insights.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("No AI decisions yet")
                            .foregroundColor(theme.colors.textMuted)
                        Button("Generate analysis") {
                            Task {
                                isRefreshing = true
                                _ = await api.generateAIAnalysis()
                                await api.fetchInsights()
                                isRefreshing = false
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(theme.colors.gain)
                    }
                    .padding(14)
                    .optionBGlass(tint: theme.colors.surface, border: theme.colors.border.opacity(0.8), cornerRadius: 14)
                } else {
                    InsightTimelineHero(insights: api.insights)
                        .optionBGlow(theme.colors.gain, radius: 12, opacity: 0.2)
                    ForEach(api.insights) { insight in
                        InsightCardView(insight: insight)
                    }
                }
            }
            .padding()
        }
        .background(theme.colors.bg)
        .refreshable { await api.refreshAll() }
        .overlay {
            if isRefreshing {
                ProgressView("Analyzing portfolio…")
                    .padding()
                    .background(theme.colors.surface)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .task { await api.fetchInsights() }
        .navigationTitle("Insights")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Settings (P1)

struct SettingsView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var tradingMode = "manual"

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                PulsefolioBrandHeader(
                    subtitle: "Settings",
                    showSparkle: false,
                    showLivePaper: true,
                    isLive: api.isLive
                )
                SettingsVisualPanel(
                    tradingMode: $tradingMode,
                    riskProfile: api.settings?.riskProfile ?? "balanced",
                    allocations: api.dashboard?.portfolio.allocations ?? []
                )
                .optionBGlow(theme.colors.gain, radius: 10, opacity: 0.15)
                .onChange(of: tradingMode) { _, v in Task { await api.updateSettings(mode: v) } }
            }
            .padding()
        }
        .background(theme.colors.bg)
        .task {
            await api.fetchSettings()
            await api.fetchDashboard()
            tradingMode = api.settings?.mode ?? "manual"
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// Keep TradesView from prior implementation
struct TradesView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var filter: TradeFilter = .all

    enum TradeFilter: String, CaseIterable, Identifiable {
        case all = "All"
        case pending = "Pending"
        var id: String { rawValue }
    }

    private var pending: [Trade] { api.trades.filter { $0.status == "pending" } }
    private var history: [Trade] { api.trades.filter { $0.status != "pending" } }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                PulsefolioBrandHeader(subtitle: "Activity", showSparkle: false, isLive: api.isLive)
                    .padding(.horizontal, 16)
                if api.apiUnavailable { OfflineBanner().padding(.horizontal, 16) }
                ActivityFlowHero(trades: api.trades)
                    .padding(.horizontal, 16)
                if !pending.isEmpty {
                    SectionHeader(title: "Pending approval", eyebrow: "Queue")
                        .padding(.horizontal, 16)
                    ForEach(pending) { trade in
                        TradeRowView(trade: trade) { Task { await api.approveTrade(id: trade.id) } }
                            .padding(.horizontal, 16)
                    }
                }
                SectionHeader(title: "History", eyebrow: "Trades")
                    .padding(.horizontal, 16)
                ForEach(history) { trade in
                    TradeRowView(trade: trade, onApprove: nil)
                        .padding(.horizontal, 16)
                }
            }
            .padding(.bottom, 16)
        }
        .background(theme.colors.bg)
        .refreshable { await api.fetchTrades(); await api.fetchDashboard() }
        .task { await api.fetchTrades() }
    }
}
