import { MongoClient } from "mongodb";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const uri = process.env.MONGODB_URI || process.env.db_url;
const dbName = process.env.MONGODB_DB || "flujo-ventas";

if (!uri) {
  throw new Error("Missing MONGODB_URI (or db_url) environment variable");
}

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getFlowsCollection() {
  const connected = await clientPromise;
  return connected.db(dbName).collection("flows");
}

export async function seedFlowsIfEmpty(collection) {
  const count = await collection.countDocuments();
  if (count > 0) return;

  try {
    const filePath = join(process.cwd(), "server", "db.json");
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);
    const flows = Array.isArray(parsed?.flows) ? parsed.flows : [];
    if (flows.length === 0) return;
    await collection.insertMany(flows);
  } catch {
    // no-op: si no existe seed local, la app sigue con base vacia
  }
}

export function sanitizeFlow(doc) {
  if (!doc) return null;
  const { _id, ...flow } = doc;
  return flow;
}
