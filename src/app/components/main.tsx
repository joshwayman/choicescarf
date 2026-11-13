import '../../ui/styles.ts';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyThemePreference, readThemePreference } from '../../ui/theme.ts';
import { ComponentsPage } from './ComponentsPage.tsx';

applyThemePreference(readThemePreference());

const root = document.getElementById('root');
if (!root) {
  throw new Error('components.html is missing the #root element');
}

createRoot(root).render(
  <StrictMode>
    <ComponentsPage />
  </StrictMode>,
);
