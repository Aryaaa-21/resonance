# RESONANCE Phase 3 protocol core

Phase 3 introduces the first real on-chain boundary for RESONANCE. The
application database remains the operational source for metadata, workflow,
AI advisory output, and evidence references. The Solana program stores only
compact protocol state and commitments.

## Source-of-truth boundaries

| Layer | Responsibility |
| --- | --- |
| PostgreSQL | Application records, workflow, indexing metadata, RPC lifecycle receipts |
| Evidence storage | Images, video, documents, raw observation payloads |
| Cryptographic layer | Canonical evidence serialization and production commitments; Phase 4 |
| Solana | Protocol identity, authority, bounded commitments, attestation/challenge state |
| AI | Advisory analysis only; it cannot finalize, slash, release funds, or mutate protocol state |

## Program and accounts

The program is `programs/resonance/src/lib.rs` and uses the program ID in
`Anchor.toml`, `.env.example`, and the SDK configuration. The generated local
program keypair must match that ID before deployment.

| Account | Seeds | Purpose |
| --- | --- | --- |
| `ProtocolConfig` | `config` | Authority, resolver, pause state, provisional consensus thresholds, challenge period |
| `Event` | `event`, little-endian `u64 event_id` | Event identity commitment, evidence commitment, bounded state, counters, result commitment |
| `Witness` | `witness`, owner pubkey, 32-byte witness ID | Wallet-owned witness identity, type, metadata commitment, active flag |
| `Attestation` | `attestation`, event PDA, witness PDA | One witness claim per event, observation/evidence commitments, observed timestamp |
| `Challenge` | `challenge`, event PDA, 32-byte challenge ID | Challenge commitment, refundable lamport bond, resolver outcome |

All PDAs use Anchor seed constraints and store their bump. Duplicate event,
witness, attestation, and challenge identities therefore fail deterministically.
An attestation PDA is derived from `(event PDA, witness PDA)`, so the on-chain
attestation count is a distinct-witness count; finalization enforces both the
configured distinct-witness threshold and the attestation threshold.

## Commitments

Phase 3 uses non-zero 32-byte commitments. The SDK accepts a 64-character hex
digest, an optional `0x` prefix, or an optional `sha256:` prefix. Raw text can
be converted with SHA-256 through `commitmentFromText` for development and
identity binding.

The Phase 3 event identity helper hashes the domain-separated canonical form:

```text
resonance:event:v1|creator|client_nonce|created_at_unix_seconds
```

This is not the final evidence serialization. Phase 4 must define canonical
serialization for evidence and observations and every producer must use that
single specification.

## State and provisional consensus

Event state is enforced by instructions rather than arbitrary status writes:

```text
OPEN → ATTESTED → FINALIZED
  └──────────────→ CHALLENGED → FINALIZED or FAILED
OPEN/ATTESTED → CANCELLED
```

The bootstrap rule is intentionally labeled `provisional_consensus`:

- the configured minimum number of attestations is reached;
- the deadline slot has passed;
- supporting and refuting counts are not tied;
- no open challenge remains;
- the configured resolver signs finalization;
- a non-zero result commitment is supplied.

This is not the final decentralized RESONANCE consensus engine.

## Challenge bonds and resolution

Challenge bonds are integer lamports. Phase 3 transfers the declared bond to
the challenge PDA and returns the account balance to the challenger when the
resolved challenge account is closed. Slashing, rewards, treasury settlement,
and token economics are intentionally not implemented. The temporary resolver
is a configured protocol authority; later phases can replace this with a DAO,
arbitration system, or decentralized resolver.

## Access control and pause

- Protocol authority initializes, pauses, unpauses, updates configuration, and cancels events.
- Event creator pays for event creation but cannot arbitrarily finalize an event.
- Witness owner must sign attestations for its witness PDA.
- Configured resolver signs provisional finalization and challenge resolution.
- Only the challenger may close its resolved challenge account.
- Pause blocks event creation, witness registration, attestation submission, and challenge opening; reads remain available through RPC/indexers.

## Account lifecycle and fees

The payer creates the account in each `init` instruction: the authority pays
for `ProtocolConfig`, the creator pays for `Event`, the witness owner pays for
`Witness`, and the challenger pays for `Challenge` and its bond. Event and
challenge close instructions are restricted to the resolver/challenger paths
and reclaim rent only after a safe terminal state.

Phase 3 uses lamports as integer `u64` values. No floating-point SOL values or
custom RESONANCE token are stored on-chain.

## Upgrade and trust assumptions

Development uses the Anchor upgrade authority associated with the deployment
wallet. A production deployment must move upgrade control to a secured
multisig or governance process. Until that transition, the program is not
trustless with respect to upgrades.

Phase 3 assumes Solana consensus is secure, wallet signatures are authentic,
commitments are generated correctly by off-chain producers, witness identity
is not yet fully decentralized, and provisional consensus is not the final
protocol algorithm.
