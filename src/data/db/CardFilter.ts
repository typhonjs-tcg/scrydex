import {
   CardFields,
   validLegality }               from '#data';

import type { Card }             from '#types';
import type { ConfigCardFilter } from '#types-data';

export abstract class CardFilter
{
   static test(card: Card, config: ConfigCardFilter): boolean
   {
      if (config.border && !config.border.has(card.border_color)) { return false; }

      if (config.colorIdentity && Array.isArray(card.color_identity))
      {
         if (!config.colorIdentity.isSupersetOf(new Set(card.color_identity))) { return false; }
      }

      if (config.cmc)
      {
         if (card.card_faces)
         {
            const cmcParts = CardFields.partsCMC(card);
            let result = false;
            for (const cmcPart of cmcParts)
            {
               if (config.cmc === cmcPart) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.cmc !== card.cmc)
         {
            return false;
         }
      }

      if (config.formats?.length)
      {
         for (const format of config.formats)
         {
            if (!validLegality.has(card.legalities?.[format])) { return false; }
         }
      }

      if (config.keywords?.length)
      {
         if (!Array.isArray(card.keywords) || card.keywords.length === 0) { return false; }

         for (const keywordRegex of config.keywords)
         {
            for (const keyword of card.keywords)
            {
               if (!keywordRegex.test(keyword)) { return false; }
            }
         }
      }

      if (config.manaCost)
      {
         if (card.card_faces)
         {
            const manaCostParts = CardFields.partsManaCost(card);
            let result = false;
            for (const manaCost of manaCostParts)
            {
               if (config.manaCost === manaCost) { result = true; break; }
            }
            if (!result) { return false; }
         }
         else if (config.manaCost !== card.mana_cost)
         {
            return false;
         }
      }

      return true;
   }
}
