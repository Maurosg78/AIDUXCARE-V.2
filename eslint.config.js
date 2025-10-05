// Flat Config limpio
import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
export default [
  // Base JS
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      // ignora scripts problemáticos puntuales:
      'src/utils/fix-parser.js',
      'test-backend*.js',
      'test-backend*/**',
      'test-sistema*.js',
      'test-*.js'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.browser, ...globals.es2021 }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    , 'import': importPlugin},
    rules: {
      // Recomendadas JS
      ...js.configs.recommended.rules,
      // __AIDUX_RELAX_RULES__
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^(logger|_e|_error|_args|_patientId|_audioBlob|unused|_.*)$'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
      'no-unreachable': 'warn',
      'import/order': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': 'off'
    }
  },

  // Archivos .js como scripts Node (permitir require/console)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: { ...globals.node }
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off'
    }
  },

  // Tests: bajar ruido
  {
    files: ['test/**/*','tests/**/*','**/*.spec.*','**/*.test.*'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(.*)$' }],
      'no-console': 'off'
    }
  }
]
