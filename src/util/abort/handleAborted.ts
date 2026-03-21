/**
 * Handles cooperative cancellation for an {@link AbortSignal} by invoking the provided abort callback when the signal
 * has been aborted.
 *
 * This utility centralizes the common pattern of checking `signal.aborted`, executing cleanup logic, and
 * short-circuiting control flow. It is intended for use inside loops and async operations where early termination
 * should occur without throwing.
 *
 * @param signal - An optional {@link AbortSignal} to check.
 *
 * @param onAbort - A callback invoked when the signal is aborted. Receives the abort `reason` if any.
 *
 * @returns `true` if the signal was aborted and the callback was invoked; otherwise `false`.
 *
 * @example
 * ```ts
 * const abort = (reason: any) => {}
 *
 * for await (const row of stream)
 * {
 *    if (handleAbort(signal, abort)) { return; }
 *
 *    // process row
 * }
 * ```
 */
export function handleAborted(signal: AbortSignal | undefined, onAbort: (reason?: unknown) => void): boolean
{
   if (!signal?.aborted) { return false; }

   onAbort?.(signal.reason);

   return true;
}
