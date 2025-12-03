import { Collection }   from '#data';

import { ScryfallDB }   from './ScryfallDB.js';

/**
 * Converts the CSV collection output to compact Scryfall card data.
 *
 * @param {import('#types-command').ConfigConvert}   config - Config options.
 *
 * @returns {Promise<void>}
 */
export async function convert(config)
{
   const collection = await Collection.load(config.input);

   await ScryfallDB.exportCollection(config, collection);
}

