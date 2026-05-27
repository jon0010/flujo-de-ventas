import { useState, type FormEvent } from "react";
import { toast, toastApiError } from "../../lib/toast";
import { FLOW_COLORS } from "../../types/flow";
import type { CreateFlowInput } from "../../types/flow";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateFlowInput) => Promise<unknown>;
};

export function CreateFlowDialog({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(FLOW_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim(), color });
      setName("");
      setDescription("");
      setColor(FLOW_COLORS[0]);
      toast.success("Flujo creado correctamente");
      onClose();
    } catch (e) {
      toastApiError(e, "No se pudo crear el flujo");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="modal"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="create-flow-title"
      >
        <h2 id="create-flow-title">Nuevo flujo</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Onboarding enterprise"
              required
              autoFocus
            />
          </label>
          <label>
            Descripción
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumen del proceso..."
              rows={3}
            />
          </label>
          <fieldset>
            <legend>Color</legend>
            <div className="color-picker">
              {FLOW_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch${color === c ? " selected" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </fieldset>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Creando…" : "Crear flujo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
