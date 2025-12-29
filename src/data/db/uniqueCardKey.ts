import type { Card } from '#types';

/**
 * Creates a unique composite key coalescing the <Scryfall ID>:<Foil / Finish>:<Language>.
 *
 * @privateRemarks
 * As things go the Scryfall ID is _mostly_ unique, but the foil / finish status is separate of the Scryfall ID.
 * Language is also a flexible field with many online collection services allowing free user selection of the cards
 * potential language.
 *
 * @param card -
 *
 * @returns Unique card key.
 */
export function uniqueCardKey(card: Card)
{
   return `${card.scryfall_id}:${card.foil ?? 'normal'}:${card.lang_csv ?? card.lang}`;
}
