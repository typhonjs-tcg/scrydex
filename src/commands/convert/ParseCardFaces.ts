import { ParseTypeLine }   from './ParseTypeLine';

import type { CardDB }     from '#scrydex/data/db';

export abstract class ParseCardFaces
{
   /* v8 ignore next 1 */
   private constructor() {}

   static resolve(faces: Record<string, any>[]): CardDB.Data.CardFace[] | undefined
   {
      const result: CardDB.Data.CardFace[] = [];

      if (!Array.isArray(faces)) { return void 0; }

      for (const face of faces)
      {
         const type_line = typeof face.type_line === 'string' ? face.type_line : /* v8 ignore next */ void 0;

         result.push({
            object: 'card_face',
            colors: Array.isArray(face.colors) ? face.colors : void 0,
            cmc: typeof face.cmc === 'number' ? face.cmc : void 0,
            defense: typeof face.defense === 'string' ? face.defense : void 0,
            /* v8 ignore next 1 */
            loyalty: typeof face.loyalty === 'string' ? face.loyalty : void 0,
            mana_cost: typeof face.mana_cost === 'string' ? face.mana_cost : /* v8 ignore next */ '',
            name: typeof face.name === 'string' ? face.name : /* v8 ignore next */ '',
            oracle_text: typeof face.oracle_text === 'string' ? face.oracle_text : /* v8 ignore next */ void 0,
            power: typeof face.power === 'string' ? face.power : void 0,
            toughness: typeof face.toughness === 'string' ? face.toughness : void 0,
            norm_type: type_line !== void 0 ? ParseTypeLine.resolve(type_line) : /* v8 ignore next */ void 0,
            type_line
         });
      }

      return result;
   }
}
