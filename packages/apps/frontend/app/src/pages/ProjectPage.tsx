import {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChallengeAxis, CHALLENGE_AXIS_LABELS } from '@naht/shared'
import { useAuth } from '../contexts/AuthContext'

const AgendaCalendar = lazy(() =>
  import('../components/AgendaCalendar').then((m) => ({
    default: m.AgendaCalendar,
  })),
)
import {
  getProject,
  inviteLink,
  type FamilyProject,
} from '../lib/familyProjects'
import {
  listMembers,
  listChallenges,
  createChallenge,
  resolveChallenge,
  type Challenge,
  type ProjectMember,
} from '../lib/challenges'
import {
  listEncouragements,
  sendEncouragement,
  type Encouragement,
} from '../lib/encouragements'

const ENCOURAGEMENT_PRESETS = ['Bravo 👏', 'Continue 💪', 'Fier de toi 🙌']

const STATUS_ICON = { success: '✅', failed: '❌', pending: '⏳' } as const

export function ProjectPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const me = user?.id ?? ''

  const [project, setProject] = useState<FamilyProject | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [encouragements, setEncouragements] = useState<Encouragement[]>([])
  const [loading, setLoading] = useState(true)
  const [encFor, setEncFor] = useState<string | null>(null)
  const [encMsg, setEncMsg] = useState('')

  const [assignedTo, setAssignedTo] = useState('')
  const [axis, setAxis] = useState<ChallengeAxis>(ChallengeAxis.SPORT)
  const [title, setTitle] = useState('')
  const [openMember, setOpenMember] = useState<string | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)

  async function reload() {
    const [c, m] = await Promise.all([listChallenges(id), listMembers(id)])
    const encs = await listEncouragements(c.map((x) => x.id))
    setChallenges(c)
    setMembers(m)
    setEncouragements(encs)
  }

  useEffect(() => {
    getProject(id)
      .then(async (p) => {
        setProject(p)
        setAssignedTo(me)
        await reload()
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, me])

  const emailOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.user_id, m.email]))
    return (uid: string) => map.get(uid) ?? '—'
  }, [members])

  const encByChallenge = useMemo(() => {
    const map = new Map<string, Encouragement[]>()
    for (const e of encouragements) {
      const list = map.get(e.challenge_id) ?? []
      list.push(e)
      map.set(e.challenge_id, list)
    }
    return map
  }, [encouragements])

  const myPending = challenges.filter(
    (c) => c.assigned_to === me && c.status === 'pending',
  )
  const feed = challenges.filter((c) => c.status !== 'pending')

  async function sendEnc(challengeId: string, message: string) {
    const text = message.trim()
    if (!text) return
    try {
      await sendEncouragement(challengeId, text)
      setEncMsg('')
      setEncFor(null)
      await reload()
      toast.success('Encouragement envoyé 💪')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createChallenge({ projectId: id, assignedTo, title: title.trim(), axis })
      setTitle('')
      await reload()
      toast.success(assignedTo === me ? 'Challenge ajouté à ton agenda' : 'Membre challengé 💪')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  async function resolve(c: Challenge, status: 'success' | 'failed') {
    try {
      await resolveChallenge(c.id, status)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Chargement…</div>
  }
  if (!project) {
    return <div className="p-10 text-center text-gray-500">Projet introuvable.</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
        ← Mes projets
      </Link>

      <header className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <button
          onClick={() => {
            navigator.clipboard.writeText(inviteLink(project.invite_code))
            toast.success("Lien d'invitation copié")
          }}
          className="rounded-lg border border-primary-500 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
        >
          Inviter un membre
        </button>
      </header>

      <form
        onSubmit={handleCreate}
        className="mt-6 space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-gray-800">Lancer un challenge</h2>
        <input
          type="text"
          required
          maxLength={140}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex : courir 5 km, lire 20 pages…"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="flex gap-2">
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            <option value={me}>Moi-même</option>
            {members
              .filter((m) => m.user_id !== me)
              .map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.email}
                </option>
              ))}
          </select>
          <select
            value={axis}
            onChange={(e) => setAxis(e.target.value as ChallengeAxis)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
          >
            {Object.values(ChallengeAxis).map((a) => (
              <option key={a} value={a}>
                {CHALLENGE_AXIS_LABELS[a]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            Défier
          </button>
        </div>
      </form>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800">Mon agenda</h2>
          <button
            onClick={() => setShowCalendar((v) => !v)}
            className="rounded-lg border border-primary-500 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
          >
            📅 {showCalendar ? 'Vue liste' : 'Remplir mon agenda'}
          </button>
        </div>

        {showCalendar && (
          <div className="mt-3">
            <Suspense
              fallback={
                <p className="text-sm text-gray-400">Chargement du calendrier…</p>
              }
            >
              <AgendaCalendar
                projectId={id}
                me={me}
                challenges={challenges}
                onChanged={reload}
              />
            </Suspense>
          </div>
        )}

        <div className="mt-2 space-y-2">
          {myPending.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun challenge en cours.</p>
          ) : (
            myPending.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3"
              >
                <span className="text-sm text-gray-800">
                  {c.title}{' '}
                  <span className="text-xs text-gray-400">
                    · {CHALLENGE_AXIS_LABELS[c.axis as ChallengeAxis] ?? c.axis}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button
                    onClick={() => resolve(c, 'success')}
                    className="rounded-lg bg-green-50 px-2 py-1 text-sm text-green-700 hover:bg-green-100"
                  >
                    ✅ Réussi
                  </button>
                  <button
                    onClick={() => resolve(c, 'failed')}
                    className="rounded-lg bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100"
                  >
                    ❌ Échoué
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-800">Membres</h2>
        <div className="mt-2 space-y-2">
          {members.map((m) => {
            const pending = challenges.filter(
              (c) => c.assigned_to === m.user_id && c.status === 'pending',
            )
            const open = openMember === m.user_id
            return (
              <div key={m.user_id} className="rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenMember(open ? null : m.user_id)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <span className="text-sm text-gray-800">
                    {m.user_id === me ? 'Toi' : m.email}
                    {m.role === 'owner' && (
                      <span className="ml-2 text-xs text-gray-400">créateur</span>
                    )}
                  </span>
                  <span className="text-xs text-gray-400">
                    {pending.length} en cours · voir l'agenda
                  </span>
                </button>
                {open && (
                  <div className="border-t border-gray-100 p-3">
                    {pending.length === 0 ? (
                      <p className="text-sm text-gray-400">Agenda vide.</p>
                    ) : (
                      pending.map((c) => (
                        <div key={c.id} className="text-sm text-gray-700">
                          ⏳ {c.title}{' '}
                          <span className="text-xs text-gray-400">
                            · {CHALLENGE_AXIS_LABELS[c.axis as ChallengeAxis] ?? c.axis}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-800">Fil d'actualité</h2>
        <div className="mt-2 space-y-2">
          {feed.length === 0 ? (
            <p className="text-sm text-gray-400">
              Rien pour l'instant — les succès et échecs des membres s'afficheront ici.
            </p>
          ) : (
            feed.map((c) => {
              const encs = encByChallenge.get(c.id) ?? []
              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700"
                >
                  <div>
                    {STATUS_ICON[c.status]}{' '}
                    <span className="font-medium">
                      {c.assigned_to === me ? 'Toi' : emailOf(c.assigned_to)}
                    </span>{' '}
                    {c.status === 'success' ? 'a réussi' : 'a échoué'} : {c.title}
                    <span className="text-xs text-gray-400">
                      {' '}
                      · {CHALLENGE_AXIS_LABELS[c.axis as ChallengeAxis] ?? c.axis}
                    </span>
                  </div>

                  {(encs.length > 0 || c.assigned_to !== me) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {encs.map((e) => (
                        <span
                          key={e.id}
                          className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
                        >
                          💪 {e.message}
                          <span className="text-amber-500">
                            {' '}
                            · {e.from_user === me ? 'toi' : emailOf(e.from_user)}
                          </span>
                        </span>
                      ))}
                      {c.assigned_to !== me && (
                        <button
                          onClick={() =>
                            setEncFor(encFor === c.id ? null : c.id)
                          }
                          className="text-xs font-medium text-primary-600 hover:underline"
                        >
                          Encourager
                        </button>
                      )}
                    </div>
                  )}

                  {encFor === c.id && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {ENCOURAGEMENT_PRESETS.map((p) => (
                        <button
                          key={p}
                          onClick={() => sendEnc(c.id, p)}
                          className="rounded-full border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                        >
                          {p}
                        </button>
                      ))}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          sendEnc(c.id, encMsg)
                        }}
                        className="flex gap-1"
                      >
                        <input
                          value={encMsg}
                          onChange={(e) => setEncMsg(e.target.value)}
                          maxLength={280}
                          placeholder="Ton mot d'encouragement…"
                          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-primary-600 px-2 py-1 text-xs font-medium text-white hover:bg-primary-700"
                        >
                          Envoyer
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
