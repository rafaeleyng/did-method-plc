'use strict' /* eslint-disable */

const { Database, PlcServer } = require('./dist')

const main = async () => {
  const version = process.env.PLC_VERSION
  const dbUrl = process.env.PLC_DB_URL
  const dbSchema = process.env.DB_SCHEMA || undefined
  const enableMigrations = process.env.ENABLE_MIGRATIONS === 'true'
  if (enableMigrations) {
    // Migrate using credentialed user
    const migrateDb = Database.postgres({
      url: dbUrl,
      schema: dbSchema,
    })
    await migrateDb.migrateToLatestOrThrow()
    await migrateDb.close()
  }
  const dbPoolSize = parseMaybeInt(process.env.DB_POOL_SIZE)
  const dbPoolMaxUses = parseMaybeInt(process.env.DB_POOL_MAX_USES)
  const dbPoolIdleTimeoutMs = parseMaybeInt(process.env.DB_POOL_IDLE_TIMEOUT_MS)
  // Use lower-credentialed user to run the app
  const db = Database.postgres({
    url: dbUrl,
    schema: dbSchema,
    poolSize: dbPoolSize,
    poolMaxUses: dbPoolMaxUses,
    poolIdleTimeoutMs: dbPoolIdleTimeoutMs,
  })
  const port = parseMaybeInt(process.env.PORT)
  const adminSecret = process.env.ADMIN_SECRET || undefined
  const plc = PlcServer.create({ db, port, version, adminSecret })
  await plc.start()
}

const parseMaybeInt = (str) => {
  return str ? parseInt(str, 10) : undefined
}

main()
