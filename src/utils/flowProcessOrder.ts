import type { Flow, FlowNode } from "../types/flow";

export type ProcessStep = {
  node: FlowNode;
};

/** Orden del proceso según `stepOrder` definido en cada nodo. */
export function orderNodesForProcess(flow: Flow): ProcessStep[] {
  return [...flow.nodes]
    .sort((a, b) => {
      const ao = a.stepOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.stepOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return a.title.localeCompare(b.title, "es");
    })
    .map((node) => ({ node }));
}

export function countNodesWithStepOrder(nodes: FlowNode[]) {
  return nodes.filter((n) => n.stepOrder != null && n.stepOrder > 0).length;
}
