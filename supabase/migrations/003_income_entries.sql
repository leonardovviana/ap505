create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  member_id uuid not null references public.couple_members(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  kind text not null default 'salary' check (kind in ('salary', 'extra')),
  income_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incomes_couple_date on public.incomes(couple_id, income_date desc);
create index if not exists idx_incomes_member on public.incomes(member_id);

drop trigger if exists incomes_updated_at on public.incomes;
create trigger incomes_updated_at before update on public.incomes
for each row execute function public.set_updated_at();

alter table public.incomes enable row level security;

drop policy if exists "incomes_select_members" on public.incomes;
create policy "incomes_select_members"
on public.incomes for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "incomes_insert_members" on public.incomes;
create policy "incomes_insert_members"
on public.incomes for insert
to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists "incomes_update_members" on public.incomes;
create policy "incomes_update_members"
on public.incomes for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists "incomes_delete_members" on public.incomes;
create policy "incomes_delete_members"
on public.incomes for delete
to authenticated
using (public.is_couple_member(couple_id));