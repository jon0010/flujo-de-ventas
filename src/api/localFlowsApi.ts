import { createEmptyFlow } from "../data/flowTemplates";
import type { CreateFlowInput, Flow } from "../types/flow";
import { ApiError } from "./client";

const STORAGE_KEY = "flows-local-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readFlows(): Flow[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Flow[]) : [];
  } catch {
    return [];
  }
}

function writeFlows(flows: Flow[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
}

export const localFlowsApi = {
  async list(): Promise<Flow[]> {
    return readFlows();
  },

  async get(id: string): Promise<Flow> {
    const flow = readFlows().find((item) => item.id === id);
    if (!flow) throw new ApiError("No encontrado", 404);
    return flow;
  },

  async create(input: CreateFlowInput): Promise<Flow> {
    const created = createEmptyFlow(input);
    const next = [...readFlows(), created];
    writeFlows(next);
    return created;
  },

  async update(flow: Flow): Promise<Flow> {
    const next = readFlows().map((item) =>
      item.id === flow.id ? { ...flow, updatedAt: new Date().toISOString() } : item,
    );
    writeFlows(next);
    return next.find((item) => item.id === flow.id) ?? flow;
  },

  async remove(id: string): Promise<void> {
    const next = readFlows().filter((item) => item.id !== id);
    writeFlows(next);
  },
};
