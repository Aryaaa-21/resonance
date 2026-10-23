import { AlertTriangle, Inbox, LoaderCircle, RotateCcw } from "lucide-react";
import Link from "next/link";

type DataStateProps = {
  kind: "loading" | "empty" | "error" | "disabled";
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onRetry?: () => void;
};

const iconMap = {
  loading: LoaderCircle,
  empty: Inbox,
  error: AlertTriangle,
  disabled: AlertTriangle,
};

export function DataState({ kind, title, description, actionLabel, actionHref, onRetry }: DataStateProps) {
  const Icon = iconMap[kind];
  return (
    <section className={`data-state data-state--${kind}`} aria-live={kind === "loading" ? "polite" : "assertive"}>
      <span className="data-state__icon"><Icon size={20} aria-hidden="true" /></span>
      <span className="data-state__copy"><strong>{title}</strong><span>{description}</span></span>
      {actionLabel && actionHref ? <Link className="quiet-button quiet-button--dark" href={actionHref}>{actionLabel}</Link> : null}
      {actionLabel && onRetry ? <button className="quiet-button quiet-button--dark" onClick={onRetry}><RotateCcw size={14} />{actionLabel}</button> : null}
    </section>
  );
}
