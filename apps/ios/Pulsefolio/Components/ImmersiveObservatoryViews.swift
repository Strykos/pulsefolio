import SwiftUI

// MARK: - Immersive hero (Option B + Observatory evidence)

struct ImmersivePortfolioHero: View {
    let portfolio: PortfolioSummary
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        ZStack(alignment: .bottom) {
            PremiumTrendChartView(data: portfolio.sparkline)
                .frame(height: 220)
                .padding(.horizontal, -16)

            LinearGradient(
                colors: [.clear, theme.colors.bg.opacity(0.55), theme.colors.bg],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 220)
            .allowsHitTesting(false)

            VStack(alignment: .leading, spacing: 6) {
                HStack {
                    LiveIndicatorView(isLive: true)
                    Spacer()
                    PaperTradingBadge()
                }

                Text("Total Portfolio Value")
                    .font(.caption.weight(.medium))
                    .foregroundColor(theme.colors.textMuted)

                Text(portfolio.totalValue, format: .currency(code: "USD"))
                    .font(.system(size: 36, weight: .semibold, design: .rounded))
                    .tracking(-1.5)
                    .foregroundColor(theme.colors.textPrimary)
                    .minimumScaleFactor(0.8)
                    .lineLimit(1)

                HStack(spacing: 8) {
                    Text("\(portfolio.dayChange >= 0 ? "+" : "")\(portfolio.dayChange, format: .currency(code: "USD"))")
                    Text("(\(portfolio.dayChangePercent >= 0 ? "+" : "")\(portfolio.dayChangePercent, specifier: "%.2f")%) today")
                }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(portfolio.dayChangePercent >= 0 ? theme.colors.gain : theme.colors.loss)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.bottom, 8)
        }
    }
}

struct FloatingTodayCard: View {
    let changePercent: Double
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: "sparkle")
                .font(.caption.weight(.bold))
                .foregroundColor(theme.colors.gain)
            Text("\(changePercent >= 0 ? "+" : "")\(changePercent, specifier: "%.2f")% Today")
                .font(.caption.weight(.bold))
                .foregroundColor(theme.colors.textPrimary)
            Spacer()
            LiveIndicatorView(isLive: true)
            PaperTradingBadge()
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial.opacity(0.65))
        .background(theme.colors.surface.opacity(0.35))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(theme.colors.gain.opacity(0.2), lineWidth: 1)
        )
    }
}

struct AIDecisionGlowStrip: View {
    let recommendation: AIRecommendation
    var onTap: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager

    private var headline: String {
        let verb = recommendation.action.contains("SELL") ? "Reduce" : "Add"
        let qty = recommendation.action == "HOLD" ? "" : " 10"
        return "Rebalance: \(verb)\(qty) \(recommendation.symbol)"
    }

    var body: some View {
        Button {
            onTap?()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .font(.body.weight(.semibold))
                    .foregroundColor(theme.colors.gain)
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Decision")
                        .font(.caption2.weight(.bold))
                        .foregroundColor(theme.colors.gain)
                    Text(headline)
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundColor(theme.colors.textMuted)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                LinearGradient(
                    colors: [theme.colors.gain.opacity(0.18), theme.colors.gain.opacity(0.06)],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(theme.colors.gain.opacity(0.45), lineWidth: 1)
            )
            .shadow(color: theme.colors.gain.opacity(0.2), radius: 16, y: 4)
        }
        .buttonStyle(.plain)
    }
}

struct MetricTile<Content: View>: View {
    let title: String
    let content: Content
    var accent: Color?
    @EnvironmentObject var theme: ThemeManager

    init(title: String, accent: Color? = nil, @ViewBuilder content: () -> Content) {
        self.title = title
        self.accent = accent
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .tracking(1.2)
                .foregroundColor(theme.colors.textMuted)
            content
        }
        .frame(maxWidth: .infinity, minHeight: 108, alignment: .leading)
        .padding(12)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke((accent ?? theme.colors.border).opacity(accent == nil ? 1 : 0.35), lineWidth: 1)
        )
    }
}

struct BriefingMetricGrid: View {
    let portfolio: PortfolioSummary
    let recommendation: AIRecommendation?
    @EnvironmentObject var theme: ThemeManager

    private var hasDrift: Bool {
        recommendation?.action != "HOLD" && recommendation != nil
    }

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
            MetricTile(title: "Allocation") {
                HStack(spacing: 8) {
                    DonutChartView(segments: portfolio.allocations, progress: 1)
                        .frame(width: 52, height: 52)
                    Text("\(portfolio.allocations.count) assets")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                }
            }

            MetricTile(title: "Risk Score") {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(portfolio.riskScore, specifier: "%.1f")")
                        .font(.title2.weight(.bold))
                        .foregroundColor(theme.colors.textPrimary)
                    Text(portfolio.riskLabel)
                        .font(.caption)
                        .foregroundColor(theme.colors.gain)
                }
            }

            MetricTile(title: "Confidence") {
                ObservatoryCircularMetric(
                    label: "",
                    value: "\(recommendation?.confidence ?? 0)%",
                    subvalue: (recommendation?.confidence ?? 0) >= 80 ? "High" : "Moderate",
                    progress: Double(recommendation?.confidence ?? 0),
                    color: theme.colors.gain
                )
            }

            MetricTile(
                title: hasDrift ? "Drift Alert" : "Status",
                accent: hasDrift ? Color(hex: "E7AE39") : nil
            ) {
                HStack(spacing: 8) {
                    Image(systemName: hasDrift ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                        .foregroundColor(hasDrift ? Color(hex: "E7AE39") : theme.colors.gain)
                    Text(hasDrift ? "Allocation drift" : "Within plan")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                }
            }
        }
    }
}

struct ObservatoryCarousel: View {
    let portfolio: PortfolioSummary
    let recommendation: AIRecommendation?
    let pendingCount: Int
    var onOpenReview: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager
    @State private var page = 0

    var body: some View {
        VStack(spacing: 10) {
            TabView(selection: $page) {
                carouselAllocation.tag(0)
                carouselRecommendation.tag(1)
                carouselPending.tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .frame(height: 168)

            HStack(spacing: 6) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(index == page ? theme.colors.gain : theme.colors.border)
                        .frame(width: index == page ? 7 : 5, height: index == page ? 7 : 5)
                }
            }
        }
    }

    private var carouselAllocation: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Current portfolio")
                .font(.caption.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)
            HStack(spacing: 14) {
                DonutChartView(segments: portfolio.allocations, progress: 1)
                    .frame(width: 88, height: 88)
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(portfolio.allocations.prefix(4)) { slice in
                        HStack(spacing: 6) {
                            Circle().fill(Color(hex: slice.color)).frame(width: 6, height: 6)
                            Text(slice.label)
                                .font(.caption)
                                .foregroundColor(theme.colors.textMuted)
                            Spacer()
                            Text("\(slice.percent, specifier: "%.1f")%")
                                .font(.caption.weight(.semibold))
                                .foregroundColor(theme.colors.textPrimary)
                        }
                    }
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
        .padding(.horizontal, 2)
    }

    private var carouselRecommendation: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(theme.colors.gain)
                Text("AI Recommendation")
                    .font(.caption.weight(.bold))
                    .foregroundColor(theme.colors.gain)
            }
            if let rec = recommendation, rec.action != "HOLD" {
                Text("Add \(rec.symbol)")
                    .font(.title3.weight(.bold))
                    .foregroundColor(theme.colors.textPrimary)
                Text("\(rec.confidence)% confidence")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.gain)
                HStack(spacing: 12) {
                    ObservatoryCircularMetric(
                        label: "Risk",
                        value: String(format: "%.1f", portfolio.riskScore + rec.riskDelta),
                        subvalue: "within range",
                        progress: 72,
                        color: theme.colors.accent
                    )
                    ObservatoryCircularMetric(
                        label: "Return",
                        value: String(format: "%+.1f%%", rec.returnDelta),
                        subvalue: "Change",
                        progress: 58,
                        color: theme.colors.accent
                    )
                }
                Button {
                    onOpenReview?()
                } label: {
                    Label("Open visual review", systemImage: "arrow.up.right")
                        .font(.caption.weight(.bold))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(theme.colors.gain)
                        .foregroundColor(Color(hex: "06120E"))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .buttonStyle(.plain)
            } else {
                Text("Portfolio is within plan")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(theme.colors.textPrimary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.gain.opacity(0.25), lineWidth: 1))
        .padding(.horizontal, 2)
    }

    private var carouselPending: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Pending actions")
                .font(.caption.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)
            ZStack {
                Circle()
                    .stroke(theme.colors.gain.opacity(0.2), lineWidth: 8)
                    .frame(width: 72, height: 72)
                Text("\(pendingCount)")
                    .font(.title.weight(.bold))
                    .foregroundColor(theme.colors.gain)
            }
            Text(pendingCount == 0 ? "No pending trades" : "\(pendingCount) trade\(pendingCount == 1 ? "" : "s") awaiting approval")
                .font(.subheadline)
                .foregroundColor(theme.colors.textMuted)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
        .padding(.horizontal, 2)
    }
}

struct EvidenceAccordion: View {
    let positions: [Position]
    let cashPercent: Double
    let topPositionPercent: Double
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Evidence")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(theme.colors.textPrimary)
                Spacer()
                Text("Swipe up for details")
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)
                Image(systemName: "chevron.up")
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)
            }

            EvidenceAccordionRow(
                title: "Allocation drift",
                detail: "+4.2% vs target",
                color: theme.colors.accent
            ) {
                MiniMultiLineChart(
                    series: positions.prefix(4).enumerated().map { index, position in
                        (position.symbol, driftSeries(end: position.changePercent, seed: index), chartColor(index))
                    }
                )
            }

            EvidenceAccordionRow(
                title: "Cash floor",
                detail: String(format: "%.1f%% · Min 4%%", cashPercent),
                color: theme.colors.gain
            ) {
                MiniAreaChart(values: cashSeries(end: cashPercent), color: theme.colors.gain, threshold: 4)
            }

            EvidenceAccordionRow(
                title: "Concentration",
                detail: String(format: "%.1f%% · Max 30%%", topPositionPercent),
                color: Color(hex: "8047D9")
            ) {
                MiniAreaChart(values: concentrationSeries(current: topPositionPercent), color: Color(hex: "8047D9"), threshold: 30)
            }
        }
    }

    private func chartColor(_ index: Int) -> Color {
        [theme.colors.gain, theme.colors.accent, Color(hex: "8047D9"), Color(hex: "E7AE39")][index % 4]
    }

    private func driftSeries(end: Double, seed: Int) -> [Double] {
        (0..<12).map { i in
            let progress = Double(i) / 11
            return end * progress + sin(Double(i) * 1.35 + Double(seed)) * (2.1 - progress)
        }
    }

    private func cashSeries(end: Double) -> [Double] {
        let start = max(end + 3.8, 9.5)
        return (0..<12).map { i in
            let progress = Double(i) / 11
            return start + (end - start) * progress + sin(Double(i) * 1.7) * 0.35
        }
    }

    private func concentrationSeries(current: Double) -> [Double] {
        (0..<12).map { i in
            let v = current + sin(Double(i) * 1.4) * 1.8 + cos(Double(i) * 0.65) * 1.1
            return Swift.max(0, Swift.min(40, v))
        }
    }
}

private struct EvidenceAccordionRow<Chart: View>: View {
    let title: String
    let detail: String
    let color: Color
    let chart: Chart
    @EnvironmentObject var theme: ThemeManager
    @State private var expanded = false

    init(title: String, detail: String, color: Color, @ViewBuilder chart: () -> Chart) {
        self.title = title
        self.detail = detail
        self.color = color
        self.chart = chart()
    }

    var body: some View {
        VStack(spacing: 8) {
            Button {
                withAnimation(.spring(response: 0.35)) { expanded.toggle() }
            } label: {
                HStack(spacing: 12) {
                    chart.frame(width: 56, height: 28)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(title)
                            .font(.caption.weight(.semibold))
                            .foregroundColor(theme.colors.textPrimary)
                        Text(detail)
                            .font(.caption2)
                            .foregroundColor(color)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption2)
                        .foregroundColor(theme.colors.textMuted)
                        .rotationEffect(.degrees(expanded ? 90 : 0))
                }
            }
            .buttonStyle(.plain)

            if expanded {
                chart.frame(height: 64)
            }
        }
        .padding(12)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(theme.colors.border, lineWidth: 1))
    }
}

struct GuardrailPassPills: View {
    let riskScore: Double
    let cashPercent: Double
    let topPositionPercent: Double
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 8) {
            passPill("Risk within range", passed: riskScore <= 8.5)
            passPill("Cash floor met", passed: cashPercent >= 4)
            passPill("No concentration", passed: topPositionPercent <= 30)
        }
    }

    private func passPill(_ title: String, passed: Bool) -> some View {
        VStack(spacing: 4) {
            Image(systemName: passed ? "checkmark.shield.fill" : "exclamationmark.shield.fill")
                .font(.caption)
                .foregroundColor(passed ? theme.colors.gain : theme.colors.loss)
            Text(title)
                .font(.system(size: 7, weight: .semibold))
                .foregroundColor(theme.colors.textMuted)
                .multilineTextAlignment(.center)
            Text(passed ? "Pass" : "Review")
                .font(.system(size: 7, weight: .bold))
                .foregroundColor(passed ? theme.colors.gain : theme.colors.loss)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(theme.colors.border, lineWidth: 1))
    }
}

struct ImmersiveStickyActionBar: View {
    var onApprove: (() -> Void)?
    var onAdjust: (() -> Void)?
    var onMore: (() -> Void)?
    var approveEnabled: Bool = true
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 10) {
            if let onApprove {
                Button(action: onApprove) {
                    VStack(spacing: 2) {
                        Label("Approve paper trade", systemImage: "checkmark")
                            .font(.subheadline.weight(.bold))
                        Text("Execute rebalance in paper")
                            .font(.system(size: 9))
                            .opacity(0.8)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .foregroundColor(Color(hex: "06120E"))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .disabled(!approveEnabled)
                .opacity(approveEnabled ? 1 : 0.5)
            }

            if let onAdjust {
                iconAction("slider.horizontal.3", action: onAdjust)
            }
            if let onMore {
                iconAction("ellipsis", action: onMore)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle().fill(theme.colors.border).frame(height: 0.5)
        }
    }

    private func iconAction(_ icon: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.body.weight(.semibold))
                .foregroundColor(theme.colors.textPrimary)
                .frame(width: 44, height: 44)
                .background(theme.colors.surface)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(theme.colors.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Portfolio concentration grid

struct PortfolioConcentrationGrid: View {
    let positions: [Position]
    let totalValue: Double
    @EnvironmentObject var theme: ThemeManager

    private var sorted: [Position] {
        positions.sorted { $0.value > $1.value }.prefix(5).map { $0 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Position concentration")
                .font(.caption.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                ForEach(sorted) { position in
                    let pct = totalValue > 0 ? (position.value / totalValue) * 100 : 0
                    VStack(alignment: .leading, spacing: 4) {
                        Text(position.symbol)
                            .font(.headline.weight(.bold))
                            .foregroundColor(theme.colors.textPrimary)
                        Text(position.value, format: .currency(code: "USD"))
                            .font(.caption)
                            .foregroundColor(theme.colors.textMuted)
                        Text("\(pct, specifier: "%.1f")%")
                            .font(.caption.weight(.bold))
                            .foregroundColor(assetColor(position.assetClass))
                    }
                    .frame(maxWidth: .infinity, minHeight: 72, alignment: .leading)
                    .padding(12)
                    .background(assetColor(position.assetClass).opacity(0.12))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(assetColor(position.assetClass).opacity(0.35), lineWidth: 1)
                    )
                }
            }
        }
    }

    private func assetColor(_ assetClass: String) -> Color {
        switch assetClass.uppercased() {
        case "STOCK": return Color(hex: "2F8FF0")
        case "ETF": return theme.colors.gain
        case "CRYPTO": return Color(hex: "8047D9")
        case "BOND": return Color(hex: "E7AE39")
        default: return theme.colors.textMuted
        }
    }
}

struct HoldingSparklineRow: View {
    let position: Position
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(position.symbol)
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(theme.colors.textPrimary)
                Text(shareLabel)
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)
            }
            SparklineView(data: sparkSeries(for: position))
                .frame(width: 64, height: 28)
            VStack(alignment: .trailing, spacing: 2) {
                Text(position.value, format: .currency(code: "USD"))
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.textPrimary)
                Text("\(position.changePercent >= 0 ? "+" : "")\(position.changePercent, specifier: "%.1f")%")
                    .font(.caption2.weight(.bold))
                    .foregroundColor(position.changePercent >= 0 ? theme.colors.gain : theme.colors.loss)
            }
        }
        .padding(12)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(theme.colors.border, lineWidth: 1))
    }

    private var shareLabel: String {
        let whole = position.shares.truncatingRemainder(dividingBy: 1) == 0
        return whole
            ? String(format: "%.0f sh", position.shares)
            : String(format: "%.2f sh", position.shares)
    }

    private func sparkSeries(for position: Position) -> [Double] {
        var values: [Double] = []
        for i in 0..<10 {
            let wiggle = sin(Double(i) * 0.9 + Double(position.symbol.count)) * 0.02
            let trend = position.changePercent * 0.001 * Double(i)
            values.append(position.value * (1 + wiggle + trend))
        }
        return values
    }
}

// MARK: - Decision review (immersive)

struct DecisionReviewView: View {
    let portfolio: PortfolioSummary
    let holdings: PortfolioData
    let recommendation: AIRecommendation
    var onApprove: (() -> Void)?
    var onDismiss: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager
    @Environment(\.dismiss) private var dismiss

    private var positions: [Position] {
        holdings.assetClasses.flatMap(\.positions)
    }

    private var cashPercent: Double {
        portfolio.allocations.first(where: { $0.label.lowercased().contains("cash") })?.percent ?? 10
    }

    private var topPercent: Double {
        portfolio.allocations.max(by: { $0.percent < $1.percent })?.percent ?? 0
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                header
                heroDonuts
                ObservatoryMetricGaugeRow(
                    riskScore: portfolio.riskScore,
                    riskDelta: recommendation.riskDelta,
                    returnDelta: recommendation.returnDelta,
                    confidence: recommendation.confidence
                )
                ObservatoryEvidenceRail(
                    positions: positions,
                    cashPercent: cashPercent,
                    topPositionPercent: topPercent
                )
                ObservatoryGuardrailRail(
                    riskScore: portfolio.riskScore + recommendation.riskDelta,
                    cashPercent: cashPercent,
                    topPositionPercent: topPercent
                )
                modelCard
            }
            .padding()
            .padding(.bottom, 100)
        }
        .background(theme.colors.bg)
        .safeAreaInset(edge: .bottom) {
            ImmersiveStickyActionBar(
                onApprove: onApprove,
                onAdjust: nil,
                onMore: onDismiss,
                approveEnabled: recommendation.action != "HOLD"
            )
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "sparkle")
                    .foregroundColor(theme.colors.accent)
                Text("AI Decision Review")
                    .font(.headline.weight(.semibold))
                Spacer()
                PaperTradingBadge()
            }
            Text("Add 10 \(recommendation.symbol) shares to restore balance.")
                .font(.title2.weight(.semibold))
                .foregroundColor(theme.colors.textPrimary)
            Text("Lower risk \(portfolio.riskScore, specifier: "%.1f") → \(portfolio.riskScore + recommendation.riskDelta, specifier: "%.1f")")
                .font(.subheadline)
                .foregroundColor(theme.colors.gain)
        }
    }

    private var heroDonuts: some View {
        VStack(spacing: 12) {
            HStack(spacing: 16) {
                donutColumn(title: "Before", segments: portfolio.allocations)
                Image(systemName: "arrow.right")
                    .font(.title3.weight(.bold))
                    .foregroundColor(theme.colors.gain)
                donutColumn(title: "After", segments: simulatedAfterAllocations())
            }
            Text("Capital moves into \(recommendation.symbol)")
                .font(.caption.weight(.bold))
                .foregroundColor(theme.colors.gain)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(theme.colors.gain.opacity(0.12))
                .clipShape(Capsule())
        }
        .padding(16)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(theme.colors.gain.opacity(0.2), lineWidth: 1))
        .shadow(color: theme.colors.gain.opacity(0.12), radius: 20)
    }

    private func donutColumn(title: String, segments: [Allocation]) -> some View {
        VStack(spacing: 6) {
            Text(title.uppercased())
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(theme.colors.textMuted)
            DonutChartView(segments: segments, progress: 1)
                .frame(width: 100, height: 100)
            Text(portfolio.totalValue, format: .currency(code: "USD"))
                .font(.caption2.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private func simulatedAfterAllocations() -> [Allocation] {
        portfolio.allocations.map { slice in
            if slice.label.lowercased().contains("etf") || slice.label == "VTI" {
                return Allocation(label: slice.label, percent: min(slice.percent + 2.2, 100), color: slice.color)
            }
            if slice.label.lowercased().contains("stock") {
                return Allocation(label: slice.label, percent: max(slice.percent - 1.5, 0), color: slice.color)
            }
            return slice
        }
    }

    private var modelCard: some View {
        HStack(spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.title3)
                .foregroundColor(theme.colors.gain)
            VStack(alignment: .leading, spacing: 2) {
                Text("LOCAL AI MODEL")
                    .font(.caption2.weight(.bold))
                    .foregroundColor(theme.colors.textMuted)
                Text(recommendation.model ?? "Pulsefolio Llama 3 70B")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.textPrimary)
                Text("Private · On-device · Secure")
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)
            }
            Spacer()
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(theme.colors.border, lineWidth: 1))
    }
}

// MARK: - Activity & Insights visuals

struct ActivityFlowHero: View {
    let trades: [Trade]
    @EnvironmentObject var theme: ThemeManager

    private var volumeSeries: [Double] {
        let values = trades.filter { $0.status != "pending" }.prefix(12).reversed().map { $0.price * $0.quantity }
        return values.count >= 2 ? Array(values) : [1200, 1800, 1400, 2200, 1900, 2400]
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Trade flow · 30 days")
                .font(.caption.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)
            SparklineView(data: volumeSeries)
                .frame(height: 100)
            HStack(spacing: 10) {
                statChip("Pending", value: "\(trades.filter { $0.status == "pending" }.count)")
                statChip("Executed", value: "\(trades.filter { $0.status != "pending" }.count)")
            }
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
    }

    private func statChip(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label.uppercased())
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(theme.colors.textMuted)
            Text(value)
                .font(.title3.weight(.bold))
                .foregroundColor(theme.colors.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(theme.colors.surfaceElevated.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct InsightTimelineHero: View {
    let insights: [AIInsight]
    @EnvironmentObject var theme: ThemeManager

    private var avgConfidence: Int {
        let values = insights.compactMap(\.confidence)
        guard !values.isEmpty else { return 0 }
        return values.reduce(0, +) / values.count
    }

    var body: some View {
        HStack(spacing: 14) {
            ObservatoryCircularMetric(
                label: "Avg confidence",
                value: "\(avgConfidence)%",
                subvalue: "Across \(insights.count) decisions",
                progress: Double(avgConfidence),
                color: theme.colors.gain
            )
            VStack(alignment: .leading, spacing: 8) {
                Text("Decision patterns")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.textMuted)
                HStack(spacing: 6) {
                    patternBar("Rebalance", count: insights.filter { $0.action.contains("REBALANCE") }.count, color: theme.colors.gain)
                    patternBar("Hold", count: insights.filter { $0.action == "HOLD" }.count, color: theme.colors.accent)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
    }

    private func patternBar(_ label: String, count: Int, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundColor(theme.colors.textMuted)
            RoundedRectangle(cornerRadius: 4)
                .fill(color.opacity(0.35))
                .frame(width: CGFloat(24 + count * 18), height: 8)
            Text("\(count)")
                .font(.caption.weight(.bold))
                .foregroundColor(color)
        }
    }
}

struct SettingsVisualPanel: View {
    @Binding var tradingMode: String
    let riskProfile: String
    let allocations: [Allocation]
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(spacing: 14) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Trading mode")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.textMuted)
                Picker("Mode", selection: $tradingMode) {
                    Text("Manual").tag("manual")
                    Text("Auto").tag("auto")
                }
                .pickerStyle(.segmented)
                if tradingMode == "auto" {
                    Label("Runs 24/7 on cloud", systemImage: "cloud.fill")
                        .font(.caption)
                        .foregroundColor(theme.colors.gain)
                }
            }
            .padding(14)
            .background(theme.colors.surface.opacity(0.72))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))

            HStack(spacing: 10) {
                riskGauge("Conservative", score: 3.2, active: riskProfile == "conservative")
                riskGauge("Balanced", score: 5.5, active: riskProfile == "balanced")
                riskGauge("Growth", score: 7.8, active: riskProfile == "growth")
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Target allocation")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.textMuted)
                DonutChartView(segments: allocations, progress: 1)
                    .frame(width: 120, height: 120)
                    .frame(maxWidth: .infinity)
                ForEach(allocations) { slice in
                    HStack {
                        Circle().fill(Color(hex: slice.color)).frame(width: 6, height: 6)
                        Text(slice.label)
                            .font(.caption)
                            .foregroundColor(theme.colors.textMuted)
                        Spacer()
                        Text("\(slice.percent, specifier: "%.0f")%")
                            .font(.caption.weight(.semibold))
                            .foregroundColor(theme.colors.textPrimary)
                    }
                }
            }
            .padding(14)
            .background(theme.colors.surface.opacity(0.72))
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
        }
    }

    private func riskGauge(_ label: String, score: Double, active: Bool) -> some View {
        VStack(spacing: 4) {
            Text("\(score, specifier: "%.1f")")
                .font(.caption.weight(.bold))
                .foregroundColor(active ? theme.colors.gain : theme.colors.textMuted)
            Text(label)
                .font(.system(size: 8, weight: .semibold))
                .foregroundColor(active ? theme.colors.textPrimary : theme.colors.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(active ? theme.colors.gain.opacity(0.12) : theme.colors.surface.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(active ? theme.colors.gain.opacity(0.6) : theme.colors.border, lineWidth: active ? 1.5 : 1)
        )
        .optionBGlow(active ? theme.colors.gain : .clear, radius: 8, opacity: 0.35)
    }
}
