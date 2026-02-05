import { once }            from 'node:events';
import fs                  from 'node:fs';
import { pipeline }        from 'node:stream/promises';
import { Transform }       from 'node:stream';

import { isFile }          from '@typhonjs-utils/file-util';

import { VERSION }         from '#scrydex';
import { createWritable }  from "#scrydex/util";

import { ScryfallDB }      from './ScryfallDB';

import type { ReadableStream }   from 'node:stream/web';
import type { BasicLogger }      from '@typhonjs-utils/logger-color';

const s_USER_AGENT = `Scrydex/${VERSION.package} (https://github.com/typhonjs-tcg/scrydex)`;

/**
 * Provides a mechanism to download the target Scryfall card DB after checking existing local instances are older.
 * This is accomplished by fetching the bulk data object for the target DB and comparing against the metadata stored in
 * any local DBs.
 *
 * The Scrydex / ScryfallDB data is compressed on download stored in `dirpath` relative to the current working
 * directory or an absolute path if provided. `dirpath` should not end with a path separator character.
 *
 * @param config - Download configuration.
 */
export async function scryfallDownload(config:
 { dbType: ScryfallDB.File.DBType, dirpath: string, force: boolean, logger?: BasicLogger }): Promise<void>
{
   if (isFile(config.dirpath)) { throw new Error(`'dirpath' is an existing file.`); }

   if (config.dbType !== 'all_cards' && config.dbType !== 'default_cards')
   {
      throw new Error(`'dbType' is not a valid DB type.`);
   }

   const logger = config.logger;

   logger?.info(`Fetching latest remote Scryfall (${config.dbType}) metadata.`);

   const sourceMetadata = await fetchMetadata(config.dbType);

   let update = true;

   if (!config.force)
   {
      update = await checkCache(sourceMetadata, config.dirpath, logger);
   }
   else
   {
      logger?.info(`Automatic download of ScryfallDB initiated as 'force' option is enabled.`);
   }

   if (update) { await download(sourceMetadata, config); }
}

/**
 * Verifies the fetched Scryfall bulk data object / `sourceMeta` date against any stored local ScryfallDB.
 *
 * @param dirpath - Target directory for Scryfall DB.
 *
 * @param sourceMeta - Recently fetched build data object.
 *
 * @param logger - Logger instance.
 *
 * @returns Whether an update / re-download is necessary.
 */
async function checkCache(sourceMeta: ScryfallDB.Meta.ScryfallBulkData, dirpath: string,  logger?: BasicLogger):
 Promise<boolean>
{
   logger?.verbose(`Checking cached DB date.`);

   const filepath = `${dirpath}/scryfall_${sourceMeta.type}.json.gz`;

   if (!isFile(filepath))
   {
      logger?.verbose(`Existing ScryfallDB does not exist: ${filepath}`);
      return true;
   }

   logger?.debug(`Newly fetched sourceMeta:\n${JSON.stringify(sourceMeta, null, 2)}`);

   try
   {
      const scryStream = await ScryfallDB.load({ filepath });

      logger?.verbose(`Remote sourceMeta date: ${scryStream.sourceMeta.updated_at}`);
      logger?.verbose(`Existing sourceMeta date: ${sourceMeta.updated_at}`);

      const existingDate = new Date(scryStream.sourceMeta.updated_at);
      const sourceDate = new Date(sourceMeta.updated_at);

      if (existingDate < sourceDate)
      {
         logger?.verbose(`Existing DB is older.`);
      }
      else
      {
         logger?.info(`Existing ScryfallDB is up to date: ${filepath}`);
         return false;
      }
   }
   catch { /**/ }

   return true;
}

/**
 * Downloads and compresses the target Scryfall DB.
 *
 * @param sourceMeta - Fetched bulk data object for target DB.
 *
 * @param config - CLI config.
 */
async function download(sourceMeta: ScryfallDB.Meta.ScryfallBulkData,
 config: { dbType: ScryfallDB.File.DBType, dirpath: string, logger?: BasicLogger }): Promise<void>
{
   const res = await fetch(sourceMeta.download_uri, {
      headers: { 'User-Agent': s_USER_AGENT, Accept: 'application/json' }
   });

   if (!res.ok || !res.body) { throw new Error(`Failed to download Scryfall DB: ${res.status} ${res.statusText}`); }

   // Ensure output directory exists.
   fs.mkdirSync(config.dirpath, { recursive: true });

   const filepath = `${config.dirpath}/scryfall_${sourceMeta.type}.json.gz`;

   const logger = config.logger;

   logger?.info(`Downloading and compressing Scryfall DB (${config.dbType}) to: ${filepath}`);
   logger?.info(`Total network bandwidth: ${(sourceMeta.size / 1024 / 1024).toFixed(2)} MB`);

   let bytes = 0;

   let dlPercent = '0';

   /**
    * Transform logging download progress.
    */
   const progress = new Transform({
      transform(chunk, _, cb)
      {
         bytes += chunk.length;
         if (bytes % (10 * 1024 * 1024) < chunk.length)
         {
            dlPercent = ((bytes / sourceMeta.size) * 100).toFixed(1);

            logger?.info(`Downloaded ${Math.round(bytes / 1024 / 1024)} MB (${dlPercent}%)`);
         }
         cb(null, chunk);
      }
   });

   const body = res.body as ReadableStream<Uint8Array>;

   const out = createWritable({ filepath, compress: true });

   const meta: ScryfallDB.Meta.Scrydex = {
      type: 'scryfall-db-cards',
      cliVersion: VERSION.package,
      generatedAt: new Date().toISOString()
   };

   const header = `{"meta":${JSON.stringify(meta)},"sourceMeta":${JSON.stringify(sourceMeta)},"cards":`;

   out.write(header);

   await pipeline(
      body,
      progress,
      new Transform({
         transform(chunk, _, cb)
         {
            out.write(chunk);
            cb();
         }
      })
   );

   // Close object.
   out.write('}');
   out.end();

   if (dlPercent !== '100.0')
   {
      logger?.info(`Downloaded ${Math.round(sourceMeta.size / 1024 / 1024)} MB (100.0%)`);
   }

   await once(out, 'finish');

   const { size } = fs.statSync(filepath);

   logger?.info(`Final compressed file size ${Math.round(size / 1024 / 1024)} MB.`);
}

/**
 * Fetches the bulk data object for the target Scryfall card DB.
 *
 * @param dbType - The DB type.
 *
 * @returns ScryfallBulkData
 */
async function fetchMetadata(dbType: ScryfallDB.File.DBType): Promise<ScryfallDB.Meta.ScryfallBulkData>
{
   const url = `https://api.scryfall.com/bulk-data/${dbType}`;

   const res = await fetch(url, { headers: { 'User-Agent': s_USER_AGENT, Accept: 'application/json' } });

   if (!res.ok)
   {
      throw new Error(`Failed to retrieve Scryfall DB metadata: ${res.status} ${res.statusText}`);
   }

   const result: ScryfallDB.Meta.ScryfallBulkData = await res.json();

   if (result?.object !== 'bulk_data' || typeof result?.download_uri !== 'string' || !Number.isInteger(result?.size) ||
    typeof result?.updated_at !== 'string')
   {
      throw new Error(`Received unknown response retrieving Scryfall DB metadata.`);
   }

   return result;
}
