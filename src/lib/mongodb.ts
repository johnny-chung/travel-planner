import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGO_DB_NAME ?? "waypoint";

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// Inject the DB name directly into the URI path — no ambiguity from cached connections.
// The raw URI has an empty path (/?appName=...) so we must set it explicitly.
function buildConnectionUri(baseUri: string, dbName: string): string {
  const url = new URL(baseUri);
  if (!url.pathname || url.pathname === "/") {
    url.pathname = `/${dbName}`;
  }
  return url.toString();
}

const CONNECTION_URI = buildConnectionUri(MONGODB_URI, MONGODB_DB);

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global.mongooseCache;
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(CONNECTION_URI, { bufferCommands: false })
      .then((m) => {
        console.log(`[MongoDB] Connected to: ${m.connection.db?.databaseName}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry
        console.error("[MongoDB] Connection error:", err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
