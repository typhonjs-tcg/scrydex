import fs                  from 'node:fs';
import zlib                from 'node:zlib';

import { isFileGzip }      from './isFileGzip';

import type { Readable }   from 'node:stream';

/**
 * Creates a readable stream for a file, transparently handling gzip decompression when required. By default, all
 * Scrydex DB files are gzip compressed and this utility function makes it easy to transparently open a compressed or
 * uncompressed file.
 *
 * The file is inspected using magic bytes and not the extension to determine whether gzip decompression should be
 * applied. The returned stream is always a Node `Readable` suitable for consumption by parsing pipelines.
 *
 * @param filepath - Input file path.
 *
 * @returns A readable stream yielding decompressed or raw file contents.
 *
 * @throws {Error} If the file cannot be opened or read.
 */
export function createReadableSource(filepath: string): Readable
{
   const isGzip = isFileGzip(filepath);

   const input = fs.createReadStream(filepath);

   return isGzip ? input.pipe(zlib.createGunzip()) : input;
}
