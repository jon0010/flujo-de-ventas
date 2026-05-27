import { useCallback, useEffect, useState } from "react";
import { flowsApi } from "../api/flowsApi";
import { ApiError } from "../api/client";
import { toast } from "../lib/toast";
import type { CreateFlowInput, Flow } from "../types/flow";

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 0) {
    return "No se pudo conectar con el servidor. Ejecuta npm run dev:all";
  }
  if (error instanceof Error) return error.message;
  return "Error al cargar flujos";
}

export function useFlows() {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await flowsApi.list();
      setFlows(data);
    } catch (e) {
      toast.error(getErrorMessage(e), {
        action: {
          label: "Reintentar",
          onClick: () => void refresh(),
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createFlow = useCallback(async (input: CreateFlowInput) => {
    const created = await flowsApi.create(input);
    setFlows((prev) => [...prev, created]);
    return created;
  }, []);

  const deleteFlow = useCallback(async (id: string) => {
    await flowsApi.remove(id);
    setFlows((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { flows, loading, refresh, createFlow, deleteFlow };
}
