import { langCodeToName }  from './langCodeToName';

import type { Card }       from '#types';

export abstract class CardFields
{
   /**
    *
    */
   static colors(card: Card): string
   {
      if (card.card_faces)
      {
         const colors: string[] = [];
         for (const face of card.card_faces) { colors.push(face.colors?.join(', ') ?? ''); }
         return colors.join(' // ');
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
    * @param convert - When true, convert language code to full language name.
    *
    * @returns Normalized language code or full language name.
    */
   static langCode(card: Card, convert = false): string
   {
      const lang = typeof card.lang_csv === 'string' && card.lang !== card.lang_csv ? card.lang_csv : card.lang;

      return convert ? langCodeToName.get(lang) ?? '<Unknown>' : lang;
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
    * @returns Normalized language code or full language name.
    */
   static langName(card: Card): string
   {
      return langCodeToName.get(this.langCode(card)) ?? '<Unknown>';
   }

   /**
    * Defer to Scryfall `name` field before falling back to possible `printed_name`.
    *
    * Append language code for non-English cards.
    *
    * @param card -
    *
    * @returns Normalized card name.
    */
   static name(card: Card): string
   {
      const name = card.name ?? card.printed_name ?? '<Unknown>';

      const lang = this.langCode(card);

      const finishIcon = this.finishIcon(card);

      return `${name}${lang !== 'en' ? ` [${lang}]` : ''}${finishIcon}`;
   }

   /**
    * The mana cost string. Multi-face cards potentially have multiple mana cost seperated by ` // `.
    *
    * @param card -
    *
    * @returns The mana cost string.
    */
   static manaCost(card: Card): string
   {
      if (card.card_faces)
      {
         const manaCost: string[] = [];
         for (const face of card.card_faces) { manaCost.push(face.mana_cost); }
         return manaCost.join(' // ');
      }
      else
      {
         return card.mana_cost;
      }
   }
}
