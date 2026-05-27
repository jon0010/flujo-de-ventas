export const BOARD_WIDTH = 5200;
export const BOARD_HEIGHT = 1600;
const NODE_PLACE_W = 260;
const NODE_PLACE_H = 100;

export function getBoardWrap(): HTMLElement | null {
  return document.querySelector(".board-wrap");
}

export function getBoardElement(): HTMLElement | null {
  return document.querySelector(".board");
}

/** Convierte coordenadas del mouse a posición dentro de la pizarra (px). */
export function clientToBoardPoint(
  clientX: number,
  clientY: number,
  fromElement: HTMLElement,
) {
  const board = fromElement.closest(".board") as HTMLElement | null;
  const wrap = fromElement.closest(".board-wrap") as HTMLElement | null;
  if (!board || !wrap) {
    return { x: Math.max(0, clientX), y: Math.max(0, clientY) };
  }
  const rect = board.getBoundingClientRect();
  return {
    x: clientX - rect.left + wrap.scrollLeft,
    y: clientY - rect.top + wrap.scrollTop,
  };
}

export function clampNodePosition(x: number, y: number) {
  return {
    x: Math.min(BOARD_WIDTH - NODE_PLACE_W, Math.max(0, x)),
    y: Math.min(BOARD_HEIGHT - NODE_PLACE_H, Math.max(0, y)),
  };
}

/** Centro del área visible de la pizarra (para crear nodos ahí). */
export function getVisibleBoardCenter() {
  const wrap = getBoardWrap();
  if (!wrap) return { x: 400, y: 300 };
  return clampNodePosition(
    wrap.scrollLeft + wrap.clientWidth / 2 - NODE_PLACE_W / 2,
    wrap.scrollTop + wrap.clientHeight / 2 - NODE_PLACE_H / 2,
  );
}

export function scrollBoardToNode(nodeId: string) {
  const el = document.getElementById(`node-${nodeId}`);
  const wrap = getBoardWrap();
  if (!el || !wrap) return;

  const x = el.offsetLeft;
  const y = el.offsetTop;
  const w = el.offsetWidth || NODE_PLACE_W;
  const h = el.offsetHeight || NODE_PLACE_H;

  wrap.scrollTo({
    left: Math.max(0, x - wrap.clientWidth / 2 + w / 2),
    top: Math.max(0, y - wrap.clientHeight / 2 + h / 2),
    behavior: "smooth",
  });
}
