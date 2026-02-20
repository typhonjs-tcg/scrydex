import fs   from 'node:fs';

/**
 * Deletes `./test/fixture/output` on initial test run.
 */
export default function()
{
   console.log('Removing old test output at `./test/fixture/output`.');

   fs.rmSync(`./test/fixture/output`, { recursive: true, force: true });
}
