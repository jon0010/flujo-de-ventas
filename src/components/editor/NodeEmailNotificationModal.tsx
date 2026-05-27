import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { GmailIcon } from "../icons/GmailIcon";
import {
  hasEmailNotificationDraft,
  type NodeEmailNotification,
} from "../../types/flow";

export type EmailModalDraft = Pick<
  NodeEmailNotification,
  "recipient" | "notifyAbout" | "email"
>;

type Props = {
  open: boolean;
  nodeTitle: string;
  initial: NodeEmailNotification | undefined;
  readOnly?: boolean;
  onClose: (draft?: EmailModalDraft) => void;
  onRequestEdit?: () => void;
  onSave: (value: NodeEmailNotification) => void;
  onDisable?: () => void;
};

function syncFieldsFromInitial(initial: NodeEmailNotification | undefined) {
  return {
    recipient: initial?.recipient ?? "",
    notifyAbout: initial?.notifyAbout ?? "",
    email: initial?.email ?? "",
  };
}

export function NodeEmailNotificationModal({
  open,
  nodeTitle,
  initial,
  readOnly = false,
  onClose,
  onRequestEdit,
  onSave,
  onDisable,
}: Props) {
  const [recipient, setRecipient] = useState("");
  const [notifyAbout, setNotifyAbout] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = syncFieldsFromInitial(initial);
    setRecipient(next.recipient);
    setNotifyAbout(next.notifyAbout);
    setEmail(next.email);
  }, [open, readOnly]);

  if (!open) return null;

  const draft: EmailModalDraft = { recipient, notifyAbout, email };
  const hasStoredData = hasEmailNotificationDraft(initial);

  const requestClose = () => {
    if (readOnly) onClose();
    else onClose(draft);
  };
  const closeAfterSave = () => onClose();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onSave({
      enabled: true,
      recipient: recipient.trim(),
      notifyAbout: notifyAbout.trim(),
      email: email.trim(),
    });
    closeAfterSave();
  };

  const content = (
    <div
      className="modal-backdrop modal-backdrop--node-email"
      role="presentation"
      onClick={requestClose}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="modal email-notify-modal"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="email-notify-title"
      >
        <header className="email-notify-header">
          <GmailIcon size={32} />
          <div>
            <h2 id="email-notify-title">Notificación por email</h2>
            <p className="email-notify-node">{nodeTitle}</p>
          </div>
        </header>

        {readOnly ? (
          <>
            {hasStoredData ? (
              <dl className="email-notify-view">
                <div>
                  <dt>A quién</dt>
                  <dd>{initial?.recipient?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt>Qué se notifica</dt>
                  <dd>{initial?.notifyAbout?.trim() || "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    {initial?.email?.trim() ? (
                      <a href={`mailto:${initial.email.trim()}`}>
                        {initial.email.trim()}
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="email-notify-empty">
                No hay datos de notificación configurados.
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={closeAfterSave}>
                Cerrar
              </button>
              {onRequestEdit && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onRequestEdit}
                >
                  {hasStoredData ? "Editar" : "Configurar"}
                </button>
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <label>
              ¿A quién notificamos?
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Ej. Cliente, Bradley, equipo técnico…"
                required
              />
            </label>
            <label>
              ¿Qué le notificamos?
              <textarea
                value={notifyAbout}
                onChange={(e) => setNotifyAbout(e.target.value)}
                placeholder="Ej. Recordatorio para completar el briefing"
                rows={3}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </label>

            <div className="modal-actions">
              {onDisable && hasEmailNotificationDraft(initial) && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    onDisable();
                    closeAfterSave();
                  }}
                >
                  Borrar
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={requestClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
