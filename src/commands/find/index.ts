import {
   CardDB,
   CardFields }         from '#data';

import { Card }         from '#types';
import { ConfigFind }   from '#types-command';

export async function find(config: ConfigFind)
{
   const collections = await CardDB.loadAll({ dirpath: config.dirpath, type: 'game_format', walk: true });

   console.log(`!!! find - collections.length: ${collections.length}`);

   const checks = config.checks;
   const hasChecks = Object.keys(checks).length > 0;

   for (const collection of collections)
   {
      console.log(`!!! find - searching collection.name: ${collection.name}`);

      for await (const card of collection.asStream())
      {
         // Start with any regex tests otherwise set `foundRegex` to true.
         const foundRegex = config.regexFields.size ? regexInputTests(card, config) : true;

         // Additional custom checks.
         let foundChecks = !hasChecks;

         if (!foundChecks && checks.cmc !== void 0)
         {
            if (card.card_faces)
            {
               const cmcParts = CardFields.partsCMC(card);
               for (const cmcPart of cmcParts)
               {
                  if (checks.cmc === cmcPart) { foundChecks = true; break;}
               }
            }
            else if (checks.cmc === card.cmc)
            {
               foundChecks = true;
            }
         }

         if (foundRegex && foundChecks)
         {
            console.log (`!!!! find - name: ${card.name}; quantity: ${card.quantity}; filename: ${card.filename}`);
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
