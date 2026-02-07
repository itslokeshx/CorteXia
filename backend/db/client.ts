import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DB | null = null;
let _initialized = false;

function getDb(): DB | null {
  if (_initialized) return _db;
  _initialized = true;

  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    const client = postgres(connectionString);
    _db = drizzle(client, { schema });
  } else {
    console.warn("⚠️ DATABASE_URL not set. Running in mock mode.");
    _db = null;
  }
  return _db;
}

// Proxy that lazily initializes the DB on first access
const db = new Proxy({} as DB, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) return undefined;
    return (instance as any)[prop];
  },
});

export { db, schema };
