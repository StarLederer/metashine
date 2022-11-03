const { resolve } = require('path');

module.exports = {
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
};
