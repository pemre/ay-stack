import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import dts from "vite-plugin-dts";

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
        }),
    ],
    build: {
        lib: {
            entry: resolve(__dirname, "src/index.ts"),
            name: "AyDashboardEngine",
            formats: ["es", "cjs"],
            fileName: (format) => `index.${format === "es" ? "es" : "cjs"}.js`,
        },
        rollupOptions: {
            external: ["react", "react-dom", "react/jsx-runtime", "react-grid-layout", "zustand"],
            output: {
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    "react/jsx-runtime": "jsxRuntime",
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
