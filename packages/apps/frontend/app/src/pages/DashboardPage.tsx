import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  listProjects,
  createProject,
  inviteLink,
  type FamilyProject,
} from '../lib/familyProjects'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const [projects, setProjects] = useState<FamilyProject[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Erreur'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const project = await createProject(name.trim())
      setProjects((prev) => [...prev, project])
      setName('')
      toast.success('Projet créé 🎉')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  async function copyLink(project: FamilyProject) {
    await navigator.clipboard.writeText(inviteLink(project.invite_code))
    toast.success("Lien d'invitation copié")
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes projets famille</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Se déconnecter
        </button>
      </header>

      <form onSubmit={handleCreate} className="mt-8 flex gap-2">
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom du projet famille"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60"
        >
          {creating ? 'Création…' : 'Créer'}
        </button>
      </form>

      <section className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Chargement…</p>
        ) : projects.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            Aucun projet pour l'instant. Crée ton premier projet famille ci-dessus.
          </p>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div>
                <div className="font-medium text-gray-900">{project.name}</div>
                <div className="text-xs text-gray-400">
                  {project.owner_id === user?.id ? 'Créé par toi' : 'Membre'}
                </div>
              </div>
              <button
                onClick={() => copyLink(project)}
                className="rounded-lg border border-primary-500 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                Copier le lien d'invitation
              </button>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
