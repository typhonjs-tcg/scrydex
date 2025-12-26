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

export { ImportCollection };
