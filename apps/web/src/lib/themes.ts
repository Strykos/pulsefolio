import base from "@design-tokens/base.json";
import midnight from "@design-tokens/themes/midnight.json";
import aurora from "@design-tokens/themes/aurora.json";
import paper from "@design-tokens/themes/paper.json";
import terminal from "@design-tokens/themes/terminal.json";

export type ThemeId = "midnight" | "aurora" | "paper" | "terminal";

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textMuted: string;
  gain: string;
  loss: string;
  accent: string;
  pulseGlow: string;
  chartGrid: string;
  cardBorder: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  mood: string;
  colors: ThemeColors;
}

export const themes: Record<ThemeId, Theme> = {
  midnight: midnight as Theme,
  aurora: aurora as Theme,
  paper: paper as Theme,
  terminal: terminal as Theme,
};

export const themeList: Theme[] = [
  themes.midnight,
  themes.aurora,
  themes.paper,
  themes.terminal,
];

export const defaultThemeId: ThemeId = "midnight";

export const designTokens = base;

export function applyThemeToDocument(themeId: ThemeId): void {
  const theme = themes[themeId];
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([key, value]) => {
    const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    root.style.setProperty(`--color-${cssKey}`, value);
  });

  root.style.setProperty("--spacing-xs", `${designTokens.spacing.xs}px`);
  root.style.setProperty("--spacing-sm", `${designTokens.spacing.sm}px`);
  root.style.setProperty("--spacing-md", `${designTokens.spacing.md}px`);
  root.style.setProperty("--spacing-lg", `${designTokens.spacing.lg}px`);
  root.style.setProperty("--spacing-xl", `${designTokens.spacing.xl}px`);
  root.style.setProperty("--spacing-2xl", `${designTokens.spacing["2xl"]}px`);

  root.style.setProperty("--radius-sm", `${designTokens.radius.sm}px`);
  root.style.setProperty("--radius-md", `${designTokens.radius.md}px`);
  root.style.setProperty("--radius-lg", `${designTokens.radius.lg}px`);

  root.style.setProperty("--ease-spring", designTokens.motion.easeSpring);
  root.style.setProperty("--ease-smooth", designTokens.motion.easeSmooth);
  root.style.setProperty("--duration-fast", `${designTokens.motion.durationFast}ms`);
  root.style.setProperty("--duration-normal", `${designTokens.motion.durationNormal}ms`);
  root.style.setProperty("--duration-slow", `${designTokens.motion.durationSlow}ms`);

  root.dataset.theme = themeId;
}
