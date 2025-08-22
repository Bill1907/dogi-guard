import { Platform } from "react-native";

export const Theme = {
  colors: {
    // Main background - soft gradient base
    background: {
      primary: "#FFCD58",
      secondary: "#e8ebf0",
      // gradient: ["#f0f2f5", "#e8ebf0"],
    },

    // Glass effect colors
    glass: {
      background: "rgba(255, 255, 255, 0.7)",
      backgroundDark: "rgba(255, 255, 255, 0.85)",
      border: "rgba(255, 255, 255, 0.3)",
      borderLight: "rgba(255, 255, 255, 0.5)",
      shadow: "rgba(0, 0, 0, 0.1)",
    },

    // Primary colors
    primary: {
      main: "#FF9636",
      light: "#818cf8",
      dark: "#5a67d8",
      transparent: "rgba(102, 126, 234, 0.1)",
    },

    // Text colors
    text: {
      primary: "#2d3436",
      secondary: "#636e72",
      light: "#95a5a6",
      white: "#ffffff",
    },

    // Status colors
    status: {
      success: "#00b894",
      warning: "#fdcb6e",
      danger: "#ff6b6b",
      info: "#74b9ff",
    },

    // Additional semantic colors
    success: {
      main: "#00b894",
      light: "#55efc4",
      dark: "#00a085",
    },

    error: {
      main: "#ff6b6b",
      light: "#ff8a80",
      dark: "#d32f2f",
    },

    secondary: {
      main: "#74b9ff",
      light: "#a8d4ff",
      dark: "#5a9bcf",
    },

    border: {
      primary: "rgba(255, 255, 255, 0.3)",
      secondary: "rgba(0, 0, 0, 0.1)",
    },
  },

  // Glass morphism effects
  glass: {
    blur: {
      light: 10,
      medium: 15,
      heavy: 20,
    },
    opacity: {
      light: 0.6,
      medium: 0.75,
      heavy: 0.85,
    },
  },

  // Border radius
  borderRadius: {
    small: 8,
    medium: 12,
    large: 16,
    xl: 20,
    xxl: 24,
    round: 999,
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Shadows for glass effect
  shadows: {
    glass: Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.08)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
    glassLight: Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
    glassHeavy: Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.12)",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 1,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  // Glass card styles
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.08)",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  // Glass button styles
  glassButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0, 0, 0, 0.05)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Auth specific styles
  auth: {
    // Primary action button (Sign in, Sign up)
    primaryButton: {
      backgroundColor: "#FF9636",
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      ...Platform.select({
        ios: {
          shadowColor: "rgba(255, 205, 88, 0.3)",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 16,
        },
        android: {
          elevation: 8,
        },
      }),
    },

    // Secondary action button (with glass effect)
    secondaryButton: {
      backgroundColor: "rgba(255, 255, 255, 0.85)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 24,
      ...Platform.select({
        ios: {
          shadowColor: "rgba(0, 0, 0, 0.08)",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
        android: {
          elevation: 4,
        },
      }),
    },

    // Header text styles
    title: {
      fontSize: 28,
      fontWeight: "bold" as const,
      color: "#2d3436",
      textAlign: "center" as const,
      marginBottom: 8,
    },

    subtitle: {
      fontSize: 16,
      color: "#636e72",
      textAlign: "center" as const,
      marginBottom: 32,
      lineHeight: 24,
    },

    // Link text
    linkText: {
      color: "#667eea",
      fontWeight: "600" as const,
      fontSize: 16,
    },

    // Error text
    errorText: {
      color: "#ff6b6b",
      fontSize: 14,
      textAlign: "center" as const,
      marginTop: 16,
      paddingHorizontal: 16,
    },
  },
};

// Helper function to create glass effect style
export const createGlassEffect = (
  intensity: "light" | "medium" | "heavy" = "medium"
) => {
  return {
    backgroundColor:
      Theme.colors.glass[
        intensity === "light" ? "background" : "backgroundDark"
      ],
    borderWidth: 1,
    borderColor: Theme.colors.glass.border,
    backdropFilter: `blur(${Theme.glass.blur[intensity]}px)`,
    ...Theme.shadows[
      intensity === "light"
        ? "glassLight"
        : intensity === "heavy"
          ? "glassHeavy"
          : "glass"
    ],
  };
};
