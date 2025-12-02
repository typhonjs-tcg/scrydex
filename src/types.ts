/**
 * @see https://scryfall.com/docs/api/cards
 */
interface Card
{
   /**
    * This card’s collector number. Note that collector numbers can contain non-numeric characters, such as letters or
    * `★`.
    */
   collector_number: string;

   /**
    * This card’s colors, if the overall card has colors defined by the rules. Otherwise, the colors will be on
    * the card_faces objects.
    */
   colors: Colors;

   /**
    * This card’s color identity.
    */
   color_identity: Colors;

   /**
    * The card’s mana value. Note that some funny cards have fractional mana costs.
    */
   cmc: number;

   /**
    * True if this card is on the Commander Game Changer list.
    *
    * @see https://mtg.wiki/page/Commander_(format)/Game_Changers
    */
   game_changer: boolean;

   /**
    * An array of keywords that this card uses, such as 'Flying' and 'Cumulative upkeep'.
    */
   keywords: string[];

   /**
    * An object describing the legality of this card across play formats. Possible legalities are `legal`, `not_legal`,
    * `restricted`, and `banned`.
    */
   legalities: Record<string, string>;

   /**
    * The mana cost for this card. This value will be any empty string "" if the cost is absent. Remember that per the
    * game rules, a missing mana cost and a mana cost of {0} are different values. Multi-faced cards will report this
    * value in card faces.
    */
   mana_cost: string;

   /**
    * The name of this card. If this card has multiple faces, this field will contain both names separated by ␣//␣.
    */
   name: string;

   /**
    * The Oracle text for this card, if any.
    */
   oracle_text: string;

   /**
    * Colors of mana that this card could produce.
    */
   produced_mana: Colors;

   /**
    * Total count of this card.
    */
   quantity: number;

   /**
    * This card’s rarity. One of `common`, `uncommon`, `rare`, `special`, `mythic`, or `bonus`.
    */
   rarity: string;

   /**
    * The date this card was first released.
    */
   released_at: string;

   /**
    * The type line of this card.
    */
   type_line: string;

   /**
    * True if this card is on the Reserved List.
    */
   reserved: boolean;

   /**
    * This card’s set code.
    *
    * @see https://en.wikipedia.org/wiki/List_of_Magic:_The_Gathering_sets
    */
   set: string;

   /**
    * This card’s full set name.
    */
   set_name: string;

   /**
    * The type of set this printing is in.
    */
   set_type: string;
}

/**
 * Whenever the API presents set of Magic colors, the field will be an array that uses the uppercase, single-character
 * abbreviations for those colors. For example, `["W","U"]` represents something that is both white and blue. Colorless
 * sources are denoted with an empty array `[]`.
 *
 * @see https://scryfall.com/docs/api/colors
 */
type Colors = string[];

export {
   type Card,
   type Colors
}
