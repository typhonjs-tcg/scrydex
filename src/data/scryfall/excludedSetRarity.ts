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
   '4bb',   // Fourth Edition Foreign Black Border
   'bchr',  // Chronicles Foreign Black Border
   'ced',   // Collector's Edition
   'cei',   // International Collector's Edition
   'fbb',   // Foreign Black Border
   'sum'    // Summer Magic
]));

export {
   excludedSetsRecentRarity,
   excludedSetTypesRecentRarity };
