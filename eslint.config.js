const js = require('@eslint/js');
const typescript = require('typescript-eslint');
const prettier = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');
const UnusedConfig = require('eslint-config-prettier');

module.exports = typescript.config(
  {
    ignores: ['node_modules', 'dist', 'build', '.next', 'out', 'coverage', '.cache'],
  },
  js.configs.recommended,
  ...typescript.configs.recommended,
  {
    plugins: {
      prettier,
      import: importPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'next',
              group: 'external',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['react', 'next'],
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  UnusedConfig
);
