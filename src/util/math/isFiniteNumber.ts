/**
 * Provides a type guard for verifying the given value is a finite number.
 *
 * @param value - Unknown value to test.
 */
export function isFiniteNumber(value: unknown): value is number
{
   return typeof value === 'number' && Number.isFinite(value);
}
