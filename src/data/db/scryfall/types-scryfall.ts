declare namespace File
{
   /**
    * The different types / categories of Scryfall DBs.
    */
   export type DBType = 'all_cards' | 'default_cards';

   export interface Metadata
   {
      /**
       * Scrydex specific metadata.
       */
      meta: Meta.Scrydex;

      /**
       * The Scryfall bulk data object describing this card DB.
       */
      sourceMeta: Meta.ScryfallBulkData;
   }

   /**
    * Defines the Scrydex / Scryfall DB card DB JSON file format.
    */
   export interface JSON extends Metadata
   {
      /**
       * Array of Scryfall card objects.
       *
       * @privateRemarks
       * TODO: Eventually update with TS types for Scryfall card shape.
       */
      cards: Record<string, any>[];
   }
}

/**
 * Defines the metadata objects stored in {@link File.JSON}.
 */
declare namespace Meta
{
   /**
    * The Scrydex specific metadata stored as `meta` in a `ScryfallDB` data file.
    */
   export interface Scrydex
   {
      type: 'scryfall-db-cards';

      /** Generating CLI version. */
      cliVersion: string;

      /** UTC Date when generated. */
      generatedAt: string;
   }

   /**
    * Scryfall API bulk data object metadata response. This is stored as `sourceMeta` in a `ScryfallDB` data file.
    *
    * @see https://scryfall.com/docs/api/bulk-data/type
    */
   export interface ScryfallBulkData
   {
      object: 'bulk_data';

      /** A unique ID for this bulk item. */
      id: string;

      /** A computer-readable string for the kind of bulk item */
      type: File.DBType;

      /** The time when this file was last updated. */
      updated_at: string;

      /** The URI that hosts this bulk file for fetching. */
      uri: string;

      /** A human-readable name for this file. */
      name: string;

      /** A human-readable description for this file. */
      description: string,

      /** The size of this file in integer bytes. */
      size: number;

      /** The URI that hosts this bulk file for fetching. */
      download_uri: string;

      /** The MIME type of this file. */
      content_type: string;

      /** The Content-Encoding encoding that will be used to transmit this file when you download it. */
      content_encoding: string;
   }
}

declare namespace Stream
{
   export interface Reader
   {
      /**
       * @returns The associated filepath.
       */
      get filepath(): string;

      /**
       * @returns Scrydex metadata.
       */
      get meta(): Readonly<Meta.Scrydex>;

      /**
       * @returns Scryfall source metadata.
       */
      get sourceMeta(): Readonly<Meta.ScryfallBulkData>;

      /**
       * Stream the card data in the DB asynchronously.
       *
       * @param [options] - Optional options.
       *
       * @returns Asynchronous iterator over validated card entries.
       */
      asStream(options?: StreamOptions): AsyncIterable<Record<string, any>>;
   }

   /**
    * Options for {@link Stream.Reader.asStream}.
    */
   interface StreamOptions
   {
      /**
       * Optional predicate applied to each card in the stream.
       *
       * When provided, the card is yielded only if this function returns `true`. This predicate is applied after all
       * structured stream options (filters, group exclusions, identity selection) have been evaluated.
       *
       * Intended for advanced or ad-hoc use cases. Structured filters should be preferred where possible.
       */
      filterFn?: (card: Record<string, unknown>) => boolean;
   }
}

export type {
   File,
   Meta,
   Stream
}
