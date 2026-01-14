import fs            from 'node:fs';
import path          from 'node:path';
import zlib          from 'node:zlib';
import { pipeline }  from 'node:stream/promises';
import { Transform } from 'node:stream';

import type { BasicLogger } from '@typhonjs-utils/logger-color';

export async function scryfallDownload(config: { output?: string, logger?: BasicLogger }): Promise<void>
{
   // TODO: API request to retrieve bulk metadata. This is a hardcoded test.
   return download('https://data.scryfall.io/default-cards/default-cards-20260114101112.json',
    './db-test/scryfall-default.json.gz', { logger: config.logger });

   // return download('https://data.scryfall.io/all-cards/all-cards-20260114102556.json',
   //  './db-test/scryfall-all.json.gz', { logger: config.logger });

   // return download('https://data.scryfall.io/oracle-cards/oracle-cards-20260114100427.json',
   //  './db-test/scryfall-oracle.json.gz', { logger: config.logger });
}

export async function download(url: string, outputPath: string, { compress = true, logger }:
 { compress?: boolean, logger?: BasicLogger } = {}): Promise<void>
{
   const res = await fetch(url);

   if (!res.ok || !res.body)
   {
      throw new Error(`Failed to download: ${res.status} ${res.statusText}`);
   }

   // Ensure output directory exists.
   fs.mkdirSync(path.dirname(outputPath), { recursive: true });

   let bytes = 0;

   const progress = new Transform({
      transform(chunk, _, cb)
      {
         bytes += chunk.length;
         if (bytes % (50 * 1024 * 1024) < chunk.length)
         {
            logger.info(`Downloaded ${Math.round(bytes / 1024 / 1024)} MB`);
         }
         cb(null, chunk);
      }
   });

   if (compress)
   {
      await pipeline(
         res.body,
         progress,
         zlib.createGzip({ level: 9 }),
         fs.createWriteStream(outputPath)
      );
   }
   else
   {
      await pipeline(
         res.body,
         progress,
         fs.createWriteStream(outputPath)
      );
   }
}
