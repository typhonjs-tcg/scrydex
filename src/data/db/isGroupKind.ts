import type { CardDBMetadataGroups }   from '#types';

/**
 * Provides a type guard for {@link CardDBMetadataGroups} keys.
 *
 * @param value -
 */
export function isGroupKind(value: unknown): value is keyof CardDBMetadataGroups
{
   return value === 'decks' || value === 'external' || value === 'proxy';
}
