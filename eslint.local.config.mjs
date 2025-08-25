import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        JSX: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", {
        // ✅ acepta cualquier nombre que EMPIECE con "_" o sea "logger"
        argsIgnorePattern: "^(?:_|logger)",
        varsIgnorePattern: "^(?:_|logger)",
        destructuredArrayIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
  // Tests y fixtures: relajar reglas ruidosas
  {
    files: [
      "src/**/__tests__/**/*.{ts,tsx}",
      "src/tests/**/*.{ts,tsx}",
      "src/**/__mocks__/**/*.{ts,tsx}",
    ],
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  // Legacy / z_trash
  {
    files: ["src/_deprecated/**/*.{ts,tsx}", "src/z_trash/**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tsPlugin, react: reactPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "react/prop-types": "off",
    },
  },
];
