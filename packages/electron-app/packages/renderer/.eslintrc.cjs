const { resolve } = require('path');

module.exports = {
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
        project: resolve(__dirname, './tsconfig.json'),
      },
    },
  ],

  rules: {
    'import/no-mutable-exports': 'off',
    'import/extensions': 'off',
  },
};
