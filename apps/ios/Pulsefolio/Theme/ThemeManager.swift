import SwiftUI

enum AppTheme: String, CaseIterable, Identifiable {
    case midnight, aurora, paper, terminal
    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .midnight: return "Midnight"
        case .aurora: return "Aurora"
        case .paper: return "Paper"
        case .terminal: return "Terminal"
        }
    }
}

@MainActor
final class ThemeManager: ObservableObject {
    @Published var theme: AppTheme = .midnight

    var colors: ThemeColors { ThemeColors.forTheme(theme) }

    var colorScheme: ColorScheme? {
        theme == .paper ? .light : .dark
    }
}

struct ThemeColors {
    let bg: Color
    let surface: Color
    let surfaceElevated: Color
    let border: Color
    let textPrimary: Color
    let textMuted: Color
    let gain: Color
    let loss: Color
    let accent: Color

    static func forTheme(_ theme: AppTheme) -> ThemeColors {
        switch theme {
        case .midnight:
            return ThemeColors(
                bg: Color(hex: "080C10"),
                surface: Color(hex: "0B1015"),
                surfaceElevated: Color(hex: "111720"),
                border: Color(hex: "222A35"),
                textPrimary: .white,
                textMuted: Color(hex: "89919E"),
                gain: Color(hex: "00D4AA"),
                loss: Color(hex: "FF4757"),
                accent: Color(hex: "00D4AA")
            )
        case .aurora:
            return ThemeColors(
                bg: Color(hex: "0A1628"),
                surface: Color(hex: "132238"),
                surfaceElevated: Color(hex: "1A2D4A"),
                border: Color(hex: "2A3F5C"),
                textPrimary: .white,
                textMuted: Color(hex: "8BA4C4"),
                gain: Color(hex: "00E5C0"),
                loss: Color(hex: "FF6B7A"),
                accent: Color(hex: "8B5CF6")
            )
        case .paper:
            return ThemeColors(
                bg: Color(hex: "F5F6FA"),
                surface: .white,
                surfaceElevated: Color(hex: "EEF0F4"),
                border: Color(hex: "D1D5DB"),
                textPrimary: Color(hex: "1A1D26"),
                textMuted: Color(hex: "6B7280"),
                gain: Color(hex: "059669"),
                loss: Color(hex: "DC2626"),
                accent: Color(hex: "4A9EFF")
            )
        case .terminal:
            return ThemeColors(
                bg: .black,
                surface: Color(hex: "0A0A0A"),
                surfaceElevated: Color(hex: "141414"),
                border: Color(hex: "1F1F1F"),
                textPrimary: Color(hex: "00FF41"),
                textMuted: Color(hex: "00AA2A"),
                gain: Color(hex: "00FF41"),
                loss: Color(hex: "FF3333"),
                accent: Color(hex: "00FF41")
            )
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
