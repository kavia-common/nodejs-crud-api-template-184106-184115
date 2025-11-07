import dotenv from 'dotenv';

/**
 * Load environment variables from .env file early.
 * This allows configuration to be accessed consistently across the app.
 */
dotenv.config();

/**
 * PUBLIC_INTERFACE
 * getConfig
 * Returns a normalized, validated configuration object for the application.
 * - Loads environment variables
 * - Normalizes port
 * - Validates database configuration (either DATABASE_URL or all discrete DB_* variables)
 *
 * Returns:
 *  {
 *    port: number,
 *    database: {
 *      connectionString?: string,
 *      host?: string,
 *      port?: number,
 *      user?: string,
 *      password?: string,
 *      database?: string
 *    }
 *  }
 */
export function getConfig() {
  const rawPort = process.env.PORT;
  // Safe default for non-critical value
  const port = Number.isInteger(Number(rawPort)) && Number(rawPort) > 0 ? Number(rawPort) : 3001;

  const databaseUrl = (process.env.DATABASE_URL || '').trim();

  // Gather discrete DB variables
  const dbHost = (process.env.DB_HOST || '').trim();
  const dbPortRaw = (process.env.DB_PORT || '').trim();
  const dbUser = (process.env.DB_USER || '').trim();
  const dbPassword = (process.env.DB_PASSWORD || '').trim();
  const dbName = (process.env.DB_NAME || '').trim();

  const hasDiscrete =
    dbHost.length > 0 ||
    dbPortRaw.length > 0 ||
    dbUser.length > 0 ||
    dbPassword.length > 0 ||
    dbName.length > 0;

  const errors = [];

  // Validate database config
  // Accept either DATABASE_URL OR all discrete vars present
  let database = {};
  if (databaseUrl) {
    database = { connectionString: databaseUrl };
  } else if (hasDiscrete) {
    // If opting for discrete values, ensure all are present
    if (!dbHost) errors.push('Missing required env DB_HOST for discrete DB configuration.');
    if (!dbPortRaw) errors.push('Missing required env DB_PORT for discrete DB configuration.');
    if (!dbUser) errors.push('Missing required env DB_USER for discrete DB configuration.');
    if (!dbPassword) errors.push('Missing required env DB_PASSWORD for discrete DB configuration.');
    if (!dbName) errors.push('Missing required env DB_NAME for discrete DB configuration.');

    let dbPort = undefined;
    if (dbPortRaw) {
      const parsed = Number(dbPortRaw);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        errors.push('DB_PORT must be a positive integer.');
      } else {
        dbPort = parsed;
      }
    }

    database = {
      host: dbHost || undefined,
      port: dbPort,
      user: dbUser || undefined,
      password: dbPassword || undefined,
      database: dbName || undefined,
    };
  } else {
    // Neither DATABASE_URL nor any discrete fields provided -> insufficient DB config
    errors.push(
      'Database configuration is missing. Provide either DATABASE_URL or all of DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.'
    );
  }

  if (errors.length > 0) {
    // Provide a clear aggregated message to help diagnose misconfiguration
    const message =
      'Environment configuration error(s):\n' +
      errors.map((e) => `- ${e}`).join('\n');
    // Throwing here ensures app fails-fast in unhealthy configuration
    throw new Error(message);
  }

  return {
    port,
    database,
  };
}

/**
 * PUBLIC_INTERFACE
 * config
 * Eagerly-evaluated configuration instance for convenience.
 * Note: Accessing this will validate environment variables immediately.
 */
export const config = getConfig();

export default config;
