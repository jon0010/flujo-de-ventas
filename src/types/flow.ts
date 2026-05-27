export type NodeType = "actor" | "step" | "notif" | "state" | "cancel" | "endok";

export type NodeEmailNotification = {
  enabled: boolean;
  /** A quién se notifica (nombre o rol) */
  recipient: string;
  /** Qué se le notifica */
  notifyAbout: string;
  email: string;
};

export type FlowNode = {
  id: string;
  type: NodeType;
  title: string;
  sub: string;
  x: number;
  y: number;
  /** Orden manual del paso en el proceso (PDF y recorrido). */
  stepOrder?: number;
  emailNotification?: NodeEmailNotification;
};

export const EMPTY_EMAIL_NOTIFICATION: NodeEmailNotification = {
  enabled: false,
  recipient: "",
  notifyAbout: "",
  email: "",
};

/** Solo cuenta como requerida si los tres campos están completos. */
export function isEmailNotificationComplete(
  notification?: NodeEmailNotification,
): boolean {
  if (!notification) return false;
  return Boolean(
    notification.recipient.trim() &&
      notification.notifyAbout.trim() &&
      notification.email.trim(),
  );
}

/** Hay datos guardados o en borrador (aunque no esté completo). */
export function hasEmailNotificationDraft(
  notification?: NodeEmailNotification,
): boolean {
  if (!notification) return false;
  return Boolean(
    notification.recipient.trim() ||
      notification.notifyAbout.trim() ||
      notification.email.trim(),
  );
}

export type FlowEdge = {
  id: string;
  from: string;
  to: string;
  color: string;
  dash?: boolean;
  label?: string;
};

export type FlowReference = {
  id: string;
  title: string;
  url: string;
  note?: string;
};

export type Flow = {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
  references: FlowReference[];
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type CreateFlowInput = Pick<Flow, "name" | "description" | "color">;

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  actor: "Actor",
  step: "Proceso",
  notif: "Notificación",
  state: "Estado",
  cancel: "Cancelación",
  endok: "Resultado",
};

export const FLOW_COLORS = [
  "#378ADD",
  "#1D9E75",
  "#7F77DD",
  "#E88A20",
  "#E24B4A",
  "#BA7517",
] as const;
