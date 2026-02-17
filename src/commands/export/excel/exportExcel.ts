import fs                  from 'node:fs';
import path                from 'node:path';

import { CardDB }          from '#scrydex/data/db';
import { ExportExcel }     from '#scrydex/data/export';

import type { ConfigCmd }  from '../../types-command';

/**
 * Exports a single Scrydex CardDB to an Excel spreadsheet.
 *
 * @param config - Config options.
 */
export async function exportExcel(config: ConfigCmd.ExportSpreadsheet): Promise<void>
{
   const logger = config.logger;

   if (typeof config.output !== 'string') { throw new TypeError(`'output' is not a string.`); }

   if (!config.output.endsWith('xlsx')) { throw new Error(`'output' file name must have 'xlsx' file extension.`); }

   logger?.verbose(`Loading file path: ${config.path}`);

   const db = await CardDB.load({ filepath: config.path });

   logger?.info(`Export output target file: ${config.output}`);

   const workbook = await ExportExcel.cardDB({
      db,
      columns: config.columns,
      sort: config.sort,
      theme: config.theme
   });

   const dirpath = path.dirname(config.output);

   // Create directory if base path does not exist.
   if (!fs.existsSync(dirpath)) { fs.mkdirSync(dirpath, { recursive: true }); }

   await workbook?.xlsx.writeFile(config.output);
}
