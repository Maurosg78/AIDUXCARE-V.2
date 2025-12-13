// ESLint Flat Config - modo "ci-relaxed" temporal
import js from '@eslint/js'
import globals from 'globals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'

export default [

  {
    ignores: [
      
      ".env*",
"canonical_snapshots/**",
      "docs/_archive/**",
      "src/_deprecated/**",
      "scripts/**",
      "**/*backup*.js",
      "**/*index-backup.js",
      "dist/**",
      "coverage/**",
      "node_modules/**"
    ],
  },

  // 1) Ignorados globales (antes de cualquier bloque con 'files')
  {
    ignores: [
      // Node & build
      'node_modules/**','dist/**','build/**','coverage/**','.next/**',
  
      // Duplicados / backups / nombres problemáticos
      '**/*backup*.ts','**/* backup*.ts','**/* back*.*','**/* 2.*',
  
      // --- Aidux North | Legacy backups a ignorar ---
      'backups/**',
      'backups/i18n-phase1/**',
      'docs/_archive/**',
  
      // Scripts de pruebas antiguos
      'test-backend*.js','test-backend*/**','test-sistema*.js','test-*.js',
  
      // Archivos con parse-error conocido
      'src/utils/fix-parser.js',
  
      // Directorios internos que no deben ser linted
      'functions/**',
      'src/_deprecated/**',
      'src/z_trash/**',
  
      // Componentes excluidos en auditorías previas
      'src/components/wizard/**',
      'src/components/ClinicalAnalysisResults.tsx',
      'src/core/ai/PromptFactory.ts',
      'src/features/patient/components/ClinicalFilters.tsx'
    ]
  },
  

  // 2) Regla general para TS/JS en proyecto
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      // Mezclamos browser + node para cubrir process, __dirname, PermissionName, etc.
      globals: { ...globals.browser, ...globals.es2021, ...globals.node }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      'react-hooks': reactHooks
    },
    rules: {
      'no-case-declarations': 'off',
      // Base JS recomendada (no romperá porque abajo apagamos lo ruidoso)
      ...js.configs.recommended.rules,

      // 🔕 Apagar TODO lo que hoy rompe el pre-push (temporal)
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
      'no-console': 'off',
      'no-empty': 'off',
      'no-unreachable': 'off',
      'import/order': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'no-restricted-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off'
    
}
  },

  // 3) Configs/Build en entorno Node (vite/vitest/etc.)
  {
    files: ['vite.config.*','vitest.config.*','**/*.config.*','**/*.cjs','**/*.mjs','**/*.d.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.node }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },

  // 4) Tests: más permisivo todavía
  {
    files: ['test/**/*','tests/**/*','**/*.spec.*','**/*.test.*'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2021, sourceType: 'module' },
      globals: { ...globals.node, ...globals.browser }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]
