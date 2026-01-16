import { CSVCollection }   from '#scrydex/data/import';

import { ScryfallScanner } from './ScryfallScanner';

import type { ConfigCmd }  from '../../types-command';

/**
 * Converts the CSV collection output to compact Scryfall card data.
 *
 * @param config - Config options.
 */
export async function convertCsv(config: ConfigCmd.Convert): Promise<void>
{
   const collection = await CSVCollection.load(config);

   await ScryfallScanner.exportCollection(config, collection);
}
