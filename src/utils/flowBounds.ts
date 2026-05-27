import type { FlowNode } from "../types/flow";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./boardCoords";

const PADDING = 140;
const NODE_ESTIMATE_W = 320;
const NODE_ESTIMATE_H = 160;

/** Región del tablero que ocupan nodos (para recortar la captura). */
export function getNodesBoardBounds(nodes: FlowNode[]) {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: BOARD_WIDTH, height: BOARD_HEIGHT };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + NODE_ESTIMATE_W);
    maxY = Math.max(maxY, n.y + NODE_ESTIMATE_H);
  }

  const x = Math.max(0, minX - PADDING);
  const y = Math.max(0, minY - PADDING);
  const width = Math.min(BOARD_WIDTH - x, maxX - minX + PADDING * 2);
  const height = Math.min(BOARD_HEIGHT - y, maxY - minY + PADDING * 2);

  return { x, y, width, height };
}
