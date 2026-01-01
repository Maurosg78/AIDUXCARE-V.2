module.exports = {
  extends: [
    '@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  ignorePatterns: [
    '_deprecated/**',
    '**/*.backup.*',
    '**/*.test.*',
    'dist/**',
    'node_modules/**'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',  // era error
    'no-console': 'warn',                          // era error  
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'react-hooks/exhaustive-deps': 'warn'
  }
};
