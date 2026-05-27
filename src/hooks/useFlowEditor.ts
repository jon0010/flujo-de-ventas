import { useCallback, useEffect, useRef, useState } from "react";
import { flowsApi } from "../api/flowsApi";
import { toastApiError } from "../lib/toast";
import type {
  Flow,
  FlowEdge,
  FlowNode,
  FlowReference,
  NodeType,
} from "../types/flow";
import { createId } from "../data/flowTemplates";
import { clampNodePosition } from "../utils/boardCoords";

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  const debounced = () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

export function useFlowEditor(flowId: string | null) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const flowRef = useRef<Flow | null>(null);
  flowRef.current = flow;

  useEffect(() => {
    if (!flowId) {
      setFlow(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    flowsApi
      .get(flowId)
      .then((data) => {
        if (!cancelled) {
          const loaded = {
            ...data,
            nodes: data.nodes.map((n) => {
              const pos = clampNodePosition(n.x, n.y);
              return pos.x === n.x && pos.y === n.y ? n : { ...n, ...pos };
            }),
          };
          flowRef.current = loaded;
          setFlow(loaded);
        }
      })
      .catch((e) => {
        if (!cancelled) toastApiError(e, "No se pudo cargar el flujo");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [flowId]);

  const persistQueueRef = useRef<{
    inFlight: boolean;
    pending: Flow | null;
  }>({ inFlight: false, pending: null });

  const flushPersist = useCallback(async () => {
    const queue = persistQueueRef.current;
    if (queue.inFlight || !queue.pending) return;

    const toSave = queue.pending;
    queue.pending = null;
    queue.inFlight = true;
    setSaving(true);

    try {
      const saved = await flowsApi.update(toSave);
      flowRef.current = saved;
      setFlow(saved);
    } catch (e) {
      if (!queue.pending) {
        toastApiError(e, "No se pudo guardar los cambios");
      }
    } finally {
      queue.inFlight = false;
      setSaving(false);
      if (queue.pending) void flushPersist();
    }
  }, []);

  const enqueuePersist = useCallback(
    (next: Flow) => {
      persistQueueRef.current.pending = next;
      void flushPersist();
    },
    [flushPersist],
  );

  const persistDebounced = useRef(
    debounce(() => {
      const current = flowRef.current;
      if (current) enqueuePersist(current);
    }, 600),
  ).current;

  const updateFlow = useCallback(
    (updater: (prev: Flow) => Flow, immediate = false) => {
      setFlow((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        flowRef.current = next;
        if (immediate) {
          persistDebounced.cancel();
          enqueuePersist(next);
        } else {
          persistDebounced();
        }
        return next;
      });
    },
    [enqueuePersist, persistDebounced],
  );

  const addNode = useCallback(
    (
      type: NodeType,
      title: string,
      position?: { x: number; y: number },
    ) => {
      const id = createId("node");
      updateFlow((prev) => ({
        ...prev,
        nodes: [
          ...prev.nodes,
          {
            id,
            type,
            title: title.trim() || "Nuevo nodo",
            sub: "",
            x: position?.x ?? 420,
            y: position?.y ?? 380,
          },
        ],
      }));
      return id;
    },
    [updateFlow],
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<FlowNode>, debounced = true) => {
      updateFlow(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        }),
        !debounced,
      );
    },
    [updateFlow],
  );

  const deleteNode = useCallback(
    (id: string) => {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      updateFlow(
        (prev) => ({
          ...prev,
          nodes: prev.nodes.filter((n) => n.id !== id),
          edges: prev.edges.filter((e) => e.from !== id && e.to !== id),
        }),
        true,
      );
    },
    [updateFlow],
  );

  const addEdge = useCallback(
    (
      from: string,
      to: string,
      options?: { label?: string; color?: string; dash?: boolean },
    ) => {
      if (from === to) return false;
      let added = false;
      updateFlow((prev) => {
        if (prev.edges.some((e) => e.from === from && e.to === to)) return prev;
        added = true;
        return {
          ...prev,
          edges: [
            ...prev.edges,
            {
              id: createId("edge"),
              from,
              to,
              color: options?.color ?? prev.color,
              dash: options?.dash,
              label: options?.label,
            },
          ],
        };
      }, true);
      return added;
    },
    [updateFlow],
  );

  const updateEdge = useCallback(
    (id: string, patch: Partial<FlowEdge>) => {
      updateFlow(
        (prev) => ({
          ...prev,
          edges: prev.edges.map((e) =>
            e.id === id ? { ...e, ...patch } : e,
          ),
        }),
        true,
      );
    },
    [updateFlow],
  );

  const deleteEdge = useCallback(
    (id: string) => {
      setSelectedEdgeId(null);
      updateFlow(
        (prev) => ({
          ...prev,
          edges: prev.edges.filter((e) => e.id !== id),
        }),
        true,
      );
    },
    [updateFlow],
  );

  const addReference = useCallback(
    (ref: Omit<FlowReference, "id">) => {
      updateFlow(
        (prev) => ({
          ...prev,
          references: [...prev.references, { ...ref, id: createId("ref") }],
        }),
        true,
      );
    },
    [updateFlow],
  );

  const removeReference = useCallback(
    (id: string) => {
      updateFlow(
        (prev) => ({
          ...prev,
          references: prev.references.filter((r) => r.id !== id),
        }),
        true,
      );
    },
    [updateFlow],
  );

  const updateMeta = useCallback(
    (patch: Partial<Pick<Flow, "name" | "description">>) => {
      updateFlow((prev) => ({ ...prev, ...patch }), true);
    },
    [updateFlow],
  );

  return {
    flow,
    loading,
    saving,
    selectedNodeId,
    setSelectedNodeId,
    selectedEdgeId,
    setSelectedEdgeId,
    addNode,
    updateNode,
    deleteNode,
    addEdge,
    updateEdge,
    deleteEdge,
    addReference,
    removeReference,
    updateMeta,
    setFlow,
  };
}
