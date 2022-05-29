const baseConfig = require('../../.eslintrc.cjs');

module.exports = {
  ...baseConfig,

  plugins: ['svelte3'],

  settings: {
    'svelte3/typescript': true,
    'import/resolver': {
      node: {
        extensions: ['.ts'],
      },
    },
  },

  overrides: [
    // Svelte files
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
    },

    // Typescript files
    {
      files: ['*.ts'],
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  ],

  rules: {
    ...baseConfig.rules,
    'import/no-mutable-exports': 'off',
    'import/extensions': 'off',
  },
};
