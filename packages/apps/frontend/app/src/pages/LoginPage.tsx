import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

type Step = 'email' | 'code'

export function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

  async function handleSendEmail(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    // Envoie un code OTP (crée le compte au premier passage : signup + signin unifiés)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setSending(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setStep('code')
    toast.success('Code envoyé — vérifie ta boîte mail 📬')
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setVerifying(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })
    setVerifying(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Connecté !')
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">naht</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connecte-toi ou crée ton compte en un instant.
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendEmail} className="mt-6 space-y-4">
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
              {sending ? 'Envoi…' : 'Recevoir un code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <p className="text-sm text-gray-600">
              Un code à 6 chiffres a été envoyé à{' '}
              <span className="font-medium">{email}</span>.
            </p>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700"
              >
                Code de vérification
              </label>
              <input
                id="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
            >
              {verifying ? 'Vérification…' : 'Se connecter'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
            >
              ← Changer d'email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
