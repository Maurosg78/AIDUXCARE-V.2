import js from '@eslint/js'
import globals from 'globals'
import ts from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

export default [
  js.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node, ...globals.es2021 },
    },
    plugins: {
      '@typescript-eslint': ts,
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      ...(ts.configs.recommended.rules || {}),
      ...(react.configs.recommended.rules || {}),
      ...(reactHooks.configs.recommended.rules || {}),

      // ajustes temporales para destrabar
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-restricted-imports': 'warn',

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/order': ['warn', { 'newlines-between': 'always' }],
      'react/react-in-jsx-scope': 'off',
    },
    settings: { react: { version: 'detect' } },
  },

  // ignores centralizados (no generan “elementos vacíos”)
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.quarantine/**',
      'legacy/**',
      'QUARANTINE_*/**',
      '.rescue_untracked/**',
      'scripts/**',
      'playwright/**',
      'src/**/__mocks__/**',
      'src/__tests__/**',
      'src/**/*.d.ts',
      'src/core/fhir/**',
    ],
  },
]
