import base from './eslint.config.js';

export default [
  ...base,

  // Ignorar legacy/duplicados/backups
  {
    ignores: [
      'src/_deprecated/**',
      '**/*.backup.{ts,tsx}',
      '**/*backup*.{ts,tsx}',
      'src/**/* *.{ts,tsx}',        // archivos con espacio en el nombre (p.ej. "SessionContext 3.tsx")
      'src/**/* [0-9].{ts,tsx}'     // duplicados " 2.tsx", " 3.tsx", etc.
    ]
  },

  // Relajar reglas globales (temporal)
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-restricted-imports': 'warn',
      'no-redeclare': 'warn',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off'
    }
  },

  // Permitir console.* en todo src durante dev
  {
    files: ['src/**'],
    rules: { 'no-console': 'off' }
  }
];
