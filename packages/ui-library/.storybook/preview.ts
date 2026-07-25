import type { Decorator, Preview } from "@storybook/react";
import { useEffect } from "react";
import "./tailwind.css";

const VIEWPORTS = {
  small: { name: "Small (320px)", styles: { width: "320px", height: "568px" } },
  medium: { name: "Medium (768px)", styles: { width: "768px", height: "1024px" } },
  large: { name: "Large (1280px)", styles: { width: "1280px", height: "800px" } },
};

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return Story();
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Global theme for components",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [withTheme],
  parameters: {
    viewport: {
      viewports: VIEWPORTS,
    },
  },
};

export default preview;
