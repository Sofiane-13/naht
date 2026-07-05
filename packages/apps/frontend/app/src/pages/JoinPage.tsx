import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { MagicLinkForm } from '../components/MagicLinkForm'
import { joinProject } from '../lib/familyProjects'

export function JoinPage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const joined = useRef(false)

  useEffect(() => {
    if (loading || !user || joined.current) return
    joined.current = true
    joinProject(code)
      .then((project) => {
        toast.success(`Tu as rejoint « ${project.name} » 🎉`)
        navigate('/', { replace: true })
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Invitation invalide'))
  }, [loading, user, code, navigate])

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900">Rejoindre un projet</h1>

        {loading ? (
          <p className="mt-6 text-sm text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="mt-6 text-sm text-red-600">{error}</p>
        ) : user ? (
          <p className="mt-6 text-sm text-gray-500">Ajout au projet…</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-500">
              Connecte-toi pour rejoindre le projet famille qui t'a été partagé.
            </p>
            <div className="mt-6 text-left">
              <MagicLinkForm redirectTo={window.location.href} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
