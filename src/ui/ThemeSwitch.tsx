import { SegmentedControl } from './SegmentedControl.tsx';
import { useTheme, type ThemePreference } from './theme.ts';

const OPTIONS: readonly { id: ThemePreference; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
];

function isPreference(value: string): value is ThemePreference {
  return OPTIONS.some((option) => option.id === value);
}

/** System / Dark / Light. Follows the system until a theme is picked, then remembers it. */
export function ThemeSwitch() {
  const { preference, setPreference } = useTheme();
  return (
    <SegmentedControl
      aria-label="Theme"
      options={OPTIONS}
      selectedKey={preference}
      onSelectionChange={(key) => {
        if (isPreference(key)) setPreference(key);
      }}
    />
  );
}
