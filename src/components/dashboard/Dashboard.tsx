import { useState } from "react";
import { toast } from "../../lib/toast";
import { AppShell } from "../layout/AppShell";
import { useFlows } from "../../hooks/useFlows";
import { FlowCard } from "./FlowCard";
import { CreateFlowDialog } from "./CreateFlowDialog";

type Props = {
  canEdit: boolean;
  onOpenFlow: (id: string) => void;
  onLogout: () => void;
};

export function Dashboard({ canEdit, onOpenFlow, onLogout }: Props) {
  const { flows, loading, createFlow, deleteFlow } = useFlows();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = (id: string, name: string) => {
    toast(`¿Eliminar "${name}"?`, {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: () => {
          toast.promise(deleteFlow(id), {
            loading: "Eliminando flujo…",
            success: "Flujo eliminado",
            error: (e) =>
              e instanceof Error ? e.message : "No se pudo eliminar el flujo",
          });
        },
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  };

  return (
    <AppShell
      title="Dashboard de flujos"
      subtitle="Crea, organiza y visualiza cada proceso de venta."
      actions={
        <>
          {canEdit && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setDialogOpen(true)}
            >
              + Nuevo flujo
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            Cerrar sesión
          </button>
        </>
      }
    >
      {loading ? (
        <p className="muted">Cargando flujos…</p>
      ) : flows.length === 0 ? (
        <div className="empty-state">
          <p>No hay flujos todavía.</p>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canEdit}
            onClick={() => setDialogOpen(true)}
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="flow-grid">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              onOpen={() => onOpenFlow(flow.id)}
              onDelete={
                canEdit ? () => handleDelete(flow.id, flow.name) : undefined
              }
            />
          ))}
        </div>
      )}

      {canEdit && (
        <CreateFlowDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onCreate={createFlow}
        />
      )}
    </AppShell>
  );
}
