// Flat Config coherente (plugins registrados en cada bloque)
import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  // Bloque principal: TS/JS en modo módulo
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/**','dist/**','build/**','.next/**','coverage/**',
      // scripts que no queremos lint
      'src/utils/fix-parser.js','test-backend*.js','test-backend*/**',
      'test-sistema*.js','test-*.js'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.browser, ...globals.es2021 }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      // Reglas recomendadas de JS
      ...js.configs.recommended.rules,
      // Relajamos ruido
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

  // JS scripts en modo Node (require/console permitidos)
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: { ...globals.node }
    },
    plugins: {
      import: importPlugin
    },
    rules: {
      'no-undef': 'off',
      'no-console': 'off'
    }
  },

  // Tests: bajar ruido; registrar plugins aquí también
  {
    files: ['test/**/*','tests/**/*','**/*.spec.*','**/*.test.*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.node, ...globals.browser }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^(.*)$' }],
      'no-console': 'off'
    }
  }
]
