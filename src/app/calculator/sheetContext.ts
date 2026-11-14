import { createContext, useContext } from 'react';

/** Which tab of the Modifiers sheet: one of the Pokémon, or the field. */
export type SheetSectionId = 'target' | 'you' | 'field';

/** Opens the Calculator's one Modifiers sheet on a tab. Provided by the Calculator screen. */
export const ModifiersSheetContext = createContext<(section: SheetSectionId) => void>(() => undefined);

export function useOpenModifiers() {
  return useContext(ModifiersSheetContext);
}

/** The "+ Modifier" / "+ Field" chip for a tab, where focus lands if the chip that opened the sheet has gone. */
export function addChipId(section: SheetSectionId): string {
  return section === 'field' ? 'add-field' : `add-modifier-${section}`;
}
