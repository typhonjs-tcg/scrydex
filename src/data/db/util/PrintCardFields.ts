import { ScryfallData }    from '#scrydex/data/scryfall';

import { CardFields }      from './CardFields';

import type { Card }       from '#scrydex/data/db';

/**
 * Provides card fields as a unified string regardless of single / dual facedl.
 */
export abstract class PrintCardFields
{
   /**
    * @param card -
    *
    * @returns `colors` string.
    */
   static colors(card: Card): string
   {
      if (card.card_faces)
      {
         // Each part is individual array of strings. Map / join these strings first.
         return CardFields.partsColors(card).map((entry) => entry.join(', ')).join(' // ');
      }
      else
      {
         return card.colors?.join(', ') ?? '';
      }
   }

   /**
    * @param card -
    *
    * @returns The finish / foil icon embellishment for spreadsheet card name.
    */
   static finishIcon(card: Card): string
   {
      switch (card.foil)
      {
         case 'etched':
            return ' ◈'

         case 'foil':
            return ' ◇'

         default:
         case 'normal':
            return '';
      }
   }

   /**
    * Defer to original CSV language code if available and differs from the Scryfall card `lang` field.
    *
    * Alas, currently most online MTG collection services do not associate cards w/ foreign language Scryfall IDs.
    * A temporary solution is to defer to any language set by the collection service exported CSV instead of the
    * found Scryfall card data / language when these values differ. This requires the user to correctly set the language
    * in the online MTG collection service.
    *
    * @param card -
    *
    * @returns Normalized language name.
    */
   static langName(card: Card): string
   {
      return ScryfallData.langCodeToName(CardFields.langCode(card)) ?? '<Unknown>';
   }

   /**
    * Defer to Scryfall `name` field before falling back to possible `printed_name`.
    *
    * Append language code for non-English cards.
    *
    * @param card -
    *
    * @returns Normalized card name for spreadsheet display.
    */
   static name(card: Card): string
   {
      const name = card.name ?? card.printed_name ?? '<Unknown>';

      const lang = CardFields.langCode(card);

      const finishIcon = this.finishIcon(card);

      return `${name}${lang !== 'en' ? ` [${lang}]` : ''}${finishIcon}`;
   }

   /**
    * Generates a note for any oracle text provided with the card.
    *
    * @param card -
    *
    * @returns `oracle_text` for any card.
    */
   static oracleText(card: Card): string | undefined
   {
      const text = card.card_faces ? CardFields.partsOracleText(card).join('\n//\n') : card.oracle_text;
      return text.length ? text.trim() : void 0;
   }
}
