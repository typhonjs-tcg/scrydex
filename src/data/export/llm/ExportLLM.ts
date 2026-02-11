import { once }            from 'node:events';

import { createWritable }  from '#scrydex/util';

import type { CardDB }     from '#scrydex/data/db';

import type { LLMCard }    from './types-llm';

/**
 * Provides a mechanism to reduce a Scrydex CardDB to a simplified form suitable for AI / LLM consumption. This process
 * removes the CardDB metadata and outputs a basic array of {@link LLMCard} entries which also have just necessary
 * data about the card to reduce token count / costs and provide simpler parsing.
 */
export abstract class ExportLLM
{
   private constructor() {}

   /**
    * @param opts - Options.
    *
    * @param opts.db - CardDB stream to export.
    *
    * @param opts.filepath - Output file path for LLM simplified / reduced card array; `LLMCard[]`.
    *
    * @param [opts.options] - Additional control over properties exported.
    */
   static async cardDB({ db, filepath, options = { oracleText: true } }: LLMOptions): Promise<void>
   {
      const out = createWritable({ filepath });

      let first = true;

      out.write('[\n');

      for await (const card of db.asStream(options.stream))
      {
         // Append `,\n` to last written entry; this skips adding this to the last card entry.
         if (!first) { out.write(',\n  '); }

         const entry: LLMCard = {
            object: 'card',
            name: card.name,
            quantity: card.quantity,
            norm_type: card.norm_type,
            rarity: card.rarity,
            cmc: card.cmc,
            colors: card.colors,
            color_identity: card.color_identity,
            defense: card.defense,
            game_changer: card.game_changer,
            keywords: card.keywords,
            loyalty: card.loyalty,
            reserved: card.reserved,
            mana_cost: card.mana_cost,
            power: card.power,
            produced_mana: card.produced_mana,
            toughness: card.toughness,
            type_line: card.type_line,
            oracle_text: options.oracleText ?? true ? card.oracle_text : void 0,
            card_faces: card.card_faces,
            user_tags: card.user_tags,
            scryfall_id: card.scryfall_id
         }

         out.write(`${first ? '  ' : ''}${JSON.stringify(entry)}`);

         first = false;
      }

      out.write('\n]');
      out.end();

      await once(out, 'finish');
   }

   /**
    * Writes the TypeScript declaration file describing the LLMDB JSON schema.
    *
    * The generated types provide structural context for LLMs and tooling and correspond exactly to the data produced
    * by {@link ExportLLM.cardDB}.
    *
    * @param options - Options
    *
    * @param options.filepath - Output file path. Must end in `.d.ts` file extension.
    */
   static async types({ filepath }: { filepath: string }): Promise<void>
   {
      if (!filepath?.endsWith('.d.ts')) { throw new Error(`'filepath' must end with '.d.ts'.`); }

      const out = createWritable({ filepath });

      out.write(s_LLM_TYPES);
      out.end();

      await once(out, 'finish');
   }
}

interface LLMOptions
{
   /**
    * Source CardDB stream reader instance.
    */
   db: CardDB.Stream.Reader,

   /**
    * Output file path for simplified LLM export JSON file.
    */
   filepath: string,

   /**
    * Additional options.
    */
   options?: {
      /**
       * When false, Scryfall UUID is removed.
       */
      id?: boolean,

      /**
       * When false, card oracle text is removed.
       */
      oracleText?: boolean,

      /**
       * Optional options for potentially filtering the CardDB
       */
      stream?: CardDB.Stream.StreamOptions
   }
}

/**
 * Provides the corresponding type declarations for LLM parsing of the LLM Card DB exports.
 */
const s_LLM_TYPES = `
/**
 * NOTE:
 * Fields are explicit and non-inferential.
 * Do not assume omitted fields, derived rules, or gameplay legality.
 */

/**
 * SCHEMA: LLMDB
 * TYPE: Array of LLMCard
 *
 * Represents a complete Magic: The Gathering card dataset optimized for Large Language Model (LLM) analysis.
 *
 * Semantics:
 * - Each element is an independent card record (LLMCard).
 * - No implicit ordering or grouping is assumed.
 * - Absence of a field means “unknown or not applicable”; not false.
 *
 * Provenance:
 * - Derived from Scryfall data via the Scrydex CLI.
 * - Intended for analysis, reasoning, and transformation - not gameplay.
 */
export type LLMDB = LLMCard[];

/**
 * Defines the reduced LLM card data transferred from the Scryfall DB.
 *
 * SCHEMA: LLMCard[]
 * DOMAIN: Magic: The Gathering (MTG)
 * SOURCE: Scryfall API
 * PRODUCER: Scrydex CLI
 *
 * @see https://scryfall.com/docs/api/cards
 */
export interface LLMCard
{
   /**
    * Discriminator identifying this record as a card.
    */
   object: 'card';

   /**
    * An array of Card Face objects, if this card is multifaced.
    */
   card_faces?: LLMCardFace[] | null;

   /**
    * This card’s colors, if the overall card has colors defined by the rules. Otherwise, the colors will be on
    * the card_faces objects.
    */
   colors: string[];

   /**
    * This card’s color identity.
    */
   color_identity: string[];

   /**
    * The card’s mana value. Note that some funny cards have fractional mana costs.
    */
   cmc: number;

   /**
    * This card’s defense, if any. Battle cards.
    */
   defense?: string | null;

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
    * This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.
    */
   loyalty?: string | null;

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
    * Normalized card type based on \`type line\` parsing.
    */
   norm_type: string;

   /**
    * The Oracle text for this card, if any.
    */
   oracle_text?: string;

   /**
    * This card’s power, if any. Note that some cards have powers that are not numeric, such as *.
    */
   power?: string | null;

   /**
    * Colors of mana that this card could produce.
    */
   produced_mana?: string[];

   /**
    * Total count of this card.
    */
   quantity: number;

   /**
    * This card’s rarity. One of \`common\`, \`uncommon\`, \`rare\`, \`special\`, \`mythic\`, or \`bonus\`.
    */
   rarity: string;

   /**
    * Scryfall ID / UUID.
    */
   scryfall_id: string;

   /**
    * This card’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.
    */
   toughness?: string | null;

   /**
    * The type line of this card.
    */
   type_line: string;

   /**
    * User or platform derived categorization tags.
    */
   user_tags: string[];

   /**
    * True if this card is on the Reserved List.
    */
   reserved: boolean;
}

/**
 * Defines the enriched, but reduced set of card face data transferred from the Scryfall DB.
 *
 * @see https://scryfall.com/docs/api/cards
 */
export interface LLMCardFace
{
   /**
    * Discriminator identifying this record as a card face.
    */
   object: 'card_face';

   /**
    * This card face colors.
    */
   colors?: string[] | null;

   /**
    * The card face mana value. Note that some funny cards have fractional mana costs.
    */
   cmc?: number | null;

   /**
    * This face’s defense, if any. Battle cards.
    */
   defense?: string | null;

   /**
    * This loyalty if any. Note that some cards have loyalties that are not numeric, such as X.
    */
   loyalty?: string | null;

   /**
    * The mana cost for this card. This value will be any empty string "" if the cost is absent.
    */
   mana_cost: string;

   /**
    * Card face name.
    */
   name: string;

   /**
    * Normalized card type based on \`type line\` parsing.
    */
   norm_type?: string | null;

   /**
    * The Oracle text for this card face, if any.
    */
   oracle_text?: string;

   /**
    * This face’s power, if any. Note that some cards have powers that are not numeric, such as *.
    */
   power?: string | null;

   /**
    * This face’s toughness, if any. Note that some cards have toughnesses that are not numeric, such as *.
    */
   toughness?: string | null;

   /**
    * The type line of this card face.
    */
   type_line?: string | null;
}
`;
