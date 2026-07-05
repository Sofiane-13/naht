import { supabase } from './supabase'

export interface FamilyProject {
  id: string
  name: string
  owner_id: string
  invite_code: string
  created_at: string
}

export interface FamilyMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member'
  joined_at: string
}

export async function listProjects(): Promise<FamilyProject[]> {
  const { data, error } = await supabase
    .from('family_projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createProject(name: string): Promise<FamilyProject> {
  const { data: auth } = await supabase.auth.getUser()
  const ownerId = auth.user?.id
  if (!ownerId) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('family_projects')
    .insert({ name, owner_id: ownerId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function joinProject(inviteCode: string): Promise<FamilyProject> {
  const { data, error } = await supabase.rpc('join_family_project', {
    p_invite_code: inviteCode,
  })
  if (error) throw error
  return data as FamilyProject
}

export async function countMembers(projectId: string): Promise<number> {
  const { count, error } = await supabase
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
  if (error) throw error
  return count ?? 0
}

export function inviteLink(inviteCode: string): string {
  return `${window.location.origin}/join/${inviteCode}`
}
