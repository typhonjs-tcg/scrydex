// Test CLI commands.
const cli = false;

/**
 * Defines which test files to run. Keys coordinate with test file names.
 */
export const testConfig = {
   // CLI errors
   errors: cli && true,

   // CLI commands
   'convert-csv': cli && true,
   'export-csv': cli && true,
   'export-excel': cli && true,
   'export-llm': cli && true,
   'export-txt': cli && true,
   filter: cli && true,
   find: cli && true,
   'sort-format-1': cli && true,
   'sort-format-2': cli && true,
   'sort-format-3': cli && true,
   'sort-format-4': cli && true
};
