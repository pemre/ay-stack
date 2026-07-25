/**
 * Centralized application configuration.
 * Single source of truth for app identity, theme, and features.
 */

export interface SupportedLocale {
  code: string;
  label: string;
}

export interface AppConfig {
  app: {
    name: string;
    logo: string;
    defaultLocale: string;
    supportedLocales: SupportedLocale[];
  };
  features: {
    search: boolean;
    darkLightToggle: boolean;
    draggableLayout: boolean;
    progressTracker: boolean;
  };
}

const config: AppConfig = {
  app: {
    name: "Bürküt",
    logo: "🦅",
    defaultLocale: "tr",
    supportedLocales: [
      { code: "tr", label: "Türkçe" },
      { code: "en", label: "English" },
      { code: "zh", label: "中文" },
    ],
  },

  /** Feature flags – flip these to enable/disable functionality */
  features: {
    search: false,
    darkLightToggle: true,
    draggableLayout: true,
    progressTracker: true,
  },
};

export default config;
