import { useLayoutEffect, useRef, useState } from "react";

const PAD_X = 10;
const PAD_Y = 5;

type Props = {
  x: number;
  y: number;
  label: string;
};

export function EdgeLabelBadge({ x, y, label }: Props) {
  const textRef = useRef<SVGTextElement>(null);
  const [size, setSize] = useState({ w: 48, h: 22 });

  useLayoutEffect(() => {
    const textEl = textRef.current;
    if (!textEl) return;
    const bbox = textEl.getBBox();
    setSize({
      w: Math.ceil(bbox.width) + PAD_X * 2,
      h: Math.max(22, Math.ceil(bbox.height) + PAD_Y * 2),
    });
  }, [label]);

  return (
    <g className="edge-label-group" pointerEvents="none">
      <rect
        x={x - size.w / 2}
        y={y - size.h / 2}
        width={size.w}
        height={size.h}
        rx={6}
        className="edge-label-bg"
      />
      <text
        ref={textRef}
        x={x}
        y={y}
        className="edge-label"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}
