import path from 'node:path';

/**
 * Removes `.json` or `.json.gz` extension from a file path returning the base file name.
 *
 * @param filepath - A file path.
 *
 * @returns Base name of file referenced without `.json` or `.json.gz` extension.
 */
export function baseFilename(filepath: string): string
{
   return path.basename(filepath).replace(/\.json(\.gz)?$/, '');
}
