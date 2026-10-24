# RESONANCE Phase 4 — Cryptographic Evidence & Integrity Layer

Phase 4 extends the Phase 0–3 application and Solana boundary with deterministic integrity receipts. It does not establish that an event happened in the real world; it establishes that the committed evidence and observation data have not changed and that the attestation was signed by the stated witness key.

## Trust boundary

```text
large evidence artifact (off-chain storage)
        │ content hash + stable storage reference
        ▼
canonical evidence metadata
        │ SHA-256
        ▼
evidence commitment(s) ── sorted set commitment ──┐
canonical observation metadata ── SHA-256 ─────────────┼─ witness signature
                                                       ▼
                                    Solana attestation commitment receipt
```

Only fixed-size commitments, witness signature commitment, PDAs, and storage/reference identifiers are persisted in the protocol receipt. Raw images, video, documents, sensor payloads, and other large artifacts remain off-chain.

## Canonicalization

` sdk/evidence.ts ` defines the versioned canonical JSON format. It sorts object keys, preserves array order, emits compact JSON, rejects undefined/bigint/non-finite values, and includes an explicit domain/version field. Evidence records commit `kind`, labels, description, collection time, the producer-supplied raw artifact hash, stable storage reference, and metadata. Observation records commit event/witness identity, observation kind/summary, payload, optional content hash, and observed time.

The set commitment sorts leaf hashes before hashing, so insertion order does not change the commitment. Raw evidence bytes are never serialized into the commitment request.

## Witness signatures

The witness signs a domain-separated canonical message containing the protocol event number, witness owner public key, witness ID, observation commitment, and evidence-set commitment. The server verifies the Ed25519 signature before preparing the Solana transaction and stores only the signature (application receipt), its hash commitment, and the public-key identity.

The signature proves authorization by the key that signed the commitment message. It does not prove that the underlying claim is true.

## Solana anchor

`submit_attestation` now carries three 32-byte integrity values: observation commitment, evidence-set commitment, and witness-signature commitment. The existing PDA/account envelope and wallet-signed transaction flow remain unchanged. Legacy Phase 3 callers remain source-compatible by defaulting the signature commitment to the evidence commitment; Phase 4 callers must use `integrityMode=phase4` and supply a verified observation, evidence set, and witness signature.

## Independent verification

`GET /api/attestations/:id/verify` recomputes the observation and evidence commitments from PostgreSQL metadata, verifies the witness signature, checks the expected Solana instruction envelope and reads back the Anchor attestation PDA to compare all on-chain integrity fields, and returns separate results for observation, evidence, signature, and chain anchoring. It records the receipt status as `VERIFIED`, `UNVERIFIED`, or `TAMPERED`. A mismatch caused by modified or missing committed records is surfaced as tamper detection and marks the affected application records as tampered.

Verification is intentionally independent of the stored `integrityStatus`: it derives the result from current metadata, stored commitments, the signature, and the chain transaction.

## Out of scope

Phase 4 does not add witness-network selection, consensus, economics, staking settlement, rewards/slashing, or AI authority. Those remain later phases or existing advisory-only boundaries.
