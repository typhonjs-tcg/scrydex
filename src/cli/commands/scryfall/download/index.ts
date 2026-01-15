import fs            from 'node:fs';
import zlib          from 'node:zlib';
import { pipeline }  from 'node:stream/promises';
import { Transform } from 'node:stream';

import { VERSION }   from '#scrydex';

import type { ReadableStream }   from 'node:stream/web';
import type { BasicLogger }      from '@typhonjs-utils/logger-color';

import type { ScryfallDB }       from '#scrydex/data/scryfall';

const s_USER_AGENT = `Scrydex/${VERSION.package} (https://github.com/typhonjs-tcg/scrydex)`;

/**
 * Provides the `scryfall-download` CLI command to download the target Scryfall card DB after checking existing local
 * instances are older. This is accomplished by fetching the bulk data object for the target DB and comparing against
 * the metadata stored in any local DBs.
 *
 * The Scrydex / ScryfallDB data is compressed on download and always stored in `./db` relative to the current working
 * directory.
 *
 * @param config - CLI config.
 */
export async function scryfallDownload(config: { dbType: string, force: boolean, logger: BasicLogger }):
 Promise<void>
{
   const sourceMetadata = await fetchMetadata(config.dbType);

   let update = true;

   if (!config.force) { update = await checkCache(sourceMetadata); }

   if (update) { await download(sourceMetadata, config); }
}

// TODO: IMPLEMENT
async function checkCache(sourceMetadata: ScryfallDB.Meta.ScryfallBulkData): Promise<boolean>
{
   console.log(`!!! checkCache - metadata:\n${JSON.stringify(sourceMetadata, null, 2)}`);

   return true;
}

/**
 * Downloads and compresses the target Scryfall DB.
 *
 * @param sourceMeta - Fetched bulk data object for target DB.
 *
 * @param config - CLI config.
 */
async function download(sourceMeta: ScryfallDB.Meta.ScryfallBulkData, config:
 { dbType: string, logger: BasicLogger }): Promise<void>
{
   const res = await fetch(sourceMeta.download_uri, {
      headers: { 'User-Agent': s_USER_AGENT, Accept: 'application/json' }
   });

   if (!res.ok || !res.body) { throw new Error(`Failed to download Scryfall DB: ${res.status} ${res.statusText}`); }

   // Ensure output directory exists.
   fs.mkdirSync('./db', { recursive: true });

   const outputPath = `./db/scryfall_${sourceMeta.type}.json.gz`;

   const logger = config.logger;

   logger.info(`Downloading Scryfall DB (${config.dbType}) to: ${outputPath}`);
   logger.info(`Total network bandwidth: ${(sourceMeta.size / 1024 / 1024).toFixed(2)} MB`);

   let bytes = 0;

   /**
    * Transform logging download progress.
    */
   const progress = new Transform({
      transform(chunk, _, cb)
      {
         bytes += chunk.length;
         if (bytes % (10 * 1024 * 1024) < chunk.length)
         {
            logger?.info(`Downloaded ${Math.round(bytes / 1024 / 1024)} MB (${
             ((bytes / sourceMeta.size) * 100).toFixed(1)}%)`);
         }
         cb(null, chunk);
      }
   });

   const body = res.body as ReadableStream<Uint8Array>;

   const gzip = zlib.createGzip({ level: 9 });
   const out = fs.createWriteStream(outputPath);

   gzip.pipe(out);

   const meta: ScryfallDB.Meta.Scrydex = {
      type: 'scryfall-db-cards',
      cliVersion: VERSION.package,
      generatedAt: new Date().toISOString()
   };

   const header = `{"meta":${JSON.stringify(meta)},"sourceMeta":${JSON.stringify(sourceMeta)},"cards":`;

   gzip.write(header);

   await pipeline(
      body,
      progress,
      new Transform({
         transform(chunk, _, cb)
         {
            gzip.write(chunk);
            cb();
         }
      })
   );

   // Close object.
   gzip.write('}');
   gzip.end();

   logger?.info(`Downloaded ${Math.round(sourceMeta.size / 1024 / 1024)} MB (100%)`);
}

/**
 * Fetches the bulk data object for the target Scryfall card DB.
 *
 * @param dbType - The DB type.
 *
 * @returns ScryfallBulkData
 */
async function fetchMetadata(dbType: string): Promise<ScryfallDB.Meta.ScryfallBulkData>
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
