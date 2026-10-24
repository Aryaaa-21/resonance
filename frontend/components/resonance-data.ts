export type AppView =
  | "dashboard"
  | "events"
  | "event"
  | "witnesses"
  | "challenges"
  | "network"
  | "staking"
  | "agent"
  | "settings"
  | "request";

export type EventState = "verified" | "review" | "challenge" | "failed";

export type EventRecord = {
  id: string;
  title: string;
  type: string;
  location: string;
  time: string;
  confidence: number;
  state: EventState;
  witnesses: number;
  stake: string;
  signal: string;
};

export type WitnessRecord = {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "active" | "review" | "offline";
  reputation: number;
  events: string;
  accuracy: number;
  stake: string;
  color: "cyan" | "copper" | "amber";
};

export const latestEvents: EventRecord[] = [
  {
    id: "8271",
    title: "Delivery completed",
    type: "LOGISTICS / HANDOFF",
    location: "Brooklyn, NY",
    time: "2 min ago",
    confidence: 96.8,
    state: "verified",
    witnesses: 7,
    stake: "14.2 SOL",
    signal: "+4.2%",
  },
  {
    id: "8270",
    title: "Location arrival",
    type: "DEPIN / LOCATION",
    location: "Austin, TX",
    time: "11 min ago",
    confidence: 92.1,
    state: "verified",
    witnesses: 5,
    stake: "8.8 SOL",
    signal: "+1.8%",
  },
  {
    id: "8269",
    title: "Delivery completed",
    type: "LOGISTICS / HANDOFF",
    location: "Long Beach, CA",
    time: "18 min ago",
    confidence: 98.4,
    state: "verified",
    witnesses: 9,
    stake: "21.0 SOL",
    signal: "+2.7%",
  },
  {
    id: "8268",
    title: "Challenge raised",
    type: "PROTOCOL / DISPUTE",
    location: "Columbus, OH",
    time: "31 min ago",
    confidence: 72.3,
    state: "challenge",
    witnesses: 4,
    stake: "5.4 SOL",
    signal: "−7.2%",
  },
  {
    id: "8267",
    title: "Fraud detected",
    type: "SECURITY / ANOMALY",
    location: "Miami, FL",
    time: "44 min ago",
    confidence: 18.6,
    state: "failed",
    witnesses: 6,
    stake: "11.7 SOL",
    signal: "−32.4%",
  },
];

export const witnesses: WitnessRecord[] = [
  {
    id: "A728",
    name: "Field relay 7A",
    type: "GPS DEVICE",
    location: "Brooklyn, NY",
    status: "active",
    reputation: 98.2,
    events: "12,492",
    accuracy: 99.1,
    stake: "12.4 SOL",
    color: "cyan",
  },
  {
    id: "R119",
    name: "Northstar camera",
    type: "CAMERA",
    location: "Jersey City, NJ",
    status: "active",
    reputation: 96.7,
    events: "9,084",
    accuracy: 98.6,
    stake: "10.8 SOL",
    color: "copper",
  },
  {
    id: "H042",
    name: "Recipient signature",
    type: "HUMAN",
    location: "Brooklyn, NY",
    status: "active",
    reputation: 91.4,
    events: "1,278",
    accuracy: 96.9,
    stake: "4.2 SOL",
    color: "amber",
  },
  {
    id: "AI091",
    name: "Resonance intelligence",
    type: "AI AGENT",
    location: "Distributed",
    status: "active",
    reputation: 94.0,
    events: "22,104",
    accuracy: 93.8,
    stake: "8.0 SOL",
    color: "cyan",
  },
  {
    id: "Q514",
    name: "Quorum relay",
    type: "EXTERNAL SYSTEM",
    location: "Newark, NJ",
    status: "review",
    reputation: 86.5,
    events: "4,110",
    accuracy: 89.2,
    stake: "6.4 SOL",
    color: "amber",
  },
  {
    id: "C377",
    name: "Harbor observer",
    type: "DEVICE",
    location: "Staten Island, NY",
    status: "offline",
    reputation: 88.1,
    events: "7,821",
    accuracy: 94.7,
    stake: "9.1 SOL",
    color: "copper",
  },
];

export const heroWitnesses = [
  { id: "gps", label: "GPS device", detail: "Brooklyn · 10:31:02", status: "verified" as const, position: { x: 0.17, y: 0.26 } },
  { id: "camera", label: "Camera", detail: "Image verified", status: "verified" as const, position: { x: 0.73, y: 0.21 } },
  { id: "ai", label: "AI agent", detail: "Analysis complete", status: "pending" as const, position: { x: 0.87, y: 0.54 } },
  { id: "recipient", label: "Recipient", detail: "Signature confirmed", status: "verified" as const, position: { x: 0.72, y: 0.8 } },
  { id: "relay", label: "Relay node", detail: "State observed", status: "verified" as const, position: { x: 0.21, y: 0.77 } },
  { id: "sensor", label: "Sensor", detail: "12m variance", status: "attention" as const, position: { x: 0.09, y: 0.53 } },
];

export const evidenceTimeline = [
  { time: "10:31:02", title: "GPS device detected target location", witness: "GPS device / A728", type: "LOCATION ATTESTATION", state: "verified", hash: "8ab1…9f20" },
  { time: "10:31:08", title: "Camera evidence received", witness: "Northstar camera / R119", type: "IMAGE EVIDENCE", state: "verified", hash: "0d44…c8a1" },
  { time: "10:31:11", title: "AI analysis completed", witness: "Resonance intelligence / AI091", type: "ANOMALY ANALYSIS", state: "review", hash: "ce51…21a9" },
  { time: "10:31:17", title: "Recipient signature confirmed", witness: "Human witness / H042", type: "SIGNATURE ATTESTATION", state: "verified", hash: "7e20…4d67" },
  { time: "10:31:20", title: "Consensus reached", witness: "Protocol quorum", type: "CONSENSUS EVENT", state: "verified", hash: "b18f…8a10" },
  { time: "10:31:22", title: "Application record prepared", witness: "RESONANCE API / simulation", type: "SIMULATION RECORD", state: "review", hash: "local…record" },
];

export const pipelineStages = [
  { label: "EVENT DETECTED", detail: "10:31:02", state: "complete" },
  { label: "5 WITNESSES", detail: "10:31:17", state: "complete" },
  { label: "EVIDENCE ANALYZED", detail: "10:31:20", state: "complete" },
  { label: "APPLICATION RECORD", detail: "10:31:22", state: "complete" },
  { label: "REVIEW STATE", detail: "96.8% PRESENTATION SCORE", state: "active" },
] as const;

export const demoNotice = "DEMO DATA · TESTNET SIMULATION · NO MAINNET CLAIMS";
