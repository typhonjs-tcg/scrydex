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

/**
 * These set types are excluded from determining a cards recent rarity. Over time a card such as `Force of Will`
 * and `Demonic Tutor` have gone from `Uncommon` to `Rare` / `Mythic Rare`. Ignore these set types in determining
 * highest rarity for a card.
 */
const excludedSetTypesRecentRarity: ReadonlySet<string> = Object.freeze(new Set([
   'duel_deck',
   'from_the_vault',
   'memorabilia',
   'premium_deck',
   'promo',
   'sld',   // Secret Lair
   'spellbook',
   'starter'
]));

/**
 * These early sets are excluded from determining a cards recent rarity.
 */
const excludedSetsRecentRarity: ReadonlySet<string> = Object.freeze(new Set([
   'sum',   // Summer Magic
   'bchr',  // Chronicles Foreign Black Border
   'ced',   // Collector's Edition
   'cei',   // International Collector's Edition
   'fbb'    // Foreign Black Border
]));

export {
   excludedSetsRecentRarity,
   excludedSetTypesRecentRarity,
   supportedFormats,
   validLegality };
