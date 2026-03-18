// Test API
const api = true;

// Test CLI commands.
const cli = true;

/**
 * Defines which test files to run. Keys coordinate with test file names.
 */
export const testConfig = {
   // API errors
   apiErrors: api && true,

   // API tests
   collectionCards: api && true,
   collectionEmpty: api && true,

   // CLI errors
   cliErrors: cli && true,

   // CLI commands
   'convert-csv': cli && true,
   'export-csv': cli && true,
   'export-excel': cli && true,
   'export-llm': cli && true,
   'export-txt': cli && true,
   'file-compress': cli && true,
   filter: cli && true,
   find: cli && true,
   'sort-format-1': cli && true,
   'sort-format-2': cli && true,
   'sort-format-3': cli && true,
   'sort-format-4': cli && true
};
