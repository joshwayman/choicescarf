import '../../ui/styles.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemePreference, readThemePreference } from '../../ui/theme.ts';
import { TokenSheet } from './TokenSheet.tsx';

applyThemePreference(readThemePreference());

const root = document.getElementById('root');
if (!root) {
  throw new Error('tokens.html is missing the #root element');
}

createRoot(root).render(
  <StrictMode>
    <TokenSheet />
  </StrictMode>,
);
