use anchor_lang::prelude::*;

// Generated program id for the local Anchor workspace. A deploy must use the matching keypair.
declare_id!("Cp1QZyTidu8ZFj5tcYNEw2Z7fJTBmAR6gA8vnzQHNKbT");

pub const SEED_CONFIG: &[u8] = b"config";
pub const SEED_EVENT: &[u8] = b"event";
pub const SEED_WITNESS: &[u8] = b"witness";
pub const SEED_ATTESTATION: &[u8] = b"attestation";
pub const SEED_CHALLENGE: &[u8] = b"challenge";

pub const MAX_ATTESTATIONS: u16 = 128;
pub const MAX_OPEN_CHALLENGES: u16 = 64;
pub const MAX_EVENT_ID: u64 = u64::MAX - 1;

#[program]
pub mod resonance {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        resolver: Pubkey,
        min_attestations: u16,
        challenge_period_slots: u64,
        min_challenge_bond_lamports: u64,
    ) -> Result<()> {
        require!(resolver != Pubkey::default(), ErrorCode::InvalidResolver);
        require_valid_attestation_limit(min_attestations)?;

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.resolver = resolver;
        config.paused = false;
        config.bump = ctx.bumps.config;
        config.min_attestations = min_attestations;
        config.challenge_period_slots = challenge_period_slots;
        config.min_challenge_bond_lamports = min_challenge_bond_lamports;
        config.version = 1;
        config.reserved = [0; 32];

        emit!(ProtocolInitialized {
            config: config.key(),
            authority: config.authority,
            resolver,
            min_attestations,
            challenge_period_slots,
            min_challenge_bond_lamports,
        });
        Ok(())
    }

    pub fn create_event(
        ctx: Context<CreateEvent>,
        event_type: EventType,
        event_id: u64,
        event_identity_commitment: [u8; 32],
        evidence_commitment: [u8; 32],
        deadline_slot: u64,
        required_witnesses: u16,
        required_attestations: u16,
    ) -> Result<()> {
        ensure_not_paused(&ctx.accounts.config)?;
        require!(event_id <= MAX_EVENT_ID, ErrorCode::InvalidEventId);
        require!(non_zero(&event_identity_commitment), ErrorCode::EmptyCommitment);
        require!(non_zero(&evidence_commitment), ErrorCode::EmptyCommitment);
        require!(deadline_slot > Clock::get()?.slot, ErrorCode::InvalidDeadline);
        require!(
            required_witnesses > 0 && required_witnesses <= MAX_ATTESTATIONS,
            ErrorCode::InvalidWitnessRequirement
        );
        require_valid_attestation_limit(required_attestations)?;
        require!(
            required_attestations >= required_witnesses,
            ErrorCode::AttestationRequirementBelowWitnessRequirement
        );
        require!(
            required_attestations >= ctx.accounts.config.min_attestations,
            ErrorCode::BelowConfiguredMinimum
        );

        let event = &mut ctx.accounts.event;
        event.config = ctx.accounts.config.key();
        event.creator = ctx.accounts.creator.key();
        event.event_type = event_type;
        event.event_id = event_id;
        event.protocol_version = ctx.accounts.config.version;
        event.event_identity_commitment = event_identity_commitment;
        event.evidence_commitment = evidence_commitment;
        event.result_commitment = [0; 32];
        event.created_slot = Clock::get()?.slot;
        event.deadline_slot = deadline_slot;
        event.required_witnesses = required_witnesses;
        event.required_attestations = required_attestations;
        event.attestation_count = 0;
        event.yes_count = 0;
        event.no_count = 0;
        event.open_challenges = 0;
        event.status = EventStatus::Open;
        event.final_outcome = false;
        event.has_final_outcome = false;
        event.provisional_consensus = true;
        event.bump = ctx.bumps.event;
        event.reserved = [0; 16];

        emit!(EventCreated {
            event: event.key(),
            event_id,
            creator: event.creator,
            deadline_slot,
            required_attestations,
            provisional_consensus: true,
        });
        Ok(())
    }

    pub fn register_witness(
        ctx: Context<RegisterWitness>,
        witness_id: [u8; 32],
        witness_type: WitnessType,
        metadata_commitment: [u8; 32],
    ) -> Result<()> {
        ensure_not_paused(&ctx.accounts.config)?;
        require!(non_zero(&witness_id), ErrorCode::InvalidIdentifier);
        require!(non_zero(&metadata_commitment), ErrorCode::EmptyCommitment);

        let witness = &mut ctx.accounts.witness;
        witness.config = ctx.accounts.config.key();
        witness.owner = ctx.accounts.owner.key();
        witness.witness_id = witness_id;
        witness.witness_type = witness_type;
        witness.metadata_commitment = metadata_commitment;
        witness.registered_slot = Clock::get()?.slot;
        witness.attestation_count = 0;
        witness.active = true;
        witness.bump = ctx.bumps.witness;
        witness.reserved = [0; 16];

        emit!(WitnessRegistered {
            witness: witness.key(),
            owner: witness.owner,
            witness_id,
        });
        Ok(())
    }

    pub fn submit_attestation(
        ctx: Context<SubmitAttestation>,
        result: AttestationResult,
        observation_commitment: [u8; 32],
        evidence_commitment: [u8; 32],
        witness_signature_commitment: [u8; 32],
        observation_timestamp: i64,
    ) -> Result<()> {
        ensure_not_paused(&ctx.accounts.config)?;
        require!(ctx.accounts.event.status == EventStatus::Open, ErrorCode::EventNotOpen);
        require!(ctx.accounts.witness.active, ErrorCode::WitnessInactive);
        require_keys_eq!(
            ctx.accounts.submitter.key(),
            ctx.accounts.witness.owner,
            ErrorCode::UnauthorizedWitness
        );
        require!(non_zero(&observation_commitment), ErrorCode::EmptyCommitment);
        require!(non_zero(&evidence_commitment), ErrorCode::EmptyCommitment);
        require!(non_zero(&witness_signature_commitment), ErrorCode::EmptyCommitment);

        let now_slot = Clock::get()?.slot;
        require!(now_slot <= ctx.accounts.event.deadline_slot, ErrorCode::DeadlinePassed);
        require!(observation_timestamp > 0 && observation_timestamp <= Clock::get()?.unix_timestamp, ErrorCode::InvalidObservationTimestamp);
        require!(
            ctx.accounts.event.attestation_count < MAX_ATTESTATIONS,
            ErrorCode::AttestationLimitReached
        );

        let attestation = &mut ctx.accounts.attestation;
        attestation.event = ctx.accounts.event.key();
        attestation.witness = ctx.accounts.witness.key();
        attestation.submitter = ctx.accounts.submitter.key();
        attestation.result = result;
        attestation.observation_commitment = observation_commitment;
        attestation.evidence_commitment = evidence_commitment;
        attestation.witness_signature_commitment = witness_signature_commitment;
        attestation.observation_timestamp = observation_timestamp;
        attestation.submitted_slot = now_slot;
        attestation.bump = ctx.bumps.attestation;
        attestation.reserved = [0; 16];

        let event = &mut ctx.accounts.event;
        event.attestation_count = event
            .attestation_count
            .checked_add(1)
            .ok_or(ErrorCode::CounterOverflow)?;
        if event.attestation_count >= event.required_attestations {
            event.status = EventStatus::Attested;
        }
        match result {
            AttestationResult::Supports => {
                event.yes_count = event.yes_count.checked_add(1).ok_or(ErrorCode::CounterOverflow)?;
            }
            AttestationResult::Refutes => {
                event.no_count = event.no_count.checked_add(1).ok_or(ErrorCode::CounterOverflow)?;
            }
            AttestationResult::Inconclusive => {}
        }
        let witness_attestation_count = ctx
            .accounts
            .witness
            .attestation_count
            .checked_add(1)
            .ok_or(ErrorCode::CounterOverflow)?;
        ctx.accounts.witness.attestation_count = witness_attestation_count;

        emit!(AttestationSubmitted {
            attestation: attestation.key(),
            event: event.key(),
            witness: ctx.accounts.witness.key(),
            result,
            submitted_slot: now_slot,
        });
        Ok(())
    }

    pub fn finalize_event(ctx: Context<FinalizeEvent>, result_commitment: [u8; 32]) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.resolver.key(),
            ctx.accounts.config.resolver,
            ErrorCode::UnauthorizedResolver
        );
        require!(ctx.accounts.event.open_challenges == 0, ErrorCode::OpenChallengeBlocksFinalization);
        require!(
            ctx.accounts.event.status == EventStatus::Open
                || ctx.accounts.event.status == EventStatus::Attested,
            ErrorCode::EventNotOpen
        );
        // Each attestation PDA is derived from (event, witness), so the
        // attestation count is a count of distinct witness accounts. Keep the
        // explicit witness threshold here so required_witnesses cannot be
        // configured and then ignored during finalization.
        require!(
            ctx.accounts.event.attestation_count >= ctx.accounts.event.required_witnesses,
            ErrorCode::InsufficientDistinctWitnesses
        );
        require!(
            ctx.accounts.event.attestation_count >= ctx.accounts.event.required_attestations,
            ErrorCode::InsufficientAttestations
        );

        let now_slot = Clock::get()?.slot;
        require!(now_slot >= ctx.accounts.event.deadline_slot, ErrorCode::DeadlineNotReached);
        require!(non_zero(&result_commitment), ErrorCode::EmptyCommitment);
        require!(
            ctx.accounts.event.yes_count != ctx.accounts.event.no_count,
            ErrorCode::NoConsensus
        );

        let event = &mut ctx.accounts.event;
        event.status = EventStatus::Finalized;
        event.result_commitment = result_commitment;
        event.final_outcome = event.yes_count > event.no_count;
        event.has_final_outcome = true;
        event.provisional_consensus = true;
        event.finalized_slot = now_slot;

        emit!(EventFinalized {
            event: event.key(),
            outcome: event.final_outcome,
            yes_count: event.yes_count,
            no_count: event.no_count,
            finalized_slot: now_slot,
            provisional_consensus: true,
        });
        Ok(())
    }

    pub fn open_challenge(
        ctx: Context<OpenChallenge>,
        challenge_id: [u8; 32],
        reason_commitment: [u8; 32],
        // Phase 3 holds a refundable lamport bond on the challenge PDA; slashing and settlement remain out of scope.
        bond_lamports: u64,
    ) -> Result<()> {
        ensure_not_paused(&ctx.accounts.config)?;
        require!(non_zero(&challenge_id), ErrorCode::InvalidIdentifier);
        require!(non_zero(&reason_commitment), ErrorCode::EmptyCommitment);
        require!(
            bond_lamports >= ctx.accounts.config.min_challenge_bond_lamports,
            ErrorCode::InsufficientChallengeBond
        );
        require!(
            ctx.accounts.event.status == EventStatus::Open
                || ctx.accounts.event.status == EventStatus::Attested
                || ctx.accounts.event.status == EventStatus::Finalized,
            ErrorCode::InvalidEventState
        );
        require!(
            ctx.accounts.event.open_challenges < MAX_OPEN_CHALLENGES,
            ErrorCode::ChallengeLimitReached
        );

        let now_slot = Clock::get()?.slot;
        let challenge_start = ctx.accounts.event.finalized_slot;
        let challenge_deadline = if challenge_start > 0 {
            challenge_start
                .checked_add(ctx.accounts.config.challenge_period_slots)
                .ok_or(ErrorCode::CounterOverflow)?
        } else {
            ctx.accounts
                .event
                .deadline_slot
                .checked_add(ctx.accounts.config.challenge_period_slots)
                .ok_or(ErrorCode::CounterOverflow)?
        };
        if challenge_start > 0 {
            require!(now_slot >= challenge_start, ErrorCode::ChallengeWindowClosed);
        }
        require!(now_slot <= challenge_deadline, ErrorCode::ChallengeWindowClosed);

        if bond_lamports > 0 {
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    anchor_lang::system_program::Transfer {
                        from: ctx.accounts.challenger.to_account_info(),
                        to: ctx.accounts.challenge.to_account_info(),
                    },
                ),
                bond_lamports,
            )?;
        }

        let challenge_key = ctx.accounts.challenge.key();
        let challenger_key = ctx.accounts.challenger.key();
        let challenge = &mut ctx.accounts.challenge;
        challenge.event = ctx.accounts.event.key();
        challenge.challenger = challenger_key;
        challenge.challenge_id = challenge_id;
        challenge.reason_commitment = reason_commitment;
        challenge.opened_slot = now_slot;
        challenge.resolved_slot = 0;
        challenge.bond_lamports = bond_lamports;
        challenge.status = ChallengeStatus::Open;
        challenge.upheld = false;
        challenge.bump = ctx.bumps.challenge;
        challenge.reserved = [0; 16];

        let event = &mut ctx.accounts.event;
        event.status = EventStatus::Challenged;
        event.open_challenges = event
            .open_challenges
            .checked_add(1)
            .ok_or(ErrorCode::CounterOverflow)?;

        emit!(ChallengeOpened {
            challenge: challenge_key,
            event: event.key(),
            challenger: challenger_key,
            bond_lamports,
            opened_slot: now_slot,
        });
        Ok(())
    }

    pub fn resolve_challenge(ctx: Context<ResolveChallenge>, upheld: bool) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.resolver.key(),
            ctx.accounts.config.resolver,
            ErrorCode::UnauthorizedResolver
        );
        require!(ctx.accounts.challenge.status == ChallengeStatus::Open, ErrorCode::ChallengeNotOpen);
        require!(
            ctx.accounts.event.status == EventStatus::Challenged,
            ErrorCode::InvalidEventState
        );
        require!(ctx.accounts.event.open_challenges > 0, ErrorCode::CounterUnderflow);

        let now_slot = Clock::get()?.slot;
        let challenge = &mut ctx.accounts.challenge;
        challenge.status = ChallengeStatus::Resolved;
        challenge.upheld = upheld;
        challenge.resolved_slot = now_slot;

        let event = &mut ctx.accounts.event;
        event.open_challenges = event
            .open_challenges
            .checked_sub(1)
            .ok_or(ErrorCode::CounterUnderflow)?;
        if upheld {
            event.status = EventStatus::Failed;
        } else if event.open_challenges == 0 {
            event.status = if event.has_final_outcome {
                EventStatus::Finalized
            } else if event.attestation_count >= event.required_attestations {
                EventStatus::Attested
            } else {
                EventStatus::Open
            };
        }

        emit!(ChallengeResolved {
            challenge: challenge.key(),
            event: event.key(),
            resolver: ctx.accounts.resolver.key(),
            upheld,
            resolved_slot: now_slot,
        });
        Ok(())
    }

    pub fn update_config(
        ctx: Context<UpdateConfig>,
        new_resolver: Pubkey,
        min_attestations: u16,
        challenge_period_slots: u64,
        min_challenge_bond_lamports: u64,
    ) -> Result<()> {
        require!(new_resolver != Pubkey::default(), ErrorCode::InvalidResolver);
        require_valid_attestation_limit(min_attestations)?;

        let config = &mut ctx.accounts.config;
        config.resolver = new_resolver;
        config.min_attestations = min_attestations;
        config.challenge_period_slots = challenge_period_slots;
        config.min_challenge_bond_lamports = min_challenge_bond_lamports;
        config.version = config.version.checked_add(1).ok_or(ErrorCode::CounterOverflow)?;

        emit!(ConfigUpdated {
            config: config.key(),
            authority: config.authority,
            resolver: new_resolver,
            min_attestations,
            challenge_period_slots,
            min_challenge_bond_lamports,
            version: config.version,
        });
        Ok(())
    }

    pub fn pause_protocol(ctx: Context<SetPause>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(!config.paused, ErrorCode::AlreadyPaused);
        config.paused = true;
        emit!(ProtocolPaused { config: config.key(), authority: ctx.accounts.authority.key() });
        Ok(())
    }

    pub fn unpause_protocol(ctx: Context<SetPause>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(config.paused, ErrorCode::NotPaused);
        config.paused = false;
        emit!(ProtocolUnpaused { config: config.key(), authority: ctx.accounts.authority.key() });
        Ok(())
    }

    pub fn cancel_event(ctx: Context<CancelEvent>) -> Result<()> {
        require!(
            ctx.accounts.event.status == EventStatus::Open
                || ctx.accounts.event.status == EventStatus::Challenged,
            ErrorCode::InvalidEventState
        );
        require!(ctx.accounts.event.open_challenges == 0, ErrorCode::OpenChallengeBlocksFinalization);

        let event = &mut ctx.accounts.event;
        event.status = EventStatus::Cancelled;
        emit!(EventCancelled { event: event.key(), authority: ctx.accounts.authority.key() });
        Ok(())
    }

    pub fn close_event(ctx: Context<CloseEvent>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.resolver.key(),
            ctx.accounts.config.resolver,
            ErrorCode::UnauthorizedResolver
        );
        require!(
            ctx.accounts.event.status == EventStatus::Finalized
                || ctx.accounts.event.status == EventStatus::Failed
                || ctx.accounts.event.status == EventStatus::Cancelled,
            ErrorCode::InvalidEventState
        );
        require!(ctx.accounts.event.open_challenges == 0, ErrorCode::OpenChallengeBlocksFinalization);
        if ctx.accounts.event.status == EventStatus::Finalized {
            let now_slot = Clock::get()?.slot;
            let close_slot = ctx.accounts.event.finalized_slot.checked_add(ctx.accounts.config.challenge_period_slots).ok_or(ErrorCode::CounterOverflow)?;
            require!(now_slot >= close_slot, ErrorCode::ChallengeWindowClosed);
        }
        emit!(EventClosed { event: ctx.accounts.event.key(), recipient: ctx.accounts.recipient.key() });
        Ok(())
    }

    pub fn close_challenge(ctx: Context<CloseChallenge>, challenge_id: [u8; 32]) -> Result<()> {
        require!(ctx.accounts.challenge.challenge_id == challenge_id, ErrorCode::InvalidIdentifier);
        require!(ctx.accounts.challenge.status == ChallengeStatus::Resolved, ErrorCode::ChallengeNotResolved);
        require!(
            ctx.accounts.closer.key() == ctx.accounts.challenge.challenger,
            ErrorCode::UnauthorizedCloser
        );
        emit!(ChallengeClosed {
            challenge: ctx.accounts.challenge.key(),
            recipient: ctx.accounts.closer.key(),
        });
        Ok(())
    }
}

fn ensure_not_paused(config: &Account<ProtocolConfig>) -> Result<()> {
    require!(!config.paused, ErrorCode::ProtocolPaused);
    Ok(())
}

fn non_zero(bytes: &[u8; 32]) -> bool {
    bytes.iter().any(|byte| *byte != 0)
}

fn require_valid_attestation_limit(value: u16) -> Result<()> {
    require!(value > 0 && value <= MAX_ATTESTATIONS, ErrorCode::InvalidAttestationLimit);
    Ok(())
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum EventStatus {
    #[default]
    Open,
    Attested,
    Finalized,
    Challenged,
    Failed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum EventType {
    #[default]
    Delivery,
    LocationArrival,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum WitnessType {
    #[default]
    Device,
    Human,
    Service,
    Iot,
    AiAgent,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum AttestationResult {
    #[default]
    Supports,
    Refutes,
    Inconclusive,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
pub enum ChallengeStatus {
    #[default]
    Open,
    Resolved,
}

#[account]
pub struct ProtocolConfig {
    pub authority: Pubkey,
    pub resolver: Pubkey,
    pub paused: bool,
    pub bump: u8,
    pub min_attestations: u16,
    pub challenge_period_slots: u64,
    pub min_challenge_bond_lamports: u64,
    pub version: u8,
    pub reserved: [u8; 32],
}

impl ProtocolConfig {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 1 + 2 + 8 + 8 + 1 + 32;
}

#[account]
pub struct Event {
    pub config: Pubkey,
    pub creator: Pubkey,
    pub event_type: EventType,
    pub event_id: u64,
    pub protocol_version: u8,
    pub event_identity_commitment: [u8; 32],
    pub evidence_commitment: [u8; 32],
    pub result_commitment: [u8; 32],
    pub created_slot: u64,
    pub deadline_slot: u64,
    pub finalized_slot: u64,
    pub required_witnesses: u16,
    pub required_attestations: u16,
    pub attestation_count: u16,
    pub yes_count: u16,
    pub no_count: u16,
    pub open_challenges: u16,
    pub status: EventStatus,
    pub final_outcome: bool,
    pub has_final_outcome: bool,
    pub provisional_consensus: bool,
    pub bump: u8,
    pub reserved: [u8; 16],
}

impl Event {
    pub const LEN: usize = 8 + 32 + 32 + 1 + 8 + 1 + 32 + 32 + 32 + 8 + 8 + 8 + 2 + 2 + 2 + 2 + 2 + 2 + 1 + 1 + 1 + 1 + 1 + 16;
}

#[account]
pub struct Witness {
    pub config: Pubkey,
    pub owner: Pubkey,
    pub witness_id: [u8; 32],
    pub witness_type: WitnessType,
    pub metadata_commitment: [u8; 32],
    pub registered_slot: u64,
    pub attestation_count: u32,
    pub active: bool,
    pub bump: u8,
    pub reserved: [u8; 16],
}

impl Witness {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 32 + 8 + 4 + 1 + 1 + 16;
}

#[account]
pub struct Attestation {
    pub event: Pubkey,
    pub witness: Pubkey,
    pub submitter: Pubkey,
    pub result: AttestationResult,
    pub observation_commitment: [u8; 32],
    pub evidence_commitment: [u8; 32],
    pub witness_signature_commitment: [u8; 32],
    pub observation_timestamp: i64,
    pub submitted_slot: u64,
    pub bump: u8,
    pub reserved: [u8; 16],
}

impl Attestation {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 1 + 32 + 32 + 32 + 8 + 8 + 1 + 16;
}

#[account]
pub struct Challenge {
    pub event: Pubkey,
    pub challenger: Pubkey,
    pub challenge_id: [u8; 32],
    pub reason_commitment: [u8; 32],
    pub opened_slot: u64,
    pub resolved_slot: u64,
    /// Integer lamports held on the challenge PDA as a refundable Phase 3 bond.
    pub bond_lamports: u64,
    pub status: ChallengeStatus,
    pub upheld: bool,
    pub bump: u8,
    pub reserved: [u8; 16],
}

impl Challenge {
    pub const LEN: usize = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8 + 1 + 1 + 1 + 16;
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = ProtocolConfig::LEN, seeds = [SEED_CONFIG], bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(event_type: EventType, event_id: u64)]
pub struct CreateEvent<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = creator,
        space = Event::LEN,
        seeds = [SEED_EVENT, &event_id.to_le_bytes()],
        bump
    )]
    pub event: Account<'info, Event>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(witness_id: [u8; 32])]
pub struct RegisterWitness<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(
        init,
        payer = owner,
        space = Witness::LEN,
        seeds = [SEED_WITNESS, owner.key().as_ref(), witness_id.as_ref()],
        bump
    )]
    pub witness: Account<'info, Witness>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitAttestation<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    #[account(
        mut,
        has_one = config,
        seeds = [SEED_WITNESS, witness.owner.as_ref(), witness.witness_id.as_ref()],
        bump = witness.bump
    )]
    pub witness: Account<'info, Witness>,
    #[account(
        init,
        payer = submitter,
        space = Attestation::LEN,
        seeds = [SEED_ATTESTATION, event.key().as_ref(), witness.key().as_ref()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,
    #[account(mut)]
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeEvent<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(challenge_id: [u8; 32])]
pub struct OpenChallenge<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    #[account(
        init,
        payer = challenger,
        space = Challenge::LEN,
        seeds = [SEED_CHALLENGE, event.key().as_ref(), challenge_id.as_ref()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(mut)]
    pub challenger: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveChallenge<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    #[account(mut, has_one = event, seeds = [SEED_CHALLENGE, event.key().as_ref(), &challenge.challenge_id], bump = challenge.bump)]
    pub challenge: Account<'info, Challenge>,
    pub resolver: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut, has_one = authority, seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPause<'info> {
    #[account(mut, has_one = authority, seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelEvent<'info> {
    #[account(has_one = authority, seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseEvent<'info> {
    #[account(seeds = [SEED_CONFIG], bump = config.bump)]
    pub config: Account<'info, ProtocolConfig>,
    #[account(mut, has_one = config, close = recipient, seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    pub resolver: Signer<'info>,
    #[account(mut)]
    pub recipient: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(challenge_id: [u8; 32])]
pub struct CloseChallenge<'info> {
    #[account(seeds = [SEED_EVENT, &event.event_id.to_le_bytes()], bump = event.bump)]
    pub event: Account<'info, Event>,
    #[account(
        mut,
        close = closer,
        has_one = event,
        constraint = closer.key() == challenge.challenger @ ErrorCode::UnauthorizedCloser,
        seeds = [SEED_CHALLENGE, event.key().as_ref(), challenge_id.as_ref()],
        bump = challenge.bump
    )]
    pub challenge: Account<'info, Challenge>,
    #[account(mut)]
    pub closer: Signer<'info>,
}

#[event]
pub struct ProtocolInitialized {
    pub config: Pubkey,
    pub authority: Pubkey,
    pub resolver: Pubkey,
    pub min_attestations: u16,
    pub challenge_period_slots: u64,
    pub min_challenge_bond_lamports: u64,
}

#[event]
pub struct EventCreated {
    pub event: Pubkey,
    pub event_id: u64,
    pub creator: Pubkey,
    pub deadline_slot: u64,
    pub required_attestations: u16,
    pub provisional_consensus: bool,
}

#[event]
pub struct WitnessRegistered {
    pub witness: Pubkey,
    pub owner: Pubkey,
    pub witness_id: [u8; 32],
}

#[event]
pub struct AttestationSubmitted {
    pub attestation: Pubkey,
    pub event: Pubkey,
    pub witness: Pubkey,
    pub result: AttestationResult,
    pub submitted_slot: u64,
}

#[event]
pub struct EventFinalized {
    pub event: Pubkey,
    pub outcome: bool,
    pub yes_count: u16,
    pub no_count: u16,
    pub finalized_slot: u64,
    pub provisional_consensus: bool,
}

#[event]
pub struct ChallengeOpened {
    pub challenge: Pubkey,
    pub event: Pubkey,
    pub challenger: Pubkey,
    pub bond_lamports: u64,
    pub opened_slot: u64,
}

#[event]
pub struct ChallengeResolved {
    pub challenge: Pubkey,
    pub event: Pubkey,
    pub resolver: Pubkey,
    pub upheld: bool,
    pub resolved_slot: u64,
}

#[event]
pub struct ConfigUpdated {
    pub config: Pubkey,
    pub authority: Pubkey,
    pub resolver: Pubkey,
    pub min_attestations: u16,
    pub challenge_period_slots: u64,
    pub min_challenge_bond_lamports: u64,
    pub version: u8,
}

#[event]
pub struct ProtocolPaused {
    pub config: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct ProtocolUnpaused {
    pub config: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct EventCancelled {
    pub event: Pubkey,
    pub authority: Pubkey,
}

#[event]
pub struct EventClosed {
    pub event: Pubkey,
    pub recipient: Pubkey,
}

#[event]
pub struct ChallengeClosed {
    pub challenge: Pubkey,
    pub recipient: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The protocol is paused")]
    ProtocolPaused,
    #[msg("The protocol is already paused")]
    AlreadyPaused,
    #[msg("The protocol is not paused")]
    NotPaused,
    #[msg("The resolver must be a non-default public key")]
    InvalidResolver,
    #[msg("The event id is outside the supported bound")]
    InvalidEventId,
    #[msg("Commitments and identifiers cannot be all zero")]
    EmptyCommitment,
    #[msg("The identifier is invalid")]
    InvalidIdentifier,
    #[msg("The event deadline must be in the future")]
    InvalidDeadline,
    #[msg("The event must require at least one witness")]
    InvalidWitnessRequirement,
    #[msg("The attestation limit must be between 1 and MAX_ATTESTATIONS")]
    InvalidAttestationLimit,
    #[msg("The event requirement is below the configured minimum")]
    BelowConfiguredMinimum,
    #[msg("The event is not open")]
    EventNotOpen,
    #[msg("The witness is inactive")]
    WitnessInactive,
    #[msg("The signer does not own this witness")]
    UnauthorizedWitness,
    #[msg("The event deadline has passed")]
    DeadlinePassed,
    #[msg("The observation timestamp is invalid")]
    InvalidObservationTimestamp,
    #[msg("The attestation limit has been reached")]
    AttestationLimitReached,
    #[msg("The attestation requirement cannot be below the distinct witness requirement")]
    AttestationRequirementBelowWitnessRequirement,
    #[msg("The event has insufficient distinct witnesses")]
    InsufficientDistinctWitnesses,
    #[msg("The resolver signer is not configured")]
    UnauthorizedResolver,
    #[msg("An open challenge blocks finalization")]
    OpenChallengeBlocksFinalization,
    #[msg("The event has insufficient attestations")]
    InsufficientAttestations,
    #[msg("The finalization deadline has not been reached")]
    DeadlineNotReached,
    #[msg("The attestations do not produce a non-tied provisional consensus")]
    NoConsensus,
    #[msg("The event state does not allow this operation")]
    InvalidEventState,
    #[msg("The challenge bond is below the configured minimum")]
    InsufficientChallengeBond,
    #[msg("The challenge limit has been reached")]
    ChallengeLimitReached,
    #[msg("The challenge window has closed")]
    ChallengeWindowClosed,
    #[msg("The challenge is not open")]
    ChallengeNotOpen,
    #[msg("The challenge is not resolved")]
    ChallengeNotResolved,
    #[msg("The closer is neither the challenger nor the resolver")]
    UnauthorizedCloser,
    #[msg("A checked counter operation overflowed")]
    CounterOverflow,
    #[msg("A checked counter operation underflowed")]
    CounterUnderflow,
}
