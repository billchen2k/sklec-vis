module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'google',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', '@typescript-eslint', 'import'],
  rules: {
    'require-jsdoc': 'warn',
    'max-len': 'warn',
    'no-unused-vars': 'warn',
    'spaced-comment': 'warn',
  },
  settings: {
    'import/resolver': {
      // Allow `@/` to map to `src/client/`
      alias: {
        map: [
          ['@', './src'],
          ['@dataset', './src/dataset'],
        ],
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    },
    'react': {
      version: 'detect',
    },
  },
  ignorePatterns: ['templates/**'],
};
