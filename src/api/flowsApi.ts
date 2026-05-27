import { ApiError, apiFetch } from "./client";
import type { CreateFlowInput, Flow } from "../types/flow";
import { createEmptyFlow } from "../data/flowTemplates";
import { localFlowsApi } from "./localFlowsApi";

function shouldFallbackToLocal(error: unknown) {
  return (
    error instanceof ApiError &&
    (error.status === 0 || error.status === 404 || error.status === 405)
  );
}

export const flowsApi = {
  list: async () => {
    try {
      return await apiFetch<Flow[]>("/flows");
    } catch (error) {
      if (shouldFallbackToLocal(error)) return localFlowsApi.list();
      throw error;
    }
  },

  get: async (id: string) => {
    try {
      return await apiFetch<Flow>(`/flows/${id}`);
    } catch (error) {
      if (shouldFallbackToLocal(error)) return localFlowsApi.get(id);
      throw error;
    }
  },

  create: async (input: CreateFlowInput) => {
    const flow = createEmptyFlow(input);
    try {
      return await apiFetch<Flow>("/flows", {
        method: "POST",
        body: JSON.stringify(flow),
      });
    } catch (error) {
      if (shouldFallbackToLocal(error)) return localFlowsApi.create(input);
      throw error;
    }
  },

  update: async (flow: Flow) => {
    try {
      return await apiFetch<Flow>(`/flows/${flow.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...flow,
          updatedAt: new Date().toISOString(),
        }),
      });
    } catch (error) {
      if (shouldFallbackToLocal(error)) return localFlowsApi.update(flow);
      throw error;
    }
  },

  remove: async (id: string) => {
    try {
      return await apiFetch<void>(`/flows/${id}`, { method: "DELETE" });
    } catch (error) {
      if (shouldFallbackToLocal(error)) return localFlowsApi.remove(id);
      throw error;
    }
  },
};
