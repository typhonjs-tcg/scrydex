import { ColorLogger } from '@typhonjs-utils/logger-color';

/**
 * Provides a ColorLogger instance accessible across the package.
 */
const logger: ColorLogger = new ColorLogger({ tag: 'scrydex' });

export { logger };
