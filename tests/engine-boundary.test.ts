import { ESLint } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

/**
 * Checks that the lint rule in eslint.config.js keeps src/engine free of React
 * and of the rest of the app. The code is linted in memory as if it were a
 * file in each folder; type-aware rules are switched off because the file
 * does not exist on disk.
 */
const eslint = new ESLint({
  overrideConfig: [{ files: ['**/*.{ts,tsx}'], ...tseslint.configs.disableTypeChecked }],
});

async function restrictedImportErrors(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .filter((message) => message.ruleId === 'no-restricted-imports')
    .map((message) => message.message);
}

describe('src/engine import boundary', () => {
  it.each([
    "import { useState } from 'react';",
    "import { createRoot } from 'react-dom/client';",
    "import type { ReactNode } from 'react';",
    "import { jsx } from 'react/jsx-runtime';",
    "import { App } from '../app/App.tsx';",
    "import { Chip } from '../ui/Chip.tsx';",
    "import species from '../data/gen9.json';",
    "import { thing } from '../../src/ui';",
    "import { Chip } from '../../src/ui/Chip.tsx';",
    "export { App } from '../app/App.tsx';",
  ])('fails lint for: %s', async (line) => {
    const errors = await restrictedImportErrors(`${line}\nexport {};\n`, 'src/engine/example.ts');
    expect(errors).toHaveLength(1);
  });

  it('allows imports inside the engine', async () => {
    const errors = await restrictedImportErrors(
      "import { RULESETS } from './index.ts';\nimport { x } from './data-tables.ts';\nexport { RULESETS, x };\n",
      'src/engine/example.ts',
    );
    expect(errors).toEqual([]);
  });

  it('allows the app to import React and the engine', async () => {
    const errors = await restrictedImportErrors(
      "import { useState } from 'react';\nimport { RULESETS } from '../engine/index.ts';\nexport { useState, RULESETS };\n",
      'src/app/example.tsx',
    );
    expect(errors).toEqual([]);
  });
});
