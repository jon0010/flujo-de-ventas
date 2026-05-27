import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AppShell({ children, title, subtitle, actions }: Props) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-kicker">CEO Digital · Flujos de venta</p>
          {title && <h1 className="app-title">{title}</h1>}
          {subtitle && <p className="app-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="app-actions">{actions}</div>}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
