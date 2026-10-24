# RESONANCE — Phase 4

RESONANCE is a production-grade frontend plus application backend foundation for a real-world event verification protocol. Phase 2 adds the application orchestration layer behind the Phase 1 experience, Phase 3 adds the wallet-signed Solana boundary, and Phase 4 adds deterministic cryptographic evidence integrity:

```text
FRONTEND → REST API → APPLICATION SERVICES → POSTGRESQL
                                      ↘ cryptographic integrity receipts
                                      ↘ protocol adapter boundary → Solana Anchor
```

The backend stores and coordinates application state. Phase 3 adds a TypeScript Solana SDK and wallet-signed Anchor transaction boundary. The server can prepare unsigned transactions and sync caller-submitted signatures; it never uses a server private key, fabricates a signature, or claims chain success before RPC confirmation.

## Local development

Install dependencies:

```bash
npm install
```

Start PostgreSQL with Docker Compose:

```bash
docker compose up -d postgres
```

Copy `.env.example` to `.env`, then apply the initial migration and seed data:

```bash
cp .env.example .env
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

Run the application:

```bash
npm run dev
```

Open http://localhost:3000.

## Frontend routes

- `/`
- `/network`
- `/developers`
- `/dashboard`
- `/events`
- `/events/create`
- `/events/[id]`
- `/witnesses`
- `/witnesses/[id]`
- `/challenges`
- `/staking`
- `/agent`
- `/settings`

## Backend API

The Next.js App Router hosts the REST boundary under `/api`. The documented contract is available at `/api/openapi`.

Health:

- `GET /api/health` — liveness and explicit non-claims
- `GET /api/health/ready` — PostgreSQL readiness

Application areas:

- `/api/auth/*`
- `/api/verification-requests`
- `/api/events`
- `/api/witnesses`
- `/api/challenges`
- `/api/ai/alerts`
- `/api/network/*`
- `POST /api/events/:id/attestations` — demo simulation or unsigned Solana transaction preparation
- `POST /api/attestations/sync` — sync a caller-submitted signature and persist confirmed chain metadata
- `GET /api/attestations/:id/verify` — independently recompute Phase 4 integrity and verify the anchored transaction

Collection endpoints accept `page` and `pageSize` (or `limit`) and return `{ data, meta }`. State-changing requests require an `Idempotency-Key`.

## Configuration

- `DATABASE_URL` — PostgreSQL connection string.
- `RES_DEMO_MODE=true` — enables development-only in-memory session auth when PostgreSQL is unavailable. It does not create fake database records.
- `RES_ALLOWED_ORIGINS` / `FRONTEND_URL` — explicit CORS allowlist.
- `NEXT_PUBLIC_API_URL` — optional frontend API origin; when unset, frontend adapters use same-origin `/api`.
- `NEXT_PUBLIC_DEMO_MODE=true` — deliberately uses Phase 1 mock adapters. In development, backend-unavailable responses can fall back to demo adapters and are marked `DEMO`. Production never silently falls back.
- `SOLANA_PROTOCOL_ADAPTER=demo|solana` — selects the server adapter for chain-aware operations; demo is the safe default.
- `SOLANA_NETWORK`, `SOLANA_RPC_URL`, `SOLANA_PROGRAM_ID`, `SOLANA_COMMITMENT` — server Solana configuration.
- `NEXT_PUBLIC_SOLANA_NETWORK`, `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_SOLANA_PROGRAM_ID` — frontend SDK configuration.

## Architecture

- `types/` — frontend-facing domain contracts.
- `lib/api/` — transport-agnostic frontend API client and resource adapters.
- `lib/mock/` / `lib/data/` — isolated Phase 1 simulation boundary.
- `prisma/schema.prisma` — application database schema.
- `prisma/migrations/` — deployable PostgreSQL migrations.
- `prisma/seed.ts` — internally consistent demo dataset, including Event #8271 and related observations/evidence/alerts. Existing seed rows remain chain-null and simulation-labeled.
- `prisma/migrations/0003_phase3_chain_metadata/` — additive nullable chain metadata and lifecycle enum values.
- `server/application/` — orchestration services and database transactions.
- `server/domain/` — state machine, confidence calculation, authorization, and domain types.
- `sdk/` — PDA derivation, commitment encoding, Anchor instruction builders, network/explorer helpers, state decoding, and transaction lifecycle handling.
- `server/integrations/solana/` — real wallet-signed Solana adapter plus explicit demo fallback.
- `server/services/integrity.ts` — application-side evidence/observation recomputation, witness signature verification, independent verification, and tamper classification.
- `programs/resonance/` — Anchor protocol core with PDA accounts, deterministic state transitions, Phase 4 integrity commitments, provisional consensus, challenge bonds, custom errors, and emitted events.
- `sdk/` — reusable Solana protocol client, PDA helpers, instruction builders, account decoders, commitment/identity utilities, explorer links, and transaction lifecycle tracking.
- `docs/phase-3-protocol.md` — account model, state machine, commitments, authority boundaries, lifecycle, and security assumptions.
- `docs/phase-3-development.md` — local validator, Anchor test, Devnet, wallet, adapter, and indexing workflow.
- `docs/phase-4-integrity.md` — canonicalization, commitments, witness signatures, independent verification, and tamper detection.
- `server/events/` — future real-time update contracts.
- `server/jobs/` — future background job contract.
- `app/api/` — validated REST route handlers.

## Checks

```bash
npm run typecheck
npm test
npm run prisma:validate
npm run prisma:format
npm run build
```

`prisma:validate` requires `DATABASE_URL` to be present, for example:

```bash
DATABASE_URL='postgresql://resonance:resonance@localhost:5432/resonance?schema=public' npm run prisma:validate
```

Phase 4 stores only deterministic commitments and references on-chain; raw evidence remains off-chain. Cryptographic verification proves integrity and signing-key authenticity, not real-world truth. Demo mode never returns a real transaction signature. Solana mode returns an unsigned transaction for the caller wallet, and `/api/attestations/sync` only marks a publication confirmed after RPC verification of the expected program instruction, PDA/account envelope, encoded arguments, and submitter signer. Verified syncs advance a small monotonic network/program checkpoint; no phase treats AI output as final authority.

The current application container does not include Rust, Cargo, Solana CLI, or Anchor CLI. Therefore the TypeScript/database checks can run here, while `anchor build`, local-validator integration tests, and Devnet deployment must be run in a Solana toolchain environment. No Devnet deployment is claimed by this repository state.
