-- SAMOOH backend schema
-- Run in the Supabase SQL Editor. Idempotent (safe to re-run).

create extension if not exists "pgcrypto";

-- users -----------------------------------------------------------------
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  wallet_address text not null unique,
  created_at timestamptz not null default now(),
  constraint users_wallet_address_format check (wallet_address ~* '^0x[a-f0-9]{40}$')
);

-- Onboarding creates a user by wallet address alone (no display name
-- required); relax the original not-null constraint for existing databases.
alter table users alter column name drop not null;

-- samoohs -----------------------------------------------------------------
create table if not exists samoohs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  creator_wallet text not null,
  governance_contract text not null,
  treasury_contract text not null,
  network text not null default 'polygon-amoy',
  category text,
  purpose text,
  region text,
  objectives text[] not null default '{}',
  membership_open boolean not null default true,
  created_at timestamptz not null default now(),
  constraint samoohs_creator_wallet_format check (creator_wallet ~* '^0x[a-f0-9]{40}$'),
  constraint samoohs_governance_contract_format check (governance_contract ~* '^0x[a-f0-9]{40}$'),
  constraint samoohs_treasury_contract_format check (treasury_contract ~* '^0x[a-f0-9]{40}$')
);

-- Additive columns for discovery/matching, safe to re-run against a samoohs
-- table created before this feature existed.
alter table samoohs add column if not exists category text;
alter table samoohs add column if not exists purpose text;
alter table samoohs add column if not exists region text;
alter table samoohs add column if not exists objectives text[] not null default '{}';
alter table samoohs add column if not exists membership_open boolean not null default true;

create index if not exists idx_samoohs_category on samoohs(category);
create index if not exists idx_samoohs_region on samoohs(region);

-- members -----------------------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  wallet_address text not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  constraint members_wallet_address_format check (wallet_address ~* '^0x[a-f0-9]{40}$'),
  constraint members_role_valid check (role in ('admin', 'member')),
  constraint members_unique_per_samooh unique (samooh_id, wallet_address)
);

create index if not exists idx_members_samooh_id on members(samooh_id);
create index if not exists idx_members_wallet_address on members(wallet_address);

-- proposals -----------------------------------------------------------------
create table if not exists proposals (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  onchain_proposal_id text,
  title text not null,
  description text,
  amount numeric,
  recipient text,
  status text not null default 'DRAFT',
  created_by text not null,
  created_at timestamptz not null default now(),
  constraint proposals_status_valid check (
    status in ('DRAFT', 'CREATED', 'VOTING', 'APPROVED', 'REJECTED', 'EXECUTED', 'EXPIRED')
  ),
  constraint proposals_recipient_format check (recipient is null or recipient ~* '^0x[a-f0-9]{40}$'),
  constraint proposals_created_by_format check (created_by ~* '^0x[a-f0-9]{40}$'),
  constraint proposals_amount_positive check (amount is null or amount > 0),
  constraint proposals_unique_onchain_id unique (samooh_id, onchain_proposal_id)
);

create index if not exists idx_proposals_samooh_id on proposals(samooh_id);
create index if not exists idx_proposals_status on proposals(status);

-- sarthi_insights -----------------------------------------------------------------
create table if not exists sarthi_insights (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  type text not null,
  title text not null,
  description text not null,
  recommendation text not null,
  priority text not null default 'medium',
  created_at timestamptz not null default now(),
  constraint sarthi_insights_type_valid check (
    type in ('opportunity', 'procurement', 'resource', 'treasury', 'participation', 'bottleneck', 'growth', 'governance')
  ),
  constraint sarthi_insights_priority_valid check (priority in ('low', 'medium', 'high'))
);

create index if not exists idx_sarthi_insights_samooh_id on sarthi_insights(samooh_id);

-- Structured "idea" fields for the Sarthi idea-detail view. All additive
-- and nullable: a rule that can't honestly support a field (e.g. no real
-- cost estimate possible) simply leaves it null, and the API/UI render
-- "unavailable" rather than a fabricated number — see docs/SARTHI.md.
alter table sarthi_insights add column if not exists evidence jsonb not null default '[]'::jsonb;
alter table sarthi_insights add column if not exists estimated_cost numeric;
alter table sarthi_insights add column if not exists cost_currency text;
alter table sarthi_insights add column if not exists timeline text;
alter table sarthi_insights add column if not exists risk_level text;
alter table sarthi_insights add column if not exists confidence text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sarthi_insights_risk_level_valid') then
    alter table sarthi_insights add constraint sarthi_insights_risk_level_valid
      check (risk_level is null or risk_level in ('low', 'medium', 'high'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sarthi_insights_confidence_valid') then
    alter table sarthi_insights add constraint sarthi_insights_confidence_valid
      check (confidence is null or confidence in ('low', 'medium', 'high'));
  end if;
end $$;

-- activity -----------------------------------------------------------------
create table if not exists activity (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  type text not null,
  actor text,
  description text not null,
  transaction_hash text,
  created_at timestamptz not null default now(),
  constraint activity_type_valid check (
    type in (
      'ProposalCreated', 'VoteCast', 'ProposalApproved', 'ProposalRejected',
      'ProposalExecuted', 'MemberAdded', 'MemberRemoved', 'TreasuryDeposit', 'TreasuryTransfer'
    )
  ),
  constraint activity_tx_hash_format check (transaction_hash is null or transaction_hash ~* '^0x[a-f0-9]{64}$')
);

create index if not exists idx_activity_samooh_id on activity(samooh_id);
create index if not exists idx_activity_created_at on activity(created_at desc);

-- Deduplicate on-chain events: one activity row per (event type, tx hash).
-- This must be a FULL (non-partial) unique index: Postgres only uses a
-- partial index as an ON CONFLICT arbiter when the conflict clause's
-- predicate exactly matches the index's WHERE clause, and the Supabase
-- upsert() in activity.service.ts's recordActivity() (onConflict:
-- "samooh_id,type,transaction_hash") cannot express that predicate — against
-- a partial index every insert would error with "no unique or exclusion
-- constraint matching the ON CONFLICT specification". A plain unique index
-- still allows null tx hashes (e.g. off-chain Sarthi-originated activity) to
-- repeat freely, since standard SQL unique constraints treat NULL <> NULL.
drop index if exists idx_activity_dedupe;
create unique index if not exists idx_activity_dedupe
  on activity(samooh_id, type, transaction_hash);

-- user_onboarding_profiles -----------------------------------------------------------------
-- One profile per user, reusing the existing `users` table for identity
-- (wallet address, name) instead of duplicating it here.
create table if not exists user_onboarding_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  activity_type text,
  region text not null,
  needs text[] not null default '{}',
  objectives text[] not null default '{}',
  biggest_challenge text,
  preference text not null default 'EITHER',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_onboarding_profiles_user_unique unique (user_id),
  constraint user_onboarding_profiles_preference_valid check (preference in ('JOIN', 'START', 'EITHER'))
);

create index if not exists idx_user_onboarding_profiles_category on user_onboarding_profiles(category);
create index if not exists idx_user_onboarding_profiles_region on user_onboarding_profiles(region);

-- samooh_join_requests -----------------------------------------------------------------
create table if not exists samooh_join_requests (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  wallet_address text not null,
  status text not null default 'REQUESTED',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint samooh_join_requests_wallet_format check (wallet_address ~* '^0x[a-f0-9]{40}$'),
  constraint samooh_join_requests_status_valid check (
    status in ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED')
  )
);

create index if not exists idx_samooh_join_requests_samooh_id on samooh_join_requests(samooh_id);
create index if not exists idx_samooh_join_requests_wallet on samooh_join_requests(wallet_address);

-- Only one active (pending or approved) request per wallet per samooh; a
-- rejected/cancelled request can be re-submitted.
create unique index if not exists idx_samooh_join_requests_active_unique
  on samooh_join_requests(samooh_id, wallet_address)
  where status in ('REQUESTED', 'APPROVED');

-- Wallet/address lowercase, defense-in-depth -----------------------------
-- The application layer already lowercases every wallet/address before
-- writing (see requireWalletAddress in src/lib/validation/index.ts), but
-- nothing at the DB layer enforced that. Normalize any pre-existing rows
-- first (no-op if the app has always lowercased) so the CHECK constraints
-- below are guaranteed safe to add, then add the constraints themselves
-- guarded by existence checks so this block is safe to re-run.
update users set wallet_address = lower(wallet_address)
  where wallet_address <> lower(wallet_address);
update samoohs set creator_wallet = lower(creator_wallet)
  where creator_wallet <> lower(creator_wallet);
update samoohs set governance_contract = lower(governance_contract)
  where governance_contract <> lower(governance_contract);
update samoohs set treasury_contract = lower(treasury_contract)
  where treasury_contract <> lower(treasury_contract);
update members set wallet_address = lower(wallet_address)
  where wallet_address <> lower(wallet_address);
update proposals set recipient = lower(recipient)
  where recipient is not null and recipient <> lower(recipient);
update proposals set created_by = lower(created_by)
  where created_by <> lower(created_by);
update samooh_join_requests set wallet_address = lower(wallet_address)
  where wallet_address <> lower(wallet_address);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_wallet_address_lowercase') then
    alter table users add constraint users_wallet_address_lowercase
      check (wallet_address = lower(wallet_address));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'samoohs_creator_wallet_lowercase') then
    alter table samoohs add constraint samoohs_creator_wallet_lowercase
      check (creator_wallet = lower(creator_wallet));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'samoohs_governance_contract_lowercase') then
    alter table samoohs add constraint samoohs_governance_contract_lowercase
      check (governance_contract = lower(governance_contract));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'samoohs_treasury_contract_lowercase') then
    alter table samoohs add constraint samoohs_treasury_contract_lowercase
      check (treasury_contract = lower(treasury_contract));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'members_wallet_address_lowercase') then
    alter table members add constraint members_wallet_address_lowercase
      check (wallet_address = lower(wallet_address));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_recipient_lowercase') then
    alter table proposals add constraint proposals_recipient_lowercase
      check (recipient is null or recipient = lower(recipient));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_created_by_lowercase') then
    alter table proposals add constraint proposals_created_by_lowercase
      check (created_by = lower(created_by));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'samooh_join_requests_wallet_lowercase') then
    alter table samooh_join_requests add constraint samooh_join_requests_wallet_lowercase
      check (wallet_address = lower(wallet_address));
  end if;
end $$;

-- ============================================================================
-- APPLICATION IDENTITY SYSTEM (SMH-P-######, SMH-S-######, SMH-PR-######,
-- SMH-G-######, SMH-TR-######, SMH-TX-######)
-- ============================================================================
-- Stable, human-readable IDs additive to the existing uuid primary keys —
-- the uuid remains the real relational identity; `display_id` is what the
-- product shows a person. One Postgres sequence per entity kind, formatted
-- via lpad. See docs/IDENTITY_SPEC.md for the full design and the reasoning
-- for governance_identities/treasury_accounts as new lightweight tables
-- versus extending `activity` in place rather than adding a redundant
-- "transactions"/"ledger" table.

create sequence if not exists person_display_id_seq;
create sequence if not exists samooh_display_id_seq;
create sequence if not exists proposal_display_id_seq;
create sequence if not exists governance_display_id_seq;
create sequence if not exists treasury_display_id_seq;
create sequence if not exists ledger_display_id_seq;
create sequence if not exists impact_display_id_seq;

alter table users add column if not exists display_id text;
alter table users alter column display_id
  set default ('SMH-P-' || lpad(nextval('person_display_id_seq')::text, 6, '0'));
update users set display_id = 'SMH-P-' || lpad(nextval('person_display_id_seq')::text, 6, '0')
  where display_id is null;

alter table samoohs add column if not exists display_id text;
alter table samoohs alter column display_id
  set default ('SMH-S-' || lpad(nextval('samooh_display_id_seq')::text, 6, '0'));
update samoohs set display_id = 'SMH-S-' || lpad(nextval('samooh_display_id_seq')::text, 6, '0')
  where display_id is null;

alter table proposals add column if not exists display_id text;
alter table proposals alter column display_id
  set default ('SMH-PR-' || lpad(nextval('proposal_display_id_seq')::text, 6, '0'));
update proposals set display_id = 'SMH-PR-' || lpad(nextval('proposal_display_id_seq')::text, 6, '0')
  where display_id is null;

-- Proposal fields the creation flow and detail page need that the original
-- metadata-only schema didn't carry. All additive/nullable — existing rows
-- and callers that don't set them are unaffected.
alter table proposals add column if not exists purpose text;
alter table proposals add column if not exists category text;
alter table proposals add column if not exists expected_outcome text;
alter table proposals add column if not exists voting_start timestamptz;
alter table proposals add column if not exists voting_end timestamptz;
alter table proposals add column if not exists governance_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_display_id_unique') then
    alter table users add constraint users_display_id_unique unique (display_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'samoohs_display_id_unique') then
    alter table samoohs add constraint samoohs_display_id_unique unique (display_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'proposals_display_id_unique') then
    alter table proposals add constraint proposals_display_id_unique unique (display_id);
  end if;
end $$;

-- governance_identities --------------------------------------------------
-- One row per Samooh (1:1, created alongside the Samooh by
-- IdentityService/GovernanceIdentityService). `contract_address` mirrors
-- samoohs.governance_contract at creation time so a governance identity is
-- always resolvable even if the two ever drift. Deployment-transaction
-- fields are nullable and stay null until something actually records a
-- verified on-chain deployment — never backfilled with guesses.
create table if not exists governance_identities (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  display_id text not null default ('SMH-G-' || lpad(nextval('governance_display_id_seq')::text, 6, '0')),
  contract_address text not null,
  network text not null default 'polygon-amoy',
  chain_id integer not null default 80002,
  quorum_percentage integer not null default 50,
  voting_period_seconds integer,
  deployment_tx_hash text,
  deployment_block bigint,
  created_at timestamptz not null default now(),
  constraint governance_identities_samooh_unique unique (samooh_id),
  constraint governance_identities_display_id_unique unique (display_id),
  constraint governance_identities_contract_format check (contract_address ~* '^0x[a-f0-9]{40}$'),
  constraint governance_identities_tx_hash_format check (deployment_tx_hash is null or deployment_tx_hash ~* '^0x[a-f0-9]{64}$')
);

create index if not exists idx_governance_identities_samooh_id on governance_identities(samooh_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proposals_governance_id_fkey') then
    alter table proposals add constraint proposals_governance_id_fkey
      foreign key (governance_id) references governance_identities(id);
  end if;
end $$;

-- treasury_accounts --------------------------------------------------------
-- One row per Samooh (1:1), same pattern as governance_identities.
create table if not exists treasury_accounts (
  id uuid primary key default gen_random_uuid(),
  samooh_id uuid not null references samoohs(id) on delete cascade,
  display_id text not null default ('SMH-TR-' || lpad(nextval('treasury_display_id_seq')::text, 6, '0')),
  contract_address text not null,
  network text not null default 'polygon-amoy',
  created_at timestamptz not null default now(),
  constraint treasury_accounts_samooh_unique unique (samooh_id),
  constraint treasury_accounts_display_id_unique unique (display_id),
  constraint treasury_accounts_contract_format check (contract_address ~* '^0x[a-f0-9]{40}$')
);

create index if not exists idx_treasury_accounts_samooh_id on treasury_accounts(samooh_id);

-- Backfill governance_identities/treasury_accounts for any samoohs rows
-- that predate these tables (every samoohs row always has both contract
-- addresses set — see samoohs_governance_contract/treasury_contract NOT
-- NULL — so this backfill is always well-defined, never a guess).
insert into governance_identities (samooh_id, contract_address, network)
select s.id, s.governance_contract, s.network
from samoohs s
where not exists (select 1 from governance_identities g where g.samooh_id = s.id);

insert into treasury_accounts (samooh_id, contract_address, network)
select s.id, s.treasury_contract, s.network
from samoohs s
where not exists (select 1 from treasury_accounts t where t.samooh_id = s.id);

-- Backfill proposals.governance_id from the now-guaranteed-to-exist
-- governance_identities row for each proposal's samooh.
update proposals p
set governance_id = g.id
from governance_identities g
where g.samooh_id = p.samooh_id and p.governance_id is null;

-- activity (the Block Ledger) ----------------------------------------------
-- The Block Ledger is NOT a new/duplicate table — it is this existing
-- `activity` table, extended with a display id, structured amount/token,
-- entity links, and a status, then read through a richer LedgerService.
-- Every existing on-chain-derived activity row is already a confirmed
-- fact, so `status` defaults to CONFIRMED for both new and backfilled rows.
alter table activity add column if not exists display_id text;
alter table activity alter column display_id
  set default ('SMH-TX-' || lpad(nextval('ledger_display_id_seq')::text, 6, '0'));
update activity set display_id = 'SMH-TX-' || lpad(nextval('ledger_display_id_seq')::text, 6, '0')
  where display_id is null;

alter table activity add column if not exists amount numeric;
alter table activity add column if not exists token text not null default 'MATIC';
alter table activity add column if not exists status text not null default 'CONFIRMED';
alter table activity add column if not exists block_number bigint;
alter table activity add column if not exists proposal_id uuid references proposals(id);
alter table activity add column if not exists governance_id uuid references governance_identities(id);
alter table activity add column if not exists treasury_id uuid references treasury_accounts(id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'activity_display_id_unique') then
    alter table activity add constraint activity_display_id_unique unique (display_id);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activity_status_valid') then
    alter table activity add constraint activity_status_valid
      check (status in ('PENDING', 'CONFIRMED', 'FAILED'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'activity_amount_nonnegative') then
    alter table activity add constraint activity_amount_nonnegative
      check (amount is null or amount >= 0);
  end if;
end $$;

create index if not exists idx_activity_proposal_id on activity(proposal_id);

-- impact_records -------------------------------------------------------
-- At most one row per proposal, created only once a member explicitly
-- records real post-execution data via the impact-tracking API — never
-- auto-populated with fabricated numbers. A proposal with no row here
-- simply has no impact data yet ("Impact tracking not yet available").
create table if not exists impact_records (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  display_id text not null default ('SMH-IM-' || lpad(nextval('impact_display_id_seq')::text, 6, '0')),
  capital_deployed numeric,
  deployed_at timestamptz,
  objective text,
  expected_outcome text,
  actual_outcome text,
  status text not null default 'NOT_STARTED',
  progress_percentage integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint impact_records_proposal_unique unique (proposal_id),
  constraint impact_records_display_id_unique unique (display_id),
  constraint impact_records_status_valid check (
    status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'UNDER_REVIEW')
  ),
  constraint impact_records_progress_range check (
    progress_percentage is null or (progress_percentage >= 0 and progress_percentage <= 100)
  )
);

create index if not exists idx_impact_records_proposal_id on impact_records(proposal_id);
