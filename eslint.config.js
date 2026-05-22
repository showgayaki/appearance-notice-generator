import js from "@eslint/js";
import deprecation from "eslint-plugin-deprecation";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const browserGlobals = {
  document: "readonly",
  HTMLTextAreaElement: "readonly",
  navigator: "readonly",
  window: "readonly",
};

const nodeGlobals = {
  process: "readonly",
};

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "eslint.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: browserGlobals,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      deprecation,
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "deprecation/deprecation": "error",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: nodeGlobals,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
