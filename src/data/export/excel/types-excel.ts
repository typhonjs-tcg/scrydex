/**
 * Controls column visibility for _some_ card properties.
 */
interface Columns
{
   /**
    * Include card price.
    *
    * @defaultValue `true`
    */
   price?: boolean;

   /**
    * Include exact card rarity.
    *
    * @defaultValue `false`
    */
   rarity?: boolean;
}

/**
 * Various sort options.
 */
interface Sort
{
   /**
    * Sort cards by WUBRG+ categories.
    */
   byKind?: boolean;

   /**
    * Sort cards in each category by normalized type line.
    */
   byType?: boolean;
}

/**
 * Supported theme names.
 */
type Theme = 'dark' | 'light';

export {
   Columns,
   Sort,
   Theme
}
