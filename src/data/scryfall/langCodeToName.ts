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
   ['ph', 'Phyrexian'],
   ['pt', 'Portuguese'],
   ['ru', 'Russian'],
   ['zhs', 'Chinese'],
   ['zht', 'Traditional Chinese']
]));

export { langCodeToName };
