import { CardDB }       from '#data';

import { ConfigFind }   from '#types-command';

export async function find(config: ConfigFind)
{
   const cardStreams = await CardDB.loadAll({ dirpath: config.dirpath, type: 'game_format', walk: true });

   console.log(`!!! find - cardStreams.length: ${cardStreams.length}`);

   for (const cardStream of cardStreams)
   {
      console.log(`!!! find - searching cardStream.name: ${cardStream.name}`);

      for await (const card of cardStream.asStream())
      {
         // console.log(`!!! find - searching card.name: ${card.name}`);

         if (config.regex.test(card.name))
         {
            console.log (`!!!! find - name: ${card.name}; quantity: ${card.quantity}; filename: ${card.filename}`);
         }
      }
   }
}
