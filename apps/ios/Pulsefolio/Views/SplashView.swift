import SwiftUI

struct SplashView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var progress: CGFloat = 0
    @State private var showMain = false

    var body: some View {
        Group {
            if !api.isAuthenticated {
                LoginView()
            } else if showMain {
                MainTabView()
            } else {
                ZStack {
                    theme.colors.bg.ignoresSafeArea()
                    VStack(spacing: 24) {
                        PulseLineView(progress: progress)
                            .frame(height: 48)
                            .padding(.horizontal, 40)
                        Text("Pulsefolio")
                            .font(.system(size: 32, weight: .semibold))
                            .foregroundStyle(
                                LinearGradient(colors: [theme.colors.gain, theme.colors.accent], startPoint: .leading, endPoint: .trailing)
                            )
                        Text("Every beat of your portfolio, decoded.")
                            .font(.subheadline)
                            .foregroundColor(theme.colors.textMuted)
                            .italic()
                    }
                }
                .onAppear {
                    withAnimation(.easeInOut(duration: 1.2)) { progress = 1 }
                    Task {
                        await api.fetchDashboard()
                        try? await Task.sleep(nanoseconds: 1_500_000_000)
                        withAnimation { showMain = true }
                    }
                }
            }
        }
    }
}

struct PulseLineView: View {
    let progress: CGFloat
    var body: some View {
        GeometryReader { geo in
            Path { path in
                let w = geo.size.width * progress
                let h = geo.size.height
                path.move(to: CGPoint(x: 0, y: h * 0.5))
                path.addLine(to: CGPoint(x: w * 0.2, y: h * 0.5))
                path.addLine(to: CGPoint(x: w * 0.3, y: h * 0.3))
                path.addLine(to: CGPoint(x: w * 0.4, y: h * 0.7))
                path.addLine(to: CGPoint(x: w * 0.5, y: h * 0.2))
                path.addLine(to: CGPoint(x: w * 0.6, y: h * 0.5))
                path.addLine(to: CGPoint(x: w, y: h * 0.5))
            }
            .trim(from: 0, to: progress)
            .stroke(
                LinearGradient(colors: [Color(hex: "00D4AA"), Color(hex: "4A9EFF")], startPoint: .leading, endPoint: .trailing),
                style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round)
            )
        }
    }
}
