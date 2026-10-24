import type { ReactNode } from "react";

export function StatusBadge({ children, tone = "muted" }: { children: ReactNode; tone?: "cyan" | "amber" | "crimson" | "muted" }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}
