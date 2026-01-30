/**
 * Defines the base card data loaded from CSV files.
 */
interface CSVCard
{
   object: 'card';

   /**
    * Extra CSV fields not processed in CardDB conversion. These fields are added to card entries on export.
    */
   csv_extra?: { [key: string]: string };

   /**
    * Associated CSV filename.
    */
   filename: string;

   /**
    * Foil variation if any.
    */
   foil: string;

   /**
    * Card name when defined in CSV file.
    */
   name?: string;

   /**
    * Total count of this card.
    */
   quantity: number;

   /**
    * Scryfall ID / UUID.
    */
   scryfall_id: string;

   /**
    * Language code from external user managed source / CSV file. This is metadata and various online collection
    * services allow this to be freely set by the user, so it may not correlate to actual associated Scryfall ID / data.
    */
   user_lang?: string;

   /**
    * User or platform derived categorization tags.
    *
    * Populated opportunistically during CSV import from platform-specific fields (IE for Archidekt `Category` /
    * `Secondary Category` for deck exports or `Tags` for collection export). Not all platforms provide tag or
    * category data. Values are normalized to lowercase and trimmed.
    *
    * Tags that case-insensitively match Scryfall keywords for the card are excluded to avoid semantic duplication
    * (IE `Cycling` vs `cycling`). Tags that case-insensitively match the normalized type line are also excluded.
    *
    * This field is derived and non-authoritative:
    * - Source CSV values are preserved verbatim in `csv_extra`.
    * - `user_tags` is ignored when exporting CardDBs back to CSV.
    * - `user_tags` is included in `export-llm` output for semantic enrichment.
    *
    * Always defined; empty array indicates no tags were derived.
    */
   user_tags: string[];
}

/**
 * Common interface for all imported collection data.
 */
interface ImportCollection
{
   /**
    * @param key - Scryfall ID.
    *
    * @returns Does any collection index have the given card.
    */
   has(key: string): boolean;
}

export {
   CSVCard,
   ImportCollection };
