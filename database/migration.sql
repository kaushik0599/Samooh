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

-- Deduplicate on-chain events: one activity row per (event type, tx hash),
-- allowing null tx hashes (e.g. off-chain Sarthi-originated activity) to repeat.
create unique index if not exists idx_activity_dedupe
  on activity(samooh_id, type, transaction_hash)
  where transaction_hash is not null;

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
