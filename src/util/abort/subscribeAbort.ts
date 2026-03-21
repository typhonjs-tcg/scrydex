/**
 * Subscribes to an {@link AbortSignal} and invokes the provided callback when the signal is aborted.
 *
 * If the signal is already aborted at the time of subscription the callback is invoked immediately. Otherwise, the
 * callback is registered as a one-time listener for the `abort` event.
 *
 * An unsubscribe function is returned to remove the event listener allowing proper cleanup of resources.
 *
 * This utility provides a consistent mechanism for integrating cooperative cancellation into long-running operations
 * such as streams, async iterators, and command pipelines.
 *
 * @param signal - An optional {@link AbortSignal} to observe.
 *
 * @param onAbort - A callback invoked when the signal is aborted. Receives the abort `reason` if any.
 *
 * @returns A function that removes the abort event listener. Safe to call multiple times.
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeAbort(signal, (reason) =>
 * {
 *    stream.destroy(reason);
 * });
 *
 * try
 * {
 *    // perform async work
 * }
 * finally
 * {
 *    unsubscribe();
 * }
 * ```
 *
 * @example
 * // Pre-aborted signals invoke the callback immediately
 * const controller = new AbortController();
 * controller.abort('stop');
 *
 * subscribeAbort(controller.signal, (reason) =>
 * {
 *    console.log(reason); // 'stop'
 * });
 */
export function subscribeAbort(signal: AbortSignal | undefined, onAbort: (reason: any) => void): () => void
{
   if (!signal) return () => {};

   if (signal.aborted)
   {
      onAbort(signal.reason);
      return () => {};
   }

   const handler = () => onAbort(signal.reason);

   signal.addEventListener('abort', handler, { once: true });

   return () =>
   {
      signal.removeEventListener('abort', handler);
   };
}
