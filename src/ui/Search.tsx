import { useEffect, useRef, type ReactNode } from 'react';
import {
  Autocomplete,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  SearchField,
  Text,
  useFilter,
  type Key,
} from 'react-aria-components';
import { SearchIcon } from './icons.tsx';
import { classes } from './classes.ts';
import styles from './Search.module.css';

export interface SearchResult {
  id: string;
  name: string;
  /** A number at the end of the row, such as base Speed. */
  value?: ReactNode;
  /** Says what the value is, read as the option's description: "base Speed 102". */
  valueLabel?: string;
  /** A decorative sprite before the name, when there are images. */
  icon?: ReactNode;
}

export interface SearchProps {
  /** Labels the input, such as "Search Pokémon". Visually hidden; the placeholder shows instead. */
  label: string;
  placeholder?: string;
  /** Names the list of results. */
  resultsLabel?: string;
  items: readonly SearchResult[];
  /** Called when a result is chosen, with a click, a tap or Enter. */
  onSelect: (id: string) => void;
  /** The search text, if the caller wants to control it. */
  inputValue?: string;
  onInputChange?: (value: string) => void;
  /** Shown when nothing matches. */
  emptyMessage?: string;
  /**
   * The caller has already filtered `items` for the text (with its own, more
   * forgiving search), so the list shows them as they are. Needs `inputValue`.
   */
  prefiltered?: boolean;
  /** Move focus to the box when it appears, such as when its sheet opens. */
  focusOnMount?: boolean;
}

/**
 * A search box with its results listed underneath (the picker's search).
 * Typing filters the results; the arrow keys move through them while focus
 * stays in the box, and Enter picks the highlighted one.
 */
export function Search({
  label,
  placeholder,
  resultsLabel = 'Results',
  items,
  onSelect,
  inputValue,
  onInputChange,
  emptyMessage = 'No matches',
  prefiltered = false,
  focusOnMount = false,
}: SearchProps) {
  const { contains } = useFilter({ sensitivity: 'base' });
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (focusOnMount) inputRef.current?.focus();
  }, [focusOnMount]);
  const controlled = inputValue !== undefined ? { inputValue, onInputChange: onInputChange ?? (() => undefined) } : {};
  return (
    <div className={classes(styles.search)}>
      <Autocomplete filter={prefiltered ? () => true : contains} {...controlled}>
        <SearchField className={classes(styles.field)}>
          <Label className={classes(styles.hiddenLabel)}>{label}</Label>
          <span aria-hidden="true" className={classes(styles.icon)}>
            <SearchIcon size={20} />
          </span>
          <Input ref={inputRef} {...(placeholder === undefined ? {} : { placeholder })} className={classes(styles.input)} />
        </SearchField>
        <ListBox
          aria-label={resultsLabel}
          items={items}
          onAction={(key: Key) => {
            onSelect(String(key));
          }}
          renderEmptyState={() => <p className={classes(styles.empty)}>{emptyMessage}</p>}
          className={classes(styles.list)}
        >
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.name} className={classes(styles.option)}>
              {/* The label slot names the option by exactly the visible text ("Garchomp 102"). */}
              <Text slot="label" className={classes(styles.label)}>
                <span className={classes(styles.name)}>
                  {item.icon ? <span className={classes(styles.sprite)}>{item.icon}</span> : null}
                  {item.name}
                </span>{' '}
                {item.value !== undefined ? <span className={classes(styles.value)}>{item.value}</span> : null}
              </Text>
              {item.valueLabel ? (
                <Text slot="description" className={classes(styles.hiddenLabel)}>
                  {item.valueLabel}
                </Text>
              ) : null}
            </ListBoxItem>
          )}
        </ListBox>
      </Autocomplete>
    </div>
  );
}
