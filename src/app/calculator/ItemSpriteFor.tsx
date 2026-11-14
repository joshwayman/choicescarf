import { itemIcon } from '../../data/index.ts';
import { ItemSprite } from '../../ui/index.ts';

/** An item's icon by engine modifier id ('choicescarf'), or nothing if it has none (#108). */
export function ItemSpriteFor({ id }: { id: string }) {
  const icon = itemIcon(id);
  return icon === undefined ? null : <ItemSprite icon={icon} />;
}
