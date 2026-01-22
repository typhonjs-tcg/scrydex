/**
 * Normalizes a file path depending on whether compression / gunzip is required adding or removing `.gz` extension.
 *
 * @param options - Options.
 *
 * @param options.filepath - File path to normalize.
 *
 * @param [options.compress] - Compression status; default: `false`.
 *
 * @returns Normalized file path given compression state provided.
 */
export function normalizeFilepath({ filepath, compress = false }: { filepath: string, compress?: boolean }): string
{
   if (compress) { return filepath.endsWith('.gz') ? filepath : `${filepath}.gz`; }

   return filepath.endsWith('.gz') ? filepath.slice(0, -3) : filepath;
}
