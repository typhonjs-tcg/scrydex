import { isDirectory }     from '@typhonjs-utils/file-util';

import { createWritable }  from '#scrydex/util';

import type { CardDB }     from '#scrydex/data/db';

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
   static async cardDB({ db, filepath, options = { id: true, oracleText: true } }:
    { db: CardDB.Stream.Reader, filepath: string, options?: { id?: boolean, oracleText?: boolean, stream?: CardDB.Stream.StreamOptions } })
   {
      if (isDirectory(filepath)) { throw new Error(`'filepath' is a directory.`); }

      const out = createWritable({ filepath });

      let first = true;

      out.write('[\n');

      for await (const card of db.asStream(options.stream))
      {
         // Append `,\n` to last written entry; this skips adding this to the last card entry.
         if (!first) { out.write(',\n  '); }

         const entry = {
            name: card.name,
            oracle_text: options.oracleText ?? true ? card.oracle_text : void 0,
            id: options.id ?? true ? card.scryfall_id : void 0
         }

         out.write(`${first ? '  ' : ''}${JSON.stringify(entry)}`);

         first = false;
      }

      out.write('\n]');
   }
}

export interface LLMOptions
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
 * SCHEMA: LLMCard[]
 * DOMAIN: Magic: The Gathering (MTG)
 * SOURCE: Scryfall API
 * PRODUCER: Scrydex CLI
 */
export interface LLMCard
{
   /** Scryfall card UUID */
   id?: string;

   /** Card name */
   name: string;

   /** Mana cost using Scryfall syntax; IE `{1}{U}{G}`. */
   mana_cost?: string;

   /** Oracle type line; IE `Creature — Elf Druid`. */
   type_line: string;

   /** Oracle rules text; may include MTG keywords and actions. */
   oracle_text?: string;

   /** Card colors as defined by Scryfall */
   colors?: string[];

   quantity: number;
}
