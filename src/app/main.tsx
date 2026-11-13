import '../ui/styles.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemePreference, readThemePreference } from '../ui/theme.ts';
import { App } from './App.tsx';

applyThemePreference(readThemePreference());

const root = document.getElementById('root');
if (!root) {
  throw new Error('index.html is missing the #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
