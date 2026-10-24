import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, Code2, Database, ShieldCheck } from "lucide-react";
import { BrandMark, Eyebrow } from "@/components/resonance-ui";

export const metadata: Metadata = {
  title: "Developers — RESONANCE",
  description: "Protocol boundaries, application APIs, and Solana integration notes for RESONANCE developers.",
};

const endpoints = [
  ["GET", "/api/health", "Liveness and explicit service status"],
  ["GET", "/api/events", "Application verification requests"],
  ["GET", "/api/witnesses/:id", "Witness profile and reputation metadata"],
  ["GET", "/api/ai/alerts", "Advisory alerts; never final authority"],
  ["POST", "/api/attestations/:id", "Demo simulation or unsigned transaction preparation"],
];

export default function DevelopersPage() {
  return (
    <main className="console-shell" style={{ minHeight: "100svh", display: "block", padding: "0 28px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 0 72px" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap", borderBottom: "1px solid var(--line)", paddingBottom: 22 }}>
          <Link href="/" aria-label="RESONANCE home"><BrandMark /></Link>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className="status-badge status-badge--amber">PHASE 0–3</span>
            <Link className="quiet-button quiet-button--dark" href="/dashboard">Open console <ArrowUpRight size={14} /></Link>
          </div>
        </header>

        <section style={{ maxWidth: 760, padding: "72px 0 48px" }}>
          <Eyebrow tone="copper">DEVELOPER SURFACE</Eyebrow>
          <h1 style={{ margin: "18px 0 0", fontFamily: "var(--display)", fontSize: "clamp(48px, 7vw, 86px)", lineHeight: 0.94, letterSpacing: "-0.08em" }}>Build against the boundary, not the demo.</h1>
          <p style={{ margin: "28px 0 0", maxWidth: 650, color: "var(--ivory-soft)", fontSize: 17, lineHeight: 1.7 }}>RESONANCE separates application workflow from protocol state. Use the REST API for requests, witnesses, evidence metadata, and advisory analysis; use the wallet-signed Solana boundary only when a configured real adapter and RPC confirmation exist.</p>
        </section>

        <section className="network-explorer-grid" aria-label="Protocol boundaries">
          <article className="instrument-panel" style={{ padding: 24 }}>
            <BookOpenCheck size={20} color="var(--cyan)" />
            <h2 style={{ margin: "18px 0 10px" }}>Source-of-truth map</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>PostgreSQL owns application records and workflow. Evidence storage owns raw artifacts. Solana owns compact commitments and protocol lifecycle only after a caller signs and RPC confirms.</p>
          </article>
          <article className="instrument-panel" style={{ padding: 24 }}>
            <ShieldCheck size={20} color="var(--cyan)" />
            <h2 style={{ margin: "18px 0 10px" }}>AI boundary</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>AI output is advisory. It can describe observed, inferred, and recommended signals, but it cannot finalize events, slash funds, or mutate protocol state.</p>
          </article>
          <article className="instrument-panel" style={{ padding: 24 }}>
            <Database size={20} color="var(--cyan)" />
            <h2 style={{ margin: "18px 0 10px" }}>Demo boundary</h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>DEMO records are local simulations. Development may fall back when the API is unavailable; production surfaces the API error instead of silently serving mock data.</p>
          </article>
        </section>

        <section className="instrument-panel" style={{ marginTop: 24, padding: 24 }}>
          <div className="panel-head"><div><span className="panel-kicker">REST API</span><h2>Useful starting points</h2></div><Code2 size={20} color="var(--cyan)" /></div>
          <div style={{ display: "grid", gap: 0, marginTop: 18 }}>
            {endpoints.map(([method, path, description]) => <div key={path} style={{ display: "grid", gridTemplateColumns: "70px minmax(180px, 0.8fr) 1fr", gap: 18, padding: "15px 0", borderTop: "1px solid var(--line)", alignItems: "baseline" }}><span className="status-badge status-badge--cyan">{method}</span><strong className="mono" style={{ color: "var(--ivory-soft)", fontSize: 12 }}>{path}</strong><span style={{ color: "var(--muted)", fontSize: 13 }}>{description}</span></div>)}
          </div>
        </section>

        <section style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 28 }}>
          <Link className="arrow-button arrow-button--primary" href="/api/openapi"><span>Open API contract</span><ArrowUpRight size={16} /></Link>
          <Link className="quiet-button quiet-button--dark" href="/network"><span>Inspect network boundary</span><ArrowUpRight size={14} /></Link>
        </section>
      </div>
    </main>
  );
}
