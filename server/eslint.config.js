// server/eslint.config.js
import tseslint from "typescript-eslint";
import eslintPluginJs from "@eslint/js";

export default tseslint.config(
  eslintPluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {},
  }
);
