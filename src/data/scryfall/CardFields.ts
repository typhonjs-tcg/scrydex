import { langCodeToName }  from './langCodeToName';

import type { Card }       from '#types';

export abstract class CardFields
{
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
   static name(card: Card)
   {
      const name = card.name ?? card.printed_name ?? '<Unknown>';

      const lang = this.langCode(card);

      return `${name}${lang !== 'en' ? ` [${lang}]` : ''}`;
   }
}
