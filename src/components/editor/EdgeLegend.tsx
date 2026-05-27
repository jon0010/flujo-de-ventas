import type { CSSProperties } from "react";
import { EDGE_LEGEND_ITEMS } from "../../data/edgeLegend";

export function EdgeLegend() {
  return (
    <div className="edge-legend" aria-label="Leyenda de conexiones">
      <span className="edge-legend-title">Referencias del flujo</span>
      <ul className="edge-legend-list">
        {EDGE_LEGEND_ITEMS.map((item) => (
          <li key={`${item.color}-${item.dash ?? false}`}>
            <span
              className={`edge-legend-line${item.dash ? " edge-legend-line--dash" : ""}`}
              style={{ "--legend-color": item.color } as CSSProperties}
            />
            <span className="edge-legend-text">{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
