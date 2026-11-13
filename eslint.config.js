// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

/**
 * src/engine is the speed engine: pure TypeScript that runs anywhere.
 * It may not import React or anything from the app, the UI or the data build.
 * (Browser APIs are kept out by tsconfig.engine.json, which has no DOM types.)
 */
const engineBoundary = {
  files: ['src/engine/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          { name: 'react', message: 'src/engine must not depend on React.' },
          { name: 'react-dom', message: 'src/engine must not depend on React.' },
        ],
        patterns: [
          {
            group: ['react/*', 'react-dom/*', '@testing-library/*'],
            message: 'src/engine must not depend on React.',
          },
          {
            // Relative imports that climb out of src/engine and reach another
            // folder, however they get there ('../ui', '../../src/ui/Chip.tsx').
            // So don't name a folder inside src/engine app, ui or data.
            regex: String.raw`^(\.\./)+(.*/)?(app|ui|data)(/|$)`,
            message: 'src/engine must not import from src/app, src/ui or src/data.',
          },
        ],
      },
    ],
  },
};

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'node_modules'],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    ...react.configs.flat.recommended,
    ...react.configs.flat['jsx-runtime'],
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    ...jsxA11y.flatConfigs.recommended,
  },
  engineBoundary,
  {
    files: ['*.config.{js,ts}', 'tests/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Plain JavaScript (this file) is not part of a TypeScript project.
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
