import SwiftUI

struct OfflineBanner: View {
    var body: some View {
        Text("API unavailable — check your Pulsefolio server connection")
            .font(.caption)
            .foregroundColor(Color(hex: "FBBF24"))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(10)
            .background(Color(hex: "F59E0B").opacity(0.12))
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(Color(hex: "F59E0B").opacity(0.3), lineWidth: 1)
            )
    }
}

struct StatusToast: View {
    let message: String

    var body: some View {
        Text(message)
            .font(.caption.weight(.semibold))
            .foregroundColor(.white)
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color(hex: "111720").opacity(0.95))
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color(hex: "00D4AA").opacity(0.4), lineWidth: 1))
            .shadow(color: .black.opacity(0.35), radius: 8, y: 4)
    }
}

struct AssetClassBadge: View {
    let assetClass: String
    @EnvironmentObject var theme: ThemeManager

    var label: String {
        switch assetClass.uppercased() {
        case "STOCK": return "Stocks"
        case "ETF": return "ETFs"
        case "CRYPTO": return "Crypto"
        case "BOND": return "Bonds"
        case "CASH": return "Cash"
        default: return assetClass.capitalized
        }
    }

    var color: Color {
        switch assetClass.uppercased() {
        case "STOCK": return Color(hex: "4A9EFF")
        case "ETF": return Color(hex: "00D4AA")
        case "CRYPTO": return Color(hex: "8B5CF6")
        case "BOND": return Color(hex: "F59E0B")
        default: return theme.colors.accent
        }
    }

    var body: some View {
        Text(label)
            .font(.caption.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.18))
            .foregroundColor(color)
            .clipShape(Capsule())
    }
}

struct PositionRowView: View {
    let position: Position
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(position.symbol)
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(theme.colors.textPrimary)
                Text(position.name)
                    .font(.caption)
                    .foregroundColor(theme.colors.textMuted)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(position.value, format: .currency(code: "USD"))
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(theme.colors.textPrimary)
                Text("\(position.changePercent >= 0 ? "+" : "")\(position.changePercent, specifier: "%.1f")%")
                    .font(.caption)
                    .foregroundColor(position.changePercent >= 0 ? theme.colors.gain : theme.colors.loss)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(theme.colors.surfaceElevated.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }
}

struct TradeRowView: View {
    let trade: Trade
    var onApprove: (() -> Void)?
    @EnvironmentObject var theme: ThemeManager

    private var dateText: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: trade.timestamp)
            ?? ISO8601DateFormatter().date(from: trade.timestamp)
            ?? Date()
        return date.formatted(.dateTime.month(.abbreviated).day())
    }

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(trade.side == "BUY" ? theme.colors.gain : theme.colors.loss)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text("\(trade.side) \(trade.symbol)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                    Text("x\(trade.quantity, specifier: trade.quantity.truncatingRemainder(dividingBy: 1) == 0 ? "%.0f" : "%.2f")")
                        .font(.caption)
                        .foregroundColor(theme.colors.textMuted)
                    Text(trade.mode.uppercased())
                        .font(.caption2.weight(.semibold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(theme.colors.surfaceElevated)
                        .foregroundColor(theme.colors.textMuted)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                        .overlay(
                            RoundedRectangle(cornerRadius: 4)
                                .stroke(theme.colors.border, lineWidth: 1)
                        )
                }
                Text(dateText)
                    .font(.caption)
                    .foregroundColor(theme.colors.textMuted)
            }

            Spacer()

            if let pnl = trade.pnl {
                Text("\(pnl >= 0 ? "+" : "")\(pnl, format: .currency(code: "USD"))")
                    .font(.subheadline.weight(.medium))
                    .foregroundColor(pnl >= 0 ? theme.colors.gain : theme.colors.loss)
            }

            if trade.status == "pending", let onApprove {
                Button("Approve", action: onApprove)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        LinearGradient(
                            colors: [Color(hex: "18D8A5"), Color(hex: "08B98B")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .foregroundColor(Color(hex: "06120E"))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(theme.colors.gain.opacity(0.6), lineWidth: 1)
                    )
            }
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(theme.colors.border, lineWidth: 1)
        )
    }
}

struct InsightCardView: View {
    let insight: AIInsight
    @EnvironmentObject var theme: ThemeManager

    private var timeText: String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = formatter.date(from: insight.date)
            ?? ISO8601DateFormatter().date(from: insight.date)
            ?? Date()
        return date.formatted(.dateTime.month(.abbreviated).day().hour().minute())
    }

    private var displayRationale: String {
        let raw = insight.rationale
        guard raw.contains("symbol") || raw.contains("trade_id") else { return raw }
        let symbol = InsightTextParser.value(for: "symbol", in: raw) ?? insight.symbol ?? "asset"
        let side = InsightTextParser.value(for: "side", in: raw) ?? "trade"
        let qty = InsightTextParser.value(for: "quantity", in: raw)
        if let qty {
            return "\(side.uppercased()) \(qty) shares of \(symbol) via auto trading."
        }
        return raw
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: "brain.head.profile")
                .font(.body.weight(.semibold))
                .foregroundColor(theme.colors.accent)
                .frame(width: 36, height: 36)
                .background(theme.colors.accent.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Text(timeText)
                        .font(.caption)
                        .foregroundColor(theme.colors.textMuted)
                    Text(insight.action)
                        .font(.caption2.weight(.bold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(insight.action == "HOLD" ? theme.colors.textMuted.opacity(0.2) : theme.colors.accent.opacity(0.2))
                        .foregroundColor(insight.action == "HOLD" ? theme.colors.textMuted : theme.colors.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                    if let symbol = insight.symbol {
                        Text(symbol)
                            .font(.caption.weight(.semibold))
                            .foregroundColor(theme.colors.textPrimary)
                    }
                    if let confidence = insight.confidence {
                        Text("\(confidence)%")
                            .font(.caption2)
                            .foregroundColor(theme.colors.textMuted)
                    }
                }

                Text("\"\(displayRationale)\"")
                    .font(.subheadline)
                    .foregroundColor(theme.colors.textMuted)
                    .fixedSize(horizontal: false, vertical: true)

                HStack(spacing: 4) {
                    Image(systemName: "arrow.right")
                        .font(.caption2)
                    Text(insight.outcome)
                        .font(.caption)
                }
                .foregroundColor(theme.colors.gain)
            }
        }
        .padding(14)
        .background(theme.colors.surface.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(
                    insight.action.contains("REBALANCE") || insight.action == "TRADE"
                        ? theme.colors.gain.opacity(0.45)
                        : theme.colors.border,
                    lineWidth: 1
                )
        )
        .optionBGlow(
            insight.action.contains("REBALANCE") || insight.action == "TRADE" ? theme.colors.gain : .clear,
            radius: 10,
            opacity: 0.2
        )
    }
}

enum InsightTextParser {
    static func value(for key: String, in text: String) -> String? {
        let patterns = [
            "'\(key)':\\s*'([^']+)'",
            "\"\(key)\":\\s*\"([^\"]+)\"",
            "'\(key)':\\s*([0-9.]+)",
            "\"\(key)\":\\s*([0-9.]+)",
        ]
        for pattern in patterns {
            if let regex = try? NSRegularExpression(pattern: pattern),
               let match = regex.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
               let range = Range(match.range(at: 1), in: text) {
                return String(text[range])
            }
        }
        return nil
    }
}

struct AllocationBreakdownView: View {
    let allocations: [Allocation]
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Allocation")
                .font(.subheadline.weight(.medium))
                .foregroundColor(theme.colors.textMuted)

            ForEach(allocations) { allocation in
                HStack {
                    Circle()
                        .fill(Color(hex: allocation.color))
                        .frame(width: 8, height: 8)
                    Text(allocation.label)
                        .font(.caption)
                        .foregroundColor(theme.colors.textMuted)
                    Spacer()
                    Text("\(allocation.percent, specifier: "%.1f")%")
                        .font(.caption.weight(.semibold))
                        .foregroundColor(theme.colors.textPrimary)
                }
            }
        }
        .padding(14)
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct SparklineView: View {
    let data: [Double]
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        GeometryReader { geo in
            let minVal = data.min() ?? 0
            let maxVal = data.max() ?? 1
            let range = max(maxVal - minVal, 1)

            Path { path in
                guard data.count > 1 else { return }
                for (index, value) in data.enumerated() {
                    let x = geo.size.width * CGFloat(index) / CGFloat(data.count - 1)
                    let y = geo.size.height * (1 - CGFloat((value - minVal) / range))
                    if index == 0 {
                        path.move(to: CGPoint(x: x, y: y))
                    } else {
                        path.addLine(to: CGPoint(x: x, y: y))
                    }
                }
            }
            .stroke(
                LinearGradient(colors: [theme.colors.gain, theme.colors.accent], startPoint: .leading, endPoint: .trailing),
                style: StrokeStyle(lineWidth: 2, lineCap: .round, lineJoin: .round)
            )
        }
        .frame(height: 80)
    }
}

struct SectionHeader: View {
    let title: String
    var eyebrow: String? = nil
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if let eyebrow {
                Text(eyebrow.uppercased())
                    .font(.system(size: 10, weight: .semibold))
                    .tracking(1.6)
                    .foregroundColor(theme.colors.textMuted)
            }
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundColor(theme.colors.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct PaperTradingBadge: View {
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        Text("PAPER")
            .font(.caption2.weight(.semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(theme.colors.surfaceElevated)
            .foregroundColor(theme.colors.textMuted)
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(theme.colors.border, lineWidth: 1)
            )
    }
}

struct LiveIndicatorView: View {
    let isLive: Bool
    @State private var pulse = false

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(isLive ? Color(hex: "00D4AA") : Color.gray)
                .frame(width: 8, height: 8)
                .scaleEffect(pulse ? 1.2 : 1)
                .animation(.easeInOut(duration: 1).repeatForever(), value: pulse)
            Text(isLive ? "Live" : "Offline")
                .font(.caption)
                .foregroundColor(Color(hex: "8B95A8"))
        }
        .onAppear { pulse = isLive }
    }
}

struct RiskGaugeView: View {
    let score: Double
    let label: String
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Risk \(score, specifier: "%.1f") · \(label)")
                .font(.subheadline)
                .foregroundColor(theme.colors.textMuted)
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(theme.colors.surface)
                    Capsule()
                        .fill(LinearGradient(colors: [theme.colors.gain, .orange, theme.colors.loss], startPoint: .leading, endPoint: .trailing))
                        .frame(width: g.size.width * min(score / 10, 1))
                }
            }
            .frame(height: 8)
        }
    }
}

struct DecisionCardView: View {
    let recommendation: AIRecommendation
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(recommendation.action)
                    .font(.headline)
                    .foregroundColor(theme.colors.accent)
                Text(recommendation.symbol)
                    .font(.headline)
                Spacer()
                Text("\(recommendation.confidence)%")
                    .font(.caption)
                    .foregroundColor(theme.colors.textMuted)
            }
            Text(recommendation.rationale)
                .font(.subheadline)
                .foregroundColor(theme.colors.textMuted)
            HStack {
                Text("Risk: \(recommendation.riskDelta, specifier: "%+.1f")")
                Text("Return: \(recommendation.returnDelta, specifier: "%+.1f")%")
            }
            .font(.caption)
            .foregroundColor(theme.colors.textMuted)
        }
        .padding()
        .background(theme.colors.surface)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
