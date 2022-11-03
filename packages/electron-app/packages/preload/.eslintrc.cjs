const { resolve } = require('path');

module.exports = {
  overrides: [
    // Typescript files
    {
      files: ['*.ts'],
      parserOptions: {
        project: resolve(__dirname, './tsconfig.json'),
      },
    },
  ],
};
