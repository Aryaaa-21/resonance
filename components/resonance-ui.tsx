"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Check, CircleAlert, CircleDashed, CircleDot, LockKeyhole, RadioTower } from "lucide-react";
import type { EventState } from "./resonance-data";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand brand--compact" : "brand"} aria-label="RESONANCE home">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-mark__core" />
        <span className="brand-mark__ring brand-mark__ring--one" />
        <span className="brand-mark__ring brand-mark__ring--two" />
      </span>
      {!compact ? <span className="brand-wordmark">RESONANCE</span> : null}
    </span>
  );
}

export function Eyebrow({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "copper" | "cyan" | "amber" }) {
  return <div className={`eyebrow eyebrow--${tone}`}><span className="eyebrow__line" />{children}</div>;
}

export function DemoBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "demo-badge demo-badge--compact" : "demo-badge"}>
      <span className="demo-badge__dot" />
      {compact ? "DEMO" : "DEMO DATA · TESTNET SIMULATION"}
    </span>
  );
}

export function StatusPill({ state, label }: { state: EventState | "active" | "pending" | "offline" | "review"; label?: string }) {
  const icon = state === "verified" || state === "active" ? <Check size={12} strokeWidth={2.4} /> : state === "failed" ? <CircleAlert size={12} /> : state === "challenge" || state === "review" ? <CircleDashed size={12} /> : state === "offline" ? <RadioTower size={12} /> : <CircleDot size={12} />;
  const text = label ?? (state === "verified" ? "Verified" : state === "active" ? "Active" : state === "failed" ? "Failed" : state === "challenge" ? "Challenge" : state === "offline" ? "Offline" : "In review");
  return <span className={`status-pill status-pill--${state}`}>{icon}<span>{text}</span></span>;
}

export function ConfidenceRing({ value, size = 72, tone = "cyan" }: { value: number; size?: number; tone?: "cyan" | "amber" | "crimson" }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className={`confidence-ring confidence-ring--${tone}`} style={{ width: size, height: size }} aria-label={`${value}% confidence`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="confidence-ring__track" cx="36" cy="36" r={radius} />
        <circle className="confidence-ring__value" cx="36" cy="36" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <strong>{value}<small>%</small></strong>
    </div>
  );
}

export function Metric({ label, value, note, tone = "default", icon }: { label: string; value: string; note?: string; tone?: "default" | "cyan" | "copper" | "amber" | "crimson"; icon?: ReactNode }) {
  return (
    <div className={`metric metric--${tone}`}>
      <div className="metric__top"><span className="metric__label">{label}</span>{icon ? <span className="metric__icon">{icon}</span> : null}</div>
      <strong className="metric__value">{value}</strong>
      {note ? <span className="metric__note">{note}</span> : null}
    </div>
  );
}

export function ArrowButton({ children, onClick, variant = "primary", className = "", type = "button" }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string; type?: "button" | "submit" }) {
  return (
    <button className={`arrow-button arrow-button--${variant} ${className}`} onClick={onClick} type={type}>
      <span>{children}</span>
      <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
    </button>
  );
}

export function SectionRule({ label, right }: { label: string; right?: ReactNode }) {
  return <div className="section-rule"><span>{label}</span><span className="section-rule__line" />{right ? <span className="section-rule__right">{right}</span> : null}</div>;
}

export function LockNote({ children }: { children: ReactNode }) {
  return <div className="lock-note"><LockKeyhole size={14} aria-hidden="true" /><span>{children}</span></div>;
}

export function IconTile({ children, tone = "copper" }: { children: ReactNode; tone?: "copper" | "cyan" | "amber" | "crimson" }) {
  return <span className={`icon-tile icon-tile--${tone}`}>{children}</span>;
}

export function MiniSpark({ values, tone = "cyan" }: { values: number[]; tone?: "cyan" | "copper" | "amber" }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const path = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
    const y = 32 - ((value - min) / Math.max(1, max - min)) * 26;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return <svg className={`mini-spark mini-spark--${tone}`} viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden="true"><path d={path} fill="none" vectorEffect="non-scaling-stroke" /></svg>;
}
