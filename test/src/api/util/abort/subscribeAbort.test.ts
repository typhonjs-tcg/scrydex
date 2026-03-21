import { expect }          from 'vitest';

import { subscribeAbort }  from '#scrydex/util/abort';

import { testConfig }      from '#test/config';

describe.runIf(testConfig['utilAbort'])('subscribeAbort', () =>
{
      it('abort (initial)', async () =>
      {
         const controller = new AbortController();
         controller.abort('abort - initial');

         let result: string | undefined;

         const onAbort = (reason: any) => result = reason;

         subscribeAbort(controller.signal, onAbort);

         expect(result).toBe('abort - initial');
      });
});
