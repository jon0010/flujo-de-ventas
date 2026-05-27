import { useState } from "react";
import { toast } from "../../lib/toast";
import { AppShell } from "../layout/AppShell";
import { useFlows } from "../../hooks/useFlows";
import { FlowCard } from "./FlowCard";
import { CreateFlowDialog } from "./CreateFlowDialog";

type Props = {
  onOpenFlow: (id: string) => void;
};

export function Dashboard({ onOpenFlow }: Props) {
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
      },
    });
  };

  return (
    <AppShell
      title="Dashboard de flujos"
      subtitle="Crea, organiza y visualiza cada proceso de venta."
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setDialogOpen(true)}
        >
          + Nuevo flujo
        </button>
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
              onDelete={() => handleDelete(flow.id, flow.name)}
            />
          ))}
        </div>
      )}

      <CreateFlowDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={createFlow}
      />
    </AppShell>
  );
}
