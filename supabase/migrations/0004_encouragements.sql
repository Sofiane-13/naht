-- Encouragements : un membre encourage l'auteur d'un challenge (depuis le fil d'actualité).

create table if not exists public.encouragements (
  id           uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  from_user    uuid not null references auth.users (id) on delete cascade,
  to_user      uuid not null references auth.users (id) on delete cascade,
  message      text not null check (char_length(message) between 1 and 280),
  created_at   timestamptz not null default now()
);

create index if not exists encouragements_challenge_idx
  on public.encouragements (challenge_id);

-- Envoi contrôlé : le destinataire = l'auteur du challenge, réservé aux membres du projet.
create or replace function public.send_encouragement(
  p_challenge_id uuid,
  p_message text
)
returns public.encouragements
language plpgsql
security definer
set search_path = public
as $$
declare
  ch  public.challenges;
  enc public.encouragements;
begin
  select * into ch from public.challenges where id = p_challenge_id;
  if ch.id is null then
    raise exception 'Challenge introuvable';
  end if;
  if not public.is_member(ch.project_id) then
    raise exception 'Non autorisé';
  end if;

  insert into public.encouragements (challenge_id, from_user, to_user, message)
  values (p_challenge_id, auth.uid(), ch.assigned_to, btrim(p_message))
  returning * into enc;

  return enc;
end;
$$;

alter table public.encouragements enable row level security;

drop policy if exists "encouragements_select_member" on public.encouragements;
create policy "encouragements_select_member" on public.encouragements
  for select using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and public.is_member(c.project_id)
    )
  );

grant select on public.encouragements to authenticated;
grant execute on function public.send_encouragement(uuid, text) to authenticated;
