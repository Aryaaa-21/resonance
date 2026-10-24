import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const now = new Date("2026-10-23T14:00:00.000Z");

const locations = {
  brooklyn: { label: "Dock 12 · Brooklyn Navy Yard", city: "Brooklyn", region: "NY", country: "US", coordinates: { latitude: 40.7021, longitude: -73.9707, accuracyMeters: 8 } },
  austin: { label: "East Austin drop zone", city: "Austin", region: "TX", country: "US", coordinates: { latitude: 30.2636, longitude: -97.7205, accuracyMeters: 14 } },
  columbus: { label: "Franklinton transfer depot", city: "Columbus", region: "OH", country: "US", coordinates: { latitude: 39.9612, longitude: -83.0107, accuracyMeters: 22 } },
  miami: { label: "PortMiami terminal 4", city: "Miami", region: "FL", country: "US", coordinates: { latitude: 25.7781, longitude: -80.1794, accuracyMeters: 31 } },
};

async function clearDatabase() {
  await prisma.idempotencyKey.deleteMany();
  await prisma.session.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.attestation.deleteMany();
  await prisma.aIAlert.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.evidenceMetadata.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.event.deleteMany();
  await prisma.witness.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await clearDatabase();

  const [admin, reviewer, requester, witnessOwner, staker] = await Promise.all([
    prisma.user.create({ data: { id: "usr_demo_admin", email: "admin@resonance.local", walletAddress: "DemoAdminWallet", displayName: "Demo Admin", role: "ADMIN" } }),
    prisma.user.create({ data: { id: "usr_demo_reviewer", email: "reviewer@resonance.local", walletAddress: "DemoReviewerWallet", displayName: "Demo Reviewer", role: "REVIEWER" } }),
    prisma.user.create({ data: { id: "usr_demo_requester", email: "requester@resonance.local", walletAddress: "DemoRequesterWallet", displayName: "Demo Requester", role: "REQUESTER" } }),
    prisma.user.create({ data: { id: "usr_demo_witness", email: "witness@resonance.local", walletAddress: "DemoWitnessWallet", displayName: "Demo Witness", role: "WITNESS" } }),
    prisma.user.create({ data: { id: "usr_demo_staker", email: "staker@resonance.local", walletAddress: "DemoStakerWallet", displayName: "Demo Staker", role: "STAKER" } }),
  ]);

  const project = await prisma.project.create({ data: { id: "prj_demo_resonance", name: "Resonance Demo Network", description: "Seeded Phase 2 project. All records are application/demo state only.", ownerId: admin.id } });
  await prisma.projectMember.createMany({ data: [
    { projectId: project.id, userId: admin.id, role: "ADMIN" },
    { projectId: project.id, userId: reviewer.id, role: "REVIEWER" },
    { projectId: project.id, userId: requester.id, role: "REQUESTER" },
    { projectId: project.id, userId: witnessOwner.id, role: "WITNESS" },
    { projectId: project.id, userId: staker.id, role: "STAKER" },
  ] });

  const witnessSpecs = [
    ["wit_a728", "Atlas GPS relay", "DEVICE", locations.brooklyn, "ACTIVE", 98.2, 99.1, 12492, 12.4, null],
    ["wit_r119", "Northstar camera", "DEVICE", { ...locations.brooklyn, label: "Brooklyn Navy Yard · Gate C" }, "ACTIVE", 96.7, 98.6, 9084, 10.8, null],
    ["wit_h042", "Recipient signature", "HUMAN", locations.brooklyn, "ACTIVE", 91.4, 96.9, 1278, 4.2, witnessOwner.id],
    ["wit_ai091", "Resonance intelligence", "AI_AGENT", { label: "Distributed", city: "Remote", region: "NA", country: "US" }, "ACTIVE", 94.0, 93.8, 22104, 8.0, null],
    ["wit_q514", "Quorum relay", "SERVICE", { label: "Regional relay", city: "Newark", region: "NJ", country: "US" }, "ACTIVE", 86.5, 89.2, 4110, 6.4, null],
    ["wit_iot77", "Dock 12 vibration sensor", "IOT", locations.brooklyn, "ACTIVE", 90.7, 95.2, 6312, 7.1, null],
    ["wit_harbor", "Harbor observer", "DEVICE", locations.miami, "INACTIVE", 88.1, 94.7, 7821, 9.1, null],
  ] as const;

  const witnesses = new Map<string, { id: string }>();
  for (const [id, name, kind, location, status, reputationScore, accuracyScore, observedEventCount, stakeAmount, userId] of witnessSpecs) {
    const witness = await prisma.witness.create({ data: { id, userId, projectId: project.id, name, kind, description: `Seeded ${String(kind).toLowerCase()} witness. No live protocol identity or staking is attached.`, location, status, reputationScore, accuracyScore, observedEventCount, stakeAmount, stakeSymbol: "SOL", stakeReference: `demo://stake/${id}`, lastSeenAt: status === "ACTIVE" ? now : new Date("2026-10-23T13:40:00.000Z") } });
    witnesses.set(id, witness);
  }

  type EventSpec = {
    id: string;
    title: string;
    description: string;
    eventType: "DELIVERY" | "LOCATION_ARRIVAL";
    category: "LOGISTICS" | "LOCATION" | "SECURITY";
    location: typeof locations.brooklyn;
    occurredAt: string;
    reportedAt: string;
    status: "COMPLETED" | "PROCESSING" | "ACTIVE" | "FAILED";
    state: "VERIFIED" | "REVIEW" | "CHALLENGED" | "REJECTED";
    confidence: number;
    requestStatus: "VERIFIED" | "VERIFYING" | "CHALLENGED" | "FAILED";
    requiredWitnesses: number;
    securityLevel: "STANDARD" | "ELEVATED" | "HIGH" | "CRITICAL";
    witnessIds: string[];
  };

  const eventSpecs: EventSpec[] = [
    { id: "evt_8271", title: "Delivery completed", description: "A delivery handoff observed by independent devices, a recipient, a relay, an IoT sensor, and an advisory analysis service.", eventType: "DELIVERY", category: "LOGISTICS", location: locations.brooklyn, occurredAt: "2026-10-23T10:31:02.000Z", reportedAt: "2026-10-23T10:31:24.000Z", status: "COMPLETED", state: "VERIFIED", confidence: 96.8, requestStatus: "VERIFIED", requiredWitnesses: 5, securityLevel: "HIGH", witnessIds: ["wit_a728", "wit_r119", "wit_h042", "wit_ai091", "wit_q514", "wit_iot77", "wit_harbor"] },
    { id: "evt_8270", title: "Location arrival", description: "A vehicle arrival is plausible, but the observation window still contains a location variance requiring review.", eventType: "LOCATION_ARRIVAL", category: "LOCATION", location: locations.austin, occurredAt: "2026-10-23T10:22:11.000Z", reportedAt: "2026-10-23T10:22:42.000Z", status: "PROCESSING", state: "REVIEW", confidence: 84.2, requestStatus: "VERIFYING", requiredWitnesses: 3, securityLevel: "ELEVATED", witnessIds: ["wit_a728", "wit_q514", "wit_ai091"] },
    { id: "evt_8269", title: "Warehouse arrival observed", description: "Independent field and relay sources place a tagged shipment inside the receiving perimeter.", eventType: "LOCATION_ARRIVAL", category: "LOCATION", location: locations.brooklyn, occurredAt: "2026-10-23T10:15:18.000Z", reportedAt: "2026-10-23T10:15:46.000Z", status: "COMPLETED", state: "VERIFIED", confidence: 98.4, requestStatus: "VERIFIED", requiredWitnesses: 3, securityLevel: "STANDARD", witnessIds: ["wit_a728", "wit_q514", "wit_iot77"] },
    { id: "evt_8268", title: "Delivery handoff challenged", description: "A conflicting receipt timestamp disputes whether custody changed at the depot.", eventType: "DELIVERY", category: "LOGISTICS", location: locations.columbus, occurredAt: "2026-10-23T09:58:04.000Z", reportedAt: "2026-10-23T09:58:31.000Z", status: "ACTIVE", state: "CHALLENGED", confidence: 72.3, requestStatus: "CHALLENGED", requiredWitnesses: 5, securityLevel: "HIGH", witnessIds: ["wit_r119", "wit_h042", "wit_q514", "wit_ai091"] },
    { id: "evt_8267", title: "Device signature anomaly", description: "A terminal contact signal is inconsistent with the witness source's historical profile.", eventType: "LOCATION_ARRIVAL", category: "SECURITY", location: locations.miami, occurredAt: "2026-10-23T09:45:50.000Z", reportedAt: "2026-10-23T09:46:12.000Z", status: "FAILED", state: "REJECTED", confidence: 18.6, requestStatus: "FAILED", requiredWitnesses: 3, securityLevel: "CRITICAL", witnessIds: ["wit_harbor", "wit_q514", "wit_ai091"] },
  ];

  for (const spec of eventSpecs) {
    const event = await prisma.event.create({ data: { id: spec.id, projectId: project.id, createdById: requester.id, eventType: spec.eventType, title: spec.title, description: spec.description, category: spec.category, location: spec.location, occurredAt: new Date(spec.occurredAt), reportedAt: new Date(spec.reportedAt), status: spec.status, state: spec.state, confidence: spec.confidence, startedAt: new Date(spec.occurredAt), completedAt: spec.status === "COMPLETED" || spec.status === "FAILED" ? new Date(spec.reportedAt) : null } });
    await prisma.verificationRequest.create({ data: { id: `vreq_${spec.id.slice(4)}`, eventId: event.id, projectId: project.id, requestedById: requester.id, status: spec.requestStatus, eventType: spec.eventType, title: spec.title, description: spec.description, category: spec.category, location: spec.location, requiredWitnesses: spec.requiredWitnesses, deadline: new Date("2026-10-24T10:31:22.000Z"), securityLevel: spec.securityLevel, occurredAt: new Date(spec.occurredAt) } });

    for (const [index, witnessId] of spec.witnessIds.entries()) {
      const observationId = `obs_${spec.id.slice(4)}_${String(index + 1).padStart(2, "0")}`;
      const isAnomaly = spec.id === "evt_8271" && witnessId === "wit_harbor";
      await prisma.observation.create({ data: { id: observationId, eventId: event.id, witnessId, submittedById: witnessId === "wit_h042" ? witnessOwner.id : admin.id, kind: witnessId === "wit_a728" ? "LOCATION" : witnessId === "wit_r119" ? "IMAGE" : witnessId === "wit_h042" ? "SIGNATURE" : witnessId === "wit_ai091" ? "AI_ANALYSIS" : "CONFIRMATION", status: isAnomaly ? "REVIEW" : "ACCEPTED", summary: isAnomaly ? "Observation arrived outside the expected consensus window." : `${witnesses.get(witnessId)?.id ?? witnessId} submitted an independent observation for ${spec.title}.`, payload: { source: "phase-2-seed", independent: true, anomaly: isAnomaly }, contentHash: `sha256:demo-${observationId}`, confidence: isAnomaly ? 54 : Math.max(72, spec.confidence - index), observedAt: new Date(new Date(spec.occurredAt).getTime() + index * 8_000), receivedAt: new Date(new Date(spec.occurredAt).getTime() + index * 8_000 + 2_000) } });
    }

    const evidenceKinds: Array<"LOCATION" | "IMAGE" | "SIGNATURE" | "AI_REPORT" | "DEVICE_DATA" | "VIDEO"> = spec.id === "evt_8271" ? ["LOCATION", "IMAGE", "SIGNATURE", "AI_REPORT", "DEVICE_DATA", "VIDEO"] : ["LOCATION", "DEVICE_DATA"];
    for (const [index, kind] of evidenceKinds.entries()) {
      const observationId = `obs_${spec.id.slice(4)}_${String(Math.min(index + 1, spec.witnessIds.length)).padStart(2, "0")}`;
      await prisma.evidenceMetadata.create({ data: { id: `evd_${spec.id.slice(4)}_${String(index + 1).padStart(2, "0")}`, eventId: event.id, observationId, witnessId: spec.witnessIds[index % spec.witnessIds.length], submittedById: admin.id, kind, label: `${kind.replace("_", " ")} metadata`, description: "Metadata-only seeded evidence reference. No artifact is fetched or cryptographically anchored.", collectedAt: new Date(new Date(spec.occurredAt).getTime() + (index + 1) * 8_000), contentHash: `sha256:demo-evd-${spec.id}-${index}`, storageReference: `demo://evidence/${spec.id}/${index}`, artifactRef: `demo://evidence/${spec.id}/${index}`, metadata: { source: "phase-2-seed", isSimulation: true }, status: spec.state === "REJECTED" ? "REJECTED" : index === 0 ? "VERIFIED" : "RECEIVED", confidence: spec.state === "REJECTED" ? 18.6 : spec.confidence } });
    }

    if (spec.id === "evt_8271" || spec.id === "evt_8270" || spec.id === "evt_8268" || spec.id === "evt_8267") {
      await prisma.aIAlert.create({ data: { id: `alert_${spec.id.slice(4)}_01`, eventId: event.id, type: spec.id === "evt_8267" ? "SPOOFING_RISK" : spec.id === "evt_8271" ? "ANOMALY" : "CONFLICTING_SIGNAL", category: spec.id === "evt_8271" ? "TIMING_ANOMALY" : spec.id === "evt_8270" ? "LOCATION_ANOMALY" : "EVIDENCE_ANOMALY", severity: spec.id === "evt_8267" ? "CRITICAL" : spec.id === "evt_8271" ? "MEDIUM" : "LOW", status: "OPEN", title: spec.id === "evt_8271" ? "Timestamp drift needs review" : "Advisory signal requires review", description: "Deterministic Phase 2 analysis found a signal worth human review.", message: "This advisory record is not an authoritative verification decision.", modelName: "deterministic-advisory-rules", modelVersion: "phase-2.0", confidence: spec.confidence / 100, modelConfidence: spec.confidence / 100, evidenceIds: [], recommendedAction: "Inspect source provenance and witness timing.", detectedAt: new Date(spec.reportedAt) } });
    }

    if (spec.id === "evt_8268" || spec.id === "evt_8267") {
      await prisma.challenge.create({ data: { id: `chl_${spec.id.slice(4)}_01`, eventId: event.id, raisedById: reviewer.id, reason: spec.id === "evt_8268" ? "CONFLICTING_OBSERVATION" : "SUSPECTED_FRAUD", description: spec.id === "evt_8268" ? "Review the conflicting custody timestamps." : "Review the anomalous device signature profile.", stakeAmount: 0, stakeSymbol: "USDC", stakeReference: null, status: spec.id === "evt_8268" ? "UNDER_REVIEW" : "ACCEPTED", createdAt: new Date(spec.reportedAt), reviewDeadline: new Date("2026-10-24T12:00:00.000Z"), resolvedAt: spec.id === "evt_8267" ? new Date("2026-10-23T13:20:00.000Z") : null, resolution: spec.id === "evt_8267" ? "UPHELD" : null } });
    }

    if (spec.state === "VERIFIED") {
      await prisma.attestation.create({ data: { id: `att_${spec.id.slice(4)}`, eventId: event.id, createdById: admin.id, status: "SIMULATED", publicationState: "SIMULATION_ONLY", network: "solana-devnet", programId: "not-configured", commitment: `demo:${event.id}:confidence:${event.confidence}`, adapterReference: `demo-attestation:${event.id}`, simulatedAt: new Date(spec.reportedAt) } });
    }

    await prisma.auditLog.create({ data: { actorId: admin.id, action: "EVENT_UPDATED", entityType: "Event", entityId: event.id, requestId: `seed-${event.id}`, metadata: { source: "phase-2-seed", isSimulation: true }, createdAt: new Date(spec.reportedAt) } });
  }

  await prisma.notification.create({ data: { id: "ntf_demo_challenge", userId: admin.id, eventId: "evt_8268", type: "CHALLENGE", status: "UNREAD", title: "Challenge under review", body: "Challenge chl_8268_01 needs reviewer attention.", createdAt: now } });

  console.log(JSON.stringify({ seeded: true, projectId: project.id, primaryEventId: "evt_8271", eventIds: eventSpecs.map((event) => event.id), witnessIds: witnessSpecs.map(([id]) => id) }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
