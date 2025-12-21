/**
 * Scryfall / ISO language code to name.
 */
const langCodeToName: ReadonlyMap<string, string> = Object.freeze(new Map<string, string>([
   ['en', 'English'],
   ['es', 'Spanish'],
   ['fr', 'French'],
   ['de', 'German'],
   ['it', 'Italian'],
   ['ja', 'Japanese'],
   ['ko', 'Korean'],
   ['pt', 'Portuguese'],
   ['ru', 'Russian'],
   ['zhs', 'Simplified Chinese'],
   ['zht', 'Traditional Chinese'],

   // ~50 cards
   ['ph', 'Phyrexian'],

   // Very few cards each.
   ['ar', 'Arabic'],
   ['grc', 'Ancient Greek'],
   ['he', 'Hebrew'],
   ['la', 'Latin'],
   ['qya', 'Quenya'],
   ['sa', 'Sanskrit']
]));

export { langCodeToName };
