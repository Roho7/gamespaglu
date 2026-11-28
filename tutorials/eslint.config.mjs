import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/**", ".whisper/**", "*/out/**", "*/capture/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
