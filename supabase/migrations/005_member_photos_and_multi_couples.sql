alter table public.couple_members
add column if not exists avatar_url text;

create index if not exists idx_couple_members_user_active
on public.couple_members(user_id, is_active);
