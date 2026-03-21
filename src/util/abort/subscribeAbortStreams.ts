import { subscribeAbort }  from './subscribeAbort';

/**
 * Subscribes multiple streams to an {@link AbortSignal}, destroying each stream when the signal is aborted.
 *
 * If the signal is already aborted, all provided streams are destroyed immediately. Otherwise, a one-time listener is
 * registered to destroy the streams upon abort.
 *
 * Returns an unsubscribe function to remove the abort listener allowing proper lifecycle cleanup.
 *
 * @param signal - An optional {@link AbortSignal} to observe.
 *
 * @param streams - One or more Node.js streams to destroy when the signal is aborted.
 *
 * @returns A function that removes the abort event listener. Safe to call multiple times.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeAbortStreams(signal, readable, transform, writable);
 *
 * try
 * {
 *    readable.pipe(transform).pipe(writable);
 * }
 * finally
 * {
 *    unsubscribe();
 * }
 * ```
 */
export function subscribeAbortStreams(signal: AbortSignal | undefined, ...streams: Destroyable[])
{
   return subscribeAbort(signal, (reason: any) =>
   {
      for (const s of streams) { s?.destroy?.(reason); }
   });
}

/**
 * Represents a resource that can be cooperatively torn down via a `destroy` method.
 *
 * This minimal structural contract is used to generalize cancellation handling across streams and other
 * lifecycle managed objects without coupling to specific implementations.
 *
 * @property destroy - Optional method to terminate the resource and perform cleanup.
 */
export type Destroyable = { destroy?: (error?: any) => void };
