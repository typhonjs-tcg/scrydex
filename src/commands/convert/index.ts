import { Collection }   from '#data';

import { ScryfallDB }   from './ScryfallDB';

import type {
   ConfigConvert }      from '#types-command';

/**
 * Converts the CSV collection output to compact Scryfall card data.
 *
 * @param config - Config options.
 */
export async function convert(config: ConfigConvert): Promise<void>
{
   const collection = await Collection.load(config.input);

   await ScryfallDB.exportCollection(config, collection);
}

