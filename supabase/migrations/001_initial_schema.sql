create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  active_couple_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_active_couple_id_fkey
  foreign key (active_couple_id) references public.couples(id) on delete set null;

create table if not exists public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  member_id uuid not null references public.couple_members(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  category text not null default 'Outros',
  payment_method text,
  expense_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  scope text not null check (scope in ('monthly', 'category')),
  category text not null default '',
  amount numeric(12,2) not null check (amount >= 0),
  month date not null default date_trunc('month', current_date)::date,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, month, scope, category)
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_couple_members_user on public.couple_members(user_id);
create index if not exists idx_couple_members_couple on public.couple_members(couple_id);
create index if not exists idx_expenses_couple_date on public.expenses(couple_id, expense_date desc);
create index if not exists idx_expenses_member on public.expenses(member_id);
create index if not exists idx_budgets_couple_month on public.budgets(couple_id, month);
create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists couples_updated_at on public.couples;
create trigger couples_updated_at before update on public.couples
for each row execute function public.set_updated_at();

drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists budgets_updated_at on public.budgets;
create trigger budgets_updated_at before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists push_subscriptions_updated_at on public.push_subscriptions;
create trigger push_subscriptions_updated_at before update on public.push_subscriptions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_couple_member(p_couple_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members
    where couple_id = p_couple_id
      and user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function public.random_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8));
    exit when not exists (select 1 from public.couples where invite_code = code);
  end loop;
  return code;
end;
$$;

create or replace function public.create_couple_with_member(
  p_couple_name text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  insert into public.profiles (id, full_name)
  values (v_user, null)
  on conflict (id) do nothing;

  insert into public.couples (name, invite_code, created_by)
  values (coalesce(nullif(trim(p_couple_name), ''), 'AP505'), public.random_invite_code(), v_user)
  returning id into v_couple;

  insert into public.couple_members (couple_id, user_id, display_name, role)
  values (v_couple, v_user, coalesce(nullif(trim(p_display_name), ''), 'Eu'), 'owner');

  update public.profiles
  set active_couple_id = v_couple,
      full_name = coalesce(nullif(trim(p_display_name), ''), full_name, 'Eu')
  where id = v_user;

  return v_couple;
end;
$$;

create or replace function public.join_couple_by_invite(
  p_invite_code text,
  p_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_couple uuid;
  v_active_count int;
begin
  if v_user is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select id into v_couple
  from public.couples
  where invite_code = upper(trim(p_invite_code));

  if v_couple is null then
    raise exception 'Codigo nao encontrado';
  end if;

  select count(*) into v_active_count
  from public.couple_members
  where couple_id = v_couple
    and is_active = true
    and user_id <> v_user;

  if v_active_count >= 2 then
    raise exception 'Esse casal ja esta completo';
  end if;

  insert into public.profiles (id, full_name)
  values (v_user, null)
  on conflict (id) do nothing;

  insert into public.couple_members (couple_id, user_id, display_name, role, is_active)
  values (v_couple, v_user, coalesce(nullif(trim(p_display_name), ''), 'Eu'), 'member', true)
  on conflict (couple_id, user_id)
  do update set display_name = excluded.display_name, is_active = true;

  update public.profiles
  set active_couple_id = v_couple,
      full_name = coalesce(nullif(trim(p_display_name), ''), full_name, 'Eu')
  where id = v_user;

  return v_couple;
end;
$$;

create or replace function public.partner_push_subscriptions(p_couple_id uuid)
returns table(endpoint text, p256dh text, auth_secret text)
language sql
security definer
stable
set search_path = public
as $$
  select ps.endpoint, ps.p256dh, ps.auth_secret
  from public.push_subscriptions ps
  where ps.couple_id = p_couple_id
    and ps.user_id <> auth.uid()
    and public.is_couple_member(p_couple_id);
$$;

alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "profiles_select_couple" on public.profiles;
create policy "profiles_select_couple"
on public.profiles for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.couple_members mine
    join public.couple_members theirs on theirs.couple_id = mine.couple_id
    where mine.user_id = auth.uid()
      and mine.is_active
      and theirs.user_id = profiles.id
      and theirs.is_active
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "couples_select_members" on public.couples;
create policy "couples_select_members"
on public.couples for select
to authenticated
using (public.is_couple_member(id));

drop policy if exists "couples_update_members" on public.couples;
create policy "couples_update_members"
on public.couples for update
to authenticated
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

drop policy if exists "couple_members_select_members" on public.couple_members;
create policy "couple_members_select_members"
on public.couple_members for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "couple_members_update_self" on public.couple_members;
create policy "couple_members_update_self"
on public.couple_members for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "expenses_select_members" on public.expenses;
create policy "expenses_select_members"
on public.expenses for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "expenses_insert_members" on public.expenses;
create policy "expenses_insert_members"
on public.expenses for insert
to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists "expenses_update_members" on public.expenses;
create policy "expenses_update_members"
on public.expenses for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists "expenses_delete_members" on public.expenses;
create policy "expenses_delete_members"
on public.expenses for delete
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "budgets_select_members" on public.budgets;
create policy "budgets_select_members"
on public.budgets for select
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "budgets_insert_members" on public.budgets;
create policy "budgets_insert_members"
on public.budgets for insert
to authenticated
with check (public.is_couple_member(couple_id) and created_by = auth.uid());

drop policy if exists "budgets_update_members" on public.budgets;
create policy "budgets_update_members"
on public.budgets for update
to authenticated
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

drop policy if exists "budgets_delete_members" on public.budgets;
create policy "budgets_delete_members"
on public.budgets for delete
to authenticated
using (public.is_couple_member(couple_id));

drop policy if exists "push_select_own" on public.push_subscriptions;
create policy "push_select_own"
on public.push_subscriptions for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "push_insert_own" on public.push_subscriptions;
create policy "push_insert_own"
on public.push_subscriptions for insert
to authenticated
with check (user_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));

drop policy if exists "push_update_own" on public.push_subscriptions;
create policy "push_update_own"
on public.push_subscriptions for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid() and (couple_id is null or public.is_couple_member(couple_id)));

drop policy if exists "push_delete_own" on public.push_subscriptions;
create policy "push_delete_own"
on public.push_subscriptions for delete
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
on storage.objects for insert
to authenticated
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
on storage.objects for update
to authenticated
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'budgets'
  ) then
    alter publication supabase_realtime add table public.budgets;
  end if;
end $$;
