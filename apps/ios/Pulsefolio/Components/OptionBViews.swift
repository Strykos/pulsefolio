import SwiftUI

// MARK: - Brand header (AC-B01, AC-D01, AC-P01)

struct PulsefolioBrandHeader: View {
    var subtitle: String
    var showSparkle: Bool = true
    var showLivePaper: Bool = true
    var isLive: Bool = true
    var onBack: (() -> Void)? = nil
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 10) {
            if let onBack {
                Button(action: onBack) {
                    Image(systemName: "chevron.left")
                        .font(.caption.weight(.bold))
                        .foregroundColor(theme.colors.gain)
                        .padding(8)
                        .background(theme.colors.surface)
                        .clipShape(Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Briefing")
            }
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(theme.colors.gain.opacity(0.2))
                        .frame(width: 28, height: 28)
                    Circle()
                        .stroke(theme.colors.gain, lineWidth: 1.5)
                        .frame(width: 28, height: 28)
                    Circle()
                        .fill(theme.colors.gain)
                        .frame(width: 8, height: 8)
                }
                VStack(alignment: .leading, spacing: 0) {
                    Text("Pulsefolio")
                        .font(.subheadline.weight(.bold))
                        .foregroundColor(theme.colors.textPrimary)
                    if !subtitle.isEmpty {
                        Text(subtitle)
                            .font(.caption2)
                            .foregroundColor(theme.colors.textMuted)
                    }
                }
            }
            Spacer()
            if showSparkle {
                Image(systemName: "sparkle")
                    .font(.body.weight(.semibold))
                    .foregroundColor(OptionBPalette.sparkleBlue)
                    .shadow(color: OptionBPalette.sparkleBlue.opacity(0.6), radius: 6)
            }
            if showLivePaper {
                HStack(spacing: 6) {
                    LiveIndicatorView(isLive: isLive)
                    PaperTradingBadge()
                }
            }
        }
    }
}

// MARK: - Hero area chart (AC-B02–B05)

struct OptionBAreaChartHero: View {
    let portfolio: PortfolioSummary
    var isLive: Bool = true
    @Binding var period: TrendPeriodB
    @EnvironmentObject var theme: ThemeManager
    @State private var drawProgress: CGFloat = 0

    private var series: [Double] { resample(portfolio.sparkline, count: period.pointCount) }
    private var minVal: Double { series.min() ?? 0 }
    private var maxVal: Double { series.max() ?? 1 }
    private var isUp: Bool { portfolio.dayChangePercent >= 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(portfolio.totalValue, format: .currency(code: "USD"))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundColor(theme.colors.textPrimary)
                    HStack(spacing: 4) {
                        Text(isUp ? "▲" : "▼")
                            .font(.caption.weight(.bold))
                        Text("\(abs(portfolio.dayChange), format: .currency(code: "USD")) (\(abs(portfolio.dayChangePercent), specifier: "%.2f")%) today")
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundColor(isUp ? theme.colors.gain : theme.colors.loss)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 6) {
                    LiveIndicatorView(isLive: isLive)
                    PaperTradingBadge()
                }
            }

            ZStack(alignment: .top) {
                chartCanvas
                    .frame(height: 280)

                OptionBFloatingGlassCard(
                    changePercent: portfolio.dayChangePercent,
                    dayChange: portfolio.dayChange,
                    isLive: isLive
                )
                    .padding(.horizontal, 12)
                    .padding(.top, 14)
            }

            HStack {
                OptionBTimeframePills(selection: $period)
                Spacer()
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.2)) { drawProgress = 1 }
        }
    }

    private var chartCanvas: some View {
        GeometryReader { geo in
                let padTop: CGFloat = 8
                let padBottom: CGFloat = 22
                let padRight: CGFloat = 44
                let chartH = geo.size.height - padTop - padBottom
                let chartW = geo.size.width - padRight
                let range = max(maxVal - minVal, 1)
                let strokeColor = theme.colors.gain
                let points: [CGPoint] = series.enumerated().map { i, v in
                    CGPoint(
                        x: chartW * CGFloat(i) / CGFloat(max(series.count - 1, 1)),
                        y: padTop + chartH * (1 - CGFloat((v - minVal) / range))
                    )
                }

                ZStack(alignment: .topLeading) {
                    ForEach(0..<3, id: \.self) { i in
                        let tick = maxVal - (Double(i) / 2) * (maxVal - minVal)
                        let y = padTop + chartH * (1 - CGFloat((tick - minVal) / range))
                        Text(compactK(tick))
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(theme.colors.textMuted)
                            .position(x: geo.size.width - 22, y: y)
                    }

                    if points.count > 1 {
                        areaPath(points: points, chartH: chartH, padTop: padTop)
                            .fill(
                                LinearGradient(
                                    colors: [strokeColor.opacity(0.72), strokeColor.opacity(0.22), strokeColor.opacity(0.02)],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .opacity(Double(drawProgress))

                        smoothLinePath(points: points)
                            .trim(from: 0, to: drawProgress)
                            .stroke(strokeColor, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                            .optionBGlow(strokeColor, radius: 20, opacity: 0.65)

                        if let last = points.last {
                            Circle()
                                .fill(strokeColor)
                                .frame(width: 8, height: 8)
                                .position(last)
                                .shadow(color: strokeColor, radius: 12)
                                .shadow(color: strokeColor.opacity(0.5), radius: 24)
                        }
                    }

                    HStack {
                        ForEach(period.xLabels, id: \.self) { label in
                            Text(label)
                                .font(.system(size: 9))
                                .foregroundColor(theme.colors.textMuted)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .frame(width: chartW)
                    .position(x: chartW / 2, y: geo.size.height - 6)
                }
        }
    }

    private func compactK(_ value: Double) -> String {
        value >= 1000 ? String(format: "$%.0fK", value / 1000) : String(format: "$%.0f", value)
    }

    private func resample(_ data: [Double], count: Int) -> [Double] {
        guard !data.isEmpty, count > 1 else { return data }
        return (0..<count).map { i in
            let t = Double(i) / Double(count - 1) * Double(data.count - 1)
            let lo = Int(floor(t))
            let hi = min(data.count - 1, lo + 1)
            return data[lo] * (1 - (t - Double(lo))) + data[hi] * (t - Double(lo))
        }
    }

    private func smoothLinePath(points: [CGPoint]) -> Path {
        var path = Path()
        guard points.count > 1 else { return path }
        path.move(to: points[0])
        for i in 1..<points.count {
            let p0 = points[max(i - 2, 0)]
            let p1 = points[i - 1]
            let p2 = points[i]
            let p3 = points[min(i + 1, points.count - 1)]
            let cp1 = CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6)
            let cp2 = CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
            path.addCurve(to: p2, control1: cp1, control2: cp2)
        }
        return path
    }

    private func linePath(points: [CGPoint]) -> Path {
        var path = Path()
        guard let first = points.first else { return path }
        path.move(to: first)
        for pt in points.dropFirst() { path.addLine(to: pt) }
        return path
    }

    private func areaPath(points: [CGPoint], chartH: CGFloat, padTop: CGFloat) -> Path {
        var path = smoothLinePath(points: points)
        guard let last = points.last, let first = points.first else { return path }
        path.addLine(to: CGPoint(x: last.x, y: padTop + chartH))
        path.addLine(to: CGPoint(x: first.x, y: padTop + chartH))
        path.closeSubpath()
        return path
    }
}

enum TrendPeriodB: String, CaseIterable, Identifiable {
    case oneDay = "1D"
    case oneWeek = "7D"
    case thirtyDay = "30D"
    case threeMonth = "3M"
    case ytd = "YTD"
    case oneYear = "1Y"
    case all = "ALL"
    var id: String { rawValue }

    var pointCount: Int {
        switch self {
        case .oneDay: return 24
        case .oneWeek: return 28
        case .thirtyDay: return 30
        case .threeMonth: return 36
        case .ytd, .oneYear, .all: return 40
        }
    }

    var xLabels: [String] {
        switch self {
        case .oneDay: return ["9a", "12p", "3p", "Now"]
        case .oneWeek: return ["Mon", "Wed", "Fri", "Now"]
        case .thirtyDay: return ["Jul 2", "Jul 9", "Jul 16", "Jul 23", "Jul 31"]
        case .threeMonth, .ytd, .oneYear, .all: return ["W1", "W2", "W3", "W4", "Now"]
        }
    }
}

struct OptionBTimeframePills: View {
    @Binding var selection: TrendPeriodB
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 4) {
                ForEach(TrendPeriodB.allCases) { period in
                    Button {
                        withAnimation(.spring(response: 0.3)) { selection = period }
                    } label: {
                        Text(period.rawValue)
                            .font(.caption2.weight(.semibold))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(
                                selection == period
                                    ? AnyShapeStyle(theme.colors.gain)
                                    : AnyShapeStyle(Color.clear)
                            )
                            .foregroundColor(selection == period ? Color(hex: "06120E") : theme.colors.textMuted)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(selection == period ? theme.colors.gain.opacity(0.6) : Color.clear, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

// MARK: - AI strip (AC-B06)

struct OptionBAIDecisionStrip: View {
    let recommendation: AIRecommendation
    var onTap: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager

    private var isHold: Bool {
        recommendation.action.uppercased().contains("HOLD") || recommendation.symbol.isEmpty
    }

    private var quantity: Int { Int(recommendation.suggestedQuantity ?? 10) }

    var body: some View {
        Button(action: { onTap?() }) {
            HStack(spacing: 12) {
                Image(systemName: isHold ? "hand.raised.circle.fill" : "chart.line.uptrend.xyaxis.circle.fill")
                    .font(.title2)
                    .foregroundColor(theme.colors.gain)
                    .shadow(color: theme.colors.gain.opacity(0.6), radius: 8)
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Decision")
                        .font(.caption2.weight(.bold))
                        .foregroundColor(theme.colors.gain)
                    if isHold {
                        Text("Hold — \(recommendation.confidence)% confidence")
                            .font(.subheadline.weight(.semibold))
                            .foregroundColor(theme.colors.textPrimary)
                    } else {
                        HStack(spacing: 0) {
                            Text("Rebalance: Add \(quantity) ")
                                .foregroundColor(theme.colors.textPrimary)
                            Text(recommendation.symbol)
                                .foregroundColor(OptionBPalette.sparkleBlue)
                                .fontWeight(.bold)
                        }
                        .font(.subheadline.weight(.semibold))
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(theme.colors.textMuted)
            }
            .padding(12)
            .background(
                LinearGradient(
                    colors: [theme.colors.gain.opacity(0.22), theme.colors.surface.opacity(0.85), theme.colors.gain.opacity(0.08)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        LinearGradient(colors: [theme.colors.gain, theme.colors.gain.opacity(0.55)], startPoint: .topLeading, endPoint: .bottomTrailing),
                        lineWidth: 3
                    )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18)
                    .stroke(theme.colors.gain.opacity(0.4), lineWidth: 5)
                    .blur(radius: 3)
                    .padding(-2)
            )
        }
        .buttonStyle(.plain)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(theme.colors.gain.opacity(0.28))
                .blur(radius: 22)
                .padding(-8)
        )
        .optionBGlow(theme.colors.gain, radius: 40, opacity: 0.65)
    }
}

// MARK: - 2×2 metric grid (AC-B07)

struct OptionBMetricGrid: View {
    let portfolio: PortfolioSummary
    let recommendation: AIRecommendation?
    var holdings: PortfolioData?
    var compact: Bool = false
    var forceDriftAlert: Bool = false
    var confidenceLabel: String? = nil
    @EnvironmentObject var theme: ThemeManager

    private var assetCount: Int {
        portfolio.allocations.filter { $0.percent > 0.5 }.count
    }

    private var hasDrift: Bool {
        if forceDriftAlert { return true }
        return holdings?.assetClasses.contains { abs($0.currentPercent - $0.targetPercent) > 2 } ?? false
    }

    var body: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
            allocationTile
            riskTile
            confidenceTile
            driftTile
        }
    }

    private var allocationTile: some View {
        tileContainer {
            Text("Allocation")
                .font(.caption.weight(.medium))
                .foregroundColor(theme.colors.textMuted)
            ZStack {
                DonutChartView(segments: portfolio.allocations, progress: 1)
                    .frame(width: compact ? 58 : 72, height: compact ? 58 : 72)
                VStack(spacing: 0) {
                    Text("\(assetCount)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(theme.colors.textPrimary)
                    Text("Assets")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(theme.colors.textMuted)
                }
            }
            .frame(maxWidth: .infinity)
        }
    }

    private var riskTile: some View {
        tileContainer {
            Text("Risk Score")
                .font(.caption.weight(.medium))
                .foregroundColor(theme.colors.textMuted)
            RiskGaugeCompact(score: portfolio.riskScore, label: portfolio.riskLabel)
        }
    }

    private var confidenceTile: some View {
        tileContainer {
            Text("Confidence")
                .font(.caption.weight(.medium))
                .foregroundColor(theme.colors.textMuted)
            let conf = recommendation?.confidence ?? 78
            let ringSize: CGFloat = compact ? 70 : 88
            ZStack {
                Circle().stroke(Color(hex: "202A34"), lineWidth: compact ? 6 : 7).frame(width: ringSize, height: ringSize)
                Circle()
                    .trim(from: 0, to: CGFloat(conf) / 100)
                    .stroke(theme.colors.gain, style: StrokeStyle(lineWidth: compact ? 6 : 7, lineCap: .round))
                    .frame(width: ringSize, height: ringSize)
                    .rotationEffect(.degrees(-90))
                    .shadow(color: theme.colors.gain.opacity(0.45), radius: 8)
                VStack(spacing: 2) {
                    Text("\(conf)%")
                        .font(.title3.weight(.bold))
                    Text(confidenceLabel ?? (conf >= 80 ? "High" : "Moderate"))
                        .font(.caption2)
                        .foregroundColor(theme.colors.gain)
                }
            }
        }
    }

    private var driftTile: some View {
        tileContainer(border: hasDrift ? Color(hex: "E7AE39").opacity(0.4) : nil) {
            Text("Drift Alert")
                .font(.caption.weight(.medium))
                .foregroundColor(hasDrift ? Color(hex: "E7AE39") : theme.colors.textMuted)
            HStack(spacing: 8) {
                Image(systemName: hasDrift ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                    .foregroundColor(hasDrift ? Color(hex: "E7AE39") : theme.colors.gain)
                DriftMiniSparkline()
                    .frame(height: compact ? 28 : 36)
            }
            Text(hasDrift ? "Allocation drift detected" : "On target")
                .font(.caption2)
                .foregroundColor(theme.colors.textMuted)
        }
    }

    private func tileContainer<Content: View>(border: Color? = nil, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            content()
        }
        .frame(maxWidth: .infinity, minHeight: compact ? 74 : 124, alignment: .leading)
        .padding(compact ? 7 : 12)
        .background(
            Group {
                if border != nil {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(OptionBPalette.driftSurface)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(border!, lineWidth: 1))
                } else {
                    RoundedRectangle(cornerRadius: 14)
                        .fill(theme.colors.surface.opacity(0.72))
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
                }
            }
        )
    }
}

// MARK: - Briefing layout freeze (Phase 1 — mockup PNG, no API)

/// AC-B01: logo + stacked wordmark/subtitle, blue sparkle top-right.
struct OptionBBriefingMockupHeader: View {
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(theme.colors.gain.opacity(0.2))
                        .frame(width: 28, height: 28)
                    Image(systemName: "waveform.path")
                        .font(.caption2.weight(.bold))
                        .foregroundColor(theme.colors.gain)
                }
                VStack(alignment: .leading, spacing: 1) {
                    Text("Pulsefolio")
                        .font(.subheadline.weight(.bold))
                        .foregroundColor(theme.colors.textPrimary)
                    Text("Morning Briefing")
                        .font(.caption2.weight(.medium))
                        .foregroundColor(theme.colors.textMuted)
                }
            }
            Spacer()
            Image(systemName: "sparkle")
                .font(.body.weight(.semibold))
                .foregroundColor(OptionBPalette.sparkleBlue)
                .shadow(color: OptionBPalette.sparkleBlue.opacity(0.6), radius: 6)
                .accessibilityLabel("Insights")
        }
    }
}

/// AC-B02–B05: value label, chart without overlay, pills, then glass strip (AC-B03).
struct OptionBBriefingMockupHero: View {
    let portfolio: PortfolioSummary
    var isLive: Bool = true
    @Binding var period: TrendPeriodB
    @EnvironmentObject var theme: ThemeManager
    @State private var drawProgress: CGFloat = 0

    private var series: [Double] { resample(portfolio.sparkline, count: period.pointCount) }
    private var minVal: Double { series.min() ?? 0 }
    private var maxVal: Double { series.max() ?? 1 }
    private var isUp: Bool { portfolio.dayChangePercent >= 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Total Portfolio Value")
                .font(.caption2.weight(.medium))
                .foregroundColor(theme.colors.textMuted)

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(portfolio.totalValue, format: .currency(code: "USD"))
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundColor(theme.colors.textPrimary)
                    HStack(spacing: 4) {
                        Text(isUp ? "▲" : "▼")
                            .font(.caption.weight(.bold))
                        Text("\(abs(portfolio.dayChange), format: .currency(code: "USD")) (\(abs(portfolio.dayChangePercent), specifier: "%.2f")%) today")
                            .font(.caption.weight(.semibold))
                    }
                    .foregroundColor(isUp ? theme.colors.gain : theme.colors.loss)
                }
                Spacer(minLength: 8)
                VStack(alignment: .trailing, spacing: 6) {
                    LiveIndicatorView(isLive: isLive)
                    PaperTradingBadge()
                }
            }

            ZStack(alignment: .top) {
                mockupChartCanvas
                    .frame(height: 220)

                OptionBFloatingGlassCard(
                    changePercent: portfolio.dayChangePercent,
                    dayChange: portfolio.dayChange,
                    isLive: isLive
                )
                .padding(.horizontal, 12)
                .padding(.top, 12)
            }

            OptionBTimeframePills(selection: $period)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.2)) { drawProgress = 1 }
        }
    }

    private var mockupChartCanvas: some View {
        GeometryReader { geo in
            let padTop: CGFloat = 6
            let padBottom: CGFloat = 18
            let padRight: CGFloat = 40
            let chartH = geo.size.height - padTop - padBottom
            let chartW = geo.size.width - padRight
            let range = max(maxVal - minVal, 1)
            let strokeColor = theme.colors.gain
            let points: [CGPoint] = series.enumerated().map { i, v in
                CGPoint(
                    x: chartW * CGFloat(i) / CGFloat(max(series.count - 1, 1)),
                    y: padTop + chartH * (1 - CGFloat((v - minVal) / range))
                )
            }

            ZStack(alignment: .topLeading) {
                ForEach(0..<4, id: \.self) { i in
                    let tick = maxVal - (Double(i) / 3) * (maxVal - minVal)
                    let y = padTop + chartH * (1 - CGFloat((tick - minVal) / range))
                    Text(compactK(tick))
                        .font(.system(size: 9, weight: .medium))
                        .foregroundColor(theme.colors.textMuted)
                        .position(x: geo.size.width - 20, y: y)
                }

                if points.count > 1 {
                    mockupAreaPath(points: points, chartH: chartH, padTop: padTop)
                        .fill(
                            LinearGradient(
                                colors: [strokeColor.opacity(0.72), strokeColor.opacity(0.22), strokeColor.opacity(0.02)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(Double(drawProgress))

                    mockupSmoothLine(points: points)
                        .trim(from: 0, to: drawProgress)
                        .stroke(strokeColor, style: StrokeStyle(lineWidth: 3, lineCap: .round, lineJoin: .round))
                        .optionBGlow(strokeColor, radius: 16, opacity: 0.55)
                }

                HStack {
                    ForEach(period.xLabels, id: \.self) { label in
                        Text(label)
                            .font(.system(size: 9))
                            .foregroundColor(theme.colors.textMuted)
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(width: chartW)
                .position(x: chartW / 2, y: geo.size.height - 5)
            }
        }
    }

    private func compactK(_ value: Double) -> String {
        value >= 1000 ? String(format: "$%.0fK", value / 1000) : String(format: "$%.0f", value)
    }

    private func resample(_ data: [Double], count: Int) -> [Double] {
        guard !data.isEmpty, count > 1 else { return data }
        return (0..<count).map { i in
            let t = Double(i) / Double(count - 1) * Double(data.count - 1)
            let lo = Int(floor(t))
            let hi = min(data.count - 1, lo + 1)
            return data[lo] * (1 - (t - Double(lo))) + data[hi] * (t - Double(lo))
        }
    }

    private func mockupSmoothLine(points: [CGPoint]) -> Path {
        var path = Path()
        guard points.count > 1 else { return path }
        path.move(to: points[0])
        for i in 1..<points.count {
            let p0 = points[max(i - 2, 0)]
            let p1 = points[i - 1]
            let p2 = points[i]
            let p3 = points[min(i + 1, points.count - 1)]
            let cp1 = CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6)
            let cp2 = CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
            path.addCurve(to: p2, control1: cp1, control2: cp2)
        }
        return path
    }

    private func mockupAreaPath(points: [CGPoint], chartH: CGFloat, padTop: CGFloat) -> Path {
        var path = mockupSmoothLine(points: points)
        guard let last = points.last, let first = points.first else { return path }
        path.addLine(to: CGPoint(x: last.x, y: padTop + chartH))
        path.addLine(to: CGPoint(x: first.x, y: padTop + chartH))
        path.closeSubpath()
        return path
    }
}

struct RiskGaugeCompact: View {
    let score: Double
    let label: String
    @EnvironmentObject var theme: ThemeManager
    @State private var animated = 1.0

    private var rotation: Double { -80 + (min(10, max(1, animated)) - 1) / 9 * 160 }

    private var rainbowGradient: LinearGradient {
        LinearGradient(
            colors: [
                Color(hex: "00D4AA"),
                Color(hex: "7DD87A"),
                Color(hex: "E7C547"),
                Color(hex: "E7AE39"),
                Color(hex: "E85D4C")
            ],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                GaugeArc(progress: 1)
                    .stroke(Color(hex: "1A2030"), style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 112, height: 58)

                GaugeArc(progress: 1)
                    .stroke(rainbowGradient, style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 112, height: 58)
                    .shadow(color: theme.colors.gain.opacity(0.3), radius: 6)

                Rectangle()
                    .fill(theme.colors.textPrimary)
                    .frame(width: 3, height: 32)
                    .offset(y: -16)
                    .rotationEffect(.degrees(rotation))
                    .offset(y: 8)
                    .shadow(color: theme.colors.textPrimary.opacity(0.5), radius: 2)

                Circle()
                    .fill(theme.colors.textPrimary)
                    .frame(width: 7, height: 7)
                    .offset(y: 8)
            }
            Text("\(score, specifier: "%.1f")")
                .font(.headline.weight(.bold))
            Text(label)
                .font(.caption2)
                .foregroundColor(theme.colors.gain)
        }
        .onAppear {
            withAnimation(.spring(response: 0.8)) { animated = score }
        }
        .onChange(of: score) { _, newValue in
            withAnimation(.spring(response: 0.6)) { animated = newValue }
        }
    }
}

struct DriftMiniSparkline: View {
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        GeometryReader { geo in
            let values: [Double] = [2, 4, 3, 6, 5, 8, 7, 9, 8, 10]
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let range = max(maxV - minV, 1)
            let points = values.enumerated().map { i, v in
                CGPoint(x: geo.size.width * CGFloat(i) / CGFloat(values.count - 1), y: geo.size.height * (1 - CGFloat((v - minV) / range)))
            }
            Path { p in
                p.move(to: points[0])
                for pt in points.dropFirst() { p.addLine(to: pt) }
            }
            .stroke(Color(hex: "E7AE39"), lineWidth: 2)
        }
    }
}

// MARK: - Bottom nav (AC-B08, AC-B09)

enum OptionBNavTab: Int, CaseIterable {
    case briefing, review, activity
    var label: String {
        switch self {
        case .briefing: return "Briefing"
        case .review: return "Review"
        case .activity: return "Activity"
        }
    }
}

struct OptionBNavOnlyBar: View {
    @Binding var selected: OptionBNavTab
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 0) {
            ForEach(OptionBNavTab.allCases, id: \.rawValue) { tab in
                Button {
                    withAnimation(.spring(response: 0.3)) { selected = tab }
                } label: {
                    Text(tab.label)
                        .font(.caption.weight(selected == tab ? .bold : .medium))
                        .foregroundColor(selected == tab ? theme.colors.gain : theme.colors.textMuted)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .background(theme.colors.surface)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(theme.colors.border, lineWidth: 1))
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }
}

struct OptionBBriefingBottomBar: View {
    @Binding var selected: OptionBNavTab
    var onApprove: () -> Void
    var onEvidence: (() -> Void)?
    var approveEnabled: Bool
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(spacing: 8) {
            Button { onEvidence?() } label: {
                HStack(spacing: 4) {
                    Image(systemName: "chevron.up")
                        .font(.caption2)
                    Text("Swipe up for evidence")
                        .font(.caption2)
                        .foregroundColor(theme.colors.textMuted)
                }
            }
            .buttonStyle(.plain)

            HStack(spacing: 8) {
                HStack(spacing: 0) {
                    ForEach(OptionBNavTab.allCases, id: \.rawValue) { tab in
                        Button {
                            withAnimation(.spring(response: 0.3)) { selected = tab }
                        } label: {
                            VStack(spacing: 4) {
                                Text(tab.label)
                                    .font(.caption.weight(selected == tab ? .bold : .medium))
                                    .foregroundColor(selected == tab ? theme.colors.gain : theme.colors.textMuted)
                                    .lineLimit(1)
                                    .minimumScaleFactor(0.85)
                                if selected == tab {
                                    Capsule()
                                        .fill(theme.colors.gain)
                                        .frame(width: 28, height: 2)
                                } else {
                                    Color.clear.frame(height: 2)
                                }
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 4)
                .background(theme.colors.surface.opacity(0.85))
                .clipShape(Capsule())
                .overlay(Capsule().stroke(theme.colors.border, lineWidth: 1))

                Spacer(minLength: 4)

                if approveEnabled {
                    Button(action: onApprove) {
                        Label("Approve Trade", systemImage: "checkmark")
                            .font(.caption.weight(.bold))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(
                                LinearGradient(colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")], startPoint: .topLeading, endPoint: .bottomTrailing)
                            )
                            .foregroundColor(Color(hex: "06120E"))
                            .clipShape(Capsule())
                            .shadow(color: theme.colors.gain.opacity(0.45), radius: 10)
                    }
                    .buttonStyle(.plain)
                    .fixedSize()
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(.ultraThinMaterial)
    }
}

// MARK: - Evidence sheet (AC-B10)

struct OptionBEvidenceSheet: View {
    let positions: [Position]
    let cashPercent: Double
    let topPositionPercent: Double
    var riskScore: Double = 4.2
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Capsule()
                .fill(theme.colors.border)
                .frame(width: 36, height: 4)
                .frame(maxWidth: .infinity)
            Text("Evidence")
                .font(.headline.weight(.semibold))
            ObservatoryEvidenceRail(
                positions: positions,
                cashPercent: cashPercent,
                topPositionPercent: topPositionPercent
            )
            ObservatoryGuardrailRail(
                riskScore: riskScore,
                cashPercent: cashPercent,
                topPositionPercent: topPositionPercent
            )
        }
        .padding()
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}

// MARK: - Energy flow between donuts (AC-D02)

struct EnergyFlowView: View {
    @EnvironmentObject var theme: ThemeManager
    @State private var phase: CGFloat = 0

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            ZStack {
                ForEach([-0.14, -0.06, 0.0, 0.08], id: \.self) { bend in
                    energyPath(w: w, h: h, bend: bend)
                        .stroke(
                            LinearGradient(
                                colors: [theme.colors.gain.opacity(0.08), theme.colors.gain.opacity(0.7), theme.colors.accent.opacity(0.5)],
                                startPoint: .leading,
                                endPoint: .trailing
                            ),
                            style: StrokeStyle(lineWidth: bend == 0 ? 3.5 : 2, lineCap: .round)
                        )
                        .blur(radius: bend == 0 ? 10 : 6)
                        .opacity(bend == 0 ? 1 : 0.65)
                }

                energyPath(w: w, h: h, bend: 0.05)
                    .stroke(theme.colors.gain, style: StrokeStyle(lineWidth: 2, lineCap: .round))
                    .shadow(color: theme.colors.gain.opacity(0.95), radius: 14)

                ForEach(0..<4, id: \.self) { i in
                    Circle()
                        .fill(theme.colors.gain)
                        .frame(width: 4, height: 4)
                        .shadow(color: theme.colors.gain, radius: 4)
                        .offset(
                            x: w * (0.15 + CGFloat(i) * 0.22) + sin(phase + CGFloat(i)) * 3,
                            y: h * (0.35 + CGFloat(i) * 0.08)
                        )
                }

                Image(systemName: "arrow.right")
                    .font(.caption.weight(.bold))
                    .foregroundColor(theme.colors.gain)
                    .shadow(color: theme.colors.gain.opacity(0.8), radius: 8)
                    .offset(x: sin(phase) * 4)
            }
        }
        .frame(width: 36, height: 152)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) {
                phase = .pi * 2
            }
        }
    }

    private func energyPath(w: CGFloat, h: CGFloat, bend: CGFloat = 0.05) -> Path {
        var path = Path()
        path.move(to: CGPoint(x: 0, y: h * 0.32))
        path.addCurve(
            to: CGPoint(x: w, y: h * 0.68),
            control1: CGPoint(x: w * (0.3 + bend), y: h * 0.02),
            control2: CGPoint(x: w * (0.7 - bend), y: h * 0.98)
        )
        return path
    }
}

// MARK: - Decision Review mockup (AC-D01–D08)

struct OptionBDecisionReviewView: View {
    let portfolio: PortfolioSummary
    let holdings: PortfolioData
    let recommendation: AIRecommendation
    var isLive: Bool = true
    var onBriefing: (() -> Void)?
    var onApprove: (() -> Void)?
    var onDismiss: (() -> Void)?
    var onAdjust: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager

    private var positions: [Position] { holdings.assetClasses.flatMap(\.positions) }
    private var cashPercent: Double {
        portfolio.allocations.first(where: { $0.label.lowercased().contains("cash") })?.percent ?? 10
    }
    private var currentRisk: Double { portfolio.riskScore }
    private var proposedRisk: Double { min(10, max(1, currentRisk + recommendation.riskDelta)) }
    private var riskImproves: Bool { recommendation.riskDelta < 0 }
    private var isHold: Bool {
        recommendation.action.uppercased().contains("HOLD") || recommendation.symbol.isEmpty
    }
    private var tradeQuantity: Int { Int(recommendation.suggestedQuantity ?? 10) }
    private var guardrailPass: Bool {
        let topPct = portfolio.allocations.map(\.percent).max() ?? 0
        let cashOk = cashPercent >= 5
        let riskOk = portfolio.riskScore <= 8
        let concOk = topPct <= 40
        return riskOk && cashOk && concOk
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PulsefolioBrandHeader(
                        subtitle: "AI Decision Review",
                        showSparkle: false,
                        showLivePaper: true,
                        isLive: isLive,
                        onBack: onBriefing
                    )

                    VStack(alignment: .leading, spacing: 6) {
                        if isHold {
                            Text("Hold — no trade needed")
                                .font(.title.weight(.bold))
                        } else {
                            (Text("Add \(tradeQuantity) ") + Text(recommendation.symbol).foregroundColor(theme.colors.gain).bold())
                                .font(.title.weight(.bold))
                        }
                        if riskImproves {
                            Text("Lower risk \(currentRisk, specifier: "%.1f") → \(proposedRisk, specifier: "%.1f")")
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(theme.colors.gain)
                        } else if recommendation.riskDelta == 0 {
                            Text(isHold ? "Portfolio within guardrails" : "Risk stable at \(currentRisk, specifier: "%.1f")")
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(theme.colors.textMuted)
                        } else {
                            Text("Risk \(currentRisk, specifier: "%.1f") → \(proposedRisk, specifier: "%.1f")")
                                .font(.subheadline.weight(.semibold))
                                .foregroundColor(theme.colors.textMuted)
                        }
                    }

                    heroDonuts
                    heroOrbs
                    sheetCard
                }
                .padding()
                .padding(.bottom, 12)
            }

            bottomActions
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
        }
        .background(theme.colors.bg)
    }

    private var heroDonuts: some View {
        VStack(spacing: 10) {
            HStack(spacing: 2) {
                donutBlock(title: "BEFORE", subtitle: "Current portfolio", segments: portfolio.allocations)
                EnergyFlowView()
                donutBlock(title: "AFTER", subtitle: isHold ? "No change" : "Proposed portfolio", segments: simulatedAfter())
            }
            Text(isHold ? "No capital movement required" : "Capital moves into \(recommendation.symbol)")
                .font(.caption.weight(.bold))
                .foregroundColor(theme.colors.gain)
        }
    }

    private func donutBlock(title: String, subtitle: String, segments: [Allocation]) -> some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(size: 9, weight: .bold))
                .foregroundColor(theme.colors.textMuted)
            Text(subtitle)
                .font(.system(size: 7, weight: .medium))
                .foregroundColor(theme.colors.textMuted.opacity(0.8))
            DonutChartView(segments: segments, progress: 1)
                .frame(width: 152, height: 152)
                .shadow(color: theme.colors.gain.opacity(0.35), radius: 20)
            Text(portfolio.totalValue, format: .currency(code: "USD"))
                .font(.caption2.weight(.semibold))
                .foregroundColor(theme.colors.textMuted)
        }
        .frame(maxWidth: .infinity)
    }

    private var heroOrbs: some View {
        HStack(spacing: 8) {
            heroOrb(title: "CONFIDENCE", value: "\(recommendation.confidence)%", sub: recommendation.confidence >= 80 ? "High" : "Moderate", color: theme.colors.gain)
            heroOrb(title: "EXPECTED RETURN", value: String(format: "%+.1f%%", recommendation.returnDelta), sub: "Change", color: theme.colors.accent)
            heroOrb(title: "GUARDRAILS", value: guardrailPass ? "3/3" : "2/3", sub: guardrailPass ? "Pass" : "Review", color: guardrailPass ? theme.colors.gain : Color(hex: "E7AE39"))
        }
    }

    private func heroOrb(title: String, value: String, sub: String, color: Color) -> some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.system(size: 7, weight: .bold))
                .foregroundColor(theme.colors.textMuted)
            ZStack {
                Circle().stroke(color.opacity(0.15), lineWidth: 5).frame(width: 76, height: 76)
                Circle().stroke(color, lineWidth: 2.5).frame(width: 76, height: 76)
                    .shadow(color: color.opacity(0.75), radius: 14)
                VStack(spacing: 2) {
                    Text(value).font(.caption.weight(.bold))
                    Text(sub).font(.system(size: 7)).foregroundColor(color)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var sheetCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(alignment: .top, spacing: 10) {
                positionTable
                    .frame(maxWidth: .infinity)
                VStack(alignment: .leading, spacing: 8) {
                    Text("EVIDENCE")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(theme.colors.textMuted)
                    ObservatoryEvidenceRail(
                        positions: positions,
                        cashPercent: cashPercent,
                        topPositionPercent: portfolio.allocations.map(\.percent).max() ?? 0
                    )
                }
                .frame(width: 148)
            }
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("RISK SCORE")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(theme.colors.textMuted)
                    RiskGaugeCompact(score: proposedRisk, label: riskImproves ? "Lower risk" : "Stable")
                }
                .frame(maxWidth: .infinity)
                VStack(alignment: .leading, spacing: 6) {
                    Text("REBALANCE IMPACT")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(theme.colors.textMuted)
                    if isHold {
                        Text("• Portfolio aligned with targets")
                        Text("• No trades required today")
                    } else {
                        Text("• Moves capital into \(recommendation.symbol)")
                        Text("• Improves diversification")
                    }
                }
                .font(.caption2)
                .foregroundColor(theme.colors.gain)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            guardrailChecklist
        }
        .padding(14)
        .optionBGlass(tint: theme.colors.surface, border: theme.colors.border.opacity(0.8), cornerRadius: 16)
    }

    private var positionTable: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("POSITION IMPACT")
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(theme.colors.textMuted)
            HStack {
                Text("ASSET").frame(maxWidth: .infinity, alignment: .leading)
                Text("BEFORE").frame(width: 44)
                Text("AFTER").frame(width: 44)
                Text("CHANGE").frame(width: 44)
                Text("$ Δ").frame(width: 44)
            }
            .font(.system(size: 7, weight: .bold))
            .foregroundColor(theme.colors.textMuted)
            ForEach(tableRows(), id: \.symbol) { row in
                HStack {
                    HStack(spacing: 4) {
                        Circle().fill(Color(hex: row.color)).frame(width: 6, height: 6)
                        Text(row.symbol).font(.caption2.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text(row.before).font(.caption2).frame(width: 44)
                    Text(row.after).font(.caption2).frame(width: 44)
                    Text(row.change).font(.caption2).foregroundColor(row.change.hasPrefix("+") ? theme.colors.gain : theme.colors.loss).frame(width: 44)
                    Text(row.dollar).font(.caption2).frame(width: 44)
                }
            }
        }
    }

    private var guardrailChecklist: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("GUARDRAILS")
                .font(.system(size: 8, weight: .bold))
                .foregroundColor(theme.colors.textMuted)
            ForEach(guardrailItems(), id: \.label) { item in
                HStack {
                    Image(systemName: item.pass ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundColor(item.pass ? theme.colors.gain : Color(hex: "E7AE39"))
                        .font(.caption)
                    Text(item.label).font(.caption2)
                    Spacer()
                    Text(item.pass ? "Pass" : "Review")
                        .font(.caption2.weight(.bold))
                        .foregroundColor(item.pass ? theme.colors.gain : Color(hex: "E7AE39"))
                }
            }
        }
    }

    private struct GuardrailItem {
        let label: String
        let pass: Bool
    }

    private func guardrailItems() -> [GuardrailItem] {
        let topPct = portfolio.allocations.map(\.percent).max() ?? 0
        let cashOk = cashPercent >= 5
        let riskOk = portfolio.riskScore <= 8
        let concOk = topPct <= 40
        let allPass = guardrailPass
        return [
            GuardrailItem(label: "Risk within range", pass: allPass && riskOk),
            GuardrailItem(label: "Cash floor met", pass: allPass && cashOk),
            GuardrailItem(label: "No concentration", pass: allPass && concOk),
        ]
    }

    private var bottomActions: some View {
        VStack(spacing: 10) {
            Button { onApprove?() } label: {
                VStack(spacing: 2) {
                    Label(isHold ? "Hold — no action" : "Approve paper trade", systemImage: isHold ? "hand.raised" : "checkmark")
                        .font(.subheadline.weight(.bold))
                    Text(isHold ? "AI recommends maintaining positions" : "Execute rebalance in paper").font(.caption2).opacity(0.8)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(LinearGradient(colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .foregroundColor(Color(hex: "06120E"))
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .disabled(isHold)
            .opacity(isHold ? 0.5 : 1)
            HStack(spacing: 10) {
                secondaryButton("Adjust", subtitle: "Customize trade", icon: "slider.horizontal.3", action: onAdjust)
                secondaryButton("Dismiss", subtitle: "No action", icon: "xmark", action: onDismiss)
            }
        }
    }

    private func secondaryButton(_ title: String, subtitle: String, icon: String, action: (() -> Void)?) -> some View {
        Button { action?() } label: {
            VStack(spacing: 2) {
                Image(systemName: icon)
                Text(title).font(.caption.weight(.semibold))
                Text(subtitle).font(.system(size: 8)).foregroundColor(theme.colors.textMuted)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(theme.colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(theme.colors.border, lineWidth: 1))
        }
        .buttonStyle(.plain)
    }

    private func simulatedAfter() -> [Allocation] {
        if isHold { return portfolio.allocations }
        return portfolio.allocations.map { slice in
            if slice.label.lowercased().contains("etf") || slice.label.lowercased().contains(recommendation.symbol.lowercased()) {
                return Allocation(label: slice.label, percent: min(slice.percent + 2.2, 100), color: slice.color)
            }
            return Allocation(label: slice.label, percent: max(slice.percent - 0.5, 0), color: slice.color)
        }
    }

    private struct TableRow {
        let symbol: String
        let color: String
        let before: String
        let after: String
        let change: String
        let dollar: String
    }

    private func tableRows() -> [TableRow] {
        let allPositions = positions
        let total = max(portfolio.totalValue, 1)
        var pctMap: [String: Double] = [:]
        for pos in allPositions { pctMap[pos.symbol, default: 0] += pos.value / total * 100 }
        let cash = cashPercent
        pctMap["Cash", default: 0] = cash

        let price = allPositions.first(where: { $0.symbol == recommendation.symbol })?.price ?? 100
        let qty = recommendation.suggestedQuantity ?? 10
        let tradePct = isHold ? 0 : (price * qty / total * 100)
        let symbolBefore = pctMap[recommendation.symbol] ?? 0
        let symbolAfter = isHold ? symbolBefore : symbolBefore + tradePct

        let topSymbols = allPositions.sorted { $0.value > $1.value }.prefix(4).map(\.symbol)
        var symbols = Array(Set(topSymbols + (isHold ? [] : [recommendation.symbol]) + ["Cash"]))
        for sym in allPositions.sorted(by: { $0.value > $1.value }).map(\.symbol) where symbols.count < 5 {
            if !symbols.contains(sym) { symbols.append(sym) }
        }
        if symbols.count < 5, !symbols.contains("Cash") { symbols.append("Cash") }
        symbols = Array(symbols.prefix(5))

        return symbols.map { sym in
            let col = sym == "Cash" ? "#737B89" : assetColorForSymbol(sym, positions: allPositions)
            let before = sym == "Cash" ? cash : (pctMap[sym] ?? 8)
            var after = before
            if !isHold {
                if sym == recommendation.symbol { after = symbolAfter }
                else if sym != "Cash" { after = max(0, before - tradePct * 0.12) }
            }
            let delta = after - before
            let dollar = delta / 100 * total
            return TableRow(
                symbol: sym,
                color: col,
                before: String(format: "%.1f%%", before),
                after: String(format: "%.1f%%", after),
                change: String(format: "%+.1f%%", delta),
                dollar: String(format: "%@$%.0f", dollar >= 0 ? "+" : "", dollar)
            )
        }
    }

    private func assetColorForSymbol(_ symbol: String, positions: [Position]) -> String {
        let cls = positions.first(where: { $0.symbol == symbol })?.assetClass ?? "STOCK"
        switch cls.uppercased() {
        case "STOCK": return "#2F8FF0"
        case "ETF": return "#00D4AA"
        case "CRYPTO": return "#8047D9"
        case "BOND": return "#E7AE39"
        default: return "#737B89"
        }
    }
}

// MARK: - Portfolio mockup (AC-P01–P06)

struct OptionBPortfolioView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    var onClose: (() -> Void)? = nil
    var onSettings: (() -> Void)? = nil
    var onRebalance: (() -> Void)? = nil

    private var positions: [Position] { api.portfolio?.assetClasses.flatMap(\.positions) ?? [] }
    private var total: Double { api.dashboard?.portfolio.totalValue ?? positions.reduce(0) { $0 + $1.value } }
    private var allocations: [Allocation] {
        api.dashboard?.portfolio.allocations ?? api.portfolio?.assetClasses.map {
            Allocation(label: $0.assetClass, percent: $0.currentPercent, color: assetColor($0.assetClass))
        } ?? []
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PulsefolioBrandHeader(subtitle: "Portfolio X-Ray", showSparkle: false, showLivePaper: true, isLive: api.isLive)
                        .overlay(alignment: .trailing) {
                            if onClose != nil {
                                Button { onClose?() } label: {
                                    Image(systemName: "xmark")
                                        .font(.caption.weight(.semibold))
                                        .foregroundColor(theme.colors.textMuted)
                                        .padding(8)
                                        .background(theme.colors.surface)
                                        .clipShape(Circle())
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Close portfolio")
                            }
                        }

                    summaryCard

                    masonryGrid

                    statusStrip

                    holdingsPreview
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
            .refreshable { await api.refreshAll() }

            bottomActions
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(.ultraThinMaterial)
        }
        .background(theme.colors.bg)
        .task {
            await api.fetchPortfolio()
            await api.fetchDashboard()
        }
    }

    private var summaryCard: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("TOTAL PORTFOLIO VALUE")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(theme.colors.textMuted)
                Text(total, format: .currency(code: "USD"))
                    .font(.title2.weight(.bold))
                if let p = api.dashboard?.portfolio {
                    let up = p.dayChangePercent >= 0
                    Text("\(up ? "▲" : "▼") \(p.dayChange, format: .currency(code: "USD")) (\(p.dayChangePercent, specifier: "%.2f")%) today")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(up ? theme.colors.gain : theme.colors.loss)
                }
            }
            Spacer()
            VStack(spacing: 4) {
                Text("ALLOCATION")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(theme.colors.textMuted)
                DonutChartView(segments: allocations, progress: 1)
                    .frame(width: 56, height: 56)
                Text("\(allocations.count) ASSETS")
                    .font(.system(size: 7, weight: .bold))
                    .foregroundColor(theme.colors.textMuted)
            }
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
    }

    private var masonryGrid: some View {
        let sorted = positions.sorted { $0.value > $1.value }
        return VStack(spacing: 8) {
            if sorted.count >= 2 {
                HStack(spacing: 8) {
                    assetHeroCard(sorted[0], large: true)
                    assetHeroCard(sorted[1], large: true)
                }
            } else if let first = sorted.first {
                assetHeroCard(first, large: true)
            }
            if sorted.count >= 3 {
                HStack(spacing: 8) {
                    ForEach(Array(sorted.dropFirst(2).prefix(3).enumerated()), id: \.offset) { _, position in
                        assetHeroCard(position, large: false)
                    }
                    if sorted.count == 3 {
                        Spacer(minLength: 0).frame(maxWidth: .infinity)
                    }
                }
            }
        }
    }

    private func assetHeroCard(_ position: Position, large: Bool) -> some View {
        let pct = total > 0 ? (position.value / total) * 100 : 0
        let color = assetColor(position.assetClass)
        return VStack(alignment: .leading, spacing: 6) {
            Image(systemName: symbolIcon(position.symbol))
                .font(large ? .largeTitle : .title2)
                .foregroundColor(Color(hex: color))
                .shadow(color: Color(hex: color).opacity(0.6), radius: large ? 10 : 6)
            Text(position.symbol)
                .font(large ? .title.weight(.bold) : .headline.weight(.bold))
            Text(position.value, format: .currency(code: "USD"))
                .font(.caption)
                .foregroundColor(theme.colors.textMuted)
            Text("\(pct, specifier: "%.1f")%")
                .font(.subheadline.weight(.bold))
                .foregroundColor(Color(hex: color))
        }
        .frame(maxWidth: .infinity, minHeight: large ? 118 : 88, alignment: .leading)
        .padding(14)
        .background(
            RadialGradient(
                colors: [Color(hex: color).opacity(large ? 0.38 : 0.28), Color(hex: color).opacity(0.06), theme.colors.surface.opacity(0.4)],
                center: .topLeading,
                startRadius: 8,
                endRadius: large ? 180 : 120
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color(hex: color).opacity(0.65), lineWidth: 1.5))
        .optionBGlow(Color(hex: color), radius: large ? 18 : 10, opacity: 0.35)
    }

    private var statusStrip: some View {
        let assetClasses = ["STOCK", "ETF", "CRYPTO", "BOND"]
        return ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(assetClasses, id: \.self) { cls in
                    if let ac = api.portfolio?.assetClasses.first(where: { $0.assetClass.uppercased() == cls }) {
                        let drift = abs(ac.currentPercent - ac.targetPercent)
                        let warn = drift > 2
                        statusChip(
                            cls,
                            state: warn ? String(format: "Drift %+.0f%%", ac.currentPercent - ac.targetPercent) : "On track",
                            warn: warn
                        )
                    } else {
                        statusChip(cls, state: "On track", warn: false)
                    }
                }
            }
        }
    }

    private func statusChip(_ label: String, state: String, warn: Bool) -> some View {
        HStack(spacing: 6) {
            Image(systemName: warn ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                .foregroundColor(warn ? Color(hex: "E7AE39") : theme.colors.gain)
                .font(.caption)
            VStack(alignment: .leading, spacing: 2) {
                Text(label).font(.caption2.weight(.bold))
                Text(state).font(.system(size: 8)).foregroundColor(theme.colors.textMuted)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(warn ? Color(hex: "E7AE39").opacity(0.4) : theme.colors.gain.opacity(0.3), lineWidth: 1))
    }

    private var holdingsPreview: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("HOLDINGS PREVIEW")
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(theme.colors.textMuted)
                Spacer()
                Text("View all")
                    .font(.caption.weight(.bold))
                    .foregroundColor(theme.colors.gain)
            }
            ForEach(positions.prefix(4)) { position in
                HoldingSparklineRow(position: position)
            }
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(theme.colors.border, lineWidth: 1))
    }

    private var bottomActions: some View {
        HStack(spacing: 10) {
            Button {
                onRebalance?()
            } label: {
                Label("Rebalance with AI", systemImage: "sparkles")
                    .font(.subheadline.weight(.bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(LinearGradient(colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")], startPoint: .topLeading, endPoint: .bottomTrailing))
                    .foregroundColor(Color(hex: "06120E"))
                    .clipShape(Capsule())
                    .shadow(color: theme.colors.gain.opacity(0.35), radius: 12)
            }
            .buttonStyle(.plain)
            Button { onSettings?() } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.body.weight(.semibold))
                    .frame(width: 48, height: 48)
                    .background(theme.colors.surface)
                    .clipShape(Circle())
                    .overlay(Circle().stroke(theme.colors.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Settings")
        }
    }

    private func assetColor(_ assetClass: String) -> String {
        switch assetClass.uppercased() {
        case "STOCK": return "#2F8FF0"
        case "ETF": return "#00D4AA"
        case "CRYPTO": return "#8047D9"
        case "BOND": return "#E7AE39"
        default: return "#737B89"
        }
    }

    private func symbolIcon(_ symbol: String) -> String {
        switch symbol {
        case "AAPL": return "apple.logo"
        case "MSFT": return "square.grid.2x2"
        case "BTC": return "bitcoinsign.circle"
        default: return "chart.pie"
        }
    }
}
