-- Planification des challenges : créneau horaire + récurrence optionnelle.
-- due_date reste la date d'ancrage (dtstart). recurrence null = ponctuel (défaut).

alter table public.challenges
  add column if not exists start_time     time,
  add column if not exists end_time       time,
  add column if not exists recurrence     text check (recurrence in ('weekly', 'monthly')),
  add column if not exists recur_weekdays smallint[]; -- 0=dim .. 6=sam (pour l'hebdo)
