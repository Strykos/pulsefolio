import SwiftUI

// MARK: - Evidence rail

struct ObservatoryEvidenceRail: View {
    let positions: [Position]
    let cashPercent: Double
    let topPositionPercent: Double
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("WHY NOW")
                .font(.system(size: 9, weight: .semibold))
                .tracking(1.6)
                .foregroundColor(theme.colors.textMuted)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    EvidenceMiniCard(index: "1", title: "Allocation drift") {
                        MiniMultiLineChart(
                            series: positions.prefix(4).enumerated().map { index, position in
                                (position.symbol, derivedDriftSeries(end: position.changePercent, seed: index), chartColor(index))
                            }
                        )
                        .frame(height: 72)
                    }
                    EvidenceMiniCard(index: "2", title: "Cash floor") {
                        MiniAreaChart(values: cashSeries(end: cashPercent), color: theme.colors.gain, threshold: 4)
                            .frame(height: 72)
                        HStack {
                            Label("Above minimum", systemImage: "checkmark")
                                .font(.system(size: 7, weight: .medium))
                                .foregroundColor(theme.colors.gain)
                            Spacer()
                            Text(String(format: "%.1f%%", cashPercent))
                                .font(.system(size: 7, weight: .bold))
                        }
                    }
                    EvidenceMiniCard(index: "3", title: "Concentration") {
                        MiniAreaChart(values: concentrationSeries(current: topPositionPercent), color: Color(hex: "8047D9"), threshold: 30)
                            .frame(height: 72)
                        HStack {
                            Label("Within guardrail", systemImage: "checkmark")
                                .font(.system(size: 7, weight: .medium))
                                .foregroundColor(theme.colors.gain)
                            Spacer()
                            Text(String(format: "%.1f%%", topPositionPercent))
                                .font(.system(size: 7, weight: .bold))
                        }
                    }
                }
            }
        }
    }

    private func chartColor(_ index: Int) -> Color {
        [theme.colors.gain, theme.colors.accent, Color(hex: "8047D9"), Color(hex: "E7AE39")][index % 4]
    }

    private func derivedDriftSeries(end: Double, seed: Int) -> [Double] {
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

private struct EvidenceMiniCard<Content: View>: View {
    let index: String
    let title: String
    let content: Content
    @EnvironmentObject var theme: ThemeManager

    init(index: String, title: String, @ViewBuilder content: () -> Content) {
        self.index = index
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("\(index). \(title)")
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(theme.colors.textPrimary)
            content
        }
        .padding(10)
        .frame(width: 168)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(theme.colors.border, lineWidth: 1))
    }
}

struct MiniAreaChart: View {
    let values: [Double]
    let color: Color
    let threshold: Double

    var body: some View {
        GeometryReader { geo in
            let minV = 0.0
            let maxV = max(values.max() ?? 1, threshold + 5)
            let range = max(maxV - minV, 1)
            let points: [CGPoint] = values.enumerated().map { i, v in
                CGPoint(
                    x: geo.size.width * CGFloat(i) / CGFloat(max(values.count - 1, 1)),
                    y: geo.size.height * (1 - CGFloat((v - minV) / range))
                )
            }
            let thresholdY = geo.size.height * (1 - CGFloat((threshold - minV) / range))

            ZStack {
                Path { p in
                    p.move(to: CGPoint(x: 0, y: thresholdY))
                    p.addLine(to: CGPoint(x: geo.size.width, y: thresholdY))
                }
                .stroke(Color(hex: "8D96A3"), style: StrokeStyle(lineWidth: 0.8, dash: [3, 3]))

                if points.count > 1 {
                    Path { p in
                        p.move(to: points[0])
                        for pt in points.dropFirst() { p.addLine(to: pt) }
                        p.addLine(to: CGPoint(x: points.last!.x, y: geo.size.height))
                        p.addLine(to: CGPoint(x: 0, y: geo.size.height))
                        p.closeSubpath()
                    }
                    .fill(LinearGradient(colors: [color.opacity(0.35), color.opacity(0)], startPoint: .top, endPoint: .bottom))

                    Path { p in
                        p.move(to: points[0])
                        for pt in points.dropFirst() { p.addLine(to: pt) }
                    }
                    .stroke(color, lineWidth: 1.6)
                }
            }
        }
    }
}

struct MiniMultiLineChart: View {
    let series: [(String, [Double], Color)]

    var body: some View {
        GeometryReader { geo in
            let minV = -20.0
            let maxV = 20.0
            let range = maxV - minV
            ForEach(Array(series.enumerated()), id: \.offset) { _, item in
                let points: [CGPoint] = item.1.enumerated().map { i, v in
                    CGPoint(
                        x: geo.size.width * CGFloat(i) / CGFloat(max(item.1.count - 1, 1)),
                        y: geo.size.height * (1 - CGFloat((v - minV) / range))
                    )
                }
                if points.count > 1 {
                    Path { p in
                        p.move(to: points[0])
                        for pt in points.dropFirst() { p.addLine(to: pt) }
                    }
                    .stroke(item.2, lineWidth: 1.4)
                }
            }
        }
    }
}

// MARK: - Guardrails

struct ObservatoryGuardrailRail: View {
    let riskScore: Double
    let cashPercent: Double
    let topPositionPercent: Double
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("GUARDRAILS")
                .font(.system(size: 9, weight: .semibold))
                .tracking(1.6)
                .foregroundColor(theme.colors.textMuted)

            GuardrailCheckRow(
                title: "Risk within range",
                detail: String(format: "Risk score %.1f ≤ 8.5", riskScore),
                value: riskScore,
                scaleMax: 10,
                passed: riskScore <= 8.5
            )
            GuardrailCheckRow(
                title: "Cash floor met",
                detail: String(format: "Cash %.1f%% ≥ 4%%", cashPercent),
                value: cashPercent,
                scaleMax: Swift.max(20, cashPercent),
                passed: cashPercent >= 4
            )
            GuardrailCheckRow(
                title: "No concentration",
                detail: String(format: "Top position %.1f%% ≤ 30%%", topPositionPercent),
                value: topPositionPercent,
                scaleMax: 35,
                passed: topPositionPercent <= 30
            )
        }
    }
}

private struct GuardrailCheckRow: View {
    let title: String
    let detail: String
    let value: Double
    let scaleMax: Double
    let passed: Bool
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 10) {
                Image(systemName: passed ? "checkmark.shield.fill" : "exclamationmark.shield.fill")
                    .foregroundColor(passed ? theme.colors.gain : theme.colors.loss)
                    .frame(width: 32, height: 32)
                    .background(theme.colors.gain.opacity(0.08))
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.system(size: 10, weight: .medium))
                    Text(passed ? "Pass" : "Review")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundColor(passed ? theme.colors.gain : theme.colors.loss)
                }
            }
            Text(detail).font(.system(size: 8)).foregroundColor(theme.colors.textMuted)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color(hex: "2A323E")).frame(height: 3)
                    Capsule()
                        .fill(theme.colors.gain.opacity(0.35))
                        .frame(width: geo.size.width * 0.25, height: 3)
                        .offset(x: geo.size.width * 0.375)
                    Circle()
                        .fill(passed ? theme.colors.gain : theme.colors.loss)
                        .frame(width: 7, height: 7)
                        .shadow(color: passed ? theme.colors.gain.opacity(0.8) : .clear, radius: 4)
                        .offset(x: geo.size.width * Swift.min(Swift.max(value / scaleMax, 0.03), 0.97) - 3.5)
                }
            }
            .frame(height: 7)
        }
        .padding(12)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 9))
        .overlay(RoundedRectangle(cornerRadius: 9).stroke(theme.colors.border, lineWidth: 1))
    }
}

// MARK: - Metric gauges

struct ObservatoryCircularMetric: View {
    let label: String
    let value: String
    let subvalue: String
    let progress: Double
    let color: Color
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(spacing: 6) {
            Text(label.uppercased())
                .font(.system(size: 9, weight: .medium))
                .tracking(1.4)
                .foregroundColor(theme.colors.textMuted)
            ZStack {
                Circle()
                    .stroke(Color(hex: "202A34"), lineWidth: 5)
                    .frame(width: 72, height: 72)
                Circle()
                    .trim(from: 0, to: min(max(progress / 100, 0), 1))
                    .stroke(color.opacity(0.25), style: StrokeStyle(lineWidth: 10, lineCap: .round))
                    .frame(width: 72, height: 72)
                    .rotationEffect(.degrees(-90))
                Circle()
                    .trim(from: 0, to: min(max(progress / 100, 0), 1))
                    .stroke(color, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                    .frame(width: 72, height: 72)
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 2) {
                    Text(value).font(.system(size: 15, weight: .semibold))
                    if !subvalue.isEmpty {
                        Text(subvalue).font(.system(size: 7)).foregroundColor(theme.colors.textMuted)
                    }
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct ObservatoryMetricGaugeRow: View {
    let riskScore: Double
    let riskDelta: Double
    let returnDelta: Double
    let confidence: Int
    @EnvironmentObject var theme: ThemeManager

    private var proposedRisk: Double { min(10, max(1, riskScore + riskDelta)) }

    var body: some View {
        HStack(spacing: 4) {
            VStack(spacing: 4) {
                Text("RISK SCORE")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(theme.colors.textMuted)
                RiskGaugeNeedleView(score: proposedRisk, label: riskDelta < 0 ? "Lower risk" : "Stable")
                    .scaleEffect(0.85)
            }
            .frame(maxWidth: .infinity)

            ObservatoryCircularMetric(
                label: "Expected return",
                value: String(format: "%+.1f%%", returnDelta),
                subvalue: "Change",
                progress: min(100, max(5, 58 + returnDelta * 24)),
                color: theme.colors.accent
            )

            ObservatoryCircularMetric(
                label: "Confidence",
                value: "\(confidence)%",
                subvalue: confidence >= 80 ? "High" : "Moderate",
                progress: Double(confidence),
                color: theme.colors.gain
            )
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Action chips

struct ObservatoryActionBar: View {
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ActionChip(title: "View portfolio", subtitle: "X-ray holdings", icon: "briefcase", primary: false)
                ActionChip(title: "Visual review", subtitle: "Full decision", icon: "sparkles", primary: true)
                ActionChip(title: "Activity", subtitle: "Trade log", icon: "list.bullet", primary: false)
            }
        }
    }
}

private struct ActionChip: View {
    let title: String
    let subtitle: String
    let icon: String
    let primary: Bool
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.body.weight(.semibold))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption.weight(.semibold))
                Text(subtitle).font(.system(size: 9)).opacity(0.75)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right").font(.caption2)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(width: 200)
        .foregroundColor(primary ? Color(hex: "06120E") : theme.colors.textPrimary)
        .background(
            primary
                ? LinearGradient(colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")], startPoint: .topLeading, endPoint: .bottomTrailing)
                : LinearGradient(colors: [Color(hex: "151B24"), Color(hex: "10161E")], startPoint: .topLeading, endPoint: .bottomTrailing)
        )
        .clipShape(RoundedRectangle(cornerRadius: 9))
        .overlay(
            RoundedRectangle(cornerRadius: 9)
                .stroke(primary ? theme.colors.gain.opacity(0.6) : theme.colors.border, lineWidth: 1)
        )
    }
}
