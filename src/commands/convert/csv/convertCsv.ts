import { CSVCollection }   from '#scrydex/data/import';

import { ScryfallDB }      from './ScryfallDB';

import type { ConfigCmd }  from '#scrydex/commands';

/**
 * Converts the CSV collection output to compact Scryfall card data.
 *
 * @param config - Config options.
 */
export async function convertCsv(config: ConfigCmd.Convert): Promise<void>
{
   const collection = await CSVCollection.load(config);

   await ScryfallDB.exportCollection(config, collection);
}
