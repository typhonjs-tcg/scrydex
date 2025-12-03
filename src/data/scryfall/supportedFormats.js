/**
 * Supported Scryfall formats for legality checks.
 *
 * @type {ReadonlySet<string>}
 */
const supportedFormats = Object.freeze(new Set(['standard', 'future', 'historic', 'timeless', 'gladiator', 'pioneer',
 'modern', 'legacy', 'pauper', 'vintage', 'penny', 'commander', 'oathbreaker', 'standardbrawl', 'brawl', 'alchemy',
  'paupercommander', 'duel', 'oldschool', 'premodern', 'predh']));

/**
 * Legality values for a valid card in a given format.
 *
 * @type {ReadonlySet<string>}
 */
const validLegality = Object.freeze(new Set(['legal', 'restricted']));

export {
   supportedFormats,
   validLegality };
