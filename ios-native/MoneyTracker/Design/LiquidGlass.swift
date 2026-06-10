import SwiftUI

enum GlassSurfaceProminence {
    case regular
    case accent
    case destructive
}

struct LiquidGlassGroup<Content: View>: View {
    let spacing: CGFloat
    @ViewBuilder var content: () -> Content

    init(spacing: CGFloat = 16, @ViewBuilder content: @escaping () -> Content) {
        self.spacing = spacing
        self.content = content
    }

    var body: some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            GlassEffectContainer(spacing: spacing) {
                content()
            }
        } else {
            content()
        }
        #else
        content()
        #endif
    }
}

struct LiquidGlassCard: ViewModifier {
    let cornerRadius: CGFloat
    let interactive: Bool
    let prominence: GlassSurfaceProminence

    func body(content: Content) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            liquidGlass(content)
        } else {
            fallback(content)
        }
        #else
        fallback(content)
        #endif
    }

    #if compiler(>=6.2)
    @available(iOS 26.0, *)
    @ViewBuilder
    private func liquidGlass(_ content: Content) -> some View {
        if interactive {
            switch prominence {
            case .regular:
                content
                    .padding(16)
                    .glassEffect(.regular.interactive(), in: .rect(cornerRadius: cornerRadius))
            case .accent:
                content
                    .padding(16)
                    .glassEffect(.regular.tint(.blue.opacity(0.18)).interactive(), in: .rect(cornerRadius: cornerRadius))
            case .destructive:
                content
                    .padding(16)
                    .glassEffect(.regular.tint(.red.opacity(0.16)).interactive(), in: .rect(cornerRadius: cornerRadius))
            }
        } else {
            switch prominence {
            case .regular:
                content
                    .padding(16)
                    .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
            case .accent:
                content
                    .padding(16)
                    .glassEffect(.regular.tint(.blue.opacity(0.18)), in: .rect(cornerRadius: cornerRadius))
            case .destructive:
                content
                    .padding(16)
                    .glassEffect(.regular.tint(.red.opacity(0.16)), in: .rect(cornerRadius: cornerRadius))
            }
        }
    }
    #endif

    private func fallback(_ content: Content) -> some View {
        content
            .padding(16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.glassStroke, lineWidth: 0.7)
            }
            .shadow(color: .black.opacity(0.06), radius: 14, y: 6)
    }
}

struct LiquidGlassButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        #if compiler(>=6.2)
        if #available(iOS 26.0, *) {
            configuration.label
                .font(.headline)
                .frame(minHeight: 44)
                .padding(.horizontal, 16)
                .glassEffect(.regular.interactive(), in: .capsule)
                .scaleEffect(configuration.isPressed ? 0.97 : 1)
                .animation(.snappy(duration: 0.18), value: configuration.isPressed)
        } else {
            fallback(configuration)
        }
        #else
        fallback(configuration)
        #endif
    }

    private func fallback(_ configuration: Configuration) -> some View {
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
    func liquidGlassCard(
        cornerRadius: CGFloat = 24,
        interactive: Bool = false,
        prominence: GlassSurfaceProminence = .regular
    ) -> some View {
        modifier(LiquidGlassCard(cornerRadius: cornerRadius, interactive: interactive, prominence: prominence))
    }
}

extension Color {
    static let appBackground = Color(uiColor: .systemGroupedBackground)
    static let glassStroke = Color(uiColor: .separator).opacity(0.34)
    static let readableSecondary = Color(uiColor: .secondaryLabel)
    static let readableTertiary = Color(uiColor: .tertiaryLabel)
}
