import { isDirectory }     from '@typhonjs-utils/file-util';

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
   static async cardDB({ db, filepath, options = { oracleText: true } }: LLMOptions)
   {
      if (isDirectory(filepath)) { throw new Error(`'filepath' is a directory.`); }

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
