import { useEffect, useState } from "react";
import { Dashboard } from "./components/dashboard/Dashboard";
import { FlowEditor } from "./components/editor/FlowEditor";

type View =
  | { kind: "dashboard" }
  | { kind: "editor"; flowId: string };

const VIEW_STORAGE_KEY = "ceo-flow-view";

function readStoredView(): View {
  try {
    const raw = sessionStorage.getItem(VIEW_STORAGE_KEY);
    if (!raw) return { kind: "dashboard" };
    const parsed = JSON.parse(raw) as View;
    if (parsed.kind === "editor" && typeof parsed.flowId === "string") {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return { kind: "dashboard" };
}

export default function App() {
  const [view, setView] = useState<View>(readStoredView);

  useEffect(() => {
    sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
  }, [view]);

  if (view.kind === "editor") {
    return (
      <FlowEditor
        flowId={view.flowId}
        onBack={() => setView({ kind: "dashboard" })}
      />
    );
  }

  return (
    <Dashboard onOpenFlow={(flowId) => setView({ kind: "editor", flowId })} />
  );
}
