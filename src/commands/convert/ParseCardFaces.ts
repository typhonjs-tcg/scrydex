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
         const type_line = typeof face.type_line === 'string' ? face.type_line : void 0;

         result.push({
            object: 'card_face',
            colors: Array.isArray(face.colors) ? face.colors : void 0,
            defense: typeof face.defense === 'string' ? face.defense : void 0,
            loyalty: typeof face.loyalty === 'string' ? face.loyalty : void 0,
            mana_cost: typeof face.mana_cost === 'string' ? face.mana_cost : '',
            name: typeof face.name === 'string' ? face.name : '',
            oracle_text: typeof face.oracle_text === 'string' ? face.oracle_text : void 0,
            power: typeof face.power === 'string' ? face.power : void 0,
            toughness: typeof face.toughness === 'string' ? face.toughness : void 0,
            type: type_line !== void 0 ? ParseTypeLine.resolve(type_line) : void 0,
            type_line
         });
      }

      return result;
   }
}
