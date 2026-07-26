import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

const isStorybook = process.argv[1]?.includes("storybook") || process.env.STORYBOOK === "true";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    !isStorybook
      ? dts({
          insertTypesEntry: true,
          rollupTypes: true,
        })
      : null,
  ].filter(Boolean),
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "AyUiLibrary",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "es" : "cjs"}.js`,
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "d3",
        "react-grid-layout",
        "zustand",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
            d3: "d3",
            "react-grid-layout": "ReactGridLayout",
            zustand: "zustand",
        },
      },
    },
    cssCodeSplit: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [resolve(__dirname, "src/tests/setup.ts")],
    css: true,
    passWithNoTests: true,
  },
});
