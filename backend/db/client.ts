import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// Create postgres client - use mock if no connection string
let db: ReturnType<typeof drizzle<typeof schema>>;

if (connectionString) {
  const client = postgres(connectionString);
  db = drizzle(client, { schema });
} else {
  // Create a mock database for development without PostgreSQL
  console.warn("⚠️ DATABASE_URL not set. Running in mock mode.");
  // @ts-expect-error - Mock DB for development
  db = null;
}

export { db, schema };
