import { withRoute, json } from "@/server/http";
import { getRuntimeConfig } from "@/server/config";

export const GET = withRoute(async (_request, _context, meta) => {
  const config = getRuntimeConfig();
  return json({ data: { status: "ok", service: "resonance-api", requestId: meta.requestId, demoMode: config.demoMode, databaseConfigured: Boolean(config.databaseUrl), claims: { realChain: false, consensus: false, staking: false, cryptographicAttestation: false, aiAuthority: false } } });
}, { name: "health" });
