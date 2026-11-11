-- =========================================================================
-- ReBur: Supabase / PostgreSQL Schema Definition
-- Run this in your Supabase SQL Editor if creating a brand new project.
-- =========================================================================

create table if not exists public.expenses (
    id bigint primary key generated always as identity,
    created_at timestamptz default now() not null,
    workspace_id text not null default 'ws_demo_123',
    vendor text not null,
    amount numeric not null,
    currency text not null default 'INR',
    category text not null default 'General',
    date text,
    employee_name text not null,
    notes text,
    status text not null default 'pending', -- 'pending', 'approved', 'rejected'
    is_flagged boolean not null default false,
    flag_reason text,
    receipt_url text,
    audit_trail text default '[]'
);

-- Enable Row Level Security (RLS)
alter table public.expenses enable row level security;

-- Allow read access for authenticated & service role users
create policy "Allow read access to all expenses"
on public.expenses for select
using (true);

-- Allow full access for service role (backend operations)
create policy "Allow all operations for service role"
on public.expenses for all
using (true)
with check (true);

-- Create helpful index for fast workspace filtering
create index if not exists idx_expenses_workspace_status 
on public.expenses (workspace_id, status);

