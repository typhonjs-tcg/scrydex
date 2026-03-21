/**
 * Determines whether the provided {@link AbortSignal} has been aborted.
 *
 * Primarily provided for source-level consistency and readability when checking cooperative cancellation in loops
 * and async operations.
 *
 * @param signal - An optional {@link AbortSignal} to check.
 *
 * @returns `true` if the signal is defined and aborted; otherwise `false`.
 */
export function isAborted(signal?: AbortSignal): boolean
{
   return !!signal?.aborted;
}
