import SwiftUI

struct LiquidGlassCard: ViewModifier {
    let cornerRadius: CGFloat
    let interactive: Bool

    func body(content: Content) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            if interactive {
                content
                    .padding(16)
                    .glassEffect(.regular.interactive(), in: .rect(cornerRadius: cornerRadius))
            } else {
                content
                    .padding(16)
                    .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
            }
        } else {
            fallback(content)
        }
        #else
        fallback(content)
        #endif
    }

    private func fallback(_ content: Content) -> some View {
        content
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(.white.opacity(0.25), lineWidth: 0.5)
            }
    }
}

struct LiquidGlassButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.headline)
            .frame(minHeight: 44)
            .padding(.horizontal, 16)
            .background(.regularMaterial, in: Capsule())
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.snappy(duration: 0.18), value: configuration.isPressed)
    }
}

extension View {
    func liquidGlassCard(cornerRadius: CGFloat = 24, interactive: Bool = false) -> some View {
        modifier(LiquidGlassCard(cornerRadius: cornerRadius, interactive: interactive))
    }
}

extension Color {
    static let appBackground = Color(uiColor: .systemGroupedBackground)
}
