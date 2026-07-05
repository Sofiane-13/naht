import { supabase } from './supabase'

export type ChallengeStatus = 'pending' | 'success' | 'failed'
export type Recurrence = 'weekly' | 'monthly'

export interface Challenge {
  id: string
  project_id: string
  created_by: string
  assigned_to: string
  title: string
  axis: string
  status: ChallengeStatus
  due_date: string | null
  start_time: string | null
  end_time: string | null
  recurrence: Recurrence | null
  recur_weekdays: number[] | null
  created_at: string
  resolved_at: string | null
}

export interface ProjectMember {
  user_id: string
  email: string
  role: 'owner' | 'member'
}

export async function listMembers(projectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase.rpc('project_members', {
    p_project: projectId,
  })
  if (error) throw error
  return (data ?? []) as ProjectMember[]
}

export async function listChallenges(projectId: string): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Challenge[]
}

export async function createChallenge(input: {
  projectId: string
  assignedTo: string
  title: string
  axis: string
  dueDate?: string | null
  startTime?: string | null
  endTime?: string | null
  recurrence?: Recurrence | null
  recurWeekdays?: number[] | null
}): Promise<Challenge> {
  const { data: auth } = await supabase.auth.getUser()
  const createdBy = auth.user?.id
  if (!createdBy) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('challenges')
    .insert({
      project_id: input.projectId,
      created_by: createdBy,
      assigned_to: input.assignedTo,
      title: input.title,
      axis: input.axis,
      due_date: input.dueDate ?? null,
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      recurrence: input.recurrence ?? null,
      recur_weekdays: input.recurWeekdays ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Challenge
}

export async function resolveChallenge(
  id: string,
  status: Exclude<ChallengeStatus, 'pending'>,
): Promise<void> {
  const { error } = await supabase
    .from('challenges')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
