import { useState } from "react";
import type { FlowNode } from "../../types/flow";

type Props = {
  nodes: FlowNode[];
  selectedNodeId: string | null;
  connectFrom: string | null;
  connectTo: string | null;
  onConnect: (from: string, to: string, label?: string) => boolean;
  onStartConnectFrom: (nodeId: string) => void;
  onStartConnectTo: (nodeId: string) => void;
  onCancelConnect: () => void;
};

export function ConnectNodesControl({
  nodes,
  selectedNodeId,
  connectFrom,
  connectTo,
  onConnect,
  onStartConnectFrom,
  onStartConnectTo,
  onCancelConnect,
}: Props) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [edgeLabel, setEdgeLabel] = useState("");

  if (nodes.length < 2) {
    return (
      <p className="connect-panel-hint">
        Necesitas al menos 2 nodos para crear un enlace.
      </p>
    );
  }

  const nodeName = (id: string) =>
    nodes.find((n) => n.id === id)?.title ?? "Nodo";

  const applySelectionToDropdowns = () => {
    if (!selectedNodeId) return;
    if (!fromId) setFromId(selectedNodeId);
    else if (!toId && selectedNodeId !== fromId) setToId(selectedNodeId);
  };

  return (
    <div className="connect-panel">
      <span className="connect-panel-title">Conectar nodos</span>

      {connectFrom && (
        <p className="connect-panel-active">
          Salida desde <strong>{nodeName(connectFrom)}</strong> — clic en el destino
          <button type="button" className="btn-link" onClick={onCancelConnect}>
            Cancelar
          </button>
        </p>
      )}
      {connectTo && (
        <p className="connect-panel-active connect-panel-active--target">
          Entrada hacia <strong>{nodeName(connectTo)}</strong> — clic en el origen
          <button type="button" className="btn-link" onClick={onCancelConnect}>
            Cancelar
          </button>
        </p>
      )}

      <div className="connect-panel-row">
        <label className="toolbar-field">
          Origen
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            onFocus={applySelectionToDropdowns}
          >
            <option value="">Elegir…</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.title}
              </option>
            ))}
          </select>
        </label>

        <span className="connect-arrow" aria-hidden>
          →
        </span>

        <label className="toolbar-field">
          Destino
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
          >
            <option value="">Elegir…</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id} disabled={n.id === fromId}>
                {n.title}
              </option>
            ))}
          </select>
        </label>

        <label className="toolbar-field">
          Etiqueta
          <input
            value={edgeLabel}
            onChange={(e) => setEdgeLabel(e.target.value)}
            placeholder="Opcional"
          />
        </label>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!fromId || !toId || fromId === toId}
          onClick={() => {
            const ok = onConnect(
              fromId,
              toId,
              edgeLabel.trim() || undefined,
            );
            if (ok) {
              setEdgeLabel("");
              setToId("");
            }
          }}
        >
          Crear enlace
        </button>
      </div>

      {selectedNodeId && !connectFrom && !connectTo && (
        <div className="connect-panel-quick">
          <span className="connect-panel-quick-label">Nodo seleccionado:</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onStartConnectFrom(selectedNodeId)}
          >
            Salida →
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onStartConnectTo(selectedNodeId)}
          >
            ← Entrada
          </button>
        </div>
      )}

      <p className="connect-panel-hint">
        Arrastra el nodo nuevo junto al paso anterior. Luego elige origen y destino,
        o usa Salida/Entrada y haz clic en el otro nodo.
      </p>
    </div>
  );
}
