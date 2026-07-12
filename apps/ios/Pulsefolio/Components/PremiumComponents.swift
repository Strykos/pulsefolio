import SwiftUI

// MARK: - Observatory Panel

enum ObservatoryPadding {
    case sm, md, lg

    var value: CGFloat {
        switch self {
        case .sm: return 12
        case .md: return 16
        case .lg: return 20
        }
    }
}

struct ObservatoryPanel<Content: View>: View {
    @EnvironmentObject var theme: ThemeManager
    let glow: Bool
    let padding: ObservatoryPadding
    let content: Content

    init(
        glow: Bool = false,
        padding: ObservatoryPadding = .md,
        @ViewBuilder content: () -> Content
    ) {
        self.glow = glow
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding.value)
            .background(theme.colors.surface)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(theme.colors.border, lineWidth: 1)
            )
            .shadow(color: glow ? theme.colors.gain.opacity(0.12) : .clear, radius: 24)
    }
}

// MARK: - Ambient & Glass

struct AmbientMeshView: View {
    @EnvironmentObject var theme: ThemeManager
    @State private var pulse = false

    var body: some View {
        ZStack {
            Circle()
                .fill(theme.colors.gain.opacity(0.12))
                .frame(width: 260, height: 260)
                .blur(radius: 60)
                .offset(x: -80, y: -120)
                .scaleEffect(pulse ? 1.05 : 0.95)

            Circle()
                .fill(theme.colors.accent.opacity(0.10))
                .frame(width: 280, height: 280)
                .blur(radius: 70)
                .offset(x: 100, y: -40)
                .scaleEffect(pulse ? 0.95 : 1.05)

            Circle()
                .fill(theme.colors.accent.opacity(0.08))
                .frame(width: 200, height: 200)
                .blur(radius: 50)
                .offset(x: 0, y: 180)
        }
        .allowsHitTesting(false)
        .onAppear {
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }
}

struct GlassCard<Content: View>: View {
    @EnvironmentObject var theme: ThemeManager
    let content: Content
    var glow: Bool = false

    init(glow: Bool = false, @ViewBuilder content: () -> Content) {
        self.glow = glow
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .background(theme.colors.surface.opacity(0.55))
            .background(.ultraThinMaterial.opacity(0.3))
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(
                        glow ? theme.colors.accent.opacity(0.2) : Color.white.opacity(0.08),
                        lineWidth: 1
                    )
            )
            .shadow(color: theme.colors.accent.opacity(glow ? 0.15 : 0), radius: 20, y: 4)
    }
}

// MARK: - Donut Hero

struct DonutHeroView: View {
    let totalValue: Double
    let dayChangePercent: Double
    let segments: [Allocation]
    @EnvironmentObject var theme: ThemeManager
    @State private var animatedProgress: CGFloat = 0

    var body: some View {
        ZStack {
            DonutChartView(segments: segments, progress: animatedProgress)
                .frame(width: 200, height: 200)

            VStack(spacing: 4) {
                Text(totalValue, format: .currency(code: "USD"))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(theme.colors.textPrimary)
                    .contentTransition(.numericText())
                Text("\(dayChangePercent >= 0 ? "▲" : "▼") \(abs(dayChangePercent), specifier: "%.2f")% today")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(dayChangePercent >= 0 ? theme.colors.gain : theme.colors.loss)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .onAppear {
            withAnimation(.easeOut(duration: 0.9)) {
                animatedProgress = 1
            }
        }
    }
}

struct DonutChartView: View {
    let segments: [Allocation]
    let progress: CGFloat

    var body: some View {
        Canvas { context, size in
            let center = CGPoint(x: size.width / 2, y: size.height / 2)
            let radius = min(size.width, size.height) / 2 - 14
            let lineWidth: CGFloat = 18

            var track = Path()
            track.addArc(center: center, radius: radius, startAngle: .degrees(0), endAngle: .degrees(360), clockwise: false)
            context.stroke(track, with: .color(Color(hex: "2A2F3D")), style: StrokeStyle(lineWidth: lineWidth))

            var startAngle = Angle.degrees(-90)
            for segment in segments {
                let sweep = Angle.degrees(360 * (segment.percent / 100) * Double(progress))
                var path = Path()
                path.addArc(center: center, radius: radius, startAngle: startAngle, endAngle: startAngle + sweep, clockwise: false)
                context.stroke(path, with: .color(Color(hex: segment.color)), style: StrokeStyle(lineWidth: lineWidth, lineCap: .butt))
                startAngle += sweep
            }
        }
    }
}

// MARK: - Observatory Hero

struct ObservatoryHeroView: View {
    let portfolio: PortfolioSummary
    @EnvironmentObject var theme: ThemeManager
    @State private var orbitRotation = 0.0
    @State private var breathing = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack {
                Label("PORTFOLIO OBSERVATORY", systemImage: "dot.radiowaves.left.and.right")
                    .font(.caption2.weight(.bold))
                    .tracking(1.6)
                    .foregroundColor(theme.colors.textMuted)
                Spacer()
                HStack(spacing: 5) {
                    Circle()
                        .fill(theme.colors.gain)
                        .frame(width: 6, height: 6)
                        .scaleEffect(breathing ? 1.35 : 0.85)
                    Text("SIGNAL LIVE")
                }
                .font(.caption2.weight(.bold))
                .foregroundColor(theme.colors.gain)
                .padding(.horizontal, 9)
                .padding(.vertical, 6)
                .background(theme.colors.gain.opacity(0.1))
                .clipShape(Capsule())
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("NET PORTFOLIO VALUE")
                    .font(.caption2.weight(.semibold))
                    .tracking(1.7)
                    .foregroundColor(theme.colors.textMuted)
                Text(portfolio.totalValue, format: .currency(code: "USD"))
                    .font(.system(size: 46, weight: .semibold, design: .rounded))
                    .tracking(-2.5)
                    .foregroundColor(theme.colors.textPrimary)
                    .minimumScaleFactor(0.75)
                    .lineLimit(1)
                    .contentTransition(.numericText())
                HStack(spacing: 10) {
                    Label(
                        "\(portfolio.dayChangePercent >= 0 ? "+" : "")\(portfolio.dayChangePercent, specifier: "%.2f")%",
                        systemImage: portfolio.dayChangePercent >= 0 ? "arrow.up.right" : "arrow.down.right"
                    )
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(portfolio.dayChangePercent >= 0 ? theme.colors.gain : theme.colors.loss)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background((portfolio.dayChangePercent >= 0 ? theme.colors.gain : theme.colors.loss).opacity(0.12))
                    .clipShape(Capsule())

                    Text("\(portfolio.dayChange >= 0 ? "+" : "")\(portfolio.dayChange, format: .currency(code: "USD")) today")
                        .font(.caption)
                        .foregroundColor(theme.colors.textMuted)
                }
            }

            AllocationOrbitView(allocations: portfolio.allocations)
                .frame(height: 190)

            Rectangle()
                .fill(Color.white.opacity(0.07))
                .frame(height: 1)

            HStack {
                Label("VALUE TRAJECTORY", systemImage: "waveform.path.ecg")
                    .font(.caption2.weight(.bold))
                    .tracking(1.4)
                    .foregroundColor(theme.colors.textMuted)
                Spacer()
                Text("LIVE SIGNAL")
                    .font(.system(size: 9, weight: .semibold))
                    .tracking(0.8)
                    .foregroundColor(theme.colors.textMuted.opacity(0.7))
            }

            PremiumTrendChartView(data: portfolio.sparkline)
        }
        .padding(18)
        .background {
            ZStack {
                theme.colors.surface.opacity(0.38)
                ObservatoryGridView()
                    .stroke(Color(hex: "2A2F3D").opacity(0.38), lineWidth: 0.5)
                Circle()
                    .stroke(theme.colors.gain.opacity(0.13), lineWidth: 1)
                    .frame(width: 310, height: 310)
                    .offset(x: -130, y: -190)
                    .scaleEffect(breathing ? 1.08 : 0.94)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 28))
        .overlay(
            RoundedRectangle(cornerRadius: 28)
                .stroke(Color.white.opacity(0.09), lineWidth: 1)
        )
        .onAppear {
            withAnimation(.linear(duration: 34).repeatForever(autoreverses: false)) {
                orbitRotation = 360
            }
            withAnimation(.easeInOut(duration: 3).repeatForever(autoreverses: true)) {
                breathing = true
            }
        }
    }
}

struct AllocationOrbitView: View {
    let allocations: [Allocation]
    @EnvironmentObject var theme: ThemeManager
    @State private var rotation = 0.0

    private var primary: Allocation? { allocations.first }

    var body: some View {
        GeometryReader { geo in
            let center = CGPoint(x: geo.size.width / 2, y: geo.size.height / 2 - 4)
            let radius = min(geo.size.width, geo.size.height) * 0.38

            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
                    .frame(width: radius * 2, height: radius * 2)
                    .position(center)

                Circle()
                    .stroke(theme.colors.accent.opacity(0.09), style: StrokeStyle(lineWidth: 1, dash: [3, 5]))
                    .frame(width: radius * 2.75, height: radius * 2.75)
                    .position(center)
                    .rotationEffect(.degrees(rotation))

                ForEach(Array(allocations.prefix(5).enumerated()), id: \.element.id) { index, allocation in
                    let angle = (Double(index) / Double(max(min(allocations.count, 5), 1))) * Double.pi * 2 - Double.pi / 2
                    let point = CGPoint(
                        x: center.x + cos(angle) * radius,
                        y: center.y + sin(angle) * radius
                    )
                    VStack(spacing: 2) {
                        Circle()
                            .fill(Color(hex: allocation.color))
                            .frame(width: index == 0 ? 13 : 10, height: index == 0 ? 13 : 10)
                            .overlay(Circle().stroke(theme.colors.bg, lineWidth: 2))
                        Text(allocation.label)
                            .font(.system(size: 9, weight: .semibold))
                            .foregroundColor(theme.colors.textMuted)
                    }
                    .position(point)
                }

                VStack(spacing: 2) {
                    Text("LARGEST SIGNAL")
                        .font(.system(size: 8, weight: .bold))
                        .tracking(0.8)
                        .foregroundColor(theme.colors.textMuted)
                    Text(primary?.label ?? "Portfolio")
                        .font(.headline.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                    Text("\(primary?.percent ?? 0, specifier: "%.0f")%")
                        .font(.subheadline.weight(.bold))
                        .foregroundColor(theme.colors.accent)
                }
                .position(center)
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 30).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}

struct ObservatoryGridView: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let spacing: CGFloat = 28
        stride(from: 0, through: rect.width, by: spacing).forEach { x in
            path.move(to: CGPoint(x: x, y: 0))
            path.addLine(to: CGPoint(x: x, y: rect.height))
        }
        stride(from: 0, through: rect.height, by: spacing).forEach { y in
            path.move(to: CGPoint(x: 0, y: y))
            path.addLine(to: CGPoint(x: rect.width, y: y))
        }
        return path
    }
}

// MARK: - Trend Chart

enum TrendPeriod: String, CaseIterable, Identifiable {
    case oneDay = "1D"
    case oneWeek = "1W"
    case oneMonth = "1M"
    case threeMonth = "3M"
    var id: String { rawValue }

    var pointCount: Int {
        switch self {
        case .oneDay: return 24
        case .oneWeek: return 28
        case .oneMonth: return 30
        case .threeMonth: return 36
        }
    }

    var xLabels: [String] {
        switch self {
        case .oneDay: return ["9a", "11a", "1p", "3p", "5p", "Now"]
        case .oneWeek: return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Now"]
        case .oneMonth: return ["W1", "W2", "W3", "W4", "Now"]
        case .threeMonth: return ["Jan", "Feb", "Mar", "Now"]
        }
    }
}

struct PremiumTrendChartView: View {
    let data: [Double]
    @EnvironmentObject var theme: ThemeManager
    @State private var period: TrendPeriod = .oneMonth
    @State private var drawProgress: CGFloat = 0
    @State private var scrubIndex: Int?

    private var series: [Double] {
        resample(data, count: period.pointCount).enumerated().map { index, value in
            let wiggle: Double
            switch period {
            case .oneDay: wiggle = sin(Double(index) / 2.2) * value * 0.0015
            case .oneWeek: wiggle = sin(Double(index) / 3.5) * value * 0.0025
            case .oneMonth: wiggle = sin(Double(index) / 4.0) * value * 0.0035
            case .threeMonth: wiggle = sin(Double(index) / 5.0) * value * 0.0045
            }
            return ((value + wiggle) * 100).rounded() / 100
        }
    }

    private var minVal: Double { series.min() ?? 0 }
    private var maxVal: Double { series.max() ?? 1 }
    private var openVal: Double { series.first ?? 0 }
    private var closeVal: Double { series.last ?? 0 }
    private var changePct: Double { openVal == 0 ? 0 : ((closeVal - openVal) / openVal) * 100 }
    private var isUp: Bool { changePct >= 0 }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                HStack(spacing: 4) {
                    ForEach(TrendPeriod.allCases) { p in
                        Button {
                            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                                period = p
                                scrubIndex = nil
                                drawProgress = 0
                            }
                            withAnimation(.easeOut(duration: 1.2)) { drawProgress = 1 }
                        } label: {
                            Text(p.rawValue)
                                .font(.caption2.weight(.semibold))
                                .padding(.horizontal, 8)
                                .padding(.vertical, 5)
                                .background(period == p ? theme.colors.accent.opacity(0.2) : Color.clear)
                                .foregroundColor(period == p ? theme.colors.accent : theme.colors.textMuted)
                                .clipShape(RoundedRectangle(cornerRadius: 6))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(4)
                .background(theme.colors.surface.opacity(0.5))
                .clipShape(RoundedRectangle(cornerRadius: 8))

                Spacer()

                VStack(alignment: .trailing, spacing: 2) {
                    HStack(spacing: 8) {
                        Text("H \(compact(maxVal))")
                            .foregroundColor(theme.colors.gain)
                        Text("L \(compact(minVal))")
                            .foregroundColor(theme.colors.loss)
                    }
                    Text("\(changePct >= 0 ? "+" : "")\(changePct, specifier: "%.2f")%")
                        .foregroundColor(isUp ? theme.colors.gain : theme.colors.loss)
                }
                .font(.caption2.weight(.semibold))
            }

            GeometryReader { geo in
                let padTop: CGFloat = 12
                let padBottom: CGFloat = 22
                let padRight: CGFloat = 44
                let chartH = geo.size.height - padTop - padBottom
                let chartW = geo.size.width - padRight
                let range = max(maxVal - minVal, 1)
                let strokeColor = isUp ? theme.colors.gain : theme.colors.loss
                let activeIndex = scrubIndex ?? (series.count - 1)

                ZStack(alignment: .topLeading) {
                    ForEach(0..<3, id: \.self) { i in
                        let tick = maxVal - (Double(i) / 2) * (maxVal - minVal)
                        let y = padTop + chartH * (1 - CGFloat((tick - minVal) / range))
                        Path { path in
                            path.move(to: CGPoint(x: 0, y: y))
                            path.addLine(to: CGPoint(x: chartW, y: y))
                        }
                        .stroke(Color(hex: "2A2F3D"), style: StrokeStyle(lineWidth: 1, dash: i == 1 ? [4, 4] : []))

                        Text(compact(tick))
                            .font(.system(size: 9, weight: .medium, design: .rounded))
                            .foregroundColor(theme.colors.textMuted)
                            .position(x: geo.size.width - 20, y: y)
                    }

                    let openY = padTop + chartH * (1 - CGFloat((openVal - minVal) / range))
                    Path { path in
                        path.move(to: CGPoint(x: 0, y: openY))
                        path.addLine(to: CGPoint(x: chartW, y: openY))
                    }
                    .stroke(theme.colors.textMuted.opacity(0.35), style: StrokeStyle(lineWidth: 1, dash: [5, 4]))

                    let points: [CGPoint] = series.enumerated().map { index, value in
                        CGPoint(
                            x: chartW * CGFloat(index) / CGFloat(max(series.count - 1, 1)),
                            y: padTop + chartH * (1 - CGFloat((value - minVal) / range))
                        )
                    }

                    smoothArea(points: points, chartH: chartH, padTop: padTop)
                        .fill(
                            LinearGradient(
                                colors: [strokeColor.opacity(0.32), strokeColor.opacity(0.05), strokeColor.opacity(0)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .opacity(Double(drawProgress))

                    smoothLine(points: points)
                        .trim(from: 0, to: drawProgress)
                        .stroke(
                            LinearGradient(colors: [theme.colors.gain, theme.colors.accent], startPoint: .leading, endPoint: .trailing),
                            style: StrokeStyle(lineWidth: 2.75, lineCap: .round, lineJoin: .round)
                        )
                        .shadow(color: strokeColor.opacity(0.45), radius: 4)

                    if let hi = series.firstIndex(of: maxVal), hi < points.count {
                        Circle().fill(theme.colors.gain).frame(width: 7, height: 7).position(points[hi])
                    }
                    if let lo = series.firstIndex(of: minVal), lo < points.count {
                        Circle().fill(theme.colors.loss).frame(width: 7, height: 7).position(points[lo])
                    }

                    if activeIndex < points.count {
                        let active = points[activeIndex]
                        Path { path in
                            path.move(to: CGPoint(x: active.x, y: padTop))
                            path.addLine(to: CGPoint(x: active.x, y: padTop + chartH))
                        }
                        .stroke(theme.colors.accent.opacity(scrubIndex == nil ? 0 : 0.55), lineWidth: 1)

                        Circle()
                            .fill(strokeColor)
                            .frame(width: 10, height: 10)
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .position(active)

                        if scrubIndex != nil {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(period.xLabels[min(period.xLabels.count - 1, activeIndex * (period.xLabels.count - 1) / max(series.count - 1, 1))])
                                    .font(.caption2)
                                    .foregroundColor(theme.colors.textMuted)
                                Text(series[activeIndex], format: .currency(code: "USD"))
                                    .font(.caption.weight(.bold))
                                    .foregroundColor(theme.colors.textPrimary)
                            }
                            .padding(.horizontal, 8)
                            .padding(.vertical, 6)
                            .background(theme.colors.surface.opacity(0.95))
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                            .position(x: min(max(active.x, 50), chartW - 50), y: padTop + 18)
                        }
                    }

                    HStack {
                        ForEach(period.xLabels.indices, id: \.self) { i in
                            Text(period.xLabels[i])
                                .font(.system(size: 9))
                                .foregroundColor(theme.colors.textMuted)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .position(x: chartW / 2, y: geo.size.height - 8)

                }
            }
            .frame(height: 190)
        }
        .onAppear {
            withAnimation(.easeOut(duration: 1.2)) { drawProgress = 1 }
        }
        .onChange(of: period) { _, _ in
            withAnimation(.easeOut(duration: 1.2)) { drawProgress = 1 }
        }
    }

    private func compact(_ value: Double) -> String {
        if value >= 1_000_000 { return String(format: "$%.1fM", value / 1_000_000) }
        if value >= 1_000 { return String(format: "$%.0fK", value / 1_000) }
        return String(format: "$%.0f", value)
    }

    private func resample(_ data: [Double], count: Int) -> [Double] {
        guard !data.isEmpty, count > 1 else { return data }
        if data.count == count { return data }
        return (0..<count).map { i in
            let t = Double(i) / Double(count - 1) * Double(data.count - 1)
            let lo = Int(floor(t))
            let hi = min(data.count - 1, lo + 1)
            let frac = t - Double(lo)
            return data[lo] * (1 - frac) + data[hi] * frac
        }
    }

    private func smoothLine(points: [CGPoint]) -> Path {
        var path = Path()
        guard points.count > 1 else { return path }
        path.move(to: points[0])
        for i in 0..<(points.count - 1) {
            let p0 = points[max(0, i - 1)]
            let p1 = points[i]
            let p2 = points[i + 1]
            let p3 = points[min(points.count - 1, i + 2)]
            let cp1 = CGPoint(x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6)
            let cp2 = CGPoint(x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6)
            path.addCurve(to: p2, control1: cp1, control2: cp2)
        }
        return path
    }

    private func smoothArea(points: [CGPoint], chartH: CGFloat, padTop: CGFloat) -> Path {
        var path = smoothLine(points: points)
        guard let last = points.last, let first = points.first else { return path }
        path.addLine(to: CGPoint(x: last.x, y: padTop + chartH))
        path.addLine(to: CGPoint(x: first.x, y: padTop + chartH))
        path.closeSubpath()
        return path
    }
}

// MARK: - Risk Gauge Needle

struct RiskGaugeNeedleView: View {
    let score: Double
    let label: String
    @EnvironmentObject var theme: ThemeManager
    @State private var animatedScore: Double = 1
    @State private var tremble = false

    private var rotation: Double {
        let clamped = min(10, max(1, animatedScore))
        return -80 + (clamped - 1) / 9 * 160
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                GaugeArc(progress: 1)
                    .stroke(Color(hex: "2A2F3D"), style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 160, height: 90)

                GaugeArc(progress: animatedScore / 10)
                    .stroke(
                        LinearGradient(colors: [theme.colors.gain, theme.colors.accent, theme.colors.loss], startPoint: .leading, endPoint: .trailing),
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .frame(width: 160, height: 90)

                Rectangle()
                    .fill(theme.colors.textPrimary)
                    .frame(width: 2.5, height: 42)
                    .offset(y: -21)
                    .rotationEffect(.degrees(rotation))
                    .offset(y: 10)

                Circle()
                    .fill(theme.colors.textPrimary)
                    .frame(width: 10, height: 10)
                    .offset(y: 10)
            }
            .offset(x: tremble ? -1 : 0)
            .animation(tremble ? .easeInOut(duration: 0.08).repeatCount(5, autoreverses: true) : .default, value: tremble)

            Text("\(animatedScore, specifier: "%.1f")")
                .font(.title2.weight(.bold))
                .foregroundColor(theme.colors.textPrimary)
            Text(label)
                .font(.subheadline)
                .foregroundColor(theme.colors.textMuted)
        }
        .onAppear {
            withAnimation(.spring(response: 0.8, dampingFraction: 0.7)) {
                animatedScore = score
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
                tremble = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { tremble = false }
            }
        }
        .onChange(of: score) { _, newValue in
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                animatedScore = newValue
            }
        }
    }
}

struct GaugeArc: Shape {
    var progress: Double

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.maxY - 4)
        let radius = min(rect.width, rect.height * 2) / 2 - 8
        path.addArc(
            center: center,
            radius: radius,
            startAngle: .degrees(180),
            endAngle: .degrees(0),
            clockwise: false
        )
        return path.trimmedPath(from: 0, to: progress)
    }
}

// MARK: - Typewriter & Decision Card

struct TypewriterText: View {
    let text: String
    let speed: Double
    @State private var displayed = ""
    @State private var showCursor = true

    init(_ text: String, speed: Double = 0.025) {
        self.text = text
        self.speed = speed
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            Text(displayed)
            if showCursor && displayed.count < text.count {
                Rectangle()
                    .fill(Color(hex: "4A9EFF"))
                    .frame(width: 2, height: 14)
                    .opacity(showCursor ? 1 : 0)
            }
        }
        .onAppear { startTyping() }
        .onChange(of: text) { _, _ in startTyping() }
    }

    private func startTyping() {
        displayed = ""
        showCursor = true
        for (index, _) in text.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(index) * speed) {
                displayed = String(text.prefix(index + 1))
                if index == text.count - 1 {
                    showCursor = false
                }
            }
        }
    }
}

struct AICommandCenterView: View {
    let recommendation: AIRecommendation?
    let isAnalyzing: Bool
    let onAnalyze: () -> Void
    @EnvironmentObject var theme: ThemeManager
    @State private var pulse = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(theme.colors.accent.opacity(0.15))
                        .frame(width: 46, height: 46)
                    Circle()
                        .stroke(theme.colors.accent.opacity(0.3), lineWidth: 1)
                        .frame(width: 46, height: 46)
                        .scaleEffect(pulse ? 1.18 : 0.9)
                        .opacity(pulse ? 0 : 0.8)
                    Image(systemName: "brain.head.profile.fill")
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [theme.colors.gain, theme.colors.accent],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }

                VStack(alignment: .leading, spacing: 3) {
                    HStack(spacing: 6) {
                        Text("PULSE AI")
                            .font(.subheadline.weight(.bold))
                            .tracking(1)
                        Text("LOCAL")
                            .font(.system(size: 8, weight: .bold))
                            .foregroundColor(theme.colors.gain)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 3)
                            .background(theme.colors.gain.opacity(0.12))
                            .clipShape(Capsule())
                    }
                    Text(recommendation?.model ?? "qwen3:4b · Ollama")
                        .font(.caption)
                        .foregroundColor(theme.colors.textMuted)
                }

                Spacer()

                if recommendation != nil {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundColor(theme.colors.gain)
                        .accessibilityLabel("Risk guardrails passed")
                }
            }

            Text(
                recommendation == nil
                    ? "Ready to analyze allocation drift, cash exposure, concentration, and portfolio risk."
                    : "Monitoring your portfolio with private on-device inference and deterministic trade guardrails."
            )
            .font(.caption)
            .foregroundColor(theme.colors.textMuted)
            .fixedSize(horizontal: false, vertical: true)

            Button(action: onAnalyze) {
                HStack(spacing: 8) {
                    if isAnalyzing {
                        ProgressView()
                            .tint(Color(hex: "06120E"))
                    } else {
                        Image(systemName: "sparkles")
                    }
                    Text(isAnalyzing ? "Analyzing portfolio…" : "Run fresh AI analysis")
                        .font(.subheadline.weight(.semibold))
                    Spacer()
                    if !isAnalyzing {
                        Image(systemName: "arrow.right")
                            .font(.caption.weight(.bold))
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
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
            .disabled(isAnalyzing)

            Label(
                "Every proposal is checked for cash, concentration, and crypto limits",
                systemImage: "lock.shield"
            )
            .font(.system(size: 9, weight: .medium))
            .foregroundColor(theme.colors.textMuted.opacity(0.85))
        }
        .padding(15)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(theme.colors.border, lineWidth: 1)
        )
        .onAppear {
            withAnimation(.easeOut(duration: 1.8).repeatForever(autoreverses: false)) {
                pulse = true
            }
        }
    }
}

struct PremiumDecisionCardView: View {
    let recommendation: AIRecommendation
    var onApprove: (() -> Void)? = nil
    var onDismiss: (() -> Void)? = nil
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: "sparkles")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(theme.colors.gain)
                Text("AI DECISION")
                    .font(.caption2.weight(.bold))
                    .foregroundColor(theme.colors.gain)
                if recommendation.confidence >= 70 {
                    Label("Guardrails passed", systemImage: "checkmark.shield.fill")
                        .font(.system(size: 8, weight: .bold))
                        .foregroundColor(theme.colors.gain)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(theme.colors.gain.opacity(0.1))
                        .clipShape(Capsule())
                }
            }

            Text(recommendation.action == "HOLD"
                 ? "Keep the portfolio unchanged for now."
                 : "\(recommendation.action.replacingOccurrences(of: "_", with: " ")) \(recommendation.symbol) to move closer to your plan.")
                .font(.title3.weight(.semibold))
                .foregroundColor(theme.colors.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                ImpactStatView(label: "Confidence", value: "\(recommendation.confidence)%", color: theme.colors.gain)
                ImpactStatView(
                    label: "Risk impact",
                    value: String(format: "%+.1f", recommendation.riskDelta),
                    color: theme.colors.accent
                )
                ImpactStatView(
                    label: "Return impact",
                    value: String(format: "%+.1f%%", recommendation.returnDelta),
                    color: Color(hex: "8B5CF6")
                )
            }

            Text(recommendation.rationale)
                .font(.subheadline)
                .foregroundColor(theme.colors.textMuted)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 10) {
                if recommendation.action != "HOLD", let onApprove {
                    Button(action: onApprove) {
                        Label("Approve", systemImage: "checkmark")
                            .font(.subheadline.weight(.semibold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(
                                LinearGradient(
                                    colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .foregroundColor(Color(hex: "06120E"))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .buttonStyle(.plain)
                }

                if let onDismiss {
                    Button(action: onDismiss) {
                        Text("Dismiss")
                            .font(.subheadline.weight(.medium))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(theme.colors.surfaceElevated)
                            .foregroundColor(theme.colors.textMuted)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10)
                                    .stroke(theme.colors.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct ImpactStatView: View {
    let label: String
    let value: String
    let color: Color
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .semibold))
                .tracking(0.8)
                .foregroundColor(theme.colors.textMuted)
            Text(value)
                .font(.subheadline.weight(.bold))
                .foregroundColor(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(theme.colors.surfaceElevated.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }
}

// MARK: - Custom Tab Bar

struct CustomTabBar: View {
    @Binding var selected: Int
    var pendingCount: Int = 0
    @EnvironmentObject var theme: ThemeManager
    @Namespace private var tabNamespace

    private let items: [(icon: String, label: String)] = [
        ("sun.max.fill", "Briefing"),
        ("chart.pie.fill", "Portfolio"),
        ("waveform.path.ecg", "Activity"),
        ("sparkles", "Insights"),
        ("gearshape.fill", "Settings"),
    ]

    var body: some View {
        HStack(spacing: 0) {
            ForEach(items.indices, id: \.self) { index in
                Button {
                    withAnimation(.spring(response: 0.35, dampingFraction: 0.75)) {
                        selected = index
                    }
                } label: {
                    VStack(spacing: 4) {
                        ZStack(alignment: .topTrailing) {
                            ZStack {
                                if selected == index {
                                    Circle()
                                        .fill(theme.colors.gain.opacity(0.15))
                                        .frame(width: 36, height: 36)
                                        .matchedGeometryEffect(id: "tabHighlight", in: tabNamespace)
                                }
                                Image(systemName: items[index].icon)
                                    .font(.system(size: selected == index ? 18 : 16, weight: .semibold))
                                    .foregroundColor(selected == index ? theme.colors.gain : theme.colors.textMuted)
                                    .scaleEffect(selected == index ? 1.1 : 1)
                            }
                            if index == 2, pendingCount > 0 {
                                Text("\(pendingCount)")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(Color(hex: "06120E"))
                                    .padding(.horizontal, 5)
                                    .padding(.vertical, 2)
                                    .background(theme.colors.gain)
                                    .clipShape(Capsule())
                                    .offset(x: 8, y: -6)
                            }
                        }
                        Text(items[index].label)
                            .font(.caption2.weight(selected == index ? .semibold : .regular))
                            .foregroundColor(selected == index ? theme.colors.gain : theme.colors.textMuted)
                    }
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 10)
        .padding(.bottom, 6)
        .background(.ultraThinMaterial)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(theme.colors.border)
                .frame(height: 0.5)
        }
    }
}
