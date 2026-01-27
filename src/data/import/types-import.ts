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
    * Language code from external user managed source / CSV file. This is metadata and various online collection
    * services allow this to be freely set by the user, so it may not correlate to actual associated Scryfall ID / data.
    */
   lang_user?: string;

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
