import { randomUUID } from "node:crypto";
import { getFlowsCollection, sanitizeFlow, seedFlowsIfEmpty } from "../_lib/mongo.js";

function methodNotAllowed(res) {
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ message: "Method not allowed" });
}

export default async function handler(req, res) {
  const collection = await getFlowsCollection();
  await seedFlowsIfEmpty(collection);

  if (req.method === "GET") {
    const flows = await collection.find({}).sort({ updatedAt: -1 }).toArray();
    return res.status(200).json(flows.map(sanitizeFlow));
  }

  if (req.method === "POST") {
    const payload = req.body ?? {};
    const id =
      typeof payload.id === "string" && payload.id.trim()
        ? payload.id
        : `flow-${randomUUID().slice(0, 8)}`;

    const now = new Date().toISOString();
    const flow = {
      ...payload,
      id,
      createdAt: payload.createdAt || now,
      updatedAt: now,
      references: Array.isArray(payload.references) ? payload.references : [],
      nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
      edges: Array.isArray(payload.edges) ? payload.edges : [],
    };

    await collection.updateOne({ id: flow.id }, { $set: flow }, { upsert: true });
    return res.status(201).json(flow);
  }

  return methodNotAllowed(res);
}
