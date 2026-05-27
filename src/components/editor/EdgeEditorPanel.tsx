import type { CSSProperties } from "react";
import { EDGE_LEGEND_ITEMS } from "../../data/edgeLegend";
import type { FlowEdge, FlowNode } from "../../types/flow";

type Props = {
  edge: FlowEdge;
  nodes: FlowNode[];
  onUpdate: (patch: Partial<FlowEdge>) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function EdgeEditorPanel({
  edge,
  nodes,
  onUpdate,
  onDelete,
  onClose,
}: Props) {
  const fromTitle = nodes.find((n) => n.id === edge.from)?.title ?? "?";
  const toTitle = nodes.find((n) => n.id === edge.to)?.title ?? "?";

  const applyLegend = (color: string, dash?: boolean) => {
    onUpdate({ color, dash: !!dash });
  };

  const isLegendActive = (color: string, dash?: boolean) =>
    edge.color.toLowerCase() === color.toLowerCase() && !!edge.dash === !!dash;

  return (
    <div className="edge-editor-panel" role="region" aria-label="Editar enlace">
      <div className="edge-editor-header">
        <div>
          <span className="edge-editor-title">Enlace seleccionado</span>
          <p className="edge-editor-route">
            {fromTitle} → {toTitle}
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <label className="toolbar-field edge-editor-label-field">
        Etiqueta en la flecha
        <input
          value={edge.label ?? ""}
          onChange={(e) =>
            onUpdate({ label: e.target.value.trim() || undefined })
          }
          placeholder="Opcional"
        />
      </label>

      <fieldset className="edge-editor-styles">
        <legend>Estilo (referencias del flujo)</legend>
        <div className="edge-style-grid">
          {EDGE_LEGEND_ITEMS.map((item) => (
            <button
              key={`${item.color}-${item.dash ?? false}`}
              type="button"
              className={`edge-style-btn${isLegendActive(item.color, item.dash) ? " active" : ""}`}
              title={item.label}
              onClick={() => applyLegend(item.color, item.dash)}
            >
              <span
                className={`edge-style-line${item.dash ? " edge-style-line--dash" : ""}`}
                style={{ "--legend-color": item.color } as CSSProperties}
              />
              <span className="edge-style-name">{item.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <label className="edge-editor-dash">
        <input
          type="checkbox"
          checked={!!edge.dash}
          onChange={(e) => onUpdate({ dash: e.target.checked })}
        />
        Línea punteada
      </label>

      <button type="button" className="btn btn-danger" onClick={onDelete}>
        Borrar enlace
      </button>
    </div>
  );
}
