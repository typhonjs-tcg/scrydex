import fs                  from 'node:fs';
import path                from 'node:path';
import zlib                from 'node:zlib';

import { isDirectory }     from '@typhonjs-utils/file-util';

import type { Writable }   from 'node:stream';

/**
 * Creates a writable output stream to a file, transparently handling gzip compression. By default, all
 * Scrydex DB files are not compressed, but when compression is enabled this utility function makes it easy to
 * transparently write a compressed or uncompressed file.
 *
 * @param options - Options.
 *
 * @param options.filepath - Output file path.
 *
 * @param [options.compress] - When true, gzip compression is enabled.
 *
 * @returns A writable stream with optional gzip compression.
 *
 * @throws {Error} If the filepath is already an existing directory.
 */
export function createWritable({ filepath, compress }: { filepath: string, compress?: boolean }): Writable
{
   if (isDirectory(filepath)) { throw new Error(`'filepath' is an existing directory.`); }

   const dir = path.dirname(filepath);

   // Create directory if base path does not exist.
   if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

   const out = fs.createWriteStream(filepath);

   const sink = compress ? zlib.createGzip({ level: 9 }) : out;

   if (compress) { sink.pipe(out); }

   return sink;
}
