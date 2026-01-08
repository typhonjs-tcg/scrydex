import type { CardDB }  from '#scrydex/data/db';

/**
 * Provides a type guard for {@link CardDB.File.MetadataGroups} keys.
 *
 * @param value -
 */
export function isGroupKind(value: unknown): value is keyof CardDB.File.MetadataGroups
{
   return value === 'decks' || value === 'external' || value === 'proxy';
}
