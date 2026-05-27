import type { FlowNode } from "../types/flow";

const NODE_W = 260;
const NODE_H = 100;

export function nodeCenter(n: FlowNode, el?: HTMLElement | null) {
  if (el) {
    return {
      x: n.x + el.offsetWidth / 2,
      y: n.y + el.offsetHeight / 2,
    };
  }
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
}

/** Trayectoria recta entre dos puntos. */
export function edgePath(fx: number, fy: number, tx: number, ty: number) {
  return `M${fx},${fy} L${tx},${ty}`;
}

/** @deprecated Usa edgePath */
export const curvedPath = edgePath;

type LabelInput = {
  index: number;
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  label: string;
};

type Rect = { x: number; y: number; w: number; h: number };

function rectsOverlap(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function lineMidpoint(fx: number, fy: number, tx: number, ty: number) {
  return { x: (fx + tx) / 2, y: (fy + ty) / 2 };
}

function lineNormal(fx: number, fy: number, tx: number, ty: number) {
  const dx = tx - fx;
  const dy = ty - fy;
  const len = Math.hypot(dx, dy) || 1;
  return { nx: -dy / len, ny: dx / len };
}

/** Posiciona etiquetas con offset perpendicular y evita solapamientos. */
export function computeEdgeLabelPositions(items: LabelInput[]) {
  const positions = new Map<number, { x: number; y: number }>();
  const placed: Rect[] = [];

  const sorted = [...items].sort((a, b) => {
    const midA = (a.fx + a.tx) / 2;
    const midB = (b.fx + b.tx) / 2;
    return midA - midB || (a.fy + a.ty) / 2 - (b.fy + b.ty) / 2;
  });

  for (const item of sorted) {
    const mid = lineMidpoint(item.fx, item.fy, item.tx, item.ty);
    let { nx, ny } = lineNormal(item.fx, item.fy, item.tx, item.ty);
    const { w, h } = measureLabelBox(item.label);

    let placedLabel = false;
    for (let attempt = 0; attempt < 8 && !placedLabel; attempt++) {
      const side = attempt >= 4 ? -1 : 1;
      const layer = Math.floor(attempt / 2) % 2;
      const offset = (34 + layer * 26 + (attempt % 2) * 12) * side;
      const x = mid.x + nx * offset;
      const y = mid.y + ny * offset;
      const box: Rect = { x: x - w / 2, y: y - h / 2, w, h };

      if (!placed.some((p) => rectsOverlap(box, p))) {
        positions.set(item.index, { x, y });
        placed.push(box);
        placedLabel = true;
      }

      if (attempt === 3) {
        nx *= -1;
        ny *= -1;
      }
    }

    if (!placedLabel) {
      positions.set(item.index, {
        x: mid.x + nx * 48,
        y: mid.y + ny * 48,
      });
    }
  }

  return positions;
}

const LABEL_FONT =
  '500 10px Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureCtx() {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
  return measureCtx;
}

/** Tamaño del tag según el texto (para colisiones y layout previo). */
export function measureLabelBox(text: string) {
  const ctx = getMeasureCtx();
  if (!ctx) {
    return { w: text.length * 6.5 + 20, h: 22 };
  }
  ctx.font = LABEL_FONT;
  const textW = ctx.measureText(text).width;
  const padX = 10;
  const padY = 5;
  return {
    w: Math.ceil(textW) + padX * 2,
    h: Math.max(22, 14 + padY * 2),
  };
}

export function labelBoxWidth(text: string) {
  return measureLabelBox(text).w;
}
