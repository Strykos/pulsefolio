import SwiftUI

// MARK: - Option B visual primitives (mockup fidelity)

enum OptionBPalette {
    static let sparkleBlue = Color(hex: "4A9EFF")
    static let neonGain = Color(hex: "00E8B8")
    static let driftOrange = Color(hex: "E7AE39")
    static let driftSurface = Color(hex: "1E1608")
}

struct OptionBNeonGlow: ViewModifier {
    let color: Color
    var radius: CGFloat = 24
    var opacity: Double = 0.45

    func body(content: Content) -> some View {
        content
            .shadow(color: color.opacity(opacity), radius: radius, y: 4)
            .shadow(color: color.opacity(opacity * 0.5), radius: radius * 0.4, y: 1)
    }
}

struct OptionBGlassCard: ViewModifier {
    var tint: Color = Color(hex: "0B1015")
    var border: Color = Color(hex: "222A35")
    var cornerRadius: CGFloat = 14

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial.opacity(0.55))
            .background(tint.opacity(0.72))
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(border, lineWidth: 1)
            )
    }
}

extension View {
    func optionBGlow(_ color: Color, radius: CGFloat = 24, opacity: Double = 0.45) -> some View {
        modifier(OptionBNeonGlow(color: color, radius: radius, opacity: opacity))
    }

    func optionBGlass(tint: Color = Color(hex: "0B1015"), border: Color = Color(hex: "222A35"), cornerRadius: CGFloat = 14) -> some View {
        modifier(OptionBGlassCard(tint: tint, border: border, cornerRadius: cornerRadius))
    }
}

struct OptionBFloatingGlassCard: View {
    let changePercent: Double
    var dayChange: Double? = nil
    var showLivePaper: Bool = true
    var isLive: Bool = true
    @EnvironmentObject var theme: ThemeManager

    var body: some View {
        HStack(spacing: 10) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [theme.colors.gain.opacity(0.35), theme.colors.gain.opacity(0.08)],
                            center: .center,
                            startRadius: 2,
                            endRadius: 20
                        )
                    )
                    .frame(width: 38, height: 38)
                Circle()
                    .stroke(theme.colors.gain.opacity(0.55), lineWidth: 1.5)
                    .frame(width: 38, height: 38)
                Image(systemName: "sparkle")
                    .font(.body.weight(.bold))
                    .foregroundStyle(
                        LinearGradient(colors: [theme.colors.gain, OptionBPalette.sparkleBlue], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .shadow(color: theme.colors.gain.opacity(0.9), radius: 10)
            }
            HStack(spacing: 6) {
                Text("\(changePercent >= 0 ? "+" : "")\(changePercent, specifier: "%.2f")% Today")
                    .font(.subheadline.weight(.bold))
                    .foregroundColor(theme.colors.textPrimary)
                if let dayChange {
                    Text("\(dayChange >= 0 ? "+" : "")\(dayChange, format: .currency(code: "USD"))")
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(theme.colors.gain)
                }
            }
            Spacer(minLength: 8)
            if showLivePaper {
                LiveIndicatorView(isLive: isLive)
                PaperTradingBadge()
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
        .optionBGlass(tint: theme.colors.surface, border: theme.colors.gain.opacity(0.35), cornerRadius: 16)
        .optionBGlow(theme.colors.gain, radius: 20, opacity: 0.35)
    }
}
