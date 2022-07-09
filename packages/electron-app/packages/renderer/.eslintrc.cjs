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
      rules: {
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/no-mutable-exports': 'off',
        'import/prefer-default-export': 'off',
        'import/extensions': 'off',
        'no-use-before-define': 'off',
      },
    },

    // Typescript files
    {
      files: ['*.ts'],
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
    },
  ],
};
