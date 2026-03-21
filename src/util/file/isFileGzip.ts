import fs from 'node:fs';

/**
 * Determines whether a file is gzip-compressed by inspecting its magic bytes.
 *
 * Reads the first two bytes of the file and checks for the gzip signature (0x1f, 0x8b). This avoids relying on file
 * extensions and allows safe conditional decompression in stream pipelines.
 *
 * @param path - Absolute or relative file path to test.
 *
 * @returns `true` if the file appears to be gzip-compressed; otherwise `false`.
 *
 * @throws {Error} If the file cannot be opened or read.
 */
export function isFileGzip(path: string): boolean
{
   const fd = fs.openSync(path, 'r');
   const buf = Buffer.alloc(2);
   fs.readSync(fd, buf, 0, 2, 0);
   fs.closeSync(fd);

   return buf[0] === 0x1f && buf[1] === 0x8b;
}
