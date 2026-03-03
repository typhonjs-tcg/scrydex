import { commandExportLLM }   from '../../../../src/cli/functions';
import { AssertData }         from '../../util/AssertData';

import { testConfig }         from '../../testConfig';

describe.runIf(testConfig['export-llm'])('export-llm', () =>
{
   it('default (collection)', async () =>
   {
      await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
         output: './test/fixture/output/cli/export-llm/collection/default',
         loglevel: 'error'
      });

      await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/collection/default',
       './test/fixture/snapshot/cli/export-llm/collection/default');
   });

   it('no oracle text w/ types (collection)', async () =>
   {
      await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection', {
         output: './test/fixture/output/cli/export-llm/collection/no-oracle-text',
         'oracle-text': false,
         types: true,
         loglevel: 'error'
      });

      await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/collection/no-oracle-text',
       './test/fixture/snapshot/cli/export-llm/collection/no-oracle-text');
   });

   it('default w/ types (single DB)', async () =>
   {
      await commandExportLLM('./test/fixture/snapshot/cli/sort-format/collection/commander/commander.json', {
         output: './test/fixture/output/cli/export-llm/single/default/llm-commander.json',
         types: true,
         loglevel: 'error'
      });

      await AssertData.directoryEqual('./test/fixture/output/cli/export-llm/single/default',
       './test/fixture/snapshot/cli/export-llm/single/default');
   });
});
