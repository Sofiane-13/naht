import { supabase } from './supabase'

export interface Encouragement {
  id: string
  challenge_id: string
  from_user: string
  to_user: string
  message: string
  created_at: string
}

export async function listEncouragements(
  challengeIds: string[],
): Promise<Encouragement[]> {
  if (challengeIds.length === 0) return []
  const { data, error } = await supabase
    .from('encouragements')
    .select('*')
    .in('challenge_id', challengeIds)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as Encouragement[]
}

export async function sendEncouragement(
  challengeId: string,
  message: string,
): Promise<void> {
  const { error } = await supabase.rpc('send_encouragement', {
    p_challenge_id: challengeId,
    p_message: message,
  })
  if (error) throw error
}
