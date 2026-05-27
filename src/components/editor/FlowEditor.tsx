import { useCallback, useEffect, useState } from "react";
import { toast } from "../../lib/toast";
import type { CanvasTool } from "../../types/canvas";
import { useFlowEditor } from "../../hooks/useFlowEditor";
import { FlowCanvas } from "./FlowCanvas";
import { FlowToolbar } from "./FlowToolbar";
import { EdgeLegend } from "./EdgeLegend";
import { EdgeEditorPanel } from "./EdgeEditorPanel";
import { CanvasToolSwitcher } from "./CanvasToolSwitcher";
import {
  getBoardElement,
  getVisibleBoardCenter,
  scrollBoardToNode,
} from "../../utils/boardCoords";
import { exportFlowToPdf } from "../../utils/exportFlowPdf";

type Props = {
  flowId: string;
  canEdit: boolean;
  onBack: () => void;
  onLogout: () => void;
};

export function FlowEditor({ flowId, canEdit, onBack, onLogout }: Props) {
  const {
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
    updateMeta,
  } = useFlowEditor(flowId);

  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectTo, setConnectTo] = useState<string | null>(null);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("select");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "v" || e.key === "V") setCanvasTool("select");
      if (e.key === "h" || e.key === "H") {
        setCanvasTool("pan");
        setConnectFrom(null);
        setConnectTo(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleToolChange = useCallback((tool: CanvasTool) => {
    setCanvasTool(tool);
    if (tool === "pan") {
      setConnectFrom(null);
      setConnectTo(null);
    }
  }, []);

  const nodeTitle = useCallback(
    (id: string) => flow?.nodes.find((n) => n.id === id)?.title ?? "Nodo",
    [flow],
  );

  const selectedEdge = flow?.edges.find((e) => e.id === selectedEdgeId) ?? null;

  const handleConnect = useCallback(
    (from: string, to: string, label?: string) => {
      const ok = addEdge(from, to, { label });
      if (ok) {
        toast.success("Enlace creado", {
          description: `${nodeTitle(from)} → ${nodeTitle(to)}`,
        });
        setConnectFrom(null);
        setConnectTo(null);
      } else {
        toast.error("Ese enlace ya existe");
      }
      return ok;
    },
    [addEdge, nodeTitle],
  );

  const handleSelectNode = useCallback(
    (id: string | null) => {
      if (id) {
        setSelectedEdgeId(null);
        if (connectFrom && connectFrom !== id) {
          handleConnect(connectFrom, id);
          setSelectedNodeId(id);
          return;
        }
        if (connectTo && connectTo !== id) {
          handleConnect(id, connectTo);
          setSelectedNodeId(id);
          return;
        }
      }
      setSelectedNodeId(id);
    },
    [connectFrom, connectTo, handleConnect, setSelectedNodeId, setSelectedEdgeId],
  );

  const handleSelectEdge = useCallback(
    (id: string | null) => {
      setSelectedEdgeId(id);
      if (id) {
        setSelectedNodeId(null);
        setConnectFrom(null);
        setConnectTo(null);
      }
    },
    [setSelectedEdgeId, setSelectedNodeId],
  );

  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    deleteEdge(selectedEdgeId);
    toast.success("Enlace eliminado");
  }, [selectedEdgeId, deleteEdge]);

  const handleAddNode = useCallback(
    (type: Parameters<typeof addNode>[0], title: string) => {
      const position = getVisibleBoardCenter();
      const id = addNode(type, title, position);
      setSelectedNodeId(id);
      setSelectedEdgeId(null);
      setCanvasTool("select");
      requestAnimationFrame(() => scrollBoardToNode(id));
      toast.info("Nodo creado", {
        description:
          "Usa Origen → Destino en la barra, o Salida/Entrada y clic en otro nodo.",
        duration: 5000,
      });
      return id;
    },
    [addNode, setSelectedNodeId, setSelectedEdgeId],
  );

  const handleFocusNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setCanvasTool("select");
    scrollBoardToNode(nodeId);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  const handleExportPdf = useCallback(async () => {
    if (!flow || exportingPdf) return;
    const board = getBoardElement();
    if (!board) {
      toast.error("No se encontró el tablero del flujo");
      return;
    }

    setExportingPdf(true);
    try {
      await toast.promise(exportFlowToPdf(flow, board), {
        loading: "Generando PDF…",
        success: "PDF descargado",
        error: (e) =>
          e instanceof Error ? e.message : "No se pudo generar el PDF",
      });
    } finally {
      setExportingPdf(false);
    }
  }, [flow, exportingPdf]);

  if (!flow) {
    return (
      <div className="flow-editor-view">
        <p className="muted flow-editor-loading">
          {loading ? "Cargando flujo…" : "No se encontró el flujo."}
        </p>
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Dashboard
        </button>
      </div>
    );
  }

  const connectModeLabel =
    connectFrom != null
      ? `Clic en el destino (desde «${nodeTitle(connectFrom)}»)`
      : connectTo != null
        ? `Clic en el origen (hacia «${nodeTitle(connectTo)}»)`
        : null;

  return (
    <div className="flow-editor-view">
      <header className="flow-editor-header">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Dashboard
        </button>
        <div className="flow-editor-header-fields">
          <input
            className="flow-editor-title"
            value={flow.name}
            onChange={(e) => canEdit && updateMeta({ name: e.target.value })}
            readOnly={!canEdit}
            aria-label="Nombre del flujo"
          />
          <input
            className="flow-editor-desc"
            value={flow.description}
            onChange={(e) =>
              canEdit && updateMeta({ description: e.target.value })
            }
            readOnly={!canEdit}
            placeholder="Descripción del flujo"
            aria-label="Descripción del flujo"
          />
        </div>
        <div className="flow-editor-header-actions">
          {canEdit && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsEditMenuOpen((prev) => !prev)}
            >
              {isEditMenuOpen ? "Ocultar menú" : "Mostrar menú"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            disabled={exportingPdf || flow.nodes.length === 0}
            onClick={() => void handleExportPdf()}
          >
            {exportingPdf ? "Generando PDF…" : "Exportar PDF"}
          </button>
          <CanvasToolSwitcher
            tool={canvasTool}
            onChange={handleToolChange}
          />
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Cerrar sesión
          </button>
          {saving && <span className="save-indicator">Guardando…</span>}
        </div>
      </header>

      {canEdit && isEditMenuOpen && (
        <div className="flow-editor-bar">
          <FlowToolbar
            saving={saving}
            nodes={flow.nodes}
            selectedNodeId={selectedNodeId}
            connectFrom={connectFrom}
            connectTo={connectTo}
            onAddNode={handleAddNode}
            onDeleteNode={() => selectedNodeId && deleteNode(selectedNodeId)}
            onFocusNode={handleFocusNode}
            onConnect={handleConnect}
            onStartConnectFrom={(id) => {
              setConnectTo(null);
              setConnectFrom(id);
              setSelectedEdgeId(null);
              toast.message("Modo conexión", {
                description: `Haz clic en el nodo destino después de «${nodeTitle(id)}»`,
              });
            }}
            onStartConnectTo={(id) => {
              setConnectFrom(null);
              setConnectTo(id);
              setSelectedEdgeId(null);
              toast.message("Modo conexión", {
                description: `Haz clic en el nodo origen antes de «${nodeTitle(id)}»`,
              });
            }}
            onCancelConnect={() => {
              setConnectFrom(null);
              setConnectTo(null);
            }}
          />

          {selectedEdge ? (
            <EdgeEditorPanel
              edge={selectedEdge}
              nodes={flow.nodes}
              onUpdate={(patch) => updateEdge(selectedEdge.id, patch)}
              onDelete={handleDeleteEdge}
              onClose={() => setSelectedEdgeId(null)}
            />
          ) : (
            <EdgeLegend />
          )}
        </div>
      )}

      <FlowCanvas
        flow={flow}
        tool={canvasTool}
        editable={canEdit}
        selectedNodeId={selectedNodeId}
        selectedEdgeId={selectedEdgeId}
        connectFromId={connectFrom}
        connectToId={connectTo}
        connectModeLabel={connectModeLabel}
        onSelectNode={handleSelectNode}
        onSelectEdge={handleSelectEdge}
        onCancelConnect={() => {
          setConnectFrom(null);
          setConnectTo(null);
        }}
        onMoveNode={(id, x, y) => updateNode(id, { x, y })}
        onUpdateNode={(id, patch, debounced = true) =>
          updateNode(id, patch, debounced)
        }
      />
    </div>
  );
}
