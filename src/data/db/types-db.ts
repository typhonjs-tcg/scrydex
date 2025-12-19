import type {
   CardDBMetadata,
   CardDBMetadataGenerated } from '#types';

/**
 * Make `name` optional in metadata.
 */
type OptionalName<T> =
   T extends { name: string }
      ? Omit<T, 'name'> & { name?: string }
      : T;

/**
 * Metadata shape accepted by `CardDBStore.save`.
 *
 * @privateRemarks
 * This type is derived from the persisted CardDB metadata definition with generated fields
 * (CLI version, schema version, timestamp) removed.
 *
 * The conditional / `infer` form is used intentionally to *distribute* `Omit` across the `CardDBMetadata` union so
 * that discriminated union narrowing (IE `type === 'sorted_format'` ⇒ `format` is present) is preserved.
 */
type CardDBMetaSave =
   CardDBMetadata extends infer T
      ? T extends any
         ? OptionalName<Omit<T, keyof CardDBMetadataGenerated>>
         : never
      : never;

/**
 * Provides the configuration object for {@link CardFilter.filter}.
 */
interface ConfigCardFilter
{
   /**
    * Card border colors to filter.
    */
   border?: Set<string> | null;

   /**
    * WUBRG color identity set.
    */
   colorIdentity?: Set<string> | null;

   /**
    * Match card `CMC`.
    */
   cmc?: number;

   /**
    * Game format legality.
    */
   formats?: string[] | null;

   /**
    * An array of RegExp instances for keywords that a card uses such as 'Flying' and 'Cumulative upkeep'.
    */
   keywords?: RegExp[] | null;

   /**
    * Match exact mana cost.
    */
   manaCost?: string;
}

export {
   CardDBMetaSave,
   ConfigCardFilter };
