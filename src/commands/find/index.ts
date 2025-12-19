import {
   CardDBStore,
   CardFields,
   CardFilter,
   SortOrder }             from '#data';

import { logger }          from '#util';

import type { Card }       from '#types';
import type { ConfigFind } from '#types-command';

export async function find(config: ConfigFind)
{
   logger.info(`Attempting to find sorted Scrydex CardDBs in directory: ${config.dirpath}`);

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

   logger.info(`Loading ${collections.length} card collections: ${
    collections.map((entry) => entry.meta.name).join(', ')}`);

   logger.verbose(``);

   for (const collection of collections)
   {
      logger.verbose(`${collection.meta.name} - ${collection.filepath}`);
   }

   const hasFilters = Object.keys(config.filter).length > 0;

   if (hasFilters)
   {
      logger.verbose(``);
      logger.verbose(`[Filter Options]`);
      logger.verbose(`----------------------`);

      CardFilter.logConfig(config.filter, 'verbose');

      logger.verbose(`----------------------`);
   }

   for (const collection of collections)
   {
      for await (const card of collection.asStream())
      {
         // Start with any regex tests otherwise set `foundRegex` to true.
         const foundRegex = config.regex && config?.regexFields?.size ? regexInputTests(card, config) : true;

         if (!foundRegex) { continue; }

         // Additional independent filter checks.
         const foundFilters = hasFilters ? CardFilter.test(card, config.filter) : true;

         if (foundRegex && foundFilters)
         {
            const gameFormat = collection.meta.type === 'sorted_format' ? collection.meta.format : void 0;

            logger.info(`Name: ${card.name}; Quantity: ${card.quantity}; Collection: ${collection.meta.name}; Rarity: ${
             SortOrder.rarity(card, gameFormat)}; Category: ${SortOrder.categoryName(card)}${
              card.in_deck ? `; In Deck: ${card.filename}` : ''}`);
         }
      }
   }
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
