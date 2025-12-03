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

/**
 * These set types are excluded from determining a cards highest rarity. Over time a card such as `Force of Will`
 * and `Demonic Tutor` have gone from `Uncommon` to `Rare` / `Mythic Rare`. Ignore these set types in determining
 * highest rarity for a card.
 *
 * @type {Readonly<Set<string>>}
 */
const excludedSetTypesHighRarity = Object.freeze(new Set(['duel_deck',
   'from_the_vault',
   'premium_deck',
   'promo',
   'sld',   // Secret Lair
   'spellbook',
   'starter'
]))

export {
   excludedSetTypesHighRarity,
   supportedFormats,
   validLegality };
