import type { CSSProperties } from "react";
import type { Flow } from "../../types/flow";

type Props = {
  flow: Flow;
  onOpen: () => void;
  onDelete?: () => void;
};

export function FlowCard({ flow, onOpen, onDelete }: Props) {
  const nodeCount = flow.nodes.length;
  const edgeCount = flow.edges.length;
  return (
    <article
      className="flow-card"
      style={{ "--flow-accent": flow.color } as CSSProperties}
    >
      <div className="flow-card-accent" />
      <div className="flow-card-body">
        <h3 className="flow-card-title">{flow.name}</h3>
        <p className="flow-card-desc">
          {flow.description || "Sin descripción"}
        </p>
        <dl className="flow-card-stats">
          <div>
            <dt>Nodos</dt>
            <dd>{nodeCount}</dd>
          </div>
          <div>
            <dt>Enlaces</dt>
            <dd>{edgeCount}</dd>
          </div>
        </dl>
        <footer className="flow-card-footer">
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            Abrir flujo
          </button>
          {onDelete && (
            <button
              type="button"
              className="btn btn-ghost btn-danger"
              onClick={onDelete}
              aria-label={`Eliminar ${flow.name}`}
            >
              Eliminar
            </button>
          )}
        </footer>
      </div>
    </article>
  );
}
