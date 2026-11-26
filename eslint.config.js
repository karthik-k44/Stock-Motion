import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import reactHooks from 'eslint-plugin-react-hooks';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';

export default tseslint.config(
  { ignores: ['dist', 'build', 'node_modules', '.data', '.vercel', 'test-results', 'playwright-report'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'e2e/**/*.ts', 'scripts/**/*.ts', '*.config.ts'],
    plugins: { 'import-x': importX },
    settings: {
      // Several projects on purpose (browser, server and tooling code get different libs).
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['tsconfig.app.json', 'tsconfig.node.json', 'tsconfig.tools.json'],
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-duplicates': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Arrow functions everywhere: `const Foo = () => …`, never `function Foo() {}` or `{ foo() {} }`.
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      // Also catches object methods (`{ Get() {} }`); class methods and constructors are allowed.
      'no-restricted-syntax': ['error', { selector: 'FunctionExpression:not(MethodDefinition > FunctionExpression)', message: 'Use an arrow function.' }],
    },
  },
  {
    files: ['src/frontend/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/backend/*', '**/backend/**'], message: 'The frontend may never import backend code.' }] },
      ],
    },
  },
  {
    files: ['src/backend/**/*.ts', 'e2e/**/*.ts', 'scripts/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
