# RESONANCE — Backend API & Application Services

This directory contains the application orchestration layer, database models (Prisma), REST API boundary, and Solana blockchain integration adapters.

## Architecture
- `app/api/` — Next.js REST API route handlers (`/api/health`, `/api/events`, `/api/attestations`, `/api/witnesses`, etc.).
- `server/` — Application orchestrator, domain state machine, confidence scoring, authentication, Solana adapters, and cryptographic integrity service.
- `prisma/` — PostgreSQL schema, SQL migrations, and database seed fixtures.
- `compose.yaml` — Docker Compose setup for local PostgreSQL.

## Getting Started
```bash
# 1. Start database
docker compose up -d postgres

# 2. Apply migrations & seed
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed

# 3. Start API dev server (Port 4000)
npm run dev

# 4. Run tests
npm test
```
