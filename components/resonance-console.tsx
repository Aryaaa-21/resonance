"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Blocks,
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  CircleDot,
  CircleHelp,
  ClipboardCheck,
  Code2,
  Copy,
  ExternalLink,
  FileCheck2,
  Fingerprint,
  Gauge,
  Grid2X2,
  KeyRound,
  Landmark,
  Layers3,
  LineChart,
  ListFilter,
  LockKeyhole,
  MapPin,
  Menu,
  Network,
  Plus,
  RadioTower,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SquareStack,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { ProtocolWalletButton } from "./protocol-wallet-button";
import { motion } from "framer-motion";
import type { CreateVerificationRequestInput, Event, Witness } from "@/types";
import { useAIAlerts, useChallenges, useCreateVerificationRequest, useEvent, useEvents, useNetworkStats, useWitnesses } from "@/lib/hooks";
import { DataSourceBadge } from "@/components/ui/data-source-badge";
import { DataState } from "@/components/ui/data-state";
import {
  evidenceTimeline,
  latestEvents,
  type AppView,
  type EventRecord,
  witnesses,
} from "./resonance-data";
import {
  ArrowButton,
  BrandMark,
  ConfidenceRing,
  DemoBadge,
  Eyebrow,
  IconTile,
  LockNote,
  Metric,
  MiniSpark,
  SectionRule,
  StatusPill,
} from "./resonance-ui";

type ConsoleProps = {
  activeView: AppView;
  selectedEventId: string;
  wizardStep: number;
  onBack: () => void;
  onViewChange: (view: AppView) => void;
  onSelectEvent: (id: string) => void;
  onWizardStepChange: (step: number) => void;
};

const navSections = [
  { label: "Workspace", items: [{ id: "dashboard", label: "Dashboard", icon: Grid2X2 }, { id: "events", label: "Events", icon: CalendarDays }, { id: "witnesses", label: "Witnesses", icon: UsersRound }] },
  { label: "Protocol", items: [{ id: "challenges", label: "Challenges", icon: Route }, { id: "network", label: "Network", icon: Network }, { id: "staking", label: "Staking", icon: WalletCards }, { id: "agent", label: "Agent", icon: BrainCircuit }] },
];

const eventStates = {
  verified: { label: "VERIFIED", className: "state-cyan" },
  review: { label: "IN REVIEW", className: "state-amber" },
  challenge: { label: "CHALLENGE", className: "state-amber" },
  failed: { label: "FAILED", className: "state-crimson" },
} as const;

function formatEventTime(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "Time unavailable" : `${date.toISOString().slice(11, 16)} UTC`;
}

function formatLocation(location: { label: string; city: string; region: string }) {
  return [location.city, location.region].filter(Boolean).join(", ") || location.label;
}

type ConsoleEventRecord = EventRecord & { sourceId: string };

function toEventRecord(event: Event): ConsoleEventRecord {
  const rawState = String(event.state).toLowerCase();
  const rawStatus = String(event.status).toLowerCase();
  const state: EventRecord["state"] = rawState === "verified"
    ? "verified"
    : rawState === "challenged"
      ? "challenge"
      : rawState === "rejected" || rawStatus === "failed"
        ? "failed"
        : "review";

  return {
    id: event.id.replace(/^evt_/, ""),
    sourceId: event.id,
    title: event.title,
    type: `${event.category.toUpperCase()} / VERIFICATION`,
    location: formatLocation(event.location),
    time: formatEventTime(event.occurredAt),
    confidence: event.confidence,
    state,
    witnesses: event.witnessIds.length,
    stake: "—",
    signal: "",
  };
}

function toWitnessRecord(witness: Witness) {
  const rawKind = String(witness.kind).toLowerCase();
  const rawStatus = String(witness.status).toLowerCase();
  const color: "cyan" | "copper" | "amber" = rawKind === "human" ? "amber" : rawKind === "external_system" ? "copper" : "cyan";
  return {
    id: witness.id,
    name: witness.name,
    type: rawKind.replace("_", " ").toUpperCase(),
    location: formatLocation(witness.location),
    status: rawStatus === "suspended" ? "review" : rawStatus as "active" | "review" | "offline",
    reputation: witness.reputationScore,
    events: witness.observedEventCount.toLocaleString(),
    accuracy: witness.accuracyScore,
    stake: `${witness.stake.amount} ${witness.stake.symbol}`,
    color,
  } as const;
}

function ConsoleIcon({ item }: { item: string }) {
  const icons: Record<string, React.ReactNode> = {
    dashboard: <Grid2X2 size={16} />,
    events: <CalendarDays size={16} />,
    witnesses: <UsersRound size={16} />,
    challenges: <Route size={16} />,
    network: <Network size={16} />,
    staking: <WalletCards size={16} />,
    agent: <BrainCircuit size={16} />,
    settings: <Settings2 size={16} />,
  };
  return icons[item] ?? <CircleDot size={16} />;
}

function ConsoleHeader({ activeView, onBack, onViewChange }: Pick<ConsoleProps, "activeView" | "onBack" | "onViewChange">) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <header className="console-topbar">
      <div className="console-topbar__left"><button className="mobile-rail-toggle" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle console navigation"><Menu size={18} /></button><button className="back-to-site" onClick={onBack}><ArrowLeft size={15} /> Back to protocol site</button><span className="breadcrumb-divider">/</span><span className="breadcrumb-current">{activeView === "event" ? "Event #8271" : activeView === "request" ? "New request" : activeView[0].toUpperCase() + activeView.slice(1)}</span></div>
      <div className="console-topbar__right"><button className="console-search" aria-label="Search protocol"><Search size={15} /><span>Search protocol</span><kbd>⌘ K</kbd></button><button className="notification-button" aria-label="View notifications"><Bell size={16} /><span /></button><ProtocolWalletButton /></div>
      {mobileOpen ? <div className="mobile-rail-menu">{navSections.flatMap((section) => section.items).map((item) => <button key={item.id} className={activeView === item.id ? "is-active" : ""} onClick={() => { onViewChange(item.id as AppView); setMobileOpen(false); }}><ConsoleIcon item={item.id} />{item.label}</button>)}</div> : null}
    </header>
  );
}

function ConsoleRail({ activeView, onViewChange, onBack }: Pick<ConsoleProps, "activeView" | "onViewChange" | "onBack">) {
  return (
    <aside className="console-rail">
      <div className="console-rail__top"><button className="console-rail__brand" onClick={onBack}><BrandMark compact /><span>RESONANCE</span></button><div className="rail-network"><span className="rail-network__icon"><Network size={14} /></span><span><small>NETWORK</small><strong>TESTNET</strong></span><span className="rail-network__dot" /></div></div>
      <nav className="console-nav" aria-label="Console navigation">
        {navSections.map((section) => <div className="console-nav__section" key={section.label}><span className="console-nav__label">{section.label}</span>{section.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`console-nav__item ${activeView === item.id ? "is-active" : ""}`} onClick={() => onViewChange(item.id as AppView)}><Icon size={16} strokeWidth={1.7} /><span>{item.label}</span>{item.id === "events" ? <em>5</em> : item.id === "agent" ? <em className="nav-alert">3</em> : null}</button>; })}</div>)}
        <div className="console-nav__section console-nav__section--bottom"><span className="console-nav__label">System</span><button className={`console-nav__item ${activeView === "settings" ? "is-active" : ""}`} onClick={() => onViewChange("settings")}><Settings2 size={16} strokeWidth={1.7} /><span>Settings</span></button></div>
      </nav>
      <div className="console-rail__bottom"><div className="rail-health"><span className="rail-health__dot" /><span><small>NETWORK HEALTH</small><strong>Nominal · 99.97%</strong></span></div><div className="rail-user"><span className="rail-user__avatar">NS</span><span><small>OPERATOR</small><strong>Northstar Labs</strong></span><button aria-label="Open operator menu"><ChevronDown size={14} /></button></div></div>
    </aside>
  );
}

export function ResonanceConsole({ activeView, selectedEventId, wizardStep, onBack, onViewChange, onSelectEvent, onWizardStepChange }: ConsoleProps) {
  return (
    <div className="console-shell">
      <ConsoleRail activeView={activeView} onViewChange={onViewChange} onBack={onBack} />
      <div className="console-content"><ConsoleHeader activeView={activeView} onBack={onBack} onViewChange={onViewChange} /><main className="console-main">
        {activeView === "dashboard" ? <DashboardView onViewChange={onViewChange} onSelectEvent={onSelectEvent} /> : null}
        {activeView === "events" ? <EventsView onViewChange={onViewChange} onSelectEvent={onSelectEvent} /> : null}
        {activeView === "event" ? <EventDetailView eventId={selectedEventId} onViewChange={onViewChange} /> : null}
        {activeView === "witnesses" ? <WitnessesView /> : null}
        {activeView === "challenges" ? <ChallengesView /> : null}
        {activeView === "network" ? <NetworkView /> : null}
        {activeView === "staking" ? <StakingView /> : null}
        {activeView === "agent" ? <AgentView onViewChange={onViewChange} /> : null}
        {activeView === "settings" ? <SettingsView /> : null}
        {activeView === "request" ? <RequestWizard step={wizardStep} onStepChange={onWizardStepChange} onViewChange={onViewChange} /> : null}
      </main></div>
    </div>
  );
}

function ConsolePageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="console-page-heading"><div><Eyebrow tone="copper">{eyebrow}</Eyebrow><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action ? <div className="console-page-heading__action">{action}</div> : null}</div>;
}

function DemoBar() {
  return <div className="demo-bar"><DemoBadge /><span>All records in this console are illustrative testnet data. Connect protocol services before making operational decisions.</span><button aria-label="Dismiss demo notice"><X size={14} /></button></div>;
}

function DashboardView({ onViewChange, onSelectEvent }: { onViewChange: (view: AppView) => void; onSelectEvent: (id: string) => void }) {
  return <div className="console-view"><DemoBar /><ConsolePageHeading eyebrow="MISSION CONTROL" title="Verification overview" description="Monitor evidence intake, witness health, and application status across your active requests." action={<ArrowButton onClick={() => onViewChange("request")}>Create verification request</ArrowButton>} />
    <section className="console-metrics" aria-label="Overview metrics"><Metric label="Active requests" value="18" note="DEMO application data" tone="copper" icon={<Activity size={16} />} /><Metric label="Verified events" value="2,184" note="DEMO application data" tone="cyan" icon={<BadgeCheck size={16} />} /><Metric label="AI alerts" value="03" note="Advisory only · DEMO" tone="amber" icon={<BrainCircuit size={16} />} /><Metric label="On-chain attestations" value="—" note="No confirmed chain data" tone="default" icon={<WalletCards size={16} />} /></section>
    <div className="dashboard-grid">
      <section className="instrument-panel active-request-panel"><SectionRule label="ACTIVE VERIFICATION REQUEST" right={<span className="panel-micro-status"><span className="network-status__dot" /> LIVE</span>} /><div className="active-request-panel__header"><div><span className="event-id mono">EVENT #8271</span><h2>Delivery completed</h2><p><MapPin size={13} /> Brooklyn, NY · Handoff confirmation</p></div><div className="active-request-panel__confidence"><ConfidenceRing value={96.8} size={84} /><span><small>CONFIDENCE</small><strong>Verified</strong></span></div></div><div className="request-progress"><div className="request-progress__labels"><span>Verification progress</span><strong>5 / 5 witnesses</strong></div><div className="request-progress__track"><span style={{ width: "96.8%" }} /></div><div className="request-progress__meta"><span>Application quorum record · simulation</span><span>No confirmed chain data</span></div></div><div className="request-witness-strip">{witnesses.slice(0, 5).map((witness, index) => <div className="request-witness" key={witness.id}><span className={`request-witness__dot request-witness__dot--${witness.color}`}><Check size={11} /></span><span><strong>{witness.id}</strong><small>{index === 3 ? "AI analysis" : witness.type.toLowerCase()}</small></span></div>)}</div><div className="panel-foot"><span className="mono">APPLICATION RECORD · SIMULATION</span><button className="text-button text-button--small" onClick={() => { onSelectEvent("8271"); onViewChange("event"); }}>Inspect event <ArrowRight size={14} /></button></div></section>
      <AgentAlertPanel onViewChange={onViewChange} />
      <section className="instrument-panel latest-events-panel"><div className="panel-head"><div><span className="panel-kicker">LATEST VERIFICATIONS</span><h3>Event stream</h3></div><button className="icon-button" aria-label="Filter event stream"><ListFilter size={16} /></button></div><div className="console-event-table">{latestEvents.map((event) => <button className="console-event-row" key={event.id} onClick={() => { onSelectEvent(event.id); onViewChange("event"); }}><span className="console-event-row__id mono">#{event.id}</span><span className="console-event-row__title"><strong>{event.title}</strong><small>{event.type} · {event.location}</small></span><span className="console-event-row__witnesses"><strong>{event.witnesses}</strong><small>witnesses</small></span><span className="console-event-row__confidence"><strong>{event.confidence}%</strong><span className={`confidence-bar confidence-bar--${event.state}`}><span style={{ width: `${event.confidence}%` }} /></span></span><span className={`event-state-label ${eventStates[event.state].className}`}>{eventStates[event.state].label}</span></button>)}</div><div className="panel-foot"><span className="mono">STREAM / 05 RECORDS</span><button className="text-button text-button--small" onClick={() => onViewChange("events")}>View all events <ArrowRight size={14} /></button></div></section>
      <section className="instrument-panel witness-activity-panel"><div className="panel-head"><div><span className="panel-kicker">WITNESS ACTIVITY</span><h3>Network signal</h3></div><span className="panel-select">Last 24h <ChevronDown size={13} /></span></div><div className="activity-chart"><div className="activity-chart__y"><span>120</span><span>80</span><span>40</span><span>0</span></div><div className="activity-chart__body"><div className="activity-chart__grid" />{[28, 42, 36, 58, 51, 74, 60, 82, 76, 89, 68, 92, 84, 98, 79, 87, 96, 74, 88, 92].map((height, index) => <span className="activity-chart__bar" key={index} style={{ height: `${height}%`, animationDelay: `${index * 0.03}s` }} />)}<div className="activity-chart__line"><span /></div></div></div><div className="activity-chart__footer"><span><i className="legend-dot legend-dot--cyan" /> Witness submissions <strong>1,842</strong></span><span><i className="legend-dot legend-dot--copper" /> Challenge signals <strong>42</strong></span></div></section>
    </div>
  </div>;
}

function AgentAlertPanel({ onViewChange }: { onViewChange: (view: AppView) => void }) {
  return <section className="instrument-panel agent-alert-panel"><div className="panel-head"><div><span className="panel-kicker">RESONANCE INTELLIGENCE</span><h3>One alert needs review</h3></div><span className="ai-live-status"><span className="signal-dot signal-dot--cyan" /> ACTIVE</span></div><div className="agent-alert-panel__body"><div className="agent-alert-panel__severity"><AlertTriangle size={18} /><span>ANOMALY DETECTED</span></div><h4>Witness #A728 reported the event 42 seconds earlier than the consensus window.</h4><div className="agent-alert-panel__stats"><div><span>Location variance</span><strong>183m</strong></div><div><span>Confidence impact</span><strong className="text-crimson">−12.4%</strong></div></div><div className="agent-alert-panel__recommendation"><span>RECOMMENDATION</span><strong>Investigate witness before sealing</strong></div></div><div className="agent-alert-panel__actions"><button onClick={() => onViewChange("agent")}>Review evidence <ArrowRight size={14} /></button><button onClick={() => onViewChange("witnesses")}>Inspect witness <ArrowRight size={14} /></button></div></section>;
}

function EventsView({ onViewChange, onSelectEvent }: { onViewChange: (view: AppView) => void; onSelectEvent: (id: string) => void }) {
  const [filter, setFilter] = useState<"all" | "verified" | "review" | "challenge">("all");
  const eventsQuery = useEvents({ limit: 50 });
  const records = eventsQuery.data?.map(toEventRecord) ?? [];
  const filtered = records.filter((event) => filter === "all" || event.state === filter);

  return (
    <div className="console-view">
      <ConsolePageHeading
        eyebrow="EVENT REGISTRY"
        title="Verification requests"
        description="Every request keeps its own evidence trail, witness quorum, and settlement state."
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <DataSourceBadge source={eventsQuery.source} />
            <ArrowButton onClick={() => onViewChange("request")}>Create verification request</ArrowButton>
          </div>
        }
      />
      <div className="filter-bar">
        <div className="segmented-control" role="tablist" aria-label="Filter events">
          {(["all", "verified", "review", "challenge"] as const).map((item) => (
            <button key={item} className={filter === item ? "is-active" : ""} onClick={() => setFilter(item)} role="tab" aria-selected={filter === item}>
              {item === "all" ? "All events" : item === "review" ? "In review" : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        <button className="quiet-button quiet-button--dark"><ListFilter size={15} /> Advanced filters</button>
      </div>
      {eventsQuery.isLoading && !eventsQuery.data ? <DataState kind="loading" title="Loading event registry" description="Fetching verification requests from the configured protocol service." /> : null}
      {eventsQuery.error && !eventsQuery.data ? <DataState kind="error" title="Event registry unavailable" description={eventsQuery.error.message} actionLabel="Retry" onRetry={eventsQuery.reload} /> : null}
      {!eventsQuery.isLoading && !eventsQuery.error && eventsQuery.isEmpty ? <DataState kind="empty" title="No verification requests" description="The configured event service has not returned any requests yet." /> : null}
      {!eventsQuery.error && !eventsQuery.isEmpty ? (
        <>
          <section className="instrument-panel event-registry">
            <div className="registry-head"><span>EVENT</span><span>LOCATION</span><span>WITNESSES</span><span>CONFIDENCE</span><span>STATE</span></div>
            {filtered.map((event) => (
              <button className="registry-row" key={event.id} onClick={() => { onSelectEvent(event.sourceId); onViewChange("event"); }}>
                <span className="registry-row__event"><span className="registry-row__id mono">#{event.id}</span><span><strong>{event.title}</strong><small>{event.type}</small></span></span>
                <span className="registry-row__location"><MapPin size={13} />{event.location}<small>{event.time}</small></span>
                <span className="registry-row__count"><strong>{event.witnesses}</strong><small>independent</small></span>
                <span className="registry-row__score"><strong>{event.confidence}%</strong><span className={`confidence-bar confidence-bar--${event.state}`}><span style={{ width: `${event.confidence}%` }} /></span></span>
                <span className={`event-state-label ${eventStates[event.state].className}`}>{eventStates[event.state].label}</span>
                <ArrowRight size={15} />
              </button>
            ))}
          </section>
          <div className="registry-footer"><span className="mono">{filtered.length} OF {records.length} EVENTS</span><span>Source metadata is shown above the registry.</span></div>
        </>
      ) : null}
    </div>
  );
}

function EventDetailView({ eventId, onViewChange }: { eventId: string; onViewChange: (view: AppView) => void }) {
  const normalizedEventId = eventId;
  const eventQuery = useEvent(normalizedEventId);

  if (eventQuery.isLoading && !eventQuery.data) {
    return <div className="console-view event-detail-view"><DataState kind="loading" title="Loading event" description="Fetching the event evidence boundary." /></div>;
  }

  if (eventQuery.error && !eventQuery.data) {
    return <div className="console-view event-detail-view"><DataState kind="error" title="Event unavailable" description={eventQuery.error.message} actionLabel="Retry" onRetry={eventQuery.reload} /></div>;
  }

  if (!eventQuery.data) {
    return <div className="console-view event-detail-view"><DataState kind="empty" title="Event not found" description="The requested verification event is not available from the configured service." actionLabel="Back to events" onRetry={() => onViewChange("events")} /></div>;
  }

  const event = toEventRecord(eventQuery.data);
  const protocol = eventQuery.data.protocol;
  const hasConfirmedChain = Boolean(protocol?.transactionSignature && (protocol.confirmationStatus === "confirmed" || protocol.confirmationStatus === "finalized"));
  const attestationLabel = hasConfirmedChain ? "CONFIRMED" : eventQuery.data.simulation ? "SIMULATION ONLY" : "NOT SUBMITTED";
  const attestationReference = hasConfirmedChain ? protocol?.transactionSignature : eventQuery.data.simulation ? "Local simulation record" : "Not yet submitted";
  return <div className="console-view event-detail-view"><div className="event-detail-heading"><div><button className="back-link" onClick={() => onViewChange("events")}><ArrowLeft size={15} /> Back to events</button><div className="event-detail-heading__line"><span className="event-id mono">EVENT #{event.id}</span><span className="event-detail-heading__separator" /><span className="event-detail-heading__type">{event.type}</span></div><h1>{event.title}</h1><p><MapPin size={14} /> {event.location} <span>·</span> {event.time} <span>·</span> Request opened by protocol operator</p></div><div className="event-detail-heading__status"><DataSourceBadge source={eventQuery.source} compact /><StatusPill state={event.state} label={eventQuery.data.simulation ? `DEMO · ${event.state === "verified" ? "Verified" : event.state === "challenge" ? "Challenge raised" : event.state === "failed" ? "Failed" : "In review"}` : event.state === "verified" ? "Verified" : event.state === "challenge" ? "Challenge raised" : event.state === "failed" ? "Failed" : "In review"} /><div><strong>{event.confidence}%</strong><small>CONFIDENCE</small></div></div></div><div className="event-detail-metrics"><Metric label="Witness count" value={String(event.witnesses)} note="Independent observations" tone="cyan" /><Metric label="Consistent" value={event.state === "verified" ? "Yes" : "Review"} note="Protocol state" tone="default" /><Metric label="Anomalies" value={eventQuery.data.aiAlertIds.length.toString()} note="AI alerts linked" tone="amber" /><Metric label="Stake secured" value={event.stake} note="Reported by request" tone="copper" /></div><div className="event-detail-layout"><section className="instrument-panel evidence-timeline-panel"><SectionRule label="EVIDENCE TIMELINE" right={<span className="mono">{eventQuery.data.evidenceIds.length} RECORDS</span>} /><div className="evidence-timeline">{evidenceTimeline.map((item, index) => <div className={`timeline-item timeline-item--${item.state}`} key={item.hash}><div className="timeline-item__time mono">{item.time}</div><div className="timeline-item__node"><span />{index < evidenceTimeline.length - 1 ? <i /> : null}</div><div className="timeline-item__body"><div className="timeline-item__top"><span className="timeline-item__type">{item.type}</span><span className={`timeline-item__state timeline-item__state--${item.state}`}>{item.state === "verified" ? "VERIFIED" : "REVIEW"}</span></div><h3>{item.title}</h3><p>{item.witness}</p><span className="timeline-item__hash mono">HASH {item.hash}</span></div></div>)}</div></section><section className="instrument-panel evidence-network-panel"><SectionRule label="WITNESS NETWORK" right={<button className="icon-button" aria-label="Expand witness network"><ExternalLink size={14} /></button>} /><EvidenceGraph /><div className="network-selection"><span className="network-selection__dot" /><div><small>SELECTED WITNESS / {eventQuery.data.witnessIds[0] ?? "—"}</small><strong>Independent witness network</strong><span>Inspect event evidence and linked witness attestations.</span></div><ArrowRight size={15} /></div></section><section className="instrument-panel ai-analysis-panel"><div className="panel-head"><div><span className="panel-kicker">RESONANCE INTELLIGENCE</span><h3>AI analysis</h3></div><span className="ai-live-status"><span className="signal-dot signal-dot--cyan" /> ADVISORY</span></div><div className="ai-analysis-panel__signal"><div className="ai-analysis-panel__signal-icon"><BrainCircuit size={18} /></div><div><span>{eventQuery.data.aiAlertIds.length > 0 ? "ALERTS LINKED" : "NO ACTIVE ALERT"}</span><strong>{eventQuery.data.aiAlertIds.length > 0 ? "Review linked AI advisory signals" : "No AI alert is linked to this event"}</strong></div><ConfidenceRing value={event.confidence} size={62} tone={event.state === "verified" ? "cyan" : "amber"} /></div><div className="ai-analysis-panel__body"><div><span>OBSERVED</span><p>{eventQuery.data.description || "The event has been reported to the protocol."}</p></div><div><span>INFERRED</span><p>Evidence and witness records remain inspectable through the event boundary.</p></div><div><span>RECOMMENDED</span><p>Use witness quorum and protocol rules as the source of final authority.</p></div></div><div className="ai-analysis-panel__actions"><button onClick={() => onViewChange("witnesses")}>Inspect witness <ArrowRight size={14} /></button><button onClick={() => onViewChange("challenges")}>Challenge event <ArrowRight size={14} /></button></div></section><section className="instrument-panel solana-panel"><SectionRule label="PROTOCOL PUBLICATION" right={<span className="attestation-live"><span /> {attestationLabel}</span>} /><div className="solana-panel__body"><div className="solana-panel__seal"><Blocks size={19} /><span>{hasConfirmedChain ? "CONFIRMED" : eventQuery.data.simulation ? "SIMULATED" : "NOT SUBMITTED"}</span></div><div><span className="panel-kicker">ATTESTATION REFERENCE</span><strong className="mono">{attestationReference}</strong><p>{hasConfirmedChain ? "The API has a caller-provided signature with confirmation status." : eventQuery.data.simulation ? "This is a local simulation record; no transaction signature exists." : "No confirmed protocol publication is linked to this request."}</p></div><span className="mono" style={{ color: "var(--muted)", fontSize: 10 }}>NO EXPLORER LINK</span></div><div className="solana-panel__meta"><span><small>EVENT ID</small><strong className="mono">{eventQuery.data.id}</strong></span><span><small>REQUESTED BY</small><strong className="mono">{eventQuery.data.requestedBy ?? "—"}</strong></span><span><small>NETWORK</small><strong>{eventQuery.source?.kind === "api" ? "API" : eventQuery.data.simulation?.network ?? "—"}</strong></span></div></section><section className="instrument-panel challenge-history-panel"><SectionRule label="CHALLENGE HISTORY" right={<span className="mono">{eventQuery.data.challengeIds.length.toString().padStart(2, "0")} ENTRIES</span>} /><div className="challenge-history-row"><span className="challenge-history-row__icon"><ShieldAlert size={16} /></span><span><strong>{eventQuery.data.challengeIds.length > 0 ? "Challenge record linked" : "No active challenge"}</strong><small>{eventQuery.data.challengeIds.length > 0 ? "Review the linked challenge before finality" : "Latest event state has no linked challenge"}</small></span><span className="mono">{formatEventTime(eventQuery.data.reportedAt)}</span><StatusPill state={event.state} label={event.state === "verified" ? "Settled" : "Review"} /></div><button className="challenge-history-action" onClick={() => onViewChange("challenges")}>Open challenge interface <ArrowRight size={14} /></button></section><section className="instrument-panel technical-details-panel"><SectionRule label="TECHNICAL DETAILS" right={<button className="text-button text-button--small"><Copy size={13} /> Copy JSON</button>} /><div className="technical-grid"><span><small>EVENT ID</small><strong className="mono">{eventQuery.data.id}</strong></span><span><small>REQUESTER</small><strong className="mono">{eventQuery.data.requestedBy ?? "—"}</strong></span><span><small>SCHEMA</small><strong className="mono">resonance/2.0</strong></span><span><small>REPORTED</small><strong className="mono">{eventQuery.data.reportedAt}</strong></span><span><small>EVIDENCE COUNT</small><strong className="mono">{eventQuery.data.evidenceIds.length}</strong></span><span><small>FINALITY</small><strong>{attestationLabel}</strong></span></div></section></div></div>;
}

function EvidenceGraph() {
  const nodes = [{ label: "GPS", x: 55, y: 44, tone: "cyan" }, { label: "CAM", x: 164, y: 70, tone: "copper" }, { label: "AI", x: 184, y: 180, tone: "amber" }, { label: "REC", x: 72, y: 204, tone: "cyan" }, { label: "EVENT", x: 118, y: 125, tone: "ivory" }];
  return <div className="evidence-graph" role="img" aria-label="Evidence relationships between five independent witnesses and the event"><svg viewBox="0 0 240 250" aria-hidden="true"><defs><radialGradient id="graphGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#B8E3E8" stopOpacity="0.2" /><stop offset="100%" stopColor="#B8E3E8" stopOpacity="0" /></radialGradient></defs><circle cx="118" cy="125" r="78" fill="url(#graphGlow)" /><g className="evidence-graph__edges"><path d="M55 44 L118 125 M164 70 L118 125 M184 180 L118 125 M72 204 L118 125 M55 44 L164 70 M72 204 L184 180" /></g>{nodes.map((node) => <g className={`evidence-node evidence-node--${node.tone}`} key={node.label} transform={`translate(${node.x} ${node.y})`}><circle className="evidence-node__halo" r={node.label === "EVENT" ? 26 : 18} /><circle className="evidence-node__ring" r={node.label === "EVENT" ? 16 : 11} /><circle className="evidence-node__core" r={node.label === "EVENT" ? 5 : 3.5} /><text textAnchor="middle" y={node.label === "EVENT" ? 38 : 30}>{node.label}</text></g>)}</svg></div>;
}

function WitnessesView() {
  const witnessesQuery = useWitnesses({ limit: 50 });
  const rows = witnessesQuery.data?.map(toWitnessRecord) ?? [];
  const activeCount = rows.filter((witness) => witness.status === "active").length;
  const averageAccuracy = rows.length > 0 ? rows.reduce((sum, witness) => sum + witness.accuracy, 0) / rows.length : 0;
  const underReview = rows.filter((witness) => witness.status === "review").length;

  return <div className="console-view"><ConsolePageHeading eyebrow="WITNESS EXPLORER" title="Independent witnesses" description="Reputation is earned through consistent, signed observations over time." action={<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}><DataSourceBadge source={witnessesQuery.source} /><button className="quiet-button quiet-button--dark"><SlidersHorizontal size={15} /> Filter witnesses</button></div>} />{witnessesQuery.isLoading && !witnessesQuery.data ? <DataState kind="loading" title="Loading witness registry" description="Fetching witness reputation and activity from the configured protocol service." /> : null}{witnessesQuery.error && !witnessesQuery.data ? <DataState kind="error" title="Witness registry unavailable" description={witnessesQuery.error.message} actionLabel="Retry" onRetry={witnessesQuery.reload} /> : null}{!witnessesQuery.isLoading && !witnessesQuery.error && witnessesQuery.isEmpty ? <DataState kind="empty" title="No witnesses found" description="The configured witness service has not returned any records yet." /> : null}{!witnessesQuery.error && !witnessesQuery.isEmpty ? <><div className="witness-summary"><Metric label="Active witnesses" value={activeCount.toLocaleString()} note="From current response" tone="cyan" /><Metric label="Network accuracy" value={`${averageAccuracy.toFixed(1)}%`} note="Average returned score" tone="default" /><Metric label="Stake at risk" value={`${rows.reduce((sum, witness) => sum + Number(witness.stake.split(" ")[0]), 0).toFixed(1)} SOL`} note="Across returned witnesses" tone="copper" /><Metric label="Under review" value={underReview.toLocaleString()} note="Manual inspection queue" tone="amber" /></div><section className="instrument-panel witness-registry"><div className="registry-head witness-registry__head"><span>WITNESS</span><span>TYPE / LOCATION</span><span>REPUTATION</span><span>ACCURACY</span><span>STAKE</span><span>STATUS</span></div>{rows.map((witness) => <div className="witness-registry-row" key={witness.id}><span className="witness-registry-row__identity"><span className={`witness-avatar witness-avatar--${witness.color}`}>{witness.id.slice(0, 2)}</span><span><strong>{witness.name}</strong><small className="mono">WITNESS #{witness.id}</small></span></span><span className="witness-registry-row__type"><strong>{witness.type}</strong><small><MapPin size={12} /> {witness.location}</small></span><span className="witness-registry-row__reputation"><strong>{witness.reputation}%</strong><span className="meter"><span style={{ width: `${witness.reputation}%` }} /></span></span><span className="witness-registry-row__accuracy"><strong>{witness.accuracy}%</strong><MiniSpark values={[72, 80, 76, 84, 82, witness.accuracy]} tone={witness.color === "cyan" ? "cyan" : witness.color === "copper" ? "copper" : "amber"} /></span><span className="witness-registry-row__stake mono">{witness.stake}</span><StatusPill state={witness.status} /></div>)}</section></> : null}</div>;
}

function ChallengesView() {
  const [reason, setReason] = useState("location");
  const [submitted, setSubmitted] = useState(false);
  const challengesQuery = useChallenges({ limit: 50 });
  const openChallenges = challengesQuery.data?.filter((challenge) => {
    const status = String(challenge.status).toLowerCase();
    return status === "open" || status === "under_review";
  }).length ?? 0;
  return <div className="console-view"><ConsolePageHeading eyebrow="APPLICATION REVIEW" title="Challenge an event" description="Submit an application-level dispute note for review. This interface does not open a wallet transaction or protocol challenge account." action={<div style={{ display: "flex", alignItems: "center", gap: 12 }}><DataSourceBadge source={challengesQuery.source} /><span className="panel-micro-status">{openChallenges} APPLICATION OPEN</span></div>} /><div className="challenge-layout"><section className="instrument-panel challenge-form-panel">{submitted ? <div className="challenge-success"><div className="challenge-success__seal"><Check size={24} /></div><Eyebrow tone="cyan">APPLICATION NOTE CAPTURED</Eyebrow><h2>Review note captured.</h2><p>Your application-level dispute note is ready for human review. No SOL was locked and no protocol account was opened.</p><div className="challenge-success__meta"><span><small>APPLICATION NOTE</small><strong className="mono">LOCAL DRAFT</strong></span><span><small>RESPONSE WINDOW</small><strong>Not configured</strong></span><span><small>SETTLEMENT</small><strong>Application review</strong></span></div><button className="quiet-button quiet-button--dark" onClick={() => setSubmitted(false)}>Submit another review note <ArrowRight size={14} /></button></div> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><SectionRule label="APPLICATION REVIEW NOTE" right={<span className="mono">LOCAL / NO TX</span>} /><label className="form-label">Why are you challenging this event?<span>Choose the primary inconsistency.</span></label><div className="reason-grid">{[{ id: "location", label: "Location inconsistency", detail: "Reported position does not match the witness window" }, { id: "timestamp", label: "Timestamp inconsistency", detail: "Evidence arrived outside the expected sequence" }, { id: "manipulation", label: "Witness manipulation", detail: "Signals may be coordinated or compromised" }, { id: "false", label: "False evidence", detail: "The evidence does not represent the event" }].map((item) => <label className={`reason-option ${reason === item.id ? "is-selected" : ""}`} key={item.id}><input type="radio" name="reason" value={item.id} checked={reason === item.id} onChange={() => setReason(item.id)} /><span className="reason-option__mark" /><span><strong>{item.label}</strong><small>{item.detail}</small></span></label>)}</div><label className="form-label" htmlFor="evidence-note">Evidence context<span>Explain the contradiction so witnesses can respond.</span></label><textarea id="evidence-note" className="protocol-textarea" defaultValue="The GPS observation arrives 42 seconds before the consensus window. Requesting clock-drift evidence and one additional corroborating witness." /><div className="stake-field"><div><label className="form-label" htmlFor="stake">Planning amount<span>Planning value only; not transferred by this form.</span></label><div className="stake-input"><input id="stake" defaultValue="2.5" inputMode="decimal" /><span>SOL</span></div></div><div className="stake-impact"><span>Protocol settlement</span><strong>NOT AVAILABLE</strong><small>application-only surface</small></div></div><LockNote>This form does not lock, slash, return, or settle funds. It captures an application note only.</LockNote><button className="arrow-button arrow-button--danger" type="submit"><span>Save application review note</span><Send size={16} /></button></form>}</section><section className="challenge-status-panel"><div className="panel-kicker">APPLICATION WORKFLOW</div><h3>Every review note is inspectable.</h3><p>The application records the claim and supporting context for human review. Protocol challenge and settlement transactions are not wired into this surface.</p><div className="challenge-steps">{[{ label: "Review note captured", detail: "Claim and context are stored by the application", state: "active" }, { label: "Human review", detail: "An operator decides the next application action", state: "queued" }, { label: "Protocol action", detail: "Not available from this interface", state: "queued" }, { label: "Settlement", detail: "No funds are moved by this interface", state: "queued" }].map((step, index) => <div className={`challenge-step challenge-step--${step.state}`} key={step.label}><span className="challenge-step__number">0{index + 1}</span><span className="challenge-step__node">{step.state === "active" ? <CircleDot size={14} /> : <LockKeyhole size={13} />}</span><span><strong>{step.label}</strong><small>{step.detail}</small></span></div>)}</div><div className="challenge-status-panel__note"><ShieldCheck size={17} /><span><strong>AI is not the final authority.</strong><small>Application review and any future protocol action remain separate.</small></span></div></section></div></div>;
}

function NetworkView() {
  const networkQuery = useNetworkStats();
  const stats = networkQuery.data;
  const networkNodes = [{ x: 22, y: 26, label: "A728", tone: "cyan" }, { x: 48, y: 18, label: "R119", tone: "copper" }, { x: 77, y: 30, label: "AI091", tone: "cyan" }, { x: 33, y: 68, label: "H042", tone: "amber" }, { x: 66, y: 62, label: "Q514", tone: "copper" }, { x: 86, y: 76, label: "C377", tone: "amber" }, { x: 51, y: 48, label: "8271", tone: "ivory" }];
  return <div className="console-view"><ConsolePageHeading eyebrow="NETWORK EXPLORER" title="The verification network" description="A live view of witness activity, economic security, and consensus health." action={<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}><DataSourceBadge source={networkQuery.source} /><button className="quiet-button quiet-button--dark" onClick={networkQuery.reload}><RefreshCw size={15} /> Refresh signal</button></div>} />{networkQuery.isLoading && !networkQuery.data ? <DataState kind="loading" title="Loading network signal" description="Fetching the latest network health snapshot." /> : null}{networkQuery.error && !networkQuery.data ? <DataState kind="error" title="Network signal unavailable" description={networkQuery.error.message} actionLabel="Retry" onRetry={networkQuery.reload} /> : null}{!networkQuery.isLoading && !networkQuery.error && networkQuery.isEmpty ? <DataState kind="empty" title="No network snapshot" description="The configured network service has not returned a health snapshot yet." /> : null}<div className="network-metrics"><Metric label="Active witnesses" value={stats ? stats.activeWitnesses.toLocaleString() : "—"} note="Current network snapshot" tone="cyan" /><Metric label="Events / 24h" value={stats ? stats.eventsObserved24h.toLocaleString() : "—"} note="Observed by protocol" tone="copper" /><Metric label="Verification rate" value={stats ? `${((stats.verificationsCompleted24h / Math.max(1, stats.eventsObserved24h)) * 100).toFixed(1)}%` : "—"} note="Completed / observed" tone="default" /><Metric label="Network health" value={stats ? stats.health.toUpperCase() : "—"} note={stats ? formatEventTime(stats.sampledAt) : "Awaiting snapshot"} tone="cyan" /></div><div className="network-explorer-grid"><section className="instrument-panel network-map-panel"><div className="panel-head"><div><span className="panel-kicker">WITNESS CONSTELLATION</span><h3>Live network map</h3></div><span className="panel-select"><span className="network-status__dot" /> Streaming</span></div><div className="network-map" role="img" aria-label="Interactive network map showing witness nodes and event clusters"><div className="network-map__grid" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M22 26 L48 18 L77 30 L51 48 L33 68 L66 62 L86 76 M22 26 L33 68 M48 18 L51 48 M77 30 L51 48 M51 48 L66 62 M66 62 L86 76" /></svg>{networkNodes.map((node) => <span className={`network-map__node network-map__node--${node.tone}`} key={node.label} style={{ left: `${node.x}%`, top: `${node.y}%` }}><span /><small>{node.label}</small></span>)}</div><div className="network-map__legend"><span><i className="legend-dot legend-dot--cyan" /> Verified witness</span><span><i className="legend-dot legend-dot--copper" /> Event relay</span><span><i className="legend-dot legend-dot--amber" /> Review state</span></div></section><section className="instrument-panel network-health-panel"><SectionRule label="NETWORK HEALTH" right={<span className="panel-micro-status">LAST 24H</span>} /><div className="health-score"><ConfidenceRing value={stats?.averageConfidence ?? 0} size={116} /><div><span className="panel-kicker">HEALTH SCORE</span><strong>{stats?.health ?? "Awaiting"}</strong><small>{stats ? `${stats.activeWitnesses.toLocaleString()} active witnesses` : "No snapshot available"}</small></div></div><div className="health-bars"><div><span>Average confidence</span><strong>{stats ? `${stats.averageConfidence}%` : "—"}</strong><span className="health-bar"><i style={{ width: `${stats?.averageConfidence ?? 0}%` }} /></span></div><div><span>Verification completion</span><strong>{stats ? `${((stats.verificationsCompleted24h / Math.max(1, stats.eventsObserved24h)) * 100).toFixed(1)}%` : "—"}</strong><span className="health-bar"><i style={{ width: `${stats ? (stats.verificationsCompleted24h / Math.max(1, stats.eventsObserved24h)) * 100 : 0}%` }} /></span></div><div><span>Open challenges</span><strong>{stats ? stats.openChallenges.toLocaleString() : "—"}</strong><span className="health-bar health-bar--amber"><i style={{ width: `${stats ? Math.min(100, stats.openChallenges) : 0}%` }} /></span></div></div><div className="health-foot"><span><RadioTower size={14} /> {stats ? stats.activeWitnesses.toLocaleString() : "—"} witnesses</span><span><LockKeyhole size={14} /> {stats ? stats.simulatedAttestations24h.toLocaleString() : "—"} attestations</span></div></section></div><section className="instrument-panel network-feed"><SectionRule label="NETWORK ACTIVITY" right={<span className="mono">{stats ? `SAMPLED ${formatEventTime(stats.sampledAt)}` : "AWAITING UPDATE"}</span>} /><div className="network-feed__grid"><div><span className="panel-kicker">EVENT THROUGHPUT</span><strong>{stats ? `${Math.round(stats.eventsObserved24h / 24 / 60)} / min` : "—"}</strong><MiniSpark values={[24, 31, 28, 41, 38, 56, 48, 62, 55, 71, 68, 79, 72]} tone="cyan" /></div><div><span className="panel-kicker">VERIFICATIONS / DAY</span><strong>{stats ? stats.verificationsCompleted24h.toLocaleString() : "—"}</strong><MiniSpark values={[45, 52, 44, 61, 58, 63, 67, 75, 71, 82, 86]} tone="copper" /></div><div><span className="panel-kicker">CHALLENGES OPEN</span><strong>{stats ? stats.openChallenges.toLocaleString() : "—"}</strong><MiniSpark values={[18, 22, 20, 19, 25, 21, 26, 23, 20, 18, 17]} tone="amber" /></div></div></section></div>;
}

function StakingView() {
  return <div className="console-view"><ConsolePageHeading eyebrow="ECONOMIC SECURITY" title="Staking boundary" description="Phase 3 records the protocol interface for future staking without claiming final rewards, slashing, or balances." /><section className="instrument-panel settings-panel"><SectionRule label="PHASE 3 STATUS" right={<span className="panel-micro-status">NOT ACTIVE</span>} /><div className="challenge-status-panel__note"><ShieldCheck size={17} /><span><strong>No economic state is claimed here.</strong><small>Phase 3 only carries integer lamport bond declarations and refundable challenge-account rent. Final staking, rewards, and slashing belong to Phase 8.</small></span></div><div className="staking-summary"><Metric label="Wallet balance" value="—" note="Read from wallet/RPC only" tone="default" /><Metric label="Protocol stake" value="—" note="Not implemented in Phase 3" tone="copper" /><Metric label="Rewards" value="—" note="Phase 8" tone="cyan" /><Metric label="Slashing" value="—" note="Phase 8" tone="amber" /></div></section></div>;
}

function AgentView({ onViewChange }: { onViewChange: (view: AppView) => void }) {
  const alertsQuery = useAIAlerts({ status: "open", limit: 25 });
  const [activeInsight, setActiveInsight] = useState<string | null>(null);
  const insights = alertsQuery.data?.map((alert) => ({
    id: alert.id,
    severity: String(alert.severity).toLowerCase() === "critical" || String(alert.severity).toLowerCase() === "high" ? "high" : String(alert.severity).toLowerCase() === "info" ? "info" : "medium",
    title: alert.title,
    summary: alert.message,
    confidence: alert.modelConfidence,
    impact: String(alert.severity).toLowerCase() === "critical" ? "−12.4%" : String(alert.severity).toLowerCase() === "high" ? "−8.0%" : "—",
    source: `${alert.evidenceIds.length} evidence sources`,
    recommendation: alert.recommendedAction,
  })) ?? [];
  const selected = insights.find((insight) => insight.id === activeInsight) ?? insights[0];

  if (alertsQuery.isLoading && !alertsQuery.data) {
    return <div className="console-view"><DataState kind="loading" title="Loading intelligence signals" description="Fetching advisory alerts from the configured protocol service." /></div>;
  }

  if (alertsQuery.error && !alertsQuery.data) {
    return <div className="console-view"><DataState kind="error" title="Intelligence service unavailable" description={alertsQuery.error.message} actionLabel="Retry" onRetry={alertsQuery.reload} /></div>;
  }

  if (!selected) {
    return <div className="console-view"><DataState kind="empty" title="No active AI alerts" description="The advisory service has not returned any open signals." /></div>;
  }

  return <div className="console-view"><ConsolePageHeading eyebrow="SECURITY INTELLIGENCE" title="Resonance Intelligence" description="Anomaly detection and evidence analysis that stays advisory by design." action={<div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}><DataSourceBadge source={alertsQuery.source} /><span className="ai-live-status ai-live-status--large"><span className="signal-dot signal-dot--cyan" /> ENGINE ACTIVE</span></div>} /><div className="agent-banner"><div className="agent-banner__icon"><BrainCircuit size={24} /></div><div><span className="panel-kicker">AI ASSISTANCE, NOT AUTHORITY</span><strong>Every conclusion separates what was observed, inferred, and recommended.</strong></div><LockKeyhole size={16} /></div><div className="agent-workspace"><section className="instrument-panel insight-list"><SectionRule label="ACTIVE SIGNALS" right={<span className="panel-micro-status">{insights.length.toString().padStart(2, "0")} OPEN</span>} />{insights.map((insight) => <button className={`insight-row insight-row--${insight.severity} ${selected.id === insight.id ? "is-active" : ""}`} key={insight.id} onClick={() => setActiveInsight(insight.id)}><span className="insight-row__severity"><span /></span><span><strong>{insight.title}</strong><small>{insight.summary}</small></span><span className="insight-row__confidence">{insight.confidence}%<small>confidence</small></span></button>)}</section><section className="instrument-panel insight-detail"><div className="panel-head"><div><span className="panel-kicker">SELECTED ANALYSIS</span><h3>{selected.title}</h3></div><span className={`event-state-label ${selected.severity === "high" ? "state-amber" : selected.severity === "info" ? "state-cyan" : "state-amber"}`}>{selected.severity.toUpperCase()}</span></div><div className="insight-detail__score"><ConfidenceRing value={selected.confidence} size={104} tone={selected.severity === "high" ? "amber" : "cyan"} /><div><span className="panel-kicker">MODEL CONFIDENCE</span><strong>{selected.confidence}%</strong><span>Impact on event confidence <b className={selected.impact.startsWith("+") ? "text-cyan" : "text-crimson"}>{selected.impact}</b></span></div></div><div className="insight-detail__blocks"><div><span className="insight-label insight-label--observed">OBSERVED</span><p>{selected.summary} {selected.source} indicate the signal is worth reviewing.</p></div><div><span className="insight-label insight-label--inferred">INFERRED</span><p>The advisory signal should be interpreted alongside independent evidence and witness quorum.</p></div><div><span className="insight-label insight-label--recommended">RECOMMENDED</span><p>{selected.recommendation}. The AI does not finalize or reject the event.</p></div></div><div className="insight-detail__actions"><button onClick={() => onViewChange("event")}>Review event <ArrowRight size={14} /></button><button onClick={() => onViewChange("witnesses")}>Inspect witness <ArrowRight size={14} /></button><button onClick={() => onViewChange("challenges")}>Challenge event <ArrowRight size={14} /></button></div></section></div><section className="instrument-panel model-trace"><SectionRule label="MODEL TRACE" right={<span className="mono">{selected.source.toUpperCase()}</span>} /><div className="model-trace__grid"><span><small>INPUTS</small><strong>{selected.source}</strong></span><span><small>MODEL CONFIDENCE</small><strong>{selected.confidence}%</strong></span><span><small>EXPLANATION</small><strong>Available for audit</strong></span><span><small>FINAL AUTHORITY</small><strong>Witness quorum + protocol</strong></span></div></section></div>;
}

function SettingsView() {
  return <div className="console-view"><ConsolePageHeading eyebrow="PROTOCOL CONFIGURATION" title="Settings" description="Manage request defaults, alert thresholds, and wallet permissions." action={<button className="quiet-button quiet-button--dark"><RefreshCw size={15} /> Reset view</button>} /><div className="settings-layout"><section className="instrument-panel settings-panel"><SectionRule label="REQUEST DEFAULTS" /><label className="settings-toggle"><span><strong>Require independent witness diversity</strong><small>Block a request when all witnesses share the same source class.</small></span><input type="checkbox" defaultChecked /><i /></label><label className="settings-toggle"><span><strong>Require Solana anchor</strong><small>Do not mark an event final until the attestation is confirmed.</small></span><input type="checkbox" defaultChecked /><i /></label><label className="settings-toggle"><span><strong>Allow AI advisory alerts</strong><small>Surface anomalies without changing the protocol outcome.</small></span><input type="checkbox" defaultChecked /><i /></label></section><section className="instrument-panel settings-panel"><SectionRule label="ALERT THRESHOLDS" /><div className="range-setting"><div><span><strong>Minimum confidence</strong><small>Requests below this value enter review.</small></span><strong>85%</strong></div><input type="range" min="50" max="100" defaultValue="85" /></div><div className="range-setting"><div><span><strong>Witness quorum</strong><small>Default count for high-value events.</small></span><strong>5</strong></div><input type="range" min="3" max="9" defaultValue="5" /></div></section><section className="instrument-panel settings-panel"><SectionRule label="WALLET & NETWORK" /><div className="settings-key-row"><span><span className="settings-key-row__icon"><WalletCards size={15} /></span><span><strong>Connected wallet</strong><small className="mono">7Kp…D92</small></span></span><button className="quiet-button quiet-button--dark">Disconnect</button></div><div className="settings-key-row"><span><span className="settings-key-row__icon"><Network size={15} /></span><span><strong>Solana network</strong><small>Testnet · Anchor program v1</small></span></span><button className="quiet-button quiet-button--dark">Change</button></div></section></div></div>;
}

type RequestDraft = {
  eventType: "delivery" | "location_arrival";
  title: string;
  description: string;
  locationLabel: string;
  radius: string;
  requiredWitnesses: number;
  witnessClasses: string[];
  stake: string;
  confidenceThreshold: string;
};

type DraftErrors = Partial<Record<keyof RequestDraft, string>>;

const initialRequestDraft: RequestDraft = {
  eventType: "delivery",
  title: "Brooklyn delivery / handoff confirmation",
  description: "Confirm that package RS-8271 arrived at the designated location and was received by the listed recipient.",
  locationLabel: "Brooklyn Navy Yard, NY",
  radius: "250",
  requiredWitnesses: 5,
  witnessClasses: ["GPS device", "Camera", "Human recipient"],
  stake: "14.2",
  confidenceThreshold: "90",
};

const witnessClassOptions = [
  { label: "GPS device", icon: MapPin },
  { label: "Camera", icon: RadioTower },
  { label: "Human recipient", icon: UserRoundCheck },
  { label: "AI analysis", icon: BrainCircuit },
  { label: "External system", icon: Blocks },
] as const;

function numericValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function locationParts(label: string) {
  const [city = "Unknown city", region = "—"] = label.split(",").map((part) => part.trim()).filter(Boolean);
  return { city, region };
}

function securityLevelForThreshold(value: string): CreateVerificationRequestInput["securityLevel"] {
  const threshold = numericValue(value) ?? 0;
  if (threshold >= 95) return "critical";
  if (threshold >= 90) return "high";
  if (threshold >= 80) return "elevated";
  return "standard";
}

function RequestWizard({ step, onStepChange, onViewChange }: { step: number; onStepChange: (step: number) => void; onViewChange: (view: AppView) => void }) {
  const steps = ["Event", "Location", "Witnesses", "Security", "Review", "Deploy"];
  const canBack = step > 0;
  const createRequest = useCreateVerificationRequest();
  const [draft, setDraft] = useState<RequestDraft>(initialRequestDraft);
  const [errors, setErrors] = useState<DraftErrors>({});

  const updateDraft = <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validateStep = (stepToValidate: number) => {
    const nextErrors: DraftErrors = {};
    if (stepToValidate === 0) {
      if (!draft.title.trim()) nextErrors.title = "Enter a title for this request.";
      if (!draft.description.trim()) nextErrors.description = "Add enough context for independent witnesses.";
    }
    if (stepToValidate === 1) {
      if (!draft.locationLabel.trim()) nextErrors.locationLabel = "Enter the observation location.";
      const radius = numericValue(draft.radius);
      if (radius === null || radius <= 0) nextErrors.radius = "Use a radius greater than zero meters.";
    }
    if (stepToValidate === 2 && draft.requiredWitnesses < 1) {
      nextErrors.requiredWitnesses = "Choose at least one required witness.";
    }
    if (stepToValidate === 3) {
      const stake = numericValue(draft.stake);
      const threshold = numericValue(draft.confidenceThreshold);
      if (stake === null || stake < 0) nextErrors.stake = "Use a non-negative planning amount.";
      if (threshold === null || threshold < 0 || threshold > 100) nextErrors.confidenceThreshold = "Use a confidence threshold from 0 to 100.";
    }
    setErrors((current) => ({ ...current, ...nextErrors }));
    return Object.keys(nextErrors).length === 0;
  };

  const requestInput: CreateVerificationRequestInput = (() => {
    const location = locationParts(draft.locationLabel);
    return {
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.eventType === "location_arrival" ? "location" : "logistics",
      eventType: draft.eventType,
      location: {
        label: draft.locationLabel.trim(),
        city: location.city,
        region: location.region,
        country: "US",
        observationRadiusMeters: numericValue(draft.radius) ?? undefined,
      },
      requiredWitnesses: draft.requiredWitnesses,
      securityLevel: securityLevelForThreshold(draft.confidenceThreshold),
      planningStakeAmount: numericValue(draft.stake) ?? undefined,
      confidenceThreshold: numericValue(draft.confidenceThreshold) ?? undefined,
      preferredWitnessClasses: draft.witnessClasses,
      requestedBy: "demo-operator",
    };
  })();

  const next = async () => {
    if (step < steps.length - 1) {
      if (validateStep(step)) onStepChange(step + 1);
      return;
    }
    try {
      await createRequest.mutate(requestInput);
      onViewChange("dashboard");
    } catch {
      // Mutation state renders the structured API error below the form.
    }
  };

  return <div className="console-view request-view"><div className="request-heading"><div><button className="back-link" onClick={() => onViewChange("dashboard")}><ArrowLeft size={15} /> Cancel request</button><Eyebrow tone="copper">DEPLOY A VERIFICATION REQUEST</Eyebrow><h1>Turn an action into proof.</h1><p>Define the event, choose independent witnesses, and set the application review policy.</p></div><DemoBadge /></div><div className="wizard-steps" aria-label="Request creation steps">{steps.map((label, index) => <button key={label} className={`wizard-step ${index === step ? "is-active" : ""} ${index < step ? "is-complete" : ""}`} onClick={() => index <= step && onStepChange(index)} disabled={index > step || createRequest.isLoading}><span>{index < step ? <Check size={13} /> : `0${index + 1}`}</span><strong>{label}</strong></button>)}</div><div className="wizard-layout"><section className="instrument-panel wizard-panel"><SectionRule label={`STEP 0${step + 1} / ${steps.length}`} right={<span className="mono">APPLICATION REQUEST</span>} />{step === 0 ? <EventStep draft={draft} errors={errors} updateDraft={updateDraft} /> : null}{step === 1 ? <LocationStep draft={draft} errors={errors} updateDraft={updateDraft} /> : null}{step === 2 ? <WitnessStep draft={draft} errors={errors} updateDraft={updateDraft} /> : null}{step === 3 ? <SecurityStep draft={draft} errors={errors} updateDraft={updateDraft} /> : null}{step === 4 ? <ReviewStep draft={draft} /> : null}{step === 5 ? <DeployStep draft={draft} /> : null}{createRequest.error ? <DataState kind="error" title="Request could not be created" description={createRequest.error.message} actionLabel="Retry" onRetry={() => void next()} /> : null}<div className="wizard-panel__footer"><button className="quiet-button quiet-button--dark" onClick={() => canBack ? onStepChange(step - 1) : onViewChange("dashboard")} disabled={createRequest.isLoading}><ArrowLeft size={15} /> {canBack ? "Back" : "Cancel"}</button><button className="arrow-button arrow-button--primary" onClick={() => void next()} disabled={createRequest.isLoading}><span>{createRequest.isLoading ? "Submitting request…" : step === steps.length - 1 ? "Open mission control" : "Continue"}</span><ArrowRight size={16} /></button></div></section><aside className="instrument-panel wizard-aside"><span className="panel-kicker">WHY THIS MATTERS</span><h3>{step < 2 ? "Make the event unambiguous." : step < 4 ? "Diversity creates resilience." : "Finality is an explicit choice."}</h3><p>{step < 2 ? "A precise request gives every witness the same frame of reference without telling them what to conclude." : step < 4 ? "Independent observation classes make coordinated failure and single-source manipulation harder." : "Review the application request before sending it to the configured API."}</p><div className="wizard-aside__rule" /><div className="wizard-aside__fact"><span className="mono">REQUEST STATE</span><strong>{step === 5 ? "Submitted" : "Draft · not submitted"}</strong></div><div className="wizard-aside__fact"><span className="mono">PLANNING AMOUNT</span><strong>{draft.stake || "—"} SOL · no funds locked</strong></div><div className="wizard-aside__fact"><span className="mono">WITNESS WINDOW</span><strong>Application policy only</strong></div><DataSourceBadge source={createRequest.source} /></aside></div></div>;
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="form-error" role="alert">{message}</span> : null;
}

function EventStep({ draft, errors, updateDraft }: { draft: RequestDraft; errors: DraftErrors; updateDraft: <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => void }) {
  return <div className="wizard-form"><label className="form-label" htmlFor="event-type">What happened?<span>Choose the event class that best matches the action.</span></label><select id="event-type" className="protocol-select" value={draft.eventType} onChange={(event) => updateDraft("eventType", event.target.value as RequestDraft["eventType"])}><option value="delivery">Delivery completed</option><option value="location_arrival">Location arrival</option></select><label className="form-label" htmlFor="event-title">Event title<span>Use a human-readable name for operators and witnesses.</span></label><input id="event-title" className="protocol-input" value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} aria-invalid={Boolean(errors.title)} /> <FieldError message={errors.title} /><label className="form-label" htmlFor="event-context">Context<span>Give witnesses enough context to observe independently.</span></label><textarea id="event-context" className="protocol-textarea" value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} aria-invalid={Boolean(errors.description)} /><FieldError message={errors.description} /></div>;
}

function LocationStep({ draft, errors, updateDraft }: { draft: RequestDraft; errors: DraftErrors; updateDraft: <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => void }) {
  return <div className="wizard-form"><div className="form-grid"><div><label className="form-label" htmlFor="location-name">Location<span>Where should the event be observed?</span></label><input id="location-name" className="protocol-input" value={draft.locationLabel} onChange={(event) => updateDraft("locationLabel", event.target.value)} aria-invalid={Boolean(errors.locationLabel)} /><FieldError message={errors.locationLabel} /></div><div><label className="form-label" htmlFor="location-radius">Observation radius<span>This value is sent as application location metadata.</span></label><div className="input-with-unit"><input id="location-radius" className="protocol-input" value={draft.radius} onChange={(event) => updateDraft("radius", event.target.value)} inputMode="decimal" aria-invalid={Boolean(errors.radius)} /><span>meters</span></div><FieldError message={errors.radius} /></div></div><div className="location-preview"><div className="location-preview__grid" /><MapPin size={20} /><span><strong>{draft.locationLabel || "Location pending"}</strong><small>Coordinates are not collected by this form</small></span><span className="location-preview__ring location-preview__ring--one" /><span className="location-preview__ring location-preview__ring--two" /></div><LockNote>Only the location label and observation radius are included in this application request. No tracking trail is created here.</LockNote></div>;
}

function WitnessStep({ draft, errors, updateDraft }: { draft: RequestDraft; errors: DraftErrors; updateDraft: <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => void }) {
  const toggleClass = (label: string) => updateDraft("witnessClasses", draft.witnessClasses.includes(label) ? draft.witnessClasses.filter((item) => item !== label) : [...draft.witnessClasses, label]);
  return <div className="wizard-form"><div className="form-label">How many independent witnesses?<span>This requirement is sent to the application API.</span></div><div className="witness-count-options">{[3, 5, 7, 9].map((count, index) => <label className={`witness-count-option ${count === draft.requiredWitnesses ? "is-selected" : ""}`} key={count}><input type="radio" name="witness-count" checked={draft.requiredWitnesses === count} onChange={() => updateDraft("requiredWitnesses", count)} /><strong>{count}</strong><span>{index === 0 ? "minimum" : index === 1 ? "recommended" : index === 2 ? "high value" : "critical"}</span></label>)}</div><FieldError message={errors.requiredWitnesses} /><div className="selected-witnesses"><div className="selected-witnesses__head"><span className="form-label">Preferred witness classes<span>Application preference only; no witness is reserved by this form.</span></span><span className="mono">{draft.witnessClasses.length} / {witnessClassOptions.length} CLASSES</span></div><div className="witness-class-grid">{witnessClassOptions.map((item) => { const Icon = item.icon; const active = draft.witnessClasses.includes(item.label); return <button type="button" className={`witness-class-option ${active ? "is-selected" : ""}`} key={item.label} onClick={() => toggleClass(item.label)}><Icon size={17} /><span>{item.label}</span>{active ? <Check size={13} /> : <Plus size={13} />}</button>; })}</div></div></div>;
}

function SecurityStep({ draft, errors, updateDraft }: { draft: RequestDraft; errors: DraftErrors; updateDraft: <K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) => void }) {
  return <div className="wizard-form"><div className="form-grid"><div><label className="form-label" htmlFor="stake-required">Planning amount<span>Application-only estimate; no wallet transaction is created.</span></label><div className="input-with-unit"><input id="stake-required" className="protocol-input" value={draft.stake} onChange={(event) => updateDraft("stake", event.target.value)} inputMode="decimal" aria-invalid={Boolean(errors.stake)} /><span>SOL</span></div><FieldError message={errors.stake} /></div><div><label className="form-label" htmlFor="confidence-required">Confidence threshold<span>Maps to the application security level sent to the API.</span></label><div className="input-with-unit"><input id="confidence-required" className="protocol-input" value={draft.confidenceThreshold} onChange={(event) => updateDraft("confidenceThreshold", event.target.value)} inputMode="decimal" aria-invalid={Boolean(errors.confidenceThreshold)} /><span>%</span></div><FieldError message={errors.confidenceThreshold} /></div></div><div className="security-policy"><div><ShieldCheck size={18} /><span><strong>Challenge review</strong><small>Application workflow only in this phase</small></span><Check size={15} /></div><div><LockKeyhole size={18} /><span><strong>Protocol anchor</strong><small>No transaction is created by this wizard</small></span><Check size={15} /></div><div><BrainCircuit size={18} /><span><strong>AI advisory</strong><small>Enabled for anomaly detection only</small></span><Check size={15} /></div></div><LockNote>No SOL is held, slashed, or rewarded by this application form.</LockNote></div>;
}

function ReviewStep({ draft }: { draft: RequestDraft }) {
  return <div className="wizard-form"><div className="review-summary"><div><span>EVENT</span><strong>{draft.eventType === "location_arrival" ? "Location arrival" : "Delivery completed"}</strong><small>{draft.title || "Untitled request"}</small></div><div><span>LOCATION</span><strong>{draft.locationLabel || "—"}</strong><small>{draft.radius || "—"} meter observation radius</small></div><div><span>WITNESSES</span><strong>{draft.requiredWitnesses} required</strong><small>{draft.witnessClasses.length > 0 ? draft.witnessClasses.join(" · ") : "No preferred classes"}</small></div><div><span>SECURITY</span><strong>{draft.confidenceThreshold || "—"}% threshold</strong><small>{draft.stake || "—"} SOL planning amount · no funds locked</small></div></div><div className="review-note"><CircleHelp size={17} /><span><strong>Review before submission.</strong><small>This sends an application request to the configured API. It does not sign, submit, or confirm an on-chain transaction.</small></span></div></div>;
}

function DeployStep({ draft }: { draft: RequestDraft }) {
  return <div className="wizard-deploy"><div className="wizard-deploy__seal"><Check size={28} /></div><Eyebrow tone="cyan">REQUEST READY</Eyebrow><h2>Everything is staged.</h2><p>The event definition and application policy are ready to send to the configured API.</p><div className="wizard-deploy__details"><span><small>WITNESSES</small><strong>{draft.requiredWitnesses}</strong></span><span><small>THRESHOLD</small><strong>{draft.confidenceThreshold}%</strong></span><span><small>NETWORK</small><strong>Application API</strong></span></div><div className="wizard-deploy__status"><span className="signal-dot signal-dot--cyan" /><span>No wallet confirmation or chain publication occurs here</span></div></div>;
}

export default ResonanceConsole;
