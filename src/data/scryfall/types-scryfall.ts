interface Reader
{
   /**
    * @returns The associated filepath.
    */
   get filepath(): string;

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

declare namespace Stream
{
   export {
      Reader,
      StreamOptions };
}

export { type Stream }
