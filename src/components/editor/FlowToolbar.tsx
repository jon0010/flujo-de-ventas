import { useState } from "react";
import { NODE_TYPE_LABELS, type FlowNode, type NodeType } from "../../types/flow";
import { ConnectNodesControl } from "./ConnectNodesControl";

type Props = {
  saving: boolean;
  nodes: FlowNode[];
  selectedNodeId: string | null;
  connectFrom: string | null;
  connectTo: string | null;
  onAddNode: (type: NodeType, title: string) => string;
  onDeleteNode: () => void;
  onFocusNode: (nodeId: string) => void;
  onConnect: (from: string, to: string, label?: string) => boolean;
  onStartConnectFrom: (nodeId: string) => void;
  onStartConnectTo: (nodeId: string) => void;
  onCancelConnect: () => void;
};

export function FlowToolbar({
  saving,
  nodes,
  selectedNodeId,
  connectFrom,
  connectTo,
  onAddNode,
  onDeleteNode,
  onFocusNode,
  onConnect,
  onStartConnectFrom,
  onStartConnectTo,
  onCancelConnect,
}: Props) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<NodeType>("step");
  const [isNodeSectionOpen, setIsNodeSectionOpen] = useState(false);
  const [isLinksSectionOpen, setIsLinksSectionOpen] = useState(false);

  return (
    <div className="flow-toolbar">
      {saving && <span className="save-indicator">Guardando…</span>}

      <div className="toolbar-section">
        <button
          type="button"
          className="toolbar-section-toggle"
          onClick={() => setIsNodeSectionOpen((prev) => !prev)}
          aria-expanded={isNodeSectionOpen}
        >
          <span className="toolbar-section-title">Nuevo nodo</span>
          <span className="toolbar-section-chevron" aria-hidden>
            {isNodeSectionOpen ? "▾" : "▸"}
          </span>
        </button>
        {isNodeSectionOpen && (
          <div className="toolbar-section-row">
            <label className="toolbar-field">
              Tipo
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NodeType)}
              >
                {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => (
                  <option key={t} value={t}>
                    {NODE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>

            <label className="toolbar-field">
              Nombre
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Nombre del nodo…"
              />
            </label>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onAddNode(type, label);
                setLabel("");
              }}
            >
              Agregar nodo
            </button>

            {selectedNodeId && (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onFocusNode(selectedNodeId)}
                >
                  Ir al nodo
                </button>
                <button type="button" className="btn btn-danger" onClick={onDeleteNode}>
                  Borrar nodo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="toolbar-section toolbar-section--links">
        <button
          type="button"
          className="toolbar-section-toggle"
          onClick={() => setIsLinksSectionOpen((prev) => !prev)}
          aria-expanded={isLinksSectionOpen}
        >
          <span className="toolbar-section-title">Enlaces / referencias</span>
          <span className="toolbar-section-chevron" aria-hidden>
            {isLinksSectionOpen ? "▾" : "▸"}
          </span>
        </button>
        {isLinksSectionOpen ? (
          <ConnectNodesControl
            nodes={nodes}
            selectedNodeId={selectedNodeId}
            connectFrom={connectFrom}
            connectTo={connectTo}
            onConnect={onConnect}
            onStartConnectFrom={onStartConnectFrom}
            onStartConnectTo={onStartConnectTo}
            onCancelConnect={onCancelConnect}
          />
        ) : (
          <p className="connect-panel-hint">Panel replegado. Despliégalo para crear enlaces.</p>
        )}
      </div>

      {nodes.length > 0 && (
        <label className="toolbar-field toolbar-locate">
          Localizar nodo
          <select
            defaultValue=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) onFocusNode(id);
              e.target.value = "";
            }}
          >
            <option value="">Elegir en la lista…</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>
      )}

      <p className="toolbar-hint">
        Doble clic en el número del nodo para ordenar el PDF · Doble clic en el nodo
        para editar título · Arrastra para mover
      </p>
    </div>
  );
}
