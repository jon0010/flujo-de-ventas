import { useEffect, useState, type FormEvent } from "react";
import { Dashboard } from "./components/dashboard/Dashboard";
import { FlowEditor } from "./components/editor/FlowEditor";

type View =
  | { kind: "dashboard" }
  | { kind: "editor"; flowId: string };

const VIEW_STORAGE_KEY = "ceo-flow-view";
const ACCESS_STORAGE_KEY = "ceo-flow-access";

type AccessRole = "edit" | "view";

type AccessSession = {
  role: AccessRole;
};

const EDIT_PIN = import.meta.env.VITE_EDIT_PIN as string | undefined;
const VIEW_PIN = import.meta.env.VITE_VIEW_PIN as string | undefined;

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
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(ACCESS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AccessSession;
      return parsed?.role === "edit" || parsed?.role === "view" ? parsed : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view));
  }, [view]);

  useEffect(() => {
    if (!access) {
      sessionStorage.removeItem(ACCESS_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(access));
  }, [access]);

  const login = (e: FormEvent) => {
    e.preventDefault();
    if (!EDIT_PIN && !VIEW_PIN) {
      setPinError(
        "No hay PIN configurados. Define VITE_EDIT_PIN y/o VITE_VIEW_PIN en el entorno.",
      );
      return;
    }
    if (EDIT_PIN && pin === EDIT_PIN) {
      setAccess({ role: "edit" });
      setPin("");
      setPinError(null);
      return;
    }
    if (VIEW_PIN && pin === VIEW_PIN) {
      setAccess({ role: "view" });
      setPin("");
      setPinError(null);
      return;
    }
    setPinError("PIN incorrecto.");
  };

  if (!access) {
    return (
      <div className="auth-screen">
        <form className="auth-card" onSubmit={login}>
          <h1>Acceso al editor de flujos</h1>
          <p>Ingresa tu PIN para continuar.</p>
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
            />
          </label>
          {pinError && <p className="auth-error">{pinError}</p>}
          <button type="submit" className="btn btn-primary btn-block">
            Ingresar
          </button>
        </form>
      </div>
    );
  }

  if (view.kind === "editor") {
    return (
      <FlowEditor
        flowId={view.flowId}
        canEdit={access.role === "edit"}
        onBack={() => setView({ kind: "dashboard" })}
        onLogout={() => setAccess(null)}
      />
    );
  }

  return (
    <Dashboard
      canEdit={access.role === "edit"}
      onOpenFlow={(flowId) => setView({ kind: "editor", flowId })}
      onLogout={() => setAccess(null)}
    />
  );
}
