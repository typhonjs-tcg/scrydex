import { ParseTypeLine }   from './ParseTypeLine';

import type { CardFace }   from '#types';

export abstract class ParseCardFaces
{
   static resolve(faces: Record<string, any>[]): CardFace[] | undefined
   {
      const result: CardFace[] = [];

      if (!Array.isArray(faces)) { return void 0; }

      for (const face of faces)
      {
         const type_line = typeof face.type_line === 'string' ? face.type_line : '';

         result.push({
            object: 'card_face',
            colors: Array.isArray(face.colors) ? face.colors : [],
            defense: typeof face.defense === 'string' ? face.defense : void 0,
            loyalty: typeof face.loyalty === 'string' ? face.loyalty : void 0,
            mana_cost: typeof face.mana_cost === 'string' ? face.mana_cost : '',
            name: typeof face.name === 'string' ? face.name : '',
            oracle_text: typeof face.oracle_text === 'string' ? face.oracle_text : '',
            power: typeof face.power === 'string' ? face.power : void 0,
            toughness: typeof face.toughness === 'string' ? face.toughness : void 0,
            type: ParseTypeLine.resolve(type_line),
            type_line
         });
      }

      return result;
   }
}
