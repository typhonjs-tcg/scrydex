import {
   CardDBStore,
   CardFields,
   SortOrder }             from '#data';

import { logger }          from '#util';

import type { Card }       from '#types';
import type { ConfigFind } from '#types-command';

export async function find(config: ConfigFind)
{
   logger.info(`Attempting to find card(s) in directory: ${config.dirpath}`);

   const collections = await CardDBStore.loadAll({
      dirpath: config.dirpath,
      type: new Set(['sorted', 'sorted_format']),
      walk: true
   });

   if (collections.length === 0)
   {
      logger.info(`No 'sorted' or 'sorted_format' card collections found.`);
      return;
   }

   logger.verbose(`Loading ${collections.length} card collections:`);
   for (const collection of collections)
   {
      logger.verbose(`${collection.meta.name} - ${collection.filepath}`);
   }

   const hasChecks = Object.keys(config.checks).length > 0;

   for (const collection of collections)
   {
      for await (const card of collection.asStream())
      {
         // Start with any regex tests otherwise set `foundRegex` to true.
         const foundRegex = config.regex && config?.regexFields?.size ? regexInputTests(card, config) : true;

         if (!foundRegex) { continue; }

         // Additional independent checks.
         const foundChecks = hasChecks ? independentChecks(card, config) : true;

         if (foundRegex && foundChecks)
         {
            const gameFormat = collection.meta.type === 'sorted_format' ? collection.meta.format : void 0;
            const gameFormatStr = gameFormat ? `; Format: ${gameFormat}` : '';

            logger.info(`Name: ${card.name}; Quantity: ${card.quantity}; Type: ${card.type}${gameFormatStr}; Rarity: ${
             SortOrder.rarity(card, gameFormat)}; Category: ${SortOrder.categoryName(card)}${
              card.in_deck ? `; In Deck: ${card.filename}` : ''}`);
         }
      }
   }
}

/**
 * Handles any independent property checks separate of regex testing.
 *
 * @param card -
 *
 * @param config -
 */
function independentChecks(card: Card, config: ConfigFind): boolean
{
   const checks = config.checks;

   if (checks.colorIdentity && Array.isArray(card.color_identity))
   {
      if (!checks.colorIdentity.isSupersetOf(new Set(card.color_identity))) { return false; }
   }

   if (checks.cmc)
   {
      if (card.card_faces)
      {
         const cmcParts = CardFields.partsCMC(card);
         let result = false;
         for (const cmcPart of cmcParts)
         {
            if (checks.cmc === cmcPart) { result = true; break; }
         }
         if (!result) { return false; }
      }
      else if (checks.cmc !== card.cmc)
      {
         return false;
      }
   }

   return true;
}

/**
 * Performs all user search input / regex tests based on `config.fields`
 *
 * @param card -
 *
 * @param config - Command config.
 *
 * @returns Whether any regex test has passed and the card matches.
 */
function regexInputTests(card: Card, config: ConfigFind): boolean
{
   if (!config.regex || !config.regexFields) { return false; }

   if (config.regexFields.has('name'))
   {
      if (card.card_faces)
      {
         const printedNames = CardFields.partsPrintedName(card);
         for (const printedName of printedNames)
         {
            if (config.regex.test(printedName)) { return true; }
         }

         const names = CardFields.partsName(card);
         for (const name of names)
         {
            if (config.regex.test(name)) { return true; }
         }
      }

      if (typeof card.printed_name === 'string' && config.regex.test(card.printed_name)) { return true; }
      if (typeof card.name === 'string' && config.regex.test(card.name)) { return true; }
   }

   if (config.regexFields.has('oracle_text'))
   {
      if (card.card_faces)
      {
         const oracleTexts = CardFields.partsOracleText(card);
         for (const oracleText of oracleTexts)
         {
            if (config.regex.test(oracleText)) { return true; }
         }
      }

      if (typeof card.oracle_text === 'string' && config.regex.test(card.oracle_text)) { return true; }
   }

   if (config.regexFields.has('type_line'))
   {
      if (card.card_faces)
      {
         const typeLines = CardFields.partsTypeLine(card);
         for (const typeLine of typeLines)
         {
            if (config.regex.test(typeLine)) { return true; }
         }
      }

      if (typeof card.type_line === 'string' && config.regex.test(card.type_line)) { return true; }
   }

   return false;
}
