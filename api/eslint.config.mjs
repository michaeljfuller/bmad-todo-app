import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/**',
      'eslint.config.mjs',
      'migrations/**/*.sql',
      'migrations/meta/**',
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]
