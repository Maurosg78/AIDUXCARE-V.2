module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'jsx-a11y'
  ],
  rules: {
    'jsx-a11y/aria-proptypes': 'off',
    'jsx-a11y/aria-role': 'off',
    'jsx-a11y/role-has-required-aria-props': 'off',
    'jsx-a11y/role-supports-aria-props': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
}; 