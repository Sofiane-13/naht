import { ChallengeAxis, CHALLENGE_AXIS_LABELS } from '@naht/shared'
import { useAuth } from '../contexts/AuthContext'

const AXIS_EMOJI: Record<ChallengeAxis, string> = {
  [ChallengeAxis.SPORT]: '🏃',
  [ChallengeAxis.NUTRITION]: '🥗',
  [ChallengeAxis.LECTURE]: '📚',
  [ChallengeAxis.FORMATION]: '🎓',
  [ChallengeAxis.MEDITATION]: '🧘',
  [ChallengeAxis.FINANCE]: '💰',
  [ChallengeAxis.AUTRE]: '✨',
}

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour {user?.email} 👋
          </h1>
          <p className="text-sm text-gray-500">
            Choisis un axe pour lancer ton prochain challenge.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Se déconnecter
        </button>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Object.values(ChallengeAxis).map((axis) => (
          <div
            key={axis}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm transition hover:border-primary-500 hover:shadow"
          >
            <div className="text-3xl">{AXIS_EMOJI[axis]}</div>
            <div className="mt-2 text-sm font-medium text-gray-800">
              {CHALLENGE_AXIS_LABELS[axis]}
            </div>
          </div>
        ))}
      </section>

      <p className="mt-8 text-center text-xs text-gray-400">
        (Bientôt : création et suivi de challenges par axe.)
      </p>
    </div>
  )
}
