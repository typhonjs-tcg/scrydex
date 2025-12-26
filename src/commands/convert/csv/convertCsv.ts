import { CSVCollection }   from '#data';

import { ScryfallDB }   from './ScryfallDB';

import type {
   ConfigConvert }      from '#types-command';

/**
 * Converts the CSV collection output to compact Scryfall card data.
 *
 * @param config - Config options.
 */
export async function convertCsv(config: ConfigConvert): Promise<void>
{
   const collection = await CSVCollection.load(config);

   await ScryfallDB.exportCollection(config, collection);
}
