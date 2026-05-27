export type EdgeLegendItem = {
  color: string;
  dash?: boolean;
  label: string;
};

/** Significado de los colores y estilos de las conexiones del flujo. */
export const EDGE_LEGEND_ITEMS: EdgeLegendItem[] = [
  { color: "#378ADD", label: "Actores y derivación de cliente" },
  { color: "#E88A20", label: "Proceso de ventas" },
  { color: "#BA7517", label: "Recordatorios y seguimiento" },
  { color: "#1D9E75", label: "Avance positivo / cierre exitoso" },
  { color: "#7F77DD", label: "Estados y hitos del proyecto" },
  { color: "#E24B4A", dash: true, label: "Cancelación o camino alternativo" },
];
