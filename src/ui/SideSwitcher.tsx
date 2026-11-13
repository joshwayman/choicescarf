import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs, type Key } from 'react-aria-components';
import { classes } from './classes.ts';
import styles from './SideSwitcher.module.css';

export interface Side {
  id: string;
  /** The small label: "Target" or "You". */
  role: string;
  /** The Pokémon's name. */
  name: string;
  /** Its Speed, shown beside the role. */
  speed?: number;
  /** A decorative sprite before the text, when there are images. */
  icon?: ReactNode;
}

export interface SideSwitcherProps {
  /** Names the tab list, such as "Which Pokémon to edit". */
  'aria-label': string;
  sides: readonly Side[];
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  /** The panel for a side. Only the selected side's panel is rendered. */
  children: (side: Side) => ReactNode;
}

/**
 * The Target / You switcher: two tabs, each showing a Pokémon and its
 * Speed, over the panel for the selected one. Arrow keys move between tabs.
 */
export function SideSwitcher({ sides, selectedKey, onSelectionChange, children, ...props }: SideSwitcherProps) {
  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={(key: Key) => {
        onSelectionChange(String(key));
      }}
      className={classes(styles.tabs)}
    >
      <TabList aria-label={props['aria-label']} items={sides} className={classes(styles.list)}>
        {(side) => (
          <Tab id={side.id} className={classes(styles.tab)}>
            {side.icon ? <span className={classes(styles.icon)}>{side.icon}</span> : null}
            {/* Read as "Target Garchomp 333": role, name, then Speed, which CSS moves up beside the role. */}
            <span className={classes(styles.text)}>
              <span className={classes(styles.role)}>{side.role}</span>{' '}
              <span className={classes(styles.name)}>{side.name}</span>
              {side.speed !== undefined ? (
                <>
                  {' '}
                  <span className={classes(styles.speed)}>{side.speed}</span>
                </>
              ) : null}
            </span>
          </Tab>
        )}
      </TabList>
      {sides.map((side) => (
        <TabPanel key={side.id} id={side.id} className={classes(styles.panel)}>
          {children(side)}
        </TabPanel>
      ))}
    </Tabs>
  );
}
