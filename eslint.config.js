// .eslintrc.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // disable the “display name” warning globally
      'react/display-name': 'off',
    },
  },
]);
