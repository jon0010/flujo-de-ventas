import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { EyeIcon } from "../icons/EyeIcon";
import { toast } from "../../lib/toast";
import {
  EMPTY_EMAIL_NOTIFICATION,
  hasEmailNotificationDraft,
  isEmailNotificationComplete,
  NODE_TYPE_LABELS,
  type FlowNode,
  type NodeEmailNotification,
} from "../../types/flow";
import { clampNodePosition, clientToBoardPoint } from "../../utils/boardCoords";
import {
  NodeEmailNotificationModal,
  type EmailModalDraft,
} from "./NodeEmailNotificationModal";

type Props = {
  node: FlowNode;
  selected: boolean;
  connectSource: boolean;
  connectTarget: boolean;
  connectMode: boolean;
  interactive: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onUpdate: (patch: Partial<FlowNode>, immediate?: boolean) => void;
};

export function FlowNodeCard({
  node,
  selected,
  connectSource,
  connectTarget,
  connectMode,
  interactive,
  onSelect,
  onMove,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [editingOrder, setEditingOrder] = useState(false);
  const [draft, setDraft] = useState({ title: node.title, sub: node.sub });
  const [orderDraft, setOrderDraft] = useState("");
  const [emailModal, setEmailModal] = useState<"edit" | "view" | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });

  const email = node.emailNotification;
  const emailRequired = isEmailNotificationComplete(email);
  const emailDraft = hasEmailNotificationDraft(email);
  const emailOptIn =
    emailRequired || emailDraft || emailModal === "edit";
  const emailIncomplete = emailDraft && !emailRequired;

  useEffect(() => {
    if (!editing) {
      setDraft({ title: node.title, sub: node.sub });
    }
  }, [node.title, node.sub, editing]);

  const startEditing = () => {
    setDraft({ title: node.title, sub: node.sub });
    setEditing(true);
  };

  const commitEditing = () => {
    setEditing(false);
    onUpdate({
      title: draft.title.trim() || "Sin título",
      sub: draft.sub,
    });
  };

  const startOrderEditing = (e: MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;
    setOrderDraft(
      node.stepOrder != null && node.stepOrder > 0 ? String(node.stepOrder) : "",
    );
    setEditingOrder(true);
  };

  const commitOrderEditing = () => {
    const trimmed = orderDraft.trim();
    if (!trimmed) {
      onUpdate({ stepOrder: undefined }, true);
      setEditingOrder(false);
      return;
    }
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error("El orden debe ser un número entero mayor que 0");
      setEditingOrder(false);
      return;
    }
    onUpdate({ stepOrder: parsed }, true);
    setEditingOrder(false);
  };

  const cancelOrderEditing = () => {
    setEditingOrder(false);
    setOrderDraft("");
  };

  const handleContainerBlur = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (cardRef.current?.contains(next)) return;
    commitEditing();
  };

  const stopPointer = (e: PointerEvent) => {
    e.stopPropagation();
  };

  const persistEmail = (value: NodeEmailNotification, immediate = true) => {
    const complete = isEmailNotificationComplete(value);
    onUpdate(
      {
        emailNotification: {
          recipient: value.recipient.trim(),
          notifyAbout: value.notifyAbout.trim(),
          email: value.email.trim(),
          enabled: complete,
        },
      },
      immediate,
    );
  };

  const saveEmail = (value: NodeEmailNotification) => {
    persistEmail(value, true);
  };

  const saveEmailDraft = (draft: EmailModalDraft) => {
    if (
      !draft.recipient.trim() &&
      !draft.notifyAbout.trim() &&
      !draft.email.trim()
    ) {
      return;
    }
    persistEmail(
      {
        enabled: false,
        recipient: draft.recipient,
        notifyAbout: draft.notifyAbout,
        email: draft.email,
      },
      true,
    );
  };

  const disableEmail = () => {
    onUpdate({ emailNotification: { ...EMPTY_EMAIL_NOTIFICATION } }, true);
  };

  const closeEmailModal = (draft?: EmailModalDraft) => {
    if (emailModal === "edit" && draft) saveEmailDraft(draft);
    setEmailModal(null);
  };

  const openEmailView = () => {
    if (!interactive) return;
    setEmailModal("view");
  };

  const handleEmailCheckChange = (checked: boolean) => {
    if (!interactive) return;

    if (checked) {
      toast("¿Activar notificación por email?", {
        description: `Configurarás los datos de envío para «${node.title}».`,
        action: {
          label: "Sí, activar",
          onClick: () => setEmailModal("edit"),
        },
        cancel: {
          label: "Cancelar",
          onClick: () => {},
        },
      });
      return;
    }

    toast("¿Quitar la notificación por email?", {
      description: emailDraft
        ? "Se borrarán los datos configurados en este nodo."
        : `«${node.title}» dejará de requerir notificación por email.`,
      action: {
        label: "Sí, quitar",
        onClick: () => disableEmail(),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  };

  const boardPointFromEvent = (e: PointerEvent) => {
    const el = cardRef.current;
    if (!el) return { x: node.x, y: node.y };
    return clientToBoardPoint(e.clientX, e.clientY, el);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!interactive || editing || editingOrder || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (
      target.closest(".node-email-controls") ||
      target.closest(".node-order-badge")
    ) {
      return;
    }

    const pt = boardPointFromEvent(e);
    dragRef.current = {
      active: true,
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect();
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragRef.current.active) return;
    const pt = boardPointFromEvent(e);
    const next = clampNodePosition(
      pt.x - dragRef.current.offsetX,
      pt.y - dragRef.current.offsetY,
    );
    onMove(next.x, next.y);
  };

  const onPointerUp = (e: PointerEvent) => {
    dragRef.current.active = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const className = [
    "node",
    node.type,
    selected && "selected",
    editing && "node-editing",
    emailIncomplete && "node-email-incomplete",
    node.stepOrder != null && node.stepOrder > 0 && "node-has-step-order",
    connectSource && "node-connect-source",
    connectTarget && "node-connect-target",
    connectMode && !connectSource && !connectTarget && "node-connect-candidate",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        ref={cardRef}
        id={`node-${node.id}`}
        className={className}
        style={{ left: node.x, top: node.y }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!interactive) return;
          if ((e.target as HTMLElement).closest(".node-order-badge")) return;
          startEditing();
        }}
        onBlur={editing ? handleContainerBlur : undefined}
      >
        <button
          type="button"
          className={`node-order-badge${
            node.stepOrder == null || node.stepOrder < 1
              ? " node-order-badge--unset"
              : ""
          }`}
          title="Doble clic para editar el orden del proceso (PDF)"
          onPointerDown={stopPointer}
          onDoubleClick={startOrderEditing}
          onClick={(e) => e.stopPropagation()}
        >
          {editingOrder ? (
            <input
              className="node-order-input"
              type="number"
              min={1}
              step={1}
              value={orderDraft}
              onChange={(e) => setOrderDraft(e.target.value)}
              onBlur={commitOrderEditing}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitOrderEditing();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelOrderEditing();
                }
              }}
              onPointerDown={stopPointer}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className="node-order-label">
              {node.stepOrder != null && node.stepOrder > 0
                ? node.stepOrder
                : "—"}
            </span>
          )}
        </button>

        <span className="type-pill">{NODE_TYPE_LABELS[node.type]}</span>
        {editing ? (
          <div className="node-edit-fields" onPointerDown={stopPointer}>
            <input
              className="node-edit-title"
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const nextInput = e.currentTarget.nextElementSibling as
                    | HTMLInputElement
                    | null;
                  nextInput?.focus();
                }
                if (e.key === "Escape") {
                  setDraft({ title: node.title, sub: node.sub });
                  setEditing(false);
                }
              }}
              autoFocus
            />
            <input
              className="node-edit-sub"
              value={draft.sub}
              onChange={(e) => setDraft((d) => ({ ...d, sub: e.target.value }))}
              placeholder="Descripción..."
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft({ title: node.title, sub: node.sub });
                  setEditing(false);
                }
                if (e.key === "Enter") commitEditing();
              }}
            />
          </div>
        ) : (
          <>
            <div className="nt">{node.title}</div>
            {node.sub && <div className="ns">{node.sub}</div>}
          </>
        )}

        {interactive && !editing && (
          <div
            className={`node-email-controls${
              emailRequired
                ? " node-email-controls--required"
                : emailIncomplete
                  ? " node-email-controls--incomplete"
                  : " node-email-controls--not-required"
            }`}
            onPointerDown={stopPointer}
          >
            <label className="node-email-controls__check">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => handleEmailCheckChange(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
              />
              <span>
                {emailRequired
                  ? "Requiere notificación por email"
                  : emailIncomplete
                    ? "Notificación incompleta"
                    : "No requiere notificación por email"}
              </span>
            </label>
            <button
              type="button"
              className="node-email-view-btn"
              title={
                emailDraft
                  ? "Ver notificación por email"
                  : "Sin datos de notificación"
              }
              disabled={!emailDraft}
              aria-label="Ver notificación por email"
              onClick={(e) => {
                e.stopPropagation();
                openEmailView();
              }}
            >
              <EyeIcon size={15} />
            </button>
          </div>
        )}
      </div>

      <NodeEmailNotificationModal
        open={emailModal !== null}
        nodeTitle={node.title}
        initial={email}
        readOnly={emailModal === "view"}
        onClose={closeEmailModal}
        onRequestEdit={
          emailModal === "view" ? () => setEmailModal("edit") : undefined
        }
        onSave={saveEmail}
        onDisable={disableEmail}
      />
    </>
  );
}
