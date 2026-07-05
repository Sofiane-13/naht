-- Challenges : cœur de l'agenda d'un projet.
-- Un membre se challenge ou challenge un autre membre sur un axe.
-- Agenda d'un membre = ses challenges 'pending'. Fil d'actualité = les résolus.

create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.family_projects (id) on delete cascade,
  created_by  uuid not null references auth.users (id) on delete cascade,
  assigned_to uuid not null references auth.users (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 140),
  axis        text not null default 'AUTRE',
  status      text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  due_date    date,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists challenges_project_idx on public.challenges (project_id);

-- Membres d'un projet avec leur identité (email), réservé aux membres du projet.
create or replace function public.project_members(p_project uuid)
returns table (user_id uuid, email text, role text)
language sql
security definer
stable
set search_path = public
as $$
  select m.user_id, u.email::text, m.role
  from public.family_members m
  join auth.users u on u.id = m.user_id
  where m.project_id = p_project
    and public.is_member(p_project)
  order by m.joined_at;
$$;

alter table public.challenges enable row level security;

drop policy if exists "challenges_select_member" on public.challenges;
create policy "challenges_select_member" on public.challenges
  for select using (public.is_member(project_id));

drop policy if exists "challenges_insert_member" on public.challenges;
create policy "challenges_insert_member" on public.challenges
  for insert with check (
    public.is_member(project_id) and created_by = auth.uid()
  );

drop policy if exists "challenges_update_assignee" on public.challenges;
create policy "challenges_update_assignee" on public.challenges
  for update using (assigned_to = auth.uid()) with check (assigned_to = auth.uid());

grant select, insert, update on public.challenges to authenticated;
grant execute on function public.project_members(uuid) to authenticated;
