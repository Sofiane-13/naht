import { createClient } from '@supabase/supabase-js'

/**
 * Config Supabase.
 *
 * La clé « publishable » et l'URL sont publiques par nature (l'app est 100 %
 * côté client — la sécurité repose sur les RLS policies de la base). On les
 * met donc en valeurs par défaut pour que le build fonctionne partout sans
 * configuration. On garde la surcharge par variable d'environnement
 * (VITE_SUPABASE_*) pour pointer vers un autre projet si besoin.
 */
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  'https://kbyqmmipnragqatugmit.supabase.co'

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_dOgFksdZHyZRmqct1eky2A_BRTwIwsP'

/** Client Supabase unique de l'app (Auth + DB). */
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
