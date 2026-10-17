import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

describe("resonance protocol core", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Resonance as any;
  const authority = provider.wallet.publicKey;
  const resolver = Keypair.generate();
  const challenger = Keypair.generate();
  const wrongSigner = Keypair.generate();
  const witnessOneOwner = Keypair.generate();
  const witnessTwoOwner = Keypair.generate();
  const config = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId)[0];

  const bytes = (value: number): Buffer => Buffer.alloc(32, value);
  const eventPda = (eventId: number): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("event"), new anchor.BN(eventId).toArrayLike(Buffer, "le", 8)],
      program.programId,
    )[0];
  const witnessPda = (owner: PublicKey, witnessId: Buffer): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("witness"), owner.toBuffer(), witnessId],
      program.programId,
    )[0];
  const attestationPda = (event: PublicKey, witness: PublicKey): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("attestation"), event.toBuffer(), witness.toBuffer()],
      program.programId,
    )[0];
  const challengePda = (event: PublicKey, challengeId: Buffer): PublicKey =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("challenge"), event.toBuffer(), challengeId],
      program.programId,
    )[0];

  const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  async function airdrop(keypair: Keypair) {
    const signature = await provider.connection.requestAirdrop(keypair.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature, "confirmed");
  }

  async function waitForSlot(target: number) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if ((await provider.connection.getSlot("confirmed")) >= target) return;
      await sleep(250);
    }
    assert.fail(`local validator did not reach slot ${target}`);
  }

  async function expectFailure(action: () => Promise<unknown>, expectedCode?: string) {
    try {
      await action();
      assert.fail("expected the instruction to fail");
    } catch (error: any) {
      if (!expectedCode) return;
      const code = error?.error?.errorCode?.code;
      assert.equal(code, expectedCode, `expected ${expectedCode}, received ${code ?? error}`);
    }
  }

  async function registerWitness(owner: Keypair, witnessId: Buffer) {
    const witness = witnessPda(owner.publicKey, witnessId);
    await program.methods
      .registerWitness(witnessId, { device: {} }, bytes(0x20))
      .accounts({ config, witness, owner: owner.publicKey, systemProgram: SystemProgram.programId })
      .signers([owner])
      .rpc();
    return witness;
  }

  async function createEvent(eventId: number, deadlineOffset: number) {
    const deadline = (await provider.connection.getSlot("processed")) + deadlineOffset;
    const event = eventPda(eventId);
    await program.methods
      .createEvent({ delivery: {} }, new anchor.BN(eventId), bytes(0x10 + eventId), bytes(eventId), new anchor.BN(deadline), 2, 2)
      .accountsPartial({ config, event, creator: authority, systemProgram: SystemProgram.programId })
      .rpc();
    return { event, deadline };
  }

  async function submit(event: PublicKey, owner: Keypair, witness: PublicKey, result: "supports" | "refutes") {
    const attestation = attestationPda(event, witness);
    const slot = await provider.connection.getSlot("processed");
    const observationTimestamp = await provider.connection.getBlockTime(slot);
    assert.isNotNull(observationTimestamp);
    await program.methods
      .submitAttestation(result === "supports" ? { supports: {} } : { refutes: {} }, bytes(0x30), bytes(result === "supports" ? 0x41 : 0x42), bytes(0x50), new anchor.BN(observationTimestamp))
      .accounts({
        config,
        event,
        witness,
        attestation,
        submitter: owner.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner])
      .rpc();
    return attestation;
  }

  before(async () => {
    await Promise.all([airdrop(resolver), airdrop(challenger), airdrop(wrongSigner), airdrop(witnessOneOwner), airdrop(witnessTwoOwner)]);
    await program.methods
      .initializeProtocol(resolver.publicKey, 2, new anchor.BN(2), new anchor.BN(10))
      .accounts({ authority, config, systemProgram: SystemProgram.programId })
      .rpc();
  });

  it("initializes deterministic config and registers witnesses", async () => {
    const witnessOne = await registerWitness(witnessOneOwner, bytes(1));
    const witnessTwo = await registerWitness(witnessTwoOwner, bytes(2));
    const account = await program.account.protocolConfig.fetch(config);
    assert.equal(account.authority.toBase58(), authority.toBase58());
    assert.equal(account.resolver.toBase58(), resolver.publicKey.toBase58());
    assert.equal(account.minAttestations, 2);
    assert.equal((await program.account.witness.fetch(witnessOne)).active, true);
    assert.equal((await program.account.witness.fetch(witnessTwo)).owner.toBase58(), witnessTwoOwner.publicKey.toBase58());
  });

  it("finalizes a majority result as explicitly provisional consensus", async () => {
    const { event, deadline } = await createEvent(1, 4);
    const witnessOne = witnessPda(witnessOneOwner.publicKey, bytes(1));
    const witnessTwo = witnessPda(witnessTwoOwner.publicKey, bytes(2));
    const attestationOne = await submit(event, witnessOneOwner, witnessOne, "supports");
    await submit(event, witnessTwoOwner, witnessTwo, "supports");
    const storedAttestation = await program.account.attestation.fetch(attestationOne);
    assert.deepEqual(Buffer.from(storedAttestation.witnessSignatureCommitment), bytes(0x50));
    await waitForSlot(deadline + 2);

    await program.methods
      .finalizeEvent(bytes(0x51))
      .accounts({ config, event, resolver: resolver.publicKey })
      .signers([resolver])
      .rpc();

    const stored = await program.account.event.fetch(event);
    assert.equal(stored.status.finalized !== undefined, true);
    assert.equal(stored.hasFinalOutcome, true);
    assert.equal(stored.finalOutcome, true);
    assert.equal(stored.provisionalConsensus, true);
  });

  it("rejects insufficient attestations even after the deadline", async () => {
    const { event, deadline } = await createEvent(2, 3);
    const witnessOne = witnessPda(witnessOneOwner.publicKey, bytes(1));
    await submit(event, witnessOneOwner, witnessOne, "supports");
    await waitForSlot(deadline + 2);
    await expectFailure(
      () =>
        program.methods
          .finalizeEvent(bytes(0x52))
          .accounts({ config, event, resolver: resolver.publicKey })
          .signers([resolver])
          .rpc(),
      "InsufficientDistinctWitnesses",
    );
  });

  it("blocks finalization with an open challenge and resumes after dismissal", async () => {
    const { event, deadline } = await createEvent(3, 4);
    const witnessOne = witnessPda(witnessOneOwner.publicKey, bytes(1));
    const witnessTwo = witnessPda(witnessTwoOwner.publicKey, bytes(2));
    await submit(event, witnessOneOwner, witnessOne, "supports");
    await submit(event, witnessTwoOwner, witnessTwo, "supports");
    await waitForSlot(deadline + 2);
    await program.methods
      .finalizeEvent(bytes(0x53))
      .accounts({ config, event, resolver: resolver.publicKey })
      .signers([resolver])
      .rpc();
    const challengeId = bytes(3);
    const challenge = challengePda(event, challengeId);
    await program.methods
      .openChallenge(challengeId, bytes(0x52), new anchor.BN(10))
      .accounts({ config, event, challenge, challenger: challenger.publicKey, systemProgram: SystemProgram.programId })
      .signers([challenger])
      .rpc();
    await expectFailure(() =>
      program.methods
        .openChallenge(challengeId, bytes(0x52), new anchor.BN(10))
        .accounts({ config, event, challenge, challenger: challenger.publicKey, systemProgram: SystemProgram.programId })
        .signers([challenger])
        .rpc(),
    );
    await waitForSlot(deadline + 2);
    await expectFailure(
      () =>
        program.methods
          .finalizeEvent(bytes(0x54))
          .accounts({ config, event, resolver: resolver.publicKey })
          .signers([resolver])
          .rpc(),
      "OpenChallengeBlocksFinalization",
    );
    await program.methods
      .resolveChallenge(false)
      .accounts({ config, event, challenge, resolver: resolver.publicKey })
      .signers([resolver])
      .rpc();
    await program.methods
      .closeChallenge(challengeId)
      .accounts({ event, challenge, closer: challenger.publicKey })
      .signers([challenger])
      .rpc();
    const stored = await program.account.event.fetch(event);
    assert.equal(stored.status.finalized !== undefined, true);
  });

  it("enforces pause, deadline, wrong signer, wrong PDA, and replay protection", async () => {
    await program.methods
      .pauseProtocol()
      .accounts({ config, authority })
      .rpc();
    await expectFailure(() => createEvent(4, 5), "ProtocolPaused");
    await program.methods.unpauseProtocol().accounts({ config, authority }).rpc();

    const { event, deadline } = await createEvent(5, 6);
    const witnessOne = witnessPda(witnessOneOwner.publicKey, bytes(1));
    const witnessTwo = witnessPda(witnessTwoOwner.publicKey, bytes(2));
    await expectFailure(
      () => submit(event, wrongSigner, witnessOne, "supports"),
      "UnauthorizedWitness",
    );
    await submit(event, witnessOneOwner, witnessOne, "supports");
    await submit(event, witnessTwoOwner, witnessTwo, "supports");
    await expectFailure(
      () =>
        program.methods
          .finalizeEvent(bytes(0x55))
          .accounts({ config, event, resolver: resolver.publicKey })
          .signers([resolver])
          .rpc(),
      "DeadlineNotReached",
    );
    await waitForSlot(deadline + 2);
    await program.methods
      .finalizeEvent(bytes(0x56))
      .accounts({ config, event, resolver: resolver.publicKey })
      .signers([resolver])
      .rpc();

    await expectFailure(() => createEvent(1, 5));
    await expectFailure(() => registerWitness(witnessOneOwner, bytes(1)));
    await expectFailure(() => submit(event, witnessOneOwner, witnessOne, "supports"));
    await expectFailure(
      () =>
        program.methods
          .registerWitness(bytes(9), { device: {} }, bytes(0x20))
          .accounts({
            config,
            witness: witnessPda(witnessOneOwner.publicKey, bytes(8)),
            owner: witnessOneOwner.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([witnessOneOwner])
          .rpc(),
    );
  });

  it("supports authority cancellation and resolver close", async () => {
    const { event } = await createEvent(6, 10);
    await program.methods
      .cancelEvent()
      .accounts({ config, event, authority })
      .rpc();
    await program.methods
      .closeEvent()
      .accounts({ config, event, resolver: resolver.publicKey, recipient: resolver.publicKey })
      .signers([resolver])
      .rpc();
    assert.isNull(await provider.connection.getAccountInfo(event));
  });
});
