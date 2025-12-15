import { ExportCollection }   from '../ExportCollection';

import { SortedFormat }       from '#data';

import { logger }             from '#util';

import type {
   ConfigSortFormat }         from '#types-command';

/**
 * Sorts a Scryfall card collection exporting spreadsheets by format legalities.
 *
 * @param config - Config options.
 */
export async function sortFormat(config: ConfigSortFormat): Promise<void>
{
   logger.info(`Sorting Scryfall card collection: ${config.input}`);
   logger.info(`Formats: ${config.formats.join(', ')}`);

   await ExportCollection.generate(config, SortedFormat.generate(config));

   logger.info(`Finished sorting Scryfall card collection: ${config.output}`);
}
