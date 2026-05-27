import { useLayoutEffect, useMemo, useRef } from "react";
import type { FlowEdge, FlowNode } from "../../types/flow";
import { computeEdgeLabelPositions, edgePath, nodeCenter } from "../../utils/geometry";
import { EdgeLabelBadge } from "./EdgeLabelBadge";

type Props = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedEdgeId: string | null;
  interactive: boolean;
  onSelectEdge: (edgeId: string) => void;
};

export function FlowEdgesLayer({
  nodes,
  edges,
  selectedEdgeId,
  interactive,
  onSelectEdge,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const paths = useMemo(() => {
    return edges
      .map((edge) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        return { edge, from, to };
      })
      .filter(Boolean) as {
      edge: FlowEdge;
      from: FlowNode;
      to: FlowNode;
    }[];
  }, [edges, nodeMap]);

  const labelPositions = useMemo(() => {
    const inputs = paths
      .filter((p) => p.edge.label)
      .map(({ edge, from, to }, index) => {
        const f = nodeCenter(from);
        const t = nodeCenter(to);
        return {
          index,
          fx: f.x,
          fy: f.y,
          tx: t.x,
          ty: t.y,
          label: edge.label!,
        };
      });
    return computeEdgeLabelPositions(inputs);
  }, [paths]);

  const labelIndexByEdgeId = useMemo(() => {
    const map = new Map<string, number>();
    let i = 0;
    paths.forEach((p) => {
      if (p.edge.label) {
        map.set(p.edge.id, i);
        i += 1;
      }
    });
    return map;
  }, [paths]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    paths.forEach(({ edge, from, to }) => {
      const fromEl = document.getElementById(`node-${from.id}`);
      const toEl = document.getElementById(`node-${to.id}`);
      const f = nodeCenter(from, fromEl);
      const t = nodeCenter(to, toEl);
      const d = edgePath(f.x, f.y, t.x, t.y);

      svg.querySelector(`#edge-path-${edge.id}`)?.setAttribute("d", d);
      svg.querySelector(`#edge-hit-${edge.id}`)?.setAttribute("d", d);
    });
  }, [paths, nodes]);

  return (
    <svg ref={svgRef} className="flow-edges" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path
            d="M2 1L8 5L2 9"
            fill="none"
            stroke="context-stroke"
            strokeWidth="1.5"
          />
        </marker>
      </defs>
      {paths.map(({ edge, from, to }) => {
        const f = nodeCenter(from);
        const t = nodeCenter(to);
        const d = edgePath(f.x, f.y, t.x, t.y);
        const isSelected = selectedEdgeId === edge.id;
        const labelIdx = labelIndexByEdgeId.get(edge.id);
        const labelPos =
          edge.label && labelIdx != null
            ? labelPositions.get(labelIdx)
            : null;

        return (
          <g key={edge.id}>
            <path
              id={`edge-hit-${edge.id}`}
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={16}
              className="edge-hit"
              style={{ pointerEvents: interactive ? "stroke" : "none" }}
              onClick={(e) => {
                if (!interactive) return;
                e.stopPropagation();
                onSelectEdge(edge.id);
              }}
            />
            <path
              id={`edge-path-${edge.id}`}
              d={d}
              fill="none"
              stroke={edge.color}
              strokeWidth={isSelected ? 3.5 : 2}
              strokeDasharray={edge.dash ? "6 4" : undefined}
              markerEnd="url(#arrowhead)"
              className={["edge-path", isSelected && "edge-selected"]
                .filter(Boolean)
                .join(" ")}
              pointerEvents="none"
            />
            {edge.label && labelPos && (
              <EdgeLabelBadge x={labelPos.x} y={labelPos.y} label={edge.label} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
