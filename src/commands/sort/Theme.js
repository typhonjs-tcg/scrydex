export class Theme
{
   /**
    * @param {import('#types-command').ConfigSort} config -
    *
    * @returns {import('#types-command').ThemeData} Theme data.
    */
   static get(config)
   {
      switch (config.theme)
      {
         case 'dark': return new ThemeDark();

         default:
         case 'light': return new ThemeLight();
      }
   }
}

class ThemeDark
{
   #cell;
   #fonts;
   #mark;
   #row;
   #sortByType;

   constructor()
   {
      this.#cell = {
         border: {
            left:  { style: 'thin', color: { argb: 'FF777777' } },
            right: { style: 'thin', color: { argb: 'FF777777' } }
         }
      };

      this.#fonts = {
         header: { color: { argb: 'FFF5F5F5' }, name: 'Arial', size: 13, bold: true },
         link:   { color: { argb: 'FFCCE0FF' }, name: 'Arial', size: 12, underline: true },
         main:   { color: { argb: 'FFE8E2C2' }, name: 'Arial', size: 12 }
      };

      this.#mark = {
         error: {
            border: {
               top:    { style: 'thin', color: { argb: 'FFCC6666' }},
               bottom: { style: 'thin', color: { argb: 'FFCC6666' }}
            },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF401818' }}
         },

         ok: {
            border: {
               top:    { style: 'thin', color: { argb: 'FF55AA55' }},
               bottom: { style: 'thin', color: { argb: 'FF55AA55' }}
            },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203020' }}
         },

         warning: {
            border: {
               top:    { style: 'thin', color: { argb: 'FFCCAA66' }},
               bottom: { style: 'thin', color: { argb: 'FFCCAA66' }}
            },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F2B00' }}
         }
      };

      this.#row = {
         fill: {
            alternate: {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FF282828' }
            },
            default: {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FF1A1A1A' }
            }
         }
      };

      this.#sortByType = {
         border: {
            top: { style: 'thick', color: { argb: 'FF8D6BFF' }}
         }
      };
   }

   get cell()
   {
      return this.#cell;
   }

   get fonts()
   {
      return this.#fonts;
   }

   get mark()
   {
      return this.#mark;
   }

   get row()
   {
      return this.#row;
   }

   get sortByType()
   {
      return this.#sortByType;
   }
}

class ThemeLight
{
   #cell;
   #fonts;
   #mark;
   #row;
   #sortByType;

   constructor()
   {
      this.#cell = {
         border: {
            left:  { style: 'thin', color: { argb: 'FF999999' } },
            right: { style: 'thin', color: { argb: 'FF999999' } }
         }
      };

      this.#fonts = {
         header: { color: { argb: 'FF000000' }, name: 'Arial', size: 13, bold: true },
         link: { color: { argb: 'FF0000FF' }, name: 'Arial', size: 12, underline: true },
         main: { color: { argb: 'FF000000' }, name: 'Arial', size: 12 }
      };

      this.#mark = {
         // Red - Needs attention.
         error: {
            border: {
               top: {style: 'thin', color: {argb: 'FF88AA55'}},
               bottom: {style: 'thin', color: {argb: 'FF88AA55'}}
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFCC' } }
         },

         // Green - merge OK.
         ok: {
            border: {
               top: {style: 'thin', color: {argb: 'FF88AA55'}},
               bottom: {style: 'thin', color: {argb: 'FF88AA55'}}
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFCC' } }
         },

         // Orange - attention required.
         warning: {
            border: {
               top: { style: 'thin', color: { argb: 'FFCC8800' }},
               bottom: { style: 'thin', color: { argb: 'FFCC8800' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } }
         }
      }

      this.#row = {
         fill: {
            alternate: {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FFEFEFEF' } // light gray
            },

            default: {
               type: 'pattern',
               pattern: 'solid',
               fgColor: { argb: 'FFFFFFFF' } // white
            }
         }
      };

      this.#sortByType = {
         border: { top: { style: 'thick', color: { argb: 'FFD6C6FF' } } }
      }
   }

   get cell()
   {
      return this.#cell;
   }

   get fonts()
   {
      return this.#fonts;
   }

   get mark()
   {
      return this.#mark;
   }

   get row()
   {
      return this.#row;
   }

   get sortByType()
   {
      return this.#sortByType;
   }
}
