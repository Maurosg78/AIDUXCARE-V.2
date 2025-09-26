import js from '@eslint/js';
import globals from 'globals';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': react,
      'react-hooks': reactHooks,
      'import': importPlugin,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': ['warn', { 'newlines-between': 'always' }],
      'react/react-in-jsx-scope': 'off',
      // Prohibir imports directos desde core/firebase
      'no-restricted-imports': ['error', {
        'patterns': [
          {
            'group': ['@/core/firebase/*', 'src/core/firebase/*', '**/core/firebase/*'],
            'message': 'Importa desde @/integrations/firebase en lugar de core/firebase directamente.'
          }
        ]
      }]
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.quarantine/**', 'legacy/**', 'QUARANTINE_*/**'],
  },
  {
    ignores: [
      ".rescue_untracked/**",
      "playwright-report/**",
      "test-results/**",
      "**/*.d.ts",
      "src/_deprecated/**",
      "scripts/**",
      "src/**/__tests__/**",
      "src/**/__mocks__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/components/**"
    ],
  }
];
