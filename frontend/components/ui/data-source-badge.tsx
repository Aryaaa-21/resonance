import type { DataSourceMetadata } from "@/lib/api";

export function DataSourceBadge({ source, compact = false }: { source: DataSourceMetadata | null; compact?: boolean }) {
  if (!source) return null;

  const label = source.kind === "demo"
    ? source.fallbackReason === "backend-unavailable" ? "DEMO · API UNAVAILABLE" : "DEMO"
    : "API";
  const className = source.kind === "demo" ? "demo-badge" : "status-badge status-badge--cyan";
  const title = source.fallbackReason === "demo-mode"
    ? "Phase 1 demo data is enabled by NEXT_PUBLIC_DEMO_MODE=true."
    : source.fallbackReason === "backend-unavailable"
      ? "The development backend was unavailable, so the Phase 1 mock adapter is serving this view."
      : "Data loaded from the configured RESONANCE API.";

  return (
    <span className={className} title={title} aria-label={title}>
      <span className={source.kind === "demo" ? "demo-badge__dot" : "network-status__dot"} />
      {label}
    </span>
  );
}
