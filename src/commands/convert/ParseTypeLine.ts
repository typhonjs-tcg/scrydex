import type { CardDB } from '#scrydex/data/db';

/**
 * Resolves a Scryfall type_line into a normalized card category.
 *
 * Category model:
 *
 *   1) Land types (highest precedence)
 *      Land
 *      Land - Basic
 *      Land - Legendary
 *      Land - Artifact
 *      Land - Snow
 *      Land - Saga
 *
 *   2) Artifact families (second-highest precedence; subtype sorted)
 *      Artifact
 *      Artifact - Legendary
 *      Artifact - Creature
 *      Artifact - Creature - Legendary
 *      Artifact - Equipment
 *      Artifact - Equipment - Legendary
 *      Artifact - Vehicle
 *      Artifact - Vehicle - Legendary
 *
 *   3) Other card types (single base type with optional Legendary modifier)
 *      Creature
 *      Creature - Legendary
 *      Enchantment
 *      Enchantment - Legendary
 *      Instant
 *      Instant - Legendary
 *      Sorcery
 *      Sorcery - Legendary
 *      Planeswalker
 *      Planeswalker - Legendary
 *      Battle
 *      Battle - Legendary
 *
 * Special rules applied:
 *   - `Interrupt` and `Mana Source` printings normalize to Instant.
 *   - Enchantment Creature resolves as Creature (not Artifact- or Enchantment-based).
 *   - Artifact subtype resolution precedes generic Creature detection.
 *   - Legendary status is applied after subtype determination.
 *
 * Resolution precedence:
 *   Land > Artifact > Creature > Enchantment > Instant > Sorcery > Planeswalker > Battle
 */
export abstract class ParseTypeLine
{
   /* v8 ignore next 1 */
   private constructor() {}

   static #regexLand = /\bland\b/i;
   static #regexBasic = /\bbasic\b/i;
   static #regexEquipment = /\bequipment\b/i;
   static #regexSnow = /\bsnow\b/i;
   static #regexArtifact = /\bartifact\b/i;
   static #regexEnchantment = /\benchantment\b/i;
   static #regexCreature = /\bcreature\b/i;
   static #regexInstant = /\binstant\b/i;
   static #regexSorcery = /\bsorcery\b/i;
   static #regexPlaneswalker = /\bplaneswalker\b/i;
   static #regexVehicle = /\bvehicle\b/i;
   static #regexBattle = /\bbattle\b/i;
   static #regexLegendary = /\blegendary\b/i;
   static #regexSaga = /\bsaga\b/i;

   /**
    * Resolves a Scryfall type_line into a normalized card category.
    *
    * @param card -
    *
    * @returns Type category classification.
    */
   static resolve(card: Record<string, any> | string | null | undefined): string
   {
      /* v8 ignore next 1 */ // Sanity check.
      if (!card) { throw new Error(`'card' must be a card object or string.`); }

      let typeLine: string | null | undefined;

      if (typeof card === 'string')
      {
         typeLine = card;
      }
      else if (typeof card === 'object')
      {
         typeLine = Array.isArray(card.card_faces) && card.card_faces.length ? card.card_faces[0].type_line :
          card.type_line;

         // Last fallback possible for when a dual face card doesn't have a type line defined in first face.
         /* v8 ignore next 1 */ // Sanity check.
         if (!typeLine) { typeLine = card.type_line; }
      }

      /* v8 ignore next 5 */ // Sanity check.
      if (typeof typeLine !== 'string' || typeLine.length === 0)
      {
         throw new Error(
          `ParseTypeLine.resolve error: Could not determine type line from card:\n${JSON.stringify(card)}`);
      }

      // LAND handling -----------------------------------------------------------------------------------------------

      if (this.#regexLand.test(typeLine))
      {
         // Saga (Urza's Saga)
         if (this.#regexSaga.test(typeLine))
         {
            return 'Land - Saga';
         }

         // Artifact Lands.
         if (this.#regexArtifact.test(typeLine))
         {
            return 'Land - Artifact';
         }

         // Legendary Lands.
         if (this.#regexLegendary.test(typeLine))
         {
            return 'Land - Legendary';
         }

         // Snow Lands.
         if (this.#regexSnow.test(typeLine))
         {
            // There should only be `basic snow` lands.
            return this.#regexBasic.test(typeLine) ? 'Land - Basic - Snow' : 'Land - Snow';
         }

         // Basic Lands.
         if (this.#regexBasic.test(typeLine))
         {
            return 'Land - Basic';
         }

         return 'Land';
      }

      // NON-LAND resolution -----------------------------------------------------------------------------------------

      let baseType = null;

      // Main types.
      if (this.#regexArtifact.test(typeLine))
      {
         // Artifact Creature → Artifact - Creature.
         if (this.#regexCreature.test(typeLine))
         {
            baseType = 'Artifact - Creature';
         }

         // Artifact Equipment → Artifact - Equipment.
         else if (this.#regexEquipment.test(typeLine))
         {
            baseType = 'Artifact - Equipment';
         }

         // Artifact Vehicle → Artifact - Vehicle.
         else if (this.#regexVehicle.test(typeLine))
         {
            baseType = 'Artifact - Vehicle';
         }

         // Plain Artifact.
         else
         {
            baseType = 'Artifact';
         }
      }
      else if (this.#regexCreature.test(typeLine))
      {
         baseType = 'Creature';
      }
      else if (this.#regexEnchantment.test(typeLine))
      {
         baseType = 'Enchantment';
      }
      else if (this.#regexInstant.test(typeLine))
      {
         baseType = 'Instant';
      }
      else if (this.#regexSorcery.test(typeLine))
      {
         baseType = 'Sorcery';
      }
      else if (this.#regexPlaneswalker.test(typeLine))
      {
         baseType = 'Planeswalker';
      }
      else if (this.#regexBattle.test(typeLine))
      {
         baseType = 'Battle';
      }

      // Unknown case - return raw type line.
      /* v8 ignore next 4 */ // Sanity check.
      if (!baseType)
      {
         return typeLine;
      }

      // Enchantment Creature → Creature -----------------------------------------------------------------------------

      if (this.#regexEnchantment.test(typeLine) && this.#regexCreature.test(typeLine))
      {
         baseType = 'Creature';
      }

      // Legendary suffix --------------------------------------------------------------------------------------------
      if (this.#regexLegendary.test(typeLine))
      {
         return `${baseType} - Legendary`;
      }

      return baseType;
   }
}
