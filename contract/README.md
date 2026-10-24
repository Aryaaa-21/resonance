# RESONANCE — Solana Smart Contract

This directory contains the Solana Anchor program and TypeScript client SDK for Resonance Protocol.

## Directory Structure
- `programs/resonance/` — Anchor Rust smart contract source code.
- `tests/` — Mocha/Chai integration tests for the Anchor program.
- `sdk/` — Protocol client SDK (PDA derivation, instruction builders, evidence hashing, state decoding).
- `Anchor.toml` — Anchor workspace configuration.
- `Cargo.toml` — Rust dependencies and workspace definition.

## Commands
```bash
# Build the Anchor program
anchor build

# Run the test suite
anchor test
```
