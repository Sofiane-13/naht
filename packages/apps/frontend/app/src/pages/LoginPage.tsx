import { useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    // Envoie un lien magique. Au clic, Supabase renvoie l'utilisateur sur
    // l'app (même origine, dev ou prod) déjà authentifié.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
      },
    })
    setSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">naht</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connecte-toi ou crée ton compte en un instant.
        </p>

        {sent ? (
          <div className="mt-6 space-y-4 text-center">
            <div className="text-4xl">📬</div>
            <p className="text-sm text-gray-700">
              Un lien de connexion a été envoyé à{' '}
              <span className="font-medium">{email}</span>.
              <br />
              Ouvre ton email et clique sur le lien pour te connecter.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Utiliser une autre adresse
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="toi@exemple.com"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {sending ? 'Envoi…' : 'Recevoir le lien de connexion'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
