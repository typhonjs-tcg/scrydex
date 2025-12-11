import { ParseTypeLine }   from './ParseTypeLine';

import type { CardFace }   from '#types';

export abstract class ParseCardFaces
{
   static resolve(faces: Record<string, any>[]): CardFace[]
   {
      const result: CardFace[] = [];

      if (!Array.isArray(faces) || faces.length === 0) { return result; }

      for (const face of faces)
      {
         const type_line = typeof face.type_line === 'string' ? face.type_line : '';

         result.push({
            object: 'card_face',
            colors: Array.isArray(face.colors) ? face.colors : [],
            mana_cost: typeof face.mana_cost === 'string' ? face.mana_cost : '',
            name: typeof face.name === 'string' ? face.name : '',
            oracle_text: typeof face.oracle_text === 'string' ? face.oracle_text : '',
            type: ParseTypeLine.resolve(type_line),
            type_line
         });
      }

      return result;
   }
}
