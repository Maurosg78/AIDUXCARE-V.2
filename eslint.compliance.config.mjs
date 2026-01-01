export default [
  {
    ignorePatterns: ['dist/**', 'node_modules/**'],
    rules: {
      'no-console': 'error',  // HIPAA compliance
      '@typescript-eslint/no-explicit-any': 'error',  // Type safety
      '@typescript-eslint/no-unused-vars': 'error',
      'no-debugger': 'error',
      'no-alert': 'error'
    }
  }
];
