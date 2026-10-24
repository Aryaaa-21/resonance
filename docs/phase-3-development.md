# Phase 3 development and deployment

## Prerequisites

Install the versions selected in `Anchor.toml` or a compatible stable Anchor
toolchain, plus Rust, Cargo, Solana CLI, and a funded development keypair.
The current application container has Node.js but does not include Cargo,
`rustc`, `solana`, or the Anchor CLI, so on-chain compilation/deployment must
be run in a Solana development environment.

## TypeScript application checks

```bash
npm install
npm run typecheck
npm test
npm run build
```

The TypeScript SDK is under `sdk/`. It owns PDA derivation, instruction data,
commitment encoding, state decoding, explorer URLs, and transaction lifecycle
tracking. The backend adapter is under `server/integrations/solana/`.

## Local validator

From the repository root:

```bash
solana-test-validator
solana config set --url localhost
anchor build
anchor deploy
anchor test
```

The Anchor tests use localnet, derive all PDAs from the declared program ID,
exercise pause/deadline/duplicate/wrong-signer paths, and do not use Devnet.

## Devnet

Set the provider cluster to Devnet in a deployment-specific Anchor
configuration, fund the deployer with devnet SOL, build, and deploy. Record the
resulting program ID in environment configuration rather than hardcoding it in
UI components:

```dotenv
SOLANA_PROTOCOL_ADAPTER=solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=<deployed-program-id>
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_PROGRAM_ID=<deployed-program-id>
```

Do not set `SOLANA_PROTOCOL_ADAPTER=solana` until the program is deployed at
the configured ID and the wallet is on the same cluster.

## Wallet transaction flow

1. The backend validates the application event and prepares an unsigned transaction.
2. The browser wallet signs it; the backend never receives a private key.
3. The client submits the signed transaction to the configured RPC endpoint.
4. The client observes `submitted`, `confirmed`, or `finalized` status.
5. The client calls `POST /api/attestations/sync` with the real signature.
6. `POST /api/attestations/sync` fetches the RPC transaction and verifies the expected program instruction, ordered PDA/account list, encoded arguments, and submitter signer before it records `confirmed` or `finalized`.
7. PostgreSQL stores the observed signature, slot, confirmation status, program ID, PDA metadata, and lifecycle; verified syncs also advance a monotonic per-network/program checkpoint.

An unsigned transaction is not a successful protocol operation. A submitted
signature is not finality. The UI must only say finalized after RPC reports the
requested finality and the relevant account state is readable.

## Backend indexing boundary

`SolanaIndexer` is intentionally a small polling boundary for Phase 3. It can
read protocol-owned account bytes and RPC signature status. The sync route adds
a minimal database checkpoint (`ChainSyncCheckpoint`) that only advances for a
higher verified slot; retries and out-of-order responses are idempotent. A future
durable worker can add event-log subscriptions and replay processing without
changing controllers.

## Security checklist

- Never accept a user-provided PDA without deriving and comparing it.
- Never accept a string as a commitment unless it decodes to exactly 32 non-zero bytes.
- Never treat database state as proof that a transaction succeeded.
- Never log wallet private keys, seed phrases, signed transaction secrets, or raw evidence.
- Keep raw evidence, AI inputs/outputs, GPS histories, and UI state off-chain.
- Treat the Anchor upgrade authority as a real trust boundary.
