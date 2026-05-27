import type { CreateFlowInput, Flow, FlowNode } from "../types/flow";
import { FLOW_COLORS } from "../types/flow";

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function createEmptyFlow(input: CreateFlowInput): Omit<Flow, "id"> & { id?: string } {
  const now = new Date().toISOString();
  const starter: FlowNode = {
    id: createId("node"),
    type: "step",
    title: "Inicio",
    sub: "Arrastra y conecta más pasos",
    x: 400,
    y: 300,
  };

  return {
    name: input.name,
    description: input.description,
    color: input.color || FLOW_COLORS[0],
    createdAt: now,
    updatedAt: now,
    references: [],
    nodes: [starter],
    edges: [],
  };
}
