module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'script'
  },
  extends: ['eslint:recommended'],
  rules: {},
  globals: {
    fetch: 'readonly',
    console: 'readonly',
    require: 'readonly',
    module: 'readonly',
    exports: 'readonly'
  }
};
