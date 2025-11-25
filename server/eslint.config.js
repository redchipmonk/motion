// server/eslint.config.js
const tseslint = require("typescript-eslint");
const eslintPluginJs = require("@eslint/js");

module.exports = tseslint.config(
  {
    ignores: ["eslint.config.js", "dist/**", "node_modules/**", "vitest.config.ts"],
  },
  eslintPluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    rules: {},
  }
);
