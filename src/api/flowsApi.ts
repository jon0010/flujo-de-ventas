import { apiFetch } from "./client";
import type { CreateFlowInput, Flow } from "../types/flow";
import { createEmptyFlow } from "../data/flowTemplates";

export const flowsApi = {
  list: () => apiFetch<Flow[]>("/flows"),

  get: (id: string) => apiFetch<Flow>(`/flows/${id}`),

  create: (input: CreateFlowInput) =>
    apiFetch<Flow>("/flows", {
      method: "POST",
      body: JSON.stringify(createEmptyFlow(input)),
    }),

  update: (flow: Flow) =>
    apiFetch<Flow>(`/flows/${flow.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...flow,
        updatedAt: new Date().toISOString(),
      }),
    }),

  remove: (id: string) =>
    apiFetch<void>(`/flows/${id}`, { method: "DELETE" }),
};
