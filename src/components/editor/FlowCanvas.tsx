import { useRef, type PointerEvent } from "react";
import type { CanvasTool } from "../../types/canvas";
import type { Flow } from "../../types/flow";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../../utils/boardCoords";
import { FlowNodeCard } from "./FlowNodeCard";
import { FlowEdgesLayer } from "./FlowEdgesLayer";

type Props = {
  flow: Flow;
  tool: CanvasTool;
  editable: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectFromId: string | null;
  connectToId: string | null;
  connectModeLabel: string | null;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onCancelConnect: () => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateNode: (
    id: string,
    patch: Partial<Flow["nodes"][0]>,
    debounced?: boolean,
  ) => void;
};

export function FlowCanvas({
  flow,
  tool,
  editable,
  selectedNodeId,
  selectedEdgeId,
  connectFromId,
  connectToId,
  connectModeLabel,
  onSelectNode,
  onSelectEdge,
  onCancelConnect,
  onMoveNode,
  onUpdateNode,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ active: false, x: 0, y: 0, sl: 0, st: 0 });
  const isSelectTool = tool === "select";
  const isInteractive = isSelectTool && editable;

  const clearSelection = () => {
    if (!isInteractive) return;
    onSelectNode(null);
    onSelectEdge(null);
  };

  const onWrapPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (tool !== "pan" || e.button !== 0) return;
    const el = wrapRef.current;
    if (!el) return;
    panRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      sl: el.scrollLeft,
      st: el.scrollTop,
    };
    el.setPointerCapture(e.pointerId);
    el.classList.add("board-wrap--panning");
  };

  const onWrapPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active || tool !== "pan") return;
    const el = wrapRef.current;
    if (!el) return;
    el.scrollLeft = panRef.current.sl - (e.clientX - panRef.current.x);
    el.scrollTop = panRef.current.st - (e.clientY - panRef.current.y);
  };

  const endPan = (e: PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.active) return;
    panRef.current.active = false;
    const el = wrapRef.current;
    el?.classList.remove("board-wrap--panning");
    if (el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={[
        "board-wrap",
        "board-wrap--fullscreen",
        tool === "pan" && "board-wrap--pan-tool",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={onWrapPointerDown}
      onPointerMove={onWrapPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
    >
      {connectModeLabel && isInteractive && (
        <div className="connect-mode-banner" role="status">
          <span>{connectModeLabel}</span>
          <button type="button" className="btn-link" onClick={onCancelConnect}>
            Cancelar
          </button>
        </div>
      )}
      <div
        className={["board", !isInteractive && "board--non-interactive"]
          .filter(Boolean)
          .join(" ")}
        style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
        onClick={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        <svg
          className="board-bg"
          viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1.5" cy="1.5" r="1.5" fill="#b4b2a9" opacity="0.45" />
            </pattern>
          </defs>
          <rect width={BOARD_WIDTH} height={BOARD_HEIGHT} fill="url(#dots)" />
        </svg>

        <FlowEdgesLayer
          nodes={flow.nodes}
          edges={flow.edges}
          selectedEdgeId={selectedEdgeId}
          interactive={isInteractive}
          onSelectEdge={(id) => onSelectEdge(id)}
        />

        {flow.nodes.map((node) => (
          <FlowNodeCard
            key={node.id}
            node={node}
            interactive={isInteractive}
            selected={selectedNodeId === node.id}
            connectSource={connectFromId === node.id}
            connectTarget={connectToId === node.id}
            connectMode={connectFromId != null || connectToId != null}
            onSelect={() => onSelectNode(node.id)}
            onMove={(x, y) => onMoveNode(node.id, x, y)}
            onUpdate={(patch, immediate) =>
              onUpdateNode(node.id, patch, !immediate)
            }
          />
        ))}
      </div>
    </div>
  );
}
