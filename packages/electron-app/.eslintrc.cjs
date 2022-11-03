const { resolve } = require('path');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },

  env: {
    es6: true,
    browser: true,
  },

  extends: ['airbnb-base'],

  settings: {
    'import/core-modules': ['electron', 'svelte'],
  },

  overrides: [
    // Typescript files
    {
      files: ['*.ts'],
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
      extends: [
        'airbnb-typescript/base',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
    },
  ],

  rules: {
    'no-plusplus': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
  },

  ignorePatterns: ['node_modules/**', '**/dist/**'],
};
