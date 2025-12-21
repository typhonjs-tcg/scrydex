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
   ['Russian', 'ru'],
   ['Chinese', 'zhs'],
   ['Simplified Chinese', 'zhs'],
   ['Traditional Chinese', 'zht'],

   // The following have few cards each...

   ['ph', 'ph'],  // Phyrexian - ~50 cards

   ['ar', 'ar'],
   ['grc', 'grc'],
   ['he', 'he'],
   ['la', 'la'],
   ['qya', 'qya'],
   ['sa', 'sa'],

   ['PH', 'ph'],  // Phyrexian

   ['AR', 'ar'],
   ['GRC', 'grc'],
   ['HE', 'he'],
   ['LA', 'la'],
   ['QYA', 'qya'],
   ['SA', 'sa'],

   ['Phyrexian', 'ph'],

   ['Arabic', 'ar'],
   ['Ancient Greek', 'grc'],
   ['Hebrew', 'he'],
   ['Latin', 'la'],
   ['Quenya', 'qya'],
   ['Sanskrit', 'sa']
]));

export { supportedLang };
