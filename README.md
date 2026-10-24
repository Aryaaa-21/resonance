# RESONANCE Protocol

RESONANCE is a decentralized, real-world event verification protocol powered by Solana Anchor, cryptographic evidence integrity receipts, and an application orchestration backend.

## Monorepo Architecture

The repository is organized into three primary modules:

```text
resonance/
├── frontend/     # Next.js React UI, interactive console, 3D globe visualization
├── backend/      # Next.js / Node REST API, Prisma ORM, application services
└── contract/     # Solana Anchor program in Rust, test suites, and client SDK
```

---

### 1. `frontend/`
- **Stack**: Next.js 16, React 19, Framer Motion, Tailwind CSS, Lucide.
- **Key Views**: Landing page, Protocol Console, Event Submissions, Witness Registry, Dispute Challenges, Staking, and 3D Network Globe.
- **Port**: `http://localhost:3000`

### 2. `backend/`
- **Stack**: Next.js App Router API, Node.js, Prisma ORM, PostgreSQL, Solana Web3.js, Zod.
- **Services**: Verification request state machine, AI confidence scoring, cryptographic receipt verification, and Solana transaction indexer.
- **Port**: `http://localhost:4000`

### 3. `contract/`
- **Stack**: Rust, Solana Anchor framework, TypeScript SDK, Mocha & Chai.
- **Core Accounts & Instructions**: Initialization, Witness Registration, Event Publication, Attestation Submission, and Dispute Resolution.

---

## Quick Start

### 1. Backend & Database
```bash
cd backend
docker compose up -d postgres
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Solana Smart Contract
```bash
cd contract
anchor build
anchor test
```
