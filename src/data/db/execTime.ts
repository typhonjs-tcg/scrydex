/**
 * Provides a consistent `Date` instance for execution time of the CLI ensuring all DB files written share the same
 * `generatedAt` date.
 */
const execTime = new Date();

export { execTime };
