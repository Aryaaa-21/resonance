"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronDown,
  CircleAlert,
  Fingerprint,
  Globe2,
  LockKeyhole,
  MapPin,
  Network,
  Radio,
  ScanLine,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { motion } from "framer-motion";
import VerificationGlobe from "./verification-globe";
import { demoNotice, heroWitnesses, latestEvents, pipelineStages } from "./resonance-data";
import { ArrowButton, BrandMark, ConfidenceRing, DemoBadge, Eyebrow, IconTile, SectionRule, StatusPill } from "./resonance-ui";

type LandingProps = {
  onOpenConsole: (view?: "dashboard" | "request" | "network") => void;
};

const capabilityBlocks = [
  {
    title: "Independent witnesses",
    copy: "Humans, devices, AI agents, and external systems independently verify the same event.",
    icon: Fingerprint,
    tone: "cyan",
    index: "01",
  },
  {
    title: "Economic security boundary",
    copy: "Application surfaces describe stake and challenge inputs; rewards and slashing are not active in this UI.",
    icon: WalletCards,
    tone: "copper",
    index: "02",
  },
  {
    title: "Protocol publication boundary",
    copy: "The adapter can simulate or prepare a wallet-signed transaction; only confirmed RPC state is chain proof.",
    icon: ShieldCheck,
    tone: "cyan",
    index: "03",
  },
  {
    title: "Real-world impact",
    copy: "Build safer logistics, insurance, DePIN, autonomous systems, and agentic workflows.",
    icon: Globe2,
    tone: "amber",
    index: "04",
  },
] as const;

const statItems = [
  { value: "127.4K", label: "events verified", detail: "sample protocol volume" },
  { value: "3.2K", label: "active witnesses", detail: "devices, people, systems" },
  { value: "99.7%", label: "verification accuracy", detail: "rolling testnet signal" },
  { value: "$4.8M", label: "economic value secured", detail: "stake-weighted demo" },
];

export function ResonanceLanding({ onOpenConsole }: LandingProps) {
  const [activeWitness, setActiveWitness] = useState("gps");

  return (
    <div className="marketing-shell">
      <header className="marketing-nav frame" id="top">
        <a className="nav-brand" href="#top" aria-label="RESONANCE home"><BrandMark /></a>
        <nav className="marketing-links" aria-label="Primary navigation">
          <a href="#protocol">Protocol</a>
          <a href="#network">Network</a>
          <a href="#security">Security</a>
          <a href="#proof">Solana proof</a>
        </nav>
        <div className="marketing-actions">
          <span className="network-status"><span className="network-status__dot" /> TESTNET / LIVE</span>
          <button className="text-button" onClick={() => onOpenConsole("dashboard")}>Open console <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
        <button className="mobile-menu-button" aria-label="Open navigation"><span /><span /><span /></button>
      </header>

      <main>
        <section className="hero frame" aria-labelledby="hero-title">
          <div className="hero__copy">
            <Eyebrow tone="copper">REAL-WORLD EVENT VERIFICATION</Eyebrow>
            <h1 id="hero-title" className="hero__title">
              <span>PROVE</span>
              <span>REAL-WORLD</span>
              <span>EVENTS.</span>
            </h1>
            <p className="hero__lede">
              RESONANCE organizes real-world actions into inspectable application records using independent witnesses, evidence, advisory analysis, and an optional Solana boundary.
            </p>
            <div className="hero__actions">
              <ArrowButton onClick={() => onOpenConsole("request")}>Deploy a verification request</ArrowButton>
              <button className="quiet-button" onClick={() => document.getElementById("network")?.scrollIntoView({ behavior: "smooth" })}>
                Explore the network <ArrowDownRight size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="hero__footnote">
              <span className="mono">SYS.01</span>
              <span>Independent observation → evidence → application review → optional protocol publication.</span>
            </div>
          </div>

          <div className="hero__visual">
            <div className="visual-kicker"><span>LIVE PROTOCOL VISUALIZATION</span><DemoBadge compact /></div>
            <div className="hero-globe-wrap">
              <VerificationGlobe witnesses={heroWitnesses} onWitnessSelect={(witness) => setActiveWitness(witness.id)} title="RESONANCE witness network" description="Witness nodes converge around a verified real-world event." />
              <div className="hero-center-readout" aria-live="polite">
                <span className="hero-center-readout__label"><span className="signal-dot signal-dot--cyan" /> DEMO APPLICATION RECORD</span>
                <strong>Delivery completed</strong>
                <span className="hero-center-readout__location">Brooklyn, NY · 10:31:22 UTC</span>
                <div className="hero-center-readout__score"><ConfidenceRing value={96.8} size={48} /><span><small>CONFIDENCE SCORE</small><b>96.8%</b></span></div>
              </div>
              <motion.div className="float-card float-card--gps" animate={{ y: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                <span className="float-card__icon"><MapPin size={14} aria-hidden="true" /></span>
                <span><small>WITNESS</small><b>GPS DEVICE</b><em>Brooklyn, US · 10:31:02</em></span>
              </motion.div>
              <motion.div className="float-card float-card--ai" animate={{ y: [0, 4, 0] }} transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}>
                <span className="float-card__icon float-card__icon--cyan"><Sparkles size={14} aria-hidden="true" /></span>
                <span><small>WITNESS</small><b>AI AGENT</b><em>Analysis complete · 10:31:11</em></span>
              </motion.div>
              <motion.div className="float-card float-card--camera" animate={{ y: [0, -4, 0] }} transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}>
                <span className="float-card__icon float-card__icon--cyan"><Camera size={14} aria-hidden="true" /></span>
                <span><small>WITNESS</small><b>CAMERA</b><em>Image verified · 10:31:08</em></span>
              </motion.div>
              <motion.div className="float-card float-card--recipient" animate={{ y: [0, 5, 0] }} transition={{ duration: 6.3, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}>
                <span className="float-card__icon"><BadgeCheck size={14} aria-hidden="true" /></span>
                <span><small>WITNESS</small><b>RECIPIENT</b><em>Signature confirmed · 10:31:17</em></span>
              </motion.div>
              <div className="active-witness-note">
                <span className="active-witness-note__bar" />
                <span><small>SELECTED WITNESS</small><strong>{activeWitness === "ai" ? "AI agent / anomaly analysis" : activeWitness === "camera" ? "Camera / image evidence" : activeWitness === "recipient" ? "Recipient / signature" : activeWitness === "sensor" ? "Sensor / variance detected" : "GPS device / location"}</strong></span>
              </div>
            </div>
            <div className="visual-caption"><span className="mono">STREAM / 005</span><span>Evidence flows converge. AI assists. Humans and protocol rules decide.</span></div>
          </div>
        </section>

        <section className="stat-strip frame" aria-label="Protocol metrics">
          <div className="stat-strip__intro"><DemoBadge /><span>Illustrative protocol metrics</span></div>
          {statItems.map((stat) => <div className="stat-item" key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span><small>{stat.detail}</small></div>)}
        </section>

        <section className="protocol-section frame" id="protocol" aria-labelledby="protocol-title">
          <div className="section-heading section-heading--split">
            <div><Eyebrow tone="cyan">THE VERIFICATION LOOP</Eyebrow><h2 id="protocol-title">Evidence that can<br /><span>stand on its own.</span></h2></div>
            <p>RESONANCE does not ask one model, device, or institution to be trusted. It makes independent observations legible, challengeable, and economically accountable.</p>
          </div>
          <div className="pipeline" aria-label="Live verification pipeline">
            {pipelineStages.map((stage, index) => (
              <div className={`pipeline-stage pipeline-stage--${stage.state}`} key={stage.label}>
                <div className="pipeline-stage__top"><span className="pipeline-stage__index">0{index + 1}</span><span className="pipeline-stage__state">{stage.state === "active" ? "LIVE" : stage.label === "APPLICATION RECORD" ? "SIMULATION" : "RECORDED"}</span></div>
                <div className="pipeline-stage__node"><span className="pipeline-stage__pulse" /></div>
                <strong>{stage.label}</strong><span>{stage.detail}</span>
                {index < pipelineStages.length - 1 ? <span className="pipeline-stage__connector" aria-hidden="true" /> : null}
              </div>
            ))}
          </div>
          <div className="protocol-callout"><div className="protocol-callout__icon"><Radio size={18} aria-hidden="true" /></div><div><strong>AI is a signal, not a verdict.</strong><p>RESONANCE Intelligence surfaces anomalies and explains its reasoning. Application review remains separate from optional protocol publication.</p></div><span className="protocol-callout__rule" /></div>
        </section>

        <section className="network-section frame" id="network" aria-labelledby="network-title">
          <div className="section-heading section-heading--split"><div><Eyebrow tone="copper">NETWORK OBSERVABILITY</Eyebrow><h2 id="network-title">A living record<br /><span>of what happened.</span></h2></div><p>Every event carries its own evidence trail, witness graph, confidence score, and final proof. Explore the protocol as it sees itself.</p></div>
          <div className="network-grid">
            <div className="live-verification-panel instrument-panel">
              <div className="panel-head"><div><span className="panel-kicker">DEMO APPLICATION RECORD</span><h3>Event #8271</h3></div><StatusPill state="review" label="Simulation" /></div>
              <div className="event-signal"><div className="event-signal__mark"><span /><span /><span /></div><div><strong>Delivery completed</strong><span>Brooklyn, NY · simulated timestamp</span></div><ConfidenceRing value={96.8} size={78} /></div>
              <div className="mini-pipeline">{pipelineStages.map((stage, index) => <div className={`mini-pipeline__step mini-pipeline__step--${stage.state}`} key={stage.label}><span>{index + 1}</span><small>{stage.label.replace("ON-CHAIN ATTESTATION", "ON-CHAIN")}</small></div>)}</div>
              <div className="panel-foot"><span className="mono">NO CONFIRMED CHAIN DATA</span><button className="icon-link" onClick={() => onOpenConsole("dashboard")} aria-label="Open event #8271"><ArrowRight size={16} /></button></div>
            </div>
            <div className="event-feed instrument-panel">
              <div className="panel-head"><div><span className="panel-kicker">LATEST EVENTS</span><h3>Protocol feed</h3></div><span className="live-dot-label"><span className="network-status__dot" /> LIVE</span></div>
              <div className="event-feed__list">{latestEvents.map((event) => <button key={event.id} className="event-row" onClick={() => onOpenConsole("dashboard")}><span className="event-row__id">#{event.id}</span><span className="event-row__main"><strong>{event.title}</strong><small>{event.type} · {event.location}</small></span><span className="event-row__confidence"><strong>{event.confidence}%</strong><small>{event.time}</small></span><span className={`event-row__state event-row__state--${event.state}`} aria-label={event.state}><span /></span></button>)}</div>
              <div className="panel-foot"><span className="mono">STREAM / 05 RECORDS</span><button className="text-button text-button--small" onClick={() => onOpenConsole("dashboard")}>Open console <ArrowRight size={14} /></button></div>
            </div>
          </div>
        </section>

        <section className="capabilities-section frame" id="security" aria-labelledby="capabilities-title">
          <div className="section-heading"><Eyebrow tone="amber">PROTOCOL PRINCIPLES</Eyebrow><h2 id="capabilities-title">Trust is designed<br /><span>into the system.</span></h2></div>
          <div className="capability-grid">
            {capabilityBlocks.map((block) => {
              const Icon = block.icon;
              return <motion.article className={`capability-block capability-block--${block.tone}`} key={block.title} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}><div className="capability-block__top"><span className="capability-block__index">{block.index}</span><IconTile tone={block.tone}><Icon size={19} strokeWidth={1.6} aria-hidden="true" /></IconTile></div><h3>{block.title}</h3><p>{block.copy}</p><span className="capability-block__line" /></motion.article>;
            })}
          </div>
        </section>

        <section className="proof-section frame" id="proof" aria-labelledby="proof-title">
          <div className="proof-section__inner">
            <div><Eyebrow tone="cyan">PROTOCOL PUBLICATION</Eyebrow><h2 id="proof-title">From observation<br />to <span>an inspectable record.</span></h2><p>When the application workflow is complete, a configured wallet-signed adapter may prepare protocol publication. A signature is only proof after RPC confirmation and readable protocol state.</p><ArrowButton onClick={() => onOpenConsole("network")} variant="secondary">Explore the network</ArrowButton></div>
            <div className="proof-sequence">
              <div className="proof-sequence__line" />
              <div className="proof-sequence__item"><span className="proof-sequence__node proof-sequence__node--ivory"><ScanLine size={16} aria-hidden="true" /></span><span><small>OBSERVED</small><strong>Independent signals arrive</strong></span></div>
              <div className="proof-sequence__item"><span className="proof-sequence__node proof-sequence__node--amber"><CircleAlert size={16} aria-hidden="true" /></span><span><small>INFERRED</small><strong>Anomalies are surfaced</strong></span></div>
              <div className="proof-sequence__item"><span className="proof-sequence__node proof-sequence__node--cyan"><ShieldCheck size={16} aria-hidden="true" /></span><span><small>PUBLICATION</small><strong>Only confirmed RPC state is protocol proof</strong></span></div>
            </div>
          </div>
        </section>

        <section className="footer-cta frame" aria-labelledby="footer-cta-title">
          <div><Eyebrow tone="copper">BUILD ON VERIFIABLE REALITY</Eyebrow><h2 id="footer-cta-title">Give every important<br /><span>event a witness.</span></h2></div>
          <div className="footer-cta__right"><p>Submit a verification request through the configured application API. No single source of truth. No black-box verdicts.</p><div className="footer-cta__actions"><ArrowButton onClick={() => onOpenConsole("request")}>Deploy a request</ArrowButton><button className="quiet-button" onClick={() => onOpenConsole("dashboard")}>Open the console <ArrowRight size={16} aria-hidden="true" /></button></div></div>
        </section>
      </main>

      <footer className="marketing-footer frame"><div className="marketing-footer__brand"><BrandMark /><span>Cryptographic proof for the physical world.</span></div><div className="marketing-footer__meta"><span className="mono">{demoNotice}</span><span>RESONANCE / 2026</span></div></footer>
    </div>
  );
}

export default ResonanceLanding;
