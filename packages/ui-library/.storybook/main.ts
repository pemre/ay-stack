import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/blocks/**/*.stories.tsx", "../src/blocks/**/*.mdx"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  // Storybook occupies the Pages site root, so CI passes STORYBOOK_BASE=/ay-stack/.
  // Local runs default to "/" so `pnpm storybook` needs no environment setup.
  viteFinal: async (viteConfig) => {
    viteConfig.base = process.env.STORYBOOK_BASE || "/";
    return viteConfig;
  },
};

export default config;
