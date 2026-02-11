import type { Borders, Fill, Font } from 'exceljs';

import type { CardDB }              from '#scrydex/data/db';

export class Theme
{
   /**
    * @param theme - Theme name.
    *
    * @returns Theme data.
    */
   static get(theme: 'dark' | 'light'): ThemeData
   {
      switch (theme)
      {
         case 'dark': return new ThemeDark();

         default:
         case 'light': return new ThemeLight();
      }
   }
}

class ThemeDark implements ThemeData
{
   readonly #cell: { border: Partial<Borders> };

   readonly #fonts: { header: Partial<Font>, link: Partial<Font>, main: Partial<Font>, title: Partial<Font> };

   readonly #groups: Required<CardDB.File.MetadataGroups<{ fill: Fill, border: Partial<Borders> }>>;

   readonly #mark: {
      error: { fill: Fill, border: Partial<Borders> };
      ok: { fill: Fill, border: Partial<Borders> };
      warning: { fill: Fill, border: Partial<Borders> };
   };

   readonly #row: { fill: { alternate: Fill, default: Fill }, lastRow: { border: Partial<Borders> } };

   readonly #sortByType: { border: Partial<Borders> };

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
         main:   { color: { argb: 'FFE8E2C2' }, name: 'Arial', size: 12 },
         title: { color: { argb: 'FFC0C0C0' }, name: 'Arial', size: 14, bold: true, italic: true }
      };

      this.#groups = {
         // Cyan - Card is in deck.
         decks: {
            border: {
               top: { style: 'thin', color: { argb: 'FF5FB7C6' }},
               bottom: { style: 'thin', color: { argb: 'FF5FB7C6' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF163C42' } }
         },

         // Purple - Card is in external group.
         external: {
            border: {
               top: { style: 'thin', color: { argb: 'FF9A6BBD' }},
               bottom: { style: 'thin', color: { argb: 'FF9A6BBD' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3A2B4A' } }
         },

         // Muted Slate Blue - Card is in proxy group.
         proxy: {
            border: {
               top: { style: 'thin', color: { argb: 'FF6B748A' }},
               bottom: { style: 'thin', color: { argb: 'FF6B748A' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E3442' } }
         }
      }

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
         },

         lastRow: {
            border: {
               bottom:  { style: 'thin', color: { argb: 'FF777777' } }
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

   get groups()
   {
      return this.#groups;
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

class ThemeLight implements ThemeData
{
   readonly #cell: { border: Partial<Borders> };

   readonly #fonts: { header: Partial<Font>, link: Partial<Font>, main: Partial<Font>, title: Partial<Font> };

   readonly #groups: Required<CardDB.File.MetadataGroups<{ fill: Fill, border: Partial<Borders> }>>;

   readonly #mark: {
      error: { fill: Fill, border: Partial<Borders> };
      ok: { fill: Fill, border: Partial<Borders> };
      warning: { fill: Fill, border: Partial<Borders> };
   };

   readonly #row: { fill: { alternate: Fill, default: Fill }, lastRow: { border: Partial<Borders> } };

   readonly #sortByType: { border: Partial<Borders> };

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
         main: { color: { argb: 'FF000000' }, name: 'Arial', size: 12 },
         title: { color: { argb: 'FF444444' }, name: 'Arial', size: 14, bold: true, italic: true }
      };

      this.#groups = {
         // Cyan - Card is in deck.
         decks: {
            border: {
               top: { style: 'thin', color: { argb: 'FF4FA3B8' }},
               bottom: { style: 'thin', color: { argb: 'FF4FA3B8' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6F1F6' } }
         },

         // Purple - Card is in external group.
         external: {
            border: {
               top: { style: 'thin', color: { argb: 'FF8A6BB8' }},
               bottom: { style: 'thin', color: { argb: 'FF8A6BB8' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3D8F2' } }
         },

         // Muted Slate Blue - Card is in proxy group.
         proxy: {
            border: {
               top: { style: 'thin', color: { argb: 'FF8F9BB3' }},
               bottom: { style: 'thin', color: { argb: 'FF8F9BB3' }},
            },

            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD7DDEA' } }
         }
      }

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
         },

         lastRow: {
            border: {
               bottom:  { style: 'thin', color: { argb: 'FF777777' } }
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

   get groups()
   {
      return this.#groups;
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

/**
 * Defines theming data used by {@link ExportCollection}.
 */
interface ThemeData
{
   get cell(): {
      border: Partial<Borders>
   }

   get fonts(): {
      header: Partial<Font>,
      link: Partial<Font>,
      main: Partial<Font>,
      title: Partial<Font>
   }

   get groups(): Required<CardDB.File.MetadataGroups<{ fill: Fill, border: Partial<Borders> }>>

   get mark(): {
      error: { fill: Fill, border: Partial<Borders> }
      ok: { fill: Fill, border: Partial<Borders> }
      warning: { fill: Fill, border: Partial<Borders> }
   }

   get row(): {
      fill: {
         alternate: Fill,
         default: Fill
      },

      lastRow: {
         border: Partial<Borders>
      }
   }

   get sortByType(): {
      border: Partial<Borders>
   }
}
