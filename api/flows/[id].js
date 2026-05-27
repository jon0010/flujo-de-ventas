import { getFlowsCollection, sanitizeFlow, seedFlowsIfEmpty } from "../_lib/mongo.js";

function methodNotAllowed(res) {
  res.setHeader("Allow", "GET, PUT, DELETE");
  return res.status(405).json({ message: "Method not allowed" });
}

export default async function handler(req, res) {
  const id = req.query?.id;
  if (typeof id !== "string" || !id) {
    return res.status(400).json({ message: "Invalid flow id" });
  }

  const collection = await getFlowsCollection();
  await seedFlowsIfEmpty(collection);

  if (req.method === "GET") {
    const flow = await collection.findOne({ id });
    if (!flow) return res.status(404).json({ message: "Flow not found" });
    return res.status(200).json(sanitizeFlow(flow));
  }

  if (req.method === "PUT") {
    const payload = req.body ?? {};
    const updated = {
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
      references: Array.isArray(payload.references) ? payload.references : [],
      nodes: Array.isArray(payload.nodes) ? payload.nodes : [],
      edges: Array.isArray(payload.edges) ? payload.edges : [],
    };

    const exists = await collection.findOne({ id });
    if (!exists) return res.status(404).json({ message: "Flow not found" });

    await collection.updateOne({ id }, { $set: updated });
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    const result = await collection.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Flow not found" });
    }
    return res.status(204).end();
  }

  return methodNotAllowed(res);
}
