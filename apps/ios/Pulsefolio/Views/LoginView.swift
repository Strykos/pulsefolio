import SwiftUI

struct LoginView: View {
    @EnvironmentObject var theme: ThemeManager
    @EnvironmentObject var api: APIClient
    @State private var email = "demo@pulsefolio.app"
    @State private var password = "demo12345"
    @State private var errorMessage: String?
    @State private var isSubmitting = false

    var body: some View {
        ZStack {
            theme.colors.bg.ignoresSafeArea()
            VStack(spacing: 24) {
                Text("Pulsefolio")
                    .font(.system(size: 32, weight: .semibold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [theme.colors.gain, theme.colors.accent],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )

                Text("Sign in to your paper portfolio")
                    .font(.subheadline)
                    .foregroundColor(theme.colors.textMuted)

                VStack(spacing: 16) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                        .padding()
                        .background(theme.colors.surface)
                        .cornerRadius(10)

                    SecureField("Password", text: $password)
                        .textContentType(.password)
                        .padding()
                        .background(theme.colors.surface)
                        .cornerRadius(10)
                }
                .padding(.horizontal, 32)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundColor(.red)
                }

                Button {
                    Task { await submit() }
                } label: {
                    Text(isSubmitting ? "Signing in…" : "Sign in")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(theme.colors.accent)
                        .foregroundColor(theme.colors.bg)
                        .cornerRadius(10)
                }
                .disabled(isSubmitting)
                .padding(.horizontal, 32)

                Text("Server: \(api.baseURL.absoluteString)")
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)

                Text("Demo: demo@pulsefolio.app / demo12345")
                    .font(.caption2)
                    .foregroundColor(theme.colors.textMuted)
            }
        }
    }

    private func submit() async {
        isSubmitting = true
        errorMessage = nil
        let success = await api.login(email: email, password: password)
        if !success {
            errorMessage = "Invalid credentials or API unavailable"
        }
        isSubmitting = false
    }
}
