-- Projets famille : un utilisateur crée un projet et invite des membres via un lien.

create table if not exists public.family_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 80),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  invite_code uuid not null unique default gen_random_uuid(),
  created_at  timestamptz not null default now()
);

create table if not exists public.family_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.family_projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'member')),
  joined_at  timestamptz not null default now(),
  unique (project_id, user_id)
);

-- Appartenance : security definer pour éviter la récursion RLS sur family_members.
create or replace function public.is_member(p_project uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.family_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

-- Le créateur devient automatiquement membre (owner).
create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists trg_add_owner_as_member on public.family_projects;
create trigger trg_add_owner_as_member
  after insert on public.family_projects
  for each row execute function public.add_owner_as_member();

-- Créer un projet (évite la course RLS sur le RETURNING : le trigger d'appartenance
-- s'exécute après l'insert, mais la ligne retournée est validée par le RLS SELECT).
create or replace function public.create_family_project(p_name text)
returns public.family_projects
language plpgsql
security definer
set search_path = public
as $$
declare
  proj public.family_projects;
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;

  insert into public.family_projects (name, owner_id)
  values (p_name, auth.uid())
  returning * into proj;

  return proj;
end;
$$;

-- Rejoindre via le code d'invitation (contourne le RLS de lecture de façon contrôlée).
create or replace function public.join_family_project(p_invite_code uuid)
returns public.family_projects
language plpgsql
security definer
set search_path = public
as $$
declare
  proj public.family_projects;
begin
  select * into proj from public.family_projects where invite_code = p_invite_code;
  if proj.id is null then
    raise exception 'Invitation invalide';
  end if;

  insert into public.family_members (project_id, user_id, role)
  values (proj.id, auth.uid(), 'member')
  on conflict (project_id, user_id) do nothing;

  return proj;
end;
$$;

alter table public.family_projects enable row level security;
alter table public.family_members enable row level security;

drop policy if exists "projects_select_member" on public.family_projects;
create policy "projects_select_member" on public.family_projects
  for select using (public.is_member(id));

drop policy if exists "projects_insert_owner" on public.family_projects;
create policy "projects_insert_owner" on public.family_projects
  for insert with check (owner_id = auth.uid());

drop policy if exists "members_select_member" on public.family_members;
create policy "members_select_member" on public.family_members
  for select using (public.is_member(project_id));

drop policy if exists "members_insert_self" on public.family_members;
create policy "members_insert_self" on public.family_members
  for insert with check (user_id = auth.uid());

-- Grants pour le rôle client (les lignes restent filtrées par RLS).
grant usage on schema public to anon, authenticated;
grant select, insert on public.family_projects to authenticated;
grant select, insert on public.family_members to authenticated;
grant execute on function public.is_member(uuid) to anon, authenticated;
grant execute on function public.create_family_project(text) to authenticated;
grant execute on function public.join_family_project(uuid) to authenticated;
