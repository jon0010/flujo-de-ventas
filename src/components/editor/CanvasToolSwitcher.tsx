import type { CanvasTool } from "../../types/canvas";

type Props = {
  tool: CanvasTool;
  onChange: (tool: CanvasTool) => void;
};

export function CanvasToolSwitcher({ tool, onChange }: Props) {
  return (
    <div className="canvas-tool-switcher" role="group" aria-label="Herramienta del cursor">
      <button
        type="button"
        className={`canvas-tool-btn${tool === "select" ? " active" : ""}`}
        aria-pressed={tool === "select"}
        title="Seleccionar (V)"
        onClick={() => onChange("select")}
      >
        <span className="canvas-tool-icon" aria-hidden>
          ↖
        </span>
        Seleccionar
      </button>
      <button
        type="button"
        className={`canvas-tool-btn${tool === "pan" ? " active" : ""}`}
        aria-pressed={tool === "pan"}
        title="Mover pizarra (H)"
        onClick={() => onChange("pan")}
      >
        <span className="canvas-tool-icon canvas-tool-icon--hand" aria-hidden>
          ✋
        </span>
        Mover
      </button>
    </div>
  );
}
