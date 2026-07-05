import { MagicLinkForm } from '../components/MagicLinkForm'

export function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">naht</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connecte-toi ou crée ton compte en un instant.
        </p>
        <div className="mt-6">
          <MagicLinkForm />
        </div>
      </div>
    </div>
  )
}
