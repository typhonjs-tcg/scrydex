import { GameFormats } from '#types';

/**
 * Provides a type guard for testing game format support.
 *
 * @param format - Game format to test.
 */
function isSupportedFormat(format: string | undefined): format is GameFormats
{
   return typeof format === 'string' && supportedFormats.has(format);
}

/**
 * Supported Scryfall formats for legality checks.
 */
const supportedFormats: ReadonlySet<string> = Object.freeze(new Set(['standard', 'future', 'historic', 'timeless',
 'gladiator', 'pioneer', 'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander', 'oathbreaker', 'standardbrawl',
  'brawl', 'alchemy', 'paupercommander', 'duel', 'oldschool', 'premodern', 'predh']));

/**
 * Legality values for a valid card in a given format.
 */
const validLegality: ReadonlySet<string> = Object.freeze(new Set(['legal', 'restricted']));

export {
   isSupportedFormat,
   supportedFormats,
   validLegality };
