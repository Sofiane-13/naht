import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ChallengeAxis, CHALLENGE_AXIS_LABELS } from '@naht/shared'
import { useAuth } from '../contexts/AuthContext'
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

const STATUS_ICON = { success: '✅', failed: '❌', pending: '⏳' } as const

export function ProjectPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const me = user?.id ?? ''

  const [project, setProject] = useState<FamilyProject | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  const [assignedTo, setAssignedTo] = useState('')
  const [axis, setAxis] = useState<ChallengeAxis>(ChallengeAxis.SPORT)
  const [title, setTitle] = useState('')
  const [openMember, setOpenMember] = useState<string | null>(null)

  async function reload() {
    const [c, m] = await Promise.all([listChallenges(id), listMembers(id)])
    setChallenges(c)
    setMembers(m)
  }

  useEffect(() => {
    Promise.all([getProject(id), listChallenges(id), listMembers(id)])
      .then(([p, c, m]) => {
        setProject(p)
        setChallenges(c)
        setMembers(m)
        setAssignedTo(me)
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [id, me])

  const emailOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.user_id, m.email]))
    return (uid: string) => map.get(uid) ?? '—'
  }, [members])

  const myPending = challenges.filter(
    (c) => c.assigned_to === me && c.status === 'pending',
  )
  const feed = challenges.filter((c) => c.status !== 'pending')

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
        <h2 className="text-sm font-semibold text-gray-800">Mon agenda</h2>
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
            feed.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700"
              >
                {STATUS_ICON[c.status]}{' '}
                <span className="font-medium">
                  {c.assigned_to === me ? 'Toi' : emailOf(c.assigned_to)}
                </span>{' '}
                {c.status === 'success' ? 'a réussi' : 'a échoué'} :{' '}
                {c.title}
                <span className="text-xs text-gray-400">
                  {' '}
                  · {CHALLENGE_AXIS_LABELS[c.axis as ChallengeAxis] ?? c.axis}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
