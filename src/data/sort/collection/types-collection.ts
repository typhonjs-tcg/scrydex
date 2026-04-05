import type { CardDB } from '#scrydex/data/db';

/**
 * Additional data added to cards when sorting.
 */
interface CardSorted extends CardDB.Data.Card
{
   /**
    * For marked files indicate merge status.
    */
   mark?: 'error' | 'ok' | 'warning';
}

/**
 * Sorting configuration flags used during collection sorting and export.
 *
 * The following sorting modes are currently recognized:
 * ```
 * - `alpha` — Sort entries alphabetically.
 * - `type`  — Sort entries by card type.
 * ```
 *
 * This interface is intentionally extensible. Additional boolean flags may be introduced in the future to support
 * new sorting strategies without requiring structural changes to the API surface.
 *
 * Unknown keys are permitted and interpreted as opt-in sorting modes.
 */
interface SortOptions
{
   /**
    * Alphabetical sorting.
    */
   alpha?: boolean;

   /**
    * Sorted by card type line.
    */
   type?: boolean;

   /**
    * Additional custom sorting flags.
    *
    * Keys not explicitly defined above are allowed to support forward-compatible or experimental sorting strategies.
    */
   [key: string]: boolean | undefined;
}

export {
   CardSorted,
   SortOptions
}
