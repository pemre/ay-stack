import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "@fontsource/crimson-pro/400.css";
import "@fontsource/crimson-pro/500.css";
import "@fontsource/crimson-pro/700.css";
// Stylesheet order is load-bearing: Tailwind and the @ay/tokens theme first so
// the token declarations exist, then the app tier's legacy aliases that resolve
// through them, then layout which consumes the aliases.
import "./styles/tailwind.css";
import "./styles/app-tokens.css";
import "./styles/layout.css";
import "./i18n"; // i18next initialization — must be imported before App
import App from "./App";
import { ThemeProvider } from "./hooks/useTheme";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
