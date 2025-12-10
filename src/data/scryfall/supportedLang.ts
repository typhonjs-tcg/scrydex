/**
 * Map to normalize language code.
 */
const supportedLang: ReadonlyMap<string, string> = Object.freeze(new Map<string, string>([
   ['en', 'en'],
   ['es', 'es'],
   ['fr', 'fr'],
   ['de', 'de'],
   ['it', 'it'],
   ['ja', 'ja'],
   ['ko', 'ko'],
   ['ph', 'ph'],  // Phyrexian
   ['pt', 'pt'],
   ['ru', 'ru'],
   ['zhs', 'zhs'],
   ['zht', 'zht'],

   ['EN', 'en'],
   ['ES', 'es'],
   ['FR', 'fr'],
   ['DE', 'de'],
   ['IT', 'it'],
   ['JA', 'ja'],
   ['KO', 'ko'],
   ['PH', 'ph'],  // Phyrexian
   ['PT', 'pt'],
   ['RU', 'ru'],
   ['ZHS', 'zhs'],
   ['ZHT', 'zht'],

   ['English', 'en'],
   ['Spanish', 'es'],
   ['French', 'fr'],
   ['German', 'de'],
   ['Italian', 'it'],
   ['Japanese', 'ja'],
   ['Korean', 'ko'],
   ['Portuguese', 'pt'],
   ['Phyrexian', 'ph'],
   ['Russian', 'ru'],
   ['Chinese', 'zhs'],
   ['Traditional Chinese', 'zht']
]));

export { supportedLang };
